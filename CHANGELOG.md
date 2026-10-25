# Changelog

## 1.3.0 — 2026-10-25
- Registro de otras bebidas: ventana inferior con tipos (agua, té, café, jugo, leche, agua de coco, bebida deportiva, refresco, agua con gas, alcohol, sopa), volumen con teclado numérico y hora editable.
- Las bebidas sin alcohol suman el 100 % de su volumen a la meta; el alcohol se registra pero no suma; la sopa y los caldos se registran como alimento y no suman.
- Lista "Registro de hoy" en Inicio con opción de quitar entradas.

## 1.2.0 — 2026-10-24
- Corregido: al cambiar un dato del perfil no se actualizaban BMR, TDEE ni meta. Desde la v1.1.0 una función del libro (`leer`) reemplazaba por error a la que lee el perfil.
- Nueva imagen principal: botella blanca sobre fondo azul con marcadores de lo consumido y de la meta prevista a la hora actual, mensaje de ánimo y panel "Faltan / Meta".
- Aviso en Alarmas cuando se usa un plan personalizado (la meta cambia pero las tomas no hasta restablecer).

## 1.1.1 — 2026-10-23
- Portada del libro: corregido el diseño que se mostraba en columnas y cortaba el texto; ahora es una portada centrada con icono y adorno.

## 1.1.0 — 2026-10-22
- Consejos de hidratación aleatorios entre tomas (aviso en la app, notificación y eventos en el `.ics`), con frecuencia configurable.
- Libro didáctico "Beneficios de hidratarte" con índice, páginas, progreso y deslizamiento; tarjeta diaria en Inicio y enlaces desde cada consejo.
- Contenido en `data/*.json`; matices de redacción en afirmaciones con evidencia limitada (originales en `docs/fuentes-originales/`).

## 1.0.1 — 2026-10-21
- Los botones de registro (+250, +300, Otro, Deshacer, Reiniciar) pasan a una barra de acciones con el estilo de la barra inferior.
- Se añade la licencia MIT.

## 1.0.0 — 2026-10-21
- Primera versión oficial: el prototipo v0.3 pasa a proyecto de varios archivos (`index.html`, `css/styles.css`, `js/app.js`).
- PWA: manifiesto, iconos, Service Worker (funciona sin conexión) y botón "Instalar app".
- Configuración de Vercel con cabeceras de seguridad (CSP, nosniff, etc.).

## Prototipos (no publicados)
- v0.1: reescritura de AQUANÖMIC como HidraMetric; meta basada en EFSA 2010 y Mifflin–St Jeor.
- v0.2: secciones desplegables y botón Reiniciar corregido; alarmas con editor de horarios y exportación `.ics`.
- v0.3: nueva interfaz (vaso animado, barra superior e inferior, menú lateral).
