const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const db     = require('../config/db');

// Asegurar que la carpeta existe
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename:    (_req,  file, cb) => {
        const ext  = path.extname(file.originalname).toLowerCase();
        const name = `avatar_${Date.now()}${ext}`;
        cb(null, name);
    }
});

const fileFilter = (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    // También validar por mimetype
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(ext) || allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Formato no permitido (${ext}). Solo se permiten imágenes JPG, PNG, WEBP o GIF.`));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB máx
}).single('avatar');

// POST /api/upload/profile-picture
exports.uploadProfilePicture = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('Error Multer al subir avatar:', err.message);
            return res.status(400).json({ message: err.message });
        }
        if (!req.file) {
            console.error('Upload avatar: No se recibió archivo. Body keys:', Object.keys(req.body));
            return res.status(400).json({ message: 'No se recibió ningún archivo. Asegúrate de usar el campo "avatar".' });
        }

        const userId  = req.user.id;
        const userRole = req.user.role;
        const fileUrl = `/uploads/${req.file.filename}`;

        try {
            if (userRole === 'doctor') {
                await db.query('UPDATE doctors SET profile_picture = ? WHERE user_id = ?', [fileUrl, userId]);
            } else if (userRole === 'patient') {
                await db.query('UPDATE patients SET profile_picture = ? WHERE user_id = ?', [fileUrl, userId]);
            } else if (userRole === 'admin' || userRole === 'supervisor') {
                // Admin/supervisor no tienen tabla propia, pero guardamos la foto en la sesión
                console.log(`Foto de perfil subida para ${userRole} (no guardada en BD específica).`);
            }
            res.status(200).json({ url: fileUrl });
        } catch (dbErr) {
            console.error('Error guardando foto en BD:', dbErr);
            res.status(500).json({ message: 'Error al guardar la foto en la base de datos.' });
        }
    });
};
