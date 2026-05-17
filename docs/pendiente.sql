-- 1. Tabla para el catálogo de Clínicas/Hospitales
CREATE TABLE IF NOT EXISTS clinics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE
);

-- Insertamos algunas clínicas base para probar
INSERT IGNORE INTO clinics (name) VALUES 
('Mindpath Online'), ('Centro Médico Zulia'), ('Hospital San José'), ('Clínica Amado');

-- 2. Actualización de Pacientes
ALTER TABLE patients
ADD COLUMN dni VARCHAR(50) AFTER user_id,
ADD COLUMN medical_conditions TEXT AFTER date_of_birth,
ADD COLUMN current_medications TEXT AFTER medical_conditions,
ADD COLUMN health_insurance VARCHAR(150) AFTER current_medications;

-- 3. Actualización de Doctores (Unificada)
ALTER TABLE doctors
ADD COLUMN dni VARCHAR(50) AFTER user_id,
ADD COLUMN emergency_block_until DATETIME DEFAULT NULL AFTER is_blocked,
ADD COLUMN modality ENUM('online', 'presencial', 'ambas') DEFAULT 'ambas' AFTER specialty,
ADD COLUMN title_picture VARCHAR(255) AFTER profile_picture,
ADD COLUMN specialty_certificate VARCHAR(255) AFTER title_picture,
ADD COLUMN rif VARCHAR(100) AFTER specialty_certificate;

-- 4. Preparación para Fuentes (System Settings)
ALTER TABLE system_settings 
ADD COLUMN font_family VARCHAR(50) DEFAULT 'Inter' AFTER primary_color;

-- 5. Actualización del estado de las citas (¡CORREGIDO PARA NO ROMPER DATA!)
ALTER TABLE appointments 
MODIFY COLUMN status ENUM('scheduled', 'pending', 'confirmed', 'completed', 'cancelled', 'emergency_reschedule') DEFAULT 'scheduled';

-- 6. Sprint 33: Tabla de Excepciones de Horario (Días Libres)
CREATE TABLE IF NOT EXISTS doctor_exceptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    exception_date DATE NOT NULL,
    is_day_off BOOLEAN DEFAULT FALSE,
    start_time TIME DEFAULT NULL,
    end_time TIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    UNIQUE KEY unique_doctor_date (doctor_id, exception_date)
);

ALTER TABLE system_settings 
ADD COLUMN smtp_email VARCHAR(255) DEFAULT NULL,
ADD COLUMN smtp_password VARCHAR(255) DEFAULT NULL;

ALTER TABLE doctors
ADD COLUMN phone VARCHAR(20) DEFAULT NULL;

-- 7. Sprint 42: Motor de Reembolso y Tarifas Dinámicas
CREATE TABLE IF NOT EXISTS doctor_rate_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    modality ENUM('virtual', 'presencial', 'ambas') NOT NULL DEFAULT 'ambas',
    day_of_week ENUM('Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') DEFAULT NULL,
    start_time TIME DEFAULT NULL,
    end_time TIME DEFAULT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    priority INT NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

ALTER TABLE appointments
ADD COLUMN consultation_fee_snapshot DECIMAL(10,2) DEFAULT NULL AFTER type,
ADD COLUMN payment_method ENUM('platform', 'in_person') NOT NULL DEFAULT 'platform' AFTER consultation_fee_snapshot,
ADD COLUMN payment_status ENUM('pending', 'paid', 'verified', 'rejected') NOT NULL DEFAULT 'pending' AFTER payment_method,
ADD COLUMN payment_reference VARCHAR(150) DEFAULT NULL AFTER payment_status,
ADD COLUMN payment_collected_at DATETIME DEFAULT NULL AFTER payment_reference,
ADD COLUMN legal_verification_code VARCHAR(100) DEFAULT NULL AFTER payment_collected_at,
ADD COLUMN legal_verification_hash VARCHAR(128) DEFAULT NULL AFTER legal_verification_code;

CREATE TABLE IF NOT EXISTS payment_method_catalog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 100,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE payment_method_catalog
ADD COLUMN template_key VARCHAR(50) DEFAULT NULL AFTER description,
ADD COLUMN default_details_template TEXT DEFAULT NULL AFTER template_key;

INSERT IGNORE INTO payment_method_catalog (name, description, template_key, default_details_template, is_active, sort_order) VALUES
('Efectivo', 'Cobro presencial al finalizar la consulta', 'cash_in_person', 'Cobro en efectivo al finalizar la consulta.\nFavor traer monto exacto o cambio.', 1, 1),
('Pago móvil', 'Pago móvil nacional', 'mobile_payment', 'Banco: Banesco\nTeléfono: 0414-0000000\nCédula: V-12345678\nRIF: J-00000000-0', 1, 2),
('Transferencia nacional', 'Transferencia bancaria local', 'bank_transfer', 'Banco: Banesco\nTitular: Nombre Apellido\nCuenta: 0102-0000-00-0000000000\nCI/RIF: V-12345678\nTipo: Cuenta corriente', 1, 3),
('Transferencia internacional', 'Transferencia internacional o remesa', 'international_transfer', 'Banco: Banco internacional\nTitular: Nombre Apellido\nSWIFT/IBAN: XXXXXXXX\nCorreo: nombre@correo.com', 1, 4),
('Zelle', 'Pago internacional por Zelle', 'zelle', 'Correo Zelle: nombre@correo.com\nTitular: Nombre Apellido', 1, 5),
('Binance', 'Pago en cripto o stablecoins', 'binance', 'Binance ID: 123456789\nCorreo: nombre@correo.com\nUsuario: @miusuario', 1, 6),
('Pago por plataforma', 'Pago procesado por la plataforma', 'platform', 'El pago se procesa directamente desde la plataforma.\nLa confirmación queda registrada automáticamente.', 1, 7),
('Otro', 'Método de pago personalizado del doctor', 'other', 'Especifica aquí los datos de cobro personalizados.', 1, 8);

CREATE TABLE IF NOT EXISTS doctor_payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    catalog_method_id INT DEFAULT NULL,
    method_name VARCHAR(100) NOT NULL,
    account_details TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 100,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (catalog_method_id) REFERENCES payment_method_catalog(id) ON DELETE SET NULL
);