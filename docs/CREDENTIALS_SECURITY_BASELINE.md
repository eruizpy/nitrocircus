# Credentials Security Baseline

## Objetivo
Definir reglas mínimas para evitar filtración de credenciales y mantener trazabilidad operativa en NitroCircus.

## Reglas de repositorio
- Nunca commitear `.env` ni archivos con secretos reales.
- Versionar solo `.env.example` con placeholders.
- No almacenar tokens en código, documentación operativa o prompts.
- Evitar incluir credenciales en nombres de ramas, mensajes de commit y comentarios de PR.

## Variables críticas
- `TELEGRAM_BOT_TOKEN`
- `GROQ_API_KEY`
- `OPENAI_API_KEY`
- `GITHUB_TOKEN`
- Cualquier `*_PASS`, `*_SECRET`, `*_TOKEN`

## Integración NightCityVerse (externa)
- NitroCircus integra NightCityVerse por URL externa:
  - `NIGHTCITYVERSE_URL` (principal)
  - `MINIVERSE_URL` (fallback legado temporal)
- El conector debe degradar en silencio si no hay URL configurada.

## CI
- Workflow obligatorio: `.github/workflows/security-secrets.yml`.
- Script: `npm run security:secrets`.
- Si detecta patrones de secretos, la ejecución debe fallar.

## Producción
- Secretos solo en:
  - GitHub Actions Secrets
  - `.env` del servidor con permisos restringidos
- No exponer puertos de base de datos públicamente.
- Rotar credenciales cuando haya sospecha de exposición.

## Respuesta ante incidente
1. Revocar/rotar credenciales afectadas.
2. Invalidar tokens comprometidos.
3. Verificar audit logs de GitHub y del servidor.
4. Ejecutar `npm run security:secrets` y revisar historial reciente.
