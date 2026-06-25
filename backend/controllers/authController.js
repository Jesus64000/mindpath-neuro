const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const { sendResetPasswordEmail, sendWelcomeEmail } = require('../utils/emailService');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─────────────────────────────────────────────────────────────
// Función auxiliar: genera el JWT y construye el objeto usuario
// ─────────────────────────────────────────────────────────────
const buildTokenAndUser = async (user) => {
    // Obtener foto de perfil según rol
    let profilePicture = null;
    if (user.role === 'patient') {
        const [rows] = await db.query('SELECT profile_picture FROM patients WHERE user_id = ?', [user.id]);
        if (rows.length > 0) profilePicture = rows[0].profile_picture;
    } else if (user.role === 'doctor') {
        const [rows] = await db.query('SELECT profile_picture FROM doctors WHERE user_id = ?', [user.id]);
        if (rows.length > 0) profilePicture = rows[0].profile_picture;
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });

    return {
        token,
        user: {
            id: user.id,
            full_name: user.full_name,
            role: user.role,
            email: user.email,
            profile_picture: profilePicture
        }
    };
};

// ─────────────────────────────────────────────────────────────
// REGISTRO DE USUARIO (tradicional)
// ─────────────────────────────────────────────────────────────
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
                'INSERT INTO users (email, password_hash, full_name, role, auth_provider) VALUES (?, ?, ?, ?, ?)',
                [email, password_hash, full_name, role, 'local']
            );
            const userId = userResult.insertId;

            // 5. Insertar en la tabla correspondiente según el rol
            if (role === 'doctor') {
                const {
                    specialty, phone, license_number, experience_years,
                    clinic_name, clinic_address, education, languages,
                    dni, modality, rif, title_picture, specialty_certificate,
                    consultation_fee, catalog_method_id, account_details,
                    clinics, payment_methods
                } = req.body;

                if (!specialty || !license_number) {
                    throw new Error('Especialidad y número de licencia son requeridos para doctores.');
                }

                // Resolver clínica por defecto para retrocompatibilidad
                let finalClinicName = clinic_name;
                let finalClinicAddress = clinic_address;
                if (clinics && Array.isArray(clinics) && clinics.length > 0) {
                    const firstClinic = clinics[0];
                    const [cRow] = await connection.query('SELECT name, default_address FROM clinics WHERE id = ?', [firstClinic.clinic_id]);
                    if (cRow.length > 0) {
                        finalClinicName = cRow[0].name;
                        finalClinicAddress = firstClinic.custom_address || cRow[0].default_address || null;
                    }
                }

                const [docResult] = await connection.query(
                    `INSERT INTO doctors
                    (user_id, specialty, phone, license_number, experience_years, clinic_name, clinic_address, education, languages, dni, modality, rif, title_picture, specialty_certificate, consultation_fee)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        userId, specialty, phone || null, license_number, experience_years || null,
                        finalClinicName || null, finalClinicAddress || null, education || null, languages || null,
                        dni || null, modality || 'ambas', rif || null, title_picture || null, specialty_certificate || null,
                        consultation_fee
                    ]
                );
                const doctorId = docResult.insertId;

                // Insertar múltiples clínicas en doctor_clinics
                if (clinics && Array.isArray(clinics)) {
                    const [onlineClinicRow] = await connection.query("SELECT id FROM clinics WHERE name = 'Mindpath Online'");
                    if (onlineClinicRow.length > 0) {
                        const onlineClinicId = onlineClinicRow[0].id;
                        const hasOnline = clinics.some(c => String(c.clinic_id) === String(onlineClinicId));
                        if (!hasOnline && (modality === 'online' || modality === 'ambas')) {
                            clinics.push({ clinic_id: onlineClinicId, custom_address: 'Consulta Virtual (Online)' });
                        }
                    }

                    for (const c of clinics) {
                        await connection.query(
                            `INSERT IGNORE INTO doctor_clinics (doctor_id, clinic_id, custom_address)
                             VALUES (?, ?, ?)`,
                            [doctorId, c.clinic_id, c.custom_address || null]
                        );
                    }
                } else if (clinic_name) {
                    const [cRow] = await connection.query('SELECT id FROM clinics WHERE name = ?', [clinic_name]);
                    if (cRow.length > 0) {
                        await connection.query(
                            `INSERT INTO doctor_clinics (doctor_id, clinic_id, custom_address)
                             VALUES (?, ?, ?)`,
                            [doctorId, cRow[0].id, clinic_address || null]
                        );
                    }
                }

                // Insertar múltiples métodos de pago en doctor_payment_methods
                if (payment_methods && Array.isArray(payment_methods) && payment_methods.length > 0) {
                    for (let i = 0; i < payment_methods.length; i++) {
                        const pm = payment_methods[i];
                        const [catalogRows] = await connection.query('SELECT name FROM payment_method_catalog WHERE id = ?', [pm.catalog_method_id]);
                        const methodName = pm.method_name || (catalogRows.length > 0 ? catalogRows[0].name : 'Método de Pago');
                        await connection.query(
                            `INSERT INTO doctor_payment_methods
                                (doctor_id, catalog_method_id, method_name, account_details, is_active, sort_order)
                             VALUES (?, ?, ?, ?, 1, ?)`,
                            [doctorId, pm.catalog_method_id, methodName, pm.account_details, pm.sort_order || (i + 1)]
                        );
                    }
                } else if (catalog_method_id && account_details) {
                    const [catalogRows] = await connection.query('SELECT name FROM payment_method_catalog WHERE id = ?', [catalog_method_id]);
                    const methodName = catalogRows.length > 0 ? catalogRows[0].name : 'Método Inicial';
                    await connection.query(
                        `INSERT INTO doctor_payment_methods
                            (doctor_id, catalog_method_id, method_name, account_details, is_active, sort_order)
                         VALUES (?, ?, ?, ?, 1, 1)`,
                        [doctorId, catalog_method_id, methodName, account_details]
                    );
                }
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

            // Enviar correo de bienvenida de forma asíncrona sin bloquear la respuesta
            sendWelcomeEmail(email, full_name, role).catch(err => {
                console.error('Error al enviar correo de bienvenida:', err);
            });

            res.status(201).json({ message: 'Usuario registrado exitosamente', userId });
        } catch (error) {
            await connection.rollback();
            connection.release();
            console.error('Error en la transacción de registro:', error);
            return res.status(400).json({ message: error.message || 'Error al registrar los detalles del usuario.' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor al registrar usuario.' });
    }
};

// ─────────────────────────────────────────────────────────────
// LOGIN TRADICIONAL (Email + Contraseña)
// ─────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Buscar al usuario
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        const user = users[0];

        // 2. Verificar si la cuenta es de Google (no tiene contraseña)
        if (user.auth_provider === 'google' || !user.password_hash) {
            return res.status(401).json({
                message: 'Esta cuenta está vinculada a Google. Usa el botón "Continuar con Google" para acceder.',
                isGoogleAccount: true
            });
        }

        // 3. Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // 4. Generar Token y responder
        const { token, user: userData } = await buildTokenAndUser(user);

        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            token,
            user: userData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor durante el inicio de sesión.' });
    }
};

// ─────────────────────────────────────────────────────────────
// GOOGLE AUTH — Paso 1: Verificar si el usuario ya existe
// ─────────────────────────────────────────────────────────────
exports.googleCheck = async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ message: 'Token de Google no proporcionado.' });
    }

    try {
        // 1. Verificar el token con Google
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { sub: google_id, email, name, picture } = payload;

        // 2. Buscar usuario existente por google_id o email
        const [users] = await db.query(
            'SELECT * FROM users WHERE google_id = ? OR email = ?',
            [google_id, email]
        );

        if (users.length > 0) {
            // Usuario ya existe → login directo
            const user = users[0];

            // Si el usuario existe por email pero no tiene google_id, vincularlo
            if (!user.google_id) {
                await db.query(
                    'UPDATE users SET google_id = ?, auth_provider = ? WHERE id = ?',
                    [google_id, 'google', user.id]
                );
            }

            const { token, user: userData } = await buildTokenAndUser(user);

            return res.status(200).json({
                exists: true,
                token,
                user: userData
            });
        }

        // 3. Usuario nuevo → devolver datos pre-llenados para el formulario
        res.status(200).json({
            exists: false,
            googleData: {
                google_id,
                email,
                full_name: name,
                picture
            }
        });

    } catch (error) {
        console.error('Error en googleCheck:', error);
        res.status(401).json({ message: 'Token de Google inválido. Por favor, intenta de nuevo.' });
    }
};

// ─────────────────────────────────────────────────────────────
// GOOGLE AUTH — Paso 2: Completar el perfil del nuevo usuario
// ─────────────────────────────────────────────────────────────
exports.googleComplete = async (req, res) => {
    const { google_id, email, full_name, role } = req.body;

    if (!google_id || !email || !full_name || !role) {
        return res.status(400).json({ message: 'Faltan datos obligatorios para completar el registro.' });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Verificar que no exista ya (doble seguridad)
        const [existing] = await connection.query(
            'SELECT id FROM users WHERE google_id = ? OR email = ?',
            [google_id, email]
        );
        if (existing.length > 0) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ message: 'Este correo ya está registrado.' });
        }

        // 2. Insertar en users (sin contraseña)
        const [userResult] = await connection.query(
            'INSERT INTO users (email, full_name, role, google_id, auth_provider) VALUES (?, ?, ?, ?, ?)',
            [email, full_name, role, google_id, 'google']
        );
        const userId = userResult.insertId;

        // 3. Insertar datos del rol
        if (role === 'doctor') {
            const {
                specialty, phone, license_number, experience_years,
                clinic_name, clinic_address, modality, rif, dni,
                consultation_fee, catalog_method_id, account_details,
                clinics, payment_methods
            } = req.body;

            if (!specialty || !license_number) {
                throw new Error('Especialidad y número de licencia son requeridos para doctores.');
            }

            // Resolver clínica por defecto para retrocompatibilidad
            let finalClinicName = clinic_name;
            let finalClinicAddress = clinic_address;
            if (clinics && Array.isArray(clinics) && clinics.length > 0) {
                const firstClinic = clinics[0];
                const [cRow] = await connection.query('SELECT name, default_address FROM clinics WHERE id = ?', [firstClinic.clinic_id]);
                if (cRow.length > 0) {
                    finalClinicName = cRow[0].name;
                    finalClinicAddress = firstClinic.custom_address || cRow[0].default_address || null;
                }
            }

            const [docResult] = await connection.query(
                `INSERT INTO doctors
                (user_id, specialty, phone, license_number, experience_years, clinic_name, clinic_address, modality, rif, dni, consultation_fee)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, specialty, phone || null, license_number, experience_years || null,
                 finalClinicName || null, finalClinicAddress || null, modality || 'ambas', rif || null, dni || null, consultation_fee]
            );
            const doctorId = docResult.insertId;

            // Insertar múltiples clínicas
            if (clinics && Array.isArray(clinics)) {
                const [onlineClinicRow] = await connection.query("SELECT id FROM clinics WHERE name = 'Mindpath Online'");
                if (onlineClinicRow.length > 0) {
                    const onlineClinicId = onlineClinicRow[0].id;
                    const hasOnline = clinics.some(c => String(c.clinic_id) === String(onlineClinicId));
                    if (!hasOnline && (modality === 'online' || modality === 'ambas')) {
                        clinics.push({ clinic_id: onlineClinicId, custom_address: 'Consulta Virtual (Online)' });
                    }
                }

                for (const c of clinics) {
                    await connection.query(
                        `INSERT IGNORE INTO doctor_clinics (doctor_id, clinic_id, custom_address)
                         VALUES (?, ?, ?)`,
                        [doctorId, c.clinic_id, c.custom_address || null]
                    );
                }
            } else if (clinic_name) {
                const [cRow] = await connection.query('SELECT id FROM clinics WHERE name = ?', [clinic_name]);
                if (cRow.length > 0) {
                    await connection.query(
                        `INSERT INTO doctor_clinics (doctor_id, clinic_id, custom_address)
                         VALUES (?, ?, ?)`,
                        [doctorId, cRow[0].id, clinic_address || null]
                    );
                }
            }

            // Insertar múltiples métodos de pago
            if (payment_methods && Array.isArray(payment_methods) && payment_methods.length > 0) {
                for (let i = 0; i < payment_methods.length; i++) {
                    const pm = payment_methods[i];
                    const [catalogRows] = await connection.query('SELECT name FROM payment_method_catalog WHERE id = ?', [pm.catalog_method_id]);
                    const methodName = pm.method_name || (catalogRows.length > 0 ? catalogRows[0].name : 'Método de Pago');
                    await connection.query(
                        `INSERT INTO doctor_payment_methods
                            (doctor_id, catalog_method_id, method_name, account_details, is_active, sort_order)
                         VALUES (?, ?, ?, ?, 1, ?)`,
                        [doctorId, pm.catalog_method_id, methodName, pm.account_details, pm.sort_order || (i + 1)]
                    );
                }
            } else if (catalog_method_id && account_details) {
                const [catalogRows] = await connection.query('SELECT name FROM payment_method_catalog WHERE id = ?', [catalog_method_id]);
                const methodName = catalogRows.length > 0 ? catalogRows[0].name : 'Método Inicial';
                await connection.query(
                    `INSERT INTO doctor_payment_methods (doctor_id, catalog_method_id, method_name, account_details, is_active, sort_order)
                     VALUES (?, ?, ?, ?, 1, 1)`,
                    [doctorId, catalog_method_id, methodName, account_details]
                );
            }

        } else if (role === 'patient') {
            const { date_of_birth, gender, phone, dni } = req.body;

            if (!date_of_birth || !gender) {
                throw new Error('Fecha de nacimiento y género son requeridos para pacientes.');
            }
            await connection.query(
                'INSERT INTO patients (user_id, date_of_birth, gender, phone, dni) VALUES (?, ?, ?, ?, ?)',
                [userId, date_of_birth, gender, phone || null, dni || null]
            );
        }

        await connection.commit();
        connection.release();

        // Enviar correo de bienvenida de forma asíncrona sin bloquear la respuesta
        sendWelcomeEmail(email, full_name, role).catch(err => {
            console.error('Error al enviar correo de bienvenida por Google:', err);
        });

        // 4. Generar JWT y responder
        const newUser = { id: userId, email, full_name, role };
        const { token, user: userData } = await buildTokenAndUser(newUser);

        res.status(201).json({
            message: 'Cuenta creada exitosamente',
            token,
            user: userData
        });

    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Error en googleComplete:', error);
        res.status(400).json({ message: error.message || 'Error al completar el registro.' });
    }
};

