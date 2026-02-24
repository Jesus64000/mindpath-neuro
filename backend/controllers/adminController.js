const db = require('../config/db');
const bcrypt = require('bcryptjs');
const path = require('path');

// ── Bootstrap: crear primer admin ─────────────────────────────────────────────
exports.bootstrapAdmin = async (req, res) => {
    try {
        const [existing] = await db.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
        if (existing.length > 0) {
            return res.status(409).json({ message: 'El administrador ya existe. Usa el login normal.' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash('admin123', salt);

        await db.query(
            "INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, 'admin')",
            ['admin@admin.com', password_hash, 'Super Admin']
        );

        res.status(201).json({ message: '✅ Admin creado. Email: admin@admin.com | Contraseña: admin123' });
    } catch (error) {
        console.error('Bootstrap error:', error);
        res.status(500).json({ message: 'Error al crear el admin.', detail: error.message });
    }
};

// ── Métricas globales ─────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
    try {
        const [
            [totalUsers],
            [totalDoctors],
            [pendingDoctors],
            [totalPatients],
            [completedAppts],
            [activeAppts],
            [cancelledAppts],
            [apptsByMonth],
            [topDoctors],
            [topSpecialties],
        ] = await Promise.all([
            db.query("SELECT COUNT(*) AS total FROM users WHERE role != 'admin'"),
            db.query("SELECT COUNT(*) AS total FROM doctors WHERE is_verified = TRUE"),
            db.query("SELECT COUNT(*) AS total FROM doctors WHERE is_verified = FALSE"),
            db.query("SELECT COUNT(*) AS total FROM patients"),
            db.query("SELECT COUNT(*) AS total FROM appointments WHERE status = 'completed'"),
            db.query("SELECT COUNT(*) AS total FROM appointments WHERE status IN ('confirmed','pending')"),
            db.query("SELECT COUNT(*) AS total FROM appointments WHERE status = 'cancelled'"),
            db.query(`
                SELECT MONTH(appointment_date) AS month, YEAR(appointment_date) AS year, COUNT(*) AS total
                FROM appointments
                WHERE appointment_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                GROUP BY YEAR(appointment_date), MONTH(appointment_date)
                ORDER BY year ASC, month ASC
            `),
            db.query(`
                SELECT u.full_name AS doctor_name, d.specialty, COUNT(a.id) AS total_appts
                FROM appointments a
                JOIN doctors d ON a.doctor_id = d.id
                JOIN users u ON d.user_id = u.id
                WHERE a.status = 'completed'
                GROUP BY a.doctor_id
                ORDER BY total_appts DESC
                LIMIT 5
            `),
            db.query(`
                SELECT d.specialty, COUNT(a.id) AS total_appts
                FROM appointments a
                JOIN doctors d ON a.doctor_id = d.id
                GROUP BY d.specialty
                ORDER BY total_appts DESC
                LIMIT 6
            `),
        ]);

        const completed = completedAppts[0]?.total || 0;
        const cancelled = cancelledAppts[0]?.total || 0;
        const confirmationRate = (completed + cancelled) > 0
            ? Math.round((completed / (completed + cancelled)) * 100)
            : 0;

        res.status(200).json({
            kpis: {
                totalUsers:       totalUsers[0]?.total || 0,
                totalDoctors:     totalDoctors[0]?.total || 0,
                pendingDoctors:   pendingDoctors[0]?.total || 0,
                totalPatients:    totalPatients[0]?.total || 0,
                completedAppts:   completed,
                activeAppts:      activeAppts[0]?.total || 0,
                cancelledAppts:   cancelled,
                confirmationRate,
            },
            apptsByMonth,
            topDoctors,
            topSpecialties,
        });
    } catch (error) {
        console.error('Error en getStats:', error);
        res.status(500).json({ message: 'Error al cargar métricas.' });
    }
};

// ── Verificación de doctores ──────────────────────────────────────────────────
exports.getPendingDoctors = async (req, res) => {
    try {
        const [doctors] = await db.query(`
            SELECT
                d.id,
                u.full_name,
                u.email,
                d.specialty,
                d.license_number,
                d.clinic_name,
                d.verification_notes,
                u.created_at
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            WHERE d.is_verified = FALSE
            ORDER BY u.created_at DESC
        `);
        res.status(200).json(doctors);
    } catch (error) {
        console.error('Error en getPendingDoctors:', error);
        res.status(500).json({ message: 'Error al cargar doctores pendientes.' });
    }
};

exports.verifyDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query(
            "UPDATE doctors SET is_verified = TRUE, verification_notes = NULL WHERE id = ?",
            [id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Doctor no encontrado.' });
        res.status(200).json({ message: 'Doctor verificado exitosamente.' });
    } catch (error) {
        console.error('Error en verifyDoctor:', error);
        res.status(500).json({ message: 'Error al verificar doctor.' });
    }
};

exports.rejectDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        const [result] = await db.query(
            "UPDATE doctors SET is_verified = FALSE, verification_notes = ? WHERE id = ?",
            [notes || 'Rechazado por el administrador.', id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Doctor no encontrado.' });
        res.status(200).json({ message: 'Doctor rechazado.' });
    } catch (error) {
        console.error('Error en rejectDoctor:', error);
        res.status(500).json({ message: 'Error al rechazar doctor.' });
    }
};

// ── Catálogo de especialidades ─────────────────────────────────────────────────
exports.getSpecialties = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM specialties ORDER BY name ASC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al cargar especialidades.' });
    }
};

