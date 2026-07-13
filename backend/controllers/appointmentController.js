const db = require('../config/db');
const { decrypt } = require('../utils/encryption');

// Doctor verifica o rechaza comprobante de pago
exports.verifyPaymentProof = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const { id } = req.params; // appointmentId
        const { approved } = req.body;
        
        const isApproved = approved === true || approved === 'true';

        // Verificar que la cita exista
        const [appt] = await db.query('SELECT id, doctor_id, status FROM appointments WHERE id = ?', [id]);
        if (!appt.length) return res.status(404).json({ message: 'Cita no encontrada.' });

        // Si es doctor, verificar que la cita le pertenezca
        if (userRole === 'doctor') {
            const [doctor] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
            if (!doctor.length || doctor[0].id !== appt[0].doctor_id) {
                return res.status(403).json({ message: 'No tienes permisos para gestionar el pago de esta cita.' });
            }
        } else if (!['admin', 'supervisor'].includes(userRole)) {
            return res.status(403).json({ message: 'No tienes permisos para verificar pagos.' });
        }

        if (isApproved) {
            await db.query(
                `UPDATE appointments 
                 SET payment_status = 'paid', 
                     status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END 
                 WHERE id = ?`, 
                [id]
            );
            return res.status(200).json({ message: 'Pago verificado correctamente y cita confirmada.' });
        } else {
            await db.query(
                `UPDATE appointments 
                 SET payment_status = 'rejected', 
                     payment_proof_url = NULL 
                 WHERE id = ?`, 
                [id]
            );
            return res.status(200).json({ message: 'Comprobante rechazado. El paciente podrá volver a subirlo.' });
        }
    } catch (error) {
        console.error('Error al verificar comprobante de pago:', error);
        res.status(500).json({ message: 'Error interno al verificar comprobante: ' + (error.message || '') });
    }
};
// Subir comprobante de pago (PDF/imagen) para una cita
exports.uploadPaymentProof = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params; // appointmentId
        const { proof_url, reference, payment_method } = req.body;
        if (!proof_url) return res.status(400).json({ message: 'Falta la URL del comprobante.' });

        // Verificar que la cita pertenezca al paciente logueado
        const [patient] = await db.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
        if (!patient.length) return res.status(404).json({ message: 'Paciente no encontrado.' });
        const patientId = patient[0].id;
        const [appt] = await db.query('SELECT id FROM appointments WHERE id = ? AND patient_id = ?', [id, patientId]);
        if (!appt.length) return res.status(404).json({ message: 'Cita no encontrada o no tienes permisos.' });

        // Guardar comprobante, referencia y opcionalmente actualizar método de pago
        await db.query(
            `UPDATE appointments 
             SET payment_proof_url = ?, 
                 payment_reference = ?,
                 payment_method = COALESCE(?, payment_method)
             WHERE id = ?`, 
            [proof_url, reference || null, payment_method || null, id]
        );
        res.status(200).json({ message: 'Comprobante de pago subido correctamente.' });
    } catch (error) {
        console.error('Error al subir comprobante de pago:', error);
        res.status(500).json({ message: 'Error interno al subir comprobante.' });
    }
};

