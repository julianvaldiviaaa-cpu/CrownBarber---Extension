---
paths:
  - 'app/{Http,Models,Notifications,Services}/**'
---

# Http Models Notifications Services

## Citas, registro y notificaciones
El registro y los cambios de correo no requieren verificación. Los filtros de citas usan starts_at (hora local de la barbería, APP_TIMEZONE) y se aplican antes de paginar, siempre limitados al cliente o barbero autenticado. Los avisos guardan una instantánea del evento: database usa conexión sync y WebPush se entrega mediante la cola. No regenerar claves VAPID existentes: invalidaría suscripciones.
