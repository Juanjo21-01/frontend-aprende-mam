// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

import serviceWorker from './scripts/service-worker.mjs';

// El sitio se compila a estático y se sirve desde Netlify. La API de Laravel solo se
// consume en tiempo de compilación: nunca desde el navegador.
export default defineConfig({
  site: 'https://aprendemam.online',
  output: 'static',
  trailingSlash: 'ignore',

  // React solo se carga en las páginas que hidratan una isla. El resto del sitio —cultura,
  // gramática, materiales, base legal y las propias páginas del diccionario por letra y por
  // tema— no descarga ni un módulo: lo único que llevan es el registro del service worker en
  // línea dentro del propio HTML.
  //
  // El service worker se emite al terminar el build, con la lista de recursos ya compilados
  // dentro. Va como integración y no como script de `package.json` porque Netlify ejecuta
  // `npm run build` y nada más: lo que quede fuera de `astro build` no se despliega, y el
  // sitio se vería idéntico mientras deja de funcionar sin conexión.
  integrations: [react(), serviceWorker()],

  // Netlify sirve desde la raíz del dominio, así que no hay prefijo de ruta. Si algún día
  // el sitio se moviera a un subdirectorio, hay que fijar `base` aquí: el layout y la
  // navegación ya construyen sus URL con `import.meta.env.BASE_URL` y se adaptarían solos.

  // `prefetch` inyecta JavaScript en el cliente. Se queda desactivado.
  prefetch: false,

  build: {
    // El CSS compartido cacheable conviene más que incorporarlo a cada página: el service
    // worker lo precarga una sola vez y las 37 páginas lo comparten desde la caché.
    inlineStylesheets: 'auto',
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
