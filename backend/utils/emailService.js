const nodemailer = require('nodemailer');
const db = require('../config/db');
const { decrypt } = require('./encryption');

/**
 * Helper interno para obtener el transportador SMTP dinámico desde la base de datos
 */
const getMailTransporter = async () => {
    let smtp_email = null;
    let decryptedPassword = null;

    try {
        const [settings] = await db.query('SELECT smtp_email, smtp_password FROM system_settings LIMIT 1');
        if (settings && settings[0] && settings[0].smtp_email && settings[0].smtp_password) {
            smtp_email = settings[0].smtp_email.trim();
            decryptedPassword = decrypt(settings[0].smtp_password);
            if (!decryptedPassword) {
                decryptedPassword = settings[0].smtp_password; // Intentar en texto plano si desencriptado da null
            }
        }
    } catch (err) {
        console.warn('Advertencia al consultar system_settings para SMTP:', err.message);
    }

    // Fallback a variables de entorno si no está en la BD
    if (!smtp_email || !decryptedPassword) {
        smtp_email = process.env.SMTP_EMAIL || process.env.GMAIL_USER;
        decryptedPassword = process.env.SMTP_PASSWORD || process.env.GMAIL_PASS;
    }

    if (!smtp_email || !decryptedPassword) {
        throw new Error('Configuración SMTP no encontrada. Por favor ingresa el correo y la Contraseña de Aplicación en el Panel de Administración (Integraciones & APIs).');
    }

    // Limpiar espacios en blanco que Google agrega a las contraseñas de aplicación (ej: "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
    const cleanPassword = String(decryptedPassword).replace(/\s+/g, '');

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // SSL directo para máxima compatibilidad en Vercel
        auth: {
            user: smtp_email.trim(),
            pass: cleanPassword
        },
        tls: {
            rejectUnauthorized: false
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000
    });

    return { transporter, smtp_email: smtp_email.trim() };
};

/**
 * Envía un correo electrónico para el restablecimiento de contraseña.
 */
const sendResetPasswordEmail = async (userEmail, userName, resetToken) => {
    try {
        const { transporter, smtp_email } = await getMailTransporter();
        const frontendBase = process.env.FRONTEND_URL || 'https://mindpath-neuro.vercel.app';
        const resetUrl = `${frontendBase.replace(/\/$/, '')}/reset-password?token=${resetToken}`;

        const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Restablecer contraseña — Mindpath Neuro</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4ff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4ff;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- CABECERA -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#4f46e5 50%,#7c3aed 100%);border-radius:20px 20px 0 0;padding:40px 40px 35px;text-align:center;">
              <div style="margin-bottom:16px;">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="12" fill="rgba(255,255,255,0.15)"/>
                  <path d="M9.5 6C8 6 6.5 7.2 6.5 9c0 .8.3 1.5.7 2-.4.4-.7 1-.7 1.7 0 1.1.7 2 1.8 2.3C8 15.5 7.5 16.2 7.5 17h1c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5h1c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5h1c0-.8-.5-1.5-1.3-1.8 1-.3 1.8-1.2 1.8-2.3 0-.6-.3-1.2-.7-1.6.5-.5.7-1.2.7-2 0-1.8-1.5-3-3-3-.7 0-1.3.2-1.8.6C10.8 6.2 10.2 6 9.5 6z" fill="white" opacity="0.9"/>
                </svg>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Mindpath Neuro</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Seguridad de la Cuenta</p>
            </td>
          </tr>

          <!-- CUERPO PRINCIPAL -->
          <tr>
            <td style="background:#ffffff;padding:40px;border-left:1px solid #e8eaf6;border-right:1px solid #e8eaf6;">
              <h2 style="margin:0 0 8px;color:#1e1b4b;font-size:22px;font-weight:700;">Hola, ${userName} 👋</h2>
              <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong style="color:#6366f1;">Mindpath Neuro</strong>.
              </p>

              <div style="height:3px;background:linear-gradient(90deg,#6366f1,#7c3aed,#a78bfa);border-radius:3px;margin-bottom:28px;"></div>

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

              <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0 0 8px;">¿El botón no funciona? Copia y pega este enlace en tu navegador:</p>
              <p style="word-break:break-all;text-align:center;margin:0;">
                <a href="${resetUrl}" style="color:#6366f1;font-size:12px;text-decoration:underline;">${resetUrl}</a>
              </p>
            </td>
          </tr>

          <!-- AVISO -->
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

        await transporter.sendMail({
            from: `"Mindpath Neuro" <${smtp_email}>`,
            to: userEmail,
            subject: '🔐 Restablece tu contraseña — Mindpath Neuro',
            html: htmlContent
        });

        return { success: true };
    } catch (error) {
        console.error('Error en sendResetPasswordEmail:', error);
        throw error;
    }
};

