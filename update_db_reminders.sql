-- =============================================================================
-- SCRIPT DE ACTUALIZACIÓN DE BASE DE DATOS: CITAS Y RECORDATORIOS (MINDPATH)
-- =============================================================================
-- Este script altera la tabla `appointments` para agregar columnas de control
-- que evitan que se envíen recordatorios duplicados a los pacientes.
--
-- Instrucciones de ejecución:
-- 1. Conéctate a tu base de datos de Aiven usando tu cliente SQL favorito
--    (como DBeaver, MySQL Workbench, phpMyAdmin, la consola de Aiven, etc.).
-- 2. Selecciona la base de datos de Mindpath (`mindpath_db` o similar).
-- 3. Copia, pega y ejecuta las siguientes sentencias ALTER TABLE.
-- =============================================================================

ALTER TABLE `appointments`
ADD COLUMN `reminder_1day_sent` TINYINT(1) NOT NULL DEFAULT 0 AFTER `clinic_id`,
ADD COLUMN `reminder_today_sent` TINYINT(1) NOT NULL DEFAULT 0 AFTER `reminder_1day_sent`;

-- =============================================================================
-- EXPLICACIÓN DE LAS NUEVAS COLUMNAS:
-- =============================================================================
-- * `reminder_1day_sent`:
--   - Tipo: TINYINT(1) (equivalente a BOOLEAN en MySQL).
--   - Valor por defecto: 0 (No enviado).
--   - Propósito: El sistema lo marcará como 1 (Enviado) cuando envíe con éxito
--     el correo electrónico de recordatorio "Falta 1 día para tu cita".
--
-- * `reminder_today_sent`:
--   - Tipo: TINYINT(1) (equivalente a BOOLEAN en MySQL).
--   - Valor por defecto: 0 (No enviado).
--   - Propósito: El sistema lo marcará como 1 (Enviado) cuando envíe con éxito
--     el correo electrónico de recordatorio "Hoy es tu cita médica".
-- =============================================================================
