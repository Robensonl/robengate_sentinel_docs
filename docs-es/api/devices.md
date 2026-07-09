# API — Devices (Desde usuarios.md — Referencia)

> ℹ️ La documentación completa de dispositivos se encuentra en [sessions.md](sessions.md), sección "Módulo Dispositivos".

---

## Resumen Rápido

**Base URL:** `/api/devices`  
**Auth mínima:** `viewer`

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/devices` | GET | Todos los dispositivos del usuario actual |
| `/api/devices/mine` | GET | Alias de GET /api/devices |
| `/api/devices/:id/trust` | PATCH | Marcar/desmarcar como de confianza |
| `/api/devices/:id` | DELETE | Eliminar dispositivo |

Ver documentación completa en [sessions.md](sessions.md).
