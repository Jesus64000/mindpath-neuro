const db = require('../config/db');

// POST /api/ratings — el paciente valora una cita completada
exports.createRating = async (req, res) => {
    try {
        const { appointment_id, rating, comment } = req.body;
        const userId = req.user.id;

        if (!appointment_id || !rating) {
            return res.status(400).json({ message: 'appointment_id y rating son requeridos.' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'La valoración debe ser entre 1 y 5.' });
        }

        // Verificar que la cita pertenece al paciente logueado y está completada
        const [appt] = await db.query(`
            SELECT a.id, a.doctor_id, p.id AS patient_id
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE a.id = ? AND u.id = ? AND a.status = 'completed'
        `, [appointment_id, userId]);

        if (appt.length === 0) {
            return res.status(403).json({ message: 'Cita no encontrada, no completada, o no te pertenece.' });
        }

        // Insertar valoración (unique constraint evita duplicados)
        await db.query(
            'INSERT INTO doctor_ratings (appointment_id, patient_id, doctor_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
            [appointment_id, appt[0].patient_id, appt[0].doctor_id, rating, comment || null]
        );

        // Calcular nuevo promedio del doctor
        const [avg] = await db.query(
            'SELECT ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS total FROM doctor_ratings WHERE doctor_id = ?',
            [appt[0].doctor_id]
        );

        res.status(201).json({
            message: '¡Gracias por tu valoración!',
            avg_rating: avg[0].avg_rating,
            total_ratings: avg[0].total,
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Ya valoraste esta consulta.' });
        }
        console.error('Error en createRating:', error);
        res.status(500).json({ message: 'Error al guardar valoración.' });
    }
};

// GET /api/ratings/doctor/:doctorId — promedio y lista de reseñas
exports.getDoctorRatings = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const [rows] = await db.query(`
            SELECT
                dr.rating,
                dr.comment,
                dr.created_at,
                u.full_name AS patient_name
            FROM doctor_ratings dr
            JOIN patients p ON dr.patient_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE dr.doctor_id = ?
            ORDER BY dr.created_at DESC
            LIMIT 20
        `, [doctorId]);

        const [summary] = await db.query(
            'SELECT ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS total FROM doctor_ratings WHERE doctor_id = ?',
            [doctorId]
        );

        res.status(200).json({
            avg_rating: summary[0].avg_rating || 0,
            total_ratings: summary[0].total || 0,
            reviews: rows,
        });
    } catch (error) {
        console.error('Error en getDoctorRatings:', error);
        res.status(500).json({ message: 'Error al cargar valoraciones.' });
    }
};

// GET /api/ratings/my-pending — citas completadas sin valorar aún (para el paciente)
exports.getUnratedAppointments = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query(`
            SELECT
                a.id AS appointment_id,
                a.appointment_date,
                a.type,
                u.full_name AS doctor_name,
                d.specialty,
                d.id AS doctor_id
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users u ON d.user_id = u.id
            JOIN patients p ON a.patient_id = p.id
            JOIN users pu ON p.user_id = pu.id
            LEFT JOIN doctor_ratings dr ON dr.appointment_id = a.id
            WHERE pu.id = ? AND a.status = 'completed' AND dr.id IS NULL
            ORDER BY a.appointment_date DESC
            LIMIT 10
        `, [userId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error en getUnratedAppointments:', error);
        res.status(500).json({ message: 'Error al cargar citas sin valorar.' });
    }
};
