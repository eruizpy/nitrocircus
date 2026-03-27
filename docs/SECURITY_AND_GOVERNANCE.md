# Security and Governance

## Principios
- mínimo privilegio,
- trazabilidad total,
- separación de responsabilidades,
- aprobación explícita para acciones sensibles,
- no persistir secretos en texto plano.

## Riesgos principales
- agentes con sobreautonomía,
- fuga de secretos,
- inicio de tareas sin aprobación,
- cambios fuera de ownership,
- despliegues prematuros,
- inconsistencias de contexto entre agentes.

## Controles mínimos
- secretos solo en vault o GitHub Secrets,
- PR obligatorio para cambios sensibles,
- aprobación humana para despliegue,
- logs de prompts, acciones y outputs,
- correlación por `project_id` y `task_id`,
- auditoría por agente.

## Gobernanza de agentes
Cada agente debe operar con:
- prompt fijo,
- dominio limitado,
- herramientas permitidas,
- rutas permitidas,
- formato de salida controlado.

## NightCityVerse
No debe mostrar secretos ni datos internos sensibles.  
Usar mundo privado cuando aplique.
