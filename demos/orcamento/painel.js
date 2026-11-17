// Painel "Orçamentos de Manutenção" (réplica do .pbix "Orçamentos de Manutenção").
// Números e filtros: orcamento/viewmodel.js (window.OrcVM). Aqui só montagem de HTML/SVG e interação.
(function () {
  'use strict';

  const VM = window.OrcVM;
  const UNIT_COLOR = { Aurora: '#C8553D', Horizonte: '#2A7F8E', Savana: '#B8963E', Pradaria: '#6B5B95' };
  const COR_ORC = '#E0A458';
  const COR_REAL = '#1F6F78';
  const COR_STATUS = { Bom: '#4C9F70', 'Atenção': '#E3B04B', 'Crítico': '#D9822B', Estouro: '#B5483A' };
  const PALETA = ['#1F6F78', '#E0A458', '#C8553D', '#6B5B95', '#8FB339', '#3E7CB1', '#B8963E', '#D1495B', '#2E6F57', '#7A8B99'];
  // Tons suaves, um por classe de equipamento (não precisam contrastar muito).
  const PAL_CLASSE = ['#8FB5B0', '#E3C28B', '#D49A8A', '#B3A6CC', '#A9C48A', '#8DB0CF', '#CFBF8A', '#A7B0B5', '#C7A58F', '#9CC1A9'];
  const SAFRAS = VM.SAFRAS;
  const DIMS_U = ['emp'];
  const DIMS_T = ['classe', 'sub', 'frota'];
  const DIMS_C = ['classe', 'sub', 'frota'];

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const $ = (id) => document.getElementById(id);
  const nf2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const curto = (v) => {
    const a = Math.abs(v || 0);
    if (a >= 1e6) return (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' mi';
    if (a >= 1e3) return (v / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil';
    return Math.round(v || 0).toLocaleString('pt-BR');
  };
  const sinal = (v) => (v > 0 ? '▲ ' : v < 0 ? '▼ ' : '') + VM.pct(Math.abs(v));

  let B = null;
  let classes = [];
  let carregando = false;
  const S = {
    view: 'inicio',
    comp: { emps: [1, 2, 3, 4] },
    sf: { emp: null, classe: null, sub: null, frota: null, status: null, lvlU: 0, lvlT: 0 },
    detalhe: { safra: '26/27', campo: 'Busca frota', conj: null, status: null, emp: null, sort: null },
    crm: { emp: null, frota: null, classe: null, sub: null, nivel: 0 }
  };
  // Um tom suave por classe (matiz espaçado pelo ângulo áureo, saturação/luminosidade fixas).
  const COR_CLASSE_FIXA = { 'Colhedora': '#2E7D74', 'Pulverizadores': '#8C6BB1', 'Trator De Pneus': '#D08A3E', 'Caminhões': '#5B8DB8', 'Onibus': '#C8553D', 'Veículos Leves': '#7FA650' };
  const corClasse = (nome) => COR_CLASSE_FIXA[nome] || 'hsl(' + (Math.max(0, classes.indexOf(nome)) * 137.5 % 360).toFixed(0) + ',50%,50%)';

  const svg = (d) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  const IC = {
    inicio: svg('<path d="M4 11l8-6.5L20 11"/><path d="M6 10v9h12v-9"/>'),
    compara: svg('<path d="M6 8h12l-3-3"/><path d="M18 16H6l3 3"/>'),
    safra: svg('<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10.5h16M9 3.5v4M15 3.5v4"/>'),
    detalhe: svg('<rect x="4" y="4.5" width="16" height="15" rx="2.5"/><path d="M4 9.5h16M4 14.5h16M10 9.5v10"/>'),
    crm: svg('<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 15l3.5-4 3 2.5L20 7"/>')
  };

  /* --------------------------------------------------------------- casca */

  function goCard(view, titulo, cor, n) {
    return '<button type="button" class="or-go" data-go="' + view + '" style="--ac:' + cor + '"><i class="or-go-n">' + n + '</i>' +
      '<span class="or-go-ic">' + IC[view] + '</span><b>' + titulo + '</b></button>';
  }

  function montar() {
    $('or-root').innerHTML =
      '<div class="or-shell is-inicio" id="or-shell">' +
        '<div class="or-rail" id="or-rail">' +
          '<button type="button" class="or-tab is-home" data-view="inicio" title="Início">' + IC.inicio + '</button>' +
          '<button type="button" class="or-tab" data-view="compara" title="Compara safras">' + IC.compara + '</button>' +
          '<button type="button" class="or-tab" data-view="safra" title="Safra 26/27">' + IC.safra + '</button>' +
          '<button type="button" class="or-tab" data-view="detalhe" title="Análise detalhada">' + IC.detalhe + '</button>' +
          '<button type="button" class="or-tab" data-view="crm" title="Custos e CRM">' + IC.crm + '</button>' +
        '</div>' +
        '<div class="or-main">' +
          '<div class="or-status" id="or-status" hidden></div>' +
          '<div class="or-view" id="or-v-inicio">' +
            '<div class="or-capa">' +
              '<svg class="or-capa-art" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
                '<g fill="none" stroke="#FFFFFF" stroke-opacity=".07" stroke-width="2"><circle cx="1480" cy="820" r="220"/><circle cx="1480" cy="820" r="340"/><circle cx="1480" cy="820" r="460"/><circle cx="1480" cy="820" r="580"/></g>' +
                '<g fill="#FFFFFF" fill-opacity=".055"><rect x="1010" y="330" width="52" height="120"/><rect x="1088" y="270" width="52" height="180"/><rect x="1166" y="215" width="52" height="235"/><rect x="1244" y="150" width="52" height="300"/><rect x="1322" y="90" width="52" height="360"/></g>' +
                '<polyline points="1036,300 1114,240 1192,190 1270,125 1348,62" fill="none" stroke="#E0A458" stroke-opacity=".5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
                '<g fill="#E0A458" fill-opacity=".7"><circle cx="1036" cy="300" r="7"/><circle cx="1114" cy="240" r="7"/><circle cx="1192" cy="190" r="7"/><circle cx="1270" cy="125" r="7"/><circle cx="1348" cy="62" r="7"/></g>' +
                '<g stroke="#FFFFFF" stroke-opacity=".05" stroke-width="2"><path d="M960 450H1420"/><path d="M960 330H1420"/><path d="M960 210H1420"/></g>' +
              '</svg>' +
              '<div class="or-capa-txt">' +
                '<span class="or-capa-tag">Relatório de gestão</span>' +
                '<h1>Acompanhamento<br>orçamentário</h1>' +
                '<i class="or-capa-bar"></i>' +
                '<p>Orçado × realizado · safras 24/25 a 26/27</p>' +
              '</div>' +
              '<div class="or-capa-nav">' +
                goCard('compara', 'Compara safras', '#E0A458', '01') +
                goCard('safra', 'Safra 26/27', '#6FC2B5', '02') +
                goCard('detalhe', 'Análise detalhada', '#E58A6F', '03') +
                goCard('crm', 'Custos e CRM', '#B7A6E0', '04') +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="or-view" id="or-v-compara" hidden>' +
            '<div class="or-pagetitle">Compara safras</div>' +
            '<div class="or-toolbar is-c1"><div class="or-filter"><label>Unidade</label><div class="or-pills" id="or-comp-emp"></div></div></div>' +
            '<div id="or-comp-body" class="or-fill"></div>' +
          '</div>' +

          '<div class="or-view" id="or-v-safra" hidden><div class="or-pagetitle">Safra 26/27</div><div id="or-safra-body"></div></div>' +

          '<div class="or-view" id="or-v-detalhe" hidden>' +
            '<div class="or-pagetitle">Análise detalhada</div>' +
            '<div class="or-toolbar is-c3">' +
              '<div class="or-filter"><label>Safra</label><div class="or-pills" id="or-det-safra"></div></div>' +
              '<div class="or-filter"><label>Filtrar por</label><div class="or-pills" id="or-det-campo"></div></div>' +
              '<div class="or-filter"><label id="or-det-vlabel">Frota / Placa</label>' +
                '<div id="or-det-busca-wrap">' + buscaHtml('or-det-busca', 'Todas as frotas') + '</div>' +
                '<div class="or-pills" id="or-det-valores" hidden></div></div>' +
            '</div>' +
            '<div class="or-table-wrap"><table class="or-table"><thead id="or-det-head"></thead><tbody id="or-det-body"></tbody></table></div>' +
          '</div>' +

          '<div class="or-view" id="or-v-crm" hidden>' +
            '<div class="or-pagetitle">Custos e CRM</div>' +
            '<div class="or-toolbar is-c2">' +
              '<div class="or-filter"><label>Unidade</label><div class="or-pills" id="or-crm-emp"></div></div>' +
              '<div class="or-filter"><label>Frota / Placa</label>' + buscaHtml('or-crm-busca', 'Todas as frotas') + '</div>' +
            '</div>' +
            '<div id="or-crm-body"></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    $('or-rail').addEventListener('click', (ev) => { const b = ev.target.closest('.or-tab'); if (b) setView(b.dataset.view); });
    $('or-v-inicio').addEventListener('click', (ev) => { const b = ev.target.closest('.or-go'); if (b) setView(b.dataset.go); });
    montarCompara(); montarSafra(); montarDetalhe(); montarCrm();
  }

  function buscaHtml(id, ph) {
    return '<div class="or-search-wrap"><input type="search" class="or-search" id="' + id + '-input" placeholder="' + esc(ph) + '" autocomplete="off">' +
      '<button type="button" class="or-search-clear" id="' + id + '-clear" hidden>×</button><div class="or-suggest" id="' + id + '-suggest" hidden></div></div>';
  }

  function criarBusca(id, getItems, onPick) {
    const input = $(id + '-input'); const clear = $(id + '-clear'); const box = $(id + '-suggest');
    let hl = -1; let atuais = [];
    function mostrar() {
      const q = norm(input.value.trim());
      atuais = getItems().filter((it) => !q || norm(it.label).indexOf(q) !== -1).slice(0, 80);
      hl = -1;
      box.innerHTML = atuais.length ? atuais.map((it, i) => '<div class="or-suggest-item" data-i="' + i + '"><b>' + esc(it.label) + '</b></div>').join('') : '<div class="or-suggest-empty">Nenhuma frota encontrada.</div>';
      box.hidden = false;
    }
    function escolher(it) { box.hidden = true; input.value = it ? it.label : ''; clear.hidden = !it; onPick(it ? it.key : null); }
    input.addEventListener('focus', mostrar);
    input.addEventListener('input', () => { clear.hidden = !input.value; mostrar(); });
    input.addEventListener('keydown', (ev) => {
      if (box.hidden) return;
      const els = box.querySelectorAll('.or-suggest-item');
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault(); hl = Math.max(0, Math.min(els.length - 1, hl + (ev.key === 'ArrowDown' ? 1 : -1)));
        els.forEach((el, i) => el.classList.toggle('is-hl', i === hl)); if (els[hl]) els[hl].scrollIntoView({ block: 'nearest' });
      } else if (ev.key === 'Enter') { ev.preventDefault(); const it = atuais[hl >= 0 ? hl : 0]; if (it) { escolher(it); input.blur(); } }
      else if (ev.key === 'Escape') box.hidden = true;
    });
    box.addEventListener('mousedown', (ev) => { const el = ev.target.closest('.or-suggest-item'); if (!el) return; ev.preventDefault(); escolher(atuais[Number(el.dataset.i)]); input.blur(); });
    input.addEventListener('blur', () => { setTimeout(() => { box.hidden = true; }, 120); });
    clear.addEventListener('click', () => escolher(null));
    return { set(label) { input.value = label || ''; clear.hidden = !label; } };
  }

  function pills(lista, ativo, cores, rotulo) {
    return lista.map((v) => {
      const on = Array.isArray(ativo) ? ativo.indexOf(v) !== -1 : ativo === v;
      const r = rotulo ? rotulo(v) : v;
      return '<button type="button" class="or-pill' + (on ? ' is-active' : '') + '" data-v="' + esc(v) + '"' + (cores && cores[r] ? ' style="--pill-color:' + cores[r] + '"' : '') + '>' + esc(r) + '</button>';
    }).join('');
  }

  function setView(v) {
    S.view = v;
    $('or-shell').classList.toggle('is-inicio', v === 'inicio');
    ['inicio', 'compara', 'safra', 'detalhe', 'crm'].forEach((k) => { $('or-v-' + k).hidden = k !== v; });
    document.querySelectorAll('#or-rail .or-tab').forEach((t) => t.classList.toggle('is-active', t.dataset.view === v));
    renderAtual();
  }
  function renderAtual() {
    if (!B) return;
    if (S.view === 'compara') renderCompara();
    else if (S.view === 'safra') renderSafra();
    else if (S.view === 'detalhe') renderDetalhe();
    else if (S.view === 'crm') renderCrm();
  }

  // Cabeçalho do gráfico com os botões de subir/descer nível (só nos gráficos que têm hierarquia).
  function cardHead(titulo, chart, nivel, maxNivel, podeDescer) {
    return '<div class="or-card-h"><span>' + esc(titulo) + '</span><span class="or-lvl">' +
      '<button type="button" class="or-lvl-btn" data-lvl="' + chart + ':up"' + (nivel > 0 ? '' : ' disabled') + ' title="Subir nível">↑</button>' +
      '<button type="button" class="or-lvl-btn" data-lvl="' + chart + ':down"' + (nivel < maxNivel && podeDescer ? '' : ' disabled') + ' title="Descer nível (aplica o item selecionado)">↓</button></span></div>';
  }

  /* -------------------------------------------------------- gráficos SVG */

  // App do celular em pé (versão celular em pé): gráficos desenhados mais estreitos, para o texto não ficar miúdo.
  const celVertical = () => !!(window.appData && window.appData.vertical);

  function svgColunas(cats, series, opts) {
    const o = opts || {}; const W = celVertical() ? 400 : 600; const H = 300; const top = 26; const bot = 48;
    const n = Math.max(cats.length, 1);
    const gw = (W - 20) / n; const bw = Math.min(46, (gw * 0.82) / series.length);
    const max = Math.max(1, ...cats.flatMap((c) => c.v.map((x) => x || 0)));
    let g = '<line x1="10" y1="' + (H - bot) + '" x2="' + (W - 10) + '" y2="' + (H - bot) + '" stroke="#D7DEE6"/>';
    cats.forEach((c, i) => {
      const x0 = 10 + i * gw + (gw - bw * series.length) / 2;
      const dim = o.sel != null && o.sel !== c.key;
      c.v.forEach((v, j) => {
        const h = ((v || 0) / max) * (H - top - bot);
        const x = x0 + j * bw;
        const cor = c.cor && series.length === 1 ? c.cor : series[j].color;
        g += '<rect x="' + x + '" y="' + (H - bot - h) + '" width="' + (bw - 2) + '" height="' + Math.max(h, 1) + '" rx="3" fill="' + cor + '"' + (dim ? ' fill-opacity=".3"' : '') + '><title>' + esc(c.label + ' — ' + series[j].name + ': ' + (o.fmt ? o.fmt(v) : VM.money(v))) + '</title></rect>';
        g += '<text x="' + (x + (bw - 2) / 2) + '" y="' + (H - bot - h - 5) + '" text-anchor="middle" font-size="' + (o.fs || 13) + '" font-weight="800" fill="#1A2230"' + (dim ? ' opacity=".45"' : '') + '>' + (o.curto ? o.curto(v) : curto(v)) + '</text>';
      });
      const curta = o.lab ? o.lab(c.label) : c.label;
      const mx = Math.max(5, Math.floor(gw / 7.2));
      const lab = curta.length > mx ? curta.slice(0, mx - 1) + '…' : curta;
      g += '<text x="' + (10 + i * gw + gw / 2) + '" y="' + (H - bot + 20) + '" text-anchor="middle" font-size="13" font-weight="800" fill="#1A2230"><title>' + esc(c.label) + '</title>' + esc(lab) + '</text>';
      if (o.chart) g += '<rect class="or-bar-hit" data-chart="' + o.chart + '" data-nome="' + esc(c.label) + '" x="' + (10 + i * gw) + '" y="0" width="' + gw + '" height="' + (H - bot + 24) + '" fill="transparent"/>';
    });
    return '<svg class="or-chart' + (o.fit ? ' fit' : '') + '" viewBox="0 0 ' + W + ' ' + H + '">' + g + '</svg>';
  }

  function svgLinhas(labels, series, opts) {
    const o = opts || {}; const W = celVertical() ? 400 : (o.w || 600); const H = celVertical() ? 300 : (o.h || 300); const L = 66; const R = 26; const T = 26; const Bt = 34;
    const vals = series.flatMap((s) => s.pts.filter((p) => p != null));
    const max = Math.max(1, ...vals);
    const n = Math.max(labels.length, 1);
    const x = (i) => L + (n === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (n - 1));
    const y = (v) => H - Bt - (v / max) * (H - T - Bt);
    let g = '';
    for (let k = 0; k <= 4; k++) {
      const v = (max * k) / 4; const yy = y(v);
      g += '<line x1="' + L + '" y1="' + yy + '" x2="' + (W - R) + '" y2="' + yy + '" stroke="#EEF1F4"/><text x="' + (L - 6) + '" y="' + (yy + 4) + '" text-anchor="end" font-size="13" font-weight="800" fill="#1A2230">' + (o.fmtY ? o.fmtY(v) : curto(v)) + '</text>';
    }
    // celular em pé: com muitos pontos, rótulos alternados (1 a cada "passo") para não encavalar
    const passo = celVertical() && n > 8 ? Math.ceil(n / 8) : 1;
    const mostra = (i) => passo === 1 || i % passo === 0 || i === n - 1;
    labels.forEach((l, i) => { if (mostra(i)) g += '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="13" font-weight="800" fill="#1A2230">' + esc(l) + '</text>'; });
    series.forEach((s, si) => {
      let seg = [];
      const flush = () => { if (seg.length > 1) g += '<polyline points="' + seg.join(' ') + '" fill="none" stroke="' + s.color + '" stroke-width="2.6" stroke-linejoin="round"' + (s.dash ? ' stroke-dasharray="6,4"' : '') + '/>'; seg = []; };
      s.pts.forEach((p, i) => { if (p == null) { flush(); return; } seg.push(x(i) + ',' + y(p)); });
      flush();
      s.pts.forEach((p, i) => {
        if (p == null) return;
        g += '<circle cx="' + x(i) + '" cy="' + y(p) + '" r="4" fill="' + s.color + '"><title>' + esc(s.name + ' ' + labels[i] + ': ' + (o.fmtT ? o.fmtT(p) : VM.money(p))) + '</title></circle>';
        // valores em negrito; a 2ª série vai abaixo do ponto e os rótulos vizinhos alternam de altura pra não colidir
        if (!mostra(i)) return;
        const abaixo = s.abaixo || si > 0;
        const dy = abaixo ? 19 : -9 - (o.alterna && i % 2 ? 14 : 0);
        g += '<text x="' + x(i) + '" y="' + (y(p) + dy) + '" text-anchor="middle" font-size="' + (o.fv || 12.5) + '" font-weight="800" fill="' + s.color + '" stroke="#fff" stroke-width="3" paint-order="stroke">' + (o.fmtL ? o.fmtL(p) : curto(p)) + '</text>';
      });
    });
    return '<svg class="or-chart" viewBox="0 0 ' + W + ' ' + H + '">' + g + '</svg>';
  }

  function svgRosca(itens) {
    const total = itens.reduce((s, i) => s + Math.max(i.v, 0), 0);
    const R = 92; const C = 2 * Math.PI * R;
    const cores = ['#2E7D74', '#E0A458', '#C8553D', '#6B5B95', '#7FA650'];
    let off = 0; let arcs = '';
    itens.forEach((it, i) => {
      const f = total ? Math.max(it.v, 0) / total : 0; const len = f * C;
      arcs += '<circle cx="125" cy="125" r="' + R + '" fill="none" stroke="' + cores[i % 5] + '" stroke-width="44" stroke-dasharray="' + len + ' ' + (C - len) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 125 125)"><title>' + esc(it.nome + ': ' + VM.money(it.v) + ' (' + VM.pct(f) + ')') + '</title></circle>';
      off += len;
    });
    const leg = itens.map((it, i) => '<div class="or-donut-leg"><i style="background:' + cores[i % 5] + '"></i><b>' + esc(it.nome) + '</b><span>' + VM.pct(total ? it.v / total : 0) + '</span></div>').join('');
    return '<div class="or-donut"><svg viewBox="0 0 250 250">' + arcs +
      '<text x="125" y="120" text-anchor="middle" font-size="12" fill="#6B7885">Total</text><text x="125" y="142" text-anchor="middle" font-size="17" font-weight="800" fill="#1A2230">' + curto(total) + '</text></svg><div class="or-donut-legs">' + leg + '</div></div>';
  }

  // 1 losango por item do nível atual (classe | subclasse | frota), com o nome acima (só o nº no nível de frota).
  function svgDispersao(pts, nivel, sel) {
    const W = celVertical() ? 400 : 600; const H = celVertical() ? 380 : 340; const L = 66; const R = 30; const T = 34; const Bt = 48;
    if (!pts.length) return '<div class="or-aviso" style="color:var(--gray-medium)">Sem dados para este filtro.</div>';
    const mx = Math.max(1, ...pts.map((p) => p.x)) * 1.12 + 0.5; const my = Math.max(1, ...pts.map((p) => p.y)) * 1.12;
    const x = (v) => L + (v / mx) * (W - L - R); const y = (v) => H - Bt - (v / my) * (H - T - Bt);
    let g = '';
    for (let k = 0; k <= 4; k++) { const v = (my * k) / 4; g += '<line x1="' + L + '" y1="' + y(v) + '" x2="' + (W - R) + '" y2="' + y(v) + '" stroke="#E3E8EE" stroke-dasharray="2,3"/><text x="' + (L - 8) + '" y="' + (y(v) + 5) + '" text-anchor="end" font-size="13" font-weight="800" fill="#1A2230">' + Math.round(v) + '</text>'; }
    for (let k = 0; k <= 5; k++) { const v = (mx * k) / 5; g += '<line x1="' + x(v) + '" y1="' + T + '" x2="' + x(v) + '" y2="' + (H - Bt) + '" stroke="#E3E8EE" stroke-dasharray="2,3"/><text x="' + x(v) + '" y="' + (H - Bt + 18) + '" text-anchor="middle" font-size="13" font-weight="800" fill="#1A2230">' + Math.round(v) + '</text>'; }
    g += '<text x="' + (L + (W - L - R) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="14" font-weight="800" fill="#1A2230">Idade Média (anos)</text>';
    g += '<text transform="translate(14 ' + (T + (H - T - Bt) / 2) + ') rotate(-90)" text-anchor="middle" font-size="14" font-weight="800" fill="#1A2230">CRM</text>';
    pts.forEach((p) => {
      const cx = x(p.x); const cy = y(p.y); const r = p.nome === sel ? 10 : 8;
      const dim = sel != null && p.nome !== sel;
      const txt = nivel === 'frota' ? p.nome.split(' - ')[0] : (p.nome.length > 22 ? p.nome.slice(0, 21) + '…' : p.nome);
      g += '<g class="or-pt" data-nome="' + esc(p.nome) + '"' + (dim ? ' opacity=".4"' : '') + '><title>' + esc(p.nome + ' — idade ' + nf2.format(p.x) + ' anos, CRM R$ ' + nf2.format(p.y) + ' (clique para filtrar)') + '</title>' +
        '<path d="M' + cx + ' ' + (cy - r) + ' L' + (cx + r) + ' ' + cy + ' L' + cx + ' ' + (cy + r) + ' L' + (cx - r) + ' ' + cy + ' Z" fill="' + corClasse(p.classe) + '" stroke="' + (p.nome === sel ? '#1A2230' : '#fff') + '" stroke-width="1.5"/>' +
        '<text x="' + cx + '" y="' + (cy - r - 5) + '" text-anchor="middle" font-size="12.5" font-weight="800" fill="#1A2230" stroke="#fff" stroke-width="3" paint-order="stroke">' + esc(txt) + '</text></g>';
    });
    return '<svg class="or-chart" viewBox="0 0 ' + W + ' ' + H + '">' + g + '</svg>';
  }

  /* ------------------------------------------------------- Compara safras */

  function montarCompara() {
    $('or-comp-emp').addEventListener('click', (ev) => {
      const b = ev.target.closest('.or-pill'); if (!b) return;
      const cod = B.pub.empresas.find((e) => e.nome === b.dataset.v).cod;
      const i = S.comp.emps.indexOf(cod);
      if (i === -1) S.comp.emps.push(cod); else if (S.comp.emps.length > 1) S.comp.emps.splice(i, 1);
      renderCompara();
    });
  }
  function renderCompara() {
    const nomes = B.pub.empresas.map((e) => e.nome);
    $('or-comp-emp').innerHTML = pills(nomes, B.pub.empresas.filter((e) => S.comp.emps.indexOf(e.cod) !== -1).map((e) => e.nome), UNIT_COLOR);
    const c = VM.comparaSafras(B, { emps: S.comp.emps, bd: (e) => e.propTer === 'Próprio' });
    const ps = c.porSafra;
    const max = Math.max(1, ...SAFRAS.flatMap((s) => [ps[s].orcado, ps[s].realizado]));
    const pctBox = (t, v, cor) => '<div class="or-mini"><small>' + t + '</small><b class="' + (cor || '') + '">' + sinal(v) + '</b></div>';
    const refs = { '24/25': null, '25/26': [c.pctOrc2425, c.pctReal2425], '26/27': [c.pctOrc2526, c.pctReal2526] };
    let html = '';
    SAFRAS.forEach((s) => {
      const r = refs[s];
      html += '<div class="or-cl"><div class="or-cl-s">' + s + '</div>' + (r
        ? '<div class="or-cl-b">' + pctBox('Orçamento vs anterior', r[0], '') + pctBox('Realizado vs anterior', r[1], r[1] > 0 ? 'neg' : 'pos') + '</div>'
        : '<div class="or-cl-ref">Base de referência</div>') + '</div>';
      const barra = (v, cor, nome) => '<div class="or-hb"><span class="or-hb-t"><i style="width:' + Math.max(1.5, (v / max) * 100) + '%;background:' + cor + '"></i></span><b>R$ ' + curto(v) + '</b><em>' + nome + '</em></div>';
      html += '<div class="or-cc">' + barra(ps[s].orcado, COR_ORC, 'Orçado') + barra(ps[s].realizado, COR_REAL, 'Realizado') + '</div>';
      const d = ps[s].diferenca;
      html += '<div class="or-cr"><small>Diferença (orçado − realizado)</small><b class="' + (d >= 0 ? 'pos' : 'neg') + '">' + VM.money(d) + '</b><em>' + (d >= 0 ? 'dentro do orçado' : 'acima do orçado') + '</em></div>';
    });
    $('or-comp-body').innerHTML =
      '<div class="or-cmp">' + html + '</div>' +
      '<div class="or-leg" style="margin-top:6px"><span><i style="background:' + COR_ORC + '"></i>Orçado</span><span><i style="background:' + COR_REAL + '"></i>Realizado</span></div>' +
      '<div class="or-nota">Equipamentos próprios. Os percentuais "vs anterior" comparam os totais da safra com os da safra anterior (26/27 ainda em andamento).</div>';
  }

  /* --------------------------------------------------------- Safra 26/27 */

  function dimNivel(chart) { return chart === 'u' ? DIMS_U[S.sf.lvlU] : DIMS_T[S.sf.lvlT]; }

  function setDimSafra(dim, nome) {
    const sf = S.sf;
    const valor = dim === 'emp' ? B.pub.empresas.find((e) => e.nome === nome).cod : nome;
    sf[dim] = sf[dim] === valor ? null : valor;
    if (dim === 'classe') { sf.sub = null; sf.frota = null; }
    if (dim === 'sub') sf.frota = null;
  }

  function montarSafra() {
    $('or-safra-body').addEventListener('click', (ev) => {
      const sf = S.sf;
      const hit = ev.target.closest('.or-bar-hit');
      if (hit) { setDimSafra(dimNivel(hit.dataset.chart), hit.dataset.nome); renderSafra(); return; }
      const st = ev.target.closest('.or-st');
      if (st) { sf.status = sf.status === st.dataset.st ? null : st.dataset.st; renderSafra(); return; }
      const lv = ev.target.closest('.or-lvl-btn');
      if (lv && !lv.disabled) {
        const [ch, act] = lv.dataset.lvl.split(':');
        const key = ch === 'u' ? 'lvlU' : 'lvlT'; const max = (ch === 'u' ? DIMS_U : DIMS_T).length - 1;
        sf[key] = Math.max(0, Math.min(max, sf[key] + (act === 'up' ? -1 : 1)));
        renderSafra(); return;
      }
      if (ev.target.closest('[data-limpar-sf]')) { S.sf = { emp: null, classe: null, sub: null, frota: null, status: null, lvlU: 0, lvlT: 0 }; renderSafra(); }
    });
  }

  function renderSafra() {
    const f = S.sf;
    const k = VM.safraKpis(B, f);
    const stt = VM.safraStatus(B, f);
    const gU = VM.safraGrupos(B, f, dimNivel('u'));
    const gT = VM.safraGrupos(B, f, dimNivel('t'));
    const totalSt = Object.values(stt).reduce((a, b) => a + b, 0);
    const kpi = (l, v, kc, s) => '<div class="or-kpi" style="--kc:' + kc + '"><div class="or-kpi-l">' + l + '</div><div class="or-kpi-v">' + v + '</div>' + (s ? '<div class="or-kpi-s">' + s + '</div>' : '') + '</div>';
    const st = (nome, rotulo) => '<div class="or-st' + (f.status === nome ? ' is-sel' : '') + (f.status && f.status !== nome ? ' is-dim' : '') + '" data-st="' + nome + '" style="--stc:' + COR_STATUS[nome] + '" title="Clique para filtrar a página"><b>' + nome + '</b><span>' + rotulo + '</span><i>' + stt[nome] + '</i></div>';
    const nomeEmp = f.emp == null ? null : B.nomeEmp.get(f.emp);
    const sel = { emp: nomeEmp, classe: f.classe, sub: f.sub, frota: f.frota };
    const catsU = (dimNivel('u') === 'emp' ? gU : gU.slice(0, 10)).map((e) => ({ label: e.nome, key: e.nome, v: [e.orcado, e.realizado] }));
    const catsT = gT.slice(0, S.sf.lvlT === 0 ? 5 : 10).map((e) => ({ label: e.nome, key: e.nome, v: [e.orcado, e.realizado] }));
    const tituloU = 'Análise x Unidade';
    const tituloT = ['TOP 5 Orçamentos x Classe', 'Orçamentos x Subclasse', 'Orçamentos x Frota'][S.sf.lvlT];
    const leg = '<div class="or-leg"><span><i style="background:' + COR_ORC + '"></i>Orçado (R$)</span><span><i style="background:' + COR_REAL + '"></i>Realizado (R$)</span></div>';
    const ativos = [];
    if (nomeEmp) ativos.push(nomeEmp); if (f.classe) ativos.push(f.classe); if (f.sub) ativos.push(f.sub); if (f.frota) ativos.push(f.frota); if (f.status) ativos.push('Status ' + f.status);
    const lblFrota = (n) => '#' + n.split(' - ')[0];
    const cols = [{ name: 'Orçado', color: COR_ORC }, { name: 'Realizado', color: COR_REAL }];
    $('or-safra-body').innerHTML =
      '<div class="or-ativos">' + (ativos.length ? 'Filtros ativos: ' + ativos.map((a) => '<span class="or-chip">' + esc(a) + '</span>').join('') + '<button type="button" class="or-chip-btn" data-limpar-sf="1">Limpar</button>' : '<span>Safra em andamento · clique em uma barra ou em um status para filtrar toda a página.</span>') + '</div>' +
      '<div class="or-kpis">' +
        kpi('Total orçado', VM.money(k.orcado), COR_ORC, k.qtdFrotas + ' equipamentos') +
        kpi('Total realizado', VM.money(k.realizado), COR_REAL) +
        kpi('Saldo disponível', VM.money(k.saldo), k.saldo >= 0 ? '#2E9E5B' : '#C0392B') +
        kpi('% restante', VM.pct(k.pctRestante), '#6B5B95', 'do orçamento') +
      '</div>' +
      '<div class="or-titulo">Distribuição por status <span class="or-sub">— com base na % do orçamento já realizado</span></div>' +
      '<div class="or-status-box">' + st('Bom', '> 0% e < 70%') + st('Atenção', '> 70% e < 90%') + st('Crítico', '> 90% e < 100%') + st('Estouro', '> 100%') + '</div>' +
      '<div class="or-grid2 or-grid-fit"><div class="or-card or-card-fit"><div class="or-card-h"><span>' + tituloU + '</span></div>' +
        svgColunas(catsU, cols, { fit: true, chart: 'u', sel: sel[dimNivel('u')], lab: dimNivel('u') === 'frota' ? lblFrota : null }) + leg + '</div>' +
      '<div class="or-card or-card-fit">' + cardHead(tituloT, 't', S.sf.lvlT, DIMS_T.length - 1, sel[dimNivel('t')] != null) +
        svgColunas(catsT, cols, { fit: true, chart: 't', sel: sel[dimNivel('t')], lab: dimNivel('t') === 'frota' ? lblFrota : null }) + leg + '</div></div>';
  }

  /* ---------------------------------------------------- Análise detalhada */

  const COLS_DET = [['safra', 'Safra'], ['empresa', 'Empresa'], ['conj', 'Frota'], ['orcado', 'Orçado', 1], ['realizado', 'Realizado', 1], ['saldo', 'Saldo', 1], ['status', 'Status', 1]];
  let detBuscaCtl = null;

  function montarDetalhe() {
    $('or-det-safra').addEventListener('click', (ev) => {
      const b = ev.target.closest('.or-pill'); if (!b) return;
      S.detalhe.safra = S.detalhe.safra === b.dataset.v ? null : b.dataset.v;
      renderDetalhe();
    });
    detBuscaCtl = criarBusca('or-det-busca', () => (B ? B.equipamentos.filter((e) => e.status === 'Ativo').map((e) => ({ key: e.conj, label: e.conj })).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR', { numeric: true })) : []), (k) => { S.detalhe.conj = k; renderDetalhe(); });
    // Slicer "Parâmetro" do BI: escolhe qual campo o filtro ao lado filtra (Busca frota / Status desvio / Empresa).
    $('or-det-campo').addEventListener('click', (ev) => {
      const b = ev.target.closest('.or-pill'); if (!b) return;
      S.detalhe.campo = b.dataset.v;
      S.detalhe.conj = null; S.detalhe.status = null; S.detalhe.emp = null; detBuscaCtl.set('');
      renderDetalhe();
    });
    $('or-det-valores').addEventListener('click', (ev) => {
      const b = ev.target.closest('.or-pill'); if (!b) return;
      if (S.detalhe.campo === 'Status desvio') S.detalhe.status = S.detalhe.status === b.dataset.v ? null : b.dataset.v;
      else { const cod = B.pub.empresas.find((e) => e.nome === b.dataset.v).cod; S.detalhe.emp = S.detalhe.emp === cod ? null : cod; }
      renderDetalhe();
    });
    $('or-det-head').addEventListener('click', (ev) => {
      const th = ev.target.closest('th'); if (!th) return;
      const col = th.dataset.col; const s = S.detalhe.sort;
      S.detalhe.sort = s && s.col === col ? { col, dir: -s.dir } : { col, dir: 1 };
      renderDetalhe();
    });
  }
  function renderDetalhe() {
    const d = S.detalhe;
    $('or-det-safra').innerHTML = pills(SAFRAS, d.safra);
    $('or-det-campo').innerHTML = pills(['Busca frota', 'Status desvio', 'Empresa'], d.campo);
    $('or-det-vlabel').textContent = d.campo === 'Busca frota' ? 'Frota / Placa' : d.campo === 'Status desvio' ? 'Status' : 'Empresa';
    $('or-det-busca-wrap').hidden = d.campo !== 'Busca frota';
    const vals = $('or-det-valores');
    vals.hidden = d.campo === 'Busca frota';
    if (d.campo === 'Status desvio') vals.innerHTML = pills(['Bom', 'Atenção', 'Crítico', 'Estouro'], d.status, COR_STATUS);
    else if (d.campo === 'Empresa') vals.innerHTML = pills(B.pub.empresas.map((e) => e.nome), d.emp == null ? '' : B.nomeEmp.get(d.emp), UNIT_COLOR);
    else vals.innerHTML = '';
    let rows = VM.detalhada(B, { safra: d.safra, conj: d.conj, status: d.status, emp: d.emp });
    const s = d.sort;
    if (s) {
      const num = ['orcado', 'realizado', 'saldo'].indexOf(s.col) !== -1;
      rows = rows.slice().sort((a, b) => (num ? a[s.col] - b[s.col] : String(a[s.col]).localeCompare(String(b[s.col]), 'pt-BR', { numeric: true })) * s.dir);
    }
    $('or-det-head').innerHTML = '<tr>' + COLS_DET.map(([k, t, n]) => '<th data-col="' + k + '"' + (n ? ' class="ctr"' : '') + '>' + t + (s && s.col === k ? (s.dir > 0 ? ' ▲' : ' ▼') : '') + '</th>').join('') + '</tr>';
    $('or-det-body').innerHTML = rows.length ? rows.map((r) =>
      '<tr><td>' + esc(r.safra) + '</td><td>' + esc(r.empresa) + '</td><td>' + esc(r.conj) + '</td><td class="ctr">' + VM.money(r.orcado) + '</td><td class="ctr">' + VM.money(r.realizado) + '</td>' +
      '<td class="ctr saldo ' + (r.saldo >= 0 ? 'pos' : 'neg') + '">' + VM.money(r.saldo) + '</td><td class="ctr"><span class="or-pillst" style="--stc:' + COR_STATUS[r.status] + '">' + esc(r.status) + '</span></td></tr>'
    ).join('') : '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--gray-medium)">Nenhum registro para este filtro.</td></tr>';
  }

  /* ------------------------------------------------------- Custos e CRM */

  let crmBuscaCtl = null;

  function setDimCrm(dim, nome) {
    const c = S.crm;
    if (dim === 'frota') {
      const e = B.equipamentos.find((x) => x.conj === nome);
      const f = e ? e.frota : null;
      c.frota = c.frota === f ? null : f;
      crmBuscaCtl.set(c.frota == null ? '' : nome);
      return;
    }
    c[dim] = c[dim] === nome ? null : nome;
    if (dim === 'classe') { c.sub = null; c.frota = null; crmBuscaCtl.set(''); }
    if (dim === 'sub') { c.frota = null; crmBuscaCtl.set(''); }
  }

  function montarCrm() {
    $('or-crm-emp').addEventListener('click', (ev) => {
      const b = ev.target.closest('.or-pill'); if (!b) return;
      const cod = B.pub.empresas.find((e) => e.nome === b.dataset.v).cod;
      S.crm.emp = S.crm.emp === cod ? null : cod;
      renderCrm();
    });
    crmBuscaCtl = criarBusca('or-crm-busca', () => (B ? VM.frotasCrm(B, { emps: null }).map((e) => ({ key: e.frota, label: e.conj })).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR', { numeric: true })) : []), (k) => { S.crm.frota = k; renderCrm(); });
    $('or-crm-body').addEventListener('click', (ev) => {
      const c = S.crm;
      const hit = ev.target.closest('.or-bar-hit');
      if (hit) { setDimCrm(DIMS_C[c.nivel], hit.dataset.nome); renderCrm(); return; }
      const pt = ev.target.closest('.or-pt');
      if (pt) { setDimCrm(DIMS_C[c.nivel], pt.dataset.nome); renderCrm(); return; }
      const lv = ev.target.closest('.or-lvl-btn');
      if (lv && !lv.disabled) { c.nivel = Math.max(0, Math.min(DIMS_C.length - 1, c.nivel + (lv.dataset.lvl.endsWith('up') ? -1 : 1))); renderCrm(); }
    });
  }

  function renderCrm() {
    const cs = S.crm;
    $('or-crm-emp').innerHTML = pills(B.pub.empresas.map((e) => e.nome), cs.emp == null ? '' : B.nomeEmp.get(cs.emp), UNIT_COLOR);
    const f = { emps: cs.emp == null ? null : [cs.emp], classe: cs.classe, sub: cs.sub, frota: cs.frota };
    const c = VM.crm(B, f, new Date());
    const dim = DIMS_C[cs.nivel];
    const comp = VM.crmComparativo(B, f, dim);
    const pontos = VM.crmPontos(B, f, dim, new Date());
    const nomeSel = dim === 'frota' ? (cs.frota == null ? null : (B.porFrota.get(cs.frota) || {}).conj) : cs[dim];
    const compCats = comp.map((x) => ({ label: x.nome, key: x.nome, cor: corClasse(x.classe), v: [x.y] }));
    const labels = c.linhaCrm.map((x) => String(x.safra));
    const unico = c.linhaCusto.map((x) => String(x.safra));
    const kpi = (l, v, kc) => '<div class="or-kpi" style="--kc:' + kc + '"><div class="or-kpi-l">' + l + '</div><div class="or-kpi-v">' + v + '</div></div>';
    const tituloComp = 'Comparativo de CRM (R$/hr) — por ' + { classe: 'Classe', sub: 'Subclasse', frota: 'Frota' }[dim];
    $('or-crm-body').innerHTML =
      '<div class="or-kpis">' + kpi('Nº de frotas', VM.nfI.format(c.qtdFrotas), '#1F6F78') + kpi('R$/hr ou R$/km', c.rhr == null ? '—' : nf2.format(c.rhr), '#E0A458') + kpi('Custo corrigido', VM.money(c.custoCorrigido), '#7FA650') + kpi('R$ Aquisição', VM.money(c.aquisicao), '#6B5B95') + '</div>' +
      '<div class="or-titulo">Análise de custo acumulado (R$)</div>' +
      '<div class="or-card"><div class="or-card-t">Custo acumulado x Custo/Ano safra</div>' +
        svgLinhas(unico, [{ name: 'Custo acumulado', color: '#1F6F78', pts: c.linhaCusto.map((x) => x.acumulado) }, { name: 'Custo ano/safra', color: '#7FA650', pts: c.linhaCusto.map((x) => x.custo) }], { w: 1250, h: 320, fv: 13.5 }) +
        '<div class="or-leg"><span><i style="background:#1F6F78"></i>Custo acumulado</span><span><i style="background:#7FA650"></i>Custo ano/safra</span></div></div>' +
      '<div class="or-titulo">Análise de CRM (R$/hr ou R$/km)</div>' +
      '<div class="or-grid2"><div class="or-card">' + cardHead(tituloComp, 'c', cs.nivel, DIMS_C.length - 1, nomeSel != null) +
        (compCats.length ? svgColunas(compCats, [{ name: 'CRM', color: '#1F6F78' }], { chart: 'c', sel: nomeSel, lab: dim === 'frota' ? (n) => '#' + n.split(' - ')[0] : null, fmt: (v) => 'R$ ' + nf2.format(v), curto: (v) => nf2.format(v) }) : '<div class="or-aviso" style="color:var(--gray-medium)">Sem dados.</div>') + '</div>' +
      '<div class="or-card"><div class="or-card-t">Distribuição de custos</div>' + svgRosca(c.donut) + '</div></div>' +
      '<div class="or-grid2"><div class="or-card"><div class="or-card-t">CRM x Idade média (anos) <span class="or-sub">— clique num ponto para filtrar</span></div>' + svgDispersao(pontos, dim, nomeSel) + '</div>' +
      '<div class="or-card or-card-crmf"><div class="or-card-t">CRM Frota x CRM Subclasse</div>' +
        (c.linhaCrm.length ? svgLinhas(labels, [{ name: 'Frota', color: '#1F6F78', pts: c.linhaCrm.map((x) => x.frota) }, { name: 'Subclasse', color: '#E0A458', dash: true, pts: c.linhaCrm.map((x) => x.subclasse) }], { h: 340, alterna: true, fv: 12, fmtY: (v) => nf2.format(v), fmtT: (v) => 'R$ ' + nf2.format(v), fmtL: (v) => nf2.format(v) }) + '<div class="or-leg"><span><i style="background:#118DFF"></i>Frota</span><span><i style="background:#E66C37"></i>Subclasse</span></div>' : '<div class="or-vazio">Selecione uma frota ou subclasse para visualizar</div>') + '</div></div>' +
      '<div class="or-nota">Considera gastos com peças, lubrificantes, filtros, pneus e mão de obra*. Os valores podem divergir da aba de orçamento, que desconsidera os gastos com lubrificantes. A frequência de atualização dos valores também pode variar.<br>*Considerado apenas a mão de obra de terceiros devido à ausência de informações sobre valores de mão de obra própria. Custos corrigidos pela inflação acumulada (Cost Drive). Equipamentos próprios e ativos.</div>';
  }

  /* ---------------------------------------------------------------- dados */

  function carregar(recarregar) {
    if (carregando) return;
    carregando = true;
    const st = $('or-status');
    st.hidden = false; st.classList.remove('is-error');
    st.textContent = recarregar ? 'Atualizando os dados...' : 'Carregando os dados de orçamento...';
    window.appData.orcBase(recarregar).then((r) => {
      carregando = false;
      if (!r.ok) { st.classList.add('is-error'); st.textContent = 'Não foi possível carregar os dados: ' + r.error; return; }
      B = VM.iniciar(r.base);
      classes = [...new Set(B.equipamentos.map((e) => e.classe).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
      st.hidden = true;
      renderAtual();
    }).catch((err) => { carregando = false; st.classList.add('is-error'); st.textContent = 'Erro inesperado: ' + String(err); });
  }

  function limpar() {
    if (S.view === 'compara') S.comp.emps = [1, 2, 3, 4];
    if (S.view === 'safra') S.sf = { emp: null, classe: null, sub: null, frota: null, status: null, lvlU: 0, lvlT: 0 };
    if (S.view === 'detalhe') { S.detalhe = { safra: '26/27', campo: 'Busca frota', conj: null, status: null, emp: null, sort: null }; detBuscaCtl.set(''); }
    if (S.view === 'crm') { S.crm = { emp: null, frota: null, classe: null, sub: null, nivel: 0 }; crmBuscaCtl.set(''); }
    renderAtual();
  }

  let montado = false;
  window.Orcamento = {
    open() {
      if (!montado) {
        montar(); montado = true;
        $('or-limpar').addEventListener('click', limpar);
      }
      setView('inicio');
      if (!B) carregar(false);
    }
  };
})();
