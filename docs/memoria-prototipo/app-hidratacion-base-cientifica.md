---
name: app-hidratacion-base-cientifica
description: Fórmulas, fuentes y supuestos de HidraMetric (EFSA 2010, Mifflin–St Jeor, ritmo máximo de ingesta) y qué falta verificar antes de publicar.
sources: [chat]
aliases: [fórmulas hidrametric, fuentes hidratación, validación científica hidratación]
---

- [stated] pidió que todo se base en datos reales, fórmulas comprobadas y datos científicamente validados
- [stated] asked to remember: meta de bebida en la app = máximo entre la ingesta adecuada de agua total EFSA 2010 (2,5 L hombres, 2,0 L mujeres) y 1 ml por kcal de gasto (TDEE), multiplicado por 0,8 (≈80 % del agua viene de bebidas), más ajustes, redondeado a 50 ml
- [stated] asked to remember: BMR por Mifflin–St Jeor (10·peso + 6,25·estatura − 5·edad, +5 hombres o −161 mujeres); TDEE con factores 1,2 / 1,375 / 1,55 / 1,725
- [stated] asked to remember: ajustes de la app: +300 ml embarazo, +700 ml lactancia, +500 ml ambiente cálido (este último es estimación prudente, no valor normativo)
- [stated] asked to remember: seguridad: solo adultos de 18 a 100 años; aviso al registrar más de 1 L en una hora (capacidad renal orientativa de 0,8 a 1 L/h); alerta de sobrehidratación sobre el 115 % de la meta; texto de que no sustituye consejo médico
- [stated] asked to remember: referencias citadas en la app: EFSA Journal 2010;8(3):1459; Mifflin et al., Am J Clin Nutr 1990;51:241-7; NRC 1989 (1 ml/kcal); IOM 2005; consenso de hiponatremia asociada al ejercicio, Clin J Sport Med 2015
- [stated] asked to remember: estado de verificación: solo los valores de EFSA se contrastaron con búsqueda web; el resto se citó de memoria del asistente y debe validarse antes de publicar la versión oficial
- [stated] 2026-10-21: el usuario confía en las referencias y las considera las ideales; en el README quedan como revisadas y aceptadas por el autor (solo EFSA se contrastó con fuente oficial)
- [stated] asked to remember: 2026-10-25 otras bebidas: los valores de EFSA son de agua total (bebidas de todo tipo y humedad de los alimentos, ≈20 % del total), por eso las bebidas sin alcohol suman el 100 % de su volumen; apoyo: Maughan et al., Am J Clin Nutr 2016 (café, té y otras bebidas habituales no se diferenciaron del agua en la orina producida; hombres jóvenes, 1 L por toma; leche y soluciones de rehidratación retuvieron más); alcohol y sopa se registran pero no suman (decisión de diseño del proyecto, no norma); sin verificar con búsqueda: el alcance exacto de lo que EFSA clasifica como alimento
- [stated] asked to remember: 2026-10-26 la pantalla Calorías y gasto muestra con qué datos del perfil se calcula (sexo, edad, estatura, peso, actividad), la fórmula de Mifflin–St Jeor con los números del usuario, los factores de actividad (convencionales, aproximados) y los cinco pasos de la meta de líquidos
