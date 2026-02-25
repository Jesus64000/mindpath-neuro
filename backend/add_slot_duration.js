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

        console.log('Aplicando migración final de Sprint 28...');
        try {
            await db.query(`ALTER TABLE doctor_schedules ADD COLUMN slot_duration INT DEFAULT 30`);
            console.log('✅ doctor_schedules.slot_duration agregada al esquema');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⚡ slot_duration ya estaba agregada');
            else throw e;
        }

        process.exit(0);
    } catch (e) {
        console.error('❌ Error applying migrations:', e);
        process.exit(1);
    }
})();
