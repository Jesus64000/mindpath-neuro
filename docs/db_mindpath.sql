SET FOREIGN_KEY_CHECKS = 0;

-- 1. TABLAS BASE DE USUARIOS
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `email` varchar(255) NOT NULL UNIQUE,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `role` enum('doctor','patient','admin','supervisor') NOT NULL DEFAULT 'patient',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `patients` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` int(11) NOT NULL UNIQUE,
  `dni` varchar(50) DEFAULT NULL,
  `date_of_birth` date NOT NULL,
  `medical_conditions` text DEFAULT NULL,
  `current_medications` text DEFAULT NULL,
  `health_insurance` varchar(150) DEFAULT NULL,
  `gender` enum('M','F','Other') NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `profile_picture` varchar(500) DEFAULT NULL,
  `emergency_contact` varchar(100) DEFAULT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `doctors` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` int(11) NOT NULL UNIQUE,
  `dni` varchar(50) DEFAULT NULL,
  `is_blocked` tinyint(1) NOT NULL DEFAULT 0,
  `emergency_block_until` datetime DEFAULT NULL,
  `specialty` varchar(100) NOT NULL,
  `modality` enum('online','presencial','ambas') DEFAULT 'ambas',
  `license_number` varchar(50) NOT NULL UNIQUE,
  `bio` text DEFAULT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `title_picture` varchar(255) DEFAULT NULL,
  `specialty_certificate` varchar(255) DEFAULT NULL,
  `rif` varchar(100) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `experience_years` int(11) DEFAULT 0,
  `languages` varchar(255) DEFAULT 'Español',
  `education` varchar(255) DEFAULT NULL,
  `clinic_name` varchar(150) DEFAULT NULL,
  `clinic_address` varchar(255) DEFAULT NULL,
  `consultation_fee` decimal(10,2) DEFAULT 0.00,
  `verification_notes` text DEFAULT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. TABLAS DE CITAS Y CONSULTAS (Con 'scheduled' corregido)
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `doctor_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `appointment_date` date NOT NULL,
  `start_time` time NOT NULL,
  `status` enum('scheduled','pending','confirmed','completed','cancelled','emergency_reschedule') DEFAULT 'scheduled',
  `type` enum('presencial','virtual') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `doctor_ready` tinyint(1) DEFAULT 0,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`),
  FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `consultations` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `appointment_id` int(11) NOT NULL UNIQUE,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime DEFAULT NULL,
  `video_call_room_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `clinical_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `consultation_id` int(11) NOT NULL UNIQUE,
  `motivo_sintomas` text DEFAULT NULL,
  `ai_confidence_score` decimal(5,2) DEFAULT NULL,
  `is_validated` tinyint(1) DEFAULT 0,
  `validated_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `antecedentes` text DEFAULT NULL,
  `hallazgos` text DEFAULT NULL,
  `diagnostico` text DEFAULT NULL,
  `tratamiento` text DEFAULT NULL,
  `estudios_observaciones` text DEFAULT NULL,
  `private_notes` text DEFAULT NULL,
  `is_shared` tinyint(1) DEFAULT 0,
  FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `consultation_audio` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `consultation_id` int(11) NOT NULL UNIQUE,
  `file_path` varchar(255) NOT NULL,
  `transcription_raw` text DEFAULT NULL,
  `status` enum('uploading','processing','completed','error') DEFAULT 'uploading',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. INTERACCIONES PACIENTE-DOCTOR (Con llaves foráneas de ratings corregidas)
CREATE TABLE IF NOT EXISTS `doctor_patient_notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `doctor_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `notes` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  UNIQUE KEY `uq_doctor_patient` (`doctor_id`,`patient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `doctor_ratings` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `doctor_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` between 1 and 5),
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4. HORARIOS Y EXCEPCIONES
CREATE TABLE IF NOT EXISTS `doctor_schedules` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `doctor_id` int(11) NOT NULL,
  `day_of_week` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `slot_duration` int(11) DEFAULT 30,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_schedule` (`doctor_id`,`day_of_week`,`start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `doctor_exceptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `doctor_id` int(11) NOT NULL,
  `exception_date` date NOT NULL,
  `is_day_off` tinyint(1) DEFAULT 0,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_doctor_date` (`doctor_id`,`exception_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 5. CATÁLOGOS Y SEMILLAS
CREATE TABLE IF NOT EXISTS `specialties` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `specialties` (`name`) VALUES
('General'), ('Neurocirugía'), ('Neurología'), ('Neuropediatría'),
('Neuropsicología'), ('Psicoanálisis'), ('Psicología Clínica'),
('Psiquiatría'), ('Terapia Cognitivo-Conductual');

CREATE TABLE IF NOT EXISTS `clinics` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(150) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `clinics` (`name`) VALUES
('Mindpath Online'), ('Centro Médico Zulia'), ('Hospital San José'), ('Clínica Amado');

CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` int(11) NOT NULL DEFAULT 1 PRIMARY KEY,
  `clinic_name` varchar(255) NOT NULL DEFAULT 'MindPath Neuro',
  `logo_url` varchar(500) DEFAULT NULL,
  `primary_color` varchar(7) NOT NULL DEFAULT '#6D28D9',
  `font_family` varchar(50) DEFAULT 'Inter',
  `primary_hover` varchar(7) NOT NULL DEFAULT '#5B21B6',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `system_settings` (`id`, `clinic_name`, `logo_url`, `primary_color`, `font_family`, `primary_hover`) VALUES
(1, 'MindPath Neuro', '', '#6D28D9', 'system-ui', '#5B21B6');

SET FOREIGN_KEY_CHECKS = 1;