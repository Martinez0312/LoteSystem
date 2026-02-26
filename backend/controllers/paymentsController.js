// backend/controllers/paymentsController.js
const { pool } = require('../config/database');
const { generatePaymentPDF } = require('../utils/pdfGenerator');
const { sendPaymentEmail } = require('../config/email');

// ─── REGISTRAR PAGO ───────────────────────────────────────────
const createPayment = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { compra_id, monto, fecha_pago, metodo_pago, referencia, notas } = req.body;
        const cliente_id = req.user.id;
        const isAdmin = req.user.rol === 'Administrador';

        // Obtener información completa de la compra
        const purchaseQuery = isAdmin
            ? `SELECT p.*, l.codigo as lote_codigo, l.ubicacion as lote_ubicacion, l.area as lote_area,
               u.nombre as cliente_nombre, u.apellido as cliente_apellido, 
               u.email as cliente_email, u.cedula as cliente_cedula, u.telefono as cliente_telefono
               FROM purchases p JOIN lots l ON p.lote_id = l.id JOIN users u ON p.cliente_id = u.id
               WHERE p.id = ? FOR UPDATE`
            : `SELECT p.*, l.codigo as lote_codigo, l.ubicacion as lote_ubicacion, l.area as lote_area,
               u.nombre as cliente_nombre, u.apellido as cliente_apellido, 
               u.email as cliente_email, u.cedula as cliente_cedula, u.telefono as cliente_telefono
               FROM purchases p JOIN lots l ON p.lote_id = l.id JOIN users u ON p.cliente_id = u.id
               WHERE p.id = ? AND p.cliente_id = ? FOR UPDATE`;

        const queryParams = isAdmin ? [compra_id] : [compra_id, cliente_id];
        const [purchaseData] = await connection.query(purchaseQuery, queryParams);

        if (!purchaseData.length) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Compra no encontrada' });
        }

        const purchase = purchaseData[0];

        if (purchase.estado === 'Completado') {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Esta compra ya está completamente pagada' });
        }

        const numeroCuota = purchase.cuotas_pagadas + 1;

        const [result] = await connection.query(
            `INSERT INTO payments (compra_id, cliente_id, numero_cuota, monto, fecha_pago, metodo_pago, referencia, notas)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [compra_id, purchase.cliente_id, numeroCuota, monto,
             fecha_pago || new Date().toISOString().split('T')[0],
             metodo_pago, referencia || null, notas || null]
        );

        // Obtener datos actualizados de la compra
        const [updatedPurchase] = await connection.query(
            'SELECT total_pagado, saldo_pendiente, cuotas_pagadas, num_cuotas FROM purchases WHERE id = ?',
            [compra_id]
        );

        await connection.commit();

        const pdfData = {
            id: result.insertId,
            ...purchase,
            numero_cuota: numeroCuota,
            monto,
            fecha_pago: fecha_pago || new Date(),
            metodo_pago,
            referencia,
            total_pagado: updatedPurchase[0].total_pagado,
            saldo_pendiente: updatedPurchase[0].saldo_pendiente,
            cuotas_pagadas: updatedPurchase[0].cuotas_pagadas,
            num_cuotas: updatedPurchase[0].num_cuotas,
            valor_total: purchase.valor_total
        };

        let pdfBuffer = null;
        try {
            pdfBuffer = await generatePaymentPDF(pdfData);
        } catch (pdfError) {
            console.error('Error al generar PDF:', pdfError.message);
        }

        let correoEnviado = false;
        if (pdfBuffer && purchase.cliente_email) {
            try {
                await sendPaymentEmail({
                    to: purchase.cliente_email,
                    clientName: `${purchase.cliente_nombre} ${purchase.cliente_apellido}`,
                    paymentData: pdfData,
                    pdfBuffer
                });
                correoEnviado = true;
                await pool.query('UPDATE payments SET correo_enviado = TRUE WHERE id = ?', [result.insertId]);
            } catch (emailError) {
                console.error('Error al enviar correo:', emailError.message);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Pago registrado exitosamente',
            data: {
                pago_id: result.insertId,
                numero_cuota: numeroCuota,
                correo_enviado: correoEnviado,
                total_pagado: updatedPurchase[0].total_pagado,
                saldo_pendiente: updatedPurchase[0].saldo_pendiente
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error al registrar pago:', error);
        res.status(500).json({ success: false, message: 'Error al registrar pago' });
    } finally {
        connection.release();
    }
};

// ─── HISTORIAL DE PAGOS DEL CLIENTE ──────────────────────────
const getMyPayments = async (req, res) => {
    try {
        const [payments] = await pool.query(
            `SELECT py.*, l.codigo as lote_codigo, l.ubicacion,
                    p.num_cuotas, p.valor_total, p.total_pagado, p.saldo_pendiente
             FROM payments py
             JOIN purchases p ON py.compra_id = p.id
             JOIN lots l ON p.lote_id = l.id
             WHERE py.cliente_id = ?
             ORDER BY py.fecha_pago DESC, py.id DESC`,
            [req.user.id]
        );
        res.json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener historial' });
    }
};

// ─── TODOS LOS PAGOS (Admin) ──────────────────────────────────
const getAllPayments = async (req, res) => {
    try {
        const [payments] = await pool.query(`
            SELECT py.*, 
                   l.codigo as lote_codigo, l.ubicacion,
                   u.nombre as cliente_nombre, u.apellido as cliente_apellido,
                   u.email as cliente_email
            FROM payments py
            JOIN purchases p ON py.compra_id = p.id
            JOIN lots l ON p.lote_id = l.id
            JOIN users u ON py.cliente_id = u.id
            ORDER BY py.fecha_pago DESC, py.id DESC
        `);
        res.json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener pagos' });
    }
};

// ─── DESCARGAR COMPROBANTE PDF ────────────────────────────────
const downloadReceipt = async (req, res) => {
    try {
        const paymentId = req.params.id;

        const [payments] = await pool.query(
            `SELECT py.*, 
                    p.valor_total, p.num_cuotas, p.total_pagado, p.saldo_pendiente, p.cuotas_pagadas,
                    l.codigo as lote_codigo, l.ubicacion as lote_ubicacion, l.area as lote_area,
                    u.nombre as cliente_nombre, u.apellido as cliente_apellido,
                    u.email as cliente_email, u.cedula as cliente_cedula, u.telefono as cliente_telefono
             FROM payments py
             JOIN purchases p ON py.compra_id = p.id
             JOIN lots l ON p.lote_id = l.id
             JOIN users u ON py.cliente_id = u.id
             WHERE py.id = ?`,
            [paymentId]
        );

        if (!payments.length) {
            return res.status(404).json({ success: false, message: 'Pago no encontrado' });
        }

        const payment = payments[0];

        if (req.user.rol !== 'Administrador' && payment.cliente_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Acceso denegado' });
        }

        const pdfBuffer = await generatePaymentPDF(payment);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=comprobante_pago_${paymentId}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error al generar comprobante:', error);
        res.status(500).json({ success: false, message: 'Error al generar comprobante' });
    }
};

module.exports = { createPayment, getMyPayments, getAllPayments, downloadReceipt };
