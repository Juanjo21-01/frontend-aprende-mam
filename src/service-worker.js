/**
 * Service worker de AprendeMam.
 *
 * No es un archivo que se sirva tal cual: `scripts/service-worker.mjs` lo lee al terminar el
 * build, sustituye los marcadores `__…__` por la lista real de recursos compilados y escribe
 * el resultado en `dist/sw.js`. Editar aquí; nunca en `dist/`.
 *
 * Escrito a mano y sin Workbox a propósito. Workbox resuelve problemas que este sitio no
 * tiene —rutas dinámicas, expiración por tiempo, sincronización en segundo plano— y a cambio
 * mete un runtime que nadie de este equipo podría depurar desde el DevTools de un teléfono
 * prestado. Lo que sí hace falta cabe en un archivo que se lee de una sentada.
 *
 * Las cuatro reglas que gobiernan todo lo de abajo salen de CLAUDE.md:
 *
 *   1. En la instalación entran la estructura (HTML, CSS, JS, fuentes) y el vocabulario. Con
 *      eso el sitio entero y el buscador funcionan sin señal desde la segunda visita.
 *   2. Las imágenes se guardan bajo demanda, según lo que el usuario vaya viendo.
 *   3. **Los PDF no se cachean nunca.** Son el material descargable, pesan megas y revientan
 *      la cuota de almacenamiento del navegador — que al llenarse no da un error claro, sino
 *      que el navegador borra el origen entero y el usuario pierde también el diccionario.
 *   4. Lo externo —YouTube, Educaplay, Wordwall— no se toca. Ni se cachea ni se intercepta:
 *      esos marcos no pueden funcionar sin conexión y quien avisa de eso es la interfaz, no
 *      este archivo.
 */

/**
 * El nombre de la caché lleva un hash del contenido de todo lo precargado, no un número que
 * alguien tenga que acordarse de subir. Cambiar una coma de una página cambia el hash, y con
 * él el nombre de la caché: la versión vieja se borra sola en el `activate`.
 */
const CACHE = 'aprendemam-__HASH__';

/**
 * Las imágenes viven en una caché aparte y sobreviven a las publicaciones. Volver a
 * descargar las fotos de una lección solo porque se corrigió una errata en otra página sería
 * cobrarle al usuario datos que ya pagó.
 */
const CACHE_IMAGENES = 'aprendemam-imagenes';

/**
 * Imágenes de las lecciones que el usuario pidió guardar con «Descargar esta lección para usar
 * sin internet». Aparte de la anterior para que `podarImagenes` nunca las descarte: las pidió él,
 * con sus datos. El nombre lo escribe `DescargarLeccion.astro`; los dos tienen que coincidir.
 */
const CACHE_LECCIONES = 'aprendemam-lecciones';

/** Tope de imágenes guardadas. Al pasarse se descartan las más antiguas. */
const TOPE_IMAGENES = 80;

/**
 * Páginas, como pares `[clave, archivo]`.
 *
 * Los dos valores son distintos y tienen que serlo. El sitio se compila con
 * `trailingSlash: 'ignore'`, así que el usuario puede llegar a `/diccionario/letra/a` o a
 * `/diccionario/letra/a/` y las dos son la misma página; la **clave** es la forma normalizada
 * con la que se busca en la caché. El **archivo** es la ruta física
 * (`/diccionario/letra/a/index.html`), que es la única que se puede pedir con la certeza de
 * que Netlify responde 200 y no un 301 — y una respuesta redirigida no sirve para contestar a
 * una navegación, el navegador la rechaza.
 */
const PAGINAS = __PAGINAS__;

/** Recursos con nombre inmutable: CSS y JS con hash, fuentes, vocabulario versionado. */
const ASSETS = __ASSETS__;

/** Página que se muestra al navegar sin señal a algo que no está guardado. */
const RESPALDO = '__RESPALDO__';

