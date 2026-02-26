// backend/controllers/authController.js
// Controlador de autenticación: registro, login, logout, recuperación

// const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/database');
const { sendPasswordResetEmail } = require('../config/email');

// ─── REGISTRO ────────────────────────────────────────────────
const register = async (req, res) => {
    try {
        const { nombre, apellido, email, password, telefono, cedula, direccion } = req.body;

        // Verificar si el email ya existe
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length) {
            return res.status(400).json({ success: false, message: 'El email ya está registrado' });
        }

        // Verificar cédula duplicada si se proporciona
        if (cedula) {
            const [existCed] = await pool.query('SELECT id FROM users WHERE cedula = ?', [cedula]);
            if (existCed.length) {
                return res.status(400).json({ success: false, message: 'La cédula ya está registrada' });
            }
        }

        // Encriptar contraseña con bcrypt (10 rondas de salt)
        const password_hash = await bcrypt.hash(password, 10);

        // Insertar usuario con rol de Cliente (rol_id = 2)
        const [result] = await pool.query(
            `INSERT INTO users (rol_id, nombre, apellido, email, telefono, cedula, direccion, password_hash) 
             VALUES (2, ?, ?, ?, ?, ?, ?, ?)`,
            [nombre, apellido, email, telefono || null, cedula || null, direccion || null, password_hash]
        );

        res.status(201).json({ 
            success: true, 
            message: 'Usuario registrado exitosamente',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

// ─── LOGIN ────────────────────────────────────────────────────
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario con su rol
        const [users] = await pool.query(
            `SELECT u.*, r.nombre as rol FROM users u 
             JOIN roles r ON u.rol_id = r.id 
             WHERE u.email = ? AND u.activo = TRUE`,
            [email]
        );

        if (!users.length) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }

        const user = users[0];

        // Verificar contraseña con bcrypt
        // const passwordValid = await bcrypt.compare(password, user.password_hash);
        //if (!passwordValid) {
            //return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        //}
        if (password !== user.password_hash) {
          return res.status(401).json({ message: "Contraseña incorrecta" });
        }

        // Generar token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, rol: user.rol },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // No enviar hash de contraseña al cliente
        const { password_hash, reset_token, reset_token_expiry, ...userSafe } = user;

        res.json({ 
            success: true, 
            message: 'Inicio de sesión exitoso',
            token,
            user: userSafe
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

// ─── SOLICITAR RESET DE CONTRASEÑA ───────────────────────────
const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        const [users] = await pool.query('SELECT * FROM users WHERE email = ? AND activo = TRUE', [email]);
        
        // Respuesta genérica por seguridad (no revelar si el email existe)
        if (!users.length) {
            return res.json({ success: true, message: 'Si el email existe, recibirás instrucciones' });
        }

        const user = users[0];
        
        // Generar token seguro
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000); // 1 hora

        await pool.query(
            'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
            [resetToken, expiry, user.id]
        );

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pages/reset-password.html?token=${resetToken}`;
        
        await sendPasswordResetEmail({ 
            to: user.email, 
            clientName: user.nombre, 
            resetUrl 
        });

        res.json({ success: true, message: 'Si el email existe, recibirás instrucciones' });
    } catch (error) {
        console.error('Error en solicitud de reset:', error);
        res.status(500).json({ success: false, message: 'Error al procesar solicitud' });
    }
};

// ─── RESETEAR CONTRASEÑA ─────────────────────────────────────
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        const [users] = await pool.query(
            'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
            [token]
        );

        if (!users.length) {
            return res.status(400).json({ success: false, message: 'Token inválido o expirado' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        await pool.query(
            'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
            [password_hash, users[0].id]
        );

        res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        console.error('Error en reset de contraseña:', error);
        res.status(500).json({ success: false, message: 'Error al restablecer contraseña' });
    }
};

// ─── OBTENER PERFIL ──────────────────────────────────────────
const getProfile = async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, u.cedula, u.direccion, 
                    u.created_at, r.nombre as rol
             FROM users u JOIN roles r ON u.rol_id = r.id WHERE u.id = ?`,
            [req.user.id]
        );
        res.json({ success: true, user: users[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener perfil' });
    }
};

// ─── ACTUALIZAR PERFIL ───────────────────────────────────────
const updateProfile = async (req, res) => {
    try {
        const { nombre, apellido, telefono, direccion } = req.body;
        await pool.query(
            'UPDATE users SET nombre = ?, apellido = ?, telefono = ?, direccion = ? WHERE id = ?',
            [nombre, apellido, telefono, direccion, req.user.id]
        );
        res.json({ success: true, message: 'Perfil actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar perfil' });
    }
};

module.exports = { register, login, requestPasswordReset, resetPassword, getProfile, updateProfile };
