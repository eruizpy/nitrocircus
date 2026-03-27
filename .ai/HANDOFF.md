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

## Estado despues de esta sesion
- La continuidad minima entre sesiones ya queda documentada en `.ai/`.
- El siguiente hilo de trabajo sigue siendo el workflow `sync-github-board`.
- No se modifico arquitectura ni codigo de negocio.
- El arbol ya esta preparado para commitear sin incluir `.claude/`.
- Produccion quedo desplegada y saludable con el commit `0d03d1b`.

## Como validar
1. Confirmar presencia de `.ai/PROJECT_MEMORY.md`, `.ai/HANDOFF.md` y `.ai/DECISIONS.md`.
2. Revisar en GitHub Actions que el run `23648857758` de `Deploy NitroCircus` figure como `success`.
3. Ejecutar `curl http://172.233.163.22:3000/health` y confirmar respuesta saludable.
4. Revisar `/.github/workflows/sync-github-board.yml` para confirmar que el fallback a labels-only cuando falta scope `project` siga intacto.

## Siguiente paso recomendado
Ejecutar una prueba manual del workflow `sync-github-board` con un token sin scope `project`, verificando que:
- no falle el job
- se actualicen labels/estado del issue
- se registren warnings claros cuando el Project board no este disponible
