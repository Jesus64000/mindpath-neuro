const db = require('../config/db');

// Resumen completo para el Dashboard del Doctor
exports.getDoctorDashboardSummary = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 1. Obtener el ID del doctor y su estado de bloqueo
        const [doctor] = await db.query('SELECT id, is_blocked FROM doctors WHERE user_id = ?', [userId]);
        if (doctor.length === 0) return res.status(404).json({ message: 'Perfil no encontrado.' });
        const doctorId = doctor[0].id;

        // 2. Solicitudes Pendientes (las que el doctor debe aprobar)
        const [pending] = await db.query(`
            SELECT a.id, a.appointment_date, a.start_time, a.type, u.full_name AS patient_name 
            FROM appointments a 
            JOIN patients p ON a.patient_id = p.id 
            JOIN users u ON p.user_id = u.id
            WHERE a.doctor_id = ? AND a.status = 'pending' 
            ORDER BY a.appointment_date ASC LIMIT 5
        `, [doctorId]);

        // 2b. Próximas citas confirmadas
        const [upcoming] = await db.query(`
            SELECT a.id, a.appointment_date, a.start_time, a.type, u.full_name AS patient_name 
            FROM appointments a 
            JOIN patients p ON a.patient_id = p.id 
            JOIN users u ON p.user_id = u.id
            WHERE a.doctor_id = ? AND a.status = 'confirmed' AND a.appointment_date >= CURDATE()
            ORDER BY a.appointment_date ASC, a.start_time ASC
            LIMIT 5
        `, [doctorId]);

        // 3. Citas del mes (para marcar puntos en el calendario)
        const [calendar] = await db.query(`
            SELECT appointment_date, COUNT(*) as count 
            FROM appointments 
            WHERE doctor_id = ? AND status = 'confirmed'
            GROUP BY appointment_date
        `, [doctorId]);

        // 4. Analytics: Pacientes nuevos vs recurrentes
        const [analytics] = await db.query(`
            SELECT 
                SUM(CASE WHEN counts.total = 1 THEN 1 ELSE 0 END) as new_patients,
                SUM(CASE WHEN counts.total > 1 THEN 1 ELSE 0 END) as recurrent_patients
            FROM (SELECT COUNT(*) as total FROM appointments WHERE doctor_id = ? GROUP BY patient_id) as counts
        `, [doctorId]);

        const safeAnalytics = analytics && analytics.length > 0 ? analytics[0] : { new_patients: 0, recurrent_patients: 0 };

        res.status(200).json({
            pending,
            upcoming,
            calendar,
            stats: {
                totalPatients: (safeAnalytics.new_patients || 0) + (safeAnalytics.recurrent_patients || 0),
                newVsRecurrent: {
                    new: safeAnalytics.new_patients || 0,
                    recurrent: safeAnalytics.recurrent_patients || 0
                },
                avgPerWeek: (() => {
                    // Citas confirmadas/completadas en la semana actual (lun–dom)
                    const now = new Date();
                    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0=lun
                    const weekStart = new Date(now);
                    weekStart.setDate(now.getDate() - dayOfWeek);
                    weekStart.setHours(0, 0, 0, 0);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    weekEnd.setHours(23, 59, 59, 999);
                    const weekStartISO = weekStart.toISOString().slice(0, 10);
                    const weekEndISO   = weekEnd.toISOString().slice(0, 10);
                    const thisWeekTotal = calendar.reduce((sum, row) => {
                        if (row.appointment_date >= weekStartISO && row.appointment_date <= weekEndISO) {
                            return sum + Number(row.count);
                        }
                        return sum;
                    }, 0);
                    return thisWeekTotal;
                })()
            },
            isBlocked: doctor[0].is_blocked === 1
        });
    } catch (error) {
        console.error('Error cargando resumen del dashboard del doctor:', error);
        res.status(500).json({ message: 'Error cargando el Dashboard.' });
    }
};

