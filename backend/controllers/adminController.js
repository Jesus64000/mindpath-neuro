const db = require("../config/db");
const bcrypt = require("bcryptjs");
const path = require("path");
const crypto = require("crypto");
const { encrypt } = require("../utils/encryption");
const { sendResetPasswordEmail } = require("../utils/emailService");

// ── Bootstrap: crear primer admin ─────────────────────────────────────────────
exports.bootstrapAdmin = async (req, res) => {
  try {
    const [existing] = await db.query(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1",
    );
    if (existing.length > 0) {
      return res
        .status(409)
        .json({ message: "El administrador ya existe. Usa el login normal." });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash("admin123", salt);

    await db.query(
      "INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, 'admin')",
      ["admin@admin.com", password_hash, "Super Admin"],
    );

    res
      .status(201)
      .json({
        message:
          "✅ Admin creado. Email: admin@admin.com | Contraseña: admin123",
      });
  } catch (error) {
    console.error("Bootstrap error:", error);
    res
      .status(500)
      .json({ message: "Error al crear el admin.", detail: error.message });
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
      db.query(
        "SELECT COUNT(*) AS total FROM doctors WHERE is_verified = TRUE",
      ),
      db.query(
        "SELECT COUNT(*) AS total FROM doctors WHERE is_verified = FALSE",
      ),
      db.query("SELECT COUNT(*) AS total FROM patients"),
      db.query(
        "SELECT COUNT(*) AS total FROM appointments WHERE status = 'completed'",
      ),
      db.query(
        "SELECT COUNT(*) AS total FROM appointments WHERE status IN ('confirmed','pending')",
      ),
      db.query(
        "SELECT COUNT(*) AS total FROM appointments WHERE status = 'cancelled'",
      ),
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
    const confirmationRate =
      completed + cancelled > 0
        ? Math.round((completed / (completed + cancelled)) * 100)
        : 0;

    res.status(200).json({
      kpis: {
        totalUsers: totalUsers[0]?.total || 0,
        totalDoctors: totalDoctors[0]?.total || 0,
        pendingDoctors: pendingDoctors[0]?.total || 0,
        totalPatients: totalPatients[0]?.total || 0,
        completedAppts: completed,
        activeAppts: activeAppts[0]?.total || 0,
        cancelledAppts: cancelled,
        confirmationRate,
      },
      apptsByMonth,
      topDoctors,
      topSpecialties,
    });
  } catch (error) {
    console.error("Error en getStats:", error);
    res.status(500).json({ message: "Error al cargar métricas." });
  }
};

// ── Verificación de doctores ──────────────────────────────────────────────────
exports.getPendingDoctors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [totalRes] = await db.query("SELECT COUNT(*) AS total FROM doctors WHERE is_verified = FALSE");
    const total = totalRes[0].total;

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
            LIMIT ? OFFSET ?
        `, [limit, offset]);

    res.status(200).json({
        data: doctors,
        pagination: { total, page, totalPages: Math.ceil(total / limit), limit }
    });
  } catch (error) {
    console.error("Error en getPendingDoctors:", error);
    res.status(500).json({ message: "Error al cargar doctores pendientes." });
  }
};

exports.verifyDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query(
      "UPDATE doctors SET is_verified = TRUE, verification_notes = NULL WHERE id = ?",
      [id],
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Doctor no encontrado." });
    res.status(200).json({ message: "Doctor verificado exitosamente." });
  } catch (error) {
    console.error("Error en verifyDoctor:", error);
    res.status(500).json({ message: "Error al verificar doctor." });
  }
};

exports.rejectDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const [result] = await db.query(
      "UPDATE doctors SET is_verified = FALSE, verification_notes = ? WHERE id = ?",
      [notes || "Rechazado por el administrador.", id],
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Doctor no encontrado." });
    res.status(200).json({ message: "Doctor rechazado." });
  } catch (error) {
    console.error("Error en rejectDoctor:", error);
    res.status(500).json({ message: "Error al rechazar doctor." });
  }
};

// ── Catálogo de especialidades ─────────────────────────────────────────────────
exports.getSpecialties = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [totalRes] = await db.query("SELECT COUNT(*) AS total FROM specialties");
    const total = totalRes[0].total;

    const [rows] = await db.query(
      "SELECT * FROM specialties ORDER BY name ASC LIMIT ? OFFSET ?",
      [limit, offset]
    );

    res.status(200).json({
        data: rows,
        pagination: { total, page, totalPages: Math.ceil(total / limit), limit }
    });
  } catch (error) {
    console.error("Error en getSpecialties:", error);
    res.status(500).json({ message: "Error al cargar especialidades." });
  }
};

exports.createSpecialty = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim())
      return res.status(400).json({ message: "El nombre es requerido." });
    const [result] = await db.query(
      "INSERT INTO specialties (name) VALUES (?)",
      [name.trim()],
    );
    res.status(201).json({ id: result.insertId, name: name.trim() });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "La especialidad ya existe." });
    res.status(500).json({ message: "Error al crear especialidad." });
  }
};

exports.updateSpecialty = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name?.trim())
      return res.status(400).json({ message: "El nombre es requerido." });
    const [result] = await db.query(
      "UPDATE specialties SET name = ? WHERE id = ?",
      [name.trim(), id],
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Especialidad no encontrada." });
    res.status(200).json({ message: "Especialidad actualizada." });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar especialidad." });
  }
};

exports.deleteSpecialty = async (req, res) => {
  try {
    const { id } = req.params;
    // Guard: no eliminar si hay doctores con esa especialidad
    const [doctors] = await db.query(
      "SELECT COUNT(*) AS total FROM doctors WHERE specialty = (SELECT name FROM specialties WHERE id = ?)",
      [id],
    );
    if (doctors[0]?.total > 0) {
      return res.status(409).json({
        message: `No puedes eliminar esta especialidad: hay ${doctors[0].total} doctor(es) asociado(s).`,
      });
    }
    const [result] = await db.query("DELETE FROM specialties WHERE id = ?", [
      id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Especialidad no encontrada." });
    res.status(200).json({ message: "Especialidad eliminada." });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar especialidad." });
  }
};

// ── Configuración del sistema (theming) ───────────────────────────────────────
exports.getSettings = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM system_settings WHERE id = 1");
    if (rows.length === 0) {
      return res.status(200).json({
        clinic_name: "MindPath Neuro",
        logo_url: null,
        primary_color: "#6D28D9",
        primary_hover: "#5B21B6",
      });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    // Si la tabla no existe aún, devolvemos defaults sin error
    console.warn(
      "system_settings no disponible, usando defaults:",
      error.message,
    );
    res.status(200).json({
      clinic_name: "MindPath Neuro",
      logo_url: null,
      primary_color: "#6D28D9",
      primary_hover: "#5B21B6",
    });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { 
        clinic_name, logo_url, primary_color, primary_hover, font_family,
        smtp_email, smtp_password 
    } = req.body;

    let encryptedPassword = null;
    if (smtp_password) {
        encryptedPassword = encrypt(smtp_password);
    }

    await db.query(
      `
            INSERT INTO system_settings (id, clinic_name, logo_url, primary_color, primary_hover, font_family, smtp_email, smtp_password)
            VALUES (1, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                clinic_name   = VALUES(clinic_name),
                logo_url      = VALUES(logo_url),
                primary_color = VALUES(primary_color),
                primary_hover = VALUES(primary_hover),
                font_family   = VALUES(font_family),
                smtp_email    = VALUES(smtp_email),
                smtp_password = COALESCE(VALUES(smtp_password), smtp_password)
        `,
      [
          clinic_name, logo_url, primary_color, primary_hover, font_family || 'Inter',
          smtp_email || null, encryptedPassword || null
      ],
    );
    res.status(200).json({ message: "Configuración guardada exitosamente." });
  } catch (error) {
    console.error("Error en updateSettings:", error);
    res.status(500).json({ message: "Error al guardar configuración." });
  }
};

exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No se recibió ningún archivo." });

    const logoUrl = `/uploads/logos/${req.file.filename}`;

    await db.query(
      `
            INSERT INTO system_settings (id, logo_url) VALUES (1, ?)
            ON DUPLICATE KEY UPDATE logo_url = VALUES(logo_url)
        `,
      [logoUrl],
    );

    res
      .status(200)
      .json({ message: "Logo subido exitosamente.", logo_url: logoUrl });
  } catch (error) {
    console.error("Error en uploadLogo:", error);
    res.status(500).json({ message: "Error al subir el logo." });
  }
};

// ── Gestión de usuarios ────────────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const { search = "", role = "" } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let baseQuery = `
            FROM users u
            LEFT JOIN doctors d ON d.user_id = u.id
            WHERE 1=1
        `;
    const params = [];

    if (search.trim()) {
      baseQuery += " AND (u.full_name LIKE ? OR u.email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (role === "staff") {
      baseQuery += " AND u.role IN ('admin', 'supervisor')";
    } else if (role) {
      baseQuery += " AND u.role = ?";
      params.push(role);
    } else {
      baseQuery += " AND u.role NOT IN ('admin', 'supervisor')";
    }

    // Contar total
    const [totalRes] = await db.query(`SELECT COUNT(*) AS total ${baseQuery}`, params);
    const total = totalRes[0].total;

    // Ejecutar paginación
    const sql = `
            SELECT
                u.id, u.email, u.full_name, u.role,
                COALESCE(u.is_active, 1) AS is_active,
                u.created_at,
                d.specialty,
                d.is_verified,
                d.license_number
            ${baseQuery}
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
        `;
    const [users] = await db.query(sql, [...params, limit, offset]);

    res.status(200).json({
        data: users,
        pagination: { total, page, totalPages: Math.ceil(total / limit), limit }
    });
  } catch (error) {
    console.error("Error en getUsers:", error);
    res.status(500).json({ message: "Error al cargar usuarios." });
  }
};

exports.toggleUserActive = async (req, res) => {
  try {
    const { id } = req.params;

    // No suspenderse a sí mismo ni a otro admin
    const [target] = await db.query("SELECT role FROM users WHERE id = ?", [
      id,
    ]);
    if (!target.length)
      return res.status(404).json({ message: "Usuario no encontrado." });
    if (
      ["admin", "supervisor"].includes(target[0].role) &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "No puedes suspender a otro staff." });
    }
    if (target[0].role === "admin") {
      return res
        .status(403)
        .json({ message: "No se puede suspender al Super Admin." });
    }

    await db.query(
      "UPDATE users SET is_active = NOT COALESCE(is_active, 1) WHERE id = ?",
      [id],
    );
    const [updated] = await db.query(
      "SELECT is_active FROM users WHERE id = ?",
      [id],
    );
    res
      .status(200)
      .json({
        message: "Estado actualizado.",
        is_active: updated[0].is_active,
      });
  } catch (error) {
    console.error("Error en toggleUserActive:", error);
    res.status(500).json({ message: "Error al actualizar estado." });
  }
};

exports.changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const allowedRoles = ["doctor", "patient", "supervisor"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Rol inválido." });
    }
    const [target] = await db.query("SELECT role FROM users WHERE id = ?", [
      id,
    ]);
    if (!target.length)
      return res.status(404).json({ message: "Usuario no encontrado." });
    if (target[0].role === "admin") {
      return res
        .status(403)
        .json({ message: "No se puede cambiar el rol del Super Admin." });
    }

    await db.query("UPDATE users SET role = ? WHERE id = ?", [role, id]);
    res.status(200).json({ message: `Rol actualizado a ${role}.` });
  } catch (error) {
    console.error("Error en changeUserRole:", error);
    res.status(500).json({ message: "Error al cambiar rol." });
  }
};

exports.createSupervisor = async (req, res) => {
  try {
    const { email, full_name, password } = req.body;
    if (!email || !full_name || !password) {
      return res
        .status(400)
        .json({ message: "Email, nombre y contraseña son requeridos." });
    }
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (existing.length > 0)
      return res.status(409).json({ message: "El email ya está registrado." });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      "INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, 'supervisor')",
      [email, password_hash, full_name],
    );
    res
      .status(201)
      .json({
        message: `Supervisor ${full_name} creado.`,
        id: result.insertId,
      });
  } catch (error) {
    console.error("Error en createSupervisor:", error);
    res.status(500).json({ message: "Error al crear supervisor." });
  }
};
// ── Historial cruzado y Perfil Completo (Fase 2.3 - Datos Exhaustivos) ─────────
exports.getUserDetailsAndHistory = async (req, res) => {
    const { id } = req.params; 

    try {
        // 1. Datos Base del Usuario
        const [userRes] = await db.query('SELECT id, email, full_name, role, is_active, created_at FROM users WHERE id = ?', [id]);
        if (userRes.length === 0) return res.status(404).json({ message: "Usuario no encontrado" });
        const baseUser = userRes[0];

        let profile = {};
        let history = [];

        // 2. Si es PACIENTE: Traemos su ficha médica/personal completa
        if (baseUser.role === 'patient') {
            const [patRes] = await db.query(`
                SELECT dni, date_of_birth, gender, phone, address, 
                       health_insurance, emergency_contact 
                FROM patients WHERE user_id = ?
            `, [id]);
            if (patRes.length > 0) profile = patRes[0];

            const [appointments] = await db.query(`
                SELECT a.appointment_date, a.start_time, a.status, d.specialty, u.full_name as counterparty_name
                FROM appointments a
                JOIN doctors d ON a.doctor_id = d.id
                JOIN users u ON d.user_id = u.id
                WHERE a.patient_id = (SELECT id FROM patients WHERE user_id = ?)
                ORDER BY a.appointment_date DESC
                LIMIT 10
            `, [id]);
            history = appointments;
        } 
        // 3. Si es DOCTOR: Traemos su ficha profesional completa (incluyendo experiencia, bio, rif, etc)
        else if (baseUser.role === 'doctor') {
            const [docRes] = await db.query(`
                SELECT dni, specialty, license_number, modality, clinic_name, clinic_address,
                       consultation_fee, experience_years, languages, education, bio, rif
                FROM doctors WHERE user_id = ?
            `, [id]);
            if (docRes.length > 0) profile = docRes[0];

            const [appointments] = await db.query(`
                SELECT a.appointment_date, a.start_time, a.status, u.full_name as counterparty_name
                FROM appointments a
                JOIN patients p ON a.patient_id = p.id
                JOIN users u ON p.user_id = u.id
                WHERE a.doctor_id = (SELECT id FROM doctors WHERE user_id = ?)
                ORDER BY a.appointment_date DESC
                LIMIT 10
            `, [id]);
            history = appointments;
        }

        res.json({ user: baseUser, profile, history });

    } catch (error) {
        console.error("Error obteniendo detalles del usuario:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// ── Enviar Email de Recuperación (Fase 3) ──────────────────────────────────────
exports.sendResetEmail = async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Verificar usuario
        const [users] = await db.query('SELECT email, full_name FROM users WHERE id = ?', [id]);
        if (users.length === 0) return res.status(404).json({ message: "Usuario no encontrado" });
        
        const user = users[0];

        // 2. Generar Token Seguro (64 caracteres)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hora de validez

        // 3. Guardar en DB
        await db.query(
            'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
            [resetToken, expires, id]
        );

        // 4. Disparar Correo Electrónico
        await sendResetPasswordEmail(user.email, user.full_name, resetToken);

        res.status(200).json({ message: `Correo de recuperación enviado a ${user.email}` });

    } catch (error) {
        console.error("Error enviando email de recuperación:", error);
        res.status(500).json({ message: error.message || "Error al enviar el correo." });
    }
};

// ── Gestión de Citas Globales (Sprint 39-40) ──────────────────────────────────
exports.getAllAppointments = async (req, res) => {
    try {
        const { status, search } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        let baseQuery = `
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN users p_user ON p.user_id = p_user.id
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users d_user ON d.user_id = d_user.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            baseQuery += ` AND a.status = ?`;
            params.push(status);
        }

        if (search && search.trim()) {
            baseQuery += ` AND (p_user.full_name LIKE ? OR d_user.full_name LIKE ? OR p_user.email LIKE ?)`;
            const s = `%${search}%`;
            params.push(s, s, s);
        }

        // 1. Contar totales
        const [countRes] = await db.query(`SELECT COUNT(*) as total ${baseQuery}`, params);
        const total = countRes[0].total;

        // 2. Obtener datos paginados
        const query = `
            SELECT a.id, a.appointment_date, a.start_time, a.status, a.type, 
                   p_user.full_name AS patient_name, 
                   d_user.full_name AS doctor_name, d.specialty
            ${baseQuery}
            ORDER BY a.appointment_date DESC, a.start_time DESC
            LIMIT ? OFFSET ?
        `;

        const [appointments] = await db.query(query, [...params, limit, offset]);
        
        res.json({
            data: appointments,
            pagination: { total, page, totalPages: Math.ceil(total / limit), limit }
        });
    } catch (error) {
        console.error("Error obteniendo todas las citas:", error);
        res.status(500).json({ message: "Error al obtener citas" });
    }
};
