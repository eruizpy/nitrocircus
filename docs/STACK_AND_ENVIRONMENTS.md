# Stack and Environments

## Stack principal

### Backend del sistema
- Node.js
- TypeScript
- Fastify o NestJS
- Redis
- MongoDB

### Integraciones
- Telegram Bot API
- GitHub API / GitHub Actions
- Proveedores LLM:
  - GPT-5.4 Thinking
  - Codex / gpt-5.3-codex
  - Claude Sonnet 4.6
  - Claude Opus 4.6
- NightCityVerse API / WebSocket

### Infraestructura
- Linode VPS
- Docker
- Docker Compose
- GitHub Actions

## Entornos

### Local/Dev
Uso local controlado dentro de contenedores.

### Staging interno
Opcional para NitroCircus mismo.

### Producción del sistema NitroCircus
Solo para el orquestador si fuese necesario.  
**No confundir** con la producción de proyectos entregados.

## Proyectos entregados
Los proyectos terminados deben guardarse en:

```text
/projects/<nombre-del-proyecto>
```

Ejemplo:
```text
/projects/alpha
/projects/landing-x
/projects/internal-tool-y
```

## Regla importante
NitroCircus puede vivir desplegado como plataforma, mientras que los proyectos que produce permanecen solo entregados en el repositorio hasta orden de despliegue.