// Obtener las citas del doctor logueado (Con Paginación y filtro opcional por fecha YYYY-MM-DD)
exports.getDoctorAppointments = async (req, res) => {
    try {
        const userId = req.user.id;

        // Paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const filterDate = req.query.date; // formato esperado: 'YYYY-MM-DD'

        // 1. Obtener el doctor_id real (porque req.user.id es de la tabla users)
        const [doctor] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
        if (doctor.length === 0) return res.status(404).json({ message: 'Perfil de doctor no encontrado.' });
        const doctorId = doctor[0].id;

        // 2. Contar el TOTAL de citas del doctor (respetando el filtro de fecha si llega)
        const countQuery = filterDate
            ? 'SELECT COUNT(*) as total FROM appointments WHERE doctor_id = ? AND appointment_date = ?'
            : 'SELECT COUNT(*) as total FROM appointments WHERE doctor_id = ?';
        const countParams = filterDate ? [doctorId, filterDate] : [doctorId];
        const [countResult] = await db.query(countQuery, countParams);
        const totalRecords = countResult[0].total;
        const totalPages = Math.ceil(totalRecords / limit);

        // 3. Traer las citas con los datos del paciente
        const dataQuery = `
            SELECT 
                a.id AS appointment_id, a.appointment_date, a.start_time, a.status, a.type,
                u.full_name AS patient_name, u.email AS patient_email,
                p.date_of_birth, p.gender, p.phone
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE a.doctor_id = ? ${filterDate ? 'AND a.appointment_date = ?' : ''}
            ORDER BY a.appointment_date ASC, a.start_time ASC
            LIMIT ? OFFSET ?
        `;
        const dataParams = filterDate ? [doctorId, filterDate, limit, offset] : [doctorId, limit, offset];
        const [appointments] = await db.query(dataQuery, dataParams);

        res.status(200).json({
            data: appointments,
            pagination: {
                currentPage: page,
                totalPages: totalPages === 0 ? 1 : totalPages,
                totalRecords
            }
        });

    } catch (error) {
        console.error('Error cargando citas del doctor:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Cambiar el estado de la cita (Confirmar / Cancelar / Completar)
exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params; // ID de la cita
        const { status } = req.body; // 'confirmed', 'cancelled', 'completed'
        const userId = req.user.id;

        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Estado no válido.' });
        }

        // Obtener el doctor_id real
        const [doctor] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
        if (doctor.length === 0) return res.status(403).json({ message: 'Acceso denegado.' });
        const doctorId = doctor[0].id;

        // Actualizar la cita (Asegurándonos de que esta cita le pertenece a este doctor)
        const [result] = await db.query(`
            UPDATE appointments 
            SET status = ? 
            WHERE id = ? AND doctor_id = ?
        `, [status, id, doctorId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cita no encontrada o no tienes permisos.' });
        }

        res.status(200).json({ message: `Cita actualizada a estado: ${status}` });

    } catch (error) {
        console.error('Error actualizando estado de la cita:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Alias para cumplir la interfaz solicitada en rutas
exports.updateStatus = exports.updateAppointmentStatus;

// Actualizar bandera de bloqueo de emergencia del doctor
exports.updateDoctorBlockStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { blocked } = req.body; // boolean esperado

        if (typeof blocked !== 'boolean') {
            return res.status(400).json({ message: 'El campo "blocked" debe ser boolean.' });
        }

        const [doctor] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
        if (doctor.length === 0) return res.status(404).json({ message: 'Perfil de doctor no encontrado.' });
        const doctorId = doctor[0].id;

        await db.query('UPDATE doctors SET is_blocked = ? WHERE id = ?', [blocked ? 1 : 0, doctorId]);

        res.status(200).json({ message: blocked ? 'Agenda bloqueada' : 'Agenda desbloqueada', isBlocked: blocked });
    } catch (error) {
        console.error('Error actualizando bloqueo de doctor:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// 3. Obtener citas del paciente logueado con paginación
exports.getPatientAppointments = async (req, res) => {
    try {
        const userId = req.user.id;

        // Paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const offset = (page - 1) * limit;

        // Obtener patient_id
        const [patient] = await db.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
        if (patient.length === 0) return res.status(404).json({ message: 'Paciente no encontrado.' });
        const patientId = patient[0].id;

        // Total de registros
        const [countResult] = await db.query(
            'SELECT COUNT(*) as total FROM appointments WHERE patient_id = ?',
            [patientId]
        );
        const totalRecords = countResult[0].total;
        const totalPages = Math.ceil(totalRecords / limit);

        // Página actual con JOIN a doctores/usuarios
        const [appointments] = await db.query(`
            SELECT 
                a.id AS appointment_id,
                a.appointment_date,
                a.start_time,
                a.status,
                a.type,
                u.full_name AS doctor_name,
                d.specialty,
                d.profile_picture
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users u ON d.user_id = u.id
            WHERE a.patient_id = ?
            ORDER BY a.appointment_date DESC, a.start_time DESC
            LIMIT ? OFFSET ?
        `, [patientId, limit, offset]);

        res.status(200).json({
            data: appointments,
            pagination: {
                currentPage: page,
                totalPages: totalPages === 0 ? 1 : totalPages,
                totalRecords
            }
        });
    } catch (error) {
        console.error('Error en getPatientAppointments:', error);
        res.status(500).json({ message: 'Error interno al obtener tus citas.' });
    }
};
// Detalle completo de una cita (para la pantalla pre-consulta del doctor)
exports.getAppointmentDetail = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const [doctorRows] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
        if (!doctorRows.length) return res.status(404).json({ message: 'Perfil de doctor no encontrado.' });
        const doctorId = doctorRows[0].id;

        // 1. Datos de la cita + paciente (solo columnas garantizadas)
        const [apptRows] = await db.query(`
            SELECT
                a.id AS appointment_id,
                a.appointment_date,
                a.start_time,
                a.type,
                a.status,
                p.id AS patient_id,
                p.date_of_birth,
                p.gender,
                p.phone,
                u.full_name AS patient_name,
                u.email AS patient_email
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE a.id = ? AND a.doctor_id = ?
        `, [id, doctorId]);

        if (!apptRows.length) return res.status(404).json({ message: 'Cita no encontrada.' });
        const appt = apptRows[0];

        // 2. Columnas opcionales (pueden no existir segun version de la BD)
        let extraPatientFields = { address: null, profile_picture: null, notes: null };
        try {
            const [extra] = await db.query(
                'SELECT address, profile_picture FROM patients WHERE id = ?',
                [appt.patient_id]
            );
            if (extra.length) extraPatientFields = { ...extraPatientFields, ...extra[0] };
        } catch (_) { /* columnas aun no migradas */ }

        // 3. Columnas opcionales de la cita (notas del paciente)
        try {
            const [apptExtra] = await db.query(
                'SELECT notes FROM appointments WHERE id = ?', [id]
            );
            if (apptExtra.length) extraPatientFields.notes = apptExtra[0].notes;
        } catch (_) { /* columna notes no existe aun */ }

        // 4. Historial de consultas anteriores del mismo paciente con este doctor
        let history = [];
        try {
            const [rows] = await db.query(`
                SELECT
                    a.id AS appt_id,
                    a.appointment_date,
                    a.start_time,
                    a.status,
                    a.type,
                    c.id AS consultation_id,
                    r.diagnostico,
                    r.tratamiento,
                    r.motivo_sintomas
                FROM appointments a
                LEFT JOIN consultations c ON a.id = c.appointment_id
                LEFT JOIN clinical_reports r ON c.id = r.consultation_id
                WHERE a.patient_id = ? AND a.doctor_id = ? AND a.id != ?
                ORDER BY a.appointment_date DESC
                LIMIT 5
            `, [appt.patient_id, doctorId, id]);
            history = rows;
        } catch (histErr) {
            console.warn('No se pudo cargar historial:', histErr.message);
        }

        // 5. Calcular edad
        const age = appt.date_of_birth
            ? Math.floor((Date.now() - new Date(appt.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
            : null;

        res.status(200).json({
            appointment: {
                ...appt,
                notes: extraPatientFields.notes
            },
            patient: {
                id:              appt.patient_id,
                full_name:       appt.patient_name,
                email:           appt.patient_email,
                phone:           appt.phone,
                address:         extraPatientFields.address,
                profile_picture: extraPatientFields.profile_picture,
                gender:          appt.gender,
                age
            },
            history
        });
    } catch (error) {
        console.error('Error en getAppointmentDetail:', error.message);
        res.status(500).json({ message: 'Error interno.', detail: error.message });
    }
};
