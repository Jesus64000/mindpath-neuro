const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Autenticación tradicional
router.post('/register',        authController.register);
router.post('/login',           authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password',  authController.resetPassword);

// Autenticación con Google OAuth 2.0
router.post('/google-check',    authController.googleCheck);    // Paso 1: verificar si existe
router.post('/google-complete', authController.googleComplete); // Paso 2: completar perfil

module.exports = router;
