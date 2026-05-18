-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 18-05-2026 a las 02:01:56
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `mindpath_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `appointments`
--

CREATE TABLE `appointments` (
  `id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `appointment_date` date NOT NULL,
  `start_time` time NOT NULL,
  `status` enum('scheduled','pending','confirmed','completed','cancelled','emergency_reschedule') DEFAULT 'scheduled',
  `type` enum('presencial','virtual') NOT NULL,
  `consultation_fee_snapshot` decimal(10,2) DEFAULT NULL,
  `payment_method` varchar(100) DEFAULT NULL,
  `payment_status` enum('pending','paid','verified','rejected') NOT NULL DEFAULT 'pending',
  `payment_reference` varchar(150) DEFAULT NULL,
  `payment_proof_url` varchar(255) DEFAULT NULL,
  `payment_collected_at` datetime DEFAULT NULL,
  `legal_verification_code` varchar(100) DEFAULT NULL,
  `legal_verification_hash` varchar(128) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `doctor_ready` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `appointments`
--

INSERT INTO `appointments` (`id`, `doctor_id`, `patient_id`, `appointment_date`, `start_time`, `status`, `type`, `consultation_fee_snapshot`, `payment_method`, `payment_status`, `payment_reference`, `payment_proof_url`, `payment_collected_at`, `legal_verification_code`, `legal_verification_hash`, `created_at`, `doctor_ready`) VALUES
(123, 1, 1, '2026-02-21', '10:00:00', 'completed', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-02-21 20:19:11', 0),
(124, 1, 1, '2026-02-23', '08:00:00', 'completed', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-02-21 20:31:17', 0),
(125, 1, 1, '2026-02-25', '14:00:00', 'completed', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-02-21 23:43:25', 0),
(126, 1, 1, '2026-02-23', '09:00:00', 'completed', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-02-22 00:20:09', 0),
(127, 1, 1, '2026-02-25', '15:30:00', 'completed', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-02-22 01:03:32', 0),
(128, 1, 1, '2026-02-23', '10:00:00', 'completed', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-02-22 01:31:31', 0),
(129, 1, 1, '2026-02-26', '11:30:00', 'completed', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-02-23 02:21:21', 0),
(130, 1, 1, '2026-02-26', '10:00:00', 'completed', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-02-23 02:21:58', 0),
(131, 1, 1, '2026-02-20', '10:30:00', 'completed', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-02-23 02:24:18', 0),
(132, 1, 1, '2026-02-28', '09:00:00', 'cancelled', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-02-23 02:26:16', 0),
(133, 1, 1, '2026-02-27', '09:30:00', 'completed', 'presencial', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-02-23 02:26:25', 0),
(134, 1, 2, '2026-02-25', '15:00:00', 'emergency_reschedule', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-02-24 16:32:11', 0),
(135, 1, 2, '2026-02-25', '16:30:00', 'emergency_reschedule', 'presencial', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-02-25 02:45:16', 0),
(136, 1, 2, '2026-02-25', '16:00:00', 'emergency_reschedule', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-02-25 02:45:46', 0),
(138, 1, 1, '2026-12-01', '08:30:00', 'cancelled', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-02-25 03:25:58', 0),
(139, 1, 2, '2026-02-24', '15:00:00', 'confirmed', 'presencial', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-02-25 03:32:08', 0),
(140, 1, 2, '2026-02-25', '10:00:00', 'confirmed', 'presencial', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-02-25 03:38:10', 0),
(141, 1, 2, '2026-02-27', '16:30:00', 'emergency_reschedule', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-02-27 14:37:28', 1),
(142, 1, 1, '2026-03-20', '13:30:00', 'cancelled', 'presencial', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-02-27 15:16:47', 0),
(143, 1, 1, '2026-02-27', '17:00:00', 'cancelled', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-02-27 15:17:59', 0),
(144, 8, 5, '2026-02-27', '15:00:00', 'pending', 'presencial', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-02-27 15:47:55', 0),
(145, 8, 5, '2026-02-27', '16:00:00', 'completed', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-02-27 15:48:12', 1),
(146, 1, 1, '2026-03-25', '11:30:00', 'cancelled', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-25 14:26:11', 0),
(147, 1, 1, '2026-03-25', '10:30:00', 'cancelled', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-25 14:27:37', 0),
(148, 1, 1, '2026-03-26', '11:30:00', 'cancelled', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-26 14:59:40', 0),
(149, 1, 1, '2026-03-27', '08:00:00', 'cancelled', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-26 15:01:22', 0),
(150, 1, 1, '2026-03-27', '12:00:00', 'cancelled', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-26 16:14:32', 0),
(151, 1, 1, '2026-03-30', '08:30:00', 'cancelled', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-26 16:14:47', 0),
(152, 1, 1, '2026-03-31', '14:00:00', 'cancelled', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-26 16:14:58', 0),
(153, 1, 1, '2026-04-01', '08:30:00', 'confirmed', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-26 16:15:07', 0),
(154, 1, 1, '2026-03-30', '11:00:00', 'confirmed', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-26 16:15:18', 0),
(155, 1, 1, '2026-03-31', '08:00:00', 'confirmed', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-26 16:15:39', 0),
(156, 1, 1, '2026-03-31', '09:30:00', 'confirmed', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-26 16:18:40', 0),
(157, 1, 1, '2026-03-31', '09:00:00', 'confirmed', 'presencial', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-26 16:18:59', 0),
(158, 1, 1, '2026-03-26', '13:00:00', 'cancelled', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-26 16:30:30', 0),
(159, 1, 1, '2026-03-31', '15:00:00', 'confirmed', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-26 16:30:37', 0),
(160, 1, 1, '2026-03-30', '09:00:00', 'confirmed', 'presencial', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-26 16:30:44', 0),
(161, 1, 1, '2026-04-01', '09:30:00', 'confirmed', 'presencial', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-26 16:30:54', 0),
(162, 1, 1, '2026-04-01', '11:30:00', 'cancelled', 'presencial', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-26 16:31:00', 0),
(163, 1, 1, '2026-03-31', '08:30:00', 'confirmed', 'presencial', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-26 16:31:23', 0),
(164, 1, 1, '2026-03-26', '16:00:00', 'cancelled', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-26 16:38:49', 0),
(165, 1, 1, '2026-03-26', '14:00:00', 'cancelled', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-26 16:39:31', 0),
(166, 1, 1, '2026-04-01', '09:00:00', 'confirmed', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-26 16:45:22', 0),
(167, 1, 1, '2026-03-30', '15:00:00', 'cancelled', 'presencial', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-26 16:45:30', 0),
(168, 1, 1, '2026-03-27', '21:00:00', 'cancelled', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-27 13:08:26', 0),
(169, 1, 1, '2026-03-27', '21:30:00', 'cancelled', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-27 13:08:32', 0),
(170, 1, 1, '2026-03-30', '14:00:00', 'confirmed', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-27 13:08:42', 0),
(171, 1, 1, '2026-03-30', '11:30:00', 'confirmed', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-27 13:08:48', 0),
(172, 1, 1, '2026-04-02', '08:30:00', 'cancelled', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-27 13:10:31', 0),
(173, 1, 1, '2026-04-01', '10:30:00', 'cancelled', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-27 13:10:37', 0),
(174, 1, 1, '2026-03-30', '13:00:00', 'confirmed', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-27 13:13:18', 0),
(175, 1, 1, '2026-03-27', '20:30:00', 'cancelled', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-27 13:15:36', 0),
(176, 1, 1, '2026-04-02', '16:00:00', 'cancelled', 'presencial', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-27 13:16:49', 0),
(177, 1, 1, '2026-03-27', '21:30:00', 'cancelled', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-27 13:17:13', 0),
(178, 1, 1, '2026-03-30', '09:30:00', 'confirmed', 'presencial', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-30 00:00:43', 0),
(179, 1, 1, '2026-04-02', '09:00:00', 'cancelled', 'virtual', NULL, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-31 19:00:20', 0),
(180, 1, 1, '2026-05-04', '08:30:00', 'cancelled', 'virtual', 0.00, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-05-01 21:07:55', 0),
(181, 1, 1, '2026-05-11', '08:00:00', 'cancelled', 'virtual', 0.00, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-05-09 14:40:50', 0),
(182, 1, 1, '2026-05-11', '09:00:00', 'cancelled', 'presencial', 0.00, 'in_person', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-05-09 14:41:05', 0),
(183, 1, 1, '2026-05-09', '11:00:00', 'cancelled', 'virtual', 0.00, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-05-09 14:42:11', 0),
(184, 1, 1, '2026-05-09', '11:30:00', 'cancelled', 'presencial', 0.00, 'in_person', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-05-09 14:42:32', 0),
(185, 1, 1, '2026-05-11', '08:30:00', 'cancelled', 'virtual', 0.00, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-05-09 15:24:53', 0),
(186, 1, 1, '2026-05-13', '08:00:00', 'cancelled', 'virtual', 0.00, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-05-12 23:01:05', 0),
(187, 1, 1, '2026-05-13', '09:00:00', 'cancelled', 'virtual', 0.00, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-05-12 23:20:13', 0),
(188, 1, 1, '2026-05-13', '11:30:00', 'cancelled', 'virtual', 0.00, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-05-12 23:20:40', 0),
(189, 1, 1, '2026-05-14', '14:00:00', 'cancelled', 'virtual', 0.00, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-05-12 23:26:22', 0),
(190, 1, 1, '2026-05-14', '09:30:00', 'cancelled', 'virtual', 0.00, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-05-14 01:52:47', 0),
(191, 1, 1, '2026-05-18', '08:00:00', 'pending', 'virtual', 0.00, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-05-17 03:17:53', 0),
(192, 1, 1, '2026-05-18', '08:30:00', 'cancelled', 'virtual', 0.00, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-05-17 03:20:42', 0),
(193, 1, 1, '2026-05-18', '11:00:00', 'pending', 'virtual', 20.00, 'platform', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-05-17 03:32:29', 0),
(194, 1, 1, '2026-05-19', '08:00:00', 'confirmed', 'virtual', 20.00, 'Pago Movil Mercantil', 'paid', '5465321345', '/uploads/file-1779027979205-317548535.png', NULL, NULL, NULL, '2026-05-17 13:46:56', 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clinical_reports`
--

CREATE TABLE `clinical_reports` (
  `id` int(11) NOT NULL,
  `consultation_id` int(11) NOT NULL,
  `motivo_sintomas` text DEFAULT NULL,
  `ai_confidence_score` decimal(5,2) DEFAULT NULL,
  `is_validated` tinyint(1) DEFAULT 0,
  `validated_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `antecedentes` text DEFAULT NULL,
  `hallazgos` text DEFAULT NULL,
  `diagnostico` text DEFAULT NULL,
  `tratamiento` text DEFAULT NULL,
  `estudios_observaciones` text DEFAULT NULL,
  `private_notes` text DEFAULT NULL,
  `is_shared` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `clinical_reports`
--

INSERT INTO `clinical_reports` (`id`, `consultation_id`, `motivo_sintomas`, `ai_confidence_score`, `is_validated`, `validated_at`, `created_at`, `antecedentes`, `hallazgos`, `diagnostico`, `tratamiento`, `estudios_observaciones`, `private_notes`, `is_shared`) VALUES
(1, 3, NULL, 98.50, 0, NULL, '2026-02-21 20:20:38', NULL, NULL, NULL, NULL, NULL, NULL, 0),
(2, 4, NULL, 98.50, 0, NULL, '2026-02-21 23:44:45', NULL, NULL, NULL, NULL, NULL, NULL, 0),
(3, 5, NULL, 98.50, 0, NULL, '2026-02-22 00:19:54', NULL, NULL, NULL, NULL, NULL, NULL, 0),
(4, 6, NULL, 98.50, 0, NULL, '2026-02-22 00:59:58', NULL, NULL, NULL, NULL, NULL, NULL, 0),
(5, 7, NULL, 98.50, 0, NULL, '2026-02-23 17:39:20', NULL, NULL, NULL, NULL, NULL, NULL, 0),
(6, 8, NULL, 98.50, 0, NULL, '2026-02-23 17:44:01', NULL, NULL, NULL, NULL, NULL, NULL, 0),
(7, 9, NULL, 98.50, 0, NULL, '2026-02-23 17:48:58', NULL, NULL, NULL, NULL, NULL, NULL, 0),
(8, 10, NULL, 98.50, 0, NULL, '2026-02-23 17:54:39', NULL, NULL, NULL, NULL, NULL, NULL, 0),
(12, 11, 'Pérdida del conocimiento con movimientos tónico clónicos generalizados y un periodo de confusión postictal', NULL, 0, NULL, '2026-02-24 02:14:36', 'Traumatismo craneoencefálico leve hace 3 años, alergias a medicamentos, sin antecedentes familiares de epilepsia', 'Paciente consciente, orientado, pupilas isocóricas y reactivas a la luz, sin déficits físicos, motores ni sensitivos, marcha normal, tensión arterial 115/75', 'Primer episodio convulsivo a estudio con sospecha de prioridad secundaria a traumatismo previo', 'Levetiracetam 500 mg vía oral cada 12 horas', 'Electrocardiograma en vigilia y sueño, resonancia magnética cerebral simple, previsión estricta de conducir vehículos o manejar maquinaria pesada hasta tener resultados, cita de control en 15 días', '', 0),
(13, 12, 'Dolores de cabeza intensos y pulsátiles en la mitad derecha del cráneo, acompañados de líneas zigzagueantes brillantes en el campo visual, sensibilidad a la luz y náuseas.', NULL, 0, NULL, '2026-02-27 14:36:08', 'Migrañas crónicas, niega hipertensión, diabetes y alergias.', 'Paciente alerta y orientado, pares craneales intactos, fondo de ojo normal, sin papiledema, fuerza motora y sensibilidad conservadas al 100% y marcha normal.', 'Migraña con aura típica.', 'Sumatriptán 50 mg al inicio del dolor y naproxeno 500 mg cada 12 horas por tres días durante las crisis.', 'No se considera necesario una resonancia magnética en este momento, se indica al paciente llevar un diario de crisis para identificar factores desencadenantes.', '', 1),
(14, 13, 'Dolores de cabeza intensos de carácter bursátil en la mitad derecha del cráneo, con síntomas como líneas en zig-zag brillantes en el campo visual, sensibilidad a la luz y náuseas.', NULL, 0, NULL, '2026-02-27 15:53:19', 'Madre con migrañas crónicas, hipertensión, no hay antecedentes de diabetes ni alergias a medicamentos.', 'Paciente alerta y orientado, pares craneales intactos, fondo de ojo normal sin papila edema, fuerza motora y sensibilidad conservadas al 100% en las cuatro extremidades y marcha normal.', 'Migraña con aura típica.', 'Sumatriptán 50 mg al inicio del dolor y naproxeno 500 mg cada 12 horas por 3 días durante las crisis.', 'No se considera necesario una resonancia magnética en este momento, se indica al paciente llevar un diario de cefaleas para identificar factores desencadenantes.', 'Paciente Muy Nervioso', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clinics`
--

CREATE TABLE `clinics` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `clinics`
--

INSERT INTO `clinics` (`id`, `name`) VALUES
(2, 'Centro Médico Zulia'),
(4, 'Clínica Amado'),
(3, 'Hospital San José'),
(1, 'Mindpath Online');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `consultations`
--

CREATE TABLE `consultations` (
  `id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime DEFAULT NULL,
  `video_call_room_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `consultations`
--

INSERT INTO `consultations` (`id`, `appointment_id`, `start_datetime`, `end_datetime`, `video_call_room_id`, `created_at`) VALUES
(3, 123, '2026-02-21 16:05:35', '2026-02-21 16:20:35', NULL, '2026-02-21 20:20:35'),
(4, 124, '2026-02-21 19:29:42', '2026-02-21 19:44:42', NULL, '2026-02-21 23:44:42'),
(5, 125, '2026-02-21 20:04:51', '2026-02-21 20:19:51', NULL, '2026-02-22 00:19:51'),
(6, 126, '2026-02-21 20:44:55', '2026-02-21 20:59:55', NULL, '2026-02-22 00:59:55'),
(7, 128, '2026-02-23 13:24:17', '2026-02-23 13:39:17', NULL, '2026-02-23 17:39:17'),
(8, 131, '2026-02-23 13:28:58', '2026-02-23 13:43:58', NULL, '2026-02-23 17:43:58'),
(9, 127, '2026-02-23 13:33:55', '2026-02-23 13:48:55', NULL, '2026-02-23 17:48:55'),
(10, 130, '2026-02-23 13:39:36', '2026-02-23 13:54:36', NULL, '2026-02-23 17:54:36'),
(11, 129, '2026-02-23 21:14:36', '2026-02-23 22:14:36', NULL, '2026-02-24 02:14:36'),
(12, 133, '2026-02-27 09:30:00', '2026-02-27 10:36:08', NULL, '2026-02-27 14:36:08'),
(13, 145, '2026-02-27 16:00:00', '2026-02-27 11:53:19', NULL, '2026-02-27 15:53:19');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `consultation_audio`
--

CREATE TABLE `consultation_audio` (
  `id` int(11) NOT NULL,
  `consultation_id` int(11) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `transcription_raw` text DEFAULT NULL,
  `status` enum('uploading','processing','completed','error') DEFAULT 'uploading',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `consultation_audio`
--

INSERT INTO `consultation_audio` (`id`, `consultation_id`, `file_path`, `transcription_raw`, `status`, `created_at`) VALUES
(1, 3, 'uploads\\consulta-123-1771705235285-332850180.webm', NULL, 'completed', '2026-02-21 20:20:35'),
(2, 4, 'uploads\\consulta-124-1771717482612-367509412.webm', NULL, 'completed', '2026-02-21 23:44:42'),
(3, 5, 'uploads\\consulta-125-1771719591546-478881226.webm', NULL, 'completed', '2026-02-22 00:19:51'),
(4, 6, 'uploads\\consulta-126-1771721994289-848023580.webm', NULL, 'completed', '2026-02-22 00:59:55'),
(5, 7, 'uploads\\consulta-128-1771868356999-278947428.webm', NULL, 'completed', '2026-02-23 17:39:17'),
(6, 8, 'uploads\\consulta-131-1771868638766-703690753.webm', NULL, 'completed', '2026-02-23 17:43:58'),
(7, 9, 'uploads\\consulta-127-1771868935727-727628980.webm', NULL, 'completed', '2026-02-23 17:48:55'),
(8, 10, 'uploads\\consulta-130-1771869275855-418243813.webm', NULL, 'completed', '2026-02-23 17:54:36');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `doctors`
--

CREATE TABLE `doctors` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `dni` varchar(50) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `is_blocked` tinyint(1) NOT NULL DEFAULT 0,
  `emergency_block_until` datetime DEFAULT NULL,
  `specialty` varchar(100) NOT NULL,
  `modality` enum('online','presencial','ambas') DEFAULT 'ambas',
  `license_number` varchar(50) NOT NULL,
  `bio` text DEFAULT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `title_picture` varchar(255) DEFAULT NULL,
  `specialty_certificate` varchar(255) DEFAULT NULL,
  `rif` varchar(100) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `experience_years` int(11) DEFAULT 0,
  `languages` varchar(255) DEFAULT 'Español',
  `education` varchar(255) DEFAULT NULL,
  `clinic_name` varchar(150) DEFAULT NULL,
  `clinic_address` varchar(255) DEFAULT NULL,
  `consultation_fee` decimal(10,2) DEFAULT 0.00,
  `verification_notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `doctors`
--

INSERT INTO `doctors` (`id`, `user_id`, `dni`, `phone`, `is_blocked`, `emergency_block_until`, `specialty`, `modality`, `license_number`, `bio`, `profile_picture`, `title_picture`, `specialty_certificate`, `rif`, `is_verified`, `experience_years`, `languages`, `education`, `clinic_name`, `clinic_address`, `consultation_fee`, `verification_notes`) VALUES
(1, 1, NULL, NULL, 0, NULL, 'Neurología', 'ambas', 'MED-123456', '', '/uploads/avatar_1774456938753.jpg', NULL, NULL, NULL, 1, 4, 'Español, Inglés', 'Universidad del Zulia', 'Hospital el rosario', '', 20.00, NULL),
(2, 3, NULL, NULL, 0, NULL, 'Neurología Clínica', 'ambas', 'MED-789012', NULL, NULL, NULL, NULL, NULL, 1, 0, 'Español', NULL, NULL, NULL, 0.00, NULL),
(3, 4, NULL, NULL, 0, NULL, 'Neurocirugía', 'ambas', 'MED-345678', NULL, NULL, NULL, NULL, NULL, 1, 0, 'Español', NULL, NULL, NULL, 0.00, NULL),
(4, 5, NULL, NULL, 0, NULL, 'Neurología Pediátrica', 'ambas', 'MED-556677', NULL, NULL, NULL, NULL, NULL, 1, 0, 'Español', NULL, NULL, NULL, 0.00, NULL),
(5, 6, NULL, NULL, 0, NULL, 'Neuropsiquiatría', 'ambas', 'MED-998877', NULL, NULL, NULL, NULL, NULL, 1, 0, 'Español', NULL, NULL, NULL, 0.00, NULL),
(6, 8, NULL, NULL, 0, NULL, 'Neurocirugía', 'ambas', '54564678', '', NULL, NULL, NULL, NULL, 1, 1, 'Español', 'universidad del zulia', 'Centro Medico Caimas', '', NULL, NULL),
(7, 10, NULL, NULL, 0, NULL, 'Neuropsicología', 'ambas', 'MED-4568', NULL, NULL, NULL, NULL, NULL, 1, 0, 'Español', NULL, 'Direccion inventada', NULL, 0.00, NULL),
(8, 14, NULL, NULL, 0, NULL, 'General', 'ambas', 'MED-546', '', NULL, NULL, NULL, NULL, 1, 0, 'Español', 'Universidad del zulia', 'Clinica Z', '', NULL, NULL),
(9, 16, '30086286', '04246120867', 0, NULL, 'General', 'online', '564897', NULL, NULL, NULL, NULL, '687687', 1, NULL, NULL, NULL, 'Centro Médico Zulia', NULL, 0.00, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `doctor_exceptions`
--

CREATE TABLE `doctor_exceptions` (
  `id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `exception_date` date NOT NULL,
  `is_day_off` tinyint(1) DEFAULT 0,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `doctor_patient_notes`
--

CREATE TABLE `doctor_patient_notes` (
  `id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `notes` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `doctor_patient_notes`
--

INSERT INTO `doctor_patient_notes` (`id`, `doctor_id`, `patient_id`, `notes`, `updated_at`) VALUES
(1, 1, 1, '', '2026-02-27 14:43:30');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `doctor_payment_methods`
--

CREATE TABLE `doctor_payment_methods` (
  `id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `catalog_method_id` int(11) DEFAULT NULL,
  `method_name` varchar(100) NOT NULL,
  `account_details` text NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 100,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `doctor_payment_methods`
--

INSERT INTO `doctor_payment_methods` (`id`, `doctor_id`, `catalog_method_id`, `method_name`, `account_details`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 1, 7, 'Pago Movil Mercantil', 'Banco: Mercantil\nTeléfono: 04245654545\nDocumento: V-30015454', 1, 1, '2026-05-09 14:40:14', '2026-05-17 03:29:41');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `doctor_rate_rules`
--

CREATE TABLE `doctor_rate_rules` (
  `id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `modality` enum('virtual','presencial','ambas') NOT NULL DEFAULT 'ambas',
  `day_of_week` enum('Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'USD',
  `priority` int(11) NOT NULL DEFAULT 100,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `doctor_ratings`
--

CREATE TABLE `doctor_ratings` (
  `id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` between 1 and 5),
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `doctor_ratings`
--

INSERT INTO `doctor_ratings` (`id`, `doctor_id`, `patient_id`, `appointment_id`, `rating`, `comment`, `created_at`) VALUES
(1, 8, 5, 145, 4, 'Muy buena atencion', '2026-02-27 15:55:55'),
(2, 1, 1, 133, 5, NULL, '2026-03-30 00:00:58'),
(3, 1, 1, 129, 5, NULL, '2026-03-30 00:01:02'),
(4, 1, 1, 133, 5, NULL, '2026-03-31 19:00:43');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `doctor_schedules`
--

CREATE TABLE `doctor_schedules` (
  `id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `day_of_week` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `slot_duration` int(11) DEFAULT 30
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `doctor_schedules`
--

INSERT INTO `doctor_schedules` (`id`, `doctor_id`, `day_of_week`, `start_time`, `end_time`, `slot_duration`) VALUES
(11, 1, 'Tuesday', '08:00:00', '10:00:00', 30),
(12, 1, 'Tuesday', '14:00:00', '16:00:00', 60),
(13, 1, 'Wednesday', '08:00:00', '12:00:00', 30),
(14, 1, 'Friday', '08:00:00', '22:00:00', 30),
(15, 7, 'Friday', '08:00:00', '12:00:00', 60),
(16, 8, 'Friday', '14:00:00', '17:00:00', 60),
(17, 1, 'Monday', '08:00:00', '12:00:00', 30),
(19, 1, 'Thursday', '08:00:00', '12:00:00', 30),
(21, 1, 'Monday', '13:00:00', '16:00:00', 60),
(22, 1, 'Thursday', '13:00:00', '17:00:00', 60),
(23, 1, 'Saturday', '08:00:00', '12:00:00', 30);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `invoices`
--

CREATE TABLE `invoices` (
  `id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `invoice_number` varchar(50) NOT NULL,
  `base_amount` decimal(10,2) NOT NULL,
  `tax_amount` decimal(10,2) DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'USD',
  `legal_text` text NOT NULL,
  `pdf_path` varchar(255) DEFAULT NULL,
  `issued_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `patients`
--

CREATE TABLE `patients` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `dni` varchar(50) DEFAULT NULL,
  `date_of_birth` date NOT NULL,
  `medical_conditions` text DEFAULT NULL,
  `current_medications` text DEFAULT NULL,
  `health_insurance` varchar(150) DEFAULT NULL,
  `gender` enum('M','F','Other') NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `profile_picture` varchar(500) DEFAULT NULL,
  `emergency_contact` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `patients`
--

INSERT INTO `patients` (`id`, `user_id`, `dni`, `date_of_birth`, `medical_conditions`, `current_medications`, `health_insurance`, `gender`, `phone`, `address`, `profile_picture`, `emergency_contact`) VALUES
(1, 2, NULL, '2002-05-15', NULL, NULL, NULL, 'M', '+1234567890', '', '/uploads/avatar_1774446499691.jpg', NULL),
(2, 7, NULL, '1999-02-15', NULL, NULL, NULL, 'M', '04245648797', NULL, NULL, NULL),
(3, 11, NULL, '1990-05-15', NULL, NULL, NULL, 'F', '', NULL, NULL, NULL),
(4, 12, NULL, '2000-04-04', NULL, NULL, NULL, 'M', '04245458798', NULL, NULL, NULL),
(5, 13, NULL, '2000-02-15', NULL, NULL, NULL, 'M', '04245654878', NULL, NULL, NULL),
(6, 17, '12354687', '2001-06-05', NULL, NULL, NULL, 'M', '04245654654', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `payment_method_catalog`
--

CREATE TABLE `payment_method_catalog` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `template_key` varchar(50) DEFAULT NULL,
  `default_details_template` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 100,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `payment_method_catalog`
--

INSERT INTO `payment_method_catalog` (`id`, `name`, `description`, `template_key`, `default_details_template`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'Efectivo en consultorio', 'Cobro presencial al finalizar la consulta', NULL, NULL, 1, 1, '2026-05-01 20:35:36', NULL),
(2, 'Transferencia bancaria', 'Pago por transferencia o depósito', NULL, NULL, 1, 2, '2026-05-01 20:35:36', NULL),
(3, 'Zelle', 'Pago internacional por Zelle', NULL, NULL, 1, 3, '2026-05-01 20:35:36', NULL),
(4, 'Binance', 'Pago en cripto o stablecoins', NULL, NULL, 1, 4, '2026-05-01 20:35:36', NULL),
(5, 'Pago por plataforma', 'Pago procesado por la plataforma', NULL, NULL, 1, 5, '2026-05-01 20:35:36', NULL),
(6, 'Paypal', 'Pago internacional por PayPal', NULL, NULL, 1, 6, '2026-05-09 02:04:15', NULL),
(7, 'Pago Movil', 'Pago rápido nacional', NULL, NULL, 1, 7, '2026-05-09 02:04:15', NULL),
(8, 'Efectivo', 'Cobro presencial al finalizar la consulta', 'cash_in_person', 'Cobro en efectivo al finalizar la consulta.\nFavor traer monto exacto o cambio.', 1, 1, '2026-05-09 14:28:28', NULL),
(9, 'Transferencia nacional', 'Transferencia bancaria local', 'bank_transfer', 'Banco: Banesco\nTitular: Nombre Apellido\nCuenta: 0102-0000-00-0000000000\nCI/RIF: V-12345678\nTipo: Cuenta corriente', 1, 3, '2026-05-09 14:28:28', NULL),
(10, 'Transferencia internacional', 'Transferencia internacional o remesa', 'international_transfer', 'Banco: Banco internacional\nTitular: Nombre Apellido\nSWIFT/IBAN: XXXXXXXX\nCorreo: nombre@correo.com', 1, 4, '2026-05-09 14:28:28', NULL),
(11, 'Otro', 'Método de pago personalizado del doctor', 'other', 'Especifica aquí los datos de cobro personalizados.', 1, 8, '2026-05-09 14:28:28', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `specialties`
--

CREATE TABLE `specialties` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `specialties`
--

INSERT INTO `specialties` (`id`, `name`) VALUES
(13, 'General'),
(5, 'Neurocirugía'),
(1, 'Neurología'),
(4, 'Neuropediatría'),
(6, 'Neuropsicología'),
(10, 'Psicoanálisis'),
(3, 'Psicología Clínica'),
(2, 'Psiquiatría'),
(11, 'Terapia Cognitivo-Conductual');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL DEFAULT 1,
  `clinic_name` varchar(255) NOT NULL DEFAULT 'MindPath Neuro',
  `logo_url` varchar(500) DEFAULT NULL,
  `primary_color` varchar(7) NOT NULL DEFAULT '#6D28D9',
  `font_family` varchar(50) DEFAULT 'Inter',
  `primary_hover` varchar(7) NOT NULL DEFAULT '#5B21B6',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `smtp_email` varchar(255) DEFAULT NULL,
  `smtp_password` varchar(255) DEFAULT NULL,
  `exchange_rate` decimal(10,4) DEFAULT 36.5000,
  `exchange_rate_mode` enum('auto','manual') DEFAULT 'auto',
  `exchange_rate_updated_at` timestamp NULL DEFAULT NULL
) ;

--
-- Volcado de datos para la tabla `system_settings`
--

INSERT INTO `system_settings` (`id`, `clinic_name`, `logo_url`, `primary_color`, `font_family`, `primary_hover`, `updated_at`, `smtp_email`, `smtp_password`, `exchange_rate`, `exchange_rate_mode`, `exchange_rate_updated_at`) VALUES
(1, 'MindPath Neuro', '', '#6D28D9', 'system-ui', '#5B21B6', '2026-05-17 13:46:29', NULL, NULL, 515.1800, 'auto', '2026-05-17 13:46:29');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `role` enum('doctor','patient','admin','supervisor') NOT NULL DEFAULT 'patient',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `full_name`, `role`, `created_at`, `updated_at`, `is_active`, `reset_token`, `reset_token_expires`) VALUES
(1, 'doctor@doctor.com', '$2b$10$J8hMnP32kxh8lrQdMfR9gulYOjF9JB.fPxd1C5CWLV2jOFpps5Jla', 'Pedro Perez', 'doctor', '2026-02-21 16:28:15', '2026-02-21 16:28:15', 1, NULL, NULL),
(2, 'paciente@paciente.com', '$2b$10$pYRfAYae8DWYc7ZCLMxF1OyftAHbJArqrWVi4lkgOWRwk62rlp0T2', 'Jane Doe', 'patient', '2026-02-21 16:29:31', '2026-02-21 16:29:31', 1, NULL, NULL),
(3, 'doctor2@doctor.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dr. Carlos Mendoza', 'doctor', '2026-02-21 18:43:25', '2026-02-24 14:00:19', 1, NULL, NULL),
(4, 'doctor3@doctor.com', '$2b$10$/j0xLB4gDjS95DInxYSboeNBj37nH0/YL1OOG3CtrjODqgrKYqe16', 'Dra. Ana Silva', 'doctor', '2026-02-21 18:43:59', '2026-02-21 18:43:59', 1, NULL, NULL),
(5, 'doctor4@doctor.com', '$2b$10$2nPAaObzNm0ApmpH4wZL0.dDKw6J1QPgK4xlMFqvN1YXt4WkiNxKC', 'Dr. Luis Herrera', 'doctor', '2026-02-21 18:44:31', '2026-02-21 18:44:31', 1, NULL, NULL),
(6, 'doctor5@doctor.com', '$2b$10$pbPhgFgjXcJuRFX45kUmC.8TBuxBvMu.ulxs9hmxCTXxEGpQmvMli', 'Dra. Elena Rojas', 'doctor', '2026-02-21 18:44:56', '2026-02-21 18:44:56', 1, NULL, NULL),
(7, 'paciente2@paciente.com', '$2b$10$BTDV647ieXm7AV0BCANR2eNeP5ETlMr1qkCT5Nbefh8/30hInQB8.', 'Paciente nuevo', 'patient', '2026-02-24 14:09:00', '2026-02-27 01:02:38', 1, NULL, NULL),
(8, 'doctorm@doctor.com', '$2b$10$kWB9Xg1P9TUWXYTlfuGikuTjUbMdv74QAX6wQEjOWFldOHPIVQe.G', 'Mario Castañeda', 'doctor', '2026-02-24 14:10:24', '2026-02-24 19:08:17', 1, NULL, NULL),
(9, 'admin@admin.com', '$2b$10$mUqRv1MQIgcywaCh9CU59u3gMFts5PiGnMx9GySyo6Z1ChJ7WlOr6', 'Super Admin', 'admin', '2026-02-24 19:51:28', '2026-02-24 19:51:28', 1, NULL, NULL),
(10, 'Mario@doctor.com', '$2b$10$S2NvBRHbEIeYZIUjfD2/ZOPkviEhXNG7LkT2nn9vY0CVYt7.CWJ/C', 'Mario ', 'doctor', '2026-02-25 03:42:53', '2026-02-25 03:42:53', 1, NULL, NULL),
(11, 'prueba.auto@example.com', '$2b$10$zpBFbc7Hp24VKMi1FucW.uJJsuYGrOZiNHPWV.cTUXDu17Ho/dZ6O', 'Paciente de Prueba Automatizada', 'patient', '2026-02-25 15:40:15', '2026-02-25 15:40:15', 1, NULL, NULL),
(12, 'administrador@administrador.com', '$2b$10$Qz7nK.pKtTfx7N/1cnDz1eeWOIr4ORMDxCPMQmb4W/Dm0L6giZ2qi', 'administrador', 'supervisor', '2026-02-27 01:03:43', '2026-02-27 01:04:21', 1, NULL, NULL),
(13, 'paciente3@paciente.com', '$2b$10$c3o9Q3tkq0UkrVvKylSG0e939jKE2WJji/wjL9msraS./VUoRTa0G', 'Marcos Lopez', 'patient', '2026-02-27 15:43:14', '2026-03-31 18:38:01', 1, 'f766ad3761ee8691af1e3c001beb0a56f630432af4fd0a4daeafcee2a9b63661', '2026-03-31 15:38:01'),
(14, 'doctornv@doctor.com', '$2b$10$ZmhE/p3gkDc0tEhsHqZVlO.fU70gJKnKMtFh37oRQOu1ZeDELIvFa', 'Goku', 'doctor', '2026-02-27 15:45:06', '2026-02-27 15:45:06', 1, NULL, NULL),
(16, 'pazjesus2504@gmail.com', '$2b$10$ohGqguIQ9UqxbEs2UcHEM.nrsegWUXuJrzjXrTMRRtQiAmdmKp5a6', 'jesus paz ', 'doctor', '2026-04-30 12:53:53', '2026-04-30 12:53:53', 1, NULL, NULL),
(17, 'pacientedeprueva@paciente.com', '$2b$10$pcJkG4CZqPEBB91ynSXczu0ZES.mQsY0UeNrFCScS119KGl3hAJme', 'nuevo paciente nuevo', 'patient', '2026-04-30 13:19:04', '2026-04-30 13:19:04', 1, NULL, NULL);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `doctor_id` (`doctor_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `idx_appointment_date` (`appointment_date`);

--
-- Indices de la tabla `clinical_reports`
--
ALTER TABLE `clinical_reports`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `consultation_id` (`consultation_id`);

--
-- Indices de la tabla `clinics`
--
ALTER TABLE `clinics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indices de la tabla `consultations`
--
ALTER TABLE `consultations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `appointment_id` (`appointment_id`),
  ADD UNIQUE KEY `uq_appointment` (`appointment_id`);

--
-- Indices de la tabla `consultation_audio`
--
ALTER TABLE `consultation_audio`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `consultation_id` (`consultation_id`);

--
-- Indices de la tabla `doctors`
--
ALTER TABLE `doctors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `license_number` (`license_number`);

--
-- Indices de la tabla `doctor_exceptions`
--
ALTER TABLE `doctor_exceptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_doctor_date` (`doctor_id`,`exception_date`);

--
-- Indices de la tabla `doctor_patient_notes`
--
ALTER TABLE `doctor_patient_notes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_doctor_patient` (`doctor_id`,`patient_id`);

--
-- Indices de la tabla `doctor_payment_methods`
--
ALTER TABLE `doctor_payment_methods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `doctor_id` (`doctor_id`),
  ADD KEY `fk_doctor_payment_methods_catalog` (`catalog_method_id`);

--
-- Indices de la tabla `doctor_rate_rules`
--
ALTER TABLE `doctor_rate_rules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indices de la tabla `doctor_ratings`
--
ALTER TABLE `doctor_ratings`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `doctor_schedules`
--
ALTER TABLE `doctor_schedules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_schedule` (`doctor_id`,`day_of_week`,`start_time`);

--
-- Indices de la tabla `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD KEY `appointment_id` (`appointment_id`),
  ADD KEY `doctor_id` (`doctor_id`),
  ADD KEY `patient_id` (`patient_id`);

--
-- Indices de la tabla `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indices de la tabla `payment_method_catalog`
--
ALTER TABLE `payment_method_catalog`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indices de la tabla `specialties`
--
ALTER TABLE `specialties`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indices de la tabla `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=195;

--
-- AUTO_INCREMENT de la tabla `clinical_reports`
--
ALTER TABLE `clinical_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `clinics`
--
ALTER TABLE `clinics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT de la tabla `consultations`
--
ALTER TABLE `consultations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `consultation_audio`
--
ALTER TABLE `consultation_audio`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `doctors`
--
ALTER TABLE `doctors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `doctor_exceptions`
--
ALTER TABLE `doctor_exceptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `doctor_patient_notes`
--
ALTER TABLE `doctor_patient_notes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `doctor_payment_methods`
--
ALTER TABLE `doctor_payment_methods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `doctor_rate_rules`
--
ALTER TABLE `doctor_rate_rules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `doctor_ratings`
--
ALTER TABLE `doctor_ratings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `doctor_schedules`
--
ALTER TABLE `doctor_schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT de la tabla `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `patients`
--
ALTER TABLE `patients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `payment_method_catalog`
--
ALTER TABLE `payment_method_catalog`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT de la tabla `specialties`
--
ALTER TABLE `specialties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`),
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`);

--
-- Filtros para la tabla `clinical_reports`
--
ALTER TABLE `clinical_reports`
  ADD CONSTRAINT `clinical_reports_ibfk_1` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `consultations`
--
ALTER TABLE `consultations`
  ADD CONSTRAINT `consultations_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`);

--
-- Filtros para la tabla `consultation_audio`
--
ALTER TABLE `consultation_audio`
  ADD CONSTRAINT `consultation_audio_ibfk_1` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `doctors`
--
ALTER TABLE `doctors`
  ADD CONSTRAINT `doctors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `doctor_exceptions`
--
ALTER TABLE `doctor_exceptions`
  ADD CONSTRAINT `doctor_exceptions_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `doctor_payment_methods`
--
ALTER TABLE `doctor_payment_methods`
  ADD CONSTRAINT `doctor_payment_methods_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_doctor_payment_methods_catalog` FOREIGN KEY (`catalog_method_id`) REFERENCES `payment_method_catalog` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `doctor_rate_rules`
--
ALTER TABLE `doctor_rate_rules`
  ADD CONSTRAINT `doctor_rate_rules_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `doctor_schedules`
--
ALTER TABLE `doctor_schedules`
  ADD CONSTRAINT `doctor_schedules_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `invoices_ibfk_3` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `patients`
--
ALTER TABLE `patients`
  ADD CONSTRAINT `patients_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