/**
 * Envía un correo electrónico de bienvenida personalizado al registrarse.
 */
const sendWelcomeEmail = async (userEmail, userName, role) => {
    try {
        const { transporter, smtp_email } = await getMailTransporter();
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        let roleContent = '';
        if (role === 'doctor') {
            roleContent = `
              <p style="margin:0 0 20px;color:#64748b;font-size:15px;line-height:1.6;">
                Nos alegra enormemente contar contigo como profesional de la salud en nuestra plataforma. 
                Actualmente, tu perfil médico ha sido registrado y se encuentra en <strong>proceso de revisión</strong> por parte de nuestro equipo administrativo para certificar tus datos y licencia profesional.
              </p>
              <div style="background:#fffbeb;border:1px solid #fef3c7;border-left:4px solid #d97706;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0;color:#92400e;font-size:14px;line-height:1.7;">
                  ⏳ &nbsp;<strong>Estado: En Revisión</strong><br>
                  Te enviaremos una notificación por correo electrónico de manera inmediata tan pronto como tu perfil haya sido verificado y aprobado para que puedas configurar tu agenda y comenzar a recibir pacientes.
                </p>
              </div>
            `;
        } else {
            roleContent = `
              <p style="margin:0 0 20px;color:#64748b;font-size:15px;line-height:1.6;">
                ¡Tu cuenta de paciente ha sido creada con éxito! A partir de este momento tienes acceso a nuestro selecto directorio de especialistas para agendar consultas virtuales o presenciales, acceder a tus informes y gestionar tus recetas médicas de forma segura.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${frontendUrl}/login"
                   style="display:inline-block;background:linear-gradient(135deg,#6366f1,#7c3aed);color:#ffffff;text-decoration:none;padding:18px 48px;border-radius:14px;font-size:15px;font-weight:800;letter-spacing:0.5px;box-shadow:0 8px 24px rgba(99,102,241,0.40);">
                  Acceder a mi Cuenta
                </a>
              </div>
            `;
        }

        const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>¡Bienvenido a Mindpath Neuro!</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4ff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4ff;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- CABECERA -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#4f46e5 50%,#7c3aed 100%);border-radius:20px 20px 0 0;padding:40px 40px 35px;text-align:center;">
              <div style="margin-bottom:16px;">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="12" fill="rgba(255,255,255,0.15)"/>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.25z" fill="white" opacity="0.9"/>
                </svg>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Mindpath Neuro</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Bienvenido a la Plataforma</p>
            </td>
          </tr>

          <!-- CUERPO PRINCIPAL -->
          <tr>
            <td style="background:#ffffff;padding:40px;border-left:1px solid #e8eaf6;border-right:1px solid #e8eaf6;">
              <h2 style="margin:0 0 8px;color:#1e1b4b;font-size:22px;font-weight:700;">¡Hola, ${userName}! 👋</h2>
              <p style="margin:0 0 20px;color:#64748b;font-size:15px;line-height:1.6;">
                Te damos una calurosa bienvenida a <strong>Mindpath Neuro</strong>. Nos complace enormemente que formes parte de nuestra plataforma de salud digital y telemedicina inteligente.
              </p>

              <div style="height:3px;background:linear-gradient(90deg,#6366f1,#7c3aed,#a78bfa);border-radius:3px;margin-bottom:28px;"></div>

              ${roleContent}

              <p style="color:#64748b;font-size:14px;line-height:1.6;margin-top:20px;">
                Si tienes alguna duda o necesitas soporte durante tu experiencia, recuerda que puedes contactarnos respondiendo directamente a este correo electrónico o a través de nuestro canal de ayuda.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc;border-radius:0 0 20px 20px;border:1px solid #e8eaf6;border-top:none;padding:28px 40px;text-align:center;">
              <p style="margin:0 0 6px;color:#94a3b8;font-size:12px;">
                Este correo fue enviado automáticamente por Mindpath Neuro.
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

        await transporter.sendMail({
            from: `"Mindpath Neuro" <${smtp_email}>`,
            to: userEmail,
            subject: '👋 ¡Te damos la bienvenida a Mindpath Neuro!',
            html: htmlContent
        });

        return { success: true };
    } catch (error) {
        console.error('Error en sendWelcomeEmail:', error);
        throw error;
    }
};

