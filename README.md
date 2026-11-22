# Tostadas del Fin

Menú móvil para pedidos en el local. El cliente personaliza sus productos, revisa el total y abre una conversación con el mensaje del pedido listo para enviar al 613 105 6755.

## Probar antes de publicar

Descomprime el ZIP y abre `index.html` en un navegador. Para probar la persistencia y las rutas con un servidor local, ejecuta `python3 -m http.server 8080` desde la carpeta del proyecto y abre `http://localhost:8080`.

Prueba una torta con papas ($90), un sope con consomé ($40) y tres superburros con papas ($330). Prueba también agregar tostadas idénticas y duplicar una quitándole la cebolla. Revisa que WhatsApp muestre las cantidades, los cambios y el total esperados antes de enviar. Abrir WhatsApp solo prepara el mensaje. El cliente lo envía en WhatsApp y espera la confirmación del local.

## Publicar en GitHub Pages

1. Crea o abre el repositorio del menú.
2. Sube el contenido descomprimido a la raíz de la rama `main`. `index.html`, las fotos `.webp`, el CSS y el JavaScript deben quedar directamente en la raíz. El archivo `.nojekyll` indica que se trata de un sitio estático.
3. En el repositorio, ve a **Settings → Pages**. En **Source**, elige **Deploy from a branch**, selecciona `main` y `/(root)`, y guarda.
4. Abre el enlace que aparezca en **Pages** cuando termine el despliegue y prueba el flujo desde un celular.

[Guía oficial de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## Actualizar el menú

- `config.js` contiene el número de WhatsApp en formato internacional sin signo `+`, los precios en MXN y las variantes de tamaño. El extra de papas se define en `fries` para la torta y el superburro.
- `index.html` contiene las tarjetas, etiquetas y enlaces internos. Las bebidas aparecen con su nombre y precio mientras se incorporan sus fotos.
- Las fotos retocadas están en la raíz en formato WebP, con dos tamaños según la pantalla. Las papas usan una imagen ilustrativa derivada de la foto de salchipapas.
- `styles.css` define el diseño y `pedido.js` controla la personalización, el carrito y el armado del mensaje.

No requiere servidor de aplicación, credenciales, compilación ni instalación de paquetes. El carrito se guarda en el navegador de cada cliente.

## Forma de pago

En «Mi pedido» se revisan los productos, se ve el total y se elige efectivo, tarjeta o transferencia. El menú anuncia desde el inicio que se acepta tarjeta. La selección se incluye en el mensaje de WhatsApp. Si elige transferencia, el menú muestra la CLABE y permite copiarla.

En `config.js`, escribe la CLABE del negocio como una cadena de 18 dígitos, sin espacios, en `TRANSFER_CLABE`, y actualiza `TRANSFER_BANK` y `TRANSFER_BENEFICIARY` si cambian el banco o el titular. Con la CLABE vacía, el menú indica que hay que pedir la CLABE al personal del local. El menú registra la forma elegida y el negocio confirma el pago.
