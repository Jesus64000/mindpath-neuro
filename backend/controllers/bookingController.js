const db = require('../config/db');

const DAYS_BY_INDEX = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Función auxiliar para obtener el patient_id del usuario logueado
const getPatientId = async (userId) => {
    const [rows] = await db.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
    return rows.length > 0 ? rows[0].id : null;
};

const getDoctorPrice = async ({ doctorId, date, type, startTime }) => {
    const requestDate = new Date(date);
    const dayOfWeek = DAYS_BY_INDEX[requestDate.getUTCDay()];

    const [doctorRows] = await db.query(
        'SELECT consultation_fee FROM doctors WHERE id = ?',
        [doctorId]
    );

    const doctorFee = doctorRows[0]?.consultation_fee ?? 0;

    const [ruleRows] = await db.query(
        `SELECT id, price, currency
         FROM doctor_rate_rules
         WHERE doctor_id = ?
           AND is_active = 1
           AND (modality = ? OR modality = 'ambas')
           AND (day_of_week IS NULL OR day_of_week = ?)
           AND (start_time IS NULL OR start_time <= ?)
           AND (end_time IS NULL OR end_time >= ?)
         ORDER BY priority ASC, id DESC
         LIMIT 1`,
        [doctorId, type, dayOfWeek, startTime || '00:00:00', startTime || '00:00:00']
    );

    const rule = ruleRows[0] || null;

    return {
        doctorId,
        type,
        date,
        dayOfWeek,
        price: Number(rule?.price ?? doctorFee),
        currency: rule?.currency || 'USD',
        source: rule ? 'doctor_rate_rules' : 'doctor.consultation_fee',
        ruleId: rule?.id || null,
    };
};

exports.getAppointmentQuote = async (req, res) => {
    try {
        const { doctorId, date, type, start_time: startTime } = req.query;

        if (!doctorId || !date || !type) {
            return res.status(400).json({ message: 'Se requiere doctorId, date y type.' });
        }

        const quote = await getDoctorPrice({ doctorId, date, type, startTime });
        res.status(200).json(quote);
    } catch (error) {
        console.error('Error calculando tarifa de cita:', error);
        res.status(500).json({ message: 'Error al calcular la tarifa.' });
    }
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
        const [exceptions] = await db.query(
            `SELECT * FROM doctor_exceptions WHERE doctor_id = ? AND exception_date = ?`,
            [doctorId, date]
        );

        let schedulesToUse = [];

        if (exceptions.length > 0) {
            const exception = exceptions[0];
            if (exception.is_day_off) {
                return res.status(200).json([]); // Día libre asignado
            }
            // Horario especial
            schedulesToUse = [{
                start_time: exception.start_time,
                end_time: exception.end_time,
                slot_duration: 30 // Fallback si no hay slot configurable a nivel de excepción
            }];
        } else {
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
            schedulesToUse = schedules;
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
        
        schedulesToUse.forEach(rule => {
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
    const { doctor_id, appointment_date, start_time, type, patient_id, payment_method } = req.body;

    try {
        let finalPatientId = null;
        const normalizedType = type === 'presencial' ? 'presencial' : 'virtual';
        const normalizedPaymentMethod = payment_method || (normalizedType === 'presencial' ? 'in_person' : 'platform');

        const quote = await getDoctorPrice({
            doctorId: doctor_id,
            date: appointment_date,
            type: normalizedType,
            startTime: start_time,
        });

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

        // Inserción directa en la BD explícitamente fijando el status a 'pending'
        const [result] = await db.query(
            `INSERT INTO appointments 
                (doctor_id, patient_id, appointment_date, start_time, type, consultation_fee_snapshot, payment_method, payment_status, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                doctor_id,
                finalPatientId,
                appointment_date,
                start_time,
                normalizedType,
                quote.price,
                payment_method || normalizedPaymentMethod,
                'pending',
                'pending'
            ]
        );

        res.status(201).json({
            message: 'Cita agendada con éxito.',
            appointment_id: result.insertId,
            quote,
        });
    } catch (error) {
        console.error(error);
        // Podríamos capturar error de choque de horas exacto aquí si tuviéramos un UNIQUE KEY para (doctor, fecha, hora)
        res.status(500).json({ message: 'Error al agendar la cita.' });
    }
};