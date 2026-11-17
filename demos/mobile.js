/* Apoio às demos no celular. */
(function () {
  if (window.parent !== window) {   // aberta dentro da página do portfólio (celular): o Voltar fecha a demo
    document.addEventListener('click', function (e) {
      var v = e.target.closest && e.target.closest('.demo-voltar');
      if (v) { e.preventDefault(); parent.postMessage({ fecharDemo: true }, '*'); }
    });
    return;
  }
  // aberta direto (sem a camada do portfólio) em tela de toque: o Voltar mantém tamanho normal, mesmo com zoom
  if (!window.matchMedia || !matchMedia('(pointer:coarse)').matches || !window.visualViewport) return;
  var vv = window.visualViewport, voltar = document.querySelector('.demo-voltar');
  if (!voltar || getComputedStyle(voltar).position !== 'fixed') return;
  function ancora() {
    var s = 1 / vv.scale;
    voltar.style.left = '0'; voltar.style.top = '0'; voltar.style.transformOrigin = '0 0';
    voltar.style.transform = 'translate(' + (vv.offsetLeft + 10 * s) + 'px,' + (vv.offsetTop + 10 * s) + 'px) scale(' + s + ')';
  }
  vv.addEventListener('resize', ancora); vv.addEventListener('scroll', ancora); addEventListener('orientationchange', ancora);
  ancora();
})();
