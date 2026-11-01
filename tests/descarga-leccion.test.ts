import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guardarImagenes } from '../src/data/descarga-leccion.ts';

test('guarda solo imágenes distintas y anuncia el progreso real', async () => {
  const pedidas: string[] = [];
  const progreso: number[][] = [];
  const cache = { match: async () => undefined, add: async (r: Request) => { pedidas.push(r.url); } };
  assert.equal(await guardarImagenes(cache, ['https://test.local/a', 'https://test.local/a', 'https://test.local/b'], (a, b) => progreso.push([a, b])), 2);
  assert.deepEqual(pedidas, ['https://test.local/a', 'https://test.local/b']);
  assert.deepEqual(progreso, [[1, 2], [2, 2]]);
});

test('un fallo no anuncia éxito y el reintento conserva las descargas parciales', async () => {
  const guardadas = new Set<string>();
  const pedidas: string[] = [];
  let fallar = true;
  const cache = {
    match: async (url: string) => guardadas.has(url),
    add: async (r: Request) => {
      pedidas.push(r.url);
      if (r.url.endsWith('/b') && fallar) throw new Error('Sin espacio');
      guardadas.add(r.url);
    },
  };
  const progreso: number[] = [];
  await assert.rejects(guardarImagenes(cache, ['https://test.local/a', 'https://test.local/b'], n => progreso.push(n)), /Sin espacio/);
  assert.deepEqual(progreso, [1]);
  fallar = false;
  assert.equal(await guardarImagenes(cache, ['https://test.local/a', 'https://test.local/b'], () => {}), 2);
  assert.deepEqual(pedidas, ['https://test.local/a', 'https://test.local/b', 'https://test.local/b']);
});

test('una lista vacía no puede declararse guardada', async () => {
  await assert.rejects(guardarImagenes({ match: async () => false, add: async () => {} }, [], () => assert.fail()), /No hay imágenes/);
});
