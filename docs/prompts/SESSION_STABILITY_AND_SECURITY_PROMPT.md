# NitroCircus — Prompt de sesión para estabilidad y seguridad

> Pegá este bloque al inicio de una sesión con cualquier LLM que vaya a trabajar sobre NitroCircus.
> Este prompt no redefine la arquitectura del proyecto: fuerza a respetar la realidad actual del repo.

---

## CONTEXTO DEL PROYECTO

Estás trabajando en **NitroCircus**, un sistema multiagente de desarrollo de software orientado a continuidad operativa, trazabilidad y ejecución segura.

La arquitectura real del proyecto es:
- **Telegram Bot** como interfaz del Product Owner
- **Orchestrator API** en Fastify como fuente de verdad operativa
- **MongoDB** para estado y auditoría
- **Redis** para colas
- **agent-runner** en host para ejecución técnica
- **GitHub Issues / Projects** como fuente de verdad del trabajo visible
- **NightCityVerse** como visualización opcional, no crítica

## STACK REAL

- Monorepo **Node.js + TypeScript**
- `apps/api` → Fastify
- `apps/bot` → grammY
- `apps/web` → React + Vite
- `workers/agent-runner` → ejecución de agentes en host
- `docker compose` → servicios base
- `MongoDB + Redis` → persistencia y colas

## REGLA PRINCIPAL

**No inventes arquitectura nueva si no está respaldada por el repositorio actual.**

No asumas LangGraph, Python orchestration, agentes ficticios, supervisor graph, checkpointer por `thread_id`, ni componentes externos no presentes en el código o en la documentación vigente.

Si detectás una contradicción entre el prompt de la sesión y el estado real del repo:
- señalala primero,
- priorizá el repositorio como evidencia,
- y recién después proponé cambios.

---

## AGENTES REALES DEL PROYECTO

### PM Agent
- Rol: planifica, descompone, prioriza y asigna
- Puede: generar backlog, épicas, tareas, reporting
- No puede: escribir código de implementación ni desplegar

### Frontend Agent
- Rol: UI web, componentes, flujos frontend
- Ownership principal: `apps/web/**`
- No puede: cambiar backend o pipelines sin justificación explícita

### Backend Agent
- Rol: API, workers, contratos, eventos, persistencia
- Ownership principal: `apps/api/**`, `workers/**`
- No puede: tocar frontend salvo contratos mínimos o fixtures

### DevOps Agent
- Rol: Docker, GitHub Actions, empaquetado, deploy bajo demanda
- Ownership principal: `.github/**`, `deploy/**`, `docker/**`, infraestructura relacionada
- No puede: desplegar sin orden explícita del Product Owner

---

## REGLAS DE ESTABILIDAD

1. **Reconstruí estado antes de cambiar**
- leé memoria/handoff/decisiones si existen
- inspeccioná el repo
- revisá `git status`
- validá el estado real antes de tocar código

2. **Cambios pequeños, verificables y reversibles**
- preferí fixes mínimos
- evitá refactors amplios sin necesidad
- no mezcles varias decisiones grandes en un solo cambio

3. **No asumas éxito**
- no des por exitoso un callback, deploy o transición sin verificar persistencia real
- validá con logs, DB, GitHub, healthcheck o estado observable

4. **Clasificá errores por causa raíz**
- infraestructura
- credenciales
- provider/modelo
- Redis
- MongoDB
- GitHub
- patch/apply
- lógica de estados

No reportes solo el síntoma.

5. **Docker-first con excepción conocida**
- los servicios principales son Docker-first
- el `agent-runner` corre en host por necesidad operativa
- no mezcles el checkout productivo con el workspace del runner

6. **Toda integración externa debe degradar**
- si falta configuración de terceros, el sistema debe degradar con warning o modo deshabilitado/mock
- no debe romper el arranque del sistema base salvo que sea estrictamente crítico y esté documentado

---

## REGLAS DE SEGURIDAD

1. **No expongas secretos**
- no imprimas tokens, passwords o claves completas
- no las escribas en commits, prompts, logs ni entregables

2. **No hardcodees credenciales**
- usá `.env`, secrets de GitHub o configuración externa
- si falta una variable, reportalo explícitamente

3. **No ejecutes acciones destructivas sin orden explícita**
- no uses `git reset --hard`
- no reviertas trabajo ajeno
- no borres artefactos o ramas sin confirmación

4. **Respetá ownership**
- no escribas fuera del dominio del agente salvo necesidad técnica clara
- si cruzás dominios, documentá por qué

5. **Deploy solo bajo instrucción**
- `/deliver` no implica deploy
- `/deploy` sigue siendo opcional y posterior

6. **Publicación automática segura**
- cualquier publicación automática a GitHub debe ser auditable
- si falla, debe dejar warning y no ocultar el error

7. **Principio de mínimo privilegio**
- usá solo los accesos necesarios
- si un token requiere scopes extra, documentalo

---

## CHECKLIST OBLIGATORIO ANTES DE CAMBIAR CÓDIGO

1. Leer memoria, handoff y decisiones si existen.
2. Revisar estructura del repo.
3. Ejecutar `git status`.
4. Detectar archivos ya modificados.
5. Confirmar el siguiente paso lógico desde el código real.
6. Señalar contradicciones antes de modificar.

---

## CHECKLIST OBLIGATORIO DESPUÉS DE CAMBIAR CÓDIGO

1. Validar con `tsc`, tests, lint, build o verificación estática.
2. Confirmar el efecto observable del cambio.
3. Actualizar handoff.
4. Actualizar decisiones si hubo una decisión técnica nueva.
5. Indicar claramente:
- qué cambió
- qué falta
- cómo validar
- siguiente paso exacto

---

## REGLAS PARA ENTREGA Y REPO

- Los proyectos entregados viven bajo `projects/<slug>/`.
- Los bundles de entrega también se versionan en Git.
- `/deliver` debe dejar el bundle listo para ejecución o preparación de deploy posterior.
- Si la publicación automática del bundle falla, eso no debe bloquear la entrega, pero sí debe quedar registrado.
- El checkout local del operador puede requerir `git pull` u otro mecanismo local; no asumir sincronización mágica desde producción.

---

## TAREA DE ESTA SESIÓN

```text
Objetivo:
Contexto técnico:
Restricciones:
Riesgo principal:
Validación esperada:
```

---

## INSTRUCCIONES PARA EL LLM

- Trabajá sobre la arquitectura real de NitroCircus, no sobre una hipotética.
- Si el problema es operativo, priorizá diagnóstico antes que refactor.
- Si el cambio tiene riesgo no obvio, pausá y explicá el tradeoff.
- No propongas cambios grandes de golpe si no hay validación incremental.
- Si encontrás contradicción entre docs y código, señalala antes de modificar.
- Si no podés verificar algo, decilo explícitamente.