exports.createSpecialty = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name?.trim()) return res.status(400).json({ message: 'El nombre es requerido.' });
        const [result] = await db.query('INSERT INTO specialties (name) VALUES (?)', [name.trim()]);
        res.status(201).json({ id: result.insertId, name: name.trim() });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'La especialidad ya existe.' });
        res.status(500).json({ message: 'Error al crear especialidad.' });
    }
};

exports.updateSpecialty = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name?.trim()) return res.status(400).json({ message: 'El nombre es requerido.' });
        const [result] = await db.query('UPDATE specialties SET name = ? WHERE id = ?', [name.trim(), id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Especialidad no encontrada.' });
        res.status(200).json({ message: 'Especialidad actualizada.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar especialidad.' });
    }
};

exports.deleteSpecialty = async (req, res) => {
    try {
        const { id } = req.params;
        // Guard: no eliminar si hay doctores con esa especialidad
        const [doctors] = await db.query(
            'SELECT COUNT(*) AS total FROM doctors WHERE specialty = (SELECT name FROM specialties WHERE id = ?)',
            [id]
        );
        if (doctors[0]?.total > 0) {
            return res.status(409).json({
                message: `No puedes eliminar esta especialidad: hay ${doctors[0].total} doctor(es) asociado(s).`
            });
        }
        const [result] = await db.query('DELETE FROM specialties WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Especialidad no encontrada.' });
        res.status(200).json({ message: 'Especialidad eliminada.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar especialidad.' });
    }
};

// ── Configuración del sistema (theming) ───────────────────────────────────────
exports.getSettings = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM system_settings WHERE id = 1');
        if (rows.length === 0) {
            return res.status(200).json({
                clinic_name:   'MindPath Neuro',
                logo_url:      null,
                primary_color: '#6D28D9',
                primary_hover: '#5B21B6',
            });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        // Si la tabla no existe aún, devolvemos defaults sin error
        console.warn('system_settings no disponible, usando defaults:', error.message);
        res.status(200).json({
            clinic_name:   'MindPath Neuro',
            logo_url:      null,
            primary_color: '#6D28D9',
            primary_hover: '#5B21B6',
        });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { clinic_name, logo_url, primary_color, primary_hover } = req.body;
        await db.query(`
            INSERT INTO system_settings (id, clinic_name, logo_url, primary_color, primary_hover)
            VALUES (1, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                clinic_name   = VALUES(clinic_name),
                logo_url      = VALUES(logo_url),
                primary_color = VALUES(primary_color),
                primary_hover = VALUES(primary_hover)
        `, [clinic_name, logo_url, primary_color, primary_hover]);
        res.status(200).json({ message: 'Configuración guardada exitosamente.' });
    } catch (error) {
        console.error('Error en updateSettings:', error);
        res.status(500).json({ message: 'Error al guardar configuración.' });
    }
};

exports.uploadLogo = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No se recibió ningún archivo.' });

        const logoUrl = `/uploads/logos/${req.file.filename}`;

        // Guardar la URL del logo en system_settings también
        await db.query(`
            INSERT INTO system_settings (id, logo_url) VALUES (1, ?)
            ON DUPLICATE KEY UPDATE logo_url = VALUES(logo_url)
        `, [logoUrl]);

        res.status(200).json({ message: 'Logo subido exitosamente.', logo_url: logoUrl });
    } catch (error) {
        console.error('Error en uploadLogo:', error);
        res.status(500).json({ message: 'Error al subir el logo.' });
    }
};
