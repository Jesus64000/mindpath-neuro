-- Creación de la base de datos
CREATE DATABASE IF NOT EXISTS mindpath_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mindpath_db;

-- 1. Tabla central de Autenticación
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role ENUM('admin', 'doctor', 'patient') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- 2. Perfil del Doctor (Neurológo/Especialista)
CREATE TABLE doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    specialty VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) NOT NULL UNIQUE, -- MPPS / Colegio de Médicos
    bio TEXT,
    profile_picture VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Perfil del Paciente
CREATE TABLE patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    date_of_birth DATE NOT NULL,
    gender ENUM('M', 'F', 'Other') NOT NULL,
    phone VARCHAR(20),
    emergency_contact VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Horarios de Disponibilidad del Doctor
CREATE TABLE doctor_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    UNIQUE KEY unique_schedule (doctor_id, day_of_week, start_time)
);

-- 5. Gestión de Citas
CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    patient_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    type ENUM('presencial', 'virtual') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
    INDEX idx_appointment_date (appointment_date)
);

-- 6. Registro de la Consulta (El encuentro real)
CREATE TABLE consultations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL UNIQUE,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME,
    video_call_room_id VARCHAR(100), -- Para la integración con Jitsi/WebRTC
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE RESTRICT
);

-- 7. Buffer de Audio e IA (El puente tecnológico)
CREATE TABLE consultation_audio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consultation_id INT NOT NULL UNIQUE,
    file_path VARCHAR(255) NOT NULL, -- Ruta local o S3 donde se guardó el .webm
    transcription_raw TEXT, -- Lo que devuelve Whisper
    status ENUM('uploading', 'processing', 'completed', 'error') DEFAULT 'uploading',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE
);

-- 8. El Informe Clínico Inteligente (Validado)
CREATE TABLE clinical_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consultation_id INT NOT NULL UNIQUE,
    background TEXT, -- Antecedentes
    neurological_findings TEXT, -- Hallazgos
    treatment_plan TEXT, -- Plan terapéutico
    ai_confidence_score DECIMAL(5,2), -- Nivel de confianza de la IA (0-100%)
    is_validated BOOLEAN DEFAULT FALSE,
    validated_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE
);