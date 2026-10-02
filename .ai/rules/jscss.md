---
paths:
  - 'resources/{js,css}/**'
---

# Jscss

## Watermelon solo en la aplicación interna
Watermelon.tsx adapta componentes del registro MIT y conserva su licencia en Watermelon.LICENSE. Los layouts AppLayout/FormLayout usan watermelon.css bajo wm-app; PublicLayout y las páginas públicas quedan excluidos. Conservar HeroUI para semántica de campos y overlays, NativeButton para no alterar espaciado ni el tipo submit de formularios existentes y animación discreta con prefers-reduced-motion. No añadir Motion o cambiar dependencias para estas adaptaciones CSS.

## Reservas y perfiles profesionales responsivos
WorkerSelection permite ver portafolio y galería sin perder useForm de la reserva. WorkerPortfolioEditor se reutiliza en Equipo y Mi cuenta, envía POST con _method=put a rutas Wayfinder y reduce fotos a WebP antes de subir. El sitio público usa PublicLayout sin Watermelon. wm-reveal usa animation-fill-mode backwards: no retener translate/transform al terminar, porque rompería la barra fija de reserva en móvil.

## Idiomas y scroll global
ApplicationRuntime se monta con withApp en app.tsx: mantiene una sola instancia de Lenis, sincroniza la posición de Inertia y respeta overlays y prefers-reduced-motion. No crear otro Lenis en layouts ni public-motion. Textos de UI usan useTranslation().t y lib/translations.ts; ES/EN se guarda en crown-language (localStorage), sin recargar ni traducir datos escritos por usuarios. Pasar intlLocale a formatos de fecha/moneda para invalidar el memo de React Compiler. PublicLayout revierte SplitText antes de cambiar idioma y recrea animaciones después.