/**
 * El archivo contra el que se sonda si hay internet de verdad. Tiene que salir siempre a la
 * red: si el service worker lo contestara desde la caché, la sonda diría «hay conexión»
 * justamente cuando no la hay.
 */
const SONDA = '__SONDA__';

/**
 * `ignoreVary` en todas las búsquedas.
 *
 * Netlify responde con `Vary: Accept-Encoding`. Sin esta opción, una respuesta guardada bajo
 * una cabecera de codificación deja de coincidir en cuanto el navegador pide otra, y el
 * acierto de caché se convierte en un fallo silencioso: el sitio parece no funcionar sin
 * conexión aunque todo esté guardado. Aquí no hay ni una sola URL que sirva dos contenidos
 * distintos, así que ignorar `Vary` no puede devolver lo que no es.
 */
const BUSQUEDA = { ignoreVary: true };

self.addEventListener('install', (evento) => {
  evento.waitUntil(precargar());
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(limpiar());
});

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;

  // Un POST no se cachea y no hay ninguno en este sitio; dejarlo pasar es más barato que
  // razonar sobre él.
  if (peticion.method !== 'GET') return;

  const url = new URL(peticion.url);

  // Regla 4: lo de otro origen ni se mira. Interceptarlo solo añadiría latencia a un iframe
  // que de todas formas necesita internet.
  if (url.origin !== self.location.origin) return;

  if (url.pathname === SONDA) return;
  if (url.pathname.endsWith('.pdf')) return;

  if (peticion.mode === 'navigate') {
    evento.respondWith(responderNavegacion(peticion, url));
    return;
  }

  if (peticion.destination === 'image') {
    evento.respondWith(responderImagen(peticion));
    return;
  }

  evento.respondWith(responderRecurso(peticion));
});

async function precargar() {
  const cache = await caches.open(CACHE);

  // Las páginas se piden por su ruta física y se guardan bajo su clave normalizada, por lo
  // explicado arriba en PAGINAS. Eso obliga a hacerlo a mano en vez de con `addAll`.
  //
  // `cache: 'reload'` en todas: sin eso el navegador puede resolver estas peticiones desde su
  // propia caché HTTP y acabaríamos precargando la versión anterior del sitio el mismo día
  // que se publica la nueva.
  await Promise.all(
    PAGINAS.map(async ([clave, archivo]) => {
      const respuesta = await fetch(new Request(archivo, { cache: 'reload' }));
      if (!respuesta.ok) throw new Error(`${archivo} respondió ${respuesta.status}`);
      await cache.put(clave, respuesta);
    })
  );

  await cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' })));
}

/**
 * No se llama a `skipWaiting()`.
 *
 * El service worker nuevo espera a que se cierren las pestañas que usaban el anterior. Es más
 * lento en aparecer y es lo correcto: tomar el control a media sesión mezclaría el HTML viejo
 * que ya está pintado con los recursos nuevos, y como los nombres llevan hash, el resultado no
 * es una página desactualizada sino una página rota.
 */
async function limpiar() {
  const nombres = await caches.keys();

  await Promise.all(
    nombres
      .filter(
        (n) =>
          n.startsWith('aprendemam-') &&
          n !== CACHE &&
          n !== CACHE_IMAGENES &&
          n !== CACHE_LECCIONES
      )
      .map((n) => caches.delete(n))
  );

  // En la primera instalación la pestaña que registró el service worker todavía no está bajo
  // su control. Con esto lo queda desde ya, sin esperar a una recarga.
  await self.clients.claim();
}

/**
 * Navegaciones: primero la caché.
 *
 * Lo contrario —red primero, caché de reserva— daría contenido más fresco a costa de esperar
 * al servidor en cada clic. Con un público en 3G eso es la diferencia entre un sitio que
 * responde al instante y uno que parece colgado, y la frescura ya está resuelta por otra vía:
 * cada publicación cambia el hash de la caché y el service worker nuevo la reemplaza entera.
 */
