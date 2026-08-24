// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// El sitio se compila a estático y se sirve desde Netlify. La API de Laravel solo se
// consume en tiempo de compilación: nunca desde el navegador.
export default defineConfig({
  site: 'https://aprendemam.online',
  output: 'static',
  trailingSlash: 'ignore',

  // React solo se carga en las páginas que hidratan una isla. El resto del sitio —cultura,
  // gramática, materiales, base legal y las propias páginas del diccionario por letra y por
  // tema— sigue saliendo sin una sola etiqueta `<script>`.
  integrations: [react()],

  // Netlify sirve desde la raíz del dominio, así que no hay prefijo de ruta. Si algún día
  // el sitio se moviera a un subdirectorio, hay que fijar `base` aquí: el layout y la
  // navegación ya construyen sus URL con `import.meta.env.BASE_URL` y se adaptarían solos.

  // `prefetch` inyecta JavaScript en el cliente. Se queda desactivado.
  prefetch: false,

  build: {
    // El CSS compartido cacheable conviene más que ahorrar un RTT: el service worker
    // lo va a precachear en la siguiente fase.
    inlineStylesheets: 'auto',
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