// Resumen completo para el Dashboard del Doctor
exports.getDoctorDashboardSummary = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 1. Obtener el ID del doctor y su estado de bloqueo
        const [doctor] = await db.query('SELECT id, is_blocked, emergency_block_until FROM doctors WHERE user_id = ?', [userId]);
        if (doctor.length === 0) return res.status(404).json({ message: 'Perfil no encontrado.' });
        const doctorId = doctor[0].id;

        // 2. Solicitudes Pendientes (las que el doctor debe aprobar)
        const [pending] = await db.query(`
            SELECT a.id, a.appointment_date, a.start_time, a.type, a.payment_proof_url, a.payment_status, u.full_name AS patient_name 
            FROM appointments a 
            JOIN patients p ON a.patient_id = p.id 
            JOIN users u ON p.user_id = u.id
            WHERE a.doctor_id = ? AND a.status = 'pending' 
            ORDER BY a.appointment_date ASC LIMIT 5
        `, [doctorId]);

        // 2b. Próximas citas confirmadas
        const [upcoming] = await db.query(`
            SELECT a.id, a.appointment_date, a.start_time, a.type, a.payment_proof_url, a.payment_status, a.status, u.full_name AS patient_name 
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
            isBlocked: doctor[0].is_blocked === 1,
            emergencyBlockUntil: doctor[0].emergency_block_until
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
                a.payment_method, a.payment_status, a.payment_reference, a.payment_proof_url, a.consultation_fee_snapshot,
                i.pdf_path AS invoice_pdf,
                u.full_name AS patient_name, u.email AS patient_email,
                p.date_of_birth, p.gender, p.phone,
                c.name AS clinic_name,
                COALESCE(dc.custom_address, c.default_address) AS clinic_address
            FROM appointments a
            LEFT JOIN invoices i ON a.id = i.appointment_id
            JOIN patients p ON a.patient_id = p.id
            JOIN users u ON p.user_id = u.id
            LEFT JOIN clinics c ON a.clinic_id = c.id
            LEFT JOIN doctor_clinics dc ON dc.clinic_id = a.clinic_id AND dc.doctor_id = a.doctor_id
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

        if (status === 'completed') {
            const [appointmentRows] = await db.query(
                'SELECT type, payment_method, payment_status FROM appointments WHERE id = ? AND doctor_id = ?',
                [id, doctorId]
            );
            if (appointmentRows.length === 0) {
                return res.status(404).json({ message: 'Cita no encontrada o no tienes permisos.' });
            }

            const appointment = appointmentRows[0];
            if (appointment.type === 'presencial' && appointment.payment_method === 'in_person' && appointment.payment_status !== 'paid') {
                return res.status(409).json({
                    message: 'No puedes cerrar una cita presencial sin confirmar primero el pago recibido en consultorio.'
                });
            }
        }

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

        // Página actual con JOIN a doctores/usuarios y clínicas
        const [appointments] = await db.query(`
            SELECT 
                a.*,
                a.id AS appointment_id,
                i.pdf_path AS invoice_pdf,
                u.full_name AS doctor_name,
                d.id AS doctor_id,
                d.specialty,
                d.profile_picture,
                d.emergency_block_until,
                c.name AS clinic_name,
                COALESCE(dc.custom_address, c.default_address) AS clinic_address
            FROM appointments a
            LEFT JOIN invoices i ON a.id = i.appointment_id
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users u ON d.user_id = u.id
            LEFT JOIN clinics c ON a.clinic_id = c.id
            LEFT JOIN doctor_clinics dc ON dc.clinic_id = a.clinic_id AND dc.doctor_id = a.doctor_id
            WHERE a.patient_id = ?
            ORDER BY a.appointment_date DESC, a.start_time DESC
            LIMIT ? OFFSET ?
        `, [patientId, limit, offset]);

        const processedAppointments = appointments.map(app => {
            let is_long_term_block = false;
            if (app.emergency_block_until) {
                const blockUntil = new Date(app.emergency_block_until);
                const twoWeeksFromNow = new Date();
                twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
                if (blockUntil > twoWeeksFromNow) {
                    is_long_term_block = true;
                }
            }
            return { ...app, is_long_term_block };
        });

        res.status(200).json({
            data: processedAppointments,
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

        // 1. Datos de la cita + paciente (con clínicas)
        const [apptRows] = await db.query(`
            SELECT
                a.id AS appointment_id,
                a.appointment_date,
                a.start_time,
                a.type,
                a.status,
                a.payment_method,
                a.payment_status,
                a.payment_reference,
                a.payment_proof_url,
                a.consultation_fee_snapshot,
                i.pdf_path AS invoice_pdf,
                p.id AS patient_id,
                p.date_of_birth,
                p.gender,
                p.phone,
                u.full_name AS patient_name,
                u.email AS patient_email,
                c.name AS clinic_name,
                COALESCE(dc.custom_address, c.default_address) AS clinic_address
            FROM appointments a
            LEFT JOIN invoices i ON a.id = i.appointment_id
            JOIN patients p ON a.patient_id = p.id
            JOIN users u ON p.user_id = u.id
            LEFT JOIN clinics c ON a.clinic_id = c.id
            LEFT JOIN doctor_clinics dc ON dc.clinic_id = a.clinic_id AND dc.doctor_id = a.doctor_id
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

// ── Sprint 27: Sala de Espera Virtual ─────────────────────────────────────────

// GET /api/appointments/:id/room-status
exports.getRoomStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(
            'SELECT doctor_ready, type, payment_status, payment_method, status FROM appointments WHERE id = ?',
            [id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Cita no encontrada.' });
        const appt = rows[0];

        if (appt.status === 'completed') {
            return res.status(400).json({ message: 'La consulta ya ha finalizado.', isCompleted: true });
        }

        if (appt.type === 'virtual' && appt.payment_method !== 'in_person' && appt.payment_status !== 'paid') {
            return res.status(400).json({ message: 'No se puede consultar la sala sin verificar primero el pago de la consulta.' });
        }

        res.status(200).json({ doctorReady: appt.doctor_ready === 1 });
    } catch (error) {
        console.error('Error en getRoomStatus:', error.message);
        res.status(500).json({ message: 'Error interno.' });
    }
};

// PATCH /api/appointments/:id/doctor-ready
// Doctor activa la sala al entrar al VideoRoom
exports.setDoctorReady = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [doctorRows] = await db.query(
            'SELECT id FROM doctors WHERE user_id = ?', [userId]
        );
        if (doctorRows.length === 0) return res.status(403).json({ message: 'Perfil no encontrado.' });
        const doctorId = doctorRows[0].id;

        // Verificar que la cita esté pagada
        const [apptRows] = await db.query(
            'SELECT type, payment_status, payment_method FROM appointments WHERE id = ? AND doctor_id = ?',
            [id, doctorId]
        );
        if (apptRows.length === 0) return res.status(404).json({ message: 'Cita no encontrada.' });
        const appt = apptRows[0];

        if (appt.type === 'virtual' && appt.payment_method !== 'in_person' && appt.payment_status !== 'paid') {
            return res.status(400).json({ message: 'No se puede iniciar el video chat sin verificar primero el pago de la consulta.' });
        }

        const [result] = await db.query(
            'UPDATE appointments SET doctor_ready = TRUE WHERE id = ? AND doctor_id = ?',
            [id, doctorId]
        );
        if (result.affectedRows === 0) return res.status(403).json({ message: 'Sin acceso.' });

        res.status(200).json({ message: 'Sala activada.' });
    } catch (error) {
        console.error('Error en setDoctorReady:', error.message);
        res.status(500).json({ message: 'Error interno.' });
    }
};

