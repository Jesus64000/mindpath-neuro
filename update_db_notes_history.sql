-- =============================================================================
-- SCRIPT DE ACTUALIZACIÓN DE BASE DE DATOS: HISTORIAL DE NOTAS RÁPIDAS
-- =============================================================================
-- Este script elimina la restricción única de la tabla `doctor_patient_notes`
-- para permitir que un doctor guarde múltiples notas (historial) por paciente.
--
-- Instrucciones de ejecución (en DataGrip conectado a Aiven):
-- 1. Abre tu consola de DataGrip en tu base de datos de Mindpath.
-- 2. Copia, pega y ejecuta la siguiente sentencia ALTER TABLE.
-- =============================================================================

ALTER TABLE `doctor_patient_notes` DROP INDEX `uq_doctor_patient`;

-- =============================================================================
-- EXPLICACIÓN:
-- Al eliminar el índice único 'uq_doctor_patient', el sistema deja de restringir
-- a una sola fila la combinación (doctor_id, patient_id). Ahora se pueden 
-- insertar múltiples registros de notas por paciente con su respectiva fecha
-- y hora de creación.
-- =============================================================================
