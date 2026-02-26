// backend/config/email.js
const nodemailer = require('nodemailer');

const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

const verifyEmailConfig = async () => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('⚠️  Email no configurado (EMAIL_USER / EMAIL_PASS no definidos)');
            return;
        }
        const transporter = createTransporter();
        await transporter.verify();
        console.log('✅ Configuración de correo verificada');
    } catch (error) {
        console.warn('⚠️  Servicio de correo no disponible:', error.message);
    }
};

const sendPaymentEmail = async ({ to, clientName, paymentData, pdfBuffer }) => {
    const transporter = createTransporter();
    const mailOptions = {
        from: `"Sistema Lotes Terreno" <${process.env.EMAIL_USER}>`,
        to,
        subject: `✅ Comprobante de Pago - Cuota #${paymentData.numero_cuota} | Lote ${paymentData.lote_codigo}`,
        html: `<!DOCTYPE html><html><head><style>
            body{font-family:Arial,sans-serif;color:#333;}
            .header{background:#2c7be5;color:white;padding:20px;text-align:center;}
            .content{padding:20px;}
            .info-box{background:#f8f9fa;border-left:4px solid #2c7be5;padding:15px;margin:15px 0;}
            .amount{font-size:24px;color:#2c7be5;font-weight:bold;}
            .footer{background:#f1f1f1;padding:15px;text-align:center;font-size:12px;}
        </style></head><body>
            <div class="header"><h1>🏡 Sistema Lotes de Terreno</h1><p>Comprobante de Pago</p></div>
            <div class="content">
                <p>Estimado/a <strong>${clientName}</strong>,</p>
                <p>Su pago ha sido registrado exitosamente:</p>
                <div class="info-box">
                    <p><strong>Cuota #${paymentData.numero_cuota}</strong></p>
                    <p>Lote: ${paymentData.lote_codigo} - ${paymentData.lote_ubicacion}</p>
                    <p>Fecha: ${new Date(paymentData.fecha_pago).toLocaleDateString('es-CO')}</p>
                    <p>Método: ${paymentData.metodo_pago}</p>
                    ${paymentData.referencia ? `<p>Referencia: ${paymentData.referencia}</p>` : ''}
                </div>
                <p class="amount">💰 $${parseFloat(paymentData.monto).toLocaleString('es-CO')}</p>
                <div class="info-box">
                    <p>Total Pagado: $${parseFloat(paymentData.total_pagado).toLocaleString('es-CO')}</p>
                    <p>Saldo Pendiente: $${parseFloat(paymentData.saldo_pendiente).toLocaleString('es-CO')}</p>
                    <p>Cuotas: ${paymentData.cuotas_pagadas} de ${paymentData.num_cuotas}</p>
                </div>
            </div>
            <div class="footer"><p>Sistema de Gestión de Lotes de Terreno | Correo automático</p></div>
        </body></html>`,
        attachments: pdfBuffer ? [{
            filename: `comprobante_cuota${paymentData.numero_cuota}_${paymentData.lote_codigo}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
        }] : []
    };
    return transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async ({ to, clientName, resetUrl }) => {
    const transporter = createTransporter();
    const mailOptions = {
        from: `"Sistema Lotes Terreno" <${process.env.EMAIL_USER}>`,
        to,
        subject: '🔐 Recuperación de Contraseña',
        html: `<div style="font-family:Arial;max-width:600px;margin:auto;">
            <div style="background:#2c7be5;color:white;padding:20px;text-align:center;">
                <h2>Recuperación de Contraseña</h2>
            </div>
            <div style="padding:20px;">
                <p>Hola <strong>${clientName}</strong>,</p>
                <p>Haz clic en el siguiente enlace (válido por 1 hora):</p>
                <p style="text-align:center;">
                    <a href="${resetUrl}" style="background:#2c7be5;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;">
                        Restablecer Contraseña
                    </a>
                </p>
                <p>Si no solicitaste este cambio, ignora este correo.</p>
            </div>
        </div>`
    };
    return transporter.sendMail(mailOptions);
};

module.exports = { verifyEmailConfig, sendPaymentEmail, sendPasswordResetEmail };
