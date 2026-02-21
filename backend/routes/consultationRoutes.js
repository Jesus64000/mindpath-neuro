const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Endpoint que recibe el Audio (.webm) y detona la IA
router.post('/:appointmentId/process-audio', authMiddleware, upload.single('audio_file'), consultationController.processAudioAndGenerateReport);

// Endpoint para cargar el borrador en el editor
router.get('/report/:reportId', authMiddleware, consultationController.getReport);

module.exports = router;
