const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rutas para el Doctor
router.get('/doctor', authMiddleware, appointmentController.getDoctorAppointments);
router.get('/doctor/summary', authMiddleware, appointmentController.getDoctorDashboardSummary);
router.put('/:id/status', authMiddleware, appointmentController.updateStatus);
router.patch('/doctor/block', authMiddleware, appointmentController.updateDoctorBlockStatus);

// Ruta para el Paciente
router.get('/patient', authMiddleware, appointmentController.getPatientAppointments);

// Detalle completo de una cita (pantalla pre-consulta del doctor)
router.get('/doctor/:id/detail', authMiddleware, appointmentController.getAppointmentDetail);

// Sprint 27: Sala de Espera Virtual
router.get('/:id/room-status', authMiddleware, appointmentController.getRoomStatus);
router.patch('/:id/doctor-ready', authMiddleware, appointmentController.setDoctorReady);

module.exports = router;

