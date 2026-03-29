-- 1. Tabla para el catálogo de Clínicas/Hospitales
CREATE TABLE IF NOT EXISTS clinics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE
);
-- Insertamos algunas clínicas base para probar
INSERT IGNORE INTO clinics (name) VALUES ('Mindpath Online'), ('Centro Médico Zulia'), ('Hospital San José'), ('Clínica Amado');

-- 2. Actualización de Pacientes
ALTER TABLE patients
ADD COLUMN dni VARCHAR(50) AFTER user_id,
ADD COLUMN medical_conditions TEXT AFTER date_of_birth,
ADD COLUMN current_medications TEXT AFTER medical_conditions,
ADD COLUMN health_insurance VARCHAR(150) AFTER current_medications;

-- 3. Actualización de Doctores
ALTER TABLE doctors
ADD COLUMN dni VARCHAR(50) AFTER user_id,
ADD COLUMN modality ENUM('online', 'presencial', 'ambas') DEFAULT 'ambas' AFTER specialty,
ADD COLUMN title_picture VARCHAR(255) AFTER profile_picture,
ADD COLUMN specialty_certificate VARCHAR(255) AFTER title_picture,
ADD COLUMN rif VARCHAR(100) AFTER specialty_certificate;


-- Preparacion para Fuentes

ALTER TABLE system_settings ADD COLUMN font_family VARCHAR(50) DEFAULT 'Inter' AFTER primary_color;


-- 1. Añadimos la columna para saber hasta cuándo dura la emergencia
ALTER TABLE doctors 
ADD COLUMN emergency_block_until DATETIME DEFAULT NULL AFTER is_blocked;

-- 2. Añadimos el nuevo estado a las citas para diferenciarlas de cancelaciones normales
ALTER TABLE appointments 
MODIFY COLUMN status ENUM('scheduled', 'completed', 'cancelled', 'emergency_reschedule') DEFAULT 'scheduled';


--  Sprint 33  
CREATE TABLE doctor_exceptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    exception_date DATE NOT NULL,
    is_day_off BOOLEAN DEFAULT FALSE, -- Si es TRUE, el doctor no trabaja todo el día
    start_time TIME DEFAULT NULL,     -- Si no es día libre, a qué hora empieza su turno especial
    end_time TIME DEFAULT NULL,       -- A qué hora termina su turno especial
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    UNIQUE KEY unique_doctor_date (doctor_id, exception_date) -- Solo una excepción por día por doctor
);