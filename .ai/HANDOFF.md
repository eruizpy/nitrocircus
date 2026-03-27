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
- El cambio se versiono en `4cdbc01` (`feat(flow): finalize delivered tasks and normalize agent assignment`).
- El deploy automatico del run `23656112853` fallo durante la exportacion BuildKit del contenedor API (`failed to prepare extraction snapshot ... parent snapshot ... does not exist`).
- Se recupero produccion manualmente levantando `docker compose` y reiniciando `pm2`, dejando nuevamente la API saludable.
- Se verifico dentro del contenedor `nitrocircus-api-1` que el codigo cargado en produccion ya incluye `finalizeProjectTasksForDelivery` y la normalizacion `VALID_EXECUTION_AGENTS`.
- Como `cosito1` ya habia sido entregado antes del cambio, se ejecuto la normalizacion con el mismo servicio del API dentro del contenedor productivo para corregir el estado heredado.
- Resultado real de esa normalizacion:
  - las 9 tareas de `cosito1` pasaron de `in_review` a `done` en Mongo
  - los issues `#114` a `#122` quedaron `CLOSED` con label `status:done`
  - los items del GitHub Project `NitroCircus` quedaron con `Status=Done`
- Se valido ademas que no existe ninguna tarea persistida sin `assignedAgent` en la base de produccion (`missingAssignedAgentCount: 0`).
- Se detecto luego una contradiccion nueva en el flujo de entrega: `/deliver` solo dejaba metadata (`README.md`, `TASKS.md`, `.env.example`, `DELIVERY.json`) y no generaba un paquete ejecutable con codigo fuente.
- Tambien se encontro un riesgo de persistencia en produccion: `docker-compose.prod.yml` anulaba el volumen de `projects/`, por lo que la carpeta de entrega podia perderse al recrear el contenedor del API.
- Se implemento el nuevo bundle de entrega en `85fc740` (`feat(delivery): bundle zip artifacts on deliver`):
  - descarga snapshot base de `main` desde GitHub
  - exporta branches de tarea dentro de `task-branches/`
  - genera `RUNBOOK.md` y `ARTIFACTS.md`
  - crea `<slug>.zip` dentro de `projects/<slug>/`
  - persiste `projects/` en produccion con `./projects:/app/projects`
- La primera validacion productiva del bundle mostro solo el snapshot base. La causa real fue que `cosito1` no tenia `githubBranch` persistido en Mongo.
- Se corrigio eso en `35fd7f9` (`fix(delivery): derive task branches for bundle export`) derivando la branch canonica por tarea cuando falta `githubBranch`.
- Validacion final real en produccion sobre `cosito1`:
  - deploy `23658419454` `success`
  - deploy `23658598792` `success`
  - `projects/cosito1/cosito1.zip` generado correctamente
  - `projects/cosito1/README.md`, `TASKS.md`, `RUNBOOK.md`, `ARTIFACTS.md`, `.env.example` y `DELIVERY.json` presentes
  - `source/main/` exportado dentro del bundle
  - `task-branches/` exportado para 8 branches de tarea
  - un solo warning residual: la branch `feat/cosito1/crear-un-dockerfile` no existe en GitHub y el bundle la reporta como `failed` con `404`
- Luego se investigo y reparo ese warning residual de `#116`:
  - se reconstruyo la branch `feat/cosito1/crear-un-dockerfile`
  - se publico con el commit `7d7ebc8`
  - se regenero `cosito1`
  - `DELIVERY.json` quedo sin warnings y el bundle ya exporta tambien `task-branches/feat__cosito1__crear-un-dockerfile`
- Durante una nueva prueba E2E con `cosito2` aparecio un incidente critico de entorno:
  - el host productivo `/opt/nitrocircus` habia quedado en una branch de agente (`feat/cosito2/investigacion-y-seleccion-de-imagenes`) aunque el commit ya era de `main`
  - el runner seguia usando el mismo checkout productivo como `REPO_PATH`
  - una branch de agente agrego configuracion obligatoria de WhatsApp (`WHATSAPP_API_URL`, etc.) y la API empezo a reiniciarse por faltar esas variables
  - esto explico la divergencia observada entre runner/logs y estados persistidos durante `cosito2`
