# HidraMetric

Planificador de hidratación basado en evidencia: calcula la meta diaria de bebida, reparte las tomas durante el día, registra el consumo con un vaso animado y avisa con alarmas. Sitio estático (HTML, CSS y JavaScript sin dependencias ni paso de compilación). Los datos se guardan solo en el dispositivo (`localStorage`).

## Estructura
```
index.html              Interfaz (vistas, menú, barra inferior)
css/styles.css          Estilos (tema claro y oscuro)
js/app.js               Lógica: cálculos, plan, alarmas, .ics, navegación, PWA
js/libro.js             Libro didáctico de beneficios (lectura por páginas, progreso)
js/avisos.js            Consejos aleatorios entre tomas (aviso, notificación, .ics)
data/                   Contenido editable: beneficios y consejos (JSON)
sw.js                   Service Worker (sin conexión)
manifest.webmanifest    Metadatos de instalación
icons/                  Iconos (SVG y PNG, incluido maskable)
vercel.json             Cabeceras de seguridad y caché
docs/memoria-prototipo  Trazabilidad del prototipo y base científica
docs/fuentes-originales JSON originales, antes de los ajustes de redacción
```

## Ejecutar en local
Los Service Workers requieren `http://`, no `file://`:
```bash
python3 -m http.server 8080   # abre http://localhost:8080
```

## Publicar en GitHub y Vercel
```bash
git init && git add . && git commit -m "HidraMetric v1.1.0"
git branch -M main
git remote add origin https://github.com/<usuario>/hidrametric.git
git push -u origin main
```
En Vercel: **Add New → Project →** importar el repositorio. *Framework Preset:* **Other**, sin *Build Command* ni *Output Directory* (raíz del proyecto). Cada `git push` a `main` despliega de nuevo. Al cambiar archivos de la app, incrementa `V` en `sw.js` para renovar la caché de los usuarios.

## Instalación en el celular
- **Android (Chrome):** menú lateral → *Instalar app*.
- **iPhone (Safari):** Compartir → *Añadir a pantalla de inicio*.

## Identidad y estimación de calorías
En **Perfil** se puede indicar un nombre o seudónimo y elegir un avatar o subir una foto (se recorta y reduce a 160 px en el propio dispositivo; no se envía a ningún servidor). El nombre aparece en el saludo de Inicio, en el menú lateral y en los mensajes de ánimo de la botella. **Calorías y gasto** muestra con qué datos del perfil se calcula cada cifra (BMR de Mifflin–St Jeor, TDEE por factor de actividad) y cómo se llega a la meta de líquidos.

## Registro de bebidas
Botón **Bebidas** de Inicio: elige el tipo, el volumen (teclado o atajos 150/250/330/500 ml) y la hora (hoy, no futura). Las bebidas sin alcohol suman el 100 % del volumen a la meta, porque la ingesta adecuada de EFSA es de agua total (bebidas de todo tipo y humedad de los alimentos). El alcohol se registra pero no suma; la sopa y los caldos se registran como alimento y no suman, porque su agua ya está en el ~20 % que se atribuye a los alimentos. Los registros anteriores sin tipo se tratan como agua.

## Consejos y libro de beneficios
- **Consejos:** mensajes breves de `data/notificaciones_hidratacion.json`, al azar y sin repetirse hasta haber salido todos. Se programan en el punto medio entre tomas consecutivas, dentro del horario de despertar y dormir y nunca después de la última toma. Frecuencia: desactivados, 3 al día (por defecto) o uno entre cada toma.
- **Cómo llegan:** con la app abierta, como aviso discreto con enlace al libro; en segundo plano, como notificación del sistema si se concede el permiso; y por calendario, porque el `.ics` puede incluir 14 días de consejos. No son notificaciones push de servidor: con la app cerrada el navegador no garantiza su entrega.
- **Libro:** *Beneficios de hidratarte* (menú lateral) presenta `data/beneficios_hidratacion.json` como libro de lectura por páginas, con índice, progreso y continuar donde se dejó. Para llevar al usuario hasta allí: tarjeta "Sabías que…" diaria en Inicio, etiqueta NUEVO en el menú y enlace "Leer más" en cada consejo.
- **Editar contenido:** basta cambiar los JSON de `data/`. En `docs/fuentes-originales/` quedan los textos originales; en los de `data/` se matizó la redacción de afirmaciones con evidencia limitada o mecanismos solo hipotéticos.

## Alarmas: qué pueden y qué no
La alarma dentro de la app (sonido, vibración y notificación) solo funciona con la página abierta. Para avisos con el teléfono bloqueado, usa *Exportar alarmas al calendario (.ics)*. Las notificaciones con la app cerrada requerirían Web Push con un servidor, que esta versión estática no incluye.

## Base científica
- Meta de agua: máximo entre la ingesta adecuada de agua total de EFSA 2010 (2,5 L hombres, 2,0 L mujeres) y 1 ml por kcal de gasto; ≈80 % proviene de bebidas.
- BMR: Mifflin–St Jeor (Am J Clin Nutr 1990;51:241-7). TDEE: factores de actividad 1,2 a 1,725.
- Ajustes: +300 ml embarazo, +700 ml lactancia, +500 ml calor (este último es una estimación prudente, no un valor normativo).

**Estado de verificación:** los valores de EFSA se contrastaron con la fuente oficial; las demás referencias fueron revisadas y aceptadas por el autor del proyecto. Ver `docs/memoria-prototipo/`.

## Aviso
Herramienta informativa para adultos sanos de 18 años o más; no sustituye el consejo médico. Con enfermedad renal, cardíaca o hepática, o tratamientos que alteren el equilibrio de líquidos, sigue las indicaciones de tu médico.

## Licencia
[MIT](LICENSE).
