# Historial, sonidos de logro y presentación (HidraMetric v1.7.0)

## Criterios de éxito
- **Rendimiento:** cambiar de periodo (consulta + dibujo) por debajo de 100 ms con 800 días de datos; la presentación no retrasa el arranque.
- **Memoria:** la pantalla solo mantiene el periodo visible (máximo 31 resúmenes diarios o las tomas de un día); sin cachés de historial.
- **Consistencia:** las cifras del historial coinciden con el almacén y con Inicio; se actualiza al registrar o quitar tomas (también desde otra pestaña); cada sonido suena una vez al día.
- **Móvil:** sin desbordamiento horizontal entre 320 y 430 px; objetivos táctiles de 44 px (navegación y pestañas) y de al menos 42 px en las celdas del calendario a 390 px; respeta «reducir movimiento».
- **Estructura fija de la pantalla:** Selector de periodo (Día, Semana, Mes y navegación), Resumen, Gráfico (anillo, barras con meta o calendario), Desglose por bebida y Detalle.
- **Cero errores:** sin errores de consola ni de política de seguridad.

## Almacenamiento
Sin cambios de esquema ni migración nueva. El historial usa las consultas existentes (`ALM.dia`, `ALM.tomasDe`, `ALM.semana`, `ALM.mes`). Las banderas de sonido del día (`snd`) viven dentro del estado ligero ya existente en localStorage (si faltan se asumen vacías); la preferencia de sonido usa la clave `hidrametric.snd.v1`.

## Reglas
- **Sonido:** «primera» suena en la primera toma del día que suma a la meta (alcohol y sopa no cuentan); «meta» suena al cruzar la meta. Si ambas coinciden suena solo «meta». Cada una una vez al día; **Reiniciar** restablece las banderas.
- **Meses archivados** (más de 24 meses): solo total, días con registro, cumplidos y desglose; no hay calendario ni detalle diario.
- **Tomas** de más de 90 días: solo resumen del día.
- **Presentación:** una vez por sesión del navegador; se salta con un toque; con «reducir movimiento» se muestra fija durante menos de un segundo.
