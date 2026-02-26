// backend/server.js - Sistema de Gestión de Venta de Lotes de Terreno
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const { testConnection } = require('./config/database');
const { verifyEmailConfig } = require('./config/email');

const authRoutes = require('./routes/authRoutes');
const lotsRoutes = require('./routes/lotsRoutes');
const purchasesRoutes = require('./routes/purchasesRoutes');
const paymentsRoutes = require('./routes/paymentsRoutes');
const pqrsRoutes = require('./routes/pqrsRoutes');
const usersRoutes = require('./routes/usersRoutes');
const stagesRoutes = require('./routes/stagesRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Trust proxy (Railway está detrás de proxy) ────────────────
app.set('trust proxy', 1);

// ─── SEGURIDAD ─────────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// ─── RATE LIMITING ─────────────────────────────────────────────
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Demasiadas solicitudes, intente más tarde' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Demasiados intentos de autenticación' }
});

// ─── CORS ──────────────────────────────────────────────────────
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// ─── MIDDLEWARES ───────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// ─── RUTAS API ─────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/lots', apiLimiter, lotsRoutes);
app.use('/api/purchases', apiLimiter, purchasesRoutes);
app.use('/api/payments', apiLimiter, paymentsRoutes);
app.use('/api/pqrs', apiLimiter, pqrsRoutes);
app.use('/api/users', apiLimiter, usersRoutes);
app.use('/api/stages', apiLimiter, stagesRoutes);

// ─── HEALTH CHECK (Railway) ────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
    });
});

// ─── FRONTEND SPA fallback ─────────────────────────────────────
app.get('*', (req, res) => {
    // No reenviar peticiones /api que no existen
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ success: false, message: 'Ruta no encontrada' });
    }
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ─── MANEJO DE ERRORES ─────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        ...(process.env.NODE_ENV !== 'production' && { error: err.message })
    });
});

// ─── INICIAR SERVIDOR ──────────────────────────────────────────
// ─── INICIAR SERVIDOR ──────────────────────────────────────────
app.listen(PORT, '0.0.0.0', async () => {
    console.log('');
    console.log('🏡 ═══════════════════════════════════════════════════');
    console.log('   SISTEMA DE GESTIÓN DE LOTES DE TERRENO');
    console.log(`   Servidor corriendo en puerto: ${PORT}`);
    console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log('═══════════════════════════════════════════════════');

    try {
        await testConnection();
        await verifyEmailConfig();
        console.log('✅ Base de datos y email verificados');
    } catch (error) {
        console.error('⚠️ Error conectando servicios:', error.message);
        console.log('⚠️ El servidor sigue corriendo, pero hay servicios no disponibles');
    }
});

async function ensureAdmin() {
    const [admin] = await pool.query(
        "SELECT id FROM users WHERE email = ?",
        ["admin@lotesystem.com"]
    );

    if (!admin.length) {
        const [roles] = await pool.query(
            "SELECT id FROM roles WHERE nombre = ?",
            ["Administrador"]
        );

        if (!roles.length) return;

        const bcrypt = require('bcrypt');
        const hashed = await bcrypt.hash("Admin123!", 10);

        await pool.query(
            `INSERT INTO users 
            (rol_id, nombre, apellido, email, password_hash, activo)
            VALUES (?, ?, ?, ?, ?, 1)`,
            [roles[0].id, "Administrador", "Sistema", "admin@lotesystem.com", hashed]
        );

        console.log("✅ Admin creado automáticamente");
    }
}

ensureAdmin();

module.exports = app;
