// backend/utils/pdfGenerator.js
// Generador de comprobantes PDF con PDFKit

const PDFDocument = require('pdfkit');

const generatePaymentPDF = (paymentData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const buffers = [];

            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // ── Encabezado ──────────────────────────────────────────
            doc.rect(0, 0, doc.page.width, 100).fill('#2c7be5');
            doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
               .text('SISTEMA DE LOTES DE TERRENO', 50, 25, { align: 'center' });
            doc.fontSize(12).font('Helvetica')
               .text('COMPROBANTE DE PAGO', 50, 55, { align: 'center' });
            doc.fillColor('#2c7be5').fontSize(10)
               .text(`No. ${String(paymentData.id).padStart(6, '0')}`, 50, 75, { align: 'center' });

            // ── Información del cliente ──────────────────────────────
            doc.fillColor('#333').moveTo(50, 120).lineTo(550, 120).stroke('#2c7be5');
            doc.fontSize(13).font('Helvetica-Bold').fillColor('#2c7be5')
               .text('INFORMACIÓN DEL CLIENTE', 50, 130);

            doc.fontSize(10).font('Helvetica').fillColor('#333');
            const cliente = [
                ['Nombre:', `${paymentData.cliente_nombre} ${paymentData.cliente_apellido}`],
                ['Email:', paymentData.cliente_email],
                ['Cédula:', paymentData.cliente_cedula || 'N/A'],
                ['Teléfono:', paymentData.cliente_telefono || 'N/A']
            ];
            let y = 150;
            cliente.forEach(([label, value]) => {
                doc.font('Helvetica-Bold').text(label, 50, y, { width: 120 });
                doc.font('Helvetica').text(value, 170, y);
                y += 20;
            });

            // ── Información del lote ─────────────────────────────────
            doc.moveTo(50, y + 10).lineTo(550, y + 10).stroke('#2c7be5');
            doc.fontSize(13).font('Helvetica-Bold').fillColor('#2c7be5')
               .text('INFORMACIÓN DEL LOTE', 50, y + 20);

            doc.fontSize(10).fillColor('#333');
            y += 40;
            const lote = [
                ['Código:', paymentData.lote_codigo],
                ['Ubicación:', paymentData.lote_ubicacion],
                ['Área:', `${paymentData.lote_area} m²`],
                ['Valor Total:', `$${parseFloat(paymentData.valor_total).toLocaleString('es-CO')}`]
            ];
            lote.forEach(([label, value]) => {
                doc.font('Helvetica-Bold').text(label, 50, y, { width: 120 });
                doc.font('Helvetica').text(value, 170, y);
                y += 20;
            });

            // ── Detalles del pago ────────────────────────────────────
            doc.moveTo(50, y + 10).lineTo(550, y + 10).stroke('#2c7be5');
            doc.fontSize(13).font('Helvetica-Bold').fillColor('#2c7be5')
               .text('DETALLE DEL PAGO', 50, y + 20);

            y += 40;
            // Recuadro destacado para el monto
            doc.rect(50, y, 500, 60).fill('#f0f7ff').stroke('#2c7be5');
            doc.fillColor('#2c7be5').fontSize(14).font('Helvetica-Bold')
               .text('MONTO PAGADO', 50, y + 10, { align: 'center' });
            doc.fontSize(22).text(`$${parseFloat(paymentData.monto).toLocaleString('es-CO')}`, 50, y + 28, { align: 'center' });

            y += 80;
            doc.fillColor('#333').fontSize(10);
            const pagos = [
                ['Número de Cuota:', `${paymentData.numero_cuota} de ${paymentData.num_cuotas}`],
                ['Fecha de Pago:', new Date(paymentData.fecha_pago).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })],
                ['Método de Pago:', paymentData.metodo_pago],
                ['Referencia:', paymentData.referencia || 'N/A']
            ];
            pagos.forEach(([label, value]) => {
                doc.font('Helvetica-Bold').text(label, 50, y, { width: 160 });
                doc.font('Helvetica').text(value, 210, y);
                y += 20;
            });

            // ── Resumen de cuenta ────────────────────────────────────
            y += 10;
            doc.moveTo(50, y).lineTo(550, y).stroke('#2c7be5');
            doc.fontSize(13).font('Helvetica-Bold').fillColor('#2c7be5')
               .text('RESUMEN DE CUENTA', 50, y + 10);
            y += 30;

            // Tabla resumen
            const tableData = [
                ['Total Pagado', `$${parseFloat(paymentData.total_pagado).toLocaleString('es-CO')}`],
                ['Saldo Pendiente', `$${parseFloat(paymentData.saldo_pendiente).toLocaleString('es-CO')}`],
                ['Cuotas Pagadas', `${paymentData.cuotas_pagadas} de ${paymentData.num_cuotas}`],
                ['Progreso', `${Math.round((paymentData.cuotas_pagadas / paymentData.num_cuotas) * 100)}%`]
            ];
            tableData.forEach(([label, value], i) => {
                const bg = i % 2 === 0 ? '#f8f9fa' : 'white';
                doc.rect(50, y, 500, 22).fill(bg).stroke('#dee2e6');
                doc.fillColor('#333').font('Helvetica-Bold').fontSize(10)
                   .text(label, 60, y + 6, { width: 240 });
                doc.font('Helvetica').text(value, 300, y + 6, { width: 240, align: 'right' });
                y += 22;
            });

            // ── Pie de página ────────────────────────────────────────
            doc.rect(0, doc.page.height - 60, doc.page.width, 60).fill('#2c7be5');
            doc.fillColor('white').fontSize(9).font('Helvetica')
               .text('Este documento es un comprobante oficial de pago.', 50, doc.page.height - 45, { align: 'center' })
               .text(`Generado el ${new Date().toLocaleString('es-CO')} | Sistema de Lotes de Terreno`, 50, doc.page.height - 30, { align: 'center' });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = { generatePaymentPDF };
