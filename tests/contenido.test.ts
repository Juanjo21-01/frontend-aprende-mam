/**
 * Pruebas del contrato de `contenido.json` y del renderizado de su Markdown.
 *
 * La validación se prueba contra `docs/contenido.ejemplo.json`, el ejemplo que publica el
 * backend, y contra variantes rotas a propósito. El renderizado, sobre todo en lo que más
 * importa en un sitio para menores: que nada de lo que llegue en el cuerpo se convierta en
 * marcado.
 */
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { contenidoVacio, validarContenido } from '../src/data/contenido-esquema.ts';
import { imagenesDe, renderMarkdown } from '../src/data/markdown.ts';

const ejemplo = JSON.parse(
  readFileSync(new URL('../docs/contenido.ejemplo.json', import.meta.url), 'utf8')
);

const copia = () => structuredClone(ejemplo);

describe('validarContenido', () => {
  it('acepta el ejemplo del backend', () => {
    const contenido = validarContenido(ejemplo, 'ejemplo');
    assert.equal(contenido.paginas.cultura.length, 1);
    assert.equal(contenido.paginas.gramatica.length, 0);
    assert.equal(contenido.documentos[0]!.tipo, 'guia');
  });

  it('acepta el contenido vacío', () => {
    const vacio = contenidoVacio('prueba');
    assert.doesNotThrow(() =>
      validarContenido(
        { version: 1, generado_en: 'x', paginas: vacio.paginas, documentos: [] },
        'vacío'
      )
    );
  });

  it('rechaza el vocabulario con el nombre del contenido', () => {
    const vocabulario = JSON.parse(
      readFileSync(new URL('../docs/vocabulario.json', import.meta.url), 'utf8')
    );
    assert.throws(() => validarContenido(vocabulario, 'x'), /vocabulario\.json/);
  });

  it('rechaza una sección que el contrato no tiene', () => {
    const roto = copia();
    roto.paginas.noticias = [];
    assert.throws(() => validarContenido(roto, 'x'), /noticias/);
  });

  it('rechaza un slug repetido en la misma sección', () => {
    const roto = copia();
    roto.paginas.cultura.push({ ...roto.paginas.cultura[0] });
    assert.throws(() => validarContenido(roto, 'x'), /repetido/);
  });

  it('rechaza un slug que no sirve en una dirección', () => {
    const roto = copia();
    roto.paginas.cultura[0].slug = 'Los Cuatro Pueblos';
    assert.throws(() => validarContenido(roto, 'x'), /slug/);
  });

  it('rechaza un documento sin archivo o con archivo inseguro', () => {
    const sin = copia();
    sin.documentos[0].archivo_url = '';
    assert.throws(() => validarContenido(sin, 'x'), /archivo_url/);

    const inseguro = copia();
    inseguro.documentos[0].archivo_url = 'http://ejemplo.org/a.pdf';
    assert.throws(() => validarContenido(inseguro, 'x'), /archivo_url/);
  });

  it('rechaza un tipo de documento desconocido', () => {
    const roto = copia();
    roto.documentos[0].tipo = 'audio';
    assert.throws(() => validarContenido(roto, 'x'), /tipo/);
  });
});

describe('renderMarkdown', () => {
  it('escapa el HTML en vez de dejarlo pasar', () => {
    const html = renderMarkdown('<script>alert(1)</script> y <img src=x onerror=alert(1)>');
    assert.ok(!html.includes('<script'));
    assert.ok(!html.includes('<img'));
    assert.ok(html.includes('&lt;script&gt;'));
  });

  it('baja los títulos un nivel: la página ya tiene su h1', () => {
    assert.equal(renderMarkdown('# Uno'), '<h2>Uno</h2>');
    assert.equal(renderMarkdown('## Dos'), '<h2>Dos</h2>');
    assert.equal(renderMarkdown('### Tres'), '<h3>Tres</h3>');
  });

  it('une las líneas de un párrafo y separa por línea en blanco', () => {
    assert.equal(renderMarkdown('uno\ndos\n\ntres'), '<p>uno dos</p>\n<p>tres</p>');
  });

  it('hace listas, negritas y cursivas', () => {
    assert.equal(
      renderMarkdown('- a **b**\n- c *d*'),
      '<ul><li>a <strong>b</strong></li><li>c <em>d</em></li></ul>'
    );
    assert.equal(renderMarkdown('1. uno\n2. dos'), '<ol><li>uno</li><li>dos</li></ol>');
  });

  it('respeta el saltillo y las letras del Mam sin tocarlas', () => {
    assert.equal(renderMarkdown('Ẍiky kyiẍ i’ẍ napẍ q’aq’ tx’otx’'), '<p>Ẍiky kyiẍ i’ẍ napẍ q’aq’ tx’otx’</p>');
  });

  it('enlaza solo a https, rutas del sitio y anclas', () => {
    assert.ok(renderMarkdown('[a](https://ejemplo.org)').includes('href="https://ejemplo.org"'));
    assert.ok(renderMarkdown('[a](https://ejemplo.org)').includes('rel="noopener noreferrer"'));
    assert.ok(renderMarkdown('[a](/cultura)').includes('href="/cultura"'));
    assert.ok(renderMarkdown('[a](#x)').includes('href="#x"'));

    for (const malo of ['javascript:alert(1)', 'http://x.org', 'data:text/html,x', '//x.org']) {
      const html = renderMarkdown(`[texto](${malo})`);
      assert.ok(!html.includes('<a'), malo);
      assert.ok(html.includes('texto'), malo);
    }
  });

  it('no deja salir una comilla del atributo', () => {
    const html = renderMarkdown('[a](https://x.org/"onmouseover="alert(1))');
    assert.ok(!/onmouseover="/.test(html));
  });

  it('antepone la base del sitio a las rutas propias, no a las externas', () => {
    assert.ok(renderMarkdown('[a](/cultura)', { base: '/mam/' }).includes('href="/mam/cultura"'));
    assert.ok(
      renderMarkdown('[a](https://x.org)', { base: '/mam/' }).includes('href="https://x.org"')
    );
  });

  describe('imágenes', () => {
    it('siempre llevan medidas, carga diferida y texto alternativo', () => {
      const html = renderMarkdown('![Mapa](/img/mapa.png)');
      assert.match(html, /width="\d+"/);
      assert.match(html, /height="\d+"/);
      assert.ok(html.includes('loading="lazy"'));
      assert.ok(html.includes('alt="Mapa"'));
    });

    it('usan las medidas reales cuando quien llama las conoce', () => {
      const html = renderMarkdown('![Mapa](/img/mapa.png)', {
        medidas: () => ({ ancho: 800, alto: 600 }),
      });
      assert.ok(html.includes('width="800" height="600"'));
    });

    it('no se pintan si la dirección no es segura', () => {
      const html = renderMarkdown('![x](javascript:alert(1))');
      assert.ok(!html.includes('<img'));
    });

    it('se listan para medirlas antes de pintar', () => {
      assert.deepEqual(imagenesDe('a ![x](/a.png) b ![y](https://x.org/b.webp) ![z](javascript:1)'), [
        '/a.png',
        'https://x.org/b.webp',
      ]);
    });
  });
});
