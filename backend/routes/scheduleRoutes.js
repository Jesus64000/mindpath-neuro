const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas estas rutas requieren estar logueado como doctor
router.get('/me', authMiddleware, scheduleController.getMySchedules);
router.post('/', authMiddleware, scheduleController.addSchedule);
router.delete('/:id', authMiddleware, scheduleController.deleteSchedule);

module.exports = router;
