# Handoff

## Estado actual
- Rama actual: `main`
- Estado git al iniciar: `main...origin/main`
- Cambio local detectado: `M .github/workflows/sync-github-board.yml`
- Carpeta no trackeada detectada: `.claude/`

## Ultimo avance confirmado
El trabajo mas reciente se concentro en workflows operativos y robustez del sistema:
- `fix(workflows): use set -a to export .env vars to child processes`
- `fix(sync-board): write script to file to avoid bash/YAML dollar-sign escaping`
- `fix(github): await issue creation in planProject to prevent race condition on /start`
- `fix(retry-blocked): escape $in MongoDB operator from bash interpolation`
- `fix(retry-blocked): also re-queue in_progress tasks stuck from silent failures`

## Trabajo en curso al iniciar esta sesion
El archivo `/.github/workflows/sync-github-board.yml` tiene cambios sin commit.

Resumen del cambio local:
- La sincronizacion del GitHub Project board paso a ser opcional.
- Si el token no tiene scope `project`, el workflow sigue sincronizando labels y estado del issue por REST.
- Si la configuracion del Project board esta disponible, tambien mueve la card en Project v2.

## Contradicciones y riesgos
- Faltaban `.ai/PROJECT_MEMORY.md`, `.ai/HANDOFF.md` y `.ai/DECISIONS.md`.
- La documentacion arquitectonica existia, pero la continuidad entre sesiones no estaba formalizada en `.ai/`.
- `.claude/` no parece ser fuente de verdad del proyecto; tratarla como artefacto auxiliar salvo evidencia contraria.

## Lo hecho en esta sesion
- Se reconstruyo el estado del proyecto usando la evidencia real del repo.
- Se identifico la ausencia de la capa `.ai/` como principal riesgo de continuidad.
- Se creo la carpeta `.ai/` con memoria de proyecto, decisiones operativas y este handoff.
- Se ignoro `.claude/` en `.gitignore` para evitar subir artefactos locales de sesiones/agentes.
- Se versionaron los cambios en el commit `0d03d1b` (`ops: persist session continuity and harden board sync`).
- Se hizo push a `main` y el workflow `Deploy NitroCircus` finalizo `success` en GitHub Actions (run `23648857758`).
- Se verifico salud de produccion con `curl http://172.233.163.22:3000/health` y la API respondio `{"status":"ok","mongo":"connected","redis":"connected"}`.
- Se publico el commit `3d521f3` (`docs: update handoff after deploy`) para alinear el repo con el estado real de produccion.
- Se verifico que el deploy posterior tambien termino `success` en GitHub Actions (run `23648977392`).
- Se confirmo la causa del pendiente de `sync-github-board` revisando el run fallido `23647943673`: el token actual de produccion no puede acceder a Project v2 por GraphQL y devolvia `Resource not accessible by personal access token`.
- Se ejecuto manualmente `Sync GitHub Board` (run `23649205156`) sobre el entorno real actual y el workflow nuevo funciono en modo degradado.
- El run `23649205156` emitio los warnings esperados (`Project board unavailable...`, `Will sync issue labels only.`) y sincronizo `5/5` issues sin fallar.
- Se verificaron ejemplos reales en GitHub: `#110` quedo `OPEN` con `status:in_progress` y `#111` quedo `OPEN` con `status:in_review`.
- Se amplio el token local de GitHub CLI con scope `project`.
- Se detecto y corrigio en produccion una configuracion defectuosa en `/opt/nitrocircus/.env`: `GITHUB_REPO` tenia un comentario inline en el valor y faltaba `GITHUB_PROJECT_NUMBER=1`.
- Se actualizo en produccion `GITHUB_TOKEN` al token con scope `project` y se verifico por huella que ya coincide con el token activo de `gh auth token`.
- Se ejecuto nuevamente `Sync GitHub Board` y el run `23651041892` cargo la configuracion del board (`Project board config loaded ✓`) y sincronizo `5/5` tareas sin fallback ni warnings.
- Se limpio el proyecto operativo actual para reiniciar desde cero.
- Los issues activos del proyecto `pruebas1` (`#109` a `#113`) se cerraron con comentario de reinicio operativo.
- Se ejecuto el workflow `Reset Database` (run `23651737728`) y termino `success`.
- Se verifico en ese momento que Mongo quedo vacio: `projects:0`, `tasks:0`, `epics:0`, `agent_runs:0`, `event_logs:0`.
- Durante la prueba E2E del nuevo proyecto `cosito1`, `/new` y `/plan` funcionaron: se creo el proyecto, se generaron issues `#114` a `#122` y se poblo GitHub Projects.
- `/start cosito1` tambien encolo correctamente los agentes, pero todas las tareas terminaron `blocked`.
- Se diagnostico la causa raiz en produccion: `Claude Code` estaba autenticado pero sin cuota (`You've hit your limit / Spending cap reached`), por lo que el proceso salia con codigo `1`.
- Se verifico que Redis no era el bloqueo principal: desde el host respondia `PONG`.
- Se comprobo que produccion no tenia `OPENAI_API_KEY`; solo existia `GROQ_API_KEY`.
- Se implemento en codigo un fallback configurable por proveedor en `workers/agent-runner`: `claude` sigue como primario y solo intenta `openai` cuando la falla es de cuota/auth/configuracion.
- El fallback `openai` usa `chat/completions` con patch unificado y acepta `OPENAI_BASE_URL`, por lo que soporta endpoints OpenAI-compatible.
- Se mejoro la trazabilidad del callback `task.agent_complete` para registrar `provider`, `code`, `message` y `summary` en `event_logs`.
- Se corrigio el workflow de deploy para hacer `source .env` antes de `pm2 restart nitrocircus-agents --update-env`, de modo que el runner host reciba variables nuevas como `OPENAI_*`.
- Se valido operativamente que Groq puede actuar como endpoint OpenAI-compatible: una llamada real a `https://api.groq.com/openai/v1/chat/completions` con `GROQ_API_KEY` devolvio `STATUS=200` y JSON valido.
- Se detecto luego una contradiccion operativa: en los workflows remotos, `source .env` no era portable y el runner seguia sin recibir `OPENAI_*` aunque el deploy terminara `success`.
- Se corrigieron los workflows `deploy`, `retry-blocked`, `sync-github-board` y `db-reset` para usar sintaxis POSIX (`. ./.env`) en lugar de `source .env`.
- En produccion se aplico el restart manual correcto del runner con `. /opt/nitrocircus/.env`, y se verifico en PM2 que `nitrocircus-agents` ya tiene `AGENT_PRIMARY_PROVIDER=claude`, `AGENT_FALLBACK_PROVIDER=openai`, `OPENAI_BASE_URL=https://api.groq.com/openai/v1`, `OPENAI_MODEL=llama-3.3-70b-versatile` y `hasOpenAIKey=true`.

