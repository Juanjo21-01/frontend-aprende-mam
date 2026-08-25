/**
 * Saber si hay internet de verdad.
 *
 * `navigator.onLine` no sirve solo, y el matiz es exactamente el que arruina este proyecto si
 * se pasa por alto: **solo informa de si el dispositivo tiene una interfaz de red activa.**
 * Un teléfono conectado al wifi de una escuela cuyo enlace se cayó, o pegado a una antena sin
 * datos contratados, devuelve `true` y sigue devolviéndolo mientras el usuario mira un marco
 * de YouTube que nunca va a cargar. En San Marcos ese caso no es el raro: es el habitual.
 *
 * Lo que sí es fiable es el `false`: si el sistema dice que no hay interfaz, no la hay. Por
 * eso la comprobación es en dos tiempos —primero la respuesta gratis, después la sonda— y
 * nunca al revés.
 *
 * La sonda pide un archivo diminuto **del propio dominio**. Sondear contra un tercero mediría
 * la conexión a ese tercero y además filtraría a cada visitante de un sitio que no pide datos
 * personales y cuyo público es menor de edad.
 *
 * Este módulo es puro y no depende de Astro: lo importan las islas —el contenedor de
 * actividades externas y el video incrustado— para decidir si montan el iframe o el aviso.
 * `BaseLayout.astro` lleva aparte una versión mínima en línea de esta misma lógica; el porqué
 * de esa duplicación está explicado allí.
 */

export interface OpcionesSonda {
  /** Archivo contra el que se sondea. Tiene que ser del propio origen. */
  url?: string;
  /** Milisegundos antes de dar la conexión por muerta. */
  espera?: number;
}

/**
 * Tres segundos.
 *
 * En 3G una petición de 69 bytes que va a llegar, llega muy por debajo de eso. Lo que se está
 * midiendo con este número no es la lentitud sino el caso de la red que acepta la conexión y
 * luego no contesta nunca — que sin corte se queda colgado hasta que el sistema operativo se
 * aburre, y para entonces el usuario ya se fue.
 */
const ESPERA = 3000;

const SONDA = '/ping.txt';

/**
 * Resuelve a `false` en cuanto se sabe que no hay salida, sin lanzar nunca.
 *
 * Que no lance es deliberado: quien llama a esto está decidiendo si pinta un iframe o un
 * aviso, y una excepción ahí dejaría la interfaz a medias — justo el «marco vacío» que
 * CLAUDE.md prohíbe.
 */
export async function hayInternet({ url = SONDA, espera = ESPERA }: OpcionesSonda = {}) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;

  const corte = new AbortController();
  const temporizador = setTimeout(() => corte.abort(), espera);

  try {
    // `no-store` para que no conteste la caché HTTP, y el service worker deja pasar esta ruta
    // a la red por el mismo motivo. Una sonda que se responde a sí misma desde la caché diría
    // siempre que hay internet.
    const respuesta = await fetch(url, { cache: 'no-store', signal: corte.signal });
    return respuesta.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(temporizador);
  }
}

/**
 * Avisa de los cambios de conexión y devuelve la función para dejar de escuchar.
 *
 * Se sondea al empezar, al recuperar la interfaz de red y al volver a la pestaña. Esto último
 * es lo que cubre el caso corriente: el usuario deja el teléfono, camina hasta donde hay
 * señal y vuelve a mirar la pantalla, sin que se haya disparado ningún evento `online`.
 */
export function observarConexion(
  alCambiar: (hay: boolean) => void,
  opciones: OpcionesSonda = {}
): () => void {
  let ultimo: boolean | null = null;
  let vivo = true;

  const anunciar = (hay: boolean) => {
    if (!vivo || hay === ultimo) return;
    ultimo = hay;
    alCambiar(hay);
  };

  const sondear = async () => anunciar(await hayInternet(opciones));

  // `offline` es de fiar y es inmediato: no hay interfaz, no hay internet, no hace falta
  // preguntárselo a la red. `online` en cambio solo dice que apareció una interfaz, y eso es
  // precisamente lo que no basta.
  const alCaer = () => anunciar(false);

  const alVolver = () => {
    if (!document.hidden) void sondear();
  };

  addEventListener('offline', alCaer);
  addEventListener('online', sondear);
  document.addEventListener('visibilitychange', alVolver);

  void sondear();

  return () => {
    vivo = false;
    removeEventListener('offline', alCaer);
    removeEventListener('online', sondear);
    document.removeEventListener('visibilitychange', alVolver);
  };
}
