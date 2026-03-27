# Project Memory

## Proyecto
NitroCircus es un sistema de orquestacion multiagente para desarrollo de software.
El Product Owner interactua por Telegram. La API central orquesta estado, auditoria y tareas.
Los agentes tecnicos ejecutan trabajo especializado con limites claros por path y responsabilidad.

## Objetivo operativo
- Planificar, asignar, ejecutar y entregar trabajo dentro del monorepo.
- Mantener separacion estricta entre planificacion y ejecucion.
- Preservar GitHub como fuente de verdad del trabajo.
- Mantener un flujo Docker-first para servicios, con `agent-runner` ejecutandose en host.

## Stack confirmado
- Monorepo Node.js + TypeScript
- `apps/api`: Fastify
- `apps/bot`: grammY
- `apps/web`: React + Vite
- `workers/agent-runner`: worker host para agentes
- MongoDB + Redis
- Docker Compose para entorno dev/prod de servicios principales

## Arquitectura vigente
- Bot de Telegram como gateway del Product Owner
- API orquestadora como centro de estado y eventos
- PM Agent separado de agentes tecnicos
- MongoDB y Redis como persistencia y colas
- NightCityVerse como capa visual no critica

## Restricciones clave
- Planificado no implica iniciado
- Ningun agente debe arrancar desarrollo sin autorizacion explicita del Product Owner
- No reiniciar arquitectura sin evidencia clara
- Priorizar cambios pequenos, verificables y reversibles
- Respetar ownership por carpetas descrito en `CLAUDE.md`

## Fuente de verdad usada para esta reconstruccion
- `CLAUDE.md`
- `README.md`
- `docs/DECISIONS.md`
- Estructura real del repositorio
- Estado actual de git

## Gap detectado
La capa `.ai/` requerida por el flujo no existia al iniciar esta sesion. La continuidad real estaba repartida entre `CLAUDE.md`, `README.md` y `docs/DECISIONS.md`.
