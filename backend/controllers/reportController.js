// backend/controllers/reportController.js
const db = require("../config/db");

exports.wrapUpConsultation = async (req, res) => {
  try {
    const {
      appointmentId,
      antecedentes,
      hallazgos,
      plan,
      privateNotes,
      isShared,
    } = req.body;
    const userId = req.user.id;

    // Validar que el doctor sea el dueño de la cita
    const [doctorRows] = await db.query(
      "SELECT id FROM doctors WHERE user_id = ?",
      [userId],
    );
    if (!doctorRows || doctorRows.length === 0) {
      return res
        .status(403)
        .json({
          message: "No se encontró perfil de doctor para este usuario.",
        });
    }
    const doctorId = doctorRows[0].id;

    const [appointmentRows] = await db.query(
      "SELECT id FROM appointments WHERE id = ? AND doctor_id = ?",
      [appointmentId, doctorId],
    );
    if (appointmentRows.length === 0) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para cerrar esta cita." });
    }

    // Insertar o actualizar el informe clínico
    await db.query(
      `
            INSERT INTO clinical_reports (appointment_id, antecedentes, hallazgos, plan, private_notes, is_shared)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                antecedentes = VALUES(antecedentes),
                hallazgos = VALUES(hallazgos),
                plan = VALUES(plan),
                private_notes = VALUES(private_notes),
                is_shared = VALUES(is_shared)
        `,
      [appointmentId, antecedentes, hallazgos, plan, privateNotes, isShared],
    );

    // Cambiar estado de la cita a Completada
    await db.query(
      'UPDATE appointments SET status = "completed" WHERE id = ?',
      [appointmentId],
    );

    res.status(200).json({ message: "Consulta finalizada exitosamente." });
  } catch (error) {
    console.error("Error en wrapUpConsultation:", error);
    res
      .status(500)
      .json({ message: "Error al guardar el informe.", error: error.message });
  }
};
