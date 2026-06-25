const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

// Logo path — se usa desde la carpeta raíz del backend
const LOGO_PATH = path.join(__dirname, '..', 'public', 'logo.png');

// Limpiador de texto de residuos de URL-encode y acentos corruptos de doble-encoding
const sanitizeText = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/%20/g, ' ')
        .replace(/% ia/g, 'ía')
        .replace(/%i/g, 'í')
        .replace(/%/g, '')
        // Saneamiento de acentos corruptos de doble-encoding
        .replace(/├¡/g, 'í')
        .replace(/├©/g, 'é')
        .replace(/├-®/g, 'é')
        .replace(/├í/g, 'á')
        .replace(/├│/g, 'ó')
        .replace(/├║/g, 'ú')
        .replace(/├▒/g, 'ñ')
        .replace(/├ﾍ/g, 'Í')
        .replace(/├ﾉ/g, 'É')
        .replace(/├ﾁ/g, 'Á')
        .replace(/├ﾓ/g, 'Ó')
        .replace(/├ﾚ/g, 'Ú')
        .replace(/├ﾑ/g, 'Ñ');
};

exports.generateInvoicePDF = async (invoiceData, filePath) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Buscar logo personalizado en system_settings
            let logoToUse = LOGO_PATH;
            try {
                const [settings] = await db.query('SELECT logo_url FROM system_settings WHERE id = 1');
                if (settings.length > 0 && settings[0].logo_url) {
                    const customPath = path.join(__dirname, '..', 'public', settings[0].logo_url);
                    if (fs.existsSync(customPath)) {
                        logoToUse = customPath;
                    }
                }
            } catch (err) {
                console.error('Error al cargar logo_url de system_settings para factura:', err);
            }

            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const writeStream = fs.createWriteStream(filePath);

            doc.pipe(writeStream);

            // ================= HEADER CON LOGO =================
            const logoExists = fs.existsSync(logoToUse);
            const headerStartY = 50;

            if (logoExists) {
                // Logo en la esquina izquierda (tamaño aumentado de 60 a 85)
                doc.image(logoToUse, 50, headerStartY, { width: 85, height: 85 });
                // Datos del doctor a la derecha del logo
                doc.fontSize(18).font('Helvetica-Bold').fillColor('#1e293b').text(sanitizeText(invoiceData.doctorName), 150, headerStartY + 5, { width: 395 });
                doc.fontSize(9.5).font('Helvetica').fillColor('#64748b').text(`Especialidad: ${sanitizeText(invoiceData.specialty)}`, 150, doc.y + 3);
                doc.text(`RIF: ${sanitizeText(invoiceData.doctorRif)}`, 150, doc.y + 2);
                if (invoiceData.doctorPhone) {
                    doc.text(`Teléfono: ${sanitizeText(invoiceData.doctorPhone)}`, 150, doc.y + 2);
                }
                doc.y = Math.max(doc.y, headerStartY + 93); // Asegurar espacio para el logo
            } else {
                // Sin logo — centrado
                doc.fontSize(18).font('Helvetica-Bold').fillColor('#1e293b').text(sanitizeText(invoiceData.doctorName), { align: 'center' });
                doc.fontSize(9.5).font('Helvetica').fillColor('#64748b').text(`Especialidad: ${sanitizeText(invoiceData.specialty)}`, { align: 'center' });
                doc.text(`RIF: ${sanitizeText(invoiceData.doctorRif)}`, { align: 'center' });
                if (invoiceData.doctorPhone) {
                    doc.text(`Teléfono: ${sanitizeText(invoiceData.doctorPhone)}`, { align: 'center' });
                }
            }

            doc.moveDown(0.8);

            // Línea separadora
            doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
            doc.moveDown(0.8);

            // Document Title
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text('RECIBO DE HONORARIOS PROFESIONALES', { align: 'center', tracking: 1 });
            doc.moveDown(0.8);

            // Meta Info Grid (Invoice Metadata)
            const metaTop = doc.y;
            doc.fontSize(9).font('Helvetica').fillColor('#64748b');
            doc.text(`Nro de Control: ${invoiceData.invoiceNumber}`, 350, metaTop, { width: 195, align: 'right' });
            
            let emissionDate = '';
            try {
                emissionDate = new Date().toLocaleDateString('es-VE');
            } catch {
                emissionDate = 'N/A';
            }
            doc.text(`Fecha de Emisión: ${emissionDate}`, 350, metaTop + 14, { width: 195, align: 'right' });
            
            // Back to standard cursor flow
            doc.y = metaTop + 35;
            doc.moveDown(0.5);

            // ================= PATIENT DATA CARD =================
            const patientBoxY = doc.y;
            doc.rect(50, patientBoxY, 495, 75).lineWidth(0.8).strokeColor('#e2e8f0').stroke();
            
            doc.y = patientBoxY + 10;
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b').text('  Datos del Paciente:', 60);
            doc.font('Helvetica').fillColor('#334155').fontSize(9.5);
            doc.text(`  Nombre: ${sanitizeText(invoiceData.patientName)}`, 60, doc.y + 4);
            doc.text(`  C.I. / RIF: ${sanitizeText(invoiceData.patientDni || 'N/A')}`, 60, doc.y + 3);
            if (invoiceData.patientPhone) {
                doc.text(`  Teléfono: ${sanitizeText(invoiceData.patientPhone)}`, 60, doc.y + 3);
            }
            
            doc.y = patientBoxY + 90;

            // ================= CONCEPT & DESCRIPTION TABLE =================
            const cleanSpecialty = sanitizeText(invoiceData.specialty || 'Servicio Médico');
            doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text(`Concepto: Consulta Médica Especializada de ${cleanSpecialty}`);
            doc.moveDown(0.4);
            
            const tableTop = doc.y;
            // Encabezados de columna
            doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569');
            doc.text('Descripción', 50, tableTop);
            doc.text('Monto', 450, tableTop, { width: 95, align: 'right' });
            
            // Header divider
            doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).lineWidth(0.8).strokeColor('#cbd5e1').stroke();
            
            // Row content
            doc.y = tableTop + 23;
            doc.font('Helvetica').fontSize(9.5).fillColor('#334155');
            
            const itemY = doc.y;
            let dateStr = '';
            try {
                const dateVal = invoiceData.appointmentDate;
                if (dateVal) {
                    const parsedDate = new Date(dateVal);
                    if (!isNaN(parsedDate.getTime())) {
                        dateStr = parsedDate.toLocaleDateString('es-VE', { timeZone: 'UTC' });
                    }
                }
            } catch (err) {
                console.warn('Error formatting invoice date:', err);
            }
            if (!dateStr) {
                dateStr = new Date().toLocaleDateString('es-VE');
            }

            // Formatear hora si está presente
            let timeStr = '';
            if (invoiceData.startTime) {
                try {
                    const [hourStr, minute] = invoiceData.startTime.split(':');
                    const hour = parseInt(hourStr, 10);
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const formattedHour = hour % 12 || 12;
                    timeStr = ` a las ${formattedHour}:${minute} ${ampm}`;
                } catch (e) {
                    timeStr = ` ${invoiceData.startTime}`;
                }
            }

            const typeStr = (invoiceData.appointmentType === 'presencial') ? 'Presencial' : 'En Línea / Telemedicina';
            
            let itemText = `Consulta Médica Especializada (${typeStr})\nFecha: ${dateStr}${timeStr}`;
            if (invoiceData.clinicName) {
                itemText += `\nLugar: ${sanitizeText(invoiceData.clinicName)}`;
            }
            if (invoiceData.clinicAddress) {
                itemText += `\nDirección: ${sanitizeText(invoiceData.clinicAddress)}`;
            }

            doc.text(itemText, 50, itemY, { width: 385 });
            doc.text(`${parseFloat(invoiceData.baseAmount || 0).toFixed(2)} ${invoiceData.currency || 'USD'}`, 450, itemY, { width: 95, align: 'right' });
            
            // Row bottom border using doc.y dynamically to allow multiline growth
            const itemBottomY = doc.y + 10;
            doc.moveTo(50, itemBottomY).lineTo(545, itemBottomY).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
            
            doc.y = itemBottomY + 15;
            
            // ================= TOTALS SECTION =================
            const subtotalY = doc.y;
            doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569').text('Subtotal:', 355, subtotalY);
            doc.font('Helvetica').fillColor('#334155').text(`${parseFloat(invoiceData.baseAmount || 0).toFixed(2)} ${invoiceData.currency}`, 450, subtotalY, { width: 95, align: 'right' });
            
            doc.y = subtotalY + 18;
            const ivaY = doc.y;
            doc.font('Helvetica-Bold').fillColor('#475569').text('IVA (Exento):', 355, ivaY);
            doc.font('Helvetica').fillColor('#334155').text(`0.00 ${invoiceData.currency}`, 450, ivaY, { width: 95, align: 'right' });
            
            // Divider before Total
            doc.moveTo(355, ivaY + 16).lineTo(545, ivaY + 16).lineWidth(0.8).strokeColor('#cbd5e1').stroke();
            
            doc.y = ivaY + 24;
            const totalY = doc.y;
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('TOTAL:', 355, totalY);
            doc.text(`${parseFloat(invoiceData.totalAmount || 0).toFixed(2)} ${invoiceData.currency}`, 450, totalY, { width: 95, align: 'right' });

            // ================= PAYMENT METHOD ROW =================
            if (invoiceData.paymentMethod) {
                doc.y = totalY + 28;
                doc.fontSize(8.5).font('Helvetica').fillColor('#64748b');
                const pmLabel = invoiceData.paymentMethod === 'platform' ? 'Pago por Plataforma'
                    : invoiceData.paymentMethod === 'in_person' ? 'Efectivo en Consultorio'
                    : invoiceData.paymentMethod;
                doc.text(`Método de Pago: ${pmLabel}`, 50, doc.y);
                if (invoiceData.paymentReference) {
                    doc.text(`Referencia: ${invoiceData.paymentReference}`, 50, doc.y + 12);
                }
            }

            // ================= LEGAL FOOTER =================
            doc.y = Math.max(doc.y + 35, totalY + 55);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
            
            doc.moveDown(1.2);
            doc.fontSize(7.5).font('Helvetica-Oblique').fillColor('#64748b');
            doc.text(invoiceData.legalText, { align: 'center', width: 445 });
            
            doc.moveDown(0.7);
            doc.fontSize(7).fillColor('#94a3b8').text('MindPath Neuro — Sistema de Gestión de Consultas Médicas', { align: 'center' });

            doc.end();

            writeStream.on('finish', () => resolve(true));
            writeStream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};