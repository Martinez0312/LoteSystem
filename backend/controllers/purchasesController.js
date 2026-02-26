// backend/controllers/purchasesController.js
// Controlador de compras de lotes

const { pool } = require('../config/database');

// ─── COMPRAR LOTE(S) ──────────────────────────────────────────
const createPurchase = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { lote_id, num_cuotas, notas } = req.body;
        const cliente_id = req.user.id;

        // Verificar que el lote existe y está disponible
        const [lots] = await connection.query(
            'SELECT * FROM lots WHERE id = ? AND estado = "Disponible" FOR UPDATE',
            [lote_id]
        );

        if (!lots.length) {
            await connection.rollback();
            return res.status(400).json({ 
                success: false, 
                message: 'El lote no está disponible para compra' 
            });
        }

        const lote = lots[0];
        const cuotas = num_cuotas || lote.num_cuotas;
        const valorCuota = lote.valor / cuotas;

        // Crear la compra
        const [result] = await connection.query(
            `INSERT INTO purchases (cliente_id, lote_id, fecha_compra, valor_total, num_cuotas, valor_cuota, saldo_pendiente, notas)
             VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?)`,
            [cliente_id, lote_id, lote.valor, cuotas, valorCuota, lote.valor, notas || null]
        );

        // Cambiar estado del lote a Vendido
        await connection.query('UPDATE lots SET estado = "Vendido" WHERE id = ?', [lote_id]);

        await connection.commit();

        res.status(201).json({ 
            success: true, 
            message: 'Compra registrada exitosamente',
            data: {
                compra_id: result.insertId,
                lote: lote.codigo,
                valor_total: lote.valor,
                num_cuotas: cuotas,
                valor_cuota: valorCuota
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al crear compra:', error);
        res.status(500).json({ success: false, message: 'Error al procesar la compra' });
    } finally {
        connection.release();
    }
};

// ─── MIS COMPRAS (Cliente) ────────────────────────────────────
const getMyPurchases = async (req, res) => {
    try {
        const [purchases] = await pool.query(
            `SELECT p.*, l.codigo as lote_codigo, l.ubicacion, l.area, l.valor as lote_valor,
                    ps.nombre as etapa_nombre
             FROM purchases p
             JOIN lots l ON p.lote_id = l.id
             LEFT JOIN project_stages ps ON l.etapa_id = ps.id
             WHERE p.cliente_id = ?
             ORDER BY p.created_at DESC`,
            [req.user.id]
        );
        res.json({ success: true, data: purchases });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener compras' });
    }
};

// ─── TODAS LAS COMPRAS (Admin) ────────────────────────────────
const getAllPurchases = async (req, res) => {
    try {
        const [purchases] = await pool.query(`
            SELECT p.*, 
                   l.codigo as lote_codigo, l.ubicacion, l.area,
                   u.nombre as cliente_nombre, u.apellido as cliente_apellido, 
                   u.email as cliente_email, u.cedula as cliente_cedula
            FROM purchases p
            JOIN lots l ON p.lote_id = l.id
            JOIN users u ON p.cliente_id = u.id
            ORDER BY p.created_at DESC
        `);
        res.json({ success: true, data: purchases });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener compras' });
    }
};

// ─── DETALLE DE UNA COMPRA ────────────────────────────────────
const getPurchaseById = async (req, res) => {
    try {
        const [purchases] = await pool.query(
            `SELECT p.*, l.codigo as lote_codigo, l.ubicacion, l.area, l.valor as lote_valor,
                    u.nombre as cliente_nombre, u.apellido as cliente_apellido, u.email as cliente_email
             FROM purchases p
             JOIN lots l ON p.lote_id = l.id
             JOIN users u ON p.cliente_id = u.id
             WHERE p.id = ?`,
            [req.params.id]
        );

        if (!purchases.length) {
            return res.status(404).json({ success: false, message: 'Compra no encontrada' });
        }

        // Solo el propio cliente o admin puede ver la compra
        const purchase = purchases[0];
        if (req.user.rol !== 'Administrador' && purchase.cliente_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Acceso denegado' });
        }

        // Obtener pagos asociados
        const [payments] = await pool.query(
            'SELECT * FROM payments WHERE compra_id = ? ORDER BY numero_cuota',
            [req.params.id]
        );

        res.json({ success: true, data: { ...purchase, pagos: payments } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener compra' });
    }
};

// ─── ESTADO DE CUENTA (Cliente) ───────────────────────────────
const getAccountStatement = async (req, res) => {
    try {
        const clienteId = req.user.rol === 'Administrador' ? req.params.clienteId : req.user.id;

        const [purchases] = await pool.query(
            `SELECT p.*, l.codigo as lote_codigo, l.ubicacion, l.area,
                    (SELECT COUNT(*) FROM payments py WHERE py.compra_id = p.id) as total_pagos
             FROM purchases p
             JOIN lots l ON p.lote_id = l.id
             WHERE p.cliente_id = ?`,
            [clienteId]
        );

        const [summary] = await pool.query(
            `SELECT 
                SUM(valor_total) as deuda_total,
                SUM(total_pagado) as pagado_total,
                SUM(saldo_pendiente) as saldo_total,
                COUNT(*) as num_compras
             FROM purchases WHERE cliente_id = ?`,
            [clienteId]
        );

        res.json({ success: true, data: { compras: purchases, resumen: summary[0] } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener estado de cuenta' });
    }
};

module.exports = { createPurchase, getMyPurchases, getAllPurchases, getPurchaseById, getAccountStatement };
