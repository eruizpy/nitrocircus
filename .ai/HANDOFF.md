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
- Se ejecuto `Retry Blocked Tasks` (run `23654149504`) y las 9 tareas de `cosito1` se reencolaron correctamente.
- Los logs del runner mostraron una nueva evidencia: el SDK de Claude en produccion sigue reportando el caso de cuota como `Claude Code process exited with code 1`, es decir `provider_exit`, sin exponer el texto de cuota al clasificador.
- Se ajusto la politica de fallback para que `provider_exit` de `claude` tambien habilite fallback cuando existe proveedor secundario configurado.
- Se desplego ese ajuste final en el commit `630397e` (`fix(runner): fallback on claude provider exit`) y el deploy `23654234713` termino `success`.
- Se ejecuto un segundo `Retry Blocked Tasks` (run `23654320826`) para validar el comportamiento real del fallback ya desplegado.
- Los logs del runner confirmaron la transicion esperada: aparecen mensajes `claude failed ... with provider_exit; trying openai`.
- La validacion end-to-end mostro tres resultados reales:
  - al menos una tarea `devops` (`Crear un Dockerfile`) llego a `in_review`
  - varias tareas cayeron en `openai:quota_exceeded` por TPM del endpoint Groq-compatible
  - una tarea cayo en `openai:patch_apply_failed` por diff invalido
  - al menos un commit del fallback no pudo completarse por falta de `git user.name/user.email` global en el host (`Author identity unknown`)
- Despues se verifico que el host ya tenia identidad global de git (`Esteban RD <eruizpy@gmail.com>`) y se ejecuto un nuevo retry `23654583284`.
- Con ese nuevo retry desaparecio el bloqueo de identidad git y el runner ya consiguio empujar al menos una rama real desde el fallback: `feat/cosito1/crear-una-imagen-docker`.
- El estado operativo mejoro de forma observable:
  - `Crear un Dockerfile` ya estaba llegando a `in_review`
  - `Crear una imagen Docker` llego a `in_review` y se hizo push de rama
  - siguen pendientes tareas frontend/devops afectadas por `openai:quota_exceeded` del endpoint Groq-compatible
- Luego se aplico un tuning del fallback en el commit `55ad70c` (`tune(runner): reduce fallback context footprint`) para bajar consumo de tokens:
  - `OPENAI_CONTEXT_LIMIT` paso a default `25000`
  - `OPENAI_MAX_FILES=6`
  - `OPENAI_FILE_BYTES_LIMIT=12000`
- Ese tuning tambien se escribio explicitamente en `/opt/nitrocircus/.env` y se desplego con el run `23655211741` (`success`).
- Se ejecuto un nuevo retry `23655292185` para medir el impacto del tuning.
- Resultado del retry afinado:
  - se reencolaron `7` tareas
  - el fallback siguio activandose (`claude failed ... trying openai`)
  - dejaron de dominar los errores `openai:quota_exceeded`
  - el cuello principal visible paso a ser `openai:patch_apply_failed` por diffs invalidos/corruptos
- Luego se implemento soporte de fallback por archivos completos en el commit `d19cbbd` (`feat(runner): support file-based fallback edits`), manteniendo `patch` solo como compatibilidad.
- Ese cambio se desplego con el run `23655425829` (`success`) y se valido con un nuevo retry `23655617175`.
- Resultado del retry con `files[]`:
  - se reencolaron `6` tareas frontend restantes
  - el fallback siguio activandose (`claude failed ... trying openai`)
  - ya no se observaron `patch_apply_failed` como señal dominante en los logs inspeccionados
  - el estado en GitHub mejoro de forma fuerte: `#114`, `#115`, `#118`, `#119`, `#120`, `#122` quedaron en `status:in_review`
  - inspeccion posterior confirmo que `#121` (`Configuración de WhatsApp para Contacto`) tambien paso a `status:in_review`
- Evidencia puntual de `#121`:
  - `gh issue view 121` ya devolvio `status:in_review`
  - en logs del runner aparece `Task 69c69cc77910ce6e9ae20380 → in_review`
