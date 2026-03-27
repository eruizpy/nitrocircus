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

## ADR-010 - Produccion usa fallback OpenAI-compatible sobre Groq mientras no exista credencial OpenAI nativa
- Decision: en produccion se activa temporalmente el fallback `openai` usando `GROQ_API_KEY` + `OPENAI_BASE_URL=https://api.groq.com/openai/v1` + `OPENAI_MODEL=llama-3.3-70b-versatile`.
- Motivo: hoy no existe `OPENAI_API_KEY` real en el host, pero si existe `GROQ_API_KEY` y el endpoint OpenAI-compatible ya respondio correctamente. Eso permite validar la ruta de fallback sin esperar una nueva credencial.
- Alcance: es una solucion operativa transitoria. Los siguientes limites observados son del proveedor secundario actual: `429` por TPM, posibles patches invalidos y falta de `git user.name/user.email` global en el host para commitear cambios del fallback.

## ADR-011 - Entregar proyecto normaliza tareas a `done`; deploy sigue siendo posterior y opcional
- Decision: al ejecutar `/deliver`, el proyecto pasa a `delivered` y todas sus tareas se normalizan a `done`, sin requerir despliegue previo. La accion `/deploy` permanece disponible solo despues de la entrega y sigue siendo opcional.
- Motivo: el flujo real mostraba proyectos entregados mientras las tareas quedaban mezcladas en `in_review` o `in_progress`, generando contradiccion entre el estado del proyecto, el board y el snapshot de entrega.
- Alcance: aplica a la API, a la sincronizacion con GitHub/Projects y a futuros proyectos entregados desde Telegram.

## ADR-012 - La planificacion siempre debe persistir tareas con agente asignado
- Decision: `planProject` normaliza `assignedAgent` en runtime. Si el LLM lo omite o devuelve un valor invalido, NitroCircus infiere `frontend`, `backend` o `devops` por heuristica y nunca persiste una tarea sin agente de ejecucion.
- Motivo: el flujo futuro no debe depender de que el LLM cumpla perfectamente el contrato JSON para que `/start` pueda despachar trabajo.
- Alcance: afecta la persistencia de tareas y la creacion de issues GitHub para todos los proyectos nuevos.

## ADR-013 - La entrega exporta un bundle persistido con ZIP, snapshot base y branches de tarea
- Decision: `/deliver` debe escribir en `projects/<slug>/` un paquete persistido con `<slug>.zip`, documentacion operativa y export de codigo. El bundle usa `main` como snapshot base del repo y agrega exports por branch de tarea; si `githubBranch` no esta persistido, se deriva con la convencion canonica `feat/<project>/<task>`.
- Motivo: la implementacion anterior solo dejaba metadata textual y no cumplia la politica de entrega de codigo listo para extraccion, ejecucion o despliegue posterior. En produccion ademas `projects/` no estaba persistido, por lo que el resultado podia perderse entre recreaciones del contenedor.
- Alcance: el API ahora descarga artefactos desde GitHub, genera `RUNBOOK.md` y `ARTIFACTS.md`, crea el `.zip` final y requiere que `docker-compose.prod.yml` monte `./projects:/app/projects` para persistencia real.

## ADR-014 - Integraciones externas opcionales y runner aislado del checkout productivo
- Decision: ninguna integracion externa nueva debe volver obligatorio el arranque del sistema base. Variables de terceros como WhatsApp deben tratarse como parametros configurables y, si faltan, el sistema debe degradarse a modo deshabilitado o mock en vez de caer. Ademas, el `agent-runner` ya no debe usar `/opt/nitrocircus` como `REPO_PATH`; debe trabajar sobre un checkout aislado (`/opt/nitrocircus-runner`) para no contaminar el arbol productivo.
- Motivo: durante la validacion de `cosito2`, produccion quedo en una branch de agente que agregaba configuracion obligatoria de WhatsApp (`WHATSAPP_API_URL` y otros), provocando reinicios del API y desalineacion con `main`. La causa fue que el runner usaba el mismo checkout productivo para abrir branches y editar archivos.
- Alcance: el workflow de deploy debe reconstruir `/opt/nitrocircus` siempre desde `origin/main`, preparar/actualizar `/opt/nitrocircus-runner` por separado y arrancar PM2 del runner desde ahi. Las futuras integraciones externas deben documentar variables opcionales y modo mock.
