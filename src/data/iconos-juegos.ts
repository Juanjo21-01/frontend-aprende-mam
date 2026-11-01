import type { SlugDeJuego } from './juegos';

/** Trazos de los tres juegos, en la misma familia lineal que las secciones. */
export const ICONOS_JUEGOS: Record<SlugDeJuego, string> = {
  memoria: 'M8 5V3h12v15h-2M4 7h11v14H4ZM7 11h5M7 15h5',
  'sopa-de-letras': 'M3 3h15v15H3ZM3 8h15M3 13h10M8 3v15M13 3v10M21 21l-4-4M19 14a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z',
  cuestionario: 'M9 5h11M9 12h11M9 19h11M3 5l1 1 2-3M3 12l1 1 2-3M3 19l1 1 2-3',
};
