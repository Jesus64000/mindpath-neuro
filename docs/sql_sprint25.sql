-- ============================================================
-- Sprint 25 — Roles + Valoraciones: Migración de Base de Datos
-- Ejecutar DESPUÉS de sql_sprint24_admin.sql
-- ============================================================

-- 1. Agregar rol supervisor al ENUM de users
ALTER TABLE users
MODIFY COLUMN role ENUM('doctor', 'patient', 'admin', 'supervisor') NOT NULL DEFAULT 'patient';

-- 2. Agregar campo is_active para suspender cuentas
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 3. Tabla de valoraciones de doctores
CREATE TABLE IF NOT EXISTS doctor_ratings (
    id             INT          PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT          NOT NULL UNIQUE COMMENT 'Una valoración por cita',
    patient_id     INT          NOT NULL,
    doctor_id      INT          NOT NULL,
    rating         TINYINT      NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment        TEXT,
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id)     REFERENCES patients(id)     ON DELETE CASCADE,
    FOREIGN KEY (doctor_id)      REFERENCES doctors(id)      ON DELETE CASCADE
);

-- 4. Campo is_shared en clinical_reports (para que el doctor controle qué ve el paciente)
ALTER TABLE clinical_reports
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT TRUE;
