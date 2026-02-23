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
