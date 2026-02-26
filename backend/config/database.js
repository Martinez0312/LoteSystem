// backend/config/database.js
// Conexión MySQL optimizada para Railway
// Railway inyecta automáticamente: MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE

const mysql = require('mysql2/promise');

// ── Construir configuración desde variables de entorno ──────────
function buildConfig() {
    // Railway también puede entregar DATABASE_URL en algunos casos
    if (process.env.DATABASE_URL) {
        const url = new URL(process.env.DATABASE_URL);
        return {
            host:     url.hostname,
            port:     parseInt(url.port) || 3306,
            user:     decodeURIComponent(url.username),
            password: decodeURIComponent(url.password),
            database: url.pathname.replace(/^\//, ''),
        };
    }

    // Variables individuales — Railway las inyecta con prefijo MYSQL*
    return {
        host:     process.env.MYSQLHOST     || process.env.DB_HOST     || 'localhost',
        port:     parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306'),
        user:     process.env.MYSQLUSER     || process.env.DB_USER     || 'root',
        password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
        database: process.env.MYSQLDATABASE || process.env.DB_NAME     || 'lotes_db',
    };
}

const dbConfig = {
    ...buildConfig(),
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
    timezone:           '+00:00',
    charset:            'utf8mb4',
    connectTimeout:     20000,
    // SSL requerido por Railway en producción
    ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
};

const pool = mysql.createPool(dbConfig);

// ── Verificar conexión con reintentos ───────────────────────────
const testConnection = async () => {
    const cfg = buildConfig();
    console.log(`🔌 Conectando a MySQL: ${cfg.host}:${cfg.port} / ${cfg.database}`);

    let retries = 5;
    while (retries > 0) {
        try {
            const connection = await pool.getConnection();
            console.log('✅ Conexión a MySQL establecida correctamente');
            connection.release();
            return;
        } catch (error) {
            retries--;
            if (retries === 0) {
                console.error('❌ Error fatal al conectar a MySQL:', error.message);
                console.error('   Verifica las variables de entorno en Railway:');
                console.error('   MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE');
                process.exit(1);
            }
            console.warn(`⚠️  Sin conexión a MySQL. Reintentando en 3s... (${retries} intentos restantes)`);
            await new Promise(r => setTimeout(r, 3000));
        }
    }
};

module.exports = { pool, testConnection };
