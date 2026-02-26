# 📘 Manual de Usuario - Sistema LoteSystem

## Sistema Web de Gestión de Venta de Lotes de Terreno

---

## 1. Acceso al Sistema

### 1.1 Registro de nuevo cliente
1. Accede a la página principal en la URL del sistema
2. Haz clic en **"Registrarse"**
3. Completa el formulario:
   - Nombre y apellido
   - Correo electrónico (será tu usuario)
   - Cédula y teléfono (opcionales pero recomendados)
   - Contraseña (mínimo 8 caracteres, debe incluir mayúsculas, minúsculas y números)
4. Acepta los términos y condiciones
5. Haz clic en **"Crear Cuenta"**

### 1.2 Inicio de sesión
1. Ve a la página de login
2. Ingresa tu correo electrónico y contraseña
3. Haz clic en **"Iniciar Sesión"**
4. Serás redirigido a tu dashboard

### 1.3 Recuperar contraseña
1. En la pantalla de login, haz clic en **"¿Olvidaste tu contraseña?"**
2. Ingresa tu correo electrónico
3. Recibirás un email con un enlace para restablecer tu contraseña
4. El enlace es válido por 1 hora

---

## 2. Para Clientes

### 2.1 Ver lotes disponibles
1. Desde el menú principal, haz clic en **"Lotes"**
2. Usa los filtros para buscar por:
   - Estado (Disponible / Reservado / Vendido)
   - Área mínima y máxima (en m²)
   - Valor máximo
3. Haz clic en un lote para ver su detalle completo

### 2.2 Comprar un lote
1. Encuentra un lote disponible en la página de lotes
2. Haz clic en **"Ver Detalle"** o directamente en **"Adquirir"**
3. En el modal de detalle, verifica:
   - Código del lote
   - Área en m²
   - Ubicación
   - Valor total y cuota mensual
4. Haz clic en **"Adquirir Lote"**
5. Confirma la compra en el diálogo de confirmación
6. El lote quedará registrado en tu cuenta y el estado cambiará a "Vendido"

### 2.3 Registrar un pago
1. Ve a tu **Dashboard** → **"Registrar Pago"** (menú lateral)
2. Selecciona la compra a la que quieres abonar
3. Verás el resumen: total, pagado, pendiente y número de cuota
4. Completa los datos del pago:
   - Monto
   - Fecha de pago
   - Método de pago (Transferencia, Efectivo, Tarjeta, Cheque)
   - Número de referencia (opcional)
5. Haz clic en **"Registrar Pago y Enviar Comprobante"**
6. Automáticamente recibirás un correo con el comprobante PDF

### 2.4 Historial de pagos
1. Ve a **Dashboard** → **"Historial de Pagos"**
2. Verás todos tus pagos con fecha, monto y método
3. Para descargar el comprobante PDF de cualquier pago, haz clic en el ícono 📄

### 2.5 Estado de cuenta
1. Ve a **Dashboard** → **"Estado de Cuenta"**
2. Verás:
   - Total de deuda
   - Total pagado
   - Saldo pendiente
   - Detalle por lote con barra de progreso

### 2.6 Enviar PQRS
1. Ve a **Dashboard** → **"PQRS"** o accede desde el menú principal
2. Completa el formulario:
   - Tipo: Petición, Queja, Reclamo o Sugerencia
   - Asunto (máximo 255 caracteres)
   - Descripción detallada
3. Haz clic en **"Enviar PQRS"**
4. Podrás hacer seguimiento del estado desde el mismo panel
5. Recibirás respuesta del administrador en la misma sección

### 2.7 Actualizar perfil
1. Ve a **Dashboard** → **"Mi Perfil"**
2. Actualiza los datos que desees (nombre, teléfono, dirección)
3. Haz clic en **"Guardar Cambios"**
> Nota: El email y la cédula no se pueden modificar directamente. Contacta al administrador si necesitas cambiarlos.

---

## 3. Para Administradores

### 3.1 Panel de control
Al ingresar como administrador, verás:
- Total de clientes registrados
- Lotes disponibles
- Número de compras
- Total recaudado
- PQRS pendientes
- Pagos recientes
- PQRS sin responder

### 3.2 Gestión de lotes
**Crear lote:**
1. Panel Admin → **"Lotes"** → **"Nuevo Lote"**
2. Completa: código, etapa, área (100-200 m²), valor, ubicación, número de cuotas y estado
3. El valor de cuota se calcula automáticamente
4. Haz clic en **"Guardar"**

**Editar lote:**
- Haz clic en el ícono ✏️ en la fila del lote
- Modifica los datos y guarda

**Eliminar lote:**
- Haz clic en el ícono 🗑️
- Solo se pueden eliminar lotes sin compras asociadas

**Cambiar estado:**
- Desde el formulario de edición, cambia el estado entre Disponible / Reservado / Vendido

### 3.3 Gestión de clientes
1. Panel Admin → **"Clientes"**
2. Ver lista de todos los clientes con sus datos
3. **Activar/Desactivar:** Haz clic en el botón de la última columna para cambiar el estado del usuario

### 3.4 Ver compras
1. Panel Admin → **"Compras"**
2. Verás todas las compras con:
   - Cliente, lote, valor total, cuotas, pagado, pendiente y estado

### 3.5 Ver y gestionar pagos
1. Panel Admin → **"Pagos"**
2. Lista completa de todos los pagos con clientes, lotes y montos
3. Descarga comprobante PDF de cualquier pago con el botón 📄

### 3.6 Gestionar PQRS
1. Panel Admin → **"PQRS"**
2. Usa los filtros para ver por estado o tipo
3. **Para responder:** Haz clic en **"Responder"** en la fila de la PQRS
4. En el modal:
   - Lee el detalle de la solicitud
   - Cambia el estado: Pendiente / En proceso / Resuelto
   - Escribe tu respuesta
   - Haz clic en **"Guardar Respuesta"**
5. El cliente podrá ver la respuesta desde su dashboard

### 3.7 Gestionar etapas del proyecto
1. Panel Admin → **"Etapas"**
2. Ver las etapas actuales con número de lotes
3. **Crear etapa:** Haz clic en **"Nueva Etapa"** y completa el formulario
4. **Editar etapa:** Haz clic en **"Editar"** en la tarjeta de la etapa

---

## 4. Comprobante de Pago (PDF)

Al registrar un pago, el sistema genera automáticamente un comprobante PDF que incluye:
- Información del cliente
- Información del lote
- Monto pagado (destacado)
- Número de cuota
- Método de pago y referencia
- Resumen de cuenta (total, pagado, pendiente, progreso)

El comprobante se envía por correo y también está disponible para descarga desde el historial.

---

## 5. Información del Proyecto Habitacional

Accede desde el menú **"Proyecto"** para ver:
- Descripción del urbanismo residencial
- Las 4 etapas del proyecto con fechas y estado
- Lotes disponibles organizados por etapa
- Características: servicios, zonas verdes, vías, seguridad

---

## 6. Soporte

Si tienes dudas o problemas:
1. Usa el sistema PQRS para comunicarte con el equipo
2. Selecciona el tipo apropiado para tu consulta
3. Describe detalladamente tu situación
4. Recibirás respuesta en máximo 15 días hábiles

---

*Manual versión 1.0 | LoteSystem 2024*
