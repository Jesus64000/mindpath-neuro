const express = require('express');
const router = express.Router();
const emailService = require('../utils/emailService');

router.post('/send', async (req, res) => {
    const { email, type, name, minutes_remaining, reason } = req.body;

    if (!email) {
        return res.status(400).json({ ok: false, message: 'El correo de destino es requerido.' });
    }

    const testName = name || 'Usuario de Pruebas';
    const testReason = reason || 'No cumple con las credenciales requeridas.';
    const testToken = 'TOKEN_DE_PRUEBA_123456';

    // Calcular fecha y hora dinámicas de la cita basándonos en los minutos restantes solicitados
    const minutes = Number(minutes_remaining) || 30;
    const now = new Date();
    // Sumar los minutos indicados a la hora actual en Caracas (-04:00)
    const futureTime = new Date(now.getTime() + (minutes * 60 * 1000));
    
    // Obtener la fecha en formato YYYY-MM-DD
    const caracasTime = new Date(futureTime.getTime() - (4 * 60 * 60 * 1000));
    const year = caracasTime.getUTCFullYear();
    const month = String(caracasTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(caracasTime.getUTCDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Obtener la hora en formato HH:MM:SS
    const hour = String(caracasTime.getUTCHours()).padStart(2, '0');
    const min = String(caracasTime.getUTCMinutes()).padStart(2, '0');
    const sec = String(caracasTime.getUTCSeconds()).padStart(2, '0');
    const timeStr = `${hour}:${min}:${sec}`;

    // Objeto de cita mockeado
    const apptMock = {
        id: 9999,
        appointment_date: dateStr,
        start_time: timeStr,
        type: 'virtual',
        clinic_name: 'Centro Clínico Neuro-Intelligent',
        clinic_address: 'Av. Libertador, Torre Francisco de Miranda, Piso 10, Consultorio 10-A, Caracas',
        consultation_fee_snapshot: 50.00,
        payment_method: 'Pago por plataforma',
        payment_status: 'paid',
        doctor_name: 'Mario Castañeda',
        doctor_specialty: 'Neurorradiología'
    };

    try {
        console.log(`[TEST-EMAIL] Enviando correo de tipo "${type}" a "${email}" con offset de ${minutes} min...`);
        
        switch (type) {
            case 'verification':
                await emailService.sendVerificationEmail(email, testName, testToken);
                break;
            case 'confirmation':
                await emailService.sendAppointmentConfirmationEmail(email, testName, apptMock);
                break;
            case 'reminder':
                await emailService.sendAppointmentReminderEmail(email, testName, apptMock, 'reminder_offset');
                break;
            case 'welcome':
                await emailService.sendWelcomeEmail(email, testName);
                break;
            case 'reset_password':
                await emailService.sendResetPasswordEmail(email, testName, testToken);
                break;
            case 'approval':
                await emailService.sendDoctorApprovalEmail(email, testName);
                break;
            case 'rejection':
                await emailService.sendDoctorRejectionEmail(email, testName, testReason);
                break;
            default:
                return res.status(400).json({ ok: false, message: `Tipo de correo inválido: ${type}` });
        }

        res.status(200).json({ ok: true, message: `Correo de tipo "${type}" enviado con éxito a ${email}.` });
    } catch (error) {
        console.error('[TEST-EMAIL] Error enviando correo:', error);
        res.status(500).json({ ok: false, message: 'Error interno al enviar el correo.', error: error.message });
    }
});

module.exports = router;
