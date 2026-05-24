const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.generateInvoicePDF = async (invoiceData, filePath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const writeStream = fs.createWriteStream(filePath);

            doc.pipe(writeStream);

            // ================= HEADER =================
            // Elegant Doctor Profile Block
            doc.fontSize(20).font('Helvetica-Bold').fillColor('#1e293b').text(invoiceData.doctorName, { align: 'center' });
            doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(`Especialidad: ${invoiceData.specialty}`, { align: 'center' });
            doc.text(`RIF: ${invoiceData.doctorRif}`, { align: 'center' });
            if (invoiceData.doctorPhone) {
                doc.text(`Teléfono: ${invoiceData.doctorPhone}`, { align: 'center' });
            }
            doc.moveDown(1.5);

            // Document Title
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text('RECIBO DE HONORARIOS PROFESIONALES', { align: 'center', tracking: 1 });
            doc.moveDown(1);

            // Meta Info Grid (Invoice Metadata)
            const metaTop = doc.y;
            doc.fontSize(9).font('Helvetica').fillColor('#64748b');
            doc.text(`Nro de Control: ${invoiceData.invoiceNumber}`, 350, metaTop, { width: 190, align: 'right' });
            
            let emissionDate = '';
            try {
                emissionDate = new Date().toLocaleDateString('es-VE');
            } catch {
                emissionDate = 'N/A';
            }
            doc.text(`Fecha de Emisión: ${emissionDate}`, 350, metaTop + 14, { width: 190, align: 'right' });
            
            // Back to standard cursor flow
            doc.y = metaTop + 35;
            doc.moveDown(0.5);

            // ================= PATIENT DATA CARD =================
            const patientBoxY = doc.y;
            // Draw a subtle border container for Patient details
            doc.rect(50, patientBoxY, 490, 70).lineWidth(1).strokeColor('#e2e8f0').stroke();
            
            doc.y = patientBoxY + 10;
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b').text('  Datos del Paciente:', 55);
            doc.font('Helvetica').fillColor('#334155');
            doc.text(`  Nombre: ${invoiceData.patientName}`, 55, doc.y + 4);
            doc.text(`  C.I. / RIF: ${invoiceData.patientDni || 'N/A'}`, 55, doc.y + 4);
            if (invoiceData.patientPhone) {
                doc.text(`  Teléfono: ${invoiceData.patientPhone}`, 55, doc.y + 4);
            }
            
            doc.y = patientBoxY + 85;

            // ================= CONCEPT & DESCRIPTION TABLE =================
            doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text('Concepto:', { underline: false });
            doc.moveDown(0.5);
            
            const tableTop = doc.y;
            doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569');
            doc.text('Descripción', 50, tableTop);
            doc.text('Monto', 450, tableTop, { width: 90, align: 'right' });
            
            // Draw header line
            doc.moveTo(50, tableTop + 14).lineTo(540, tableTop + 14).lineWidth(1).strokeColor('#cbd5e1').stroke();
            
            // Advance cursor to item row
            doc.y = tableTop + 22;
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

            const typeStr = invoiceData.appointmentType === 'presencial' ? 'Presencial' : 'Online';
            const itemText = `Consulta Médica Especializada (${typeStr}) - ${dateStr}`;

            doc.text(itemText, 50, itemY, { width: 380 });
            doc.text(`${parseFloat(invoiceData.baseAmount || 0).toFixed(2)} ${invoiceData.currency || 'USD'}`, 450, itemY, { width: 90, align: 'right' });
            
            // Draw bottom border of item row
            const itemBottomY = itemY + 20;
            doc.moveTo(50, itemBottomY).lineTo(540, itemBottomY).lineWidth(1).strokeColor('#e2e8f0').stroke();
            
            // Set cursor to Totales section
            doc.y = itemBottomY + 15;
            
            // ================= TOTALS SECTION =================
            // Subtotal row
            const subtotalY = doc.y;
            doc.font('Helvetica-Bold').fillColor('#475569').text('Subtotal:', 350, subtotalY);
            doc.font('Helvetica').fillColor('#334155').text(`${parseFloat(invoiceData.baseAmount || 0).toFixed(2)} ${invoiceData.currency}`, 450, subtotalY, { width: 90, align: 'right' });
            
            // IVA row
            doc.y = subtotalY + 18;
            const ivaY = doc.y;
            doc.font('Helvetica-Bold').fillColor('#475569').text('IVA (Exento):', 350, ivaY);
            doc.font('Helvetica').fillColor('#334155').text(`0.00 ${invoiceData.currency}`, 450, ivaY, { width: 90, align: 'right' });
            
            // Divider before Total
            doc.moveTo(350, ivaY + 15).lineTo(540, ivaY + 15).lineWidth(1).strokeColor('#cbd5e1').stroke();
            
            // Total row
            doc.y = ivaY + 22;
            const totalY = doc.y;
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('Total:', 350, totalY);
            doc.text(`${parseFloat(invoiceData.totalAmount || 0).toFixed(2)} ${invoiceData.currency}`, 450, totalY, { width: 90, align: 'right' });

            // ================= LEGAL FOOTER =================
            doc.y = totalY + 45;
            doc.moveTo(50, doc.y).lineTo(540, doc.y).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
            
            doc.moveDown(1.5);
            doc.fontSize(7.5).font('Helvetica-Oblique').fillColor('#64748b');
            doc.text(invoiceData.legalText, { align: 'center', width: 440 });

            doc.end();

            writeStream.on('finish', () => resolve(true));
            writeStream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};