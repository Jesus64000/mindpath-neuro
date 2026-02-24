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
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP.'));
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 3 * 1024 * 1024 } // 3 MB máx
}).single('avatar');

// POST /api/upload/profile-picture
exports.uploadProfilePicture = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).json({ message: err.message });
        if (!req.file) return res.status(400).json({ message: 'No se recibió ningún archivo.' });

        const userId  = req.user.id;
        const fileUrl = `/uploads/${req.file.filename}`;

        try {
            if (req.user.role === 'doctor') {
                await db.query('UPDATE doctors SET profile_picture = ? WHERE user_id = ?', [fileUrl, userId]);
            } else if (req.user.role === 'patient') {
                await db.query('UPDATE patients SET profile_picture = ? WHERE user_id = ?', [fileUrl, userId]);
            }
            res.status(200).json({ url: fileUrl });
        } catch (dbErr) {
            console.error('Error guardando foto en BD:', dbErr);
            res.status(500).json({ message: 'Error al guardar la foto.' });
        }
    });
};
