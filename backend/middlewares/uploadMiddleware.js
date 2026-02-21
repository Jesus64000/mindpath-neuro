const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento local
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Carpeta donde se guardarán los audios
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
