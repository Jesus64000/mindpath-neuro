const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// REGISTRO DE USUARIO
exports.register = async (req, res) => {
    const { email, password, full_name, role, specialty, license_number, date_of_birth, gender, phone } = req.body;

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
                if (!specialty || !license_number) {
                    throw new Error('Especialidad y número de licencia son requeridos para doctores.');
                }
                await connection.query(
                    'INSERT INTO doctors (user_id, specialty, license_number) VALUES (?, ?, ?)',
                    [userId, specialty, license_number]
                );
            } else if (role === 'patient') {
                if (!date_of_birth || !gender) {
                    throw new Error('Fecha de nacimiento y género son requeridos para pacientes.');
                }
                await connection.query(
                    'INSERT INTO patients (user_id, date_of_birth, gender, phone) VALUES (?, ?, ?, ?)',
                    [userId, date_of_birth, gender, phone]
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

        // 3. Generar el Token JWT
        const payload = {
            id: user.id,
            role: user.role
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

        res.status(200).json({
            message: 'Login exitoso',
            token,
            user: { id: user.id, full_name: user.full_name, role: user.role, email: user.email }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor durante el login.' });
    }
};
