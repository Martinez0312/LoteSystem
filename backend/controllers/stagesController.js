// backend/controllers/stagesController.js
// Controlador de etapas del proyecto habitacional

const { pool } = require('../config/database');

const getAllStages = async (req, res) => {
    try {
        const [stages] = await pool.query(
            `SELECT ps.*, COUNT(l.id) as num_lotes 
             FROM project_stages ps 
             LEFT JOIN lots l ON ps.id = l.etapa_id 
             GROUP BY ps.id 
             ORDER BY ps.orden ASC`
        );
        res.json({ success: true, data: stages });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener etapas' });
    }
};

const createStage = async (req, res) => {
    try {
        const { nombre, descripcion, orden, fecha_inicio, fecha_fin } = req.body;
        const [result] = await pool.query(
            'INSERT INTO project_stages (nombre, descripcion, orden, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?, ?)',
            [nombre, descripcion || null, orden, fecha_inicio || null, fecha_fin || null]
        );
        res.status(201).json({ success: true, message: 'Etapa creada', id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al crear etapa' });
    }
};

const updateStage = async (req, res) => {
    try {
        const { nombre, descripcion, orden, fecha_inicio, fecha_fin, activo } = req.body;
        await pool.query(
            'UPDATE project_stages SET nombre=?, descripcion=?, orden=?, fecha_inicio=?, fecha_fin=?, activo=? WHERE id=?',
            [nombre, descripcion, orden, fecha_inicio, fecha_fin, activo, req.params.id]
        );
        res.json({ success: true, message: 'Etapa actualizada' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar etapa' });
    }
};

module.exports = { getAllStages, createStage, updateStage };