// PATCH /api/appointments/:id/doctor-not-ready
// Doctor desactiva la sala al salir del VideoRoom
exports.setDoctorNotReady = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [doctorRows] = await db.query(
            'SELECT id FROM doctors WHERE user_id = ?', [userId]
        );
        if (doctorRows.length === 0) return res.status(403).json({ message: 'Perfil no encontrado.' });
        const doctorId = doctorRows[0].id;

        const [result] = await db.query(
            'UPDATE appointments SET doctor_ready = FALSE WHERE id = ? AND doctor_id = ?',
            [id, doctorId]
        );
        if (result.affectedRows === 0) return res.status(403).json({ message: 'Sin acceso.' });

        res.status(200).json({ message: 'Sala desactivada.' });
    } catch (error) {
        console.error('Error en setDoctorNotReady:', error.message);
        res.status(500).json({ message: 'Error interno.' });
    }
};

// Permite al paciente cancelar su cita (con regla de 24 horas)
exports.cancelAppointmentByPatient = async (req, res) => {
    const userId = req.user.id; // Viene del token JWT
    const appointmentId = req.params.id;

    try {
        // 1. Buscar la cita y verificar que pertenezca al paciente asociado a este usuario
        const [patientRows] = await db.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
        if (patientRows.length === 0) return res.status(403).json({ message: "No se encontró tu perfil de paciente." });
        const patientId = patientRows[0].id;

        const [appRes] = await db.query(
            `SELECT a.* FROM appointments a WHERE a.id = ? AND a.patient_id = ?`,
            [appointmentId, patientId]
        );

        if (appRes.length === 0) {
            return res.status(404).json({ message: "Cita no encontrada o acceso denegado." });
        }

        const appointment = appRes[0];

        // 2. Verificar el estado actual (No puedes cancelar algo ya completado o cancelado)
        // Añadimos 'emergency_reschedule' para dejarles borrar alertas del dashboard
        const validStatuses = ['scheduled', 'pending', 'confirmed', 'emergency_reschedule'];
        if (!validStatuses.includes(appointment.status)) {
            return res.status(400).json({ message: `No puedes cancelar una cita en estado: ${appointment.status}` });
        }

        // 3. Regla de Negocio: Validar que falten más de 24 horas para la cita
        // Excepción: Si es una emergencia del médico, se puede descartar ya mismo.
        if (appointment.status !== 'emergency_reschedule') {
            const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.start_time}`);
            const now = new Date();
            const diffInHours = (appointmentDateTime - now) / (1000 * 60 * 60);

            if (diffInHours < 24 && diffInHours > 0) {
                return res.status(403).json({ 
                    message: "Faltan menos de 24 horas para tu consulta. Por políticas de la clínica, debes contactar a soporte para cancelar." 
                });
            }
        }

        // 4. Ejecutar la cancelación
        // Omitimos actualizar la columna 'notes' ya que actualmente el esquema no posee la columna notes en appointments.
        await db.query(`UPDATE appointments SET status = 'cancelled' WHERE id = ?`, [appointmentId]);

        res.status(200).json({ message: "Cita cancelada exitosamente." });

    } catch (error) {
        console.error("Error al cancelar cita por el paciente:", error);
        res.status(500).json({ message: "Error interno al cancelar la cita." });
    }
};

exports.getZegoConfig = async (req, res) => {
    let appID = process.env.VITE_ZEGO_APP_ID || process.env.ZEGO_APP_ID;
    let serverSecret = process.env.VITE_ZEGO_SERVER_SECRET || process.env.ZEGO_SERVER_SECRET;

    try {
        const [rows] = await db.query('SELECT zego_app_id, zego_server_secret FROM system_settings LIMIT 1');
        if (rows && rows[0]) {
            if (rows[0].zego_app_id) appID = rows[0].zego_app_id;
            if (rows[0].zego_server_secret) {
                const dec = decrypt(rows[0].zego_server_secret);
                if (dec) serverSecret = dec;
            }
        }
    } catch (e) {
        console.warn("⚠️ Columnas Zego aún no migradas en la BD, usando variables de entorno de Vercel/Railway.");
    }

    res.status(200).json({
        appID: appID ? Number(appID) : null,
        serverSecret: serverSecret || null
    });
};

// POST /api/appointments/send-reminders
// Trigger automático o HTTP para enviar recordatorios de citas
exports.runReminderCron = async (req, res) => {
    const cronToken = req.headers['x-cron-token'] || req.query.token;
    const expectedToken = process.env.CRON_SECRET || 'mindpath_secret_cron_123';
    if (process.env.CRON_SECRET && cronToken !== expectedToken) {
        return res.status(401).json({ message: 'No autorizado' });
    }
    const { sendAppointmentReminderEmail } = require('../utils/emailService');

    try {
        const [settings] = await db.query('SELECT appointment_reminder_offset_minutes FROM system_settings LIMIT 1');
        const offsetMins = (settings && settings[0] && settings[0].appointment_reminder_offset_minutes !== undefined)
            ? Number(settings[0].appointment_reminder_offset_minutes)
            : 90;

        console.log(`--- Iniciando tarea de envío de recordatorios (Antelación configurada: ${offsetMins} min) ---`);
        let totalSentReminders = 0;

        const getCaracasTodayStr = () => {
            const now = new Date();
            const caracasTime = new Date(now.getTime() - (4 * 60 * 60 * 1000));
            const year = caracasTime.getUTCFullYear();
            const month = String(caracasTime.getUTCMonth() + 1).padStart(2, '0');
            const day = String(caracasTime.getUTCDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const todayStr = getCaracasTodayStr();

        // Citas programadas para hoy y mañana que no tengan enviado el recordatorio de 90 min / configurable
        const [appts] = await db.query(`
            SELECT 
                a.id, a.appointment_date, a.start_time, a.type,
                p_u.email AS patient_email, p_u.full_name AS patient_name,
                p_u.phone AS patient_phone,
                d_u.full_name AS doctor_name, d.specialty AS doctor_specialty,
                c.name AS clinic_name, c.default_address AS clinic_address,
                dc.custom_address AS custom_clinic_address,
                a.consultation_fee_snapshot, a.payment_method, a.payment_status
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN users p_u ON p.user_id = p_u.id
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users d_u ON d.user_id = d_u.id
            LEFT JOIN clinics c ON a.clinic_id = c.id
            LEFT JOIN doctor_clinics dc ON dc.clinic_id = a.clinic_id AND dc.doctor_id = a.doctor_id
            WHERE a.status IN ('confirmed', 'scheduled', 'pending')
              AND (a.reminder_90min_sent = 0 OR a.reminder_90min_sent IS NULL)
              AND a.appointment_date BETWEEN ? AND (? + INTERVAL 1 DAY)
        `, [todayStr, todayStr]);

        for (const appt of appts) {
            const datePart = appt.appointment_date;
            let dateStr = "";
            if (datePart instanceof Date) {
                const year = datePart.getFullYear();
                const month = String(datePart.getMonth() + 1).padStart(2, '0');
                const day = String(datePart.getDate()).padStart(2, '0');
                dateStr = `${year}-${month}-${day}`;
            } else {
                dateStr = String(datePart).substring(0, 10);
            }
            
            const apptDateTimeUTC = new Date(`${dateStr}T${appt.start_time}-04:00`);
            const nowUTC = new Date();
            const diffMs = apptDateTimeUTC.getTime() - nowUTC.getTime();
            const diffMins = diffMs / 60000;

            // Si faltan entre 0 y el offset configurado + 5 minutos
            if (diffMins > 0 && diffMins <= (offsetMins + 5)) {
                try {
                    await sendAppointmentReminderEmail(appt.patient_email, appt.patient_name, appt, 'reminder_offset');
                    await db.query('UPDATE appointments SET reminder_90min_sent = 1 WHERE id = ?', [appt.id]);
                    totalSentReminders++;
                } catch (err) {
                    console.error(`Error enviando recordatorio para cita ${appt.id}:`, err.message);
                }
            }
        }

        console.log(`--- Tarea finalizada. Recordatorios de ${offsetMins} min enviados: ${totalSentReminders} ---`);
        res.status(200).json({
            ok: true,
            sent_reminders: totalSentReminders
        });
    } catch (error) {
        console.error('Error en runReminderCron:', error);
        res.status(500).json({ message: 'Error interno al procesar los recordatorios.' });
    }
};
