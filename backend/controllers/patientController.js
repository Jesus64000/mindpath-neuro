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
