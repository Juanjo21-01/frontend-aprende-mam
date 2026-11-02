import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const codigo = readFileSync(new URL('../src/scripts/apariencia.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');

function navegador({ oscuro = false, valor = null, bloqueado = false, antiguo = false }:
  { oscuro?: boolean; valor?: string | null; bloqueado?: boolean; antiguo?: boolean } = {}) {
  const eventos = new Map<string, (evento?: any) => void>();
  const almacen = new Map<string, string>();
  if (valor) almacen.set('aprendemam-apariencia', valor);
  const raiz = { dataset: {} as Record<string, string> };
  const boton = { atributos: {} as Record<string, string>, setAttribute(nombre: string, valor: string) { this.atributos[nombre] = valor; } };
  const controlTema = { hidden: true };
  const accion = { textContent: '' };
  const iconoClaro = { hidden: true };
  const iconoOscuro = { hidden: true };
  const metas = [{ content: '' }, { content: '' }];
  let cambioSistema = () => {};
  const sistema = { matches: oscuro, ...(antiguo
    ? { addListener(fn: () => void) { cambioSistema = fn; } }
    : { addEventListener(_: string, fn: () => void) { cambioSistema = fn; } }) };
  const escuchar = (nombre: string, fn: (evento?: any) => void) => eventos.set(nombre, fn);
  runInNewContext(codigo, {
    window: { matchMedia: () => sistema, addEventListener: escuchar },
    document: {
      documentElement: raiz,
      querySelectorAll: () => metas,
      getElementById: (id: string) => ({ 'cambiar-tema': boton, 'control-tema': controlTema,
        'tema-accion': accion, 'tema-icono-claro': iconoClaro, 'tema-icono-oscuro': iconoOscuro })[id],
      addEventListener: escuchar,
    },
    localStorage: {
      getItem(clave: string) { if (bloqueado) throw Error('denegado'); return almacen.get(clave) ?? null; },
      setItem(clave: string, valor: string) { if (bloqueado) throw Error('denegado'); almacen.set(clave, valor); },
      removeItem(clave: string) { if (bloqueado) throw Error('denegado'); almacen.delete(clave); },
    },
  });
  return { raiz, metas, almacen, eventos, boton, controlTema, accion, iconoClaro, iconoOscuro,
    pulsarTema() { eventos.get('click')!({ target: { closest: (selector: string) => selector === '#cambiar-tema' ? boton : null } }); },
    sistema(oscuro: boolean) { sistema.matches = oscuro; cambioSistema(); },
  };
}

test('el botón alterna la apariencia efectiva, recuerda la elección y actualiza su nombre', () => {
  const n = navegador({ oscuro: true });
  assert.equal(n.controlTema.hidden, false);
  assert.equal(n.boton.atributos['aria-label'], 'Cambiar a claro');
  assert.equal(n.iconoClaro.hidden, false);
  n.pulsarTema();
  assert.equal(n.raiz.dataset.tema, 'claro');
  assert.equal(n.almacen.get('aprendemam-apariencia'), 'clara');
  assert.equal(n.boton.atributos['aria-label'], 'Cambiar a oscuro');
  assert.equal(n.iconoOscuro.hidden, false);
  n.sistema(true);
  assert.equal(n.raiz.dataset.tema, 'claro');
  n.pulsarTema();
  assert.equal(n.raiz.dataset.tema, 'oscuro');
  assert.equal(n.almacen.get('aprendemam-apariencia'), 'oscura');
});

test('el botón sigue cambiando el tema si no se puede guardar la elección', () => {
  const n = navegador({ bloqueado: true });
  n.pulsarTema();
  assert.equal(n.raiz.dataset.tema, 'oscuro');
  assert.equal(n.boton.atributos['aria-label'], 'Cambiar a claro');
});

test('automática sigue el sistema hasta que se elige una apariencia con el botón', () => {
  const n = navegador({ oscuro: true });
  assert.equal(n.raiz.dataset.tema, 'oscuro');
  n.sistema(false);
  assert.equal(n.raiz.dataset.tema, 'claro');
  n.pulsarTema();
  n.sistema(false);
  assert.equal(n.raiz.dataset.tema, 'oscuro');
  assert.equal(n.almacen.get('aprendemam-apariencia'), 'oscura');
});

test('aplica la elección guardada desde la cabecera y sincroniza la barra del navegador', () => {
  const n = navegador({ oscuro: true, valor: 'clara' });
  assert.equal(n.raiz.dataset.tema, 'claro');
  n.eventos.get('DOMContentLoaded')!();
  assert.equal(n.controlTema.hidden, false);
  assert.deepEqual(n.metas.map(m => m.content), ['#fffdf8', '#fffdf8']);
  n.pulsarTema();
  assert.deepEqual(n.metas.map(m => m.content), ['#201d19', '#201d19']);
});

test('sincroniza otra pestaña, limpieza de preferencias y regreso desde la caché de navegación', () => {
  const n = navegador();
  n.almacen.set('aprendemam-apariencia', 'oscura');
  n.eventos.get('storage')!({ key: 'aprendemam-apariencia' });
  assert.equal(n.raiz.dataset.tema, 'oscuro');
  n.almacen.clear();
  n.eventos.get('storage')!({ key: null });
  assert.equal(n.raiz.dataset.tema, 'claro');
  n.almacen.set('aprendemam-apariencia', 'oscura');
  n.eventos.get('pageshow')!();
  assert.equal(n.raiz.dataset.tema, 'oscuro');
});

test('ignora valores guardados desconocidos y admite el oyente antiguo de MediaQueryList', () => {
  const n = navegador({ valor: 'desconocida', antiguo: true });
  assert.equal(n.raiz.dataset.tema, 'claro');
  n.sistema(true);
  assert.equal(n.raiz.dataset.tema, 'oscuro');
});

function paleta(bloque: string) {
  return Object.fromEntries([...bloque.matchAll(/--color-([\w-]+):\s*(#[\da-f]{6})/g)].map(m => [m[1], m[2]]));
}
function luminancia(hex: string) {
  return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4)
    .reduce((total, c, i) => total + c * [.2126, .7152, .0722][i], 0);
}
function contraste(a: string, b: string) {
  const l = [luminancia(a), luminancia(b)].sort((x, y) => x - y);
  return (l[1] + .05) / (l[0] + .05);
}

test('respaldo sin JavaScript y elección manual comparten los 21 colores oscuros', () => {
  const manual = paleta(css.split(":root[data-tema='oscuro'] {")[1].split('}')[0]);
  const automatica = paleta(css.split(':root:not([data-tema]) {')[1].split('}')[0]);
  assert.equal(Object.keys(manual).length, 21);
  assert.deepEqual(automatica, manual);
});

test('ambas paletas mantienen contraste de texto, estados, selección y foco', () => {
  const clara = paleta(css.split('@theme {')[1].split('}')[0]);
  const oscura = paleta(css.split(":root[data-tema='oscuro'] {")[1].split('}')[0]);
  for (const [nombre, p] of Object.entries({ clara, oscura })) {
    const pares = [
      ['tinta', 'papel'], ['tinta', 'papel-hondo'], ['tinta', 'borde'],
      ['tinta-suave', 'papel'], ['tinta-suave', 'papel-hondo'],
      ['amarillo-tinte-texto', 'amarillo-tinte'],
      ...['verde', 'rojo', 'amarillo', 'negro'].map(c => [c + '-texto', c + '-campo']),
      ...['verde', 'rojo'].map(c => [c + '-texto', c + '-tinte']),
      // Selección y texto auxiliar sobre las superficies de sección.
      ...['verde', 'rojo', 'amarillo', 'negro'].flatMap(c => [['tinta', c + '-campo'], ['tinta-suave', c + '-campo']]),
    ];
    for (const [fg, bg] of pares) assert.ok(contraste(p[fg], p[bg]) >= 4.5, `${nombre}: ${fg}/${bg}`);
    for (const fondo of ['papel', 'papel-hondo', 'verde-campo', 'rojo-campo', 'amarillo-campo', 'negro-campo', 'rojo-tinte', 'verde-tinte', 'amarillo-tinte']) {
      assert.ok(contraste(p.tinta, p[fondo]) >= 3, `${nombre}: foco/${fondo}`);
    }
  }
});
