const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/availability', authMiddleware, bookingController.getAvailability);
router.get('/quote', authMiddleware, bookingController.getAppointmentQuote);
router.post('/book', authMiddleware, bookingController.bookAppointment);

module.exports = router;