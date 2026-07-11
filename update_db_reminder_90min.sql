-- Script para agregar columna de recordatorio de 90 minutos en la tabla appointments
ALTER TABLE `appointments` ADD COLUMN `reminder_90min_sent` BOOLEAN DEFAULT FALSE AFTER `reminder_today_sent`;
