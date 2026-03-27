# PM and Telegram Workflow

## Regla de oro
El Product Owner se comunica con NitroCircus por Telegram.

## Flujo

1. El Product Owner envía instrucción al bot
2. El bot la envía al orquestador
3. El orquestador invoca al PM agent
4. El PM:
   - analiza,
   - aclara internamente,
   - planifica,
   - crea tareas,
   - asigna responsables,
   - deja todo en espera
5. El PM reporta al Product Owner:
   - resumen,
   - alcance,
   - tareas creadas,
   - tareas listas para arrancar

## Activación de desarrollo
El desarrollo **no empieza** cuando el PM termina la planificación.

Solo empieza cuando el Product Owner lo autoriza explícitamente por Telegram.

## Estados sugeridos

- `backlog`
- `planned`
- `assigned`
- `awaiting_start_approval`
- `in_progress`
- `blocked`
- `in_review`
- `done`
- `delivered`

## Comandos sugeridos del bot

- `/new <descripcion>`  
  Registra una nueva iniciativa.

- `/plan <project>`  
  Solicita desglose y planificación.

- `/board <project>`  
  Muestra estado resumido del proyecto.

- `/start <project>`  
  Autoriza inicio de tareas listas.

- `/status <project>`  
  Entrega resumen ejecutivo.

- `/approve <task-id>`  
  Aprueba paso/gate específico.

- `/deliver <project>`  
  Marca proyecto como entregado en carpeta interna.

- `/deploy <project>`  
  Solicita preparación de despliegue bajo demanda.

## Reportes del PM
El PM debe reportar por Telegram:
- inicio autorizado,
- tareas activadas,
- bloqueos,
- PRs abiertos,
- validaciones superadas,
- entrega completada,
- preparación de despliegue iniciada.
