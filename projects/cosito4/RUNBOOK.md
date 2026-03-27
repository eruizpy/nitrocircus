# Runbook de entrega - cosito4

## Contenido
- ZIP principal: `cosito4.zip`
- Código base del repo: `source/main/`
- Entregables por tarea: `task-branches/<branch>/`

## Ejecución local
1. Descomprimir el ZIP principal.
2. Entrar a `source/main/`.
3. Revisar `.env.example` y completar variables necesarias.
4. Si existe `docker-compose.yml`, usar `docker compose up --build` como flujo principal.
5. Si no existe `docker-compose.yml`, revisar el README del código exportado y las carpetas de branch para integrar cambios específicos.

## Despliegue
1. La entrega no despliega automáticamente a producción.
2. Revisar cambios de `task-branches/` para frontend, backend y devops antes de publicar.
3. Si existe una carpeta `deploy/` en los artefactos exportados, usarla como base para CI/CD o bootstrap.
4. Ejecutar `/deploy` solo cuando el Product Owner lo ordene y con la infraestructura disponible.

## Artefactos exportados
- [base] main -> `source/main`
- [task-branch] feat/cosito4/diseno-de-la-interfaz-de-usuario -> `task-branches/feat__cosito4__diseno-de-la-interfaz-de-usuario`
- [task-branch] feat/cosito4/implementacion-de-la-funcionalidad-de-contacto-a-t -> `task-branches/feat__cosito4__implementacion-de-la-funcionalidad-de-contacto-a-t` (GitHub archive feat/cosito4/implementacion-de-la-funcionalidad-de-contacto-a-t -> 404: 404: Not Found)
- [task-branch] feat/cosito4/crear-un-archivo-de-configuracion-para-la-ejecucio -> `task-branches/feat__cosito4__crear-un-archivo-de-configuracion-para-la-ejecucio` (GitHub archive feat/cosito4/crear-un-archivo-de-configuracion-para-la-ejecucio -> 404: 404: Not Found)

## Advertencias
- No se pudo exportar la branch feat/cosito4/implementacion-de-la-funcionalidad-de-contacto-a-t: GitHub archive feat/cosito4/implementacion-de-la-funcionalidad-de-contacto-a-t -> 404: 404: Not Found
- No se pudo exportar la branch feat/cosito4/crear-un-archivo-de-configuracion-para-la-ejecucio: GitHub archive feat/cosito4/crear-un-archivo-de-configuracion-para-la-ejecucio -> 404: 404: Not Found

## Notas
- El snapshot base usa la rama de referencia configurada en el sistema.
- Los branches por tarea contienen los entregables desarrollados por los agentes para frontend, backend, UX/UI y devops cuando existen.
