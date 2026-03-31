const db = require('../config/db');

async function migrate() {
    console.log("🚀 Iniciando migración de la Fase 3...");
    
    try {
        // 1. Añadir columnas de recuperación a la tabla 'users'
        console.log("🛠️  Parcheando tabla 'users'...");
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS reset_token_expires DATETIME DEFAULT NULL;
        `);
        console.log("✅ Tabla 'users' actualizada.");

        // 2. Añadir columnas SMTP a la tabla 'system_settings'
        console.log("🛠️  Parcheando tabla 'system_settings'...");
        await db.query(`
            ALTER TABLE system_settings 
            ADD COLUMN IF NOT EXISTS smtp_email VARCHAR(255) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS smtp_password VARCHAR(255) DEFAULT NULL;
        `);
        console.log("✅ Tabla 'system_settings' actualizada.");

        console.log("\n✨ Migración completada exitosamente.");
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Error durante la migración:", error);
        process.exit(1);
    }
}

migrate();
