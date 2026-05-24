/**
 * Migración: Agregar columnas de Google OAuth a la tabla users
 * 
 * Ejecutar con: node backend/migrations/add_google_auth.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../config/db');

async function migrate() {
    console.log('🔄 Iniciando migración: Google OAuth columns...');

    const connection = await db.getConnection();

    try {
        // Verificar si la columna google_id ya existe
        const [cols] = await connection.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'google_id'`,
            [process.env.DB_NAME || 'mindpath_db']
        );

        if (cols.length > 0) {
            console.log('✅ Las columnas de Google OAuth ya existen. No se requiere migración.');
            connection.release();
            process.exit(0);
        }

        // Agregar columnas
        await connection.query(`
            ALTER TABLE users
            ADD COLUMN google_id VARCHAR(255) NULL UNIQUE AFTER email,
            ADD COLUMN auth_provider ENUM('local', 'google') NOT NULL DEFAULT 'local' AFTER google_id;
        `);

        // Hacer password_hash opcional (para usuarios de Google)
        await connection.query(`
            ALTER TABLE users
            MODIFY COLUMN password_hash VARCHAR(255) NULL;
        `);

        console.log('✅ Migración completada exitosamente.');
        console.log('   + Columna google_id (VARCHAR 255, UNIQUE, nullable)');
        console.log('   + Columna auth_provider (ENUM: local|google, default: local)');
        console.log('   + password_hash ahora es nullable (para cuentas Google)');

    } catch (error) {
        console.error('❌ Error durante la migración:', error.message);
        process.exit(1);
    } finally {
        connection.release();
        process.exit(0);
    }
}

migrate();
