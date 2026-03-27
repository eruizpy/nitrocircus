# GitHub Operating Model

## GitHub como fuente de trabajo

GitHub debe alojar:
- repositorio principal,
- issues,
- pull requests,
- documentación,
- proyectos entregados,
- workflows CI/CD.

## Estructura recomendada

```text
/
├─ docs/
├─ projects/
├─ apps/
├─ packages/
├─ infra/
└─ .github/
```

## Modelo operativo

### Issues
Cada tarea planificada por el PM se representa como issue.

### GitHub Project
Tablero kanban con columnas alineadas a los estados del sistema.

### Branches
Propuesta:
- `main`
- `feat/<project>/<task>`
- `fix/<project>/<task>`
- `docs/<topic>`
- `ops/<topic>`

### Pull Requests
Todos los cambios relevantes deben llegar mediante PR.

### Labels sugeridos
- `project:<name>`
- `type:feature`
- `type:bug`
- `type:docs`
- `type:ops`
- `agent:pm`
- `agent:frontend`
- `agent:backend`
- `agent:devops`
- `status:blocked`
- `priority:p1`
- `priority:p2`
- `priority:p3`

## Regla importante
Un proyecto terminado no sale del monorepo por defecto.  
Se guarda bajo `/projects/<nombre>` y queda listo para extracción/preparación posterior si el Product Owner así lo decide.
