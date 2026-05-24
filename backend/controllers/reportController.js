// backend/controllers/reportController.js
const crypto = require('crypto');
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
                a.payment_method,
                a.payment_status,
                a.payment_reference,
                a.payment_collected_at,
                a.consultation_fee_snapshot,
                a.legal_verification_code,
                a.legal_verification_hash,
                pu.full_name   AS patient_name,
                p.date_of_birth,
                p.gender,
                p.phone,
                du.full_name   AS doctor_name,
                d.specialty,
                d.clinic_name,
                d.rif,
                d.consultation_fee AS doctor_base_fee
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
            isShared,
            paymentReceived,
            paymentReference
        } = req.body;

        const userId = req.user.id;

        const [doctorRows] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
        if (!doctorRows || doctorRows.length === 0) {
            return res.status(403).json({ message: "No se encontró perfil de doctor para este usuario." });
        }
        const doctorId = doctorRows[0].id;

        const [appointmentRows] = await db.query(
            'SELECT id, type, payment_method, payment_status, appointment_date, start_time FROM appointments WHERE id = ? AND doctor_id = ?',
            [appointmentId, doctorId]
        );
        if (appointmentRows.length === 0) {
            return res.status(403).json({ message: "No tienes permiso para modificar esta cita." });
        }
        const appointment = appointmentRows[0];

        if (appointment.type === 'presencial' && appointment.payment_method === 'in_person' && appointment.payment_status !== 'paid' && !paymentReceived) {
            return res.status(409).json({ message: 'Debes confirmar el pago en consultorio antes de cerrar y emitir el kit de reembolso.' });
        }

        // Paso 1: Obtener la fecha y hora real de la cita
        const [apptRows] = await db.query(
            'SELECT appointment_date, start_time FROM appointments WHERE id = ?',
            [appointmentId]
        );
        const appt = apptRows[0];
        const startDatetime = `${appt.appointment_date.toISOString().slice(0, 10)} ${appt.start_time}`;

        const legalVerificationCode = `MPN-${appointmentId}-${Date.now().toString(36).toUpperCase()}`;
        const legalVerificationHash = crypto
            .createHash('sha256')
            .update(JSON.stringify({
                appointmentId,
                doctorId,
                paymentReceived: !!paymentReceived,
                paymentReference: paymentReference || null,
                isShared: !!isShared,
                report: { motivo_sintomas, antecedentes, hallazgos, diagnostico, tratamiento, estudios_observaciones },
            }))
            .digest('hex');

        // Paso 2: Crear o recuperar el registro de consultations para esta cita
        // (clinical_reports.consultation_id es FK → consultations.id)
        const [consultationRes] = await db.query(
            `INSERT INTO consultations (appointment_id, start_datetime, end_datetime)
             VALUES (?, ?, NOW())
             ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
            [appointmentId, startDatetime]
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

        await db.query(`
            UPDATE appointments
            SET status = 'completed',
                payment_status = CASE
                    WHEN ? = 1 THEN 'paid'
                    ELSE payment_status
                END,
                payment_reference = COALESCE(?, payment_reference),
                payment_collected_at = CASE
                    WHEN ? = 1 THEN NOW()
                    ELSE payment_collected_at
                END,
                legal_verification_code = ?,
                legal_verification_hash = ?
            WHERE id = ?
        `, [paymentReceived ? 1 : 0, paymentReference || null, paymentReceived ? 1 : 0, legalVerificationCode, legalVerificationHash, appointmentId]);

        // === INICIO DE GENERACION DE FACTURA ===
        // Importamos invoiceService justo aquí o al inicio del archivo
        const invoiceService = require('../utils/invoiceService');
        const path = require('path');
        const fs = require('fs');

        // Extraer todos los datos del paciente y doctor para la factura
        const [invoiceDataRows] = await db.query(`
            SELECT 
                a.consultation_fee_snapshot,
                a.type as appointmentType,
                a.appointment_date,
                a.patient_id,
                a.doctor_id,
                pu.full_name AS patientName,
                p.dni AS patientDni,
                p.phone AS patientPhone,
                du.full_name AS doctorName,
                d.rif AS doctorRif,
                d.phone AS doctorPhone,
                d.specialty
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN users pu ON p.user_id = pu.id
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users du ON d.user_id = du.id
            WHERE a.id = ?
        `, [appointmentId]);

        let pdfPath = null;
        
        if (invoiceDataRows.length > 0) {
            const data = invoiceDataRows[0];
            const baseAmount = data.consultation_fee_snapshot || 0;
            // Número de control correlativo simple con ID
            const invoiceNumber = `00-${String(appointmentId).padStart(5, '0')}`;

            // Insertamos a nivel de base de datos
            const [invoiceRes] = await db.query(`
                INSERT INTO invoices (appointment_id, doctor_id, patient_id, invoice_number, base_amount, total_amount, legal_text)
                VALUES (?, ?, ?, ?, ?, ?, 'Servicio Médico Exento de I.V.A. según Art. 19, Numeral 5 de la Ley del I.V.A.')
            `, [appointmentId, data.doctor_id, data.patient_id, invoiceNumber, baseAmount, baseAmount]);

            const invoiceLocalPath = path.join(__dirname, '..', 'public', 'uploads', 'invoices', `invoice_${invoiceNumber}.pdf`);
            pdfPath = `/uploads/invoices/invoice_${invoiceNumber}.pdf`;

            // Asegurar que la carpeta exista antes de escribir el PDF (Evita el error 500 ENOENT)
            const dir = path.dirname(invoiceLocalPath);
            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir, { recursive: true });
            }

            // Preparamos el payload a mandar al PDFKit
            const payload = {
                doctorName: data.doctorName,
                specialty: data.specialty,
                doctorRif: data.doctorRif || 'No registrado',
                doctorPhone: data.doctorPhone,
                invoiceNumber: invoiceNumber,
                patientName: data.patientName,
                patientDni: data.patientDni,
                patientPhone: data.patientPhone,
                appointmentType: data.appointmentType,
                appointmentDate: data.appointment_date,
                baseAmount: baseAmount,
                totalAmount: baseAmount,
                currency: 'USD',
                legalText: 'Servicio Médico Exento de I.V.A. según Art. 19, Numeral 5 de la Ley del I.V.A.'
            };

            await invoiceService.generateInvoicePDF(payload, invoiceLocalPath);
            await db.query('UPDATE invoices SET pdf_path = ? WHERE id = ?', [pdfPath, invoiceRes.insertId]);
            
            // Opcional: TODO - Anexar emailService para enviarlo por correo.
        }
        // === FIN DE GENERACION DE FACTURA ===

        res.status(200).json({
            message: "Historia clínica guardada y firmada exitosamente. Factura generada.",
            legalVerificationCode,
            legalVerificationHash,
            invoicePdf: pdfPath
        });

    } catch (error) {
        console.error("Error al guardar el cierre:", error);
        res.status(500).json({ message: "Error al guardar el informe clínico.", error: error.message });
    }
};
