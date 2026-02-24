const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/isAdminMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── Multer para logos ─────────────────────────────────────────────────────────
const logosDir = path.join(__dirname, '..', 'uploads', 'logos');
if (!fs.existsSync(logosDir)) fs.mkdirSync(logosDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, logosDir),
    filename:    (_req, file, cb) => cb(null, `logo-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB máximo
    fileFilter: (_req, file, cb) => {
        const allowed = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
        if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
        else cb(new Error('Solo se permiten imágenes (PNG, JPG, SVG, WEBP)'));
    }
});

// ── Ruta pública: leer configuración del sistema (theming) ────────────────────
router.get('/settings', adminController.getSettings);

// ── Bootstrap: crear primer admin (público — solo si no existe ningún admin) ──
router.post('/bootstrap', adminController.bootstrapAdmin);

// ── Rutas protegidas (authMiddleware + isAdmin) ───────────────────────────────
router.use(authMiddleware, isAdmin);

// Métricas globales
router.get('/stats', adminController.getStats);

// Verificación de doctores
router.get('/doctors/pending',         adminController.getPendingDoctors);
router.put('/doctors/:id/verify',      adminController.verifyDoctor);
router.put('/doctors/:id/reject',      adminController.rejectDoctor);

// Catálogo de especialidades
router.get('/specialties',             adminController.getSpecialties);
router.post('/specialties',            adminController.createSpecialty);
router.put('/specialties/:id',         adminController.updateSpecialty);
router.delete('/specialties/:id',      adminController.deleteSpecialty);

// Configuración del sistema
router.put('/settings',                adminController.updateSettings);
router.post('/upload/logo',            upload.single('logo'), adminController.uploadLogo);

module.exports = router;