/**
 * Envía un correo electrónico notificando la aprobación del perfil de médico.
 */
const sendDoctorApprovalEmail = async (doctorEmail, doctorName) => {
    try {
        const { transporter, smtp_email } = await getMailTransporter();
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>¡Perfil Aprobado! — Mindpath Neuro</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4ff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4ff;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- CABECERA -->
          <tr>
            <td style="background:linear-gradient(135deg,#10b981 0%,#059669 50%,#047857 100%);border-radius:20px 20px 0 0;padding:40px 40px 35px;text-align:center;">
              <div style="margin-bottom:16px;">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="12" fill="rgba(255,255,255,0.15)"/>
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white" opacity="0.9"/>
                </svg>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Mindpath Neuro</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Verificación Exitosa</p>
            </td>
          </tr>

          <!-- CUERPO PRINCIPAL -->
          <tr>
            <td style="background:#ffffff;padding:40px;border-left:1px solid #e8eaf6;border-right:1px solid #e8eaf6;">
              <h2 style="margin:0 0 8px;color:#1e1b4b;font-size:22px;font-weight:700;">¡Excelentes noticias, Dr. ${doctorName}! 🎉</h2>
              <p style="margin:0 0 20px;color:#64748b;font-size:15px;line-height:1.6;">
                Nos complace informarte que nuestro equipo de administración ha verificado y **aprobado tu perfil médico** de manera exitosa en Mindpath Neuro.
              </p>

              <div style="height:3px;background:linear-gradient(90deg,#10b981,#059669,#34d399);border-radius:3px;margin-bottom:28px;"></div>

              <div style="background:#f0fdf4;border:1px solid #dcfce7;border-left:4px solid #10b981;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0;color:#14532d;font-size:14px;line-height:1.7;">
                  ✅ &nbsp;<strong>¡Tu cuenta ya está activa!</strong><br>
                  Tu perfil ya es visible en el directorio público y los pacientes pueden agendar citas contigo. Te invitamos a configurar tus métodos de cobro adicionales, definir tus horarios y comenzar a proveer consultas de telemedicina de alta calidad.
                </p>
              </div>

              <!-- BOTÓN CTA -->
              <div style="text-align:center;margin:32px 0;">
                <a href="${frontendUrl}/login"
                   style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#ffffff;text-decoration:none;padding:18px 48px;border-radius:14px;font-size:15px;font-weight:800;letter-spacing:0.5px;box-shadow:0 8px 24px rgba(16,185,129,0.40);">
                  Ingresar a mi Panel de Control
                </a>
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc;border-radius:0 0 20px 20px;border:1px solid #e8eaf6;border-top:none;padding:28px 40px;text-align:center;">
              <p style="margin:0 0 6px;color:#94a3b8;font-size:12px;">
                Este correo fue enviado automáticamente por Mindpath Neuro.
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

        await transporter.sendMail({
            from: `"Mindpath Neuro" <${smtp_email}>`,
            to: doctorEmail,
            subject: '🎉 ¡Tu cuenta de médico ha sido aprobada! — Mindpath Neuro',
            html: htmlContent
        });

        return { success: true };
    } catch (error) {
        console.error('Error en sendDoctorApprovalEmail:', error);
        throw error;
    }
};

/**
 * Envía un correo electrónico notificando el rechazo u observaciones en el registro de médico.
 */
