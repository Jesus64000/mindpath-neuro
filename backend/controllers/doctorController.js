const db = require('../config/db');

// Obtener todos los doctores verificados para el dashboard/paciente
exports.getAllDoctors = async (req, res) => {
    try {
        // Ajusta esta consulta a tu base de datos real
        const [doctors] = await db.query(`
            SELECT 
                d.id AS doctor_id,
                u.id AS user_id,
                u.full_name,
                d.specialty,
                d.profile_picture,
                d.bio,
                d.is_verified,
                ROUND(AVG(dr.rating), 1) AS avg_rating,
                COUNT(dr.id) AS rating_count
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            LEFT JOIN doctor_ratings dr ON dr.doctor_id = d.id
            WHERE u.role = 'doctor' AND d.is_verified = TRUE
            GROUP BY d.id, u.id, u.full_name, d.specialty, d.profile_picture, d.bio, d.is_verified
        `);

        res.status(200).json(doctors);
    } catch (error) {
        console.error("Error obteniendo doctores:", error);
        res.status(500).json({ message: 'Error interno del servidor al obtener especialistas.' });
    }
};

// Alias para mantener compatibilidad con código previo
exports.getSpecialists = exports.getAllDoctors;

// Catálogo público de especialidades
exports.getSpecialties = async (_req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name FROM specialties ORDER BY name ASC');
        res.status(200).json(rows);
    } catch (error) {
        // Si no existe la tabla aún, devolver lista hardcoded
        res.status(200).json([
            { id: 1, name: 'Neurología' }, { id: 2, name: 'Psiquiatría' },
            { id: 3, name: 'Psicología Clínica' }, { id: 4, name: 'Neuropsicología' },
            { id: 5, name: 'Medicina General' }
        ]);
    }
};

// Obtener el perfil público de un doctor por su ID
exports.getDoctorById = async (req, res) => {
    try {
        const { id } = req.params; // doctor_id

        const [doctor] = await db.query(`
            SELECT 
                d.id AS doctor_id, 
                u.id AS user_id, 
                u.full_name, 
                d.specialty, 
                d.profile_picture, 
                d.bio,
                d.license_number,
                d.experience_years,
                d.languages,
                d.education,
                d.clinic_name,
                d.clinic_address,
                d.consultation_fee
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            WHERE d.id = ? AND u.role = 'doctor' AND d.is_verified = TRUE
        `, [id]);

        if (doctor.length === 0) {
            return res.status(404).json({ message: 'Especialista no encontrado.' });
        }

        res.status(200).json(doctor[0]);
    } catch (error) {
        console.error('Error al obtener perfil del doctor:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Obtener pacientes únicos que han tenido citas con el doctor autenticado
exports.getMyPatients = async (req, res) => {
    try {
        const userId = req.user.id;
        const [doctor] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
        if (doctor.length === 0) return res.status(404).json({ message: 'Perfil de doctor no encontrado.' });
        const doctorId = doctor[0].id;

        const [patients] = await db.query(`
            SELECT DISTINCT p.id, u.full_name, u.email, p.phone, 
                (SELECT MAX(appointment_date) FROM appointments WHERE patient_id = p.id AND doctor_id = ?) as last_visit
            FROM patients p
            JOIN users u ON p.user_id = u.id
            JOIN appointments a ON a.patient_id = p.id
            WHERE a.doctor_id = ?
        `, [doctorId, doctorId]);

        res.status(200).json(patients);
    } catch (error) {
        console.error('Error al obtener pacientes del doctor:', error);
        res.status(500).json({ message: 'Error al obtener pacientes' });
    }
};

// Obtener expediente clínico completo de un paciente (vista del doctor)
exports.getPatientFile = async (req, res) => {
    try {
        const { patientId } = req.params;
        const userId = req.user.id;
        const [doctor] = await db.query('SELECT id, user_id FROM doctors WHERE user_id = ?', [userId]);
        if (doctor.length === 0) return res.status(404).json({ message: 'Perfil de doctor no encontrado.' });
        const doctorId = doctor[0].id;

        const [patientInfo] = await db.query(`
            SELECT u.full_name, u.email, p.* FROM patients p 
            JOIN users u ON p.user_id = u.id WHERE p.id = ?
        `, [patientId]);

        if (patientInfo.length === 0) return res.status(404).json({ message: 'Paciente no encontrado.' });

        // Campos opcionales (columnas que pueden no estar migradas aún)
        let extraFields = { address: null, profile_picture: null };
        try {
            const [extra] = await db.query(
                'SELECT address, profile_picture FROM patients WHERE id = ?', [patientId]
            );
            if (extra.length) extraFields = { ...extraFields, ...extra[0] };
        } catch (_) { /* no migradas aún */ }

        // Historial completo (consultas completadas)
        const [history] = await db.query(`
            SELECT 
                a.id AS appointment_id,
                a.appointment_date,
                a.type,
                a.status,
                r.motivo_sintomas,
                r.antecedentes,
                r.hallazgos,
                r.diagnostico,
                r.tratamiento,
                r.estudios_observaciones,
                r.private_notes
            FROM appointments a
            LEFT JOIN consultations c     ON a.id = c.appointment_id
            LEFT JOIN clinical_reports r  ON c.id = r.consultation_id
            WHERE a.patient_id = ? AND a.doctor_id = ? AND a.status = 'completed'
            ORDER BY a.appointment_date DESC
        `, [patientId, doctorId]);

        // Próximas citas (confirmed o pending, fecha futura o hoy)
        const [upcoming] = await db.query(`
            SELECT 
                a.id AS appointment_id,
                a.appointment_date,
                a.start_time,
                a.type,
                a.status
            FROM appointments a
            WHERE a.patient_id = ? AND a.doctor_id = ?
              AND a.status IN ('confirmed', 'pending')
              AND a.appointment_date >= CURDATE()
            ORDER BY a.appointment_date ASC, a.start_time ASC
            LIMIT 10
        `, [patientId, doctorId]);

        res.status(200).json({
            info: { ...patientInfo[0], ...extraFields },
            history,
            upcoming,
            doctorUserId: doctor[0].user_id
        });
    } catch (error) {
        console.error('Error al obtener expediente del paciente:', error);
        res.status(500).json({ message: 'Error al obtener expediente' });
    }
};


// Configurar horarios del doctor (sobrescribe y guarda nuevos)
exports.updateSchedule = async (req, res) => {
    try {
        const userId = req.user.id;
        const { schedules } = req.body; // [{ day, start, end, slotDuration?, isActive? }]

        if (!Array.isArray(schedules)) {
            return res.status(400).json({ message: 'Formato de horarios inválido.' });
        }

        const [doctor] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
        if (doctor.length === 0) return res.status(404).json({ message: 'Perfil de doctor no encontrado.' });
        const doctorId = doctor[0].id;

        // Limpiar y reinsertar
        await db.query('DELETE FROM doctor_schedules WHERE doctor_id = ?', [doctorId]);

        for (const s of schedules) {
            const slotDuration = s.slotDuration || s.slot_duration || 30;
            const isActive = typeof s.is_active === 'boolean' ? s.is_active : true;
            await db.query(
                'INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration, is_active) VALUES (?, ?, ?, ?, ?, ?)',
                [doctorId, s.day, s.start, s.end, slotDuration, isActive]
            );
        }

        res.status(200).json({ message: 'Horarios actualizados correctamente' });
    } catch (error) {
        console.error('Error al configurar horarios:', error);
        res.status(500).json({ message: 'Error al configurar horarios' });
    }
};

// Obtener datos del perfil para edición
exports.getProfileSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const [doctor] = await db.query(`
            SELECT u.full_name, u.email, d.specialty, d.bio, d.clinic_name,
                   d.clinic_address, d.license_number, d.experience_years,
                   d.consultation_fee, d.languages, d.education, d.profile_picture
            FROM doctors d 
            JOIN users u ON d.user_id = u.id 
            WHERE u.id = ?
        `, [userId]);

        if (!doctor || doctor.length === 0) {
            return res.status(404).json({ message: 'Perfil de doctor no encontrado' });
        }

        res.status(200).json(doctor[0]);
    } catch (error) {
        console.error('Error al cargar perfil del doctor', error);
        res.status(500).json({ message: 'Error al cargar perfil' });
    }
};

// Actualizar perfil profesional
exports.updateProfileSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            specialty, bio, clinic_name, clinic_address,
            license_number, experience_years, consultation_fee,
            languages, education, full_name
        } = req.body;

        await db.query(`
            UPDATE doctors SET 
                specialty = ?, bio = ?, clinic_name = ?, clinic_address = ?,
                license_number = ?, experience_years = ?, consultation_fee = ?,
                languages = ?, education = ?
            WHERE user_id = ?
        `, [specialty, bio, clinic_name, clinic_address, license_number,
            experience_years, consultation_fee, languages, education, userId]);

        // Actualizar nombre en tabla users si vino
        if (full_name) {
            await db.query('UPDATE users SET full_name = ? WHERE id = ?', [full_name, userId]);
        }

        res.status(200).json({ message: 'Perfil actualizado con éxito' });
    } catch (error) {
        console.error('Error al actualizar perfil del doctor', error);
        res.status(500).json({ message: 'Error al actualizar perfil' });
    }
};

