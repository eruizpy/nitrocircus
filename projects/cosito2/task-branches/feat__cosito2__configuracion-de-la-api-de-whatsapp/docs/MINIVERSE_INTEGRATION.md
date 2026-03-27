# Miniverse Integration

## Objetivo
Usar Miniverse como capa visual y social para observar agentes trabajando.

## Uso correcto
Miniverse debe reflejar:
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

## Recomendación
Implementar un `miniverse-adapter` que traduzca eventos internos del orquestador a actualizaciones visuales.
