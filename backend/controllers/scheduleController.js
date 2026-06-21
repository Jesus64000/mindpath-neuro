const db = require('../config/db');

// Función interna auxiliar para traducir user_id a doctor_id
const getDoctorId = async (userId) => {
    const [rows] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
    return rows.length > 0 ? rows[0].id : null;
};

// 1. Obtener los horarios del doctor logueado
exports.getMySchedules = async (req, res) => {
    try {
        const doctorId = await getDoctorId(req.user.id);
        if (!doctorId) return res.status(403).json({ message: 'Acceso denegado. Perfil de doctor no encontrado.' });

        // Traemos los horarios ordenados lógicamente por día y hora
        const [schedules] = await db.query(`
            SELECT id, day_of_week, start_time, end_time, slot_duration, clinic_id
            FROM doctor_schedules 
            WHERE doctor_id = ? 
            ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), start_time
        `, [doctorId]);

        res.status(200).json(schedules);
    } catch (error) {
        console.error("Error en getMySchedules:", error);
        res.status(500).json({ message: 'Error interno al obtener los horarios.' });
    }
};

// 2. Agregar un nuevo bloque de horario
exports.addSchedule = async (req, res) => {
    const { day_of_week, start_time, end_time, slot_duration, clinic_id } = req.body;

    try {
        const doctorId = await getDoctorId(req.user.id);
        if (!doctorId) return res.status(403).json({ message: 'Acceso denegado.' });

        // Validaciones básicas de negocio
        if (!day_of_week || !start_time || !end_time) {
            return res.status(400).json({ message: 'Faltan datos obligatorios (día, hora inicio, hora fin).' });
        }
        
        const duration = slot_duration ? parseInt(slot_duration, 10) : 30; // 30 mins por defecto
        const finalClinicId = clinic_id === '' || clinic_id === 'null' ? null : clinic_id;

        const [result] = await db.query(
            'INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration, clinic_id) VALUES (?, ?, ?, ?, ?, ?)',
            [doctorId, day_of_week, start_time, end_time, duration, finalClinicId]
        );

        res.status(201).json({ 
            message: 'Horario agregado exitosamente.',
            schedule: { id: result.insertId, day_of_week, start_time, end_time, slot_duration: duration, clinic_id: finalClinicId }
        });
    } catch (error) {
        console.error("Error en addSchedule:", error);
        // Capturamos el error de clave duplicada (UNIQUE KEY de nuestra BD)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Ya tienes este bloque de horario registrado para este día.' });
        }
        res.status(500).json({ message: 'Error al guardar el horario en la base de datos.' });
    }
};

// 3. Eliminar un bloque de horario (Por si el doctor se equivoca)
exports.deleteSchedule = async (req, res) => {
    const scheduleId = req.params.id;

    try {
        const doctorId = await getDoctorId(req.user.id);
        
        // Solo eliminamos si el horario pertenece a este doctor (Seguridad)
        const [result] = await db.query(
            'DELETE FROM doctor_schedules WHERE id = ? AND doctor_id = ?',
            [scheduleId, doctorId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Horario no encontrado o no tienes permisos para eliminarlo.' });
        }

        res.status(200).json({ message: 'Horario eliminado correctamente.' });
    } catch (error) {
        console.error("Error en deleteSchedule:", error);
        res.status(500).json({ message: 'Error al eliminar el horario.' });
    }
};
