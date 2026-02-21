const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rutas para el Doctor
router.get('/doctor', authMiddleware, appointmentController.getDoctorAppointments);
router.patch('/:id/status', authMiddleware, appointmentController.updateAppointmentStatus);

module.exports = router;
