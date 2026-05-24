const nodemailer = require('nodemailer');
const db = require('../config/db');
const { decrypt } = require('./encryption');

/**
 * Servicio dinámico de envío de correos.
 * Extrae la configuración SMTP de la base de datos y desencripta la contraseña.
 */
const sendResetPasswordEmail = async (userEmail, userName, resetToken) => {
    try {
        // 1. Obtener configuración SMTP de la base de datos
        const [settings] = await db.query('SELECT smtp_email, smtp_password FROM system_settings LIMIT 1');

        if (!settings || !settings[0] || !settings[0].smtp_email || !settings[0].smtp_password) {
            throw new Error('Configuración SMTP no encontrada. El administrador debe configurarla en el panel.');
        }

        const { smtp_email, smtp_password } = settings[0];
        const decryptedPassword = decrypt(smtp_password);

        if (!decryptedPassword) {
            throw new Error('Error al desencriptar la contraseña SMTP.');
        }

        // 2. Configurar Nodemailer con Gmail
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: smtp_email,
                pass: decryptedPassword
            }
        });

        // 3. Enlace de recuperación (apunta al frontend)
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

        // 4. Plantilla HTML Premium — 100% en español
        const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Restablecer contraseña — Mindpath Neuro</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4ff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">

  <!-- Contenedor principal -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4ff;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- CABECERA con gradiente -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#4f46e5 50%,#7c3aed 100%);border-radius:20px 20px 0 0;padding:40px 40px 35px;text-align:center;">
              <!-- Ícono cerebro inline SVG -->
              <div style="margin-bottom:16px;">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="12" fill="rgba(255,255,255,0.15)"/>
                  <path d="M9.5 6C8 6 6.5 7.2 6.5 9c0 .8.3 1.5.7 2-.4.4-.7 1-.7 1.7 0 1.1.7 2 1.8 2.3C8 15.5 7.5 16.2 7.5 17h1c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5h1c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5h1c0-.8-.5-1.5-1.3-1.8 1-.3 1.8-1.2 1.8-2.3 0-.6-.3-1.2-.7-1.6.5-.5.7-1.2.7-2 0-1.8-1.5-3-3-3-.7 0-1.3.2-1.8.6C10.8 6.2 10.2 6 9.5 6z" fill="white" opacity="0.9"/>
                  <circle cx="9.5" cy="10" r="1" fill="#6366f1"/>
                  <circle cx="14.5" cy="10" r="1" fill="#6366f1"/>
                </svg>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Mindpath Neuro</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Seguridad de la Cuenta</p>
            </td>
          </tr>

          <!-- CUERPO PRINCIPAL -->
          <tr>
            <td style="background:#ffffff;padding:40px;border-left:1px solid #e8eaf6;border-right:1px solid #e8eaf6;">

              <!-- Saludo -->
              <h2 style="margin:0 0 8px;color:#1e1b4b;font-size:22px;font-weight:700;">Hola, ${userName} 👋</h2>
              <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong style="color:#6366f1;">Mindpath Neuro</strong>.
              </p>

              <!-- Separador decorativo -->
              <div style="height:3px;background:linear-gradient(90deg,#6366f1,#7c3aed,#a78bfa);border-radius:3px;margin-bottom:28px;"></div>

              <!-- Caja informativa -->
              <div style="background:#f8f7ff;border:1px solid #e0e7ff;border-left:4px solid #6366f1;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0;color:#4c1d95;font-size:14px;line-height:1.7;">
                  🔐 &nbsp;Este enlace es de <strong>un solo uso</strong> y caducará en <strong>1 hora</strong> por motivos de seguridad. Si no solicitaste este cambio, puedes ignorar este correo con total tranquilidad.
                </p>
              </div>

              <!-- BOTÓN CTA -->
              <div style="text-align:center;margin:32px 0;">
                <a href="${resetUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#6366f1,#7c3aed);color:#ffffff;text-decoration:none;padding:18px 48px;border-radius:14px;font-size:15px;font-weight:800;letter-spacing:0.5px;box-shadow:0 8px 24px rgba(99,102,241,0.40);">
                  Restablecer mi contraseña
                </a>
              </div>

              <!-- URL alternativa -->
              <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0 0 8px;">¿El botón no funciona? Copia y pega este enlace en tu navegador:</p>
              <p style="word-break:break-all;text-align:center;margin:0;">
                <a href="${resetUrl}" style="color:#6366f1;font-size:12px;text-decoration:underline;">${resetUrl}</a>
              </p>

            </td>
          </tr>

          <!-- AVISO DE SEGURIDAD -->
          <tr>
            <td style="background:#fef9ec;border:1px solid #fde68a;border-top:none;padding:20px 40px;border-left:1px solid #e8eaf6;border-right:1px solid #e8eaf6;">
              <p style="margin:0;color:#92400e;font-size:13px;line-height:1.6;">
                ⚠️ &nbsp;<strong>¿No fuiste tú?</strong> Si no solicitaste restablecer tu contraseña, te recomendamos revisar tu cuenta y cambiar tu contraseña por seguridad.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc;border-radius:0 0 20px 20px;border:1px solid #e8eaf6;border-top:none;padding:28px 40px;text-align:center;">
              <p style="margin:0 0 6px;color:#94a3b8;font-size:12px;">
                Este correo fue enviado automáticamente. Por favor, no respondas a este mensaje.
              </p>
              <p style="margin:0;color:#cbd5e1;font-size:11px;">
                &copy; 2026 <strong>Mindpath Neuro Intelligent</strong> &nbsp;·&nbsp; Todos los derechos reservados
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
        `;

        // 5. Enviar el correo
        await transporter.sendMail({
            from: `"Mindpath Neuro" <${smtp_email}>`,
            to: userEmail,
            subject: '🔐 Restablece tu contraseña — Mindpath Neuro',
            html: htmlContent
        });

        return { success: true };
    } catch (error) {
        console.error('Error en el servicio de correo:', error);
        throw error;
    }
};

module.exports = { sendResetPasswordEmail };
