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

        // Verificar bloqueo de emergencia
        const [doctorRows] = await db.query('SELECT is_blocked, emergency_block_until FROM doctors WHERE id = ?', [doctorId]);
        let blockUntil = null;
        if (doctorRows.length > 0 && doctorRows[0].is_blocked) {
            if (!doctorRows[0].emergency_block_until) {
                return res.status(200).json([]); // Bloqueo indefinido
            }
            blockUntil = new Date(doctorRows[0].emergency_block_until);
        }

        // Traducir fecha a ENUM de la base (Sunday/Monday...)
        const requestDate = new Date(date);
        const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeekEnum = daysMap[requestDate.getUTCDay()];

        // Buscar *todas* las reglas de horario en doctor_schedules para ese día
        const [schedules] = await db.query(
            `SELECT start_time, end_time, slot_duration 
             FROM doctor_schedules 
             WHERE doctor_id = ? AND day_of_week = ?
             ORDER BY start_time`,
            [doctorId, dayOfWeekEnum]
        );

        if (schedules.length === 0) {
            return res.status(200).json([]);
        }

        // Citas ya agendadas ese día
        const [bookedAppointments] = await db.query(
            `SELECT start_time 
             FROM appointments 
             WHERE doctor_id = ? AND appointment_date = ? AND status != 'cancelled'`,
            [doctorId, date]
        );

        const bookedTimes = bookedAppointments.map(app => app.start_time.substring(0, 5));

        // Generar slots para cada bloque de horario
        const slots = [];
        
        schedules.forEach(rule => {
            const slotDuration = rule.slot_duration || 30; // 30 min por defecto
            let currentSlot = new Date(`1970-01-01T${rule.start_time}Z`);
            const endTime = new Date(`1970-01-01T${rule.end_time}Z`);

            while (currentSlot < endTime) {
                const timeString = currentSlot.toISOString().substring(11, 16); // HH:MM

                let isSlotBlocked = false;
                if (blockUntil) {
                    const realSlotTime = new Date(`${date}T${timeString}:00`);
                    if (blockUntil > realSlotTime) {
                        isSlotBlocked = true;
                    }
                }

                // Evitar solapamientos (ej. si dos reglas se tocan o si ya estaba ocupado o bloqueado)
                if (!bookedTimes.includes(timeString) && !slots.includes(timeString) && !isSlotBlocked) {
                    slots.push(timeString);
                }

                currentSlot.setUTCMinutes(currentSlot.getUTCMinutes() + slotDuration);
            }
        });

        // Ordenar los slots en caso de que los bloques tuvieran desorden (aunque SQL ya ordenó)
        slots.sort();

        res.status(200).json(slots);

    } catch (error) {
        console.error('Error al calcular disponibilidad:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// 2. Crear la cita médica
exports.bookAppointment = async (req, res) => {
    const { doctor_id, appointment_date, start_time, type, patient_id } = req.body;

    try {
        let finalPatientId = null;

        // Verificar si el doctor tiene Bloqueo de Emergencia activo
        const [doctorRows] = await db.query('SELECT is_blocked, emergency_block_until FROM doctors WHERE id = ?', [doctor_id]);
        if (doctorRows.length === 0) {
            return res.status(404).json({ message: 'Especialista no encontrado.' });
        }
        if (doctorRows[0].is_blocked) {
            if (!doctorRows[0].emergency_block_until) {
                return res.status(403).json({ message: 'El especialista no está disponible para nuevas citas por bloqueo de emergencia.' });
            }
            const blockUntil = new Date(doctorRows[0].emergency_block_until);
            const requestedDateTime = new Date(`${appointment_date}T${start_time}`);
            if (blockUntil > requestedDateTime) {
                return res.status(403).json({ message: 'Ese horario se encuentra dentro del periodo de bloqueo de emergencia del especialista.' });
            }
        }

        if (req.user.role === 'doctor') {
            // El doctor está agendando para un paciente específico
            if (!patient_id) {
                return res.status(400).json({ message: 'Se requiere el ID del paciente para agendar.' });
            }
            finalPatientId = patient_id;
        } else if (req.user.role === 'patient') {
            // Es un paciente agendando para sí mismo
            finalPatientId = await getPatientId(req.user.id);
            if (!finalPatientId) {
                return res.status(403).json({ message: 'No se encontró tu perfil de paciente.' });
            }
        } else {
            return res.status(403).json({ message: 'Rol no autorizado para agendar citas.' });
        }

        // Inserción directa en la BD (El estado por defecto en SQL es 'pending')
        const [result] = await db.query(
            'INSERT INTO appointments (doctor_id, patient_id, appointment_date, start_time, type) VALUES (?, ?, ?, ?, ?)',
            [doctor_id, finalPatientId, appointment_date, start_time, type]
        );

        res.status(201).json({ message: 'Cita agendada con éxito.', appointment_id: result.insertId });
    } catch (error) {
        console.error(error);
        // Podríamos capturar error de choque de horas exacto aquí si tuviéramos un UNIQUE KEY para (doctor, fecha, hora)
        res.status(500).json({ message: 'Error al agendar la cita.' });
    }
};