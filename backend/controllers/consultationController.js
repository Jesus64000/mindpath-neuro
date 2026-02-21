const db = require('../config/db');
const aiService = require('../services/aiService');

exports.processAudioAndGenerateReport = async (req, res) => {
    const appointmentId = req.params.appointmentId;
    const audioFile = req.file;

    if (!audioFile) {
        return res.status(400).json({ message: 'No se detectó ningún archivo de audio.' });
    }

    // Iniciamos una Transacción SQL porque tocaremos 3 tablas a la vez
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Crear el registro del encuentro (Consultation)
        const [consultationRes] = await connection.query(
            'INSERT INTO consultations (appointment_id, start_datetime, end_datetime) VALUES (?, NOW() - INTERVAL 15 MINUTE, NOW()) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)',
            [appointmentId]
        );
        const consultationId = consultationRes.insertId;

        // 2. Guardar el registro del Audio
        await connection.query(
            'INSERT INTO consultation_audio (consultation_id, file_path, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE file_path=VALUES(file_path), status=VALUES(status)',
            [consultationId, audioFile.path, 'completed']
        );

        // 3. Mandar a la IA a trabajar (Servicio Asíncrono)
        const aiData = await aiService.processConsultationAudio(audioFile.path);

        // 4. Guardar el Borrador del Informe Clínico
        const [reportRes] = await connection.query(
            `INSERT INTO clinical_reports 
            (consultation_id, background, neurological_findings, treatment_plan, ai_confidence_score, is_validated) 
            VALUES (?, ?, ?, ?, ?, false)
            ON DUPLICATE KEY UPDATE 
            background=VALUES(background), 
            neurological_findings=VALUES(neurological_findings), 
            treatment_plan=VALUES(treatment_plan), 
            ai_confidence_score=VALUES(ai_confidence_score), 
            is_validated=false,
            id=LAST_INSERT_ID(id)`,
            [consultationId, aiData.background, aiData.neurological_findings, aiData.treatment_plan, aiData.ai_confidence_score]
        );

        // 5. Actualizar el estado de la cita a 'completed'
        await connection.query('UPDATE appointments SET status = "completed" WHERE id = ?', [appointmentId]);

        await connection.commit(); // Confirmamos los cambios en la BD

        res.status(200).json({ 
            message: 'Audio procesado e informe generado con éxito.',
            report_id: reportRes.insertId
        });

    } catch (error) {
        await connection.rollback(); // Si algo falla, deshacemos todo
        console.error("Error en el motor de IA:", error);
        res.status(500).json({ message: 'Error al procesar la consulta con la IA.' });
    } finally {
        connection.release();
    }
};

// Obtener un reporte específico para el Frontend
exports.getReport = async (req, res) => {
    try {
        const [reports] = await db.query(`
            SELECT r.*, u.full_name as patient_name, a.appointment_date 
            FROM clinical_reports r
            JOIN consultations c ON r.consultation_id = c.id
            JOIN appointments a ON c.appointment_id = a.id
            JOIN patients p ON a.patient_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE r.id = ?
        `, [req.params.reportId]);

        if (reports.length === 0) return res.status(404).json({ message: 'Informe no encontrado.' });
        res.status(200).json(reports[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el informe.' });
    }
};
