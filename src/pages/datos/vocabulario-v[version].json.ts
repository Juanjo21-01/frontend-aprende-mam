/**
 * El vocabulario que descarga el buscador del navegador.
 *
 * No es una llamada a la API: es un archivo estático más del sitio, servido por el mismo CDN
 * que el HTML. Laravel no se entera de que existe.
 *
 * El nombre lleva la versión (`vocabulario-v7.json`) por dos motivos. Uno, puede cachearse
 * para siempre sin riesgo, como los archivos de `_astro/`. Dos, el service worker de la
 * siguiente tanda invalida por nombre: una publicación nueva cambia el número y el archivo
 * viejo deja de pedirse, sin lógica de expiración que mantener.
 *
 * El contenido no es la exportación tal cual. Se le quita todo lo que el navegador no
 * necesita:
 *
 *   - `orden`, la clave de intercalación: el arreglo ya viene ordenado, y la posición en el
 *     arreglo dice lo mismo gratis.
 *   - Los campos nulos, que en el corpus son la mayoría: hoy 42 de 42 entradas traen
 *     `definicion: null` y `municipio: null`. Omitirlos no cambia lo que el buscador puede
 *     mostrar y reduce lo que hay que parsear en un teléfono de gama baja.
 *   - La ficha bibliográfica repetida por entrada, que pasa a ser un índice contra un arreglo
 *     de fuentes distintas. Son una docena de obras para miles de entradas.
 *
 * Brotli comprime muy bien lo repetido, así que en la red la diferencia es menor de lo que
 * parece. Donde se nota es en `JSON.parse` y en la memoria del teléfono, que es justo lo que
 * este proyecto no puede derrochar.
 */
import type { APIRoute } from 'astro';

import type { DatosBusqueda } from '@/data/busqueda';
import { cargarVocabulario, fuentesCitadas, indiceDeFuente } from '@/data/vocabulario';

export async function getStaticPaths() {
  const { version } = await cargarVocabulario();

  return [{ params: { version: String(version) } }];
}

export const GET: APIRoute = async () => {
  const vocabulario = await cargarVocabulario();
  const fuentes = fuentesCitadas(vocabulario.entradas);

  const datos: DatosBusqueda = {
    version: vocabulario.version,

    temas: Object.fromEntries(
      vocabulario.categorias.map((categoria) => [categoria.slug, categoria.nombre_es])
    ),

    fuentes: fuentes.map(({ titulo, institucion, anio }) => ({ titulo, institucion, anio })),

    entradas: vocabulario.entradas.map((entrada) => {
      const indice = indiceDeFuente(entrada, fuentes);

      return {
        id: entrada.id,
        mam: entrada.mam,
        espanol: entrada.espanol,
        busqueda: entrada.busqueda,
        temas: entrada.temas,
        ...(entrada.clase ? { clase: entrada.clase } : {}),
        ...(entrada.definicion ? { definicion: entrada.definicion } : {}),
        ...(entrada.municipio ? { municipio: entrada.municipio } : {}),
        ...(indice !== null ? { fuente: indice - 1 } : {}),
        ...(entrada.fuente?.pagina != null ? { pagina: entrada.fuente.pagina } : {}),
      };
    }),
  };

  return new Response(JSON.stringify(datos), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
