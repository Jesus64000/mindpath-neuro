const db = require('./backend/config/db');

async function test() {
    try {
        console.log("Probando getPendingDoctors...");
        await db.query(`
            SELECT
                d.id,
                u.full_name,
                u.email,
                d.specialty,
                d.license_number,
                d.clinic_name,
                d.verification_notes,
                u.created_at
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            WHERE d.is_verified = FALSE
            ORDER BY u.created_at DESC
        `);
        console.log("✅ getPendingDoctors OK");
    } catch (e) {
        console.error("❌ getPendingDoctors FAIL:", e.message);
    }

    try {
        console.log("\nProbando getUsers...");
        await db.query(`
            SELECT
                u.id, u.email, u.full_name, u.role,
                COALESCE(u.is_active, 1) AS is_active,
                u.created_at,
                d.specialty,
                d.is_verified,
                d.license_number
            FROM users u
            LEFT JOIN doctors d ON d.user_id = u.id
            WHERE u.role != 'admin'
        `);
        console.log("✅ getUsers OK");
    } catch (e) {
        console.error("❌ getUsers FAIL:", e.message);
    }
    
    process.exit();
}

test();
