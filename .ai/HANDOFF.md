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
- Se verifico en produccion que Mongo quedo vacio: `projects:0`, `tasks:0`, `epics:0`, `agent_runs:0`, `event_logs:0`.

## Estado despues de esta sesion
- La continuidad minima entre sesiones ya queda documentada en `.ai/`.
- No se modifico arquitectura ni codigo de negocio.
- El arbol ya esta preparado para commitear sin incluir `.claude/`.
- Produccion quedo desplegada y saludable con el commit `0d03d1b`.
- El flujo pendiente de `sync-github-board` ya quedo validado contra el token real actual de produccion.
- GitHub Projects v2 ya quedo funcionando de forma automatica en produccion para labels, estado de issues y movimiento de cards del board.
- El sistema operativo quedo reiniciado desde cero: sin proyectos ni tareas activas en la base de datos.
- Los ultimos issues del proyecto activo quedaron cerrados para evitar arrastrar trabajo viejo al nuevo arranque.

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
11. Verificar en produccion que Mongo tenga `projects:0`, `tasks:0`, `epics:0`, `agent_runs:0`, `event_logs:0`.

## Siguiente paso recomendado
Crear el nuevo proyecto desde la interfaz habitual del Product Owner para arrancar un flujo limpio, sin reutilizar tareas anteriores.

Como endurecimiento adicional:
- agregar validacion defensiva en `sync-github-board.yml` para reportar errores de API REST/GraphQL con mas contexto cuando falten `labels` o el issue no exista
- considerar una comprobacion de configuracion al inicio del script para fallar rapido si `GITHUB_REPO` incluye espacios o comentarios inline
