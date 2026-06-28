require('dotenv').config();
const db = require('./config/db');

const expectedTables = {
    clinics: "CREATE TABLE IF NOT EXISTS clinics (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL UNIQUE)",
    doctor_exceptions: "CREATE TABLE IF NOT EXISTS doctor_exceptions (id INT AUTO_INCREMENT PRIMARY KEY, doctor_id INT NOT NULL, exception_date DATE NOT NULL, is_day_off BOOLEAN DEFAULT FALSE, start_time TIME DEFAULT NULL, end_time TIME DEFAULT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE, UNIQUE KEY unique_doctor_date (doctor_id, exception_date))",
    doctor_rate_rules: "CREATE TABLE IF NOT EXISTS doctor_rate_rules (id INT AUTO_INCREMENT PRIMARY KEY, doctor_id INT NOT NULL, modality ENUM('virtual', 'presencial', 'ambas') NOT NULL DEFAULT 'ambas', day_of_week ENUM('Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') DEFAULT NULL, start_time TIME DEFAULT NULL, end_time TIME DEFAULT NULL, price DECIMAL(10,2) NOT NULL, currency VARCHAR(3) NOT NULL DEFAULT 'USD', priority INT NOT NULL DEFAULT 100, is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE)",
    payment_method_catalog: "CREATE TABLE IF NOT EXISTS payment_method_catalog (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE, description TEXT DEFAULT NULL, template_key VARCHAR(50) DEFAULT NULL, default_details_template TEXT DEFAULT NULL, is_active BOOLEAN NOT NULL DEFAULT TRUE, sort_order INT NOT NULL DEFAULT 100, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP)",
    doctor_payment_methods: "CREATE TABLE IF NOT EXISTS doctor_payment_methods (id INT AUTO_INCREMENT PRIMARY KEY, doctor_id INT NOT NULL, catalog_method_id INT DEFAULT NULL, method_name VARCHAR(100) NOT NULL, account_details TEXT NOT NULL, is_active BOOLEAN NOT NULL DEFAULT TRUE, sort_order INT NOT NULL DEFAULT 100, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE, FOREIGN KEY (catalog_method_id) REFERENCES payment_method_catalog(id) ON DELETE SET NULL)",
    invoices: "CREATE TABLE IF NOT EXISTS invoices (id INT AUTO_INCREMENT PRIMARY KEY, appointment_id INT NOT NULL, doctor_id INT NOT NULL, patient_id INT NOT NULL, invoice_number VARCHAR(50) NOT NULL UNIQUE, base_amount DECIMAL(10,2) NOT NULL, tax_amount DECIMAL(10,2) DEFAULT '0.00', total_amount DECIMAL(10,2) NOT NULL, currency VARCHAR(3) DEFAULT 'USD', legal_text TEXT NOT NULL, pdf_path VARCHAR(255) DEFAULT NULL, issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE, FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE, FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE)",
    doctor_clinics: "CREATE TABLE IF NOT EXISTS doctor_clinics (id INT AUTO_INCREMENT PRIMARY KEY, doctor_id INT NOT NULL, clinic_id INT NOT NULL, custom_address VARCHAR(255) DEFAULT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE, FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE, UNIQUE KEY unique_doctor_clinic (doctor_id, clinic_id))",
    patient_attachments: "CREATE TABLE IF NOT EXISTS patient_attachments (id INT AUTO_INCREMENT PRIMARY KEY, patient_id INT NOT NULL, doctor_id INT NOT NULL, exam_name VARCHAR(100) NOT NULL, file_path VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE, FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE)",
    study_types: "CREATE TABLE IF NOT EXISTS study_types (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL UNIQUE)"
};

