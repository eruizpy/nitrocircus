# Delivery and Deployment Policy

## Política general de finalización
Todo proyecto culminado deberá considerarse **entregado en estado no productivo**.

## Al finalizar desarrollo
- no se publica automáticamente en producción;
- no se despliega en ninguna VPS por defecto;
- queda almacenado dentro del repositorio principal en una carpeta con su nombre;
- el contenido de `/projects/<nombre-del-proyecto>/` también debe quedar versionado en Git;
- debe incluir documentación mínima de uso y arquitectura.

## Ubicación estándar
```text
/projects/<nombre-del-proyecto>
```

## Contenido mínimo del proyecto entregado
- código fuente
- paquete `.zip` autocontenido dentro de `/projects/<nombre-del-proyecto>`
- README del proyecto
- instrucciones de ejecución
- variables de entorno requeridas
- notas técnicas
- estado funcional actual
- pendientes/riesgos

## Formato esperado del paquete de entrega
- carpeta `/projects/<nombre-del-proyecto>/`
- archivo `<nombre-del-proyecto>.zip` con todo el bundle exportado
- documentación operativa (`README.md`, `TASKS.md`, `RUNBOOK.md`, `DELIVERY.json`)
- snapshot base del repo y export de branches de tarea cuando existan entregables de agentes

## Regla de despliegue bajo demanda
Solo cuando el Product Owner lo ordene, el DevOps Agent debe:

1. tomar el proyecto desde su carpeta;
2. evaluar si se separa a un repositorio dedicado;
3. preparar GitHub del proyecto si aplica;
4. configurar GitHub Actions;
5. solicitar datos de infraestructura.

## Datos que debe solicitar DevOps
- IP pública de la nueva VPS
- usuario de acceso
- método de autenticación

Puede aceptar contraseña como entrada, pero debe recomendar:
- clave SSH
- secretos cifrados
- principio de mínimo privilegio

## Restricciones críticas
DevOps nunca debe:
- desplegar por defecto,
- asumir credenciales,
- publicar secretos,
- mover proyectos sin trazabilidad.

## Salida esperada al preparar despliegue
- repo separado si aplica,
- pipeline base,
- checklist,
- estrategia de rollback,
- guía operativa de bootstrap y deploy.
