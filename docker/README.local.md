# Configuración para Ejecución Local - Landing Page

## Modo Desarrollo (Recomendado)

Ejecutar el servidor de desarrollo de Vite con hot reload:

```bash
cd apps/web
npm install
npm run dev
```

La landing page estará disponible en: http://localhost:5173

## Modo Producción (Docker)

Ejecutar la landing page como contenedor Docker con Nginx:

```bash
docker compose -f docker/local-landing.yml up --build
```

La landing page estará disponible en: http://localhost:8080

## Variables de Entorno

El archivo `.env.local` en la raíz del proyecto contiene la configuración para ejecución local:

- **MONGO_USER/MONGO_PASS/MONGO_DB**: Credenciales de MongoDB (si la landing requiere backend)
- **URLs de servicios**: API, Web, MongoDB, Redis
- Las demás variables son opcionales y solo necesarias si la landing interactúa con el backend

## Proxy API

El servidor de desarrollo (Vite) está configurado para hacer proxy de `/api` hacia `http://localhost:3000`. Si necesitas modificar esta configuración, edita `apps/web/vite.config.ts`.

## Sistema Completo

Para ejecutar el sistema completo (API + Bot + MongoDB + Redis + Web):

```bash
npm run dev
```

Esto levanta todos los servicios necesarios según `docker-compose.yml`.
