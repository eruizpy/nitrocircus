# Runbook de entrega - cosito1

## Contenido
- ZIP principal: `cosito1.zip`
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
- [task-branch] feat/cosito1/diseno-de-la-interfaz-de-usuario -> `task-branches/feat__cosito1__diseno-de-la-interfaz-de-usuario`
- [task-branch] feat/cosito1/desarrollo-de-la-landing-page -> `task-branches/feat__cosito1__desarrollo-de-la-landing-page`
- [task-branch] feat/cosito1/crear-un-dockerfile -> `task-branches/feat__cosito1__crear-un-dockerfile`
- [task-branch] feat/cosito1/crear-una-imagen-docker -> `task-branches/feat__cosito1__crear-una-imagen-docker`
- [task-branch] feat/cosito1/investigacion-y-planificacion-del-diseno -> `task-branches/feat__cosito1__investigacion-y-planificacion-del-diseno`
- [task-branch] feat/cosito1/creacion-de-prototipo-de-alta-fidelidad -> `task-branches/feat__cosito1__creacion-de-prototipo-de-alta-fidelidad`
- [task-branch] feat/cosito1/desarrollo-frontend-de-la-landing-page -> `task-branches/feat__cosito1__desarrollo-frontend-de-la-landing-page`
- [task-branch] feat/cosito1/configuracion-de-whatsapp-para-contacto -> `task-branches/feat__cosito1__configuracion-de-whatsapp-para-contacto`
- [task-branch] feat/cosito1/creacion-de-imagen-de-docker -> `task-branches/feat__cosito1__creacion-de-imagen-de-docker`

## Notas
- El snapshot base usa la rama de referencia configurada en el sistema.
- Los branches por tarea contienen los entregables desarrollados por los agentes para frontend, backend, UX/UI y devops cuando existen.
