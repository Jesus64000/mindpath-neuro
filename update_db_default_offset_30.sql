-- Script para establecer el valor por defecto a 30 minutos y actualizar registros existentes
ALTER TABLE `system_settings` MODIFY COLUMN `appointment_reminder_offset_minutes` INT DEFAULT 30;
UPDATE `system_settings` SET `appointment_reminder_offset_minutes` = 30 WHERE `appointment_reminder_offset_minutes` IS NULL OR `appointment_reminder_offset_minutes` = 90;
