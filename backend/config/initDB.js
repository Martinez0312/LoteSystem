// backend/config/initDB.js
// Script para inicializar la base de datos en Railway
// Ejecutar con: npm run init-db
//
// IMPORTANTE: En Railway, ejecutar desde el shell del servicio o
// configurar como Release Command en railway.toml

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

function buildConfig() {
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
    return {
        host:     process.env.MYSQLHOST     || process.env.DB_HOST     || 'localhost',
        port:     parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306'),
        user:     process.env.MYSQLUSER     || process.env.DB_USER     || 'root',
        password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
        database: process.env.MYSQLDATABASE || process.env.DB_NAME     || 'lotes_db',
    };
}

async function initDB() {
    const cfg = buildConfig();
    console.log(`\n🚀 Inicializando base de datos en Railway...`);
    console.log(`📡 Conectando a: ${cfg.host}:${cfg.port} / ${cfg.database}\n`);

    const connection = await mysql.createConnection({
        ...cfg,
        multipleStatements: true,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    try {
        const schemaPath = path.join(__dirname, '../../database/schema.sql');
        let schema = fs.readFileSync(schemaPath, 'utf8');

        // Railway ya provee la base de datos creada.
        // Eliminar CREATE DATABASE y USE para evitar errores de permisos.
        schema = schema
            .split('\n')
            .filter(line => {
                const l = line.trim().toUpperCase();
                return !l.startsWith('CREATE DATABASE') && !l.startsWith('USE ');
            })
            .join('\n');

        console.log('📋 Aplicando schema.sql...');
        await connection.query(schema);

        // Verificar tablas creadas
        const [tables] = await connection.query('SHOW TABLES');
        console.log(`\n✅ Base de datos inicializada. Tablas creadas:`);
        tables.forEach(t => console.log(`   • ${Object.values(t)[0]}`));

        console.log('\n🔑 Credenciales por defecto:');
        console.log('   Email:    admin@lotesystem.com');
        console.log('   Password: Admin123!');
        console.log('\n⚠️  Cambia la contraseña del admin en producción.\n');
    } catch (error) {
        console.error('❌ Error al inicializar base de datos:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

initDB();
