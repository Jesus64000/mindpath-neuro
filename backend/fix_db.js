require('dotenv').config({ path: './.env' });
const db = require('./config/db');

async function fixDB() {
    try {
        await db.query("ALTER TABLE appointments ADD COLUMN doctor_ready BOOLEAN DEFAULT FALSE;");
        console.log("Column doctor_ready added!");
    } catch(err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists.");
        } else {
            console.error(err);
        }
    }
    process.exit(0);
}
fixDB();
