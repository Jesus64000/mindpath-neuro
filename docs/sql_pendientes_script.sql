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
-- Sprint 19: Cierre Clínico — tabla consultations y clinical_reports (estructura nueva)
-- EJECUTAR EN ORDEN

-- 1. Índice UNIQUE en consultations.appointment_id (necesario para ON DUPLICATE KEY)
ALTER TABLE consultations ADD UNIQUE KEY uq_appointment (appointment_id);

-- 2. Agregar columnas nuevas a clinical_reports (si aún no existen)
ALTER TABLE clinical_reports
  ADD COLUMN antecedentes   TEXT,
  ADD COLUMN hallazgos      TEXT,
  ADD COLUMN plan           TEXT,
  ADD COLUMN private_notes  TEXT,
  ADD COLUMN is_shared      BOOLEAN DEFAULT FALSE;

-- Sprint 19.5: Reestructura del informe médico a 6 campos clínicos estandarizados

-- 3. Renombrar 'plan' → 'tratamiento' y agregar campos faltantes
ALTER TABLE clinical_reports
  CHANGE COLUMN plan        tratamiento             TEXT,
  ADD COLUMN motivo_sintomas        TEXT AFTER consultation_id,
  ADD COLUMN diagnostico            TEXT AFTER hallazgos,
  ADD COLUMN estudios_observaciones TEXT AFTER tratamiento;

-- 4. Eliminar columnas obsoletas en inglés (del esquema anterior)
ALTER TABLE clinical_reports
  DROP COLUMN background,
  DROP COLUMN neurological_findings,
  DROP COLUMN treatment_plan;
