-- Sprint 27 — Migraciones de Base de Datos
-- Ejecutar en orden en la BD de MindPath-Neuro

-- 1. Sala de espera: columna para indicar si el doctor ya entró a la sala
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS doctor_ready BOOLEAN DEFAULT FALSE;

-- 2. Notas rápidas del doctor por paciente (bloc de notas privado)
CREATE TABLE IF NOT EXISTS doctor_patient_notes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id   INT NOT NULL,
    patient_id  INT NOT NULL,
    notes       TEXT,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_doctor_patient (doctor_id, patient_id),
    FOREIGN KEY (doctor_id)  REFERENCES doctors(id)  ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
