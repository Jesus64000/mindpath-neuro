const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middlewares/authMiddleware');

// Ruta: GET /api/patients/my-doctors
router.get('/my-doctors', authMiddleware, patientController.getMyDoctors);

module.exports = router;
