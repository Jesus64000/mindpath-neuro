const db = require('./backend/config/db');

async function fix() {
    try {
        console.log("Restaurando ENUM en la base de datos...");
        await db.query("ALTER TABLE appointments MODIFY COLUMN status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'emergency_reschedule', 'scheduled') DEFAULT 'pending'");
        await db.query("UPDATE appointments SET status = 'pending' WHERE status = 'scheduled' OR status = ''");
        await db.query("ALTER TABLE appointments MODIFY COLUMN status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'emergency_reschedule') DEFAULT 'pending'");
        console.log("¡Hecho!");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit(0);
    }
}
fix();
