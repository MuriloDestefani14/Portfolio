/* Apoio às demos no celular: o botão Voltar e o aviso de giro mantêm tamanho fixo, mesmo com a página reduzida ou ampliada. */
(function () {
  if (!window.matchMedia || !matchMedia('(pointer:coarse)').matches) return;   // só em telas de toque
  var vv = window.visualViewport;
  var voltar = document.querySelector('.demo-voltar');
  var fixo = voltar && getComputedStyle(voltar).position === 'fixed';
  var fechada = false;

  var css = document.createElement('style');
  css.textContent = '.dica-giro{position:fixed;left:0;top:0;z-index:100000;display:none;align-items:center;gap:8px;padding:8px 10px;border-radius:12px;background:rgba(10,18,20,.94);color:#fff;font:600 13px "Segoe UI",system-ui,sans-serif;border:1px solid rgba(255,255,255,.22);box-shadow:0 8px 22px rgba(0,0,0,.4);transform-origin:0 0}' +
    '.dica-giro span{flex:1;line-height:1.25}.dica-giro button{border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);color:#fff;border-radius:8px;padding:6px 10px;font:inherit;font-size:12.5px;cursor:pointer}' +
    '.dica-giro .dg-x{padding:6px 9px}';
  document.head.appendChild(css);

  var dica = document.createElement('div');
  dica.className = 'dica-giro';
  dica.innerHTML = '<span>↻ Gire o celular para a horizontal</span><button type="button" class="dg-fs">Tela cheia</button><button type="button" class="dg-x" aria-label="Fechar aviso">✕</button>';
  document.body.appendChild(dica);

  function emRetrato() { return matchMedia('(orientation: portrait)').matches; }
  function ancora() {
    var k = vv ? vv.scale : 1, s = 1 / k;
    var ox = vv ? vv.offsetLeft : 0, oy = vv ? vv.offsetTop : 0;
    var w = vv ? vv.width : innerWidth, h = vv ? vv.height : innerHeight;
    if (fixo) {   // Voltar sempre no canto superior esquerdo do que está visível, em tamanho normal
      voltar.style.left = '0'; voltar.style.top = '0'; voltar.style.transformOrigin = '0 0';
      voltar.style.transform = 'translate(' + (ox + 10 * s) + 'px,' + (oy + 10 * s) + 'px) scale(' + s + ')';
    }
    dica.style.display = (emRetrato() && !fechada) ? 'flex' : 'none';
    dica.style.width = Math.max(200, Math.round(w * k - 20)) + 'px';
    dica.style.transform = 'translate(' + (ox + 10 * s) + 'px,' + (oy + h - 58 * s) + 'px) scale(' + s + ')';
  }
  dica.querySelector('.dg-x').addEventListener('click', function () { fechada = true; ancora(); });
  dica.querySelector('.dg-fs').addEventListener('click', function (e) {
    var el = document.documentElement, b = e.currentTarget;
    var pedido = el.requestFullscreen ? el.requestFullscreen() : Promise.reject();
    Promise.resolve(pedido).then(function () { return screen.orientation.lock('landscape'); })
      .catch(function () { b.textContent = 'Gire à mão'; });
  });
  if (vv) { vv.addEventListener('resize', ancora); vv.addEventListener('scroll', ancora); }
  addEventListener('resize', ancora); addEventListener('orientationchange', ancora);
  ancora(); setTimeout(ancora, 400);
})();
