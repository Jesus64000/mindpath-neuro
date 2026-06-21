-- Actualizaciones de Base de Datos - 2026-06-21
-- MindPath Neuro

-- 1. Agregar signature_picture a la tabla doctors
ALTER TABLE doctors ADD COLUMN signature_picture VARCHAR(255) DEFAULT NULL;

-- 2. Agregar default_address a la tabla clinics
ALTER TABLE clinics ADD COLUMN default_address VARCHAR(255) DEFAULT NULL;

-- 3. Crear tabla junction doctor_clinics
CREATE TABLE IF NOT EXISTS doctor_clinics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    clinic_id INT NOT NULL,
    custom_address VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    UNIQUE KEY unique_doctor_clinic (doctor_id, clinic_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4. Agregar clinic_id a doctor_schedules
ALTER TABLE doctor_schedules ADD COLUMN clinic_id INT DEFAULT NULL AFTER slot_duration;
ALTER TABLE doctor_schedules ADD CONSTRAINT fk_doctor_schedules_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL;

-- 5. Agregar clinic_id a appointments
ALTER TABLE appointments ADD COLUMN clinic_id INT DEFAULT NULL AFTER doctor_ready;
ALTER TABLE appointments ADD CONSTRAINT fk_appointments_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL;

-- 6. Crear tabla patient_attachments
CREATE TABLE IF NOT EXISTS patient_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    exam_name VARCHAR(100) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 7. Agregar columnas de recuperación de contraseña y google auth a users (por si faltan)
ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN reset_token_expires DATETIME DEFAULT NULL;
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'local';

-- Sembrar direcciones por defecto en las clínicas existentes
UPDATE clinics SET default_address = 'Consulta Virtual (Online)' WHERE name = 'Mindpath Online';
UPDATE clinics SET default_address = 'Av. Bella Vista, Edif. Centro Médico Zulia, Maracaibo' WHERE name = 'Centro Médico Zulia';
UPDATE clinics SET default_address = 'Calle 72 con Av. 15, Hospital San José, Maracaibo' WHERE name = 'Hospital San José';
UPDATE clinics SET default_address = 'Av. 5 de Julio, Clínica Amado, Maracaibo' WHERE name = 'Clínica Amado';

-- 8. Modificar la columna status en la tabla appointments para incluir 'emergency_reschedule'
ALTER TABLE appointments MODIFY COLUMN status ENUM('scheduled', 'pending', 'confirmed', 'completed', 'cancelled', 'emergency_reschedule') DEFAULT 'scheduled';

-- 9. Modificar la columna payment_method en la tabla appointments
ALTER TABLE appointments MODIFY COLUMN payment_method VARCHAR(100) DEFAULT NULL;

-- 10. Agregar constraint de llave foránea para catalog_method_id en doctor_payment_methods si no existe
ALTER TABLE doctor_payment_methods ADD CONSTRAINT fk_doctor_payment_methods_catalog FOREIGN KEY (catalog_method_id) REFERENCES payment_method_catalog(id) ON DELETE SET NULL;