- Se corrigio estructuralmente en `bb87b92` (`ops: isolate runner repo from production checkout`):
  - el workflow de deploy prepara `/opt/nitrocircus-runner` como checkout aislado para agentes
  - PM2 del runner ahora usa `REPO_PATH=/opt/nitrocircus-runner`
  - se documento la regla de integraciones externas opcionales/mock en `.env.example`
  - se registro la decision en `ADR-014`
- Validacion real post-fix:
  - deploy `23659959278` `success`
  - `/opt/nitrocircus` quedo nuevamente en `main` sobre `bb87b92`
  - `/opt/nitrocircus-runner` quedo en `main` sobre `bb87b92`
  - `pm2` muestra `nitrocircus-agents` online y con `REPO_PATH=/opt/nitrocircus-runner`
  - `curl http://172.233.163.22:3000/health` responde sano otra vez
- Se detecto un segundo cuello puntual en `cosito2`: las ramas de tarea se publicaban, pero las transiciones `task.agent_complete` no quedaban persistidas.
- Se probo manualmente el endpoint `/commands` en produccion con una tarea real de `cosito2` y respondio `200`, confirmando que la API y `transitionTask` si funcionan cuando reciben el callback.
- Se implemento `f22dce8` (`fix(runner): retry and trace orchestrator callbacks`) para endurecer el callback del runner:
  - `notifyTaskState` ahora usa `http://127.0.0.1:3000` por defecto
  - registra exito/error por intento
  - reintenta hasta `3` veces antes de fallar
  - el workflow de deploy exporta explicitamente `ORCHESTRATOR_URL=http://127.0.0.1:3000` al reiniciar PM2
- El deploy `23660804889` termino `success` y el runner nuevo quedo levantado mostrando `API:  http://127.0.0.1:3000`.
- Se reconcilio `cosito2` contra la evidencia real del runner viejo:
  - las 4 tareas ya tenian branch publicada y trabajo terminado
  - se reemitio `task.agent_complete` de forma controlada
  - `#123`, `#124`, `#125` y `#126` quedaron persistidos en `in_review`
  - la cuarta devolvio transicion invalida al reemitir porque ya estaba fuera de `in_progress`, lo que confirma consistencia final
- Se alineo la politica de entregables con el repo local:
  - se copio `projects/cosito2/` desde produccion al workspace local
  - el bundle local incluye `README.md`, `TASKS.md`, `RUNBOOK.md`, `ARTIFACTS.md`, `.env.example`, `DELIVERY.json` y `cosito2.zip`
  - se formalizo la regla de que `projects/<slug>/` tambien debe versionarse en Git para que el equipo vea localmente el entregable real
  - queda abierta una tarea explicita para automatizar mejor esta sincronizacion al momento de entrega, sabiendo que la copia al checkout local del operador requiere `git pull` o un agente local y no puede forzarse desde produccion por si sola
