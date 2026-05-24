// backend/server.js
const express = require('express');
const cors    = require('cors');
const path    = require('path');
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
app.use('/api/ia', require('./routes/iaRoutes'));
app.use('/api/schedules', require('./routes/scheduleRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/consultations', require('./routes/consultationRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/ratings', require('./routes/ratingRoutes'));

// Interceptor dinámico para facturas (auto-regeneración en sistemas con almacenamiento efímero)
app.get('/uploads/invoices/:filename', async (req, res, next) => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, 'public', 'uploads', 'invoices', req.params.filename);

    if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
    }

    // Si el archivo no existe físicamente, lo intentamos regenerar a partir del ID de la cita
    try {
        const match = req.params.filename.match(/invoice_00-(\d+)\.pdf/);
        if (!match) return next();

        const appointmentId = parseInt(match[1]);
        const db = require('./config/db');
        const invoiceService = require('./utils/invoiceService');

        // Extraer todos los datos del paciente y doctor para la factura
        const [invoiceDataRows] = await db.query(`
            SELECT 
                a.consultation_fee_snapshot,
                a.type as appointmentType,
                a.appointment_date,
                a.patient_id,
                a.doctor_id,
                a.payment_method,
                a.payment_reference,
                pu.full_name AS patientName,
                p.dni AS patientDni,
                p.phone AS patientPhone,
                du.full_name AS doctorName,
                d.rif AS doctorRif,
                d.phone AS doctorPhone,
                d.specialty
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN users pu ON p.user_id = pu.id
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users du ON d.user_id = du.id
            WHERE a.id = ?
        `, [appointmentId]);

        if (invoiceDataRows.length === 0) {
            return next(); // Si la cita no existe, pasar al siguiente middleware (dará 404)
        }

        const data = invoiceDataRows[0];
        const baseAmount = data.consultation_fee_snapshot || 0;
        const invoiceNumber = `00-${String(appointmentId).padStart(5, '0')}`;

        // Asegurar que la carpeta exista antes de escribir el PDF
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }

        // Preparamos el payload a mandar al PDFKit
        const payload = {
            doctorName: data.doctorName,
            specialty: data.specialty,
            doctorRif: data.doctorRif || 'No registrado',
            doctorPhone: data.doctorPhone,
            invoiceNumber: invoiceNumber,
            patientName: data.patientName,
            patientDni: data.patientDni,
            patientPhone: data.patientPhone,
            appointmentType: data.appointmentType,
            appointmentDate: data.appointment_date,
            baseAmount: baseAmount,
            totalAmount: baseAmount,
            currency: 'USD',
            paymentMethod: data.payment_method || null,
            paymentReference: data.payment_reference || null,
            legalText: 'Servicio Médico Exento de I.V.A. según Art. 19, Numeral 5 de la Ley del I.V.A.'
        };

        await invoiceService.generateInvoicePDF(payload, filePath);
        
        // Servir el archivo recién creado
        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        }
        next();
    } catch (err) {
        console.error("Error al auto-regenerar factura efímera:", err);
        next();
    }
});

// Servir archivos estáticos de la carpeta public/uploads
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

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
