# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primarios:** niñas y niños de primaria de San Marcos, Guatemala, que aprenden Mam en la
  escuela o en casa. Muchos todavía leen despacio. Usan teléfonos de gama baja, a menudo
  prestados o compartidos, con 3G o sin señal, muchas veces con luz de día.
- **Secundarios:** docentes que preparan clase con el diccionario, los juegos y los
  materiales descargables. La interfaz debe servirles sin sentirse infantil.

Son menores de edad: no se pide registro ni se recogen datos personales.

## Product Purpose

Biblioteca digital del idioma maya Mam (variante de San Marcos): diccionario Mam–castellano,
vocabulario por temas, gramática, cultura, base legal, materiales para el aula y tres juegos
propios. Éxito: que un estudiante encuentre una palabra y practique aunque no tenga señal, y
que la primera carga quepa en menos de 150 KB comprimidos.

## Positioning

Es el único recurso que reúne el vocabulario Mam revisado por un validador lingüístico,
ordenado con el alfabeto Mam (no el castellano) y utilizable sin conexión en el teléfono que
los estudiantes ya tienen.

## Operating Context

- Aula y casa; teléfono primero, también tableta y escritorio (docentes, laboratorio).
- Conexión intermitente: el sitio funciona sin conexión por service worker; el video
  externo nunca funciona sin conexión y se sustituye por un aviso.
- El contenido sale de un backend Laravel en tiempo de compilación; el navegador nunca llama
  a la API.

## Capabilities and Constraints

- Astro estático con islas de React solo para el buscador, los tres juegos y el contenedor
  de video. Tailwind CSS para estilos. Diseño **mobile first**.
- Presupuesto de carga inicial < 150 KB comprimidos.
- Tipografía: Charis SIL (trae `ẍ`, U+1E8D). El texto en Mam se muestra tal cual viene del
  backend, sin transformaciones (nada de `text-transform`).
- No hay audio: lo audiovisual es video externo incrustado tras una fachada.
- Orden alfabético Mam ya resuelto por el backend en el campo `orden`.

## Brand Commitments

- Nombre: AprendeMam. Dominio aprendemam.online.
- Paleta comprometida por el usuario (29-oct-2026): **rojo, amarillo, verde y blanco**,
  leída como los colores de los rumbos mayas (rojo oriente, blanco norte, amarillo sur, verde
  centro), con el negro del poniente como tinta. Antes de afirmar ese significado como dato
  cultural en la interfaz, debe validarlo alguien de la comunidad.
- Los temas del vocabulario conservan un color propio, derivado de esa paleta, siempre
  acompañado de ícono y nombre.

## Evidence on Hand

- Exportación real del vocabulario: `docs/vocabulario.json` (42 entradas, 7 categorías).
- Contrato de contenido editorial: `docs/contenido.ejemplo.json` (textos inventados, nunca
  se publican).
- No hay fotografías ni ilustraciones propias todavía; no inventar testimonios ni cifras de
  uso.

## Product Principles

1. Funcionar sin señal pesa más que cualquier efecto visual.
2. La palabra en Mam es la protagonista: se muestra exacta y legible.
3. Un niño que lee despacio tiene que poder orientarse por ícono y color, sin depender solo
   del texto.
4. La decisión de gastar datos es del usuario, nunca de la app.

## Accessibility & Inclusion

- WCAG 2.2 AA para todo el texto; AAA para la lectura larga.
- Nunca rojo frente a verde como única señal (daltonismo rojo-verde): siempre con ícono y
  texto.
- Sobre amarillo, siempre tinta oscura (≈9:1). Nunca texto blanco sobre amarillo ni texto
  amarillo sobre blanco (≈1.9:1).
- Base tipográfica de 18 px, objetivos táctiles de 44 px, foco visible.
- Tema claro primero; el tema oscuro queda para la fase final.
