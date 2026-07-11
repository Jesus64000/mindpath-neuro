-- =============================================================================
-- SCRIPT DE ACTUALIZACIÓN DE BASE DE DATOS: TABLA DE CATEGORÍAS DE NOTAS RÁPIDAS
-- =============================================================================
-- Este script crea la tabla `note_categories` para la gestión dinámica de 
-- categorías y añade el campo `category_id` como clave foránea en la tabla
-- `doctor_patient_notes`.
--
-- Instrucciones de ejecución (en DataGrip conectado a Aiven):
-- 1. Abre tu consola de DataGrip en tu base de datos de Mindpath.
-- 2. Ejecuta el script completo.
-- =============================================================================

-- 1. Crear tabla de categorías
CREATE TABLE IF NOT EXISTS `note_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `color` VARCHAR(50) DEFAULT '#64748B',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Insertar categorías por defecto (sin emoticones)
INSERT INTO `note_categories` (`name`, `color`) VALUES
('General', '#64748B'),
('Medicamentos', '#EF4444'),
('Diagnóstico', '#8B5CF6'),
('Tratamiento', '#10B981'),
('Alertas', '#F59E0B')
ON DUPLICATE KEY UPDATE `color` = VALUES(`color`);

-- 3. Añadir la columna category_id a doctor_patient_notes
-- Nota: Si da error porque la columna ya existe, puedes ignorarlo u omitir esta sección.
ALTER TABLE `doctor_patient_notes` ADD COLUMN `category_id` INT DEFAULT NULL;

-- 4. Añadir la clave foránea
-- Nota: Si da error porque la clave ya existe, puedes ignorarlo.
ALTER TABLE `doctor_patient_notes` ADD CONSTRAINT `fk_doctor_patient_notes_category` 
FOREIGN KEY (`category_id`) REFERENCES `note_categories` (`id`) ON DELETE SET NULL;
