// backend/config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Creamos el Pool de conexiones para escalabilidad
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10, // Máximo de conexiones concurrentes
    queueLimit: 0,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

// Función de auto-saneamiento para codificación de acentos corruptos
const cleanCorruptAccents = async () => {
    try {
        console.log('🔄 Ejecutando auto-saneamiento de codificación en base de datos...');
        const replacements = [
            { old: '├¡', new: 'í' },
            { old: '├©', new: 'é' },
            { old: '├®', new: 'é' },
            { old: '├-®', new: 'é' },
            { old: '├í', new: 'á' },
            { old: '├│', new: 'ó' },
            { old: '├║', new: 'ú' },
            { old: '├▒', new: 'ñ' },
            { old: '├ﾍ', new: 'Í' },
            { old: '├ﾉ', new: 'É' },
            { old: '├ﾁ', new: 'Á' },
            { old: '├ﾓ', new: 'Ó' },
            { old: '├ﾚ', new: 'Ú' },
            { old: '├ﾑ', new: 'Ñ' }
        ];

        const targets = [
            { table: 'clinics', columns: ['name'] },
            { table: 'specialties', columns: ['name'] },
            { table: 'doctors', columns: ['specialty', 'bio', 'education', 'clinic_name', 'clinic_address', 'languages'] },
            { table: 'patients', columns: ['medical_conditions', 'current_medications', 'address'] },
            { table: 'users', columns: ['full_name'] },
            { table: 'system_settings', columns: ['clinic_name'] },
            { table: 'payment_method_catalog', columns: ['name', 'description', 'default_details_template'] },
            { table: 'doctor_payment_methods', columns: ['method_name', 'account_details'] },
            { table: 'clinical_reports', columns: ['diagnostico', 'tratamiento', 'motivo_sintomas', 'antecedentes', 'hallazgos', 'estudios_observaciones'] }
        ];

        for (const target of targets) {
            const [tableExists] = await pool.query(`
                SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
            `, [target.table]);

            if (tableExists.length > 0) {
                for (const col of target.columns) {
                    let updateExpr = `\`${col}\``;
                    for (const r of replacements) {
                        updateExpr = `REPLACE(${updateExpr}, '${r.old}', '${r.new}')`;
                    }
                    const queryStr = `UPDATE \`${target.table}\` SET \`${col}\` = ${updateExpr} WHERE \`${col}\` IS NOT NULL`;
                    await pool.query(queryStr).catch(() => {});
                }
            }
        }
        console.log('✅ Base de datos saneada de caracteres corruptos de doble-encoding.');
    } catch (err) {
        console.error('❌ Error al sanear base de datos de acentos corruptos:', err.message);
    }
};

let isDbInitialized = false;

