/** Almacén mínimo para comprobar el progreso y reintentar sin bajar imágenes ya guardadas. */
export interface AlmacenImagenes {
  match(url: string, opciones: { ignoreVary: boolean }): Promise<unknown>;
  add(peticion: Request): Promise<unknown>;
}

export async function guardarImagenes(
  cache: AlmacenImagenes,
  urls: readonly string[],
  progreso: (hechas: number, total: number) => void,
): Promise<number> {
  const distintas = [...new Set(urls)];
  if (distintas.length === 0) throw new Error('No hay imágenes propias para guardar.');
  let hechas = 0;
  for (const url of distintas) {
    if (!(await cache.match(url, { ignoreVary: true }))) {
      await cache.add(new Request(url, { cache: 'reload' }));
    }
    progreso(++hechas, distintas.length);
  }
  return hechas;
}
