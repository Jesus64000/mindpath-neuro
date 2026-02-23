const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const authMiddleware = require('../middlewares/authMiddleware');

// Protegemos la ruta para que solo usuarios logueados vean los médicos
router.get('/', authMiddleware, doctorController.getAllDoctors);

// Gestión de pacientes del doctor
router.get('/my-patients', authMiddleware, doctorController.getMyPatients);
router.get('/patient/:patientId', authMiddleware, doctorController.getPatientFile);

// Configuración de horarios del doctor
router.post('/update-schedule', authMiddleware, doctorController.updateSchedule);

// Perfil profesional del doctor
router.get('/profile/settings', authMiddleware, doctorController.getProfileSettings);
router.put('/profile/settings', authMiddleware, doctorController.updateProfileSettings);

// Perfil público del doctor (mantener al final para evitar conflictos con rutas específicas)
router.get('/:id', authMiddleware, doctorController.getDoctorById);

module.exports = router;
