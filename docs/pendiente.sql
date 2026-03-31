-- 1. Tabla para el catálogo de Clínicas/Hospitales
CREATE TABLE IF NOT EXISTS clinics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE
);

-- Insertamos algunas clínicas base para probar
INSERT IGNORE INTO clinics (name) VALUES 
('Mindpath Online'), ('Centro Médico Zulia'), ('Hospital San José'), ('Clínica Amado');

-- 2. Actualización de Pacientes
ALTER TABLE patients
ADD COLUMN dni VARCHAR(50) AFTER user_id,
ADD COLUMN medical_conditions TEXT AFTER date_of_birth,
ADD COLUMN current_medications TEXT AFTER medical_conditions,
ADD COLUMN health_insurance VARCHAR(150) AFTER current_medications;

-- 3. Actualización de Doctores (Unificada)
ALTER TABLE doctors
ADD COLUMN dni VARCHAR(50) AFTER user_id,
ADD COLUMN emergency_block_until DATETIME DEFAULT NULL AFTER is_blocked,
ADD COLUMN modality ENUM('online', 'presencial', 'ambas') DEFAULT 'ambas' AFTER specialty,
ADD COLUMN title_picture VARCHAR(255) AFTER profile_picture,
ADD COLUMN specialty_certificate VARCHAR(255) AFTER title_picture,
ADD COLUMN rif VARCHAR(100) AFTER specialty_certificate;

-- 4. Preparación para Fuentes (System Settings)
ALTER TABLE system_settings 
ADD COLUMN font_family VARCHAR(50) DEFAULT 'Inter' AFTER primary_color;

-- 5. Actualización del estado de las citas (¡CORREGIDO PARA NO ROMPER DATA!)
ALTER TABLE appointments 
MODIFY COLUMN status ENUM('scheduled', 'pending', 'confirmed', 'completed', 'cancelled', 'emergency_reschedule') DEFAULT 'scheduled';

-- 6. Sprint 33: Tabla de Excepciones de Horario (Días Libres)
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
);

ALTER TABLE system_settings 
ADD COLUMN smtp_email VARCHAR(255) DEFAULT NULL,
ADD COLUMN smtp_password VARCHAR(255) DEFAULT NULL;