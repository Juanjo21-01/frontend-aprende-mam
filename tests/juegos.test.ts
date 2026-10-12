/**
 * Pruebas de la lógica de los juegos contra la exportación real de `docs/vocabulario.json`.
 *
 * Corren con el ejecutor que trae Node (`npm test`), sin dependencias. Usan la semilla de
 * `docs/` y no la caché del último build a propósito: la semilla es el contrato verificado, y
 * una prueba que dependiera de lo que haya descargado el build anterior no se podría repetir.
 */
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  MINIMO_POR_TEMA,
  TODOS,
  aPalabraDeJuego,
  barajar,
  elegirDistintas,
  grafemasDe,
  memoriaTerminada,
  nuevaPartidaMemoria,
  temasJugables,
  tieneLetrasAjenas,
  voltear,
  type PalabraDeJuego,
  type PartidaMemoria,
} from '../src/data/juegos.ts';
import type { Categoria, Entrada } from '../src/data/vocabulario.ts';

const exportacion = JSON.parse(
  readFileSync(new URL('../docs/vocabulario.json', import.meta.url), 'utf8')
) as { categorias: Categoria[]; entradas: Entrada[] };

const palabras = exportacion.entradas.map(aPalabraDeJuego);

/** Azar repetible: la misma semilla da siempre la misma partida. */
function semilla(valor: number) {
  let estado = valor;
  return () => {
    estado = (estado * 1_103_515_245 + 12_345) % 2_147_483_648;
    return estado / 2_147_483_648;
  };
}

function grupos() {
  return exportacion.categorias.map((categoria) => ({
    categoria,
    entradas: exportacion.entradas.filter((entrada) => entrada.temas.includes(categoria.slug)),
  }));
}

describe('grafemasDe', () => {
  it('reconstruye exactamente el campo `mam` de cada entrada', () => {
    for (const entrada of exportacion.entradas) {
      assert.equal(grafemasDe(entrada).join(''), entrada.mam, `entrada ${entrada.id}`);
    }
  });

  it('trata las letras compuestas como una sola', () => {
    // tx’otx’ = tx’ · o · tx’
    assert.deepEqual(grafemasDe({ mam: 'tx’otx’', orden: '241524' }), ['tx’', 'o', 'tx’']);
  });

  it('conserva el espacio de las entradas de varias palabras', () => {
    const conEspacio = exportacion.entradas.find((entrada) => entrada.mam.includes(' '));
    assert.ok(conEspacio, 'la exportación de prueba trae `tlamel ja`');
    assert.ok(grafemasDe(conEspacio).includes(' '));
  });

  it('conserva tal cual un carácter que no es del alfabeto, en vez de perderlo', () => {
    // `tutz’bil` llega con una `b` sin saltillo, y el backend la codifica como `00`.
    assert.deepEqual(grafemasDe({ mam: 'tutz’bil', orden: '212726000612' }), [
      't',
      'u',
      'tz’',
      'b',
      'i',
      'l',
    ]);
    assert.ok(tieneLetrasAjenas({ mam: 'tutz’bil', orden: '212726000612' }));
    assert.ok(!tieneLetrasAjenas({ mam: 'tlamel ja', orden: '211201130512000701' }));
  });

  it('rechaza claves que no corresponden a la palabra', () => {
    assert.throws(() => grafemasDe({ mam: 'a', orden: '123' }));
    assert.throws(() => grafemasDe({ mam: 'a', orden: '99' }));
    assert.throws(() => grafemasDe({ mam: 'saq', orden: '1901' }));
    assert.throws(() => grafemasDe({ mam: 'saq', orden: '190102' }));
  });
});

describe('temasJugables', () => {
  it('ofrece los temas con al menos el mínimo de palabras', () => {
    const jugables = temasJugables(grupos());
    assert.ok(jugables.length > 0);
    for (const { palabras } of jugables) assert.ok(palabras.length >= MINIMO_POR_TEMA);
  });

  it('con la primera exportación, los siete temas se pueden jugar', () => {
    assert.equal(temasJugables(grupos()).length, 7);
  });

  it('se niega a que un tema se llame como la ruta de la partida mezclada', () => {
    const [primero] = grupos();
    assert.throws(() =>
      temasJugables([{ ...primero!, categoria: { ...primero!.categoria, slug: TODOS } }])
    );
  });
});

