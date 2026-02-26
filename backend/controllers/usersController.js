// backend/controllers/usersController.js
// Controlador de gestión de usuarios (Admin)

const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

// ─── LISTAR USUARIOS (Admin) ──────────────────────────────────
const getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, u.cedula, u.activo,
                    u.created_at, r.nombre as rol
             FROM users u JOIN roles r ON u.rol_id = r.id
             ORDER BY u.created_at DESC`
        );
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
    }
};

// ─── OBTENER USUARIO POR ID (Admin) ──────────────────────────
const getUserById = async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, u.cedula, 
                    u.direccion, u.activo, u.created_at, r.nombre as rol
             FROM users u JOIN roles r ON u.rol_id = r.id WHERE u.id = ?`,
            [req.params.id]
        );
        if (!users.length) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        res.json({ success: true, data: users[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener usuario' });
    }
};

// ─── CREAR USUARIO (Admin) ────────────────────────────────────
const createUser = async (req, res) => {
    try {
        const { nombre, apellido, email, password, telefono, cedula, direccion, rol_id } = req.body;
        
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length) {
            return res.status(400).json({ success: false, message: 'El email ya está registrado' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            `INSERT INTO users (rol_id, nombre, apellido, email, telefono, cedula, direccion, password_hash)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [rol_id || 2, nombre, apellido, email, telefono || null, cedula || null, direccion || null, password_hash]
        );

        res.status(201).json({ success: true, message: 'Usuario creado exitosamente', id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al crear usuario' });
    }
};

// ─── ACTUALIZAR USUARIO (Admin) ──────────────────────────────
const updateUser = async (req, res) => {
    try {
        const { nombre, apellido, telefono, cedula, direccion, rol_id, activo } = req.body;
        await pool.query(
            `UPDATE users SET nombre=?, apellido=?, telefono=?, cedula=?, direccion=?, rol_id=?, activo=? 
             WHERE id=?`,
            [nombre, apellido, telefono || null, cedula || null, direccion || null, rol_id, activo, req.params.id]
        );
        res.json({ success: true, message: 'Usuario actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
    }
};

// ─── ACTIVAR/DESACTIVAR USUARIO (Admin) ──────────────────────
const toggleUserStatus = async (req, res) => {
    try {
        const [user] = await pool.query('SELECT activo, rol_id FROM users WHERE id = ?', [req.params.id]);
        if (!user.length) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        
        // No permitir desactivar al propio admin logueado
        if (parseInt(req.params.id) === req.user.id) {
            return res.status(400).json({ success: false, message: 'No puedes desactivar tu propia cuenta' });
        }

        const newStatus = !user[0].activo;
        await pool.query('UPDATE users SET activo = ? WHERE id = ?', [newStatus, req.params.id]);
        
        res.json({ 
            success: true, 
            message: `Usuario ${newStatus ? 'activado' : 'desactivado'} exitosamente` 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al cambiar estado del usuario' });
    }
};

// ─── DASHBOARD STATS (Admin) ──────────────────────────────────
const getDashboardStats = async (req, res) => {
    try {
        const [[users]] = await pool.query('SELECT COUNT(*) as total FROM users WHERE rol_id = 2');
        const [[lots]] = await pool.query(`
            SELECT COUNT(*) as total, 
                   SUM(CASE WHEN estado='Disponible' THEN 1 ELSE 0 END) as disponibles,
                   SUM(CASE WHEN estado='Vendido' THEN 1 ELSE 0 END) as vendidos
            FROM lots`);
        const [[purchases]] = await pool.query(`
            SELECT COUNT(*) as total, SUM(valor_total) as valor_total FROM purchases`);
        const [[payments]] = await pool.query(`
            SELECT COUNT(*) as total, SUM(monto) as total_recaudado FROM payments`);
        const [[pqrs]] = await pool.query(`
            SELECT COUNT(*) as total, SUM(CASE WHEN estado='Pendiente' THEN 1 ELSE 0 END) as pendientes FROM pqrs`);

        res.json({
            success: true,
            data: {
                clientes: users.total,
                lotes: lots,
                compras: purchases,
                pagos: payments,
                pqrs
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
    }
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, toggleUserStatus, getDashboardStats };
