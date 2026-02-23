const db = require('../config/db');

// Función auxiliar para obtener el patient_id del usuario logueado
const getPatientId = async (userId) => {
    const [rows] = await db.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
    return rows.length > 0 ? rows[0].id : null;
};

// 1. Calcular disponibilidad real de un doctor para una fecha específica
exports.getAvailability = async (req, res) => {
    try {
        const { doctorId, date } = req.query; // date viene en formato 'YYYY-MM-DD'

        if (!doctorId || !date) {
            return res.status(400).json({ message: 'Se requiere doctorId y date' });
        }

        // Traducir fecha a ENUM de la base (Sunday/Monday...)
        const requestDate = new Date(date);
        const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeekEnum = daysMap[requestDate.getUTCDay()];

        // Buscar la regla de horario en doctor_schedules
        const [schedules] = await db.query(
            `SELECT start_time, end_time 
             FROM doctor_schedules 
             WHERE doctor_id = ? AND day_of_week = ?`,
            [doctorId, dayOfWeekEnum]
        );

        if (schedules.length === 0) {
            return res.status(200).json([]);
        }

        const rule = schedules[0];
        const SLOT_DURATION = 30; // minutos

        // Citas ya agendadas ese día
        const [bookedAppointments] = await db.query(
            `SELECT start_time 
             FROM appointments 
             WHERE doctor_id = ? AND appointment_date = ? AND status != 'cancelled'`,
            [doctorId, date]
        );

        const bookedTimes = bookedAppointments.map(app => app.start_time.substring(0, 5));

        // Generar slots de 30 min dentro del rango
        const slots = [];
        let currentSlot = new Date(`1970-01-01T${rule.start_time}Z`);
        const endTime = new Date(`1970-01-01T${rule.end_time}Z`);

        while (currentSlot < endTime) {
            const timeString = currentSlot.toISOString().substring(11, 16); // HH:MM

            if (!bookedTimes.includes(timeString)) {
                slots.push(timeString);
            }

            currentSlot.setUTCMinutes(currentSlot.getUTCMinutes() + SLOT_DURATION);
        }

        res.status(200).json(slots);

    } catch (error) {
        console.error('Error al calcular disponibilidad:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// 2. Crear la cita médica
exports.bookAppointment = async (req, res) => {
    const { doctor_id, appointment_date, start_time, type } = req.body;

    try {
        const patientId = await getPatientId(req.user.id);
        if (!patientId) return res.status(403).json({ message: 'Solo los pacientes pueden agendar citas.' });

        // Inserción directa en la BD (El estado por defecto en SQL es 'pending')
        const [result] = await db.query(
            'INSERT INTO appointments (doctor_id, patient_id, appointment_date, start_time, type) VALUES (?, ?, ?, ?, ?)',
            [doctor_id, patientId, appointment_date, start_time, type]
        );

        res.status(201).json({ message: 'Cita agendada con éxito.', appointment_id: result.insertId });
    } catch (error) {
        console.error(error);
        // Podríamos capturar error de choque de horas exacto aquí si tuviéramos un UNIQUE KEY para (doctor, fecha, hora)
        res.status(500).json({ message: 'Error al agendar la cita.' });
    }
};