const db = require('./backend/config/db');
async function check() {
    try {
        const [rows] = await db.query('DESCRIBE appointments;');
        console.log(rows);
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
check();
