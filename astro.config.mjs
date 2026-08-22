// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// El sitio se compila a estático y se sirve desde un CDN. La API de Laravel solo se
// consume en tiempo de compilación: nunca desde el navegador.
export default defineConfig({
  // TODO: confirmar el dominio definitivo antes del primer despliegue.
  site: 'https://aprendemam.gt',
  output: 'static',
  trailingSlash: 'ignore',

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
