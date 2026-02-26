# Modelo Entidad-Relación - Sistema LoteSystem

## Descripción del ERD

```
┌─────────────┐         ┌──────────────────┐
│    roles    │         │ project_stages   │
├─────────────┤         ├──────────────────┤
│ PK id       │         │ PK id            │
│    nombre   │         │    nombre        │
│    desc.    │         │    descripcion   │
└──────┬──────┘         │    orden         │
       │ 1:N            │    fecha_inicio  │
       │                │    fecha_fin     │
┌──────▼──────────────┐ │    activo        │
│        users        │ └────────┬─────────┘
├─────────────────────┤          │ 1:N
│ PK  id              │          │
│ FK  rol_id→roles    │  ┌───────▼─────────────┐
│     nombre          │  │         lots         │
│     apellido        │  ├──────────────────────┤
│     email (UNIQUE)  │  │ PK  id               │
│     cedula (UNIQUE) │  │ FK  etapa_id→stages  │
│     telefono        │  │     codigo (UNIQUE)  │
│     direccion       │  │     area (100-200m²) │
│     password_hash   │  │     ubicacion        │
│     activo          │  │     valor            │
│     reset_token     │  │     valor_cuota      │
│     reset_token_exp │  │     num_cuotas       │
│     created_at      │  │     estado           │
└──────┬──────────────┘  │       (Disponible/   │
       │ 1:N             │        Reservado/    │
       │                 │        Vendido)       │
       │    ┌────────────┤     descripcion      │
       │    │       1:N  └───────┬──────────────┘
       │    │                   │ 1:N
       │  ┌─▼────────────────── ▼ ──────────────┐
       │  │           purchases                  │
       │  ├─────────────────────────────────────┤
       │  │ PK  id                               │
       │  │ FK  cliente_id → users               │
       │  │ FK  lote_id    → lots                │
       │  │     fecha_compra                     │
       │  │     valor_total                      │
       │  │     num_cuotas                       │
       │  │     valor_cuota                      │
       │  │     cuotas_pagadas                   │
       │  │     total_pagado                     │
       │  │     saldo_pendiente                  │
       │  │     estado (Activo/Completado/Cancel)│
       │  │     notas                            │
       │  └──────────────────┬──────────────────┘
       │                     │ 1:N
       │            ┌────────▼──────────────────┐
       │            │          payments           │
       │            ├────────────────────────────┤
       │            │ PK  id                      │
       │            │ FK  compra_id → purchases   │
       │            │ FK  cliente_id → users      │
       │            │     numero_cuota            │
       │            │     monto                   │
       │            │     fecha_pago              │
       │            │     metodo_pago             │
       │            │     referencia              │
       │            │     comprobante_url         │
       │            │     correo_enviado          │
       │            └────────────────────────────┘
       │
       │  ┌──────────────────────────────────────┐
       └──►              pqrs                     │
          ├──────────────────────────────────────┤
          │ PK  id                                │
          │ FK  cliente_id → users               │
          │ FK  admin_id   → users (nullable)    │
          │     tipo (Peticion/Queja/Reclamo/     │
          │           Sugerencia)                 │
          │     asunto                            │
          │     descripcion                       │
          │     estado (Pendiente/En proceso/     │
          │             Resuelto)                 │
          │     respuesta                         │
          │     fecha_respuesta                   │
          │     created_at                        │
          └──────────────────────────────────────┘
```

## Relaciones

| Tabla origen | Cardinalidad | Tabla destino | Descripción |
|---|---|---|---|
| roles | 1:N | users | Un rol tiene muchos usuarios |
| users | 1:N | purchases | Un cliente hace muchas compras |
| lots | 1:N | purchases | Un lote puede tener una compra (o ser comprado una vez en estado Vendido) |
| purchases | 1:N | payments | Una compra tiene muchos pagos (cuotas) |
| users | 1:N | payments | Un cliente tiene muchos pagos |
| users | 1:N | pqrs | Un cliente envía muchas PQRS |
| users | 1:N | pqrs (admin) | Un admin gestiona muchas PQRS |
| project_stages | 1:N | lots | Una etapa contiene muchos lotes |

## Restricciones de Integridad

- **users.email**: UNIQUE - no puede haber dos usuarios con el mismo correo
- **users.cedula**: UNIQUE - cédula única por usuario
- **lots.codigo**: UNIQUE - código único por lote
- **lots.area**: entre 100 y 200 m² (validación en backend)
- **purchases.estado**: solo 'Activo', 'Completado' o 'Cancelado'
- **lots.estado**: solo 'Disponible', 'Reservado' o 'Vendido'
- **pqrs.estado**: solo 'Pendiente', 'En proceso' o 'Resuelto'
- **payments.metodo_pago**: solo 'Efectivo', 'Transferencia', 'Tarjeta' o 'Cheque'

## Triggers

1. **after_payment_insert**: Al insertar un pago, actualiza automáticamente en `purchases`:
   - total_pagado += monto del pago
   - cuotas_pagadas += 1
   - saldo_pendiente = valor_total - total_pagado
   - estado = 'Completado' si cuotas_pagadas >= num_cuotas

2. **before_purchase_insert**: Al crear una compra, inicializa:
   - saldo_pendiente = valor_total
