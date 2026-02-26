-- ============================================================
-- SISTEMA DE GESTIÓN DE VENTA DE LOTES DE TERRENO
-- Script SQL Completo - Base de Datos
-- ============================================================

CREATE DATABASE IF NOT EXISTS lotes_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lotes_db;

-- ============================================================
-- TABLA: roles
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rol_id INT NOT NULL DEFAULT 2,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    cedula VARCHAR(20) UNIQUE,
    direccion VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    reset_token VARCHAR(255),
    reset_token_expiry DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- ============================================================
-- TABLA: project_stages (Etapas del proyecto)
-- ============================================================
CREATE TABLE IF NOT EXISTS project_stages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    orden INT NOT NULL,
    fecha_inicio DATE,
    fecha_fin DATE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA: lots (Lotes de terreno)
-- ============================================================
CREATE TABLE IF NOT EXISTS lots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    etapa_id INT,
    area DECIMAL(10,2) NOT NULL COMMENT 'Área en m²',
    ubicacion VARCHAR(255) NOT NULL,
    coordenadas VARCHAR(255) COMMENT 'Lat,Lon para mapa',
    valor DECIMAL(15,2) NOT NULL COMMENT 'Valor total del lote',
    valor_cuota DECIMAL(15,2) COMMENT 'Valor por cuota mensual',
    num_cuotas INT DEFAULT 12 COMMENT 'Número de cuotas pactadas',
    estado ENUM('Disponible','Reservado','Vendido') DEFAULT 'Disponible',
    descripcion TEXT,
    imagen_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (etapa_id) REFERENCES project_stages(id)
);

-- ============================================================
-- TABLA: purchases (Compras)
-- ============================================================
CREATE TABLE IF NOT EXISTS purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    lote_id INT NOT NULL,
    fecha_compra DATE NOT NULL DEFAULT (CURRENT_DATE),
    valor_total DECIMAL(15,2) NOT NULL,
    num_cuotas INT NOT NULL DEFAULT 12,
    valor_cuota DECIMAL(15,2) NOT NULL,
    cuotas_pagadas INT DEFAULT 0,
    total_pagado DECIMAL(15,2) DEFAULT 0.00,
    saldo_pendiente DECIMAL(15,2),
    estado ENUM('Activo','Completado','Cancelado') DEFAULT 'Activo',
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES users(id),
    FOREIGN KEY (lote_id) REFERENCES lots(id)
);

-- ============================================================
-- TABLA: payments (Pagos)
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    compra_id INT NOT NULL,
    cliente_id INT NOT NULL,
    numero_cuota INT NOT NULL COMMENT 'Número de cuota pagada',
    monto DECIMAL(15,2) NOT NULL,
    fecha_pago DATE NOT NULL DEFAULT (CURRENT_DATE),
    metodo_pago ENUM('Efectivo','Transferencia','Tarjeta','Cheque') DEFAULT 'Transferencia',
    referencia VARCHAR(100) COMMENT 'Número de referencia del pago',
    comprobante_url VARCHAR(255) COMMENT 'URL del PDF del comprobante',
    correo_enviado BOOLEAN DEFAULT FALSE,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (compra_id) REFERENCES purchases(id),
    FOREIGN KEY (cliente_id) REFERENCES users(id)
);

-- ============================================================
-- TABLA: pqrs (Peticiones, Quejas, Reclamos, Sugerencias)
-- ============================================================
CREATE TABLE IF NOT EXISTS pqrs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    tipo ENUM('Peticion','Queja','Reclamo','Sugerencia') NOT NULL,
    asunto VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    estado ENUM('Pendiente','En proceso','Resuelto') DEFAULT 'Pendiente',
    respuesta TEXT,
    fecha_respuesta DATETIME,
    admin_id INT COMMENT 'Admin que gestionó',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES users(id),
    FOREIGN KEY (admin_id) REFERENCES users(id)
);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Roles
INSERT INTO roles (nombre, descripcion) VALUES
('Administrador', 'Acceso completo al sistema'),
('Cliente', 'Acceso a funciones de cliente');

-- Etapas del proyecto
INSERT INTO project_stages (nombre, descripcion, orden, fecha_inicio, fecha_fin) VALUES
('Lanzamiento', 'Presentación oficial del proyecto habitacional al público', 1, '2024-01-01', '2024-03-31'),
('Preventa', 'Período de venta anticipada con precios especiales', 2, '2024-04-01', '2024-09-30'),
('Construcción', 'Fase activa de construcción de obras de urbanismo', 3, '2024-10-01', '2025-06-30'),
('Entrega', 'Entrega formal de lotes a propietarios', 4, '2025-07-01', '2025-12-31');

-- Admin por defecto (password: Admin123!)
INSERT INTO users (rol_id, nombre, apellido, email, telefono, cedula, password_hash) VALUES
(1, 'Administrador', 'Principal', 'admin@lotesystem.com', '3001234567', '1000000001',
 '$2b$10$rOzJ8KkAqOWEH2lqJI9gPuOXv9BKsmUkSYRBaQeJZqZ6l4c8k6Gx2');

-- Lotes de ejemplo
INSERT INTO lots (codigo, etapa_id, area, ubicacion, valor, valor_cuota, num_cuotas, estado) VALUES
('L-001', 2, 120.00, 'Manzana A, Lote 1', 45000000, 3750000, 12, 'Disponible'),
('L-002', 2, 135.50, 'Manzana A, Lote 2', 50850000, 4237500, 12, 'Disponible'),
('L-003', 2, 150.00, 'Manzana B, Lote 1', 56250000, 4687500, 12, 'Disponible'),
('L-004', 2, 180.75, 'Manzana B, Lote 2', 67781250, 5648438, 12, 'Reservado'),
('L-005', 3, 200.00, 'Manzana C, Lote 1', 75000000, 6250000, 12, 'Disponible'),
('L-006', 3, 110.25, 'Manzana C, Lote 2', 41343750, 3445313, 12, 'Vendido'),
('L-007', 1, 125.00, 'Manzana D, Lote 1', 46875000, 3906250, 12, 'Disponible'),
('L-008', 1, 160.00, 'Manzana D, Lote 2', 60000000, 5000000, 12, 'Disponible');

-- ============================================================
-- TRIGGERS: Actualizar saldo y estado automáticamente
-- ============================================================

DELIMITER $$

CREATE TRIGGER after_payment_insert
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
    UPDATE purchases
    SET 
        total_pagado = total_pagado + NEW.monto,
        cuotas_pagadas = cuotas_pagadas + 1,
        saldo_pendiente = valor_total - (total_pagado + NEW.monto),
        estado = CASE 
            WHEN (cuotas_pagadas + 1) >= num_cuotas THEN 'Completado'
            ELSE 'Activo'
        END
    WHERE id = NEW.compra_id;
END$$

CREATE TRIGGER before_purchase_insert
BEFORE INSERT ON purchases
FOR EACH ROW
BEGIN
    SET NEW.saldo_pendiente = NEW.valor_total;
END$$

DELIMITER ;
