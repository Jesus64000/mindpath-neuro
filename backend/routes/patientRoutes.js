const express = require('express');
const router  = express.Router();
const patientController = require('../controllers/patientController');
const appointmentController = require('../controllers/appointmentController');
const authMiddleware    = require('../middlewares/authMiddleware');

// Equipo médico del paciente
router.get('/my-doctors', authMiddleware, patientController.getMyDoctors);

// Perfil del paciente
router.get('/profile', authMiddleware, patientController.getProfile);
router.put('/profile', authMiddleware, patientController.updateProfile);

// Informe de una cita específica (solo si is_shared = TRUE)
router.get('/appointments/:appointmentId/report', authMiddleware, patientController.getAppointmentReport);

// Cancelar una cita (Regla de las 24 horas)
router.put('/appointments/:id/cancel', authMiddleware, appointmentController.cancelAppointmentByPatient);

// Historial clínico completo
router.get('/my-history', authMiddleware, patientController.getMyHistory);

module.exports = router;