const initDbSchema = async () => {
    if (isDbInitialized) return;
    isDbInitialized = true;

    try {
        const connection = await pool.getConnection();
        console.log('✅ Socio, Base de Datos conectada exitosamente a:', process.env.DB_NAME);
        connection.release();

        // Si estamos en Vercel, omitimos conversiones pesadas en cada invocación serverless
        if (process.env.VERCEL) {
            console.log('⚡ Entorno Serverless Vercel detectado: omitiendo conversiones masivas de DDL en el hilo de petición.');
            return;
        }

        // Parche de esquema auto-sanador para system_settings (hide_sidebar_text)
        const [rows] = await pool.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'system_settings' AND COLUMN_NAME = 'hide_sidebar_text'
        `);

        if (rows && rows.length === 0) {
            console.log('🛠️ Parcheando base de datos: Agregando hide_sidebar_text a system_settings...');
            await pool.query(`ALTER TABLE system_settings ADD COLUMN hide_sidebar_text BOOLEAN NOT NULL DEFAULT FALSE AFTER logo_url`);
        }

        const convertTable = (table) => {
            return pool.query(`ALTER TABLE \`${table}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`)
                .then(() => console.log(`✓ Tabla ${table} convertida a utf8mb4_general_ci.`))
                .catch(err => console.warn(`⚠️ No se pudo convertir tabla ${table}:`, err.message));
        };

        await pool.query('SET foreign_key_checks = 0').catch(() => {});
        await convertTable('users');
        await convertTable('patients');
        await convertTable('doctors');
        await convertTable('clinics');
        await convertTable('specialties');
        await convertTable('payment_method_catalog');
        await convertTable('doctor_payment_methods');
        await convertTable('clinical_reports');
        await convertTable('appointments');
        await convertTable('consultations');
        await pool.query('SET foreign_key_checks = 1').catch(() => {});

        await cleanCorruptAccents();

        await pool.query(`
            CREATE TABLE IF NOT EXISTS stored_files (
                id INT AUTO_INCREMENT PRIMARY KEY,
                file_path VARCHAR(255) NOT NULL UNIQUE,
                file_data LONGTEXT NOT NULL,
                mimetype VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        await pool.query("CREATE TABLE IF NOT EXISTS clinics (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL UNIQUE, default_address VARCHAR(255) DEFAULT NULL)");
        await pool.query("CREATE TABLE IF NOT EXISTS study_types (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL UNIQUE)");
        await pool.query(`CREATE TABLE IF NOT EXISTS doctor_clinics (
            id INT AUTO_INCREMENT PRIMARY KEY,
            doctor_id INT NOT NULL,
            clinic_id INT NOT NULL,
            custom_address VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
            FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
            UNIQUE KEY unique_doctor_clinic (doctor_id, clinic_id)
        )`);

        try { await pool.query("ALTER TABLE doctors ADD COLUMN signature_picture VARCHAR(255) DEFAULT NULL"); } catch (e) {}
        try { await pool.query("ALTER TABLE doctors ADD COLUMN modality ENUM('online', 'presencial', 'ambas') DEFAULT 'ambas'"); } catch (e) {}
        try { await pool.query("ALTER TABLE doctor_schedules ADD COLUMN clinic_id INT DEFAULT NULL AFTER slot_duration"); } catch (e) {}
        try { await pool.query("ALTER TABLE clinics ADD COLUMN is_private BOOLEAN DEFAULT FALSE"); } catch (e) {}
        try { await pool.query("ALTER TABLE clinics ADD COLUMN owner_doctor_id INT DEFAULT NULL"); } catch (e) {}
        try { await pool.query("ALTER TABLE clinics ADD COLUMN is_verified BOOLEAN DEFAULT TRUE"); } catch (e) {}
        try { await pool.query("ALTER TABLE clinics ADD COLUMN clinic_type VARCHAR(100) DEFAULT 'Clínica Privada'"); } catch (e) {}
        try { await pool.query("ALTER TABLE clinics DROP INDEX name"); } catch (e) {}
        try { await pool.query("ALTER TABLE system_settings ADD COLUMN zego_app_id VARCHAR(100) DEFAULT NULL"); } catch (e) {}
        try { await pool.query("ALTER TABLE system_settings ADD COLUMN zego_server_secret VARCHAR(255) DEFAULT NULL"); } catch (e) {}
        try { await pool.query("ALTER TABLE system_settings ADD COLUMN logo_size INT DEFAULT 40"); } catch (e) {}
        try { await pool.query("ALTER TABLE system_settings ADD COLUMN logo_dark_url VARCHAR(255) DEFAULT NULL"); } catch (e) {}
        try { await pool.query("ALTER TABLE appointments ADD COLUMN clinic_id INT DEFAULT NULL AFTER doctor_ready"); } catch (e) {}
        try { await pool.query("ALTER TABLE users ADD COLUMN is_email_verified BOOLEAN DEFAULT TRUE"); } catch (e) {}
        try { await pool.query("ALTER TABLE users ADD COLUMN verification_token VARCHAR(255) DEFAULT NULL"); } catch (e) {}

        try { await pool.query("ALTER TABLE doctor_schedules ADD CONSTRAINT fk_doctor_schedules_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL"); } catch (e) {}
        try { await pool.query("ALTER TABLE appointments ADD CONSTRAINT fk_appointments_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL"); } catch (e) {}

        console.log('✅ Tablas y columnas verificadas/creadas.');
    } catch (err) {
        console.error('❌ Error no fatal en inicialización de BD:', err.message);
    }
};

// Iniciar en segundo plano sin bloquear exportación del pool
initDbSchema().catch(err => console.warn('⚠️ Falló inicialización de esquema BD:', err.message));

module.exports = pool;
