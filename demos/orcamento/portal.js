// Camada de dados: entrega ao painel o conteúdo do dados.js, no formato que o painel espera.
// Nenhuma regra de cálculo aqui.
(function () {
  'use strict';
  var ISO = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z$/;
  // datas ISO do dados.js voltam a ser Date (no app o IPC já entrega Date)
  function reviver(o) {
    if (Array.isArray(o)) { for (var i = 0; i < o.length; i++) o[i] = reviver(o[i]); return o; }
    if (o && typeof o === 'object') { for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) o[k] = reviver(o[k]); return o; }
    if (typeof o === 'string' && ISO.test(o)) return new Date(o);
    return o;
  }
  var SEM_DADOS = { ok: false, error: 'Os dados ainda não foram gerados. Peça uma atualização no Portal (botão "Atualizar") e recarregue a página.' };

  // Relê o dados.js (botão "Atualizar dados" do painel): carrega o arquivo de novo, sem cache.
  function recarregarDados() {
    return new Promise(function (ok) {
      var s = document.createElement('script');
      s.src = 'dados.js?t=' + Date.now();
      s.onload = function () { s.remove(); ok(); };
      s.onerror = function () { s.remove(); ok(); };
      document.head.appendChild(s);
    });
  }
  function dados(recarregar) { return (recarregar ? recarregarDados() : Promise.resolve()).then(function () { return window.DADOS || null; }); }

  window.appData = {
    portal: true,
    // OSs de Manutenção
    osBase: function (rec) { return dados(rec).then(function (d) { return d && d.base ? { ok: true, base: d.base } : SEM_DADOS; }); },
    osItens: function (id) { return dados(false).then(function (d) { return d && d.itens ? { ok: true, itens: d.itens[String(id)] || [] } : SEM_DADOS; }); },
    // Orçamentos de Manutenção
    orcBase: function (rec) { return dados(rec).then(function (d) { return d && d.base ? { ok: true, base: d.base } : SEM_DADOS; }); },
    // Análise Exploratória de Frotas (fotos: pendentes no Portal — a tela mostra a logo)
    efrotaBase: function (rec) { return dados(rec).then(function (d) { return d && d.base ? { ok: true, base: d.base, fotos: {}, fotosPasta: false } : SEM_DADOS; }); },
    efrotaDetalhe: function (frota) {
      return dados(false).then(function (d) {
        var x = d && d.detalhes && d.detalhes[String(frota)];
        return x ? { ok: true, detalhe: x } : { ok: false, error: 'Frota não encontrada.' };
      });
    },
    efrotaFotos: function () { return Promise.resolve({ ok: true, fotos: [] }); },
    efrotaFoto: function () { return Promise.resolve({ ok: false, error: 'Fotos das frotas ainda não estão disponíveis no Portal.' }); },
    // Manutenções Primárias e Preventivas
    getPanelPrimarias: function () { return dados(false).then(function (d) { return d && d.rows ? { ok: true, rows: reviver(d.rows) } : SEM_DADOS; }); },
    getPanelPreventivasA9900: function () {
      return dados(false).then(function (d) {
        return d && d.rows ? { ok: true, rows: reviver(d.rows), sections: d.sections, empresas: d.empresas } : SEM_DADOS;
      });
    }
  };
  // botões "Atualizar dados" dos painéis de Primárias e Preventivas: recarregam o dados.js e a página
  window.portalRecarregar = function () { return recarregarDados(); };
})();
