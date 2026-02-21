const db = require('../config/db');

// Función auxiliar para obtener el patient_id del usuario logueado
const getPatientId = async (userId) => {
    const [rows] = await db.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
    return rows.length > 0 ? rows[0].id : null;
};

// 1. Calcular disponibilidad real de un doctor para una fecha específica
exports.getAvailability = async (req, res) => {
    const { doctorId, date } = req.query; // date en formato 'YYYY-MM-DD'

    if (!doctorId || !date) return res.status(400).json({ message: 'Faltan parámetros.' });

    try {
        // Obtenemos el día de la semana en inglés para cruzarlo con nuestra tabla de horarios
        const dateObj = new Date(`${date}T00:00:00`);
        const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

        // A. Buscar el horario de trabajo configurado por el doctor para ese día
        const [schedules] = await db.query(
            'SELECT start_time, end_time FROM doctor_schedules WHERE doctor_id = ? AND day_of_week = ?',
            [doctorId, dayOfWeek]
        );

        if (schedules.length === 0) {
            return res.status(200).json([]); // No trabaja ese día
        }

        // B. Buscar las citas que YA están agendadas para ese día (para restarlas)
        const [bookedAppointments] = await db.query(
            'SELECT start_time FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND status != "cancelled"',
            [doctorId, date]
        );
        const bookedTimes = bookedAppointments.map(app => app.start_time.slice(0, 5)); // 'HH:mm'

        // C. Generar los slots de 30 minutos
        let availableSlots = [];
        const { start_time, end_time } = schedules[0];
        
        // Convertimos horas a minutos para iterar fácilmente
        let startMins = parseInt(start_time.split(':')[0]) * 60 + parseInt(start_time.split(':')[1]);
        const endMins = parseInt(end_time.split(':')[0]) * 60 + parseInt(end_time.split(':')[1]);

        while (startMins + 30 <= endMins) {
            const h = Math.floor(startMins / 60).toString().padStart(2, '0');
            const m = (startMins % 60).toString().padStart(2, '0');
            const timeString = `${h}:${m}`;

            // Si la hora NO está en la lista de ocupadas, la agregamos
            if (!bookedTimes.includes(timeString)) {
                availableSlots.push(timeString);
            }
            startMins += 30; // Saltos de 30 minutos
        }

        res.status(200).json(availableSlots);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al calcular disponibilidad.' });
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