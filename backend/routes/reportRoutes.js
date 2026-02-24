// backend/routes/reportRoutes.js
const express = require('express');
const router  = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware   = require('../middlewares/authMiddleware');

// Datos del membrete (paciente + doctor + cita)
router.get('/header/:appointmentId', authMiddleware, reportController.getConsultationHeader);

// Guardar informe y cerrar cita
router.post('/wrap-up', authMiddleware, reportController.wrapUpConsultation);

module.exports = router;
