-- Sprint 16

ALTER TABLE doctors
ADD COLUMN experience_years INT DEFAULT 0,
ADD COLUMN languages VARCHAR(255) DEFAULT 'Español',
ADD COLUMN education VARCHAR(255),
ADD COLUMN clinic_name VARCHAR(150),
ADD COLUMN clinic_address VARCHAR(255),
ADD COLUMN consultation_fee DECIMAL(10,2) DEFAULT 0.00;

-- Sprint 17: soporte bloqueo de agenda del doctor
-- ejecutar en la base de datos mindpath_db

ALTER TABLE doctors
	ADD COLUMN is_blocked TINYINT(1) NOT NULL DEFAULT 0 AFTER user_id;

-- Sprint 18: disponibilidad de doctores
-- Crear tabla de horarios configurables por doctor

CREATE TABLE IF NOT EXISTS doctor_schedules (
	id INT AUTO_INCREMENT PRIMARY KEY,
	doctor_id INT NOT NULL,
	day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
	start_time TIME NOT NULL,
	end_time TIME NOT NULL,
	slot_duration INT DEFAULT 30,
	is_active BOOLEAN DEFAULT TRUE,
	FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

--