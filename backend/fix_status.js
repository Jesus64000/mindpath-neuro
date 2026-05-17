require('dotenv').config();
const db = require('./config/db');
async function run() {
    try {
        const [res] = await db.query("UPDATE appointments SET status = 'pending' WHERE status = 'scheduled'");
        console.log('Updated rows:', res.affectedRows);
    } catch(e) {
        console.log(e.message);
    }
    process.exit(0);
}
run();