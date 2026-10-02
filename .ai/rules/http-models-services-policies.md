---
paths:
  - 'app/{Http,Models,Services,Policies}/**'
---

# Http Models Services Policies

## Fidelidad por días atendidos y canje
La tarjeta requiere nueve visitas pagadas en días distintos; el siguiente día puede canjear un corte o facial. Solo el barbero asignado completa citas confirmadas después de terminar su duración. LoyaltyService bloquea cliente y cita en una transacción y usa el índice único user_id + loyalty_visit_date; las reservas no suman. El descuento usa el snapshot del pivote y conserva su precio original. Los servicios elegibles se configuran con loyalty_reward_type (haircut/facial), no por coincidencias parciales del nombre.

## Fidelidad por días atendidos y canje
Las citas confirmadas suman automáticamente al acabar starts_at + total_duration. LoyaltyService sincroniza al consultar tarjeta/panel/citas y el comando loyalty:sync-visits está programado cada minuto; pending, proposed, cancelled y citas en curso no suman. Se procesan por fecha e id, con un sello por día y bloqueo de cliente/cita más índice único user_id + loyalty_visit_date. Tras nueve días pagados anteriores, el canje automático descuenta un corte/facial elegible de la cita, escogiendo el de mayor precio del snapshot; conserva cargos extra y snapshots. La finalización manual sigue restringida al barbero asignado.

## Perfiles profesionales y fotos de trabajadores
WorkerPortfolioController publica solo publicWorkerProfile (sin email/teléfono/rol privado). Usuarios worker y admin pueden editar su propio perfil; admin puede editar perfiles de cualquier staff, nunca clientes. Las imágenes JPG/PNG/WebP validadas se guardan en disco public con nombres generados. work_gallery contiene id UUID y path; quitar fotos acepta solo ids del perfil, máximo 12 incluyendo existentes. WorkerPortfolioService conserva archivos al fallar, limpia nuevas subidas si falla la escritura y elimina reemplazados tras guardar.

## Vigencia del registro automático de fidelidad
La versión anterior de Fidelidad por días atendidos y canje que exigía registrar manualmente cada visita queda sustituida por el conteo automático de confirmadas al acabar su duración. Solo la acción manual complete sigue requiriendo al barbero asignado. No volver a limitar el conteo a citas que el barbero haya completado a mano.
