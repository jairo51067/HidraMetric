# Almacenamiento local del historial (HidraMetric v1.6.0)

## Decisión
**IndexedDB como fuente de verdad del historial**, con **localStorage solo para configuración pequeña** (perfil, tema, plan de tomas, banderas) y como **respaldo automático** si IndexedDB no está disponible. Código: `js/almacen.js` (sin dependencias). Integración: `js/datos.js`.

## Alternativas evaluadas
| Opción | Límites conocidos | Veredicto |
|---|---|---|
| localStorage (una clave con todo) | Síncrono: bloquea el hilo; solo cadenas; cuota típica de unos 5 MB por origen; reescribe todo el valor en cada toma; sin transacciones ni índices | Válido para ajustes, no para historial |
| localStorage (una clave por día) | Evita reescribir todo, pero sin escritura atómica entre claves, sin consultas por rango (hay que recorrer claves), condiciones de carrera entre pestañas | Solo como respaldo |
| **IndexedDB** | Asíncrono; API verbosa; el navegador puede borrar datos del sitio bajo presión de espacio si no es «persistente»; Safari puede limpiar datos de sitios sin uso (no de apps instaladas en pantalla de inicio); cuota variable según dispositivo | **Elegida**: transacciones atómicas, índices, rangos de claves, cuota amplia, funciona también en Service Worker |
| OPFS / SQLite WASM | Descarga de ~1 MB o más, complejidad y soporte desigual en móviles | Excesivo para ~100 bytes por toma |
| Cache API, cookies, WebSQL | No son para datos de usuario / limitadas / obsoleta | Descartadas |

## Esquema (base `hidrametric`, versión 1)
- `tomas` (clave `id`, índice `d`): `{id, t, d, ml, tipo, c}`. `t` = milisegundos UTC; `d` = fecha local `YYYY-MM-DD` fijada al registrar (así el día no cambia si cambia la zona horaria); `c` = 1 si suma a la meta (copia de la regla vigente al registrar).
- `dias` (clave `d`): `{d, ml, n, meta, porTipo:{tipo:ml}, v}`. `ml` suma solo lo que cuenta; `meta` es la meta de ese día.
- `meses` (clave `m`, `YYYY-MM`): `{m, ml, dias, cumplidos, porTipo, v}`.
- `meta` (clave `k`): marcas internas (`lastCompact`, sonda de escritura).
- localStorage: `hidrametric.v2` (perfil, plan, tema, `log` ligero con la fecha y las alarmas ya disparadas), `hidrametric.id.v1`, `hidrametric.libro.v1`, `hidrametric.tips.v1`, `hidrametric.clima.v1`; `hm.fb.v1` solo en modo de respaldo.

Las fechas ISO se ordenan igual como texto que en el calendario, por lo que semana y mes son consultas por rango de claves sobre `dias` (máximo 7 o 31 registros pequeños; nunca se carga el historial completo).

## Consistencia
- **Una transacción por escritura** sobre `tomas` y `dias`: o se guardan las dos o ninguna (probado forzando un fallo a mitad).
- Escritura con `durability: 'strict'` donde el navegador lo admite.
- **Idempotencia**: el `id` se genera antes de escribir y se usa `put`; reintentar o reimportar no duplica.
- **Resumen autorreparable**: el resumen del día siempre se recalcula desde las tomas del día (no se suma de forma incremental). `verificar(n)` compara los últimos días y repara; se ejecuta en el mantenimiento.
- **Validación de entrada** (volumen 1–1500 ml, fechas, tipo saneado) también para archivos importados.
- **Varias pestañas**: `BroadcastChannel` avisa de los cambios; la conexión se cierra ante un `versionchange` y se reabre al necesitarla.
- **Sin cuota o sin IndexedDB**: aviso al usuario; en el segundo caso, modo de respaldo en localStorage con la misma interfaz.

## Retención
Tomas **90 días** → resumen diario **24 meses** → resumen mensual **sin límite**. `compactar()` (cada 7 días, en segundo plano) comprueba que el resumen del día existe antes de borrar sus tomas, y procesa por días completos en transacciones acotadas. Un mes solo pasa a `meses` cuando termina por completo antes del corte. Un mes archivado conserva total, días con datos, días cumplidos y desglose por tipo, pero no el detalle diario. Se solicita almacenamiento persistente cuando hay 7 o más días de datos.

## Consultas
`ALM.tomasDe(d)`, `ALM.dia(d)`, `ALM.semana(d)` (lunes a domingo), `ALM.mes('YYYY-MM')`.

## Migración
- **De formato anterior (v1.5 o anterior)**: el `log` del día guardado en localStorage se copia al almacén con ids deterministas (`L<t>-<ml>-<tipo>`); repetir la migración no duplica. Solo después se elimina de localStorage; si falla, los datos siguen en su lugar.
- **De esquema (versiones futuras)**: subir `VER` en `almacen.js` y añadir `if(old<2){...}` en `migrar()`: crear almacenes o índices, o recorrer registros con un cursor dentro de la misma transacción de actualización. Los datos de la versión anterior se transforman al abrir; si la actualización falla se cancela completa. Los archivos exportados llevan `esquema`; un archivo de una versión más nueva se rechaza.

## Copia de seguridad
Acerca de → Tus datos: exportar a `.json` e importar (fusiona sin duplicar; las tomas anteriores a 90 días no se importan, sí sus resúmenes).
