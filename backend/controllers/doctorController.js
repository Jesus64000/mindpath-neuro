const db = require('../config/db');

exports.getSpecialists = async (req, res) => {
    try {
        // Hacemos un JOIN para traer el nombre del usuario y los datos del doctor
        const [doctors] = await db.query(`
            SELECT 
                d.id AS doctor_id, 
                u.full_name, 
                d.specialty, 
                d.profile_picture, 
                d.bio,
                d.is_verified
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            WHERE d.is_verified = true
        `);
        
        res.status(200).json(doctors);
    } catch (error) {
        console.error("Error obteniendo doctores:", error);
        res.status(500).json({ message: 'Error interno del servidor al obtener especialistas.' });
    }
};
