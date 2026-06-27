const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware   = require('../middlewares/authMiddleware');
const isStaff          = require('../middlewares/isStaffMiddleware');
const isSuperAdmin     = require('../middlewares/isSuperAdminMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ── Multer para logos ─────────────────────────────────────────────────────────
const logosDir = process.env.VERCEL
    ? path.join(os.tmpdir(), 'logos')
    : path.join(__dirname, '..', 'public', 'uploads', 'logos');
if (!fs.existsSync(logosDir)) fs.mkdirSync(logosDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, logosDir),
    filename:    (_req, file, cb) => cb(null, `logo-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
        if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
        else cb(new Error('Solo se permiten imágenes (PNG, JPG, SVG, WEBP)'));
    }
});

// ── Rutas públicas ────────────────────────────────────────────────────────────
router.get('/settings',   adminController.getSettings);
router.post('/bootstrap', adminController.bootstrapAdmin);

// ── Solo Super Admin (admin) ──────────────────────────────────────────────────
router.get('/stats',              authMiddleware, isSuperAdmin, adminController.getStats);
router.put('/settings',           authMiddleware, isSuperAdmin, adminController.updateSettings);
router.post('/settings/sync-bcv',  authMiddleware, isSuperAdmin, adminController.syncBcv);
router.post('/upload/logo',       authMiddleware, isSuperAdmin, upload.single('logo'), adminController.uploadLogo);
router.post('/create-supervisor', authMiddleware, isSuperAdmin, adminController.createSupervisor);
router.put('/users/:id/role',     authMiddleware, isSuperAdmin, adminController.changeUserRole);

// ── Staff (admin + supervisor) ────────────────────────────────────────────────
router.get('/doctors/pending',    authMiddleware, isStaff, adminController.getPendingDoctors);
router.put('/doctors/:id/verify', authMiddleware, isStaff, adminController.verifyDoctor);
router.put('/doctors/:id/reject', authMiddleware, isStaff, adminController.rejectDoctor);

router.get('/specialties',        authMiddleware, isStaff, adminController.getSpecialties);
router.post('/specialties',       authMiddleware, isStaff, adminController.createSpecialty);
router.put('/specialties/:id',    authMiddleware, isStaff, adminController.updateSpecialty);
router.delete('/specialties/:id', authMiddleware, isStaff, adminController.deleteSpecialty);

router.get('/payment-methods',        authMiddleware, isSuperAdmin, adminController.getPaymentMethodCatalog);
router.post('/payment-methods',       authMiddleware, isSuperAdmin, adminController.createPaymentMethodCatalog);
router.put('/payment-methods/:id',    authMiddleware, isSuperAdmin, adminController.updatePaymentMethodCatalog);
router.delete('/payment-methods/:id',  authMiddleware, isSuperAdmin, adminController.deletePaymentMethodCatalog);

router.get('/users',              authMiddleware, isStaff, adminController.getUsers);
router.get('/users/:id/history',  authMiddleware, isStaff, adminController.getUserDetailsAndHistory);
router.put('/users/:id/toggle',   authMiddleware, isStaff, adminController.toggleUserActive);
router.post('/users/:id/send-reset', authMiddleware, isSuperAdmin, adminController.sendResetEmail);

router.get('/appointments', authMiddleware, isStaff, adminController.getAllAppointments);

// Clínicas / Centros de Salud CRUD
router.get('/clinics/admin',      authMiddleware, isStaff, adminController.getClinicsAdmin);
router.post('/clinics',           authMiddleware, isStaff, adminController.createClinic);
router.put('/clinics/:id',        authMiddleware, isStaff, adminController.updateClinic);
router.delete('/clinics/:id',     authMiddleware, isStaff, adminController.deleteClinic);

// Verificación de Consultorios Privados
router.get('/private-clinics/pending', authMiddleware, isStaff, adminController.getPendingPrivateClinics);
router.put('/private-clinics/:id/verify', authMiddleware, isStaff, adminController.verifyPrivateClinic);

// Tipos de Estudios / Exámenes Médicos CRUD
router.get('/study-types',        authMiddleware, adminController.getStudyTypes); // accessible to all authenticated users
router.get('/study-types/admin',  authMiddleware, isStaff, adminController.getStudyTypesAdmin);
router.post('/study-types',       authMiddleware, isStaff, adminController.createStudyType);
router.put('/study-types/:id',    authMiddleware, isStaff, adminController.updateStudyType);
router.delete('/study-types/:id', authMiddleware, isStaff, adminController.deleteStudyType);

module.exports = router;
