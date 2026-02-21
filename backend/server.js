// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importamos la conexión a la BD
const db = require('./config/db'); 

const app = express();

// Middlewares Globales
app.use(cors()); // Permite peticiones del frontend
app.use(express.json()); // Permite recibir JSON en los POST
app.use(express.urlencoded({ extended: true })); // Para recibir archivos (audio) después

// Rutas
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/schedules', require('./routes/scheduleRoutes'));

// Endpoint de prueba (Health Check)
app.get('/api/health', async (req, res) => {
    try {
        // Hacemos un query súper básico para probar la BD
        const [rows] = await db.query('SELECT NOW() AS current_time_db');
        res.status(200).json({
            ok: true,
            message: 'Servidor Mindpath Neuro-Intelligent Operativo 🧠',
            db_time: rows[0].current_time_db,
            environment: process.env.NODE_ENV
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            message: 'El servidor funciona, pero la BD falló.',
            error: error.message
        });
    }
});

// Arranque del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
    console.log(`👉 Haz un GET a http://localhost:${PORT}/api/health para probar.`);
});
