/* Se inserta antes del CSS para aplicar la preferencia guardada antes de pintar. */
(function () {
  var raiz = document.documentElement;
  var sistema = window.matchMedia('(prefers-color-scheme: dark)');
  var clave = 'aprendemam-apariencia';
  var preferencia = 'automatica';

  function validar(valor) {
    return valor === 'clara' || valor === 'oscura' ? valor : 'automatica';
  }

  function leer() {
    try {
      preferencia = validar(localStorage.getItem(clave));
    } catch (_) {
      /* La preferencia del teléfono sigue disponible sin almacenamiento. */
    }
  }

  function aplicar() {
    var oscuro =
      preferencia === 'oscura' ||
      (preferencia === 'automatica' && sistema.matches);
    raiz.dataset.tema = oscuro ? 'oscuro' : 'claro';
    // El color de la barra del navegador acompaña también la elección manual.
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach(function (meta) {
        meta.content = oscuro ? '#201d19' : '#fffdf8';
      });
    var boton = document.getElementById('cambiar-tema');
    if (boton) {
      var accion = oscuro ? 'Claro' : 'Oscuro';
      boton.setAttribute('aria-label', 'Cambiar a ' + accion.toLowerCase());
      boton.setAttribute('title', 'Cambiar a ' + accion.toLowerCase());
      document.getElementById('tema-accion').textContent = accion;
      document.getElementById('tema-icono-claro').hidden = !oscuro;
      document.getElementById('tema-icono-oscuro').hidden = oscuro;
      document.getElementById('control-tema').hidden = false;
    }
  }

  function elegir(valor) {
    preferencia = valor;
    try {
      localStorage.setItem(clave, preferencia);
    } catch (_) {
      /* El cambio sigue funcionando en esta página si no se puede guardar. */
    }
    aplicar();
  }

  leer();
  aplicar();
  document.addEventListener('DOMContentLoaded', aplicar);
  document.addEventListener('click', function (evento) {
    if (evento.target.closest && evento.target.closest('#cambiar-tema')) {
      elegir(raiz.dataset.tema === 'oscuro' ? 'clara' : 'oscura');
    }
  });
  if (sistema.addEventListener) sistema.addEventListener('change', aplicar);
  else if (sistema.addListener) sistema.addListener(aplicar);
  window.addEventListener('storage', function (evento) {
    if (evento.key === clave || evento.key === null) {
      preferencia = 'automatica';
      leer();
      aplicar();
    }
  });
  window.addEventListener('pageshow', function () {
    leer();
    aplicar();
  });
})();
