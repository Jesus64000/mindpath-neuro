const db = require('../config/db');

const DAYS_BY_INDEX = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Obtener la hora actual en Caracas (UTC-4)
const getCaracasTime = () => {
    const now = new Date();
    try {
        const caracasString = now.toLocaleString('en-US', { timeZone: 'America/Caracas' });
        return new Date(caracasString);
    } catch (e) {
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        return new Date(utc - (3600000 * 4));
    }
};

const getCaracasTodayStr = () => {
    const caracasNow = getCaracasTime();
    const year = caracasNow.getFullYear();
    const month = String(caracasNow.getMonth() + 1).padStart(2, '0');
    const day = String(caracasNow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

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
                slot_duration: 30, // Fallback si no hay slot configurable a nivel de excepción
                clinic_id: null,
                clinic_name: null,
                clinic_address: null
            }];
        } else {
            const [schedules] = await db.query(
                `SELECT ds.start_time, ds.end_time, ds.slot_duration, ds.clinic_id,
                        c.name AS clinic_name,
                        COALESCE(dc.custom_address, c.default_address) AS clinic_address
                 FROM doctor_schedules ds
                 LEFT JOIN clinics c ON c.id = ds.clinic_id
                 LEFT JOIN doctor_clinics dc ON dc.clinic_id = ds.clinic_id AND dc.doctor_id = ds.doctor_id
                 WHERE ds.doctor_id = ? AND ds.day_of_week = ?
                 ORDER BY ds.start_time`,
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
                if (!bookedTimes.includes(timeString) && !isSlotBlocked) {
                    const exists = slots.some(s => typeof s === 'string' ? s === timeString : s.time === timeString);
                    if (!exists) {
                        if (req.query.format === 'object') {
                            slots.push({
                                time: timeString,
                                clinic_id: rule.clinic_id || null,
                                clinic_name: rule.clinic_name || null,
                                clinic_address: rule.clinic_address || null
                            });
                        } else {
                            slots.push(timeString);
                        }
                    }
                }

                currentSlot.setUTCMinutes(currentSlot.getUTCMinutes() + slotDuration);
            }
        });

        // Ordenar los slots en caso de que los bloques tuvieran desorden (aunque SQL ya ordenó)
        slots.sort((a, b) => {
            const tA = typeof a === 'string' ? a : a.time;
            const tB = typeof b === 'string' ? b : b.time;
            return tA.localeCompare(tB);
        });

        // Si es el día de hoy, filtrar slots pasados y aquellos con menos de 10 minutos de anticipación
        const todayStr = getCaracasTodayStr();
        let filteredSlots = slots;
        if (date === todayStr) {
            const caracasNow = getCaracasTime();
            const currentMinutes = caracasNow.getHours() * 60 + caracasNow.getMinutes();
            filteredSlots = slots.filter(slot => {
                const timeString = typeof slot === 'string' ? slot : slot.time;
                const [slotHour, slotMinute] = timeString.split(':').map(Number);
                const slotMinutes = slotHour * 60 + slotMinute;
                return (slotMinutes - currentMinutes) >= 10;
            });
        }

        res.status(200).json(filteredSlots);

    } catch (error) {
        console.error('Error al calcular disponibilidad:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// 2. Crear la cita médica
exports.bookAppointment = async (req, res) => {
    const { doctor_id, appointment_date, start_time, type, patient_id, payment_method } = req.body;

    try {
        const todayStr = getCaracasTodayStr();
        if (appointment_date < todayStr) {
            return res.status(400).json({ message: 'No puedes agendar una cita en una fecha pasada.' });
        }

        if (appointment_date === todayStr) {
            const caracasNow = getCaracasTime();
            const [slotHour, slotMinute] = start_time.substring(0, 5).split(':').map(Number);
            const slotMinutes = slotHour * 60 + slotMinute;
            const currentMinutes = caracasNow.getHours() * 60 + caracasNow.getMinutes();
            if ((slotMinutes - currentMinutes) < 10) {
                return res.status(400).json({ message: 'Las citas para el día de hoy deben agendarse con al menos 10 minutos de anticipación.' });
            }
        }

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
            if (!patient_id) {
                return res.status(400).json({ message: 'Se requiere el ID del paciente para agendar.' });
            }
            finalPatientId = patient_id;
        } else if (req.user.role === 'patient') {
            finalPatientId = await getPatientId(req.user.id);
            if (!finalPatientId) {
                return res.status(403).json({ message: 'No se encontró tu perfil de paciente.' });
            }
        } else {
            return res.status(403).json({ message: 'Rol no autorizado para agendar citas.' });
        }

        // Resolver clinic_id a partir del bloque de horario del médico
        let finalClinicId = null;
        try {
            const requestDate = new Date(appointment_date);
            const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayOfWeekEnum = daysMap[requestDate.getUTCDay()];

            const [scheduleRows] = await db.query(
                `SELECT clinic_id FROM doctor_schedules
                 WHERE doctor_id = ? AND day_of_week = ? AND start_time <= ? AND end_time > ?
                 LIMIT 1`,
                [doctor_id, dayOfWeekEnum, start_time, start_time]
            );
            if (scheduleRows.length > 0) {
                finalClinicId = scheduleRows[0].clinic_id;
            }
        } catch (scheduleError) {
            console.error('Error resolving clinic_id for appointment:', scheduleError.message);
        }

        // Inserción directa en la BD
        const [result] = await db.query(
            `INSERT INTO appointments 
                (doctor_id, patient_id, appointment_date, start_time, type, consultation_fee_snapshot, payment_method, payment_status, status, clinic_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                doctor_id,
                finalPatientId,
                appointment_date,
                start_time,
                normalizedType,
                quote.price,
                payment_method || normalizedPaymentMethod,
                'pending',
                'pending',
                finalClinicId
            ]
        );

        // Limpiar citas anteriores pendientes o suspendidas para evitar alertas residuales
        try {
            await db.query(
                `UPDATE appointments 
                 SET status = 'cancelled' 
                 WHERE patient_id = ? AND status = 'emergency_reschedule'`,
                [finalPatientId]
            );
            await db.query(
                `UPDATE appointments 
                 SET status = 'cancelled' 
                 WHERE patient_id = ? AND status IN ('confirmed', 'scheduled', 'pending') AND appointment_date < ?`,
                [finalPatientId, appointment_date]
            );
        } catch (cleanupError) {
            console.error('Error al limpiar citas anteriores del paciente:', cleanupError.message);
        }

        res.status(201).json({
            message: 'Cita agendada con éxito.',
            appointment_id: result.insertId,
            quote,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al agendar la cita.' });
    }
};