const sendDoctorRejectionEmail = async (doctorEmail, doctorName, reason) => {
    try {
        const { transporter, smtp_email } = await getMailTransporter();
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Observaciones en tu Registro — Mindpath Neuro</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4ff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4ff;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- CABECERA -->
          <tr>
            <td style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 50%,#b91c1c 100%);border-radius:20px 20px 0 0;padding:40px 40px 35px;text-align:center;">
              <div style="margin-bottom:16px;">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="12" fill="rgba(255,255,255,0.15)"/>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="white" opacity="0.9"/>
                </svg>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Mindpath Neuro</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Revisión de Registro</p>
            </td>
          </tr>

          <!-- CUERPO PRINCIPAL -->
          <tr>
            <td style="background:#ffffff;padding:40px;border-left:1px solid #e8eaf6;border-right:1px solid #e8eaf6;">
              <h2 style="margin:0 0 8px;color:#1e1b4b;font-size:22px;font-weight:700;">Hola, Dr. ${doctorName}</h2>
              <p style="margin:0 0 20px;color:#64748b;font-size:15px;line-height:1.6;">
                Lamentamos informarte que tu solicitud de verificación de cuenta de médico en Mindpath Neuro posee observaciones y no ha podido ser aprobada en esta ocasión.
              </p>

              <div style="height:3px;background:linear-gradient(90deg,#ef4444,#dc2626,#f87171);border-radius:3px;margin-bottom:28px;"></div>

              <div style="background:#fef2f2;border:1px solid #fee2e2;border-left:4px solid #ef4444;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
                <h3 style="margin:0 0 6px;color:#991b1b;font-size:14px;font-weight:700;">Motivo de la observación detallado por administración:</h3>
                <p style="margin:0;color:#b91c1c;font-size:14px;line-height:1.7;font-style:italic;">
                  "${reason}"
                </p>
              </div>

              <p style="color:#64748b;font-size:14px;line-height:1.6;margin-bottom:24px;">
                Te invitamos a iniciar sesión en la plataforma para corregir o complementar los datos observados para que nuestro equipo pueda realizar una nueva verificación a la brevedad.
              </p>

              <!-- BOTÓN CTA -->
              <div style="text-align:center;margin:32px 0;">
                <a href="${frontendUrl}/login"
                   style="display:inline-block;background:linear-gradient(135deg,#ef4444,#dc2626);color:#ffffff;text-decoration:none;padding:18px 48px;border-radius:14px;font-size:15px;font-weight:800;letter-spacing:0.5px;box-shadow:0 8px 24px rgba(239,68,68,0.40);">
                  Corregir mi Perfil
                </a>
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc;border-radius:0 0 20px 20px;border:1px solid #e8eaf6;border-top:none;padding:28px 40px;text-align:center;">
              <p style="margin:0 0 6px;color:#94a3b8;font-size:12px;">
                Este correo fue enviado automáticamente por Mindpath Neuro.
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

        await transporter.sendMail({
            from: `"Mindpath Neuro" <${smtp_email}>`,
            to: doctorEmail,
            subject: '⚠️ Solicitud de registro con observaciones — Mindpath Neuro',
            html: htmlContent
        });

        return { success: true };
    } catch (error) {
        console.error('Error en sendDoctorRejectionEmail:', error);
        throw error;
    }
};

const sendTestEmailService = async (targetEmail) => {
    const { transporter, smtp_email } = await getMailTransporter();
    await transporter.sendMail({
        from: `"Mindpath Neuro" <${smtp_email}>`,
        to: targetEmail,
        subject: '🧪 Prueba de Servidor SMTP — Mindpath Neuro',
        html: `
            <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;padding:30px;background:#f0f4ff;border-radius:16px;max-width:500px;margin:0 auto;">
                <h2 style="color:#4f46e5;margin-top:0;">✅ ¡Servidor SMTP Operativo!</h2>
                <p style="color:#334155;line-height:1.6;">Este es un correo de verificación enviado desde <strong>Mindpath Neuro</strong> utilizando las credenciales SMTP configuradas en el Panel de Administración.</p>
                <div style="background:#ffffff;padding:15px;border-radius:10px;border:1px solid #cbd5e1;margin:20px 0;">
                    <p style="margin:0;font-size:13px;color:#64748b;"><strong>Remitente Emisor:</strong> ${smtp_email}</p>
                    <p style="margin:5px 0 0 0;font-size:13px;color:#64748b;"><strong>Destinatario:</strong> ${targetEmail}</p>
                </div>
                <p style="font-size:12px;color:#94a3b8;margin-bottom:0;">Todos los correos de verificación de cuenta, restablecimiento de contraseña y notificaciones utilizarán este servidor.</p>
            </div>
        `
    });
    return { success: true };
};

module.exports = {
    sendResetPasswordEmail,
    sendWelcomeEmail,
    sendDoctorApprovalEmail,
    sendDoctorRejectionEmail,
    sendTestEmailService
};
