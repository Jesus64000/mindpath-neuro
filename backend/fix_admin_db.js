const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    try {
        const db = await mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'mindpath_db'
        });

        console.log('Aplicando migraciones faltantes (Admin & Roles)...');

        // 1. Roles y estado activo en users
        await db.query(`ALTER TABLE users MODIFY COLUMN role ENUM('doctor', 'patient', 'admin', 'supervisor') NOT NULL DEFAULT 'patient'`);
        console.log('✅ users.role actualizado');
        
        try {
            await db.query(`ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE`);
            console.log('✅ users.is_active agregada');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⚡ users.is_active ya existe');
            else throw e;
        }

        // 2. Columnas en doctors
        try {
            await db.query(`ALTER TABLE doctors ADD COLUMN is_verified BOOLEAN DEFAULT FALSE`);
            await db.query(`UPDATE doctors SET is_verified = TRUE WHERE is_verified IS NULL`);
            console.log('✅ doctors.is_verified agregada');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⚡ doctors.is_verified ya existe');
            else throw e;
        }

        try {
            await db.query(`ALTER TABLE doctors ADD COLUMN verification_notes TEXT`);
            console.log('✅ doctors.verification_notes agregada');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⚡ doctors.verification_notes ya existe');
            else throw e;
        }

        // 3. Tabla system_settings
        await db.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                id              INT          PRIMARY KEY DEFAULT 1,
                clinic_name     VARCHAR(255) NOT NULL DEFAULT 'MindPath Neuro',
                logo_url        VARCHAR(500) DEFAULT NULL,
                primary_color   VARCHAR(7)   NOT NULL DEFAULT '#6D28D9',
                primary_hover   VARCHAR(7)   NOT NULL DEFAULT '#5B21B6',
                updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT single_row CHECK (id = 1)
            )
        `);
        await db.query(`INSERT IGNORE INTO system_settings (id, clinic_name, primary_color, primary_hover) VALUES (1, 'MindPath Neuro', '#6D28D9', '#5B21B6')`);
        console.log('✅ system_settings creada');

        console.log('🚀 Migración completada exitosamente.');
        process.exit(0);
    } catch (e) {
        console.error('❌ Error applying migrations:', e);
        process.exit(1);
    }
})();
