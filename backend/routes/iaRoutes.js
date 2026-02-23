const express = require('express');
const router = express.Router();
const iaController = require('../controllers/iaController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/generate-report', authMiddleware, iaController.generateMedicalReport);

module.exports = router;
