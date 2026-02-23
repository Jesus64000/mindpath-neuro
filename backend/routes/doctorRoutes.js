const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const authMiddleware = require('../middlewares/authMiddleware');

// Protegemos la ruta para que solo usuarios logueados vean los médicos
router.get('/', authMiddleware, doctorController.getAllDoctors);

module.exports = router;
