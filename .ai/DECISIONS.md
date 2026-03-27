# Operational Decisions

## Heredadas del repo

### ADR-001 - Telegram como interfaz principal del Product Owner
- Decision: el Product Owner interactua con el sistema por Telegram.
- Evidencia base: `docs/DECISIONS.md`, `README.md`, `CLAUDE.md`.

### ADR-002 - PM separado de agentes tecnicos
- Decision: el PM no implementa codigo.
- Evidencia base: `docs/DECISIONS.md`.

### ADR-003 - GitHub como fuente de verdad del trabajo
- Decision: tareas, PRs y documentacion operativa viven en GitHub y el repo.
- Evidencia base: `docs/DECISIONS.md`, `CLAUDE.md`.

### ADR-004 - Los proyectos terminados se entregan dentro del monorepo
- Decision: los entregables quedan bajo `projects/<name>`.
- Evidencia base: `docs/DECISIONS.md`.

### ADR-005 - Despliegue solo bajo demanda
- Decision: DevOps actua solo con instruccion explicita del Product Owner.
- Evidencia base: `docs/DECISIONS.md`.

### ADR-006 - Miniverse como capa visual
- Decision: Miniverse no es el orquestador central.
- Evidencia base: `docs/DECISIONS.md`.

## ADR-007 - `.ai/` como capa de continuidad operativa entre sesiones
- Decision: `.ai/PROJECT_MEMORY.md`, `.ai/HANDOFF.md` y `.ai/DECISIONS.md` pasan a ser la capa minima de continuidad entre sesiones, sin reemplazar la documentacion arquitectonica existente en `docs/`.
- Motivo: al iniciar esta sesion no existia la estructura `.ai/` requerida por el flujo, lo que obligaba a reconstruir contexto desde archivos dispersos y aumentaba el riesgo de contradicciones entre agentes.
- Alcance: `.ai/` resume estado vivo y handoff operativo; `docs/` mantiene decisiones y documentacion de producto/arquitectura de mas largo plazo.
