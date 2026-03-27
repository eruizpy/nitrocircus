# Ordered Backlog

## Epic 1 — Base del repositorio
### T1
Crear estructura documental base del proyecto.

**Aceptación**
- existe `README.md`
- existe `docs/`
- existe `projects/.gitkeep`

### T2
Definir modelo de directorios del monorepo.

**Aceptación**
- estructura documentada
- ownership por áreas documentado

---

## Epic 2 — Orchestrator core
### T3
Diseñar el modelo de entidades: Project, Epic, Task, AgentRun, EventLog.

### T4
Diseñar máquina de estados de tareas y proyectos.

### T5
Definir contratos internos para comandos del PM.

### T6
Diseñar API interna del orquestador.

---

## Epic 3 — Telegram interface
### T7
Definir comandos del bot Telegram.

### T8
Diseñar webhook receiver.

### T9
Diseñar traducción mensaje Telegram → comando del PM.

### T10
Diseñar formato de reportes ejecutivos para el Product Owner.

---

## Epic 4 — PM Agent
### T11
Definir prompt del PM agent.

### T12
Diseñar plantilla para descomposición de trabajo.

### T13
Diseñar formato estándar de task card.

### T14
Implementar regla `awaiting_start_approval`.

---

## Epic 5 — GitHub operating model
### T15
Definir labels, branches y convención de PR.

### T16
Definir sincronización issue ↔ task.

### T17
Definir GitHub Project board.

---

## Epic 6 — Frontend agent
### T18
Definir prompt y restricciones del Frontend Agent.

### T19
Definir ownership de rutas frontend.

### T20
Definir formato de entrega técnica frontend.

---

## Epic 7 — Backend agent
### T21
Definir prompt y restricciones del Backend Agent.

### T22
Definir ownership backend.

### T23
Definir contratos de Redis/MongoDB.

---

## Epic 8 — DevOps agent
### T24
Definir prompt y restricciones del DevOps Agent.

### T25
Definir política de entrega en `/projects/<name>`.

### T26
Definir flujo de preparación de despliegue bajo demanda.

### T27
Definir solicitud obligatoria de IP, usuario y método de autenticación.

---

## Epic 9 — Security & governance
### T28
Definir manejo de secretos.

### T29
Definir auditoría de eventos.

### T30
Definir controles de aprobación humana.

---

## Epic 10 — Miniverse
### T31
Definir eventos visibles en Miniverse.

### T32
Diseñar adapter del orquestador a Miniverse.

### T33
Definir qué datos jamás se publican visualmente.

---

## Epic 11 — Entrega y sincronización local
### T34
Automatizar el versionado del bundle en `/projects/<name>` al entregar un proyecto y dejar lista la sincronización del checkout local del operador.

**Aceptación**
- al ejecutar `/deliver`, el bundle final queda actualizado dentro de `/projects/<name>/`
- el bundle queda preparado para versionarse en Git sin pasos manuales ambiguos
- la documentación operativa deja explícito que el checkout local del equipo requiere `git pull` o un agente local para reflejar el cambio automáticamente
- la ausencia de una sincronización local automática no bloquea la entrega ni el deploy bajo demanda

---

## Orden recomendado de ejecución
1. T1–T2
2. T3–T6
3. T7–T10
4. T11–T17
5. T24–T30
6. T18–T23
7. T31–T33
