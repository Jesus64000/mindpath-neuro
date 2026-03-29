const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mindpath_db'
    });

    try {
        console.log("Creando tabla doctor_exceptions...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS doctor_exceptions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                doctor_id INT NOT NULL,
                exception_date DATE NOT NULL,
                is_day_off BOOLEAN DEFAULT FALSE,
                start_time TIME DEFAULT NULL,
                end_time TIME DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
                UNIQUE KEY unique_doctor_date (doctor_id, exception_date)
            )
        `);
        console.log("Tabla creada con éxito.");
    } catch (e) {
        console.error("Error", e);
    } finally {
        await db.end();
    }
}
run();
