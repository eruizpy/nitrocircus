# NitroCircus — Documentación visual en PlantUML

Este paquete resume la arquitectura, el flujo operativo y las integraciones reales de NitroCircus usando PlantUML.

## Vistas incluidas

1. `docs/plantuml/00_system_context.puml`
   - contexto general del sistema
   - actores, sistemas externos y fuente de verdad

2. `docs/plantuml/01_runtime_architecture.puml`
   - separación entre Docker, host y servicios externos
   - componentes en ejecución y dependencias

3. `docs/plantuml/02_operational_flow_sequence.puml`
   - flujo principal `/new` -> `/plan` -> `/start` -> ejecución de agentes -> `/approve`

4. `docs/plantuml/03_delivery_and_deploy_sequence.puml`
   - entrega, generación de bundle, versionado en Git y despliegue opcional

5. `docs/plantuml/04_state_machines.puml`
   - máquina de estados de `Task`
   - máquina de estados de `Project`

6. `docs/plantuml/05_integrations_and_boundaries.puml`
   - integraciones, límites de confianza y reglas de seguridad operativa

## Principios reflejados

- Telegram es la interfaz del Product Owner
- Fastify API es la fuente de verdad operativa
- GitHub es la fuente de verdad del trabajo visible
- `agent-runner` corre en host y no debe contaminar el checkout productivo
- `/deliver` no implica deploy
- los bundles en `projects/<slug>/` se versionan en Git
- Miniverse es observabilidad visual, no orquestación

## Cómo visualizar

Podés abrir estos `.puml` en cualquier visor PlantUML o generar imágenes, por ejemplo:

```bash
plantuml docs/plantuml/*.puml
```

## Alcance

Estos diagramas documentan el estado real actual del proyecto según:
- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/PM_AND_TELEGRAM_WORKFLOW.md`
- `docs/GITHUB_OPERATING_MODEL.md`
- `docs/DELIVERY_AND_DEPLOYMENT_POLICY.md`
- `docs/MINIVERSE_INTEGRATION.md`
- `packages/shared/src/state-machine.ts`
- `.ai/DECISIONS.md`

