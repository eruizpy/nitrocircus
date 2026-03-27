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

### ADR-006 - NightCityVerse como capa visual
- Decision: NightCityVerse no es el orquestador central.
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

## ADR-015 - Los callbacks del runner al orquestador deben ser observables y reintentables
- Decision: `notifyTaskState` del `agent-runner` debe apuntar explicitamente a `http://127.0.0.1:3000` por defecto, registrar exito/error del callback y reintentar automaticamente antes de dar por perdida una transicion.
- Motivo: durante `cosito2` el runner completo desarrollo y publico ramas, pero las tareas quedaron en `in_progress` porque las transiciones `task.agent_complete` se perdieron sin dejar trazabilidad suficiente. El endpoint `/commands` demostro funcionar manualmente; el punto debil era la entrega silenciosa del callback desde el runner.
- Alcance: aplica a todos los proyectos futuros. Si el callback no persiste, el runner ahora deja evidencia operativa y falla de forma visible en lugar de aparentar exito.

## ADR-016 - Los bundles en `projects/` se versionan tambien en Git
- Decision: los artefactos finales generados en `projects/<slug>/` dejan de considerarse solo persistencia local/produccion y pasan a ser parte versionada del monorepo.
- Motivo: el estado anterior hacia que un proyecto pudiera existir en produccion pero no en el checkout local del equipo, rompiendo continuidad y auditoria del entregable real.
- Alcance: al regenerar o entregar un proyecto, su carpeta en `projects/` debe poder traerse al repo local y commitearse. El despliegue sigue siendo opcional y posterior.

## ADR-017 - La sincronizacion del checkout local no se asume desde produccion
- Decision: el flujo de entrega debe dejar el bundle listo para versionarse en Git, pero no debe asumir que puede actualizar automaticamente el checkout local del operador desde el servidor.
- Motivo: la entrega puede automatizar la generacion y publicacion del bundle, pero la copia efectiva al equipo del usuario requiere `git pull` o un proceso local con permisos sobre esa maquina.
- Alcance: se registra como tarea operativa mejorar la sincronizacion local, pero la falta de ese paso no debe bloquear `done`, `delivered` ni el deploy opcional posterior.

## ADR-018 - `/deliver` publica automaticamente el bundle superior en `main`
- Decision: al entregar un proyecto, NitroCircus debe intentar publicar automaticamente en GitHub el bundle superior de `projects/<slug>/`: `README.md`, `TASKS.md`, `RUNBOOK.md`, `ARTIFACTS.md`, `.env.example`, `DELIVERY.json` y `<slug>.zip`.
- Motivo: esto mantiene el repo central actualizado con el entregable real sin depender de una copia manual posterior desde produccion ni de subir por API miles de archivos internos del snapshot expandido.
- Alcance: la publicacion es best-effort. Si GitHub no esta configurado o falla el update, la entrega sigue completando y el error queda reflejado en `DELIVERY.json` y en eventos del proyecto.

## ADR-019 - La capa visual se consolida como NightCityVerse con editor multi-provider
- Decision: el modulo visual del repositorio pasa a presentarse como `NightCityVerse`. La ruta tecnica `apps/miniverse` y la variable `MINIVERSE_URL` se mantienen temporalmente por compatibilidad, pero el producto visible, el proceso desplegado y la documentacion operativa deben converger a `NightCityVerse`. Su editor visual soporta seleccion runtime de provider entre `anthropic`, `openai` y `ollama`.
- Motivo: habia una migracion incompleta con branding mezclado (`Miniverse` y `NightCityVerse`), un endpoint viejo `/api/claude` y una abstraccion de providers a medio cerrar. Consolidarlo evita deriva de producto y deja la capa visual alineada con el resto del sistema.
- Alcance: el workflow de deploy ya no debe recrear un servicio externo generado por `create-miniverse`; debe desplegar el modulo visual versionado en este repo. La compatibilidad nominal residual (`apps/miniverse`, `MINIVERSE_URL`) se conserva mientras no se haga un rename tecnico mayor.

## ADR-020 - NightCityVerse se separa del ciclo de despliegue principal de NitroCircus
- Decision: NightCityVerse deja de vivir dentro de `apps/miniverse` y pasa a un workspace standalone `nightcityverse/`. NitroCircus conserva solo el adaptador HTTP para emitir eventos visuales. El deploy principal de NitroCircus deja de construir/arrancar NightCityVerse, que ahora tiene workflow propio `deploy-nightcityverse.yml`.
- Motivo: el acoplamiento previo hacia que cambios visuales, nginx y PM2 del mundo pixelado se mezclaran con el despliegue del orquestador. Eso dificultaba operar releases por separado y aumentaba el riesgo de romper una capa no critica durante cambios del core.
- Alcance: `NIGHTCITYVERSE_URL` pasa a ser la variable principal de integracion, con `MINIVERSE_URL` solo como fallback de compatibilidad. La separacion es logica y operativa; el proyecto sigue temporalmente dentro del mismo monorepo hasta que se extraiga a un repo propio si se decide.
