# 🏡 Sistema de Gestión de Venta de Lotes de Terreno

Sistema web completo para administrar la venta de lotes de terreno: clientes, compras, pagos en cuotas, PQRS y reportes PDF.

## 🚀 Deploy en Railway

### 1. Preparar el repositorio
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/lote-system.git
git push -u origin main
```

### 2. Deploy en Railway
1. Ir a [railway.app](https://railway.app) → New Project → Deploy from GitHub Repo
2. Seleccionar el repositorio
3. Agregar plugin **MySQL** desde el dashboard de Railway
4. Configurar las variables de entorno (ver abajo)
5. Railway despliega automáticamente

### 3. Variables de entorno requeridas en Railway

| Variable | Descripción |
|----------|-------------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Secreto seguro (mínimo 32 caracteres) |
| `JWT_EXPIRES_IN` | `24h` |
| `EMAIL_USER` | Correo Gmail |
| `EMAIL_PASS` | App Password de Gmail |
| `FRONTEND_URL` | URL pública del deploy (ej: `https://tu-app.railway.app`) |

> **Las variables `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE` son inyectadas automáticamente por el plugin MySQL de Railway.**

### 4. Inicializar la base de datos
Una vez desplegado, ejecutar desde el shell de Railway:
```bash
npm run init-db
```

---

## 💻 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales locales

# Inicializar BD local (MySQL debe estar corriendo)
npm run init-db

# Iniciar servidor de desarrollo
npm run dev
```

Accede en: http://localhost:3000

**Credenciales de prueba:**
- Admin: `admin@lotesystem.com` / `Admin123!`

---

## 📁 Estructura del Proyecto

```
/
├── backend/
│   ├── config/        # DB, email, initDB
│   ├── controllers/   # Lógica de negocio
│   ├── middleware/    # Auth JWT, validaciones
│   ├── routes/        # Definición de rutas API
│   └── utils/         # Generador de PDF
├── frontend/
│   ├── pages/         # HTML de cada sección
│   ├── css/           # Estilos
│   └── js/            # api.js (cliente API)
├── database/
│   └── schema.sql     # Estructura + datos iniciales
├── .env.example       # Plantilla de variables
├── package.json
└── railway.toml       # Configuración Railway
```

## 🔌 API Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Login (devuelve JWT) |
| GET | `/api/lots` | Listar lotes (con filtros) |
| POST | `/api/purchases` | Comprar lote |
| POST | `/api/payments` | Registrar pago cuota |
| GET | `/api/payments/:id/receipt` | Descargar PDF |
| POST | `/api/pqrs` | Enviar PQRS |
| GET | `/health` | Health check |