## Estado despues de esta sesion
- La continuidad minima entre sesiones ya queda documentada en `.ai/`.
- No se modifico arquitectura ni codigo de negocio.
- El arbol ya esta preparado para commitear sin incluir `.claude/`.
- Produccion quedo desplegada y saludable con el commit `0d03d1b`.
- El flujo pendiente de `sync-github-board` ya quedo validado contra el token real actual de produccion.
- GitHub Projects v2 ya quedo funcionando de forma automatica en produccion para labels, estado de issues y movimiento de cards del board.
- El sistema operativo se reinicio limpiamente antes de la siguiente prueba E2E.
- Los ultimos issues del proyecto activo quedaron cerrados para evitar arrastrar trabajo viejo al nuevo arranque.
- El nuevo proyecto de prueba `cosito1` existe, esta planificado y sus tareas/issues ya fueron creados.
- Las tareas de `cosito1` quedaron `blocked` por cuota agotada de Claude Code, no por fallo de orquestacion.
- El repo ahora incluye soporte para fallback del runner, pero hasta desplegarlo y cargar `OPENAI_*` en produccion ese fallback aun no esta activo.
- Produccion ya quedo con fallback activable en caliente y el runner host ya tiene las variables cargadas; falta reencolar tareas y validar comportamiento real del fallback.

## Como validar
1. Confirmar presencia de `.ai/PROJECT_MEMORY.md`, `.ai/HANDOFF.md` y `.ai/DECISIONS.md`.
2. Revisar en GitHub Actions que el run `23648857758` de `Deploy NitroCircus` figure como `success`.
3. Ejecutar `curl http://172.233.163.22:3000/health` y confirmar respuesta saludable.
4. Revisar en GitHub Actions que el run `23649205156` de `Sync GitHub Board` figure como `success`.
5. Confirmar en los logs del run `23649205156` que aparezcan los warnings de falta de scope `project` y el resumen `Done: 5/5 synced`.
6. Confirmar en GitHub que issues como `#110` y `#111` conserven labels de estado coherentes (`status:in_progress`, `status:in_review`).
7. Revisar en GitHub Actions que el run `23651041892` de `Sync GitHub Board` figure como `success`.
8. Confirmar en los logs del run `23651041892` que aparezcan `Project board config loaded ✓` y `Done: 5/5 synced`, sin warnings de fallback.
9. Revisar en GitHub Actions que el run `23651737728` de `Reset Database` figure como `success`.
10. Verificar que los issues `#109` a `#113` figuren `CLOSED`.
11. Validacion historica: tras el reset previo, Mongo llego a quedar en `projects:0`, `tasks:0`, `epics:0`, `agent_runs:0`, `event_logs:0`.
12. Ejecutar `npx tsc --noEmit -p workers/agent-runner/tsconfig.json` y `npx tsc --noEmit -p apps/api/tsconfig.json`.
13. Tras desplegar este cambio, confirmar que `pm2` para `nitrocircus-agents` refleje `OPENAI_*` o que los logs del runner muestren fallback explicito cuando Claude quede sin cuota.
14. Para activacion inmediata sin credencial OpenAI nativa, configurar en `/opt/nitrocircus/.env`:
    - `OPENAI_API_KEY=<valor de GROQ_API_KEY>`
    - `OPENAI_BASE_URL=https://api.groq.com/openai/v1`
    - `OPENAI_MODEL=llama-3.3-70b-versatile`
15. Ejecutar el workflow `Retry Blocked Tasks` y verificar que las tareas de `cosito1` se reencolen con el runner actualizado.
16. Si se necesita validacion inmediata antes del siguiente deploy, reiniciar manualmente el runner con `. /opt/nitrocircus/.env` y `pm2 restart nitrocircus-agents --update-env`.

## Siguiente paso recomendado
Desplegar el soporte de fallback, cargar `OPENAI_*` en produccion y ejecutar `Retry Blocked Tasks` para reintentar las tareas de `cosito1` con fallback automatico cuando Claude vuelva a quedar sin cuota.

Como endurecimiento adicional:
- agregar validacion defensiva en `sync-github-board.yml` para reportar errores de API REST/GraphQL con mas contexto cuando falten `labels` o el issue no exista
- considerar una comprobacion de configuracion al inicio del script para fallar rapido si `GITHUB_REPO` incluye espacios o comentarios inline
