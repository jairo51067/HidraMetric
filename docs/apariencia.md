# Apariencia: tema automático y legibilidad (HidraMetric v1.8.0)

## Tema automático
- **Reglas:** claro entre el amanecer y el atardecer; oscuro el resto. Sin ubicación se usa 6:00 a 18:00.
- **Cálculo:** ecuación del amanecer (mediodía solar medio, ecuación del centro, declinación y ángulo horario), con la ubicación redondeada que guarda el clima. No hay peticiones de red adicionales. Si el caso es polar o la hora cae en otro día local, se usa el horario estándar.
- **Cambio manual:** el botón de la barra superior fija el tema hasta el próximo amanecer o atardecer y luego la app vuelve al ritmo automático. En Perfil → Apariencia, *Claro* u *Oscuro* se mantienen siempre y *Automático* devuelve el ritmo por luz del día.
- **Datos guardados:** `hidrametric.tema.v1` (`modo` y, si hay cambio manual, `forzar` con el tema y la hora de caducidad).
- **Barra del navegador:** `theme-color` pasa a `#0b1329` en oscuro y vuelve a `#0284c7` en claro.

## Verificación del cálculo
Frente a un método NOAA independiente, en 8 ciudades y 4 fechas (equinoccios, solsticios y 4-nov-2026), la mayor diferencia fue de 1,6 minutos (Reikiavik, latitud 64°). Medellín, 4-nov-2026: amanece a las 05:49 y anochece a las 17:42.

## Legibilidad (auditoría automática)
Se midieron 18 pantallas y ventanas emergentes en 320, 360, 390 y 430 px, en claro y oscuro: letras pequeñas, textos montados o fuera de pantalla, textos recortados, desborde horizontal, recuadros y títulos pegados, contraste WCAG AA (muestreando el fondo real bajo cada texto), áreas táctiles y contenido tapado por la barra inferior.

| Categoría | Antes | Después |
|---|---|---|
| Letras de menos de 11 px | 1188 | 0 |
| Recuadros o títulos pegados | 40 | 0 |
| Desborde horizontal de la página | 2 | 0 |
| Textos montados, fuera de pantalla, recortados o tapados | 0 | 0 |
| Contraste por debajo de AA | 261 | 0 reales* |
| Áreas táctiles menores de 32 px | 470 | 1** |

\* El título «HidraMetric» usa texto con degradado y el instrumento no lo puede medir; calculado a mano su peor extremo es 5,4:1 en claro y 8,6:1 en oscuro.
\*\* El texto del clima dentro de la pastilla de la hora mide 57 × 18 px, pero su zona táctil se amplía 10 px por cada lado.

Para repetir la auditoría hay que abrir cada pantalla en las cuatro anchuras y comprobar los mismos puntos; el criterio de contraste es WCAG AA (4,5:1 texto normal, 3:1 texto grande).