describe('barajar y elegirDistintas', () => {
  it('barajar conserva los elementos y no toca el original', () => {
    const original = [1, 2, 3, 4, 5];
    const barajada = barajar(original, semilla(3));
    assert.deepEqual([...barajada].sort(), original);
    assert.deepEqual(original, [1, 2, 3, 4, 5]);
  });

  it('nunca elige dos palabras con el mismo Mam ni el mismo castellano', () => {
    const repetidas: PalabraDeJuego[] = [
      ...palabras,
      { ...palabras[0]!, id: 9001 },
      { ...palabras[1]!, id: 9002, mam: 'otra' },
    ];

    for (let s = 1; s <= 50; s++) {
      const elegidas = elegirDistintas(repetidas, 20, semilla(s));
      assert.equal(new Set(elegidas.map((p) => p.mam)).size, elegidas.length);
      assert.equal(
        new Set(elegidas.map((p) => p.espanol.toLocaleLowerCase('es'))).size,
        elegidas.length
      );
    }
  });
});

describe('memoria', () => {
  it('reparte dos cartas por palabra, una en cada idioma', () => {
    const partida = nuevaPartidaMemoria(palabras, semilla(7));
    assert.equal(partida.palabras.length, 8);
    assert.equal(partida.cartas.length, 16);

    partida.palabras.forEach((palabra, par) => {
      const delPar = partida.cartas.filter((carta) => carta.par === par);
      assert.deepEqual(delPar.map((c) => c.cara).sort(), ['espanol', 'mam']);
      assert.ok(delPar.some((c) => c.texto === palabra.mam));
    });
  });

  it('con un tema chico juega con todas sus palabras', () => {
    const partida = nuevaPartidaMemoria(palabras.slice(0, 4), semilla(1));
    assert.equal(partida.cartas.length, 8);
  });

  it('se puede terminar en cada tema jugable', () => {
    for (const tema of temasJugables(grupos())) {
      let partida: PartidaMemoria = nuevaPartidaMemoria(tema.palabras, semilla(11));

      for (let par = 0; par < partida.palabras.length; par++) {
        const [a, b] = partida.cartas.flatMap((carta, i) => (carta.par === par ? [i] : []));
        partida = voltear(voltear(partida, a!), b!);
      }

      assert.ok(memoriaTerminada(partida), tema.categoria.slug);
      assert.equal(partida.intentos, partida.palabras.length);
    }
  });

  it('un fallo queda a la vista hasta el siguiente toque, que voltea la carta nueva', () => {
    let partida = nuevaPartidaMemoria(palabras, semilla(5));
    const primera = 0;
    const distinta = partida.cartas.findIndex((carta) => carta.par !== partida.cartas[0]!.par);
    const tercera = partida.cartas.findIndex(
      (_, i) => i !== primera && i !== distinta
    );

    partida = voltear(partida, primera);
    partida = voltear(partida, distinta);
    assert.deepEqual(partida.arriba, [primera, distinta]);
    assert.equal(partida.intentos, 1);

    partida = voltear(partida, tercera);
    assert.deepEqual(partida.arriba, [tercera]);
    assert.equal(partida.intentos, 1);
  });

  it('tocar dos veces la misma carta o una ya emparejada no cuenta', () => {
    let partida = nuevaPartidaMemoria(palabras, semilla(9));
    partida = voltear(partida, 0);
    partida = voltear(partida, 0);
    assert.deepEqual(partida.arriba, [0]);
    assert.equal(partida.intentos, 0);

    const pareja = partida.cartas.findIndex(
      (carta, i) => i !== 0 && carta.par === partida.cartas[0]!.par
    );
    partida = voltear(partida, pareja);
    const despues = voltear(partida, 0);
    assert.equal(despues, partida);
  });
});
