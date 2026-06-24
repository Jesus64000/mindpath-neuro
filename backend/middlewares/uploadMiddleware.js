const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Configuración de almacenamiento local/temporal
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dest = process.env.VERCEL ? os.tmpdir() : 'uploads/';
        if (!fs.existsSync(dest) && !process.env.VERCEL) {
            fs.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest); // Carpeta donde se guardarán los audios
    },
    filename: function (req, file, cb) {
        // Renombramos el archivo para que sea único: appointment_id + timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `consulta-${req.params.appointmentId}-${uniqueSuffix}${path.extname(file.originalname || '.webm')}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // Límite de 50MB por audio
});

module.exports = upload;
