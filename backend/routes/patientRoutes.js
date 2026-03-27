const express = require('express');
const router  = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware    = require('../middlewares/authMiddleware');

// Equipo médico del paciente
router.get('/my-doctors', authMiddleware, patientController.getMyDoctors);

// Perfil del paciente
router.get('/profile', authMiddleware, patientController.getProfile);
router.put('/profile', authMiddleware, patientController.updateProfile);

// Informe de una cita específica (solo si is_shared = TRUE)
router.get('/appointments/:appointmentId/report', authMiddleware, patientController.getAppointmentReport);

// Cancelar una cita
router.put('/appointments/:id/cancel', authMiddleware, patientController.cancelAppointment);

// Historial clínico completo
router.get('/my-history', authMiddleware, patientController.getMyHistory);

module.exports = router;
