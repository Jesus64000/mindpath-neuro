const nodemailer = require('nodemailer');
const db = require('../config/db');
const { decrypt } = require('./encryption');

/**
 * Servicio dinámico de envío de correos
 * Extrae la configuración SMTP de la base de datos y desencripta la contraseña.
 */
const sendResetPasswordEmail = async (userEmail, userName, resetToken) => {
    try {
        // 1. Obtener configuración SMTP de la base de datos
        const [settings] = await db.query('SELECT smtp_email, smtp_password FROM system_settings LIMIT 1');
        
        if (!settings || !settings[0] || !settings[0].smtp_email || !settings[0].smtp_password) {
            throw new Error("Configuración SMTP no encontrada en la base de datos. El administrador debe configurarla.");
        }

        const { smtp_email, smtp_password } = settings[0];
        const decryptedPassword = decrypt(smtp_password);

        if (!decryptedPassword) {
            throw new Error("Error al desencriptar la contraseña SMTP.");
        }

        // 2. Configurar el transportador de Nodemailer (GMAIL por defecto)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: smtp_email,
                pass: decryptedPassword
            }
        });

        // 3. Definir el enlace de recuperación (Frontend)
        const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;

        // 4. Plantilla HTML Premium
        const htmlContent = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background-color: #f8fafc; padding: 40px; border-radius: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #6366f1; margin: 0; font-size: 28px; font-weight: 800;">Mindpath Neuro</h1>
                    <p style="color: #64748b; font-size: 14px; margin-top: 5px; text-transform: uppercase; tracking: 0.1em;">Seguridad y Acceso</p>
                </div>
                
                <div style="background-color: #ffffff; padding: 30px; border-radius: 15px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                    <h2 style="margin-top: 0; color: #0f172a;">Hola, ${userName}</h2>
                    <p style="line-height: 1.6; color: #475569;">
                        Se ha solicitado un restablecimiento de contraseña para tu cuenta en <strong>Mindpath Neuro</strong>. 
                        Este enlace es de un solo uso y caducará en 1 hora por motivos de seguridad.
                    </p>
                    
                    <div style="text-align: center; margin: 35px 0;">
                        <a href="${resetUrl}" style="background-color: #6366f1; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);">
                            RESTABLECER MI CONTRASEÑA
                        </a>
                    </div>
                    
                    <p style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
                        Si tú no solicitaste este cambio, puedes ignorar este correo de forma segura. 
                        Tu contraseña actual no cambiará hasta que accedas al enlace y completes el proceso.
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                    <p style="font-size: 11px; color: #94a3b8; margin: 0;">&copy; 2026 Mindpath Neuro Intelligent. Todos los derechos reservados.</p>
                </div>
            </div>
        `;

        // 5. Enviar el correo
        await transporter.sendMail({
            from: `"Mindpath Neuro Support" <${smtp_email}>`,
            to: userEmail,
            subject: "🔐 Restablecer tu contraseña - Mindpath Neuro",
            html: htmlContent
        });

        return { success: true };
    } catch (error) {
        console.error("Error en el servicio de email:", error);
        throw error;
    }
};

module.exports = { sendResetPasswordEmail };
