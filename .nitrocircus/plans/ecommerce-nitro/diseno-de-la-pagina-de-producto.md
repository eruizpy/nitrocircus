> 🤖 Draft generado automáticamente por el **frontend agent**
> **Proyecto:** Ecommerce Nitro | **Task ID:** `69bd9fab04d2abc042bc66e6`

## Archivos a crear/modificar
* `apps/web/src/components/ProductPage.tsx`: Componente que renderiza la página de producto con la descripción, imágenes y botón de llamada a la acción.
* `apps/web/src/components/ProductImage.tsx`: Componente que renderiza las imágenes del producto.
* `apps/web/src/components/CallToAction.tsx`: Componente que renderiza el botón de llamada a la acción para agregar al carrito.
* `apps/web/src/hooks/useProduct.ts`: Hook que proporciona la información del producto a la página de producto.
* `apps/web/src/types/product.ts`: Tipo TypeScript que define la estructura de la información del producto.

## Plan de implementación
1. Crear el componente `ProductPage.tsx` que renderiza la página de producto con la descripción, imágenes y botón de llamada a la acción.
 * Utilizar el hook `useProduct` para obtener la información del producto.
 * Utilizar el componente `ProductImage` para renderizar las imágenes del producto.
 * Utilizar el componente `CallToAction` para renderizar el botón de llamada a la acción.
2. Crear el componente `ProductImage.tsx` que renderiza las imágenes del producto.
 * Utilizar la propiedad `images` del tipo `Product` para obtener las imágenes del producto.
 * Utilizar la biblioteca `react-carousel` para crear un carrusel de imágenes.
3. Crear el componente `CallToAction.tsx` que renderiza el botón de llamada a la acción para agregar al carrito.
 * Utilizar la propiedad `id` del tipo `Product` para obtener el ID del producto.
 * Utilizar la función `addToCart` para agregar el producto al carrito.
4. Crear el hook `useProduct` que proporciona la información del producto a la página de producto.
 * Utilizar la API de productos para obtener la información del producto.
 * Utilizar la biblioteca `react-query` para cachear la información del producto.
5. Crear el tipo `Product` que define la estructura de la información del producto.
 * Utilizar la interfaz `Product` para definir las propiedades del producto (id, nombre, descripción, imágenes, etc.).

## Criterios de verificación
- [ ] La página de producto muestra la descripción del producto.
- [ ] La página de producto muestra las imágenes del producto.
- [ ] La página de producto tiene un botón de llamada a la acción para agregar al carrito.
- [ ] El botón de llamada a la acción agrega el producto al carrito correctamente.
- [ ] La página de producto se renderiza correctamente en diferentes dispositivos y tamaños de pantalla.