const db = require('./backend/config/db');

async function testBookingLogic() {
    try {
        console.log("🧹 Limpiando horarios y citas de prueba...");
        // Asumiendo doctor_id = 1 para la prueba
        await db.query("DELETE FROM doctor_schedules WHERE doctor_id = 1");
        await db.query("DELETE FROM appointments WHERE doctor_id = 1 AND appointment_date = '2026-12-01'");

        console.log("📅 Insertando múltiples horarios para un doctor (Lunes)...");
        // Rango 1: 08:00 a 10:00 (slots 30m)
        await db.query(`INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration) 
                        VALUES (1, 'Tuesday', '08:00', '10:00', 30)`);
        
        // Rango 2: 14:00 a 16:00 (slots 60m)
        await db.query(`INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration) 
                        VALUES (1, 'Tuesday', '14:00', '16:00', 60)`);

        console.log("✅ Condición de choque artificial: cita existente...");
        // Creamos una cita ficticia
        await db.query(`INSERT INTO appointments (doctor_id, patient_id, appointment_date, start_time, type, status) 
                        VALUES (1, 1, '2026-12-01', '08:30:00', 'virtual', 'confirmed')`); // 2026-12-01 es martes

        console.log("\n🧪 Solicitando disponibilidad de la API para el martes 2026-12-01");
        // No necesitamos token para dispararle al handler directamente en código o podemos usar un mock de Express
        // Lo haremos cargando el Controller directamente (simulando req/res)
        const bookingController = require('./backend/controllers/bookingController');
        
        const req = { query: { doctorId: 1, date: '2026-12-01' } };
        let responseData = null;
        const res = {
            status: () => ({ json: (data) => { responseData = data; } })
        };

        await bookingController.getAvailability(req, res);
        
        console.log("\n📦 RESULTADO SLOTS GENERADOS:");
        console.log(responseData);

        console.log("\n🔎 EXPECTATIVA:");
        console.log("Deberían verse:");
        console.log("- 08:00");
        console.log("- 09:00 (El 08:30 fue tomado por la BD)");
        console.log("- 09:30");
        console.log("- 14:00");
        console.log("- 15:00");

        process.exit();
    } catch (e) {
        console.error("Error en test:", e);
        process.exit(1);
    }
}

testBookingLogic();
