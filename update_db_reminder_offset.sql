-- Script para agregar configuración de recordatorio de citas en system_settings
ALTER TABLE `system_settings` ADD COLUMN `appointment_reminder_offset_minutes` INT DEFAULT 90;
