# NightCityVerse Integration

NightCityVerse now lives as a standalone external repository at `https://github.com/eruizpy/nightcityverse.git` and should be treated as an external visual runtime consumed by NitroCircus over HTTP/WebSocket.

## Objetivo
Usar NightCityVerse como capa visual y social para observar agentes trabajando.

## Uso correcto
NightCityVerse debe reflejar:
- presencia de agentes,
- estado actual,
- mensajes operativos de alto nivel,
- interacción visual.

## Uso incorrecto
No debe ser:
- fuente de verdad,
- cola principal,
- storage de auditoría,
- sistema de aprobación formal.

## Eventos que pueden publicarse
- `agent.online`
- `agent.thinking`
- `agent.blocked`
- `agent.coding`
- `agent.reviewing`
- `agent.ready`
- `agent.awaiting_approval`
- `project.delivered`

## Conector en NitroCircus
NitroCircus publica eventos visuales mediante un adaptador HTTP:
- API: `apps/api/src/services/nightcityverse.ts`
- Runner: `workers/agent-runner/src/notify.ts`

Variable principal:
- `NIGHTCITYVERSE_URL`

Compatibilidad temporal:
- `MINIVERSE_URL` (fallback legado)
