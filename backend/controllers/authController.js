const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const { sendResetPasswordEmail } = require('../utils/emailService');

// REGISTRO DE USUARIO
exports.register = async (req, res) => {
    const { email, password, full_name, role } = req.body;

    try {
        // 1. Verificar si el usuario ya existe
        const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'El correo ya está registrado.' });
        }

        // 2. Encriptar la contraseña (Salt de 10 rondas)
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 3. Iniciar transacción
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // 4. Insertar en la tabla users
            const [userResult] = await connection.query(
                'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
                [email, password_hash, full_name, role]
            );
            const userId = userResult.insertId;

            // 5. Insertar en la tabla correspondiente según el rol
            if (role === 'doctor') {
                const { 
                    specialty, phone, license_number, experience_years, 
                    clinic_name, clinic_address, education, languages,
                    dni, modality, rif, title_picture, specialty_certificate,
                    consultation_fee, catalog_method_id, account_details
                } = req.body;

                if (!specialty || !license_number) {
                    throw new Error('Especialidad y número de licencia son requeridos para doctores.');
                }
                if (!consultation_fee || !catalog_method_id || !account_details) {
                    throw new Error('La tarifa de consulta y al menos un método de pago son requeridos.');
                }

                const [docResult] = await connection.query(
                    `INSERT INTO doctors 
                    (user_id, specialty, phone, license_number, experience_years, clinic_name, clinic_address, education, languages, dni, modality, rif, title_picture, specialty_certificate, consultation_fee) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        userId, specialty, phone || null, license_number, experience_years || null, 
                        clinic_name || null, clinic_address || null, education || null, languages || null,
                        dni || null, modality || 'ambas', rif || null, title_picture || null, specialty_certificate || null,
                        consultation_fee
                    ]
                );
                const doctorId = docResult.insertId;

                // Insertar primer método de pago
                const [catalogRows] = await connection.query('SELECT name FROM payment_method_catalog WHERE id = ?', [catalog_method_id]);
                const methodName = catalogRows.length > 0 ? catalogRows[0].name : 'Método Inicial';

                await connection.query(
                    `INSERT INTO doctor_payment_methods
                        (doctor_id, catalog_method_id, method_name, account_details, is_active, sort_order)
                     VALUES (?, ?, ?, ?, 1, 1)`,
                    [doctorId, catalog_method_id, methodName, account_details]
                );
            } else if (role === 'patient') {
                const { phone, date_of_birth, gender, address, dni } = req.body;

                if (!date_of_birth || !gender) {
                    throw new Error('Fecha de nacimiento y género son requeridos para pacientes.');
                }
                await connection.query(
                    'INSERT INTO patients (user_id, date_of_birth, gender, phone, dni) VALUES (?, ?, ?, ?, ?)',
                    [userId, date_of_birth, gender, phone || null, dni || null]
                );
            }

            // 6. Confirmar transacción
            await connection.commit();
            connection.release();

            res.status(201).json({ message: 'Usuario registrado exitosamente', userId });
        } catch (error) {
            // Revertir transacción en caso de error
            await connection.rollback();
            connection.release();
            console.error("Error en la transacción de registro:", error);
            return res.status(400).json({ message: error.message || 'Error al registrar los detalles del usuario.' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor al registrar usuario.' });
    }
};

// LOGIN DE USUARIO
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Buscar al usuario
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        const user = users[0];

        // 2. Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // 3. Obtener la foto de perfil dependiendo del rol
        let profilePicture = null;
        if (user.role === 'patient') {
            const [patientRows] = await db.query('SELECT profile_picture FROM patients WHERE user_id = ?', [user.id]);
            if (patientRows.length > 0) profilePicture = patientRows[0].profile_picture;
        } else if (user.role === 'doctor') {
            const [doctorRows] = await db.query('SELECT profile_picture FROM doctors WHERE user_id = ?', [user.id]);
            if (doctorRows.length > 0) profilePicture = doctorRows[0].profile_picture;
        }

        // 4. Generar el Token JWT
        const payload = {
            id: user.id,
            role: user.role
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

        res.status(200).json({
            message: 'Login exitoso',
            token,
            user: { 
                id: user.id, 
                full_name: user.full_name, 
                role: user.role, 
                email: user.email,
                profile_picture: profilePicture
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor durante el login.' });
    }
};

// SOLICITAR RECUPERACIÓN (Self-Service)
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        // 1. Verificar si el usuario existe
        const [users] = await db.query('SELECT id, full_name, email FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            // Por seguridad, no revelamos si el email existe o no, pero detenemos aquí.
            return res.status(200).json({ message: 'Si el correo está registrado, recibirás un enlace de recuperación pronto.' });
        }

        const user = users[0];

        // 2. Generar Token Seguro
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hora

        // 3. Guardar en DB (Limpiando tokens previos)
        await db.query(
            'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
            [resetToken, expires, user.id]
        );

        // 4. Enviar Email
        await sendResetPasswordEmail(user.email, user.full_name, resetToken);

        res.status(200).json({ message: 'Si el correo está registrado, recibirás un enlace de recuperación pronto.' });

    } catch (error) {
        console.error("Error en forgotPassword:", error);
        res.status(500).json({ message: 'Error al procesar la solicitud de recuperación.' });
    }
};

// RESTABLECER CONTRASEÑA (Fase 3)
exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        // 1. Buscar usuario con un token válido y no expirado
        const [users] = await db.query(
            'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: 'El token de recuperación es inválido o ha expirado.' });
        }

        const userId = users[0].id;

        // 2. Encriptar la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);

        // 3. Actualizar contraseña y limpiar token (One-time use)
        await db.query(
            'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
            [password_hash, userId]
        );

        res.status(200).json({ message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.' });

    } catch (error) {
        console.error("Error en resetPassword:", error);
        res.status(500).json({ message: 'Error al restablecer la contraseña.' });
    }
};