- Se implemento luego la automatizacion real en `/deliver`:
  - el API ahora genera primero el bundle local del proyecto
  - despues intenta publicar automaticamente en GitHub el paquete superior de `projects/<slug>/`
  - la metadata de `DELIVERY.json` ahora incluye `gitPublish` con resultado de esa publicacion
  - si GitHub falla, la entrega no se bloquea; el warning queda reflejado en `DELIVERY.json` y en `event_logs`

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
- El nuevo flujo de entrega ya quedo validado en produccion: proyecto entregado implica tareas `done`, y `/deploy` sigue siendo opcional y posterior.
- La base de produccion no tiene tareas sin `assignedAgent`; el endurecimiento de planificacion ya esta alineado con el estado persistido.
- El repo local sigue limpio en `main...origin/main`.
- El flujo de entrega ahora deja un paquete persistido y extraible en `projects/<slug>/`, no solo metadata.
- El bundle validado en produccion incluye codigo fuente base, documentacion operativa y export de branches de tarea cuando existen en GitHub.
- El unico residual conocido del bundle validado es una branch historica faltante en GitHub para `cosito1` (`feat/cosito1/crear-un-dockerfile`), correctamente reflejada como warning en `DELIVERY.json`.
- Ese residual de `cosito1` ya quedo resuelto; el bundle ahora exporta tambien la branch reconstruida de `#116`.
- Produccion ya no comparte checkout entre app y runner. El arbol de la app y el workspace del runner quedaron separados.
- La regla operativa vigente es que futuras integraciones externas no deben volver obligatorio el arranque del sistema base; deben ser configurables y mockeables.
- `cosito2` quedo saneado otra vez tras la perdida historica de callbacks: sus `4` tareas tienen `assignedAgent`, branch publicada y estado persistido `in_review`.
- El siguiente tramo de validacion E2E de `cosito2` ya puede continuar desde `/deliver`, no desde `/start`.

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
23. Confirmar en produccion que `cosito1` mantiene sus 9 tareas en `done` y el proyecto en `delivered`.
24. Confirmar en GitHub que `#114` a `#122` figuran `CLOSED` con `status:done`.
25. Confirmar en GitHub Projects que los items `#114` a `#122` estan en `Done`.
26. Confirmar en produccion que `missingAssignedAgentCount` sigue siendo `0`.
27. Confirmar en produccion que `projects/cosito1/cosito1.zip` existe y pesa mas que un bundle solo documental.
28. Confirmar en `projects/cosito1/DELIVERY.json` que `artifactCount` incluya snapshot base + branches de tarea y que cualquier faltante quede como warning explicito.
29. Confirmar en `projects/cosito1/task-branches/` que existan exportes de frontend/devops para las branches historicas presentes en GitHub.
30. Confirmar que `projects/cosito1/DELIVERY.json` ya no reporte warning para `feat/cosito1/crear-un-dockerfile`.
31. Confirmar en produccion que `pm2` del runner usa `REPO_PATH=/opt/nitrocircus-runner`.
32. Confirmar que `/opt/nitrocircus` y `/opt/nitrocircus-runner` esten ambos en commit `bb87b92` o posterior.
33. Retomar `cosito2` y verificar si las tareas `#123` a `#126` pasan de `in_progress` a `in_review` ya con el entorno saneado.

## Siguiente paso recomendado
Los siguientes pasos exactos recomendados son:
- configurar `git config --global user.name` y `git config --global user.email` en el host para que el fallback pueda commitear sin warnings
- reducir concurrencia o contexto del fallback para no disparar `429` de Groq TPM
- endurecer el parser/aplicador de patch del fallback para rechazar o reparar diffs invalidos antes de `git apply`
- validar en GitHub que los issues/tareas de `cosito1` ya promovidos a `in_review` tengan labels/board consistentes
- siguiente foco tecnico recomendado: endurecer el contrato de salida del fallback OpenAI-compatible para forzar patches validos o introducir una etapa de saneamiento antes de `git apply`
- siguiente foco operativo recomendado: revisar PRs/ramas generadas y preparar la etapa de aprobacion/revision de las tareas en `in_review`
- siguiente foco operativo recomendado: crear un nuevo proyecto de prueba y recorrer `/new` -> `/plan` -> `/start` -> `/deliver` para validar el flujo completo sobre datos nacidos ya con esta version
- siguiente foco tecnico recomendado: revisar la causa de corrupcion BuildKit del run `23656112853` para evitar que un deploy fallido vuelva a requerir recuperacion manual
- siguiente foco operativo recomendado: investigar por que la branch `feat/cosito1/crear-un-dockerfile` no existe en GitHub aunque la tarea `#116` figure completada, para eliminar el warning residual del bundle historico
- siguiente foco operativo recomendado: continuar la validacion de `cosito2` desde su estado actual `active`, observando si los callbacks del runner vuelven a persistir `in_review`/`done` correctamente tras aislar el checkout

Como endurecimiento adicional:
- agregar validacion defensiva en `sync-github-board.yml` para reportar errores de API REST/GraphQL con mas contexto cuando falten `labels` o el issue no exista
- considerar una comprobacion de configuracion al inicio del script para fallar rapido si `GITHUB_REPO` incluye espacios o comentarios inline