- Se implemento un ajuste de flujo en la API para que `/deliver` normalice todas las tareas del proyecto a `done` antes de pasar el proyecto a `delivered`.
- Con ese cambio, la entrega deja el trabajo aceptado como completado y el deploy sigue siendo una accion separada y opcional ejecutable despues de la entrega.
- Tambien se endurecio `planProject` para que ninguna tarea futura quede sin `assignedAgent`: si el LLM omite o invalida ese campo, NitroCircus infiere `frontend`, `backend` o `devops` por heuristica.

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
- Produccion ya quedo con fallback activable en caliente y el runner host ya tiene las variables cargadas.
- Queda pendiente desplegar el ajuste final que interpreta `provider_exit` de Claude como candidato a fallback y volver a reencolar las tareas para validacion definitiva.
- La ruta de fallback ya esta validada funcionalmente en produccion: el runner deja de morir solo en `claude` y efectivamente intenta el proveedor secundario.
- Los nuevos cuellos de botella ya no son “sin fallback”, sino capacidad/configuracion del proveedor secundario y del host git.
- El cuello de botella de identidad git del host ya no bloquea el flujo.
- El principal limitante actual es la cuota TPM del proveedor secundario Groq-compatible y, en segundo lugar, la calidad/validez de algunos patches generados por el fallback.
- Tras reducir el contexto del fallback, el principal limitante observable paso a ser la validez de los patches generados por el proveedor secundario.
- Los `429` de Groq no desaparecieron por completo historicamente, pero dejaron de ser la señal dominante en el ultimo retry medido.
- Tras agregar soporte de `files[]`, el flujo de fallback quedo mucho mas robusto y la mayoria del proyecto `cosito1` avanzo a `in_review`.
- El proyecto `cosito1` ya no tiene tareas visibles en `status:blocked` dentro de GitHub issues.
- Queda pendiente desplegar y validar el nuevo flujo de entrega (`/deliver` => tareas `done`) en produccion.

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
17. Confirmar en logs del runner mensajes del tipo `claude failed ... trying openai` para validar que el fallback finalmente se activa.
18. Confirmar que la tarea `Crear un Dockerfile` o su issue asociado haya quedado en `in_review`.
19. Revisar en logs si persisten errores `openai:quota_exceeded`, `openai:patch_apply_failed` o `Author identity unknown`.
20. Confirmar que la rama `feat/cosito1/crear-una-imagen-docker` exista en origin.
21. Revisar el run `23655292185` y confirmar la reduccion de `quota_exceeded` frente a `patch_apply_failed`.
22. Revisar el run `23655617175` y confirmar que `cosito1` completo quedo en `status:in_review`.
23. Tras desplegar este cambio, entregar un proyecto y confirmar que sus tareas pasan a `done` aunque no se ejecute `/deploy`.

## Siguiente paso recomendado
Los siguientes pasos exactos recomendados son:
- configurar `git config --global user.name` y `git config --global user.email` en el host para que el fallback pueda commitear sin warnings
- reducir concurrencia o contexto del fallback para no disparar `429` de Groq TPM
- endurecer el parser/aplicador de patch del fallback para rechazar o reparar diffs invalidos antes de `git apply`
- validar en GitHub que los issues/tareas de `cosito1` ya promovidos a `in_review` tengan labels/board consistentes
- siguiente foco tecnico recomendado: endurecer el contrato de salida del fallback OpenAI-compatible para forzar patches validos o introducir una etapa de saneamiento antes de `git apply`
- siguiente foco operativo recomendado: revisar PRs/ramas generadas y preparar la etapa de aprobacion/revision de las tareas en `in_review`
- siguiente foco operativo recomendado: desplegar este ajuste, validar `/deliver` sobre `cosito1` y confirmar que futuros `/plan` sigan generando tareas con agente asignado siempre

Como endurecimiento adicional:
- agregar validacion defensiva en `sync-github-board.yml` para reportar errores de API REST/GraphQL con mas contexto cuando falten `labels` o el issue no exista
- considerar una comprobacion de configuracion al inicio del script para fallar rapido si `GITHUB_REPO` incluye espacios o comentarios inline
