> 🤖 Draft generado automáticamente por el **frontend agent**
> **Proyecto:** Ecommerce Nitro | **Task ID:** `69bd9fab04d2abc042bc66e1`

## Archivos a crear/modificar
* `apps/web/src/components/HomePage.tsx`: Componente principal de la página de inicio que renderiza los productos destacados y el botón de llamada a la acción.
* `apps/web/src/components/ProductCard.tsx`: Componente que representa una tarjeta de producto con información básica como nombre, precio y imagen.
* `apps/web/src/hooks/useProducts.ts`: Hook que fetcha los productos destacados desde la API y los devuelve en un arreglo.
* `apps/web/src/styles/HomePage.css`: Archivo de estilos para la página de inicio que define el diseño responsivo.
* `apps/web/src/routes/HomeRoute.tsx`: Ruta que renderiza el componente `HomePage` en la URL raíz del sitio.

## Plan de implementación
1. Crear el componente `ProductCard` que acepte un objeto de tipo `Product` con propiedades `id`, `name`, `price` y `image`.
2. Implementar el hook `useProducts` que fetcha los productos destacados desde la API y los devuelve en un arreglo de objetos `Product`.
3. Crear el componente `HomePage` que utiliza el hook `useProducts` para obtener los productos destacados y renderiza un arreglo de componentes `ProductCard`.
4. Agregar un botón de llamada a la acción en el componente `HomePage` que redirige al usuario a la página de productos.
5. Estilar el componente `HomePage` con CSS para que tenga un diseño responsivo y atractivo.
6. Crear la ruta `HomeRoute` que renderiza el componente `HomePage` en la URL raíz del sitio.
7. Utilizar TypeScript estricto para asegurarse de que todos los componentes y hooks estén tipados correctamente.

## Criterios de verificación
- [ ] La página de inicio se renderiza correctamente en diferentes tamaños de pantalla.
- [ ] La página de inicio muestra los productos destacados con información básica como nombre, precio y imagen.
- [ ] La página de inicio tiene un botón de llamada a la acción que redirige al usuario a la página de productos.
- [ ] El diseño de la página de inicio es responsivo y se adapta a diferentes dispositivos y tamaños de pantalla.
- [ ] El código está escrito en TypeScript estricto y no hay errores de compilación.