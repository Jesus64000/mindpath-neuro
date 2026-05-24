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
    waitForConnections: true,
    connectionLimit: 10, // Máximo de conexiones concurrentes
    queueLimit: 0
});

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
    })
    .catch(err => {
        console.error('❌ Error fatal en inicialización/parche de BD:', err.message);
    });

module.exports = pool;
