// backend/middleware/auth.js
// Middleware de autenticación JWT y control de roles

const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Verificar token JWT
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token de acceso requerido' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verificar que el usuario sigue activo en la BD
        const [users] = await pool.query(
            'SELECT u.id, u.nombre, u.apellido, u.email, u.rol_id, r.nombre as rol, u.activo FROM users u JOIN roles r ON u.rol_id = r.id WHERE u.id = ?',
            [decoded.id]
        );

        if (!users.length || !users[0].activo) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuario no autorizado o inactivo' 
            });
        }

        req.user = users[0];
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expirado' });
        }
        return res.status(401).json({ success: false, message: 'Token inválido' });
    }
};

// Verificar rol de administrador
const isAdmin = (req, res, next) => {
    if (req.user && req.user.rol === 'Administrador') {
        return next();
    }
    return res.status(403).json({ 
        success: false, 
        message: 'Acceso denegado. Se requiere rol de Administrador' 
    });
};

// Verificar rol de cliente
const isCliente = (req, res, next) => {
    if (req.user && (req.user.rol === 'Cliente' || req.user.rol === 'Administrador')) {
        return next();
    }
    return res.status(403).json({ 
        success: false, 
        message: 'Acceso denegado' 
    });
};

module.exports = { verifyToken, isAdmin, isCliente };
