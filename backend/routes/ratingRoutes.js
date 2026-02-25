const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const authMiddleware = require('../middlewares/authMiddleware');

// Pública: ver valoraciones de un doctor
router.get('/doctor/:doctorId', ratingController.getDoctorRatings);

// Autenticadas: paciente gestiona sus valoraciones
router.post('/',              authMiddleware, ratingController.createRating);
router.get('/my-pending',     authMiddleware, ratingController.getUnratedAppointments);

module.exports = router;
