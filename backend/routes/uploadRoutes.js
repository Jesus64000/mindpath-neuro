const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const uploadController = require('../controllers/uploadController');
const authMiddleware   = require('../middlewares/authMiddleware');

// ── Asegurar que la carpeta de uploads existe ─────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ── Configuración de almacenamiento genérico ──────────────────────────────────
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// ── Filtro para aceptar Imágenes y PDFs ───────────────────────────────────────
const fileFilter = (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp) y documentos PDF.'));
    }
};

const upload = multer({ 
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB máx por archivo
});

// ── Ruta existente: Foto de perfil (requiere login) ───────────────────────────
router.post('/profile-picture', authMiddleware, uploadController.uploadProfilePicture);

// ── Sprint 29: Endpoint genérico para subir un archivo (título, certificado, etc.) ──
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ningún archivo.' });
        }
        // Devolvemos la ruta relativa para guardarla en la BD
        const fileUrl = `/uploads/${req.file.filename}`;
        
        // Persistimos en la base de datos de manera asíncrona (self-healing)
        const { persistFile } = require('../utils/persistentStorage');
        await persistFile(fileUrl, req.file.path, req.file.mimetype);

        res.status(200).json({ url: fileUrl });
    } catch (error) {
        console.error('Error al subir archivo:', error);
        res.status(500).json({ message: 'Error interno al subir el archivo.' });
    }
});

module.exports = router;
