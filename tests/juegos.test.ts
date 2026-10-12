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
  nuevaPartidaSopa,
  preguntasDesdeVocabulario,
  nuevaPartidaCuestionario,
  responder,
  siguiente,
  aciertos,
  cuestionarioTerminado,
  sopaTerminada,
  tocarCasilla,
  casillasEntre,
  aptaPara,
  ANCHO_MAXIMO_SOPA,
  nuevaPartidaMemoria,
  temasJugables,
  tieneLetrasAjenas,
  voltear,
  type PalabraDeJuego,
  type PartidaMemoria,
  type PartidaSopa,
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
    const jugables = temasJugables(grupos(), 'memoria');
    assert.ok(jugables.length > 0);
    for (const { palabras } of jugables) assert.ok(palabras.length >= MINIMO_POR_TEMA);
  });

  it('con la primera exportación, los siete temas se pueden jugar', () => {
    assert.equal(temasJugables(grupos(), 'memoria').length, 7);
  });

  it('se niega a que un tema se llame como la ruta de la partida mezclada', () => {
    const [primero] = grupos();
    assert.throws(() =>
      temasJugables([{ ...primero!, categoria: { ...primero!.categoria, slug: TODOS } }], 'memoria')
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
    for (const tema of temasJugables(grupos(), 'memoria')) {
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
    const tercera = partida.cartas.findIndex((_, i) => i !== primera && i !== distinta);

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

describe('sopa de letras', () => {
  it('deja fuera las entradas con espacio y las que traen letras ajenas', () => {
    const tlamel = palabras.find((p) => p.mam === 'tlamel ja')!;
    const tutzbil = palabras.find((p) => p.mam === 'tutz’bil')!;
    assert.equal(aptaPara('sopa-de-letras', tlamel), false);
    assert.equal(aptaPara('sopa-de-letras', tutzbil), false);
    assert.equal(aptaPara('memoria', tutzbil), true);
  });

  it('los siete temas se pueden jugar también en la sopa', () => {
    assert.equal(temasJugables(grupos(), 'sopa-de-letras').length, 7);
  });

  it('casillasEntre solo acepta líneas rectas, en los dos sentidos', () => {
    assert.deepEqual(casillasEntre(5, 0, 3), [0, 1, 2, 3]);
    assert.deepEqual(casillasEntre(5, 3, 0), [3, 2, 1, 0]);
    assert.deepEqual(casillasEntre(5, 1, 16), [1, 6, 11, 16]);
    assert.equal(casillasEntre(5, 0, 6), null);
  });

  /** Dónde quedó escrita una palabra: busca su primera letra y sigue en las dos direcciones. */
  function ubicar(partida: PartidaSopa, letras: string[]): [number, number] {
    const { lado, casillas } = partida;
    for (let origen = 0; origen < casillas.length; origen++) {
      const [fila, columna] = [Math.floor(origen / lado), origen % lado];
      if (columna + letras.length <= lado && letras.every((l, i) => casillas[origen + i] === l)) {
        return [origen, origen + letras.length - 1];
      }
      if (
        fila + letras.length <= lado &&
        letras.every((l, i) => casillas[origen + i * lado] === l)
      ) {
        return [origen, origen + (letras.length - 1) * lado];
      }
    }
    throw new Error(`«${letras.join('')}» no está en la cuadrícula`);
  }

  it('en cada tema, con muchas semillas, coloca palabras de verdad y se puede terminar', () => {
    for (const tema of temasJugables(grupos(), 'sopa-de-letras')) {
      for (let s = 1; s <= 40; s++) {
        let partida = nuevaPartidaSopa(tema.palabras, semilla(s));
        const cuenta = `${tema.categoria.slug}, semilla ${s}`;

        assert.ok(partida.lado <= ANCHO_MAXIMO_SOPA, cuenta);
        assert.equal(partida.casillas.length, partida.lado * partida.lado, cuenta);
        assert.ok(partida.palabras.length >= Math.min(4, tema.palabras.length), cuenta);

        partida.palabras.forEach(({ letras }) => {
          const [desde, hasta] = ubicar(partida, letras);
          // Al revés: última letra primero.
          partida = tocarCasilla(tocarCasilla(partida, hasta), desde);
        });

        assert.ok(sopaTerminada(partida), cuenta);
        assert.equal(partida.intentos, partida.palabras.length, cuenta);
      }
    }
  });

  it('una casilla por letra Mam: tx’ ocupa una sola', () => {
    const txotx = palabras.find((p) => p.mam === 'tx’otx’')!;
    const partida = nuevaPartidaSopa([txotx, ...palabras.slice(0, 3)], semilla(2));
    assert.ok(partida.casillas.includes('tx’'));
    assert.ok(!partida.casillas.includes('’'.repeat(2)));
  });

  it('una selección equivocada cuenta, queda marcada y se limpia al siguiente toque', () => {
    let partida = nuevaPartidaSopa(palabras, semilla(4));
    // Dos casillas vecinas casi nunca forman una palabra entera.
    partida = tocarCasilla(tocarCasilla(partida, 0), 1);
    assert.equal(partida.intentos, 1);
    assert.deepEqual(partida.fallidas, [0, 1]);
    assert.equal(partida.inicio, null);

    partida = tocarCasilla(partida, 5);
    assert.deepEqual(partida.fallidas, []);
    assert.equal(partida.inicio, 5);
  });

  it('cambiar de idea no cuenta como intento', () => {
    let partida = nuevaPartidaSopa(palabras, semilla(4));
    const diagonal = partida.lado + 1;
    partida = tocarCasilla(tocarCasilla(partida, 0), diagonal);
    assert.equal(partida.intentos, 0);
    assert.equal(partida.inicio, diagonal);
    partida = tocarCasilla(partida, diagonal);
    assert.equal(partida.inicio, null);
  });
});

describe('cuestionario', () => {
  const temas = () => temasJugables(grupos(), 'cuestionario');

  it('en cada tema, diez preguntas o tantas como palabras, sin repetir palabra', () => {
    for (const tema of temas()) {
      const preguntas = preguntasDesdeVocabulario(tema.palabras, semilla(3));
      // Los sinónimos cuentan una sola vez: «alimentos» tiene 5 palabras y dos significan «elote».
      const distintas = elegirDistintas(tema.palabras, Infinity).length;
      assert.equal(preguntas.length, Math.min(10, distintas), tema.categoria.slug);
      assert.equal(new Set(preguntas.map((p) => p.palabra!.id)).size, preguntas.length);
    }
  });

  it('cada pregunta tiene una sola correcta, la de su palabra, y opciones sin repetir', () => {
    for (const tema of [...temas(), { categoria: null, palabras }]) {
      for (let s = 1; s <= 30; s++) {
        for (const pregunta of preguntasDesdeVocabulario(tema.palabras, semilla(s))) {
          const correctas = pregunta.opciones.filter((o) => o.es_correcta);
          assert.equal(correctas.length, 1);
          const esperada =
            pregunta.termino!.idioma === 'mam' ? pregunta.palabra!.espanol : pregunta.palabra!.mam;
          assert.equal(correctas[0]!.texto, esperada);

          const textos = pregunta.opciones.map((o) => o.texto.toLocaleLowerCase('es'));
          assert.equal(new Set(textos).size, textos.length, pregunta.enunciado);
          assert.equal(pregunta.opciones.length, 4, pregunta.enunciado);
        }
      }
    }
  });

  it('un sinónimo nunca aparece como opción incorrecta', () => {
    const elote = palabras.filter((p) => p.espanol === 'elote');
    assert.equal(elote.length, 2, 'la exportación de prueba trae i’ẍ y k’uxub’aj');
    const alimentos = palabras.filter((p) => p.temas.includes('alimentos'));

    for (let s = 1; s <= 60; s++) {
      for (const pregunta of preguntasDesdeVocabulario(alimentos, semilla(s))) {
        if (!elote.includes(pregunta.palabra!)) continue;
        const otro = elote.find((p) => p !== pregunta.palabra)!;
        const textos = pregunta.opciones.map((o) => o.texto);
        if (pregunta.termino!.idioma === 'es') assert.ok(!textos.includes(otro.mam));
      }
    }
  });

  it('mezcla las dos direcciones por mitades', () => {
    const preguntas = preguntasDesdeVocabulario(palabras, semilla(8));
    const haciaEspanol = preguntas.filter((p) => p.termino!.idioma === 'mam').length;
    assert.equal(haciaEspanol, 5);
  });

  it('en la partida de todos, los distractores salen primero del mismo tema', () => {
    for (const pregunta of preguntasDesdeVocabulario(palabras, semilla(12))) {
      const objetivo = pregunta.palabra!;
      const campo = pregunta.termino!.idioma === 'mam' ? 'espanol' : 'mam';
      const delTema = palabras.filter(
        (p) => p !== objetivo && p.temas.some((t) => objetivo.temas.includes(t))
      );
      if (delTema.length < 3) continue;
      for (const opcion of pregunta.opciones.filter((o) => !o.es_correcta)) {
        assert.ok(
          delTema.some((p) => p[campo] === opcion.texto),
          `${opcion.texto} no es del tema de ${objetivo.mam}`
        );
      }
    }
  });

  it('una respuesta no se puede cambiar, y no se avanza sin responder', () => {
    let partida = nuevaPartidaCuestionario(preguntasDesdeVocabulario(palabras, semilla(1)));
    assert.equal(siguiente(partida), partida);

    const correcta = partida.preguntas[0]!.opciones.findIndex((o) => o.es_correcta);
    const otra = (correcta + 1) % 4;
    partida = responder(partida, otra);
    partida = responder(partida, correcta);
    assert.equal(partida.respuestas[0], otra);
    assert.equal(aciertos(partida), 0);
  });

  it('se recorre entera y cuenta los aciertos', () => {
    let partida = nuevaPartidaCuestionario(preguntasDesdeVocabulario(palabras, semilla(6)));
    partida.preguntas.forEach((pregunta, i) => {
      const correcta = pregunta.opciones.findIndex((o) => o.es_correcta);
      partida = responder(partida, i % 3 === 0 ? (correcta + 1) % 4 : correcta);
      partida = siguiente(partida);
    });
    assert.ok(cuestionarioTerminado(partida));
    assert.equal(aciertos(partida), 6);
  });
});
