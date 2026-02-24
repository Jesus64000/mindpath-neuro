// backend/controllers/reportController.js
const db = require('../config/db');

// ── Obtener datos del membrete (paciente + doctor + cita) ─────────────────
exports.getConsultationHeader = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const userId = req.user.id;

        const [doctorRows] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
        if (!doctorRows || doctorRows.length === 0) {
            return res.status(403).json({ message: "No se encontró perfil de doctor." });
        }
        const doctorId = doctorRows[0].id;

        const [details] = await db.query(`
            SELECT 
                a.appointment_date,
                a.start_time,
                a.type,
                pu.full_name   AS patient_name,
                p.date_of_birth,
                p.gender,
                p.phone,
                du.full_name   AS doctor_name,
                d.specialty,
                d.clinic_name
            FROM appointments a
            JOIN patients  p  ON a.patient_id = p.id
            JOIN users     pu ON p.user_id    = pu.id
            JOIN doctors   d  ON a.doctor_id  = d.id
            JOIN users     du ON d.user_id    = du.id
            WHERE a.id = ? AND a.doctor_id = ?
        `, [appointmentId, doctorId]);

        if (details.length === 0) {
            return res.status(404).json({ message: "Cita no encontrada o sin acceso." });
        }

        res.status(200).json(details[0]);
    } catch (error) {
        console.error("Error al cargar membrete:", error);
        res.status(500).json({ message: "Error al cargar los datos de la consulta." });
    }
};

// ── Guardar el informe y cerrar la cita ───────────────────────────────────
exports.wrapUpConsultation = async (req, res) => {
    try {
        const {
            appointmentId,
            motivo_sintomas,
            antecedentes,
            hallazgos,
            diagnostico,
            tratamiento,
            estudios_observaciones,
            privateNotes,
            isShared
        } = req.body;

        const userId = req.user.id;

        const [doctorRows] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
        if (!doctorRows || doctorRows.length === 0) {
            return res.status(403).json({ message: "No se encontró perfil de doctor para este usuario." });
        }
        const doctorId = doctorRows[0].id;

        const [appointmentRows] = await db.query(
            'SELECT id FROM appointments WHERE id = ? AND doctor_id = ?',
            [appointmentId, doctorId]
        );
        if (appointmentRows.length === 0) {
            return res.status(403).json({ message: "No tienes permiso para modificar esta cita." });
        }

        // Paso 1: Crear o recuperar el registro de consultations para esta cita
        // (clinical_reports.consultation_id es FK → consultations.id)
        const [consultationRes] = await db.query(
            `INSERT INTO consultations (appointment_id, start_datetime, end_datetime)
             VALUES (?, NOW() - INTERVAL 1 HOUR, NOW())
             ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
            [appointmentId]
        );
        const consultationId = consultationRes.insertId;

        // Paso 2: Insertar o actualizar el informe clínico con el consultation_id real
        await db.query(`
            INSERT INTO clinical_reports 
            (consultation_id, motivo_sintomas, antecedentes, hallazgos, diagnostico, tratamiento, estudios_observaciones, private_notes, is_shared)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                motivo_sintomas          = VALUES(motivo_sintomas),
                antecedentes             = VALUES(antecedentes),
                hallazgos                = VALUES(hallazgos),
                diagnostico              = VALUES(diagnostico),
                tratamiento              = VALUES(tratamiento),
                estudios_observaciones   = VALUES(estudios_observaciones),
                private_notes            = VALUES(private_notes),
                is_shared                = VALUES(is_shared)
        `, [
            consultationId, motivo_sintomas, antecedentes, hallazgos,
            diagnostico, tratamiento, estudios_observaciones, privateNotes, isShared
        ]);

        await db.query('UPDATE appointments SET status = "completed" WHERE id = ?', [appointmentId]);

        res.status(200).json({ message: "Historia clínica guardada y firmada exitosamente." });

    } catch (error) {
        console.error("Error al guardar el cierre:", error);
        res.status(500).json({ message: "Error al guardar el informe clínico.", error: error.message });
    }
};