// ─────────────────────────────────────────────────────────────
// RECUPERACIÓN DE CONTRASEÑA — Solicitar enlace
// ─────────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const [users] = await db.query('SELECT id, full_name, email, auth_provider FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(200).json({ message: 'Si el correo está registrado, recibirás un enlace de recuperación pronto.' });
        }

        const user = users[0];

        // Verificar si la cuenta es de Google
        if (user.auth_provider === 'google') {
            return res.status(400).json({
                message: 'Tu cuenta está vinculada a Google. Usa el botón "Continuar con Google" para acceder.',
                isGoogleAccount: true
            });
        }

        // Generar Token Seguro
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hora

        // Guardar en DB
        await db.query(
            'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
            [resetToken, expires, user.id]
        );

        // Enviar correo
        await sendResetPasswordEmail(user.email, user.full_name, resetToken);

        res.status(200).json({ message: 'Si el correo está registrado, recibirás un enlace de recuperación pronto.' });

    } catch (error) {
        console.error('Error en forgotPassword:', error);
        res.status(500).json({ message: 'Error al procesar la solicitud de recuperación.' });
    }
};

// ─────────────────────────────────────────────────────────────
// RECUPERACIÓN DE CONTRASEÑA — Establecer nueva contraseña
// ─────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const [users] = await db.query(
            'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: 'El enlace de recuperación es inválido o ha expirado.' });
        }

        const userId = users[0].id;

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);

        await db.query(
            'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
            [password_hash, userId]
        );

        res.status(200).json({ message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.' });

    } catch (error) {
        console.error('Error en resetPassword:', error);
        res.status(500).json({ message: 'Error al restablecer la contraseña.' });
    }
};
