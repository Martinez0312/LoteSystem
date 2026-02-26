// backend/controllers/pqrsController.js
// Controlador de Peticiones, Quejas, Reclamos y Sugerencias

const { pool } = require('../config/database');

// ─── CREAR PQRS (Cliente) ─────────────────────────────────────
const createPQRS = async (req, res) => {
    try {
        const { tipo, asunto, descripcion } = req.body;
        const cliente_id = req.user.id;

        const [result] = await pool.query(
            `INSERT INTO pqrs (cliente_id, tipo, asunto, descripcion) VALUES (?, ?, ?, ?)`,
            [cliente_id, tipo, asunto, descripcion]
        );

        res.status(201).json({
            success: true,
            message: 'PQRS enviada exitosamente. Le responderemos pronto.',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error al crear PQRS:', error);
        res.status(500).json({ success: false, message: 'Error al enviar PQRS' });
    }
};

// ─── MIS PQRS (Cliente) ────────────────────────────────────────
const getMyPQRS = async (req, res) => {
    try {
        const [pqrs] = await pool.query(
            `SELECT p.*, 
                    CONCAT(u.nombre, ' ', u.apellido) as admin_nombre
             FROM pqrs p
             LEFT JOIN users u ON p.admin_id = u.id
             WHERE p.cliente_id = ?
             ORDER BY p.created_at DESC`,
            [req.user.id]
        );
        res.json({ success: true, data: pqrs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener PQRS' });
    }
};

// ─── TODAS LAS PQRS (Admin) ───────────────────────────────────
const getAllPQRS = async (req, res) => {
    try {
        const { estado, tipo } = req.query;
        let query = `
            SELECT p.*, 
                   CONCAT(c.nombre, ' ', c.apellido) as cliente_nombre,
                   c.email as cliente_email,
                   CONCAT(a.nombre, ' ', a.apellido) as admin_nombre
            FROM pqrs p
            JOIN users c ON p.cliente_id = c.id
            LEFT JOIN users a ON p.admin_id = a.id
            WHERE 1=1
        `;
        const params = [];

        if (estado) { query += ' AND p.estado = ?'; params.push(estado); }
        if (tipo) { query += ' AND p.tipo = ?'; params.push(tipo); }
        
        query += ' ORDER BY FIELD(p.estado, "Pendiente", "En proceso", "Resuelto"), p.created_at DESC';

        const [pqrs] = await pool.query(query, params);
        res.json({ success: true, data: pqrs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener PQRS' });
    }
};

// ─── DETALLE DE UNA PQRS ─────────────────────────────────────
const getPQRSById = async (req, res) => {
    try {
        const [pqrs] = await pool.query(
            `SELECT p.*, CONCAT(c.nombre, ' ', c.apellido) as cliente_nombre, c.email as cliente_email
             FROM pqrs p JOIN users c ON p.cliente_id = c.id
             WHERE p.id = ?`,
            [req.params.id]
        );

        if (!pqrs.length) {
            return res.status(404).json({ success: false, message: 'PQRS no encontrada' });
        }

        // Verificar acceso
        if (req.user.rol !== 'Administrador' && pqrs[0].cliente_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Acceso denegado' });
        }

        res.json({ success: true, data: pqrs[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener PQRS' });
    }
};

// ─── RESPONDER / CAMBIAR ESTADO PQRS (Admin) ──────────────────
const updatePQRS = async (req, res) => {
    try {
        const { estado, respuesta } = req.body;
        const validStates = ['Pendiente', 'En proceso', 'Resuelto'];
        
        if (!validStates.includes(estado)) {
            return res.status(400).json({ success: false, message: 'Estado inválido' });
        }

        await pool.query(
            `UPDATE pqrs SET estado = ?, respuesta = ?, admin_id = ?,
             fecha_respuesta = CASE WHEN ? = 'Resuelto' THEN NOW() ELSE fecha_respuesta END
             WHERE id = ?`,
            [estado, respuesta || null, req.user.id, estado, req.params.id]
        );

        res.json({ success: true, message: 'PQRS actualizada exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar PQRS' });
    }
};

// ─── ESTADÍSTICAS PQRS (Admin) ────────────────────────────────
const getPQRSStats = async (req, res) => {
    try {
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN estado = 'En proceso' THEN 1 ELSE 0 END) as en_proceso,
                SUM(CASE WHEN estado = 'Resuelto' THEN 1 ELSE 0 END) as resueltos,
                SUM(CASE WHEN tipo = 'Peticion' THEN 1 ELSE 0 END) as peticiones,
                SUM(CASE WHEN tipo = 'Queja' THEN 1 ELSE 0 END) as quejas,
                SUM(CASE WHEN tipo = 'Reclamo' THEN 1 ELSE 0 END) as reclamos,
                SUM(CASE WHEN tipo = 'Sugerencia' THEN 1 ELSE 0 END) as sugerencias
            FROM pqrs
        `);
        res.json({ success: true, data: stats[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
    }
};

module.exports = { createPQRS, getMyPQRS, getAllPQRS, getPQRSById, updatePQRS, getPQRSStats };