async function responderNavegacion(peticion, url) {
  const cache = await caches.open(CACHE);

  const guardada = await cache.match(claveDePagina(url.pathname), BUSQUEDA);
  if (guardada) return guardada;

  try {
    return await fetch(peticion);
  } catch {
    const respaldo = await cache.match(RESPALDO, BUSQUEDA);
    if (respaldo) return respaldo;

    // Solo se llega aquí si ni siquiera la página de respaldo está guardada, es decir, si la
    // instalación falló. Aun así hay que decir algo: un error del navegador en inglés sobre
    // un sitio en castellano no le sirve a nadie.
    return new Response(
      '<!doctype html><meta charset="utf-8"><title>Sin conexión</title>' +
        '<p style="font:1rem system-ui;padding:2rem">Sin conexión y esta página no está guardada.</p>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

/**
 * Normaliza una ruta a la forma con la que se guardó la página.
 *
 * `/diccionario/`, `/diccionario` y `/diccionario/index.html` son la misma página y tienen que
 * dar la misma clave, o media caché queda inalcanzable.
 */
function claveDePagina(ruta) {
  if (ruta.endsWith('/index.html')) ruta = ruta.slice(0, -'index.html'.length);
  if (ruta.length > 1 && ruta.endsWith('/')) ruta = ruta.slice(0, -1);
  return ruta;
}

/** Regla 2: bajo demanda, y con tope. Lo que el usuario ve una vez, lo ve luego sin señal. */
async function responderImagen(peticion) {
  // Primero la precarga, y este orden no es cosmético: hay imágenes que son parte de la
  // interfaz y no del contenido —el logo del encabezado, que sale en las 37 páginas— y esas
  // van en la precarga, no en la caché bajo demanda. Sin esta comprobación, la rama de
  // imágenes se salta la precarga entera y el logo aparece roto sin conexión aunque esté
  // guardado, que es justo la impresión de «aplicación rota» que todo lo demás evita.
  const precargada = await caches.match(peticion, { ...BUSQUEDA, cacheName: CACHE });
  if (precargada) return precargada;

  const deLeccion = await caches.match(peticion, { ...BUSQUEDA, cacheName: CACHE_LECCIONES });
  if (deLeccion) return deLeccion;

  const cache = await caches.open(CACHE_IMAGENES);

  const guardada = await cache.match(peticion, BUSQUEDA);
  if (guardada) return guardada;

  // Sin red esto lanza y el navegador pinta el hueco de la imagen con su texto alternativo,
  // que es la degradación correcta: el resto de la página se lee igual.
  const respuesta = await fetch(peticion);

  if (respuesta.ok) {
    await cache.put(peticion, respuesta.clone());
    await podarImagenes(cache);
  }

  return respuesta;
}

/**
 * `cache.keys()` devuelve las entradas en el orden en que se metieron, así que descartar las
 * primeras descarta las más viejas. No es una política de uso reciente de verdad, pero para
 * un tope de decenas de imágenes la diferencia no se nota y el código que sí la implementa
 * necesitaría llevar cuentas aparte.
 */
async function podarImagenes(cache) {
  const claves = await cache.keys();
  const sobran = claves.length - TOPE_IMAGENES;
  if (sobran <= 0) return;

  await Promise.all(claves.slice(0, sobran).map((clave) => cache.delete(clave)));
}

/**
 * CSS, JS, fuentes y el vocabulario. Todos llevan el hash o la versión en el nombre, así que
 * un acierto de caché no puede estar desactualizado: si el contenido cambiara, el nombre sería
 * otro. Lo que no esté precargado sale a la red y no se guarda.
 */
async function responderRecurso(peticion) {
  const guardada = await caches.match(peticion, { ...BUSQUEDA, cacheName: CACHE });
  return guardada ?? fetch(peticion);
}
