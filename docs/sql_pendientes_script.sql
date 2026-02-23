-- Sprint 17: soporte bloqueo de agenda del doctor
-- ejecutar en la base de datos mindpath_db

ALTER TABLE doctors
	ADD COLUMN is_blocked TINYINT(1) NOT NULL DEFAULT 0 AFTER user_id;
Ej

-- Sprint 16

ALTER TABLE doctors
ADD COLUMN experience_years INT DEFAULT 0,
ADD COLUMN languages VARCHAR(255) DEFAULT 'Español',
ADD COLUMN education VARCHAR(255),
ADD COLUMN clinic_name VARCHAR(150),
ADD COLUMN clinic_address VARCHAR(255),
ADD COLUMN consultation_fee DECIMAL(10,2) DEFAULT 0.00;