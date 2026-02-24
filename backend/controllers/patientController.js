const db = require('../config/db');

// Obtiene el equipo médico del paciente autenticado
exports.getMyDoctors = async (req, res) => {
    try {
        const userId = req.user.id;

        const [myDoctors] = await db.query(`
            SELECT DISTINCT
                d.id AS doctor_id,
                u.id AS user_id,
                u.full_name,
                d.specialty,
                d.profile_picture,
                d.bio
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users u ON d.user_id = u.id
            JOIN patients p ON a.patient_id = p.id
            WHERE p.user_id = ? AND u.role = 'doctor' AND d.is_verified = TRUE
        `, [userId]);

        res.status(200).json(myDoctors);
    } catch (error) {
        console.error('Error al obtener el equipo médico:', error);
        res.status(500).json({ message: 'Error interno al cargar tu equipo médico.' });
    }
};

// Obtener perfil del paciente autenticado
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query(`
            SELECT u.full_name, u.email,
                   p.phone, p.date_of_birth, p.gender, p.address, p.profile_picture
            FROM patients p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id = ?
        `, [userId]);

        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Perfil no encontrado.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error al cargar perfil del paciente:', error);
        res.status(500).json({ message: 'Error al cargar perfil.' });
    }
};

// Actualizar perfil del paciente
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { full_name, phone, address } = req.body;

        await db.query(
            'UPDATE patients SET phone = ?, address = ? WHERE user_id = ?',
            [phone ?? null, address ?? null, userId]
        );

        if (full_name) {
            await db.query('UPDATE users SET full_name = ? WHERE id = ?', [full_name, userId]);
        }

        res.status(200).json({ message: 'Perfil actualizado correctamente.' });
    } catch (error) {
        console.error('Error al actualizar perfil del paciente:', error);
        res.status(500).json({ message: 'Error al actualizar perfil.' });
    }
};

// Obtener el informe de una cita (solo si el doctor lo compartió)
exports.getAppointmentReport = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const userId = req.user.id;

        const [patient] = await db.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
        if (!patient || patient.length === 0) {
            return res.status(403).json({ message: "Perfil de paciente no encontrado." });
        }
        const patientId = patient[0].id;

        const [report] = await db.query(`
            SELECT 
                a.appointment_date, a.start_time, a.type,
                du.full_name AS doctor_name, d.specialty, d.clinic_name,
                r.motivo_sintomas, r.antecedentes, r.hallazgos,
                r.diagnostico, r.tratamiento, r.estudios_observaciones
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users du ON d.user_id = du.id
            JOIN consultations c ON a.id = c.appointment_id
            JOIN clinical_reports r ON c.id = r.consultation_id
            WHERE a.id = ? AND a.patient_id = ? AND r.is_shared = TRUE
        `, [appointmentId, patientId]);

        if (report.length === 0) {
            return res.status(404).json({ message: "El informe no está disponible o el doctor no lo ha compartido aún." });
        }

        res.status(200).json(report[0]);
    } catch (error) {
        console.error("Error al obtener informe del paciente:", error);
        res.status(500).json({ message: "Error al cargar el informe." });
    }
};
