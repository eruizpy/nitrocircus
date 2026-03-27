# Runbook de entrega - cosito2

## Contenido
- ZIP principal: `cosito2.zip`
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
- [task-branch] feat/cosito2/diseno-de-la-interfaz-de-usuario -> `task-branches/feat__cosito2__diseno-de-la-interfaz-de-usuario`
- [task-branch] feat/cosito2/desarrollo-de-la-landing-page -> `task-branches/feat__cosito2__desarrollo-de-la-landing-page`
- [task-branch] feat/cosito2/investigacion-y-seleccion-de-imagenes -> `task-branches/feat__cosito2__investigacion-y-seleccion-de-imagenes`
- [task-branch] feat/cosito2/configuracion-de-la-api-de-whatsapp -> `task-branches/feat__cosito2__configuracion-de-la-api-de-whatsapp`

## Notas
- El snapshot base usa la rama de referencia configurada en el sistema.
- Los branches por tarea contienen los entregables desarrollados por los agentes para frontend, backend, UX/UI y devops cuando existen.
