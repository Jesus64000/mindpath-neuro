-- ============================================================
-- Sprint 24 — Modo Dios: Migración de Base de Datos
-- Ejecutar en MySQL antes de activar las funcionalidades de admin
-- ============================================================

-- 1. Agregar rol 'admin' al ENUM de users
ALTER TABLE users
MODIFY COLUMN role ENUM('doctor', 'patient', 'admin') NOT NULL DEFAULT 'patient';

-- 2. Agregar columnas de verificación a doctors
ALTER TABLE doctors
    ADD COLUMN IF NOT EXISTS is_verified       BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Actualizar doctores existentes como verificados (para no romper el sistema actual)
UPDATE doctors SET is_verified = TRUE WHERE is_verified IS NULL OR is_verified = FALSE;

-- 3. Crear tabla de configuración del sistema (1 sola fila)
CREATE TABLE IF NOT EXISTS system_settings (
    id              INT          PRIMARY KEY DEFAULT 1,
    clinic_name     VARCHAR(255) NOT NULL DEFAULT 'MindPath Neuro',
    logo_url        VARCHAR(500) DEFAULT NULL,
    primary_color   VARCHAR(7)   NOT NULL DEFAULT '#6D28D9',
    primary_hover   VARCHAR(7)   NOT NULL DEFAULT '#5B21B6',
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT single_row CHECK (id = 1)
);

-- Insertar fila inicial si no existe
INSERT IGNORE INTO system_settings (id, clinic_name, primary_color, primary_hover)
VALUES (1, 'MindPath Neuro', '#6D28D9', '#5B21B6');
