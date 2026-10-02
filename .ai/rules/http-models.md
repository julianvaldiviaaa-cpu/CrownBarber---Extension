---
paths:
  - 'app/{Http,Models}/**'
---

# Http Models

## Sucursales y reservas existentes
Los usuarios worker y admin pueden atender citas y pertenecen a una sucursal; al reservar, el barbero y cada servicio deben estar disponibles en la sucursal elegida. Guardar branch_id en la cita conserva su sede histórica. No mover un barbero con citas futuras pendientes, propuestas o confirmadas a otra sucursal. La migración inicial asigna los datos anteriores a Sucursal principal.
