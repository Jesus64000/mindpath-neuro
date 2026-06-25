const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const authMiddleware = require('../middlewares/authMiddleware');

// Protegemos la ruta para que solo usuarios logueados vean los médicos
router.get('/', authMiddleware, doctorController.getAllDoctors);

// Gestión de pacientes del doctor
router.get('/my-patients', authMiddleware, doctorController.getMyPatients);
router.get('/patient/:patientId', authMiddleware, doctorController.getPatientFile);

// Sprint 27: Notas rápidas por paciente
router.get('/patient/:patientId/notes', authMiddleware, doctorController.getPatientNotes);
router.put('/patient/:patientId/notes', authMiddleware, doctorController.savePatientNotes);

// Configuración de horarios del doctor
router.post('/update-schedule', authMiddleware, doctorController.updateSchedule);

// Sprint 28: Disponibilidad Dinámica de Doctores
const scheduleController = require('../controllers/scheduleController');
router.get('/schedules', authMiddleware, scheduleController.getMySchedules);
router.post('/schedules', authMiddleware, scheduleController.addSchedule);
router.delete('/schedules/:id', authMiddleware, scheduleController.deleteSchedule);

// Perfil profesional del doctor
router.get('/profile/settings', authMiddleware, doctorController.getProfileSettings);
router.put('/profile/settings', authMiddleware, doctorController.updateProfileSettings);

// Sprint 42: Métodos de pago del doctor
router.get('/payment-methods/catalog', authMiddleware, doctorController.getMyPaymentMethods);
router.get('/payment-methods', authMiddleware, doctorController.getMyPaymentMethods);
router.post('/payment-methods', authMiddleware, doctorController.addMyPaymentMethod);
router.put('/payment-methods/:id', authMiddleware, doctorController.updateMyPaymentMethod);
router.delete('/payment-methods/:id', authMiddleware, doctorController.deleteMyPaymentMethod);

// Emergencia Médica
router.post('/emergency-block', authMiddleware, doctorController.toggleEmergencyBlock);

// Sprint 27: Estadísticas personales
router.get('/my-stats', authMiddleware, doctorController.getMyStats);

// Registro de pagos del doctor
router.get('/payments', authMiddleware, doctorController.getDoctorPayments);

// Catálogo público de especialidades (sin auth — para el registro y directorio)
router.get('/specialties', doctorController.getSpecialties);

// Sprint 29: Catálogo público de clínicas/hospitales (sin auth — para el registro)
router.get('/clinics', doctorController.getClinics);

// Catálogo público de métodos de pago (sin auth — para el registro)
router.get('/payment-catalog', doctorController.getPublicPaymentCatalog);

// Sprint 33: Motor de Agendamiento Avanzado (Excepciones)
router.get('/exceptions', authMiddleware, doctorController.getExceptions);
router.post('/exceptions', authMiddleware, doctorController.addException);
router.delete('/exceptions/:id', authMiddleware, doctorController.deleteException);

// Perfil público del doctor (mantener al final para evitar conflictos con rutas específicas)
router.get('/:id', authMiddleware, doctorController.getDoctorById);

module.exports = router;

