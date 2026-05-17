const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.generateInvoicePDF = async (invoiceData, filePath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const writeStream = fs.createWriteStream(filePath);

            doc.pipe(writeStream);

            // Cabecera (Doctor)
            doc.fontSize(20).font('Helvetica-Bold').text(invoiceData.doctorName, { align: 'center' });
            doc.fontSize(10).font('Helvetica').text(`Especialidad: ${invoiceData.specialty}`, { align: 'center' });
            doc.text(`RIF: ${invoiceData.doctorRif}`, { align: 'center' });
            if (invoiceData.doctorPhone) {
                doc.text(`Teléfono: ${invoiceData.doctorPhone}`, { align: 'center' });
            }
            doc.moveDown();

            // Título del documento
            doc.fontSize(14).font('Helvetica-Bold').text('RECIBO DE HONORARIOS PROFESIONALES', { align: 'center' });
            doc.moveDown();

            // Meta de la Factura
            doc.fontSize(10).font('Helvetica');
            doc.text(`Nro de Control: ${invoiceData.invoiceNumber}`, { align: 'right' });
            doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-VE')}`, { align: 'right' });
            doc.moveDown();

            // Datos del Paciente
            doc.font('Helvetica-Bold').text('Datos del Paciente:');
            doc.font('Helvetica').text(`Nombre: ${invoiceData.patientName}`);
            doc.text(`C.I. / RIF: ${invoiceData.patientDni || 'N/A'}`);
            if (invoiceData.patientPhone) {
                doc.text(`Teléfono: ${invoiceData.patientPhone}`);
            }
            doc.moveDown();

            // Detalles del Servicio
            doc.font('Helvetica-Bold').text('Concepto:', { underline: true });
            doc.moveDown(0.5);
            
            const tableTop = doc.y;
            doc.font('Helvetica-Bold');
            doc.text('Descripción', 50, tableTop);
            doc.text('Monto', 450, tableTop, { width: 90, align: 'right' });
            
            doc.moveTo(50, doc.y + 5).lineTo(540, doc.y + 5).stroke();
            doc.moveDown();
            
            doc.font('Helvetica');
            doc.text(`Consulta Médica Especializada (${invoiceData.appointmentType === 'presencial' ? 'Presencial' : 'Online'}) - ${new Date(invoiceData.appointmentDate).toLocaleDateString('es-VE')}`, 50, doc.y);
            doc.text(`${parseFloat(invoiceData.baseAmount).toFixed(2)} ${invoiceData.currency}`, 450, doc.y, { width: 90, align: 'right' });
            
            doc.moveDown(2);
            doc.moveTo(50, doc.y).lineTo(540, doc.y).stroke();
            doc.moveDown();

            // Totales
            doc.font('Helvetica-Bold');
            doc.text('Subtotal:', 350, doc.y);
            doc.text(`${parseFloat(invoiceData.baseAmount).toFixed(2)} ${invoiceData.currency}`, 450, doc.y, { width: 90, align: 'right' });
            
            doc.text('IVA (Exento):', 350, doc.y);
            doc.text('0.00 ' + invoiceData.currency, 450, doc.y, { width: 90, align: 'right' });
            
            doc.moveDown(0.5);
            doc.fontSize(12);
            doc.text('Total:', 350, doc.y);
            doc.text(`${parseFloat(invoiceData.totalAmount).toFixed(2)} ${invoiceData.currency}`, 450, doc.y, { width: 90, align: 'right' });

            // Bloque Legal
            doc.moveDown(4);
            doc.fontSize(8).font('Helvetica-Oblique');
            doc.text(invoiceData.legalText, { align: 'center', width: 440, align: 'center' });

            doc.end();

            writeStream.on('finish', () => resolve(true));
            writeStream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};