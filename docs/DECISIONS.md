# Architectural Decisions

## ADR-001 — Telegram como interfaz principal del Product Owner
**Decisión**  
El Product Owner interactúa con el sistema por Telegram.

**Motivo**  
Canal directo, simple y operativo.

---

## ADR-002 — PM separado de agentes técnicos
**Decisión**  
El PM no implementa código.

**Motivo**  
Evitar mezcla entre gestión y ejecución.

---

## ADR-003 — GitHub como fuente de verdad del trabajo
**Decisión**  
Las tareas, PRs y documentación viven en GitHub.

**Motivo**  
Trazabilidad y flujo estándar de ingeniería.

---

## ADR-004 — Los proyectos terminados se entregan dentro del monorepo
**Decisión**  
Todo proyecto terminado queda bajo `/projects/<name>` y su bundle de entrega también se versiona en Git.

**Motivo**  
No publicar automáticamente, mantener control y asegurar que los artefactos entregados estén disponibles tanto en producción como en los clones locales del repositorio.

---

## ADR-005 — Despliegue solo bajo demanda
**Decisión**  
DevOps actúa solo con instrucción explícita del Product Owner.

**Motivo**  
Evitar despliegues prematuros y reducir riesgo.

---

## ADR-006 — NightCityVerse como capa visual
**Decisión**  
NightCityVerse no es el orquestador central.

**Motivo**  
La lógica de negocio y la auditoría deben residir en el backend.

---

## ADR-007 — NightCityVerse se desacopla como proyecto independiente
**Decisión**
NightCityVerse deja de vivir como aplicación interna del stack principal y pasa a mantenerse como proyecto externo en `https://github.com/eruizpy/nightcityverse.git`, con deploy propio y consumo por HTTP desde NitroCircus.

**Motivo**
Reducir acoplamiento entre la capa visual y el orquestador principal, permitir releases independientes y evitar que un deploy de NitroCircus reconfigure o rompa el runtime visual.
