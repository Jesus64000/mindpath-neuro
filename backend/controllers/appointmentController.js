const db = require('../config/db');

// Función interna auxiliar para traducir user_id a doctor_id
const getDoctorId = async (userId) => {
    const [rows] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
    return rows.length > 0 ? rows[0].id : null;
};

// 1. Obtener todas las citas del doctor logueado
exports.getDoctorAppointments = async (req, res) => {
    try {
        const doctorId = await getDoctorId(req.user.id);
        if (!doctorId) return res.status(403).json({ message: 'Acceso denegado. Perfil de doctor no encontrado.' });

        // JOIN Triple: Citas -> Pacientes -> Usuarios (Para sacar el nombre real)
        const [appointments] = await db.query(`
            SELECT 
                a.id AS appointment_id,
                a.appointment_date,
                a.start_time,
                a.status,
                a.type,
                u.full_name AS patient_name,
                p.gender,
                p.date_of_birth,
                p.id AS patient_id
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE a.doctor_id = ?
            ORDER BY a.appointment_date ASC, a.start_time ASC
        `, [doctorId]);

        res.status(200).json(appointments);
    } catch (error) {
        console.error("Error en getDoctorAppointments:", error);
        res.status(500).json({ message: 'Error interno al obtener la agenda del doctor.' });
    }
};

// 2. Actualizar el estado de una cita (Confirmar, Cancelar, Completar)
exports.updateAppointmentStatus = async (req, res) => {
    const appointmentId = req.params.id;
    const { status } = req.body; // 'pending', 'confirmed', 'completed', 'cancelled'

    try {
        const doctorId = await getDoctorId(req.user.id);
        
        // Verificamos que la cita exista y pertenezca a este doctor
        const [result] = await db.query(
            'UPDATE appointments SET status = ? WHERE id = ? AND doctor_id = ?',
            [status, appointmentId, doctorId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cita no encontrada o no tienes permisos.' });
        }

        res.status(200).json({ message: `Cita actualizada a estado: ${status}` });
    } catch (error) {
        console.error("Error en updateAppointmentStatus:", error);
        res.status(500).json({ message: 'Error al actualizar el estado de la cita.' });
    }
};

// Función interna auxiliar para traducir user_id a patient_id
const getPatientId = async (userId) => {
    const [rows] = await db.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
    return rows.length > 0 ? rows[0].id : null;
};

// 3. Obtener todas las citas del paciente logueado
exports.getPatientAppointments = async (req, res) => {
    try {
        const patientId = await getPatientId(req.user.id);
        if (!patientId) return res.status(403).json({ message: 'Acceso denegado. Perfil de paciente no encontrado.' });

        // JOIN Triple: Citas -> Doctores -> Usuarios (Para sacar el nombre y especialidad del Dr)
        const [appointments] = await db.query(`
            SELECT 
                a.id AS appointment_id,
                a.appointment_date,
                a.start_time,
                a.status,
                a.type,
                u.full_name AS doctor_name,
                d.specialty,
                d.profile_picture
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users u ON d.user_id = u.id
            WHERE a.patient_id = ?
            ORDER BY a.appointment_date DESC, a.start_time DESC
        `, [patientId]);

        res.status(200).json(appointments);
    } catch (error) {
        console.error("Error en getPatientAppointments:", error);
        res.status(500).json({ message: 'Error interno al obtener tus citas.' });
    }
};