const expectedColumns = {
    users: [
        { name: 'reset_token', definition: 'VARCHAR(255) DEFAULT NULL' },
        { name: 'reset_token_expires', definition: 'DATETIME DEFAULT NULL' },
        { name: 'google_id', definition: 'VARCHAR(255) DEFAULT NULL' },
        { name: 'auth_provider', definition: "VARCHAR(50) DEFAULT 'local'" },
        { name: 'is_email_verified', definition: 'BOOLEAN DEFAULT TRUE' },
        { name: 'verification_token', definition: 'VARCHAR(255) DEFAULT NULL' }
    ],
    patients: [
        { name: 'dni', definition: 'VARCHAR(50) AFTER user_id' },
        { name: 'medical_conditions', definition: 'TEXT AFTER date_of_birth' },
        { name: 'current_medications', definition: 'TEXT AFTER medical_conditions' },
        { name: 'health_insurance', definition: 'VARCHAR(150) AFTER current_medications' }
    ],
    doctors: [
        { name: 'dni', definition: 'VARCHAR(50) AFTER user_id' },
        { name: 'emergency_block_until', definition: 'DATETIME DEFAULT NULL AFTER is_blocked' },
        { name: 'modality', definition: "ENUM('online', 'presencial', 'ambas') DEFAULT 'ambas' AFTER specialty" },
        { name: 'title_picture', definition: 'VARCHAR(255) AFTER profile_picture' },
        { name: 'specialty_certificate', definition: 'VARCHAR(255) AFTER title_picture' },
        { name: 'rif', definition: 'VARCHAR(100) AFTER specialty_certificate' },
        { name: 'phone', definition: 'VARCHAR(20) DEFAULT NULL' },
        { name: 'signature_picture', definition: 'VARCHAR(255) DEFAULT NULL' }
    ],
    clinics: [
        { name: 'default_address', definition: 'VARCHAR(255) DEFAULT NULL' },
        { name: 'is_private', definition: 'BOOLEAN DEFAULT FALSE' },
        { name: 'owner_doctor_id', definition: 'INT DEFAULT NULL' },
        { name: 'is_verified', definition: 'BOOLEAN DEFAULT TRUE' },
        { name: 'clinic_type', definition: "VARCHAR(100) DEFAULT 'Clínica Privada'" }
    ],
    system_settings: [
        { name: 'font_family', definition: "VARCHAR(50) DEFAULT 'Inter' AFTER primary_color" },
        { name: 'smtp_email', definition: 'VARCHAR(255) DEFAULT NULL' },
        { name: 'smtp_password', definition: 'VARCHAR(255) DEFAULT NULL' },
        { name: 'zego_app_id', definition: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'zego_server_secret', definition: 'VARCHAR(255) DEFAULT NULL' },
        { name: 'exchange_rate', definition: "DECIMAL(10,4) DEFAULT 36.50 AFTER smtp_password" },
        { name: 'exchange_rate_mode', definition: "ENUM('auto', 'manual') DEFAULT 'auto' AFTER exchange_rate" },
        { name: 'exchange_rate_updated_at', definition: "TIMESTAMP NULL DEFAULT NULL AFTER exchange_rate_mode" },
        { name: 'logo_size', definition: "INT DEFAULT 40" },
        { name: 'logo_dark_url', definition: "VARCHAR(255) DEFAULT NULL" }
    ],
    doctor_schedules: [
        { name: 'clinic_id', definition: 'INT DEFAULT NULL AFTER slot_duration' }
    ],
    appointments: [
        { name: 'consultation_fee_snapshot', definition: 'DECIMAL(10,2) DEFAULT NULL AFTER type' },
        { name: 'payment_method', definition: "VARCHAR(100) DEFAULT NULL AFTER consultation_fee_snapshot" },
        { name: 'payment_status', definition: "ENUM('pending', 'paid', 'verified', 'rejected') NOT NULL DEFAULT 'pending' AFTER payment_method" },
        { name: 'payment_reference', definition: 'VARCHAR(150) DEFAULT NULL AFTER payment_status' },
        { name: 'payment_proof_url', definition: 'VARCHAR(255) DEFAULT NULL AFTER payment_reference' },
        { name: 'payment_collected_at', definition: 'DATETIME DEFAULT NULL AFTER payment_proof_url' },
        { name: 'legal_verification_code', definition: 'VARCHAR(100) DEFAULT NULL AFTER payment_collected_at' },
        { name: 'legal_verification_hash', definition: 'VARCHAR(128) DEFAULT NULL AFTER legal_verification_code' },
        { name: 'clinic_id', definition: 'INT DEFAULT NULL AFTER doctor_ready' }
    ],
    payment_method_catalog: [
        { name: 'template_key', definition: 'VARCHAR(50) DEFAULT NULL AFTER description' },
        { name: 'default_details_template', definition: 'TEXT DEFAULT NULL AFTER template_key' }
    ],
    doctor_payment_methods: [
        { name: 'catalog_method_id', definition: 'INT DEFAULT NULL AFTER doctor_id' }
    ]
};

