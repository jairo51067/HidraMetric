---
name: app-hidratacion-trazabilidad
description: Bitácora cronológica de versiones y decisiones de HidraMetric (prototipo v0.1 a v0.3, 21-oct-2026) y paso previsto a GitHub y Vercel.
sources: [chat]
aliases: [bitácora hidrametric, historial hidrametric, trazabilidad hidratación]
---

- [stated] asked to remember: 2026-10-21 v0.1 — partió de repomix_comprimido.txt (Repomix comprimido con pérdida, prototipo AQUANÖMIC); como el código original no era recuperable, se reconstruyó a partir de su documentación y se reescribió como HidraMetric en un único HTML
- [stated] asked to remember: v0.1 — correcciones al original: el reloj mostraba 0 a las 12 PM; se quitó el Service Worker creado con Blob (los navegadores no lo aceptan); se eliminó el consejo sobre "filtración glomerular matutina" por no tener respaldo
- [stated] asked to remember: v0.2 — perfil, plan y base científica pasaron a desplegables con el nivel de hidratación como protagonista; el botón Reiniciar no respondía porque usaba confirm() del navegador y se reemplazó por un modal propio
- [stated] asked to remember: v0.2b — alarmas aprobadas por el usuario: editor de horarios por toma (hora, ml, activar o desactivar, añadir, quitar, restablecer automático), alarma con la app abierta (sonido, vibración, notificación) y exportación .ics con alarma diaria; limitación: sin la app abierta solo suena vía calendario
- [stated] asked to remember: v0.3 — rediseño según captura del usuario: Inicio con vaso animado que se llena, barra superior (menú, título, reloj, tema), barra inferior (Home, Tomas, Alarmas, Perfil, Compartir), menú lateral (incluye Calorías y gasto, Base científica, Acerca de) y compartir con Web Share
- [stated] asked to remember: entregable actual hidrametric.html (~31 KB, un solo archivo); datos guardados en localStorage con clave hidrametric.v2
- [stated] asked to remember: ideas no incluidas aún: historial semanal, rachas, logros, recordatorios por clima, déficit o superávit calórico
- [stated] termina la etapa de prototipo; sigue generar el código oficial listo para GitHub y despliegue en Vercel
- [stated] asked to remember: estructura prevista para esa etapa: index.html, styles.css, app.js, README y manifiesto PWA
