> 🤖 Draft generado automáticamente por el **frontend agent**
> **Proyecto:** Project1 | **Task ID:** `69bda78f68c4bb55ead66577`

## Archivos a crear/modificar
* `apps/web/src/components/Layout.tsx`: Componente que define la estructura básica de la interfaz de usuario.
* `apps/web/src/components/Header.tsx`: Componente que representa el encabezado de la aplicación.
* `apps/web/src/components/Footer.tsx`: Componente que representa el pie de página de la aplicación.
* `apps/web/src/styles/global.css`: Archivo de estilos globales que define la apariencia visual de la aplicación.
* `apps/web/src/utils/accessibility.ts`: Archivo que contiene funciones y variables relacionadas con la accesibilidad.

## Plan de implementación
1. Crear el componente `Layout.tsx` que utilice el hook `useMediaQuery` de la biblioteca `react-responsive` para detectar el tamaño de la pantalla y aplicar estilos responsivos.
2. Diseñar el componente `Header.tsx` con un menú de navegación que se adapte a diferentes tamaños de pantalla y sea accesible para usuarios con discapacidades.
3. Crear el componente `Footer.tsx` con información de contacto y enlaces a redes sociales, asegurándose de que sea accesible y responsivo.
4. Definir estilos globales en `global.css` que incluyan fuentes, colores y espaciado para crear una apariencia visual coherente en toda la aplicación.
5. Utilizar la biblioteca `react-aria` para implementar accesibilidad en los componentes, como etiquetas de accesibilidad para elementos interactivos y mensajes de error.
6. Crear funciones en `accessibility.ts` que ayuden a mejorar la accesibilidad, como la capacidad de cambiar el tamaño del texto o el contraste de colores.

## Criterios de verificación
- [ ] La aplicación se ve correctamente en diferentes tamaños de pantalla y dispositivos.
- [ ] La aplicación es accesible para usuarios con discapacidades, incluyendo aquellos que utilizan lectores de pantalla o teclados solo.
- [ ] La aplicación tiene un diseño coherente y atractivo en toda su interfaz de usuario.
- [ ] La aplicación cumple con los estándares de accesibilidad web (WCAG 2.1).
- [ ] La aplicación se puede navegar fácilmente utilizando solo el teclado.
- [ ] La aplicación tiene una buena relación de contraste entre el texto y el fondo.