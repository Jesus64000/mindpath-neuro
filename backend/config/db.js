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
    })
    .catch(err => {
        console.error('❌ Error fatal: No se pudo conectar a MySQL. ¿Encendiste XAMPP?', err.message);
    });

module.exports = pool;
