const express = require('express');
const router  = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware   = require('../middlewares/authMiddleware');

// POST /api/upload/profile-picture  (requiere login)
router.post('/profile-picture', authMiddleware, uploadController.uploadProfilePicture);

module.exports = router;
