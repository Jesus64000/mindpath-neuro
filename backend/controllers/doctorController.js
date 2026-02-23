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
                d.is_verified
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            WHERE u.role = 'doctor' AND d.is_verified = TRUE
        `);

        res.status(200).json(doctors);
    } catch (error) {
        console.error("Error obteniendo doctores:", error);
        res.status(500).json({ message: 'Error interno del servidor al obtener especialistas.' });
    }
};

// Alias para mantener compatibilidad con código previo
exports.getSpecialists = exports.getAllDoctors;

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

// Obtener expediente clínico de un paciente para el doctor autenticado
exports.getPatientFile = async (req, res) => {
    try {
        const { patientId } = req.params;
        const userId = req.user.id;
        const [doctor] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
        if (doctor.length === 0) return res.status(404).json({ message: 'Perfil de doctor no encontrado.' });
        const doctorId = doctor[0].id;

        const [patientInfo] = await db.query(`
            SELECT u.full_name, u.email, p.* FROM patients p 
            JOIN users u ON p.user_id = u.id WHERE p.id = ?
        `, [patientId]);

        if (patientInfo.length === 0) return res.status(404).json({ message: 'Paciente no encontrado.' });

        const [history] = await db.query(`
            SELECT a.id, a.appointment_date, a.type, a.status, r.summary as report_summary
            FROM appointments a
            LEFT JOIN clinical_reports r ON a.id = r.appointment_id
            WHERE a.patient_id = ? AND a.doctor_id = ?
            ORDER BY a.appointment_date DESC
        `, [patientId, doctorId]);

        res.status(200).json({ info: patientInfo[0], history });
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
            SELECT u.full_name, u.email, d.* FROM doctors d 
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
        const { specialty, bio, clinic_name, clinic_address, license_number, experience_years, consultation_fee } = req.body;

        await db.query(`
            UPDATE doctors SET 
                specialty = ?, bio = ?, clinic_name = ?, 
                clinic_address = ?, license_number = ?, 
                experience_years = ?, consultation_fee = ?
            WHERE user_id = ?
        `, [specialty, bio, clinic_name, clinic_address, license_number, experience_years, consultation_fee, userId]);

        res.status(200).json({ message: 'Perfil actualizado con éxito' });
    } catch (error) {
        console.error('Error al actualizar perfil del doctor', error);
        res.status(500).json({ message: 'Error al actualizar perfil' });
    }
};