async function verifyAndSyncDB() {
    try {
        console.log('--- Iniciando verificación de esquema de base de datos ---');
        
        for (const [tableName, createQuery] of Object.entries(expectedTables)) {
            const [rows] = await db.query("SHOW TABLES LIKE '" + tableName + "'");
            if (rows.length === 0) {
                console.log("[TABLA FALTANTE] Creando tabla '" + tableName + "'...");
                await db.query(createQuery);
                console.log("✅ Tabla '" + tableName + "' creada.");
            } else {
                console.log("✅ Tabla '" + tableName + "' ya existe.");
            }
        }

        for (const [tableName, columns] of Object.entries(expectedColumns)) {
            const [tableExists] = await db.query("SHOW TABLES LIKE '" + tableName + "'");
            if (tableExists.length === 0) continue;

            for (const col of columns) {
                const [colExists] = await db.query(
                    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS " +
                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                    [tableName, col.name]
                );

                if (colExists.length === 0) {
                    console.log("[COLUMNA FALTANTE] Agregando '" + col.name + "' a '" + tableName + "'...");
                    await db.query("ALTER TABLE " + tableName + " ADD COLUMN " + col.name + " " + col.definition);
                    console.log("✅ Columna '" + col.name + "' agregada en '" + tableName + "'.");
                } else {
                    console.log("✅ Columna '" + col.name + "' ya existe en '" + tableName + "'.");
                }
            }
        }
        
        try {
            await db.query("ALTER TABLE appointments MODIFY COLUMN status ENUM('scheduled', 'pending', 'confirmed', 'completed', 'cancelled', 'emergency_reschedule') DEFAULT 'scheduled'");
            console.log("✅ Enum status de appointments actualizado.");
        } catch (e) {}

        try {
            await db.query("ALTER TABLE appointments MODIFY COLUMN payment_method VARCHAR(100) DEFAULT NULL");
            console.log("✅ Columna payment_method modificada a VARCHAR(100) en appointments.");
        } catch (e) {
            console.error("⚠️ Error modificando payment_method en appointments:", e.message);
        }
        
        try {
            const [fks] = await db.query(
                "SELECT CONSTRAINT_NAME " +
                "FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE " +
                "WHERE TABLE_SCHEMA = DATABASE() " +
                "  AND TABLE_NAME = 'doctor_payment_methods' " +
                "  AND COLUMN_NAME = 'catalog_method_id'"
            );
            if (fks.length === 0) {
                console.log("[FK FALTANTE] Agregando FK para catalog_method_id...");
                await db.query("ALTER TABLE doctor_payment_methods ADD CONSTRAINT fk_doctor_payment_methods_catalog FOREIGN KEY (catalog_method_id) REFERENCES payment_method_catalog(id) ON DELETE SET NULL");
                console.log("✅ Llave foránea fk_doctor_payment_methods_catalog agregada.");
            }
        } catch (e) {
             console.log("Nota: no se pudo verificar/agregar la FK:", e.message);
        }

        try {
            const [fks] = await db.query(
                "SELECT CONSTRAINT_NAME " +
                "FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE " +
                "WHERE TABLE_SCHEMA = DATABASE() " +
                "  AND TABLE_NAME = 'doctor_schedules' " +
                "  AND COLUMN_NAME = 'clinic_id'"
            );
            if (fks.length === 0) {
                console.log("[FK FALTANTE] Agregando FK para clinic_id en doctor_schedules...");
                await db.query("ALTER TABLE doctor_schedules ADD CONSTRAINT fk_doctor_schedules_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL");
                console.log("✅ Llave foránea fk_doctor_schedules_clinic agregada.");
            }
        } catch (e) {
             console.log("Nota: no se pudo verificar/agregar la FK de clinic en schedules:", e.message);
        }

        try {
            const [fks] = await db.query(
                "SELECT CONSTRAINT_NAME " +
                "FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE " +
                "WHERE TABLE_SCHEMA = DATABASE() " +
                "  AND TABLE_NAME = 'appointments' " +
                "  AND COLUMN_NAME = 'clinic_id'"
            );
            if (fks.length === 0) {
                console.log("[FK FALTANTE] Agregando FK para clinic_id en appointments...");
                await db.query("ALTER TABLE appointments ADD CONSTRAINT fk_appointments_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL");
                console.log("✅ Llave foránea fk_appointments_clinic agregada.");
            }
        } catch (e) {
             console.log("Nota: no se pudo verificar/agregar la FK de clinic en appointments:", e.message);
        }

        console.log('✅ Verificando datos base...');
        await db.query("INSERT IGNORE INTO clinics (name) VALUES ('Mindpath Online'), ('Centro Médico Zulia'), ('Hospital San José'), ('Clínica Amado')");

        // Sembrar direcciones de consultorios por defecto
        await db.query("UPDATE clinics SET default_address = 'Consulta Virtual (Online)' WHERE name = 'Mindpath Online' AND default_address IS NULL");
        await db.query("UPDATE clinics SET default_address = 'Av. Bella Vista, Edif. Centro Médico Zulia, Maracaibo' WHERE name = 'Centro Médico Zulia' AND default_address IS NULL");
        await db.query("UPDATE clinics SET default_address = 'Calle 72 con Av. 15, Hospital San José, Maracaibo' WHERE name = 'Hospital San José' AND default_address IS NULL");
        await db.query("UPDATE clinics SET default_address = 'Av. 5 de Julio, Clínica Amado, Maracaibo' WHERE name = 'Clínica Amado' AND default_address IS NULL");

        // Sembrar tipos de estudios por defecto
        console.log('✅ Sembrando tipos de estudios clínicos...');
        const initialStudies = ['Tomografía', 'EEG', 'Resonancia', 'Laboratorio', 'Otro'];
        for (const study of initialStudies) {
            await db.query("INSERT IGNORE INTO study_types (name) VALUES (?)", [study]);
        }

        
        const catalogVals = [
            ['Efectivo', 'Cobro presencial al finalizar la consulta', 'cash_in_person', 'Cobro en efectivo al finalizar la consulta.\\nFavor traer monto exacto o cambio.', 1, 1],
            ['Pago móvil', 'Pago móvil nacional', 'mobile_payment', 'Banco: Banesco\\nTeléfono: 0414-0000000\\nCédula: V-12345678\\nRIF: J-00000000-0', 1, 2],
            ['Transferencia nacional', 'Transferencia bancaria local', 'bank_transfer', 'Banco: Banesco\\nTitular: Nombre Apellido\\nCuenta: 0102-0000-00-0000000000\\nCI/RIF: V-12345678\\nTipo: Cuenta corriente', 1, 3],
            ['Transferencia internacional', 'Transferencia internacional o remesa', 'international_transfer', 'Banco: Banco internacional\\nTitular: Nombre Apellido\\nSWIFT/IBAN: XXXXXXXX\\nCorreo: nombre@correo.com', 1, 4],
            ['Zelle', 'Pago internacional por Zelle', 'zelle', 'Correo Zelle: nombre@correo.com\\nTitular: Nombre Apellido', 1, 5],
            ['Binance', 'Pago en cripto o stablecoins', 'binance', 'Binance ID: 123456789\\nCorreo: nombre@correo.com\\nUsuario: @miusuario', 1, 6],
            ['Pago por plataforma', 'Pago procesado por la plataforma', 'platform', 'El pago se procesa directamente desde la plataforma.\\nLa confirmación queda registrada automáticamente.', 1, 7],
            ['Otro', 'Método de pago personalizado del doctor', 'other', 'Especifica aquí los datos de cobro personalizados.', 1, 8]
        ];
        
        for (const val of catalogVals) {
             await db.query(
                "INSERT IGNORE INTO payment_method_catalog (name, description, template_key, default_details_template, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
                val
             );
        }
        
        console.log('--- Verificación y sincronización completada exitosamente ---');
        process.exit(0);

    } catch (error) {
        console.error('Error en sincronización:', error);
        process.exit(1);
    }
}

verifyAndSyncDB();