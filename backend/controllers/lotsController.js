// backend/controllers/lotsController.js
// Controlador CRUD de lotes de terreno

const { pool } = require('../config/database');

// ─── OBTENER TODOS LOS LOTES (público, con filtros) ───────────
const getAllLots = async (req, res) => {
    try {
        const { estado, etapa_id, min_area, max_area, min_valor, max_valor } = req.query;

        let query = `
            SELECT l.*, ps.nombre as etapa_nombre, ps.descripcion as etapa_desc
            FROM lots l
            LEFT JOIN project_stages ps ON l.etapa_id = ps.id
            WHERE 1=1
        `;
        const params = [];

        if (estado) { query += ' AND l.estado = ?'; params.push(estado); }
        if (etapa_id) { query += ' AND l.etapa_id = ?'; params.push(etapa_id); }
        if (min_area) { query += ' AND l.area >= ?'; params.push(min_area); }
        if (max_area) { query += ' AND l.area <= ?'; params.push(max_area); }
        if (min_valor) { query += ' AND l.valor >= ?'; params.push(min_valor); }
        if (max_valor) { query += ' AND l.valor <= ?'; params.push(max_valor); }

        query += ' ORDER BY l.estado ASC, l.id ASC';

        const [lots] = await pool.query(query, params);
        res.json({ success: true, data: lots, total: lots.length });
    } catch (error) {
        console.error('Error al obtener lotes:', error);
        res.status(500).json({ success: false, message: 'Error al obtener lotes' });
    }
};

// ─── OBTENER UN LOTE POR ID ───────────────────────────────────
const getLotById = async (req, res) => {
    try {
        const [lots] = await pool.query(
            `SELECT l.*, ps.nombre as etapa_nombre FROM lots l
             LEFT JOIN project_stages ps ON l.etapa_id = ps.id
             WHERE l.id = ?`,
            [req.params.id]
        );
        if (!lots.length) {
            return res.status(404).json({ success: false, message: 'Lote no encontrado' });
        }
        res.json({ success: true, data: lots[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener lote' });
    }
};

// ─── CREAR LOTE (Admin) ───────────────────────────────────────
const createLot = async (req, res) => {
    try {
        const { codigo, etapa_id, area, ubicacion, coordenadas, valor, valor_cuota, num_cuotas, descripcion } = req.body;

        // Calcular valor_cuota si no se proporciona
        const cuotaCalculada = valor_cuota || (valor / (num_cuotas || 12));

        const [result] = await pool.query(
            `INSERT INTO lots (codigo, etapa_id, area, ubicacion, coordenadas, valor, valor_cuota, num_cuotas, descripcion)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [codigo, etapa_id || null, area, ubicacion, coordenadas || null, valor, cuotaCalculada, num_cuotas || 12, descripcion || null]
        );

        res.status(201).json({ 
            success: true, 
            message: 'Lote creado exitosamente',
            id: result.insertId 
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'El código del lote ya existe' });
        }
        console.error('Error al crear lote:', error);
        res.status(500).json({ success: false, message: 'Error al crear lote' });
    }
};

// ─── ACTUALIZAR LOTE (Admin) ──────────────────────────────────
const updateLot = async (req, res) => {
    try {
        const { codigo, etapa_id, area, ubicacion, coordenadas, valor, valor_cuota, num_cuotas, estado, descripcion } = req.body;
        
        await pool.query(
            `UPDATE lots SET codigo=?, etapa_id=?, area=?, ubicacion=?, coordenadas=?, 
             valor=?, valor_cuota=?, num_cuotas=?, estado=?, descripcion=? WHERE id=?`,
            [codigo, etapa_id || null, area, ubicacion, coordenadas || null, 
             valor, valor_cuota, num_cuotas, estado, descripcion || null, req.params.id]
        );

        res.json({ success: true, message: 'Lote actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar lote:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar lote' });
    }
};

// ─── CAMBIAR ESTADO DEL LOTE (Admin) ─────────────────────────
const changeLotStatus = async (req, res) => {
    try {
        const { estado } = req.body;
        const validStates = ['Disponible', 'Reservado', 'Vendido'];
        
        if (!validStates.includes(estado)) {
            return res.status(400).json({ success: false, message: 'Estado inválido' });
        }

        await pool.query('UPDATE lots SET estado = ? WHERE id = ?', [estado, req.params.id]);
        res.json({ success: true, message: `Estado cambiado a ${estado}` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al cambiar estado' });
    }
};

// ─── ELIMINAR LOTE (Admin) ────────────────────────────────────
const deleteLot = async (req, res) => {
    try {
        // Verificar si el lote tiene compras asociadas
        const [purchases] = await pool.query('SELECT id FROM purchases WHERE lote_id = ?', [req.params.id]);
        if (purchases.length) {
            return res.status(400).json({ 
                success: false, 
                message: 'No se puede eliminar un lote con compras asociadas' 
            });
        }

        await pool.query('DELETE FROM lots WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Lote eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar lote' });
    }
};

// ─── ESTADÍSTICAS (Admin) ─────────────────────────────────────
const getLotStats = async (req, res) => {
    try {
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'Disponible' THEN 1 ELSE 0 END) as disponibles,
                SUM(CASE WHEN estado = 'Reservado' THEN 1 ELSE 0 END) as reservados,
                SUM(CASE WHEN estado = 'Vendido' THEN 1 ELSE 0 END) as vendidos,
                SUM(valor) as valor_total_inventario,
                AVG(area) as area_promedio
            FROM lots
        `);
        res.json({ success: true, data: stats[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
    }
};

module.exports = { getAllLots, getLotById, createLot, updateLot, changeLotStatus, deleteLot, getLotStats };
