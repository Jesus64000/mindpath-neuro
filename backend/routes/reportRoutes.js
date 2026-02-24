// backend/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/wrap-up', authMiddleware, reportController.wrapUpConsultation);

module.exports = router;
