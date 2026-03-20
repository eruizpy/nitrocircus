> 🤖 Draft generado automáticamente por el **frontend agent**
> **Proyecto:** AppMobile Nitro | **Task ID:** `69bda70168c4bb55ead66544`

## Archivos a crear/modificar
* `apps/web/components/Layout.tsx`: Componente que define la estructura básica de la aplicación móvil.
* `apps/web/components/Header.tsx`: Componente que representa el encabezado de la aplicación.
* `apps/web/components/Footer.tsx`: Componente que representa el pie de página de la aplicación.
* `apps/web/pages/Home.tsx`: Página de inicio de la aplicación móvil.
* `apps/web/styles/global.css`: Archivo de estilos globales para la aplicación.
* `apps/web/utils/responsive.ts`: Utilidad para manejar la responsividad de la aplicación en diferentes dispositivos.

## Plan de implementación
1. Crear el componente `Layout.tsx` que utilice el hook `useMediaQuery` de React para detectar el tamaño de la pantalla y ajustar el diseño según sea necesario.
2. Implementar el componente `Header.tsx` con un diseño adaptable que se ajuste a diferentes tamaños de pantalla.
3. Desarrollar el componente `Footer.tsx` con un diseño que se ajuste a la parte inferior de la pantalla en diferentes dispositivos.
4. Crear la página `Home.tsx` que utilice los componentes `Layout`, `Header` y `Footer` para crear la interfaz de usuario de la aplicación móvil.
5. Utilizar el archivo `global.css` para definir estilos globales para la aplicación, como la fuente y el tamaño de texto.
6. Implementar la utilidad `responsive.ts` para manejar la responsividad de la aplicación en diferentes dispositivos, utilizando tipos TypeScript como `DeviceType` y `ScreenSize`.
7. Utilizar el hook `useEffect` para detectar cambios en el tamaño de la pantalla y ajustar el diseño de la aplicación en consecuencia.

## Criterios de verificación
- [ ] La aplicación se muestra correctamente en diferentes dispositivos móviles (teléfonos, tabletas, etc.).
- [ ] La aplicación es compatible con diferentes sistemas operativos (Android, iOS, etc.).
- [ ] La aplicación es accesible para usuarios con discapacidades (teclado navegable, texto alternativo para imágenes, etc.).
- [ ] La aplicación se ajusta correctamente al tamaño de la pantalla en diferentes dispositivos.
- [ ] La aplicación tiene un diseño coherente y atractivo en diferentes dispositivos y sistemas operativos.