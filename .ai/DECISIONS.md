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

## ADR-008 - GitHub Projects v2 requiere token con scope `project` y configuracion explicita
- Decision: la automatizacion completa de GitHub Projects v2 depende de un `GITHUB_TOKEN` con scope `project`, y la configuracion operativa debe declarar `GITHUB_OWNER`, `GITHUB_REPO` y `GITHUB_PROJECT_NUMBER` sin comentarios inline en el valor.
- Motivo: durante la validacion real se comprobo que el fallback labels-only funcionaba, pero la sincronizacion completa del Project fallaba por dos causas de configuracion: token sin scope `project` y `GITHUB_REPO` malformado por un comentario inline en `.env`.
- Alcance: aplica a produccion, a futuros despliegues y a la documentacion de ejemplo del repositorio.

## ADR-009 - Fallback del runner solo por cuota/auth del proveedor primario
- Decision: el `agent-runner` mantiene `claude` como proveedor primario y solo intenta fallback `openai` cuando la falla del primario es clasificable como cuota agotada, auth faltante o configuracion ausente. Dado que el SDK de Claude puede encapsular cuota agotada como `provider_exit`, ese caso tambien habilita fallback cuando el proveedor primario es `claude`. El fallback usa interfaz OpenAI-compatible (`OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`) para permitir tanto OpenAI nativo como proveedores compatibles.
- Motivo: el incidente real de `/start cosito1` no fue una falla de Redis sino `Claude Code` sin cuota (`spending cap reached`). Se necesita evitar stoppers por credenciales/cuota sin ocultar errores estructurales del runner detras de otro proveedor.
- Alcance: no hay fallback para errores genericos de git, patch o infraestructura; esos siguen marcandose como `blocked` con razon explicita. El deploy debe cargar `.env` antes de reiniciar `pm2` para que el runner host reciba estas variables nuevas.
