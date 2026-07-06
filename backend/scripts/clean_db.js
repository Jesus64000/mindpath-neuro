const db = require('../config/db');

async function run() {
    try {
        console.log("=== INICIANDO LIMPIEZA DE BASE DE DATOS ===");

        // 1. Buscar los usuarios que se deben conservar
        const [usersToKeep] = await db.query(
            "SELECT id, email, full_name, role FROM users WHERE email = 'polanconay45@gmail.com' OR full_name LIKE '%Esteban%' OR email LIKE '%Esteban%' OR email = 'admin@admin.com'"
        );
        
        console.log("\nUsuarios que se CONSERVARÁN:");
        console.log(usersToKeep);
        
        if (usersToKeep.length === 0) {
            console.log("\n❌ ERROR: No se encontró ningún usuario para conservar. Abortando limpieza por seguridad.");
            process.exit(1);
        }

        const keepUserIds = usersToKeep.map(u => u.id);
        console.log(`\nIDs de usuarios a conservar: ${keepUserIds.join(', ')}`);
        
        // 2. Desactivar temporalmente la verificación de claves foráneas
        await db.query("SET FOREIGN_KEY_CHECKS = 0");
        console.log("\n🔒 Verificación de claves foráneas desactivada.");

        // 3. Vaciar tablas transaccionales y de citas completamente
        const tablesToClearCompletely = [
            'appointments',
            'clinical_reports',
            'consultations',
            'consultation_audio',
            'doctor_exceptions',
            'doctor_patient_notes',
            'doctor_rate_rules',
            'doctor_ratings',
            'doctor_schedules',
            'invoices',
            'patient_attachments'
        ];

        console.log("\n--- Limpiando tablas transaccionales ---");
        for (const table of tablesToClearCompletely) {
            try {
                await db.query(`DELETE FROM ${table}`);
                console.log(`✅ Tabla '${table}' vaciada.`);
            } catch (err) {
                console.log(`⚠️ Advertencia: No se pudo vaciar la tabla '${table}':`, err.message);
            }
        }

        // 4. Limpiar datos de perfiles de doctores no conservados
        console.log("\n--- Limpiando perfiles de Doctores ---");
        const [doctorsDeleted] = await db.query(
            "DELETE FROM doctors WHERE user_id NOT IN (?)",
            [keepUserIds]
        );
        console.log(`✅ Perfiles de doctores eliminados. Registros afectados: ${doctorsDeleted.affectedRows}`);

        // 5. Obtener los IDs de doctores que quedan para limpiar sus relaciones de clínicas y métodos de pago
        const [keptDoctors] = await db.query("SELECT id FROM doctors");
        const keptDoctorIds = keptDoctors.map(d => d.id);
        
        if (keptDoctorIds.length > 0) {
            await db.query("DELETE FROM doctor_clinics WHERE doctor_id NOT IN (?)", [keptDoctorIds]);
            await db.query("DELETE FROM doctor_payment_methods WHERE doctor_id NOT IN (?)", [keptDoctorIds]);
        } else {
            await db.query("DELETE FROM doctor_clinics");
            await db.query("DELETE FROM doctor_payment_methods");
        }
        console.log("✅ Relaciones de clínicas y métodos de pago de doctores limpiadas.");

        // 6. Limpiar datos de perfiles de pacientes no conservados
        console.log("\n--- Limpiando perfiles de Pacientes ---");
        const [patientsDeleted] = await db.query(
            "DELETE FROM patients WHERE user_id NOT IN (?)",
            [keepUserIds]
        );
        console.log(`✅ Perfiles de pacientes eliminados. Registros afectados: ${patientsDeleted.affectedRows}`);

        // 7. Eliminar usuarios no conservados de la tabla users
        console.log("\n--- Limpiando tabla de Usuarios (users) ---");
        const [usersDeleted] = await db.query(
            "DELETE FROM users WHERE id NOT IN (?)",
            [keepUserIds]
        );
        console.log(`✅ Usuarios eliminados de la base de datos. Registros afectados: ${usersDeleted.affectedRows}`);

        // 8. Reactivar la verificación de claves foráneas
        await db.query("SET FOREIGN_KEY_CHECKS = 1");
        console.log("\n🔓 Verificación de claves foráneas reactivada.");
        
        console.log("\n=== LIMPIEZA COMPLETADA CON ÉXITO ===");
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Error grave durante la limpieza de la base de datos:", error);
        try {
            await db.query("SET FOREIGN_KEY_CHECKS = 1");
        } catch (_) {}
        process.exit(1);
    }
}

run();
