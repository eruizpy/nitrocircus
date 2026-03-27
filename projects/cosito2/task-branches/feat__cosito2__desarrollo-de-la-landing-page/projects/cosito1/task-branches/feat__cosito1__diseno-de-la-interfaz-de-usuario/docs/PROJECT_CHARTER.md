# Project Charter — NitroCircus

## Nombre del proyecto
NitroCircus

## Tipo de producto
Plataforma de orquestación multiagente para desarrollo de software.

## Visión
Permitir que un Product Owner gestione proyectos de software mediante Telegram, mientras un PM agent planifica y coordina agentes técnicos especializados para frontend, backend y DevOps, con trazabilidad total en GitHub y visualización operativa en Miniverse.

## Problema a resolver
La coordinación manual entre múltiples agentes y herramientas suele generar:
- ruido operativo,
- pérdida de contexto,
- cambios no autorizados,
- despliegues prematuros,
- falta de trazabilidad,
- y dificultad para visualizar el trabajo en curso.

NitroCircus busca resolver esto con un modelo explícito de control, estados, asignación y autorización.

## Objetivos
- Convertir instrucciones del Product Owner en trabajo estructurado
- Mantener backlog y kanban ordenados
- Activar agentes solo cuando exista autorización formal
- Asegurar separación entre planificación, ejecución y despliegue
- Entregar proyectos terminados dentro del monorepo
- Preparar despliegue solo a demanda
- Visualizar actividad multiagente en Miniverse

## No objetivos iniciales
- Despliegue automático a producción
- Autonomía irrestricta de agentes
- Múltiples proveedores de infraestructura en fase 1
- Kubernetes desde el inicio
- Publicación automática de proyectos terminados

## Stakeholders
- **Product Owner**: define prioridades y autoriza inicio/despliegue
- **PM Agent**: interpreta requerimientos, planifica y reporta
- **Frontend Agent**: implementa interfaz TypeScript
- **Backend Agent**: implementa Node.js, Redis, MongoDB y cloud logic
- **DevOps Agent**: prepara CI/CD, repos y despliegue bajo demanda

## Criterios de éxito
- El PM convierte un requerimiento en backlog accionable
- El sistema distingue entre `planificado` e `iniciado`
- Los agentes técnicos operan con límites claros
- Cada proyecto terminado queda contenido en `/projects/<nombre>`
- DevOps puede extraer y preparar un proyecto para despliegue bajo solicitud
- El Product Owner recibe reportes operativos claros por Telegram