// ── Sprint 27: Notas Rápidas por Paciente ────────────────────────────────────

// GET /api/doctors/patient/:patientId/notes
exports.getPatientNotes = async (req, res) => {
    try {
        const userId = req.user.id;
        const { patientId } = req.params;

        const [doctorRows] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
        if (doctorRows.length === 0) return res.status(403).json({ message: 'Perfil no encontrado.' });
        const doctorId = doctorRows[0].id;

        const [rows] = await db.query(
            'SELECT notes, updated_at FROM doctor_patient_notes WHERE doctor_id = ? AND patient_id = ?',
            [doctorId, patientId]
        );
        res.status(200).json({ notes: rows[0]?.notes || '', updatedAt: rows[0]?.updated_at || null });
    } catch (error) {
        console.error('Error en getPatientNotes:', error);
        res.status(500).json({ message: 'Error interno.' });
    }
};

// PUT /api/doctors/patient/:patientId/notes
exports.savePatientNotes = async (req, res) => {
    try {
        const userId = req.user.id;
        const { patientId } = req.params;
        const { notes } = req.body;

        const [doctorRows] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
        if (doctorRows.length === 0) return res.status(403).json({ message: 'Perfil no encontrado.' });
        const doctorId = doctorRows[0].id;

        await db.query(
            `INSERT INTO doctor_patient_notes (doctor_id, patient_id, notes)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE notes = VALUES(notes)`,
            [doctorId, patientId, notes]
        );
        res.status(200).json({ message: 'Notas guardadas.' });
    } catch (error) {
        console.error('Error en savePatientNotes:', error);
        res.status(500).json({ message: 'Error interno.' });
    }
};

// ── Sprint 27: Estadísticas Personales del Doctor ────────────────────────────

// GET /api/doctors/my-stats
exports.getMyStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const [doctorRows] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
        if (doctorRows.length === 0) return res.status(403).json({ message: 'Perfil no encontrado.' });
        const doctorId = doctorRows[0].id;

        // Citas por mes (últimos 6 meses)
        const [byMonth] = await db.query(`
            SELECT
                DATE_FORMAT(appointment_date, '%Y-%m') AS month,
                COUNT(*) AS total
            FROM appointments
            WHERE doctor_id = ?
              AND appointment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY month
            ORDER BY month ASC
        `, [doctorId]);

        // Totales por estado
        const [byStatus] = await db.query(`
            SELECT status, COUNT(*) AS total
            FROM appointments
            WHERE doctor_id = ?
            GROUP BY status
        `, [doctorId]);

        // Pacientes únicos
        const [uniquePatients] = await db.query(`
            SELECT COUNT(DISTINCT patient_id) AS total
            FROM appointments
            WHERE doctor_id = ?
        `, [doctorId]);

        // Nuevos vs recurrentes
        const [retention] = await db.query(`
            SELECT
                SUM(CASE WHEN cnt = 1 THEN 1 ELSE 0 END) AS new_patients,
                SUM(CASE WHEN cnt > 1  THEN 1 ELSE 0 END) AS recurrent_patients
            FROM (
                SELECT COUNT(*) AS cnt
                FROM appointments
                WHERE doctor_id = ?
                GROUP BY patient_id
            ) AS sub
        `, [doctorId]);

        // Distribución virtual vs presencial
        const [byType] = await db.query(`
            SELECT type, COUNT(*) AS total
            FROM appointments
            WHERE doctor_id = ? AND status = 'completed'
            GROUP BY type
        `, [doctorId]);

        // Rating promedio
        const [ratingRow] = await db.query(`
            SELECT ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS rating_count
            FROM doctor_ratings
            WHERE doctor_id = ?
        `, [doctorId]);

        const statusMap = {};
        byStatus.forEach(r => { statusMap[r.status] = r.total; });

        res.status(200).json({
            byMonth,
            byStatus: statusMap,
            uniquePatients: uniquePatients[0]?.total || 0,
            retention: retention[0] || { new_patients: 0, recurrent_patients: 0 },
            byType,
            avgRating: ratingRow[0]?.avg_rating || null,
            ratingCount: ratingRow[0]?.rating_count || 0,
        });
    } catch (error) {
        console.error('Error en getMyStats:', error);
        res.status(500).json({ message: 'Error interno.' });
    }
};

