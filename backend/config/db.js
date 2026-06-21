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

// Test de conexión inmediato al arrancar
pool.getConnection()
    .then(connection => {
        console.log('✅ Socio, Base de Datos conectada exitosamente a:', process.env.DB_NAME);
        connection.release(); // Liberamos la conexión de vuelta al pool
        
        // Parche de esquema auto-sanador para system_settings (hide_sidebar_text)
        return pool.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'system_settings' AND COLUMN_NAME = 'hide_sidebar_text'
        `);
    })
    .then(([rows]) => {
        if (rows && rows.length === 0) {
            console.log('🛠️ Parcheando base de datos: Agregando hide_sidebar_text a system_settings...');
            return pool.query(`ALTER TABLE system_settings ADD COLUMN hide_sidebar_text BOOLEAN NOT NULL DEFAULT FALSE AFTER logo_url`);
        }
    })
    .then(() => {
        console.log('✅ Base de datos verificada y saneada con hide_sidebar_text.');
        
        // Convertir tablas clave a utf8mb4_general_ci desactivando temporalmente FK checks para evitar errores de restricción en Windows
        const convertTable = (table) => {
            return pool.query(`ALTER TABLE \`${table}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`)
                .then(() => console.log(`✓ Tabla ${table} convertida a utf8mb4_general_ci.`))
                .catch(err => console.warn(`⚠️ No se pudo convertir tabla ${table}:`, err.message));
        };

        return pool.query('SET foreign_key_checks = 0')
            .then(() => convertTable('users'))
            .then(() => convertTable('patients'))
            .then(() => convertTable('doctors'))
            .then(() => convertTable('clinics'))
            .then(() => convertTable('specialties'))
            .then(() => convertTable('payment_method_catalog'))
            .then(() => convertTable('doctor_payment_methods'))
            .then(() => convertTable('clinical_reports'))
            .then(() => convertTable('appointments'))
            .then(() => convertTable('consultations'))
            .then(() => pool.query('SET foreign_key_checks = 1'))
            .catch((err) => {
                console.error('⚠️ Error al convertir tablas a utf8mb4:', err.message);
                return pool.query('SET foreign_key_checks = 1').catch(() => {});
            })
            .then(() => cleanCorruptAccents());
    })
    .then(() => {
        console.log('✅ Saneamiento de acentos completado al inicio.');
        // Crear tabla stored_files si no existe para persistencia de archivos
        return pool.query(`
            CREATE TABLE IF NOT EXISTS stored_files (
                id INT AUTO_INCREMENT PRIMARY KEY,
                file_path VARCHAR(255) NOT NULL UNIQUE,
                file_data LONGTEXT NOT NULL,
                mimetype VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
    })
    .then(() => {
        console.log('✅ Tabla stored_files para persistencia de archivos verificada.');
    })
    .catch(err => {
        console.error('❌ Error fatal en inicialización/parche de BD:', err.message);
    });

module.exports = pool;
