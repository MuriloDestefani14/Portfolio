// Painel de ordens de serviço de manutenção (demo): capa, Ordens abertas e Performance de manutenção.
// Números e filtros: viewmodel.js (window.OsVM). Aqui só montagem de HTML/SVG e interação.
(function () {
  'use strict';

  const VM = window.OsVM;
  const FMT = VM.fmt;
  const UNIT_COLOR = { Aurora: '#C8553D', Horizonte: '#2A7F8E', Savana: '#B8963E', Pradaria: '#6B5B95' };
  // Filtros de classe que o BI aplica em cada visual (cada um tem a sua lista).
  const CLASSES_BARRAS = ['Colhedora', 'Implementos Agrícolas', 'Onibus', 'Pulverizadores', 'Trator De Pneus', 'Veículos Leves', 'Caminhões'];
  const CLASSES_DISP = ['Caminhões', 'Carregadoras', 'Colhedora', 'Implementos Agrícolas', 'Pulverizadores', 'Trator De Pneus', 'Veículos Leves'];
  const COR_BARRA = '#1F6F78';
  const COR_MOTIVO = { Corretiva: '#C8553D', 'Manut Elétrica': '#E0A458', Preventiva: '#1F6F78', Preditiva: '#7FA650', Programada: '#6B5B95' };
  const PAL_EXTRA = ['#B8963E', '#D1495B', '#8FB5B0', '#8C6BB1', '#3E7CB1', '#2E6F57', '#C7A58F', '#7A8B99'];
  const DIMS_BARRAS = ['classe', 'sub', 'modelo'];
  const DIMS_ROSCA = ['mot', 'age'];
  const DIMS_DEC = ['modelo', 'mot', 'age', 'fil', 'classe', 'sub'];

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const $ = (id) => document.getElementById(id);
  const nf2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const nfq = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
  const compacto = (v) => {
    const a = Math.abs(v || 0);
    if (a >= 1e6) return (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' mi';
    if (a >= 1e3) return (v / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' mil';
    return Math.round(v || 0).toLocaleString('pt-BR');
  };

  let M = null;
  let carregando = false;
  let S = estadoInicial();

  function hojeISO() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function estadoInicial() {
    return {
      view: 'inicio', fil: [], safras: null, dd: null,
      ab: { sel: null, sort: null },
      pf: { param: 'disp', barPath: [], scPath: [], roPath: [], sel: null, tabSel: null, tabSort: null },
      drill: null
    };
  }

  const svg = (d) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  const IC = {
    inicio: svg('<path d="M4 11l8-6.5L20 11"/><path d="M6 10v9h12v-9"/>'),
    abertas: svg('<rect x="5" y="4.5" width="14" height="16" rx="2.5"/><path d="M9 4.5V3.5h6v1"/><path d="M8.5 10h7M8.5 14h5"/>'),
    perf: svg('<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 15l3.5-4 3 2.5L20 7"/>')
  };
  const VIEWS = ['inicio', 'abertas', 'perf'];

  /* --------------------------------------------------------------- casca */

  function goCard(view, titulo, desc, cor, n) {
    return '<button type="button" class="os-go" data-act="nav" data-go="' + view + '" style="--ac:' + cor + '"><i class="os-go-n">' + n + '</i>' +
      '<span class="os-go-ic">' + IC[view] + '</span><b>' + titulo + '</b><span class="os-go-d">' + desc + '</span></button>';
  }

  function montar() {
    $('os-root').innerHTML =
      '<div class="os-shell is-inicio" id="os-shell">' +
        '<div class="os-rail" id="os-rail">' +
          '<button type="button" class="os-tab is-home" data-act="nav" data-go="inicio" title="Início">' + IC.inicio + '</button>' +
          '<button type="button" class="os-tab" data-act="nav" data-go="abertas" title="Ordens abertas">' + IC.abertas + '</button>' +
          '<button type="button" class="os-tab" data-act="nav" data-go="perf" title="Performance de manutenção">' + IC.perf + '</button>' +
        '</div>' +
        '<div class="os-main">' +
          '<div class="os-status" id="os-status" hidden></div>' +
          '<div class="os-view" id="os-v-inicio">' +
            '<div class="os-capa">' +
              '<svg class="os-capa-art" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
                '<g fill="none" stroke="#FFFFFF" stroke-opacity=".07" stroke-width="2"><circle cx="1380" cy="330" r="150"/><circle cx="1380" cy="330" r="230"/><circle cx="1380" cy="330" r="310"/></g>' +
                '<path d="M1230 330A150 150 0 0 1 1530 330" fill="none" stroke="#E0A458" stroke-opacity=".55" stroke-width="14" stroke-linecap="round"/>' +
                '<path d="M1230 330A150 150 0 0 1 1440 192" fill="none" stroke="#6FC2B5" stroke-opacity=".7" stroke-width="14" stroke-linecap="round"/>' +
                '<line x1="1380" y1="330" x2="1452" y2="238" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="6" stroke-linecap="round"/><circle cx="1380" cy="330" r="12" fill="#FFFFFF" fill-opacity=".6"/>' +
                '<polyline points="1010,520 1090,470 1170,500 1250,430 1330,455 1410,380 1490,405" fill="none" stroke="#FFFFFF" stroke-opacity=".22" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
                '<g stroke="#FFFFFF" stroke-opacity=".05" stroke-width="2"><path d="M1000 540H1520"/><path d="M1000 460H1520"/></g>' +
              '</svg>' +
              '<div class="os-capa-txt">' +
                '<span class="os-capa-tag">Manutenção</span>' +
                '<h1>Ordens<br>de serviço</h1>' +
                '<i class="os-capa-bar"></i>' +
                '<p>Ordens abertas e performance da frota</p>' +
              '</div>' +
              '<div class="os-capa-nav">' +
                goCard('abertas', 'Ordens abertas', 'Fila de OS em andamento por unidade e safra', '#E0A458', '01') +
                goCard('perf', 'Performance de manutenção', 'Disponibilidade, MTBF, MTTR e horas de parada', '#6FC2B5', '02') +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="os-view" id="os-v-abertas" hidden></div>' +
          '<div class="os-view" id="os-v-perf" hidden></div>' +
        '</div>' +
      '</div>';
    const root = $('os-root');
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    document.addEventListener('click', (ev) => {
      if (S.dd && ev.target.isConnected && !ev.target.closest('#os-detail .os-dd')) { S.dd = null; renderAtual(); }
    });
  }

  function setView(v) {
    S.view = v; S.drill = null;
    $('os-shell').classList.toggle('is-inicio', v === 'inicio');
    VIEWS.forEach((k) => { $('os-v-' + k).hidden = k !== v; });
    document.querySelectorAll('#os-rail .os-tab').forEach((t) => t.classList.toggle('is-active', t.dataset.go === v));
    renderAtual();
  }

  function renderAtual() {
    if (!M) return;
    if (S.view === 'abertas') renderAbertas();
    else if (S.view === 'perf') renderPerf();
  }

  /* ----------------------------------------------------- filtros em comum */

  const safrasSel = () => S.safras || [M.ultima];
  const filSel = () => (S.fil.length ? S.fil : null);
  const rotSafras = (l) => (l.length === 1 ? l[0] : l.length + ' safras');

  function pillsUnidade() {
    return M.pub.filiais.map((f) => {
      const on = S.fil.indexOf(f.id) !== -1;
      return '<button type="button" class="os-pill' + (on ? ' is-active' : '') + '" data-act="uni" data-v="' + f.id + '" style="--pill-color:' + UNIT_COLOR[f.nome] + '">' + esc(f.nome) + '</button>';
    }).join('');
  }

  function ddSafra(chave, lista) {
    const aberto = S.dd === chave;
    return '<div class="os-dd"><button type="button" class="os-dd-b" data-act="ddToggle" data-dd="' + chave + '">' + esc(rotSafras(lista)) + ' <span>▾</span></button>' +
      '<div class="os-dd-p"' + (aberto ? '' : ' hidden') + '>' + M.safras.slice().reverse().map((s) =>
        '<label class="os-dd-i"><input type="checkbox" data-act="saf" data-dd="' + chave + '" data-v="' + esc(s) + '"' + (lista.indexOf(s) !== -1 ? ' checked' : '') + '> ' + esc(s) + '</label>').join('') + '</div></div>';
  }

  // antes/depois: HTML opcional na mesma faixa (Ordens abertas leva o cartão de quantidade e o botão Detalhar).
  function toolbarUnidadeSafra(antes, depois) {
    return '<div class="os-toolbar is-lr' + (antes ? ' has-kpi' : '') + '">' + (antes || '') + '<div class="os-filter is-row"><label>Unidade</label><div class="os-pills">' + pillsUnidade() + '</div></div>' +
      '<div class="os-filter is-row"><label>Safra</label>' + ddSafra('saf', safrasSel()) + '</div>' + (depois || '') + '</div>';
  }

  /* ---------------------------------------------------------- tabelas */

  // cols: [{k, t, v(row) -> valor de ordenação, f(row) -> texto, cls, bg(row) -> cor}]
  function ordenar(rows, cols, sort) {
    if (!sort) return rows;
    const c = cols.find((x) => x.k === sort.k);
    if (!c) return rows;
    const dir = sort.dir === 'desc' ? -1 : 1;
    return rows.slice().sort((a, b) => {
      const x = c.v(a); const y = c.v(b);
      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      return (typeof x === 'string' ? x.localeCompare(y, 'pt-BR') : x - y) * dir;
    });
  }

  function theadHtml(cols, sort, act) {
    return '<tr>' + cols.map((c) => '<th class="' + (c.cls || '') + '" data-act="' + act + '" data-k="' + c.k + '">' + esc(c.t) +
      (sort && sort.k === c.k ? (sort.dir === 'desc' ? ' ▼' : ' ▲') : '') + '</th>').join('') + '</tr>';
  }

  function tbodyHtml(cols, rows, rowAct, selFn, idFn) {
    return rows.map((r, i) => '<tr' + (rowAct ? ' data-act="' + rowAct + '" data-i="' + idFn(r, i) + '"' : '') + (selFn && selFn(r) ? ' class="is-sel"' : '') + '>' +
      cols.map((c) => '<td class="' + (c.cls || '') + '"' + (c.bg && c.bg(r) ? ' style="background:' + c.bg(r) + '"' : '') + '>' + esc(c.f(r)) + '</td>').join('') + '</tr>').join('');
  }

  // Escala de cor do BI: verde → amarelo → rosa (valores altos são ruins) ou o inverso.
  const C_VERDE = [184, 214, 201]; const C_AMAR = [241, 227, 180]; const C_ROSA = [226, 172, 152];
  function mix(a, b, t) { return a.map((x, i) => Math.round(x + (b[i] - x) * t)); }
  function escala(v, min, max, invertida) {
    if (v == null || max <= min) return null;
    const t = Math.max(0, Math.min(1, (v - min) / (max - min)));
    const [c0, c2] = invertida ? [C_ROSA, C_VERDE] : [C_VERDE, C_ROSA];
    const c = t < 0.5 ? mix(c0, C_AMAR, t * 2) : mix(C_AMAR, c2, (t - 0.5) * 2);
    return 'rgb(' + c.join(',') + ')';
  }
  const faixa = (vals) => { const v = vals.filter((x) => x != null); return v.length ? [Math.min(...v), Math.max(...v)] : [0, 1]; };

  /* ------------------------------------------------------ Ordens abertas */

  const nomeFil = (id) => (M.fil.get(id) || {}).nome || '';
  const abvFil = (id) => (M.fil.get(id) || {}).abv || '';
  const abvOfi = (id) => (M.ofi.get(id) || {}).abv || '';
  const colsAbertas = () => {
    return [
      { k: 'fil', t: 'Unidade', v: (r) => abvFil(r.fil), f: (r) => abvFil(r.fil), cls: 'ctr' },
      { k: 'os', t: 'OS', v: (r) => r.id, f: (r) => r.id, cls: 'ctr' },
      { k: 'ofi', t: 'Oficina', v: (r) => abvOfi(r.ofi), f: (r) => abvOfi(r.ofi) },
      { k: 'eq', t: 'Equipamento', v: (r) => r.modelo || '', f: (r) => r.modelo || '' },
      { k: 'mot', t: 'Motivo', v: (r) => VM.nomeMot(M, r.mot), f: (r) => VM.nomeMot(M, r.mot) },
      { k: 'age', t: 'Agente', v: (r) => VM.nomeAge(M, r.age), f: (r) => VM.nomeAge(M, r.age) },
      { k: 'tcom', t: 'Data comunicação', v: (r) => r.tCom, f: (r) => FMT.data(r.tCom), cls: 'ctr' },
      { k: 'tent', t: 'Data entrada', v: (r) => r.tEnt, f: (r) => FMT.data(r.tEnt), cls: 'ctr' },
      { k: 'hr', t: 'Horas manutenção', v: (r) => r.hr, f: (r) => (r.hr == null ? '' : nf2.format(r.hr / 3600)), cls: 'ctr', bg: null },
      { k: 'val', t: 'Valor total', v: (r) => r.val, f: (r) => (r.val ? nf2.format(r.val) : ''), cls: 'ctr', bg: null }
    ];
  };

  function aplicaEscalas(cols, rows) {
    cols.forEach((c) => {
      if (c.k === 'hr') { const [a, b] = faixa(rows.map((r) => r.hr)); c.bg = (r) => escala(r.hr, a, b); }
      if (c.k === 'val') { const [a, b] = faixa(rows.map((r) => (r.val || null))); c.bg = (r) => (r.val ? escala(r.val, a, b) : null); }
    });
  }

  function renderAbertas() {
    const rows = VM.filtrar(M, { safras: safrasSel(), fil: filSel(), ab: true });
    const cols = colsAbertas();
    aplicaEscalas(cols, rows);
    const ord = ordenar(rows.slice().sort((a, b) => (a.tCom || 0) - (b.tCom || 0)), cols, S.ab.sort);
    if (S.ab.sel != null && !rows.some((r) => r.id === S.ab.sel)) S.ab.sel = null;
    $('os-v-abertas').innerHTML =
      '<div class="os-pagetitle">Ordens abertas</div>' +
      toolbarUnidadeSafra(kpi('Qtde. OS em aberto', FMT.n0(rows.length), '#1F4F4B')) +
      '<div class="os-table-wrap"><table class="os-table"><thead>' + theadHtml(cols, S.ab.sort, 'sortAb') + '</thead><tbody>' +
      tbodyHtml(cols, ord, 'rowAb', (r) => r.id === S.ab.sel, (r) => r.id) + '</tbody></table></div>';
  }

  // Cartão com "Em aberto", ano anterior (LY) e variação. Cor do selo: verde = melhorou, vermelho = piorou
  // (OS, disponibilidade e MTBF: subir é bom; MTTR: cair é bom).
  function kpiLY(rot, valor, cor, aberto, ly, yoy, subirEBom) {
    let selo = '';
    if (yoy != null) {
      const bom = yoy === 0 ? null : (yoy > 0) === subirEBom;
      selo = '<span class="os-yoy" style="background:' + (bom == null ? '#6B7684' : bom ? '#3E8E62' : '#C8553D') + '">' + (yoy >= 0 ? '▲ ' : '▼ ') + nf2.format(Math.abs(yoy) * 100) + '%</span>';
    }
    return '<div class="os-kpi" style="--kc:' + cor + '"><div class="os-kpi-l">' + esc(rot) + '</div><div class="os-kpi-v">' + esc(valor) + '</div>' +
      '<div class="os-kpi-ly">' + (aberto != null ? '<span>Em aberto: <b>' + FMT.n0(aberto) + '</b></span>' : '') +
      '<span>LY: <b>' + esc(ly || '—') + '</b></span>' + selo + '</div></div>';
  }

  function kpi(rot, valor, cor) {
    return '<div class="os-kpi" style="--kc:' + (cor || '#1F4F4B') + '"><div class="os-kpi-l">' + esc(rot) + '</div><div class="os-kpi-v">' + esc(valor) + '</div></div>';
  }

  /* ------------------------------------------------ Performance de manutenção */

  const paramAtual = () => VM.PARAMS.find((p) => p.id === S.pf.param);

  // Filtro da página, ignorando a seleção feita no próprio visual (como o filtro cruzado do Power BI).
  function ctxF(exceto) {
    const f = { safras: safrasSel(), fil: filSel() };
    const sel = S.pf.sel;
    if (sel && sel.src !== exceto) Object.assign(f, sel.f);
    return f;
  }
  const comCaminho = (f, path) => { path.forEach((p) => { f[p.dim] = p.key; }); return f; };

  function cardHead(titulo, chart, nivel, max) {
    const podeDescer = S.pf.sel && S.pf.sel.src === chart && nivel < max;
    return '<div class="os-card-h"><span>' + esc(titulo) + '</span><span class="os-lvl">' +
      '<button type="button" class="os-lvl-btn" data-act="lvl" data-chart="' + chart + '" data-dir="up"' + (nivel > 0 ? '' : ' disabled') + ' title="Subir nível">↑</button>' +
      '<button type="button" class="os-lvl-btn" data-act="lvl" data-chart="' + chart + '" data-dir="down"' + (podeDescer ? '' : ' disabled') + ' title="Descer nível (aplica o item selecionado)">↓</button></span></div>';
  }

  function colsModelo(grupos) {
    const dis = faixa(grupos.map((g) => g.m.disp)); const val = faixa(grupos.map((g) => g.m.valor));
    return [
      { k: 'modelo', t: 'Modelo', v: (g) => g.rows[0].eqId || '', f: (g) => g.nome },
      { k: 'qtos', t: 'Qtde. OS', v: (g) => g.m.qtOS, f: (g) => FMT.n0(g.m.qtOS), cls: 'ctr' },
      { k: 'mtbf', t: 'MTBF', v: (g) => g.m.mtbf, f: (g) => FMT.hm(g.m.mtbf), cls: 'ctr' },
      { k: 'mttr', t: 'MTTR', v: (g) => g.m.mttr, f: (g) => FMT.hm(g.m.mttr), cls: 'ctr' },
      { k: 'hd', t: 'Horas disponíveis', v: (g) => g.m.hrDisp, f: (g) => (g.m.hrDisp == null ? '' : nf2.format(g.m.hrDisp / 3600)), cls: 'ctr' },
      { k: 'hm', t: 'Horas manutenção', v: (g) => g.m.hrManut, f: (g) => (g.m.hrManut == null ? '' : nf2.format(g.m.hrManut / 3600)), cls: 'ctr' },
      { k: 'disp', t: 'Disponibilidade', v: (g) => g.m.disp, f: (g) => FMT.pct(g.m.disp), cls: 'ctr', bg: (g) => (g.m.disp == null ? null : escala(g.m.disp, 0, 1, true)) },
      { k: 'val', t: 'Valor total', v: (g) => g.m.valor, f: (g) => (g.m.valor ? nf2.format(g.m.valor) : ''), cls: 'num', bg: (g) => (g.m.valor ? escala(g.m.valor, val[0], val[1]) : null) }
    ];
  }

  const modeloSelecionado = () => { const s = S.pf.sel; return s && s.f.modelo != null ? s.f.modelo : null; };

  function renderPerf() {
    const safras = safrasSel();
    const param = paramAtual();
    // cartões
    const fc = ctxF(null); const fsem = Object.assign({}, fc); delete fsem.safras;
    const cmp = VM.comparaAnoAnterior(M, fsem, safras);
    const mt = cmp.atual;
    // tabela por modelo
    const gTab = VM.agrupar(M, VM.filtrar(M, ctxF('tab')), 'modelo', safras).filter((g) => g.m.qtOS > 0);
    const colsT = colsModelo(gTab);
    const ordT = ordenar(gTab, colsT, S.pf.tabSort || { k: 'modelo', dir: 'asc' });
    S._tab = ordT;
    // barras (Classe > Subclasse > Modelo)
    const lb = S.pf.barPath.length; const dimB = DIMS_BARRAS[lb];
    const rowsB = VM.filtrar(M, comCaminho(ctxF('bar'), S.pf.barPath)).filter((r) => CLASSES_BARRAS.indexOf(r.classe) !== -1);
    const gBar = VM.agrupar(M, rowsB, dimB, safras).map((g) => ({ g, v: param.get(g.m) })).filter((x) => x.v != null).sort((a, b) => b.v - a.v);
    S._bar = gBar;
    // dispersão MTBF x MTTR por unidade
    const ls = S.pf.scPath.length; const dimS = DIMS_BARRAS[ls];
    const rowsS = VM.filtrar(M, comCaminho(ctxF('sc'), S.pf.scPath)).filter((r) => CLASSES_DISP.indexOf(r.classe) !== -1);
    const pts = VM.agrupar(M, rowsS, [dimS, 'fil'], safras).filter((g) => g.m.mtbf != null && g.m.mttr != null)
      .map((g) => ({ cat: g.ks[0], nome: g.rows[0][dimS === 'modelo' ? 'modelo' : dimS], fil: g.ks[1], x: g.m.mtbf / 3600, y: g.m.mttr / 3600, m: g.m }));
    S._pts = pts;
    // rosca de horas de manutenção (Motivo > Agente)
    const lr = S.pf.roPath.length; const dimR = DIMS_ROSCA[lr];
    const rowsR = VM.filtrar(M, comCaminho(ctxF('ro'), S.pf.roPath));
    const gRo = VM.agrupar(M, rowsR, dimR, safras).filter((g) => g.m.hrManut > 0).sort((a, b) => b.m.hrManut - a.m.hrManut);
    S._ro = gRo;

    const selTab = modeloSelecionado();
    $('os-v-perf').innerHTML =
      '<div class="os-pagetitle">Performance de manutenção</div>' + toolbarUnidadeSafra() +
      '<div class="os-perf">' +
        '<div class="os-perf-kpis">' +
          kpiLY('Qtde. OS', FMT.n0(mt.qtOS), '#1F4F4B', null, FMT.n0(cmp.ly && cmp.ly.qtOS), cmp.yoy.qtOS, true) +
          kpiLY('Disponibilidade', FMT.pct(mt.disp), '#7FA650', mt.abertas, FMT.pct(cmp.ly && cmp.ly.disp), cmp.yoy.disp, true) +
          kpiLY('MTBF', FMT.hm(mt.mtbf), '#E0A458', mt.abertas, FMT.hm(cmp.ly && cmp.ly.mtbf), cmp.yoy.mtbf, true) +
          kpiLY('MTTR', FMT.hm(mt.mttr), '#C8553D', mt.abertas, FMT.hm(cmp.ly && cmp.ly.mttr), cmp.yoy.mttr, false) + '</div>' +
        '<div class="os-card os-perf-tab"><div class="os-card-h"><span>Performance por modelo</span></div>' +
          '<div class="os-table-wrap os-inner"><table class="os-table"><thead>' + theadHtml(colsT, S.pf.tabSort || { k: 'modelo', dir: 'asc' }, 'sortTab') + '</thead><tbody>' +
          tbodyHtml(colsT, ordT, 'rowTab', (g) => selTab != null && g.key === selTab, (g, i) => i) + '</tbody></table></div></div>' +
        '<div class="os-card os-perf-bar">' + cardHead(param.nome + ' por ' + VM.DIMS[dimB].nome, 'bar', lb, 2) +
          '<div class="os-parambox"><select id="os-pf-param" class="os-select">' + VM.PARAMS.map((p) => '<option value="' + p.id + '"' + (p.id === param.id ? ' selected' : '') + '>' + esc(p.nome) + '</option>').join('') + '</select></div>' +
          barrasHtml(gBar, dimB, param) + '</div>' +
        '<div class="os-card os-perf-ro">' + cardHead('Horas de manutenção por ' + VM.DIMS[dimR].nome, 'ro', lr, 1) + roscaHtml(gRo, dimR) + '</div>' +
        '<div class="os-card os-perf-sc">' + cardHead('MTBF x MTTR por ' + VM.DIMS[dimS].nome, 'sc', ls, 2) + dispersaoSvg(pts, dimS) + '</div>' +
      '</div>';
  }

  function selItem(chart, dim, key) {
    const s = S.pf.sel;
    return s && s.src === chart && s.f[dim] === key;
  }

  function barrasHtml(grupos, dim, param) {
    if (!grupos.length) return '<div class="os-vazio">Sem dados para o filtro atual.</div>';
    const max = Math.max(...grupos.map((x) => x.v)) * 1.1 || 1;
    const sel = S.pf.sel && S.pf.sel.src === 'bar';
    return '<div class="os-hbars">' + grupos.map((x, i) => {
      const on = selItem('bar', dim, x.g.key);
      return '<div class="os-hb2' + (on ? ' is-sel' : sel ? ' is-dim' : '') + '" data-act="barSel" data-i="' + i + '" title="' + esc(x.g.nome) + '">' +
        '<span class="os-hb2-n">' + esc(x.g.nome) + '</span><span class="os-hb2-t"><i style="width:' + Math.max(1, (x.v / max) * 100) + '%;background:' + COR_BARRA + '"></i></span>' +
        '<b>' + esc(FMT.param(param, x.v)) + '</b></div>';
    }).join('') + '</div>';
  }

  function corMotivo(nome, i) { return COR_MOTIVO[nome] || PAL_EXTRA[i % PAL_EXTRA.length]; }

  function roscaHtml(grupos, dim) {
    if (!grupos.length) return '<div class="os-vazio">Sem dados para o filtro atual.</div>';
    const total = grupos.reduce((a, g) => a + g.m.hrManut, 0);
    const cx = 100; const cy = 100; const R = 92; const r = 56;
    let ang = -Math.PI / 2; let arcos = '';
    const sel = S.pf.sel && S.pf.sel.src === 'ro';
    grupos.forEach((g, i) => {
      const frac = g.m.hrManut / total; const a2 = ang + frac * Math.PI * 2;
      const cor = dim === 'mot' ? corMotivo(g.nome, i) : PAL_EXTRA[i % PAL_EXTRA.length];
      const on = selItem('ro', dim, g.key);
      const grande = a2 - ang > Math.PI ? 1 : 0;
      const p = (rr, a) => (cx + rr * Math.cos(a)).toFixed(2) + ' ' + (cy + rr * Math.sin(a)).toFixed(2);
      const d = frac > 0.9999
        ? 'M' + p(R, ang) + ' A' + R + ' ' + R + ' 0 1 1 ' + p(R, ang + Math.PI) + ' A' + R + ' ' + R + ' 0 1 1 ' + p(R, ang) + ' L' + p(r, ang) + ' A' + r + ' ' + r + ' 0 1 0 ' + p(r, ang + Math.PI) + ' A' + r + ' ' + r + ' 0 1 0 ' + p(r, ang) + 'Z'
        : 'M' + p(R, ang) + ' A' + R + ' ' + R + ' 0 ' + grande + ' 1 ' + p(R, a2) + ' L' + p(r, a2) + ' A' + r + ' ' + r + ' 0 ' + grande + ' 0 ' + p(r, ang) + 'Z';
      arcos += '<path class="os-slice" data-act="roSel" data-i="' + i + '" d="' + d + '" fill="' + cor + '"' + (sel && !on ? ' fill-opacity=".35"' : '') + '><title>' + esc(g.nome + ': ' + nfq.format(g.m.hrManut / 3600) + ' h (' + (frac * 100).toFixed(1).replace('.', ',') + '%)') + '</title></path>';
      ang = a2;
    });
    const legs = grupos.map((g, i) => {
      const cor = dim === 'mot' ? corMotivo(g.nome, i) : PAL_EXTRA[i % PAL_EXTRA.length];
      const on = selItem('ro', dim, g.key);
      return '<div class="os-donut-leg' + (on ? ' is-sel' : '') + '" data-act="roSel" data-i="' + i + '"><i style="background:' + cor + '"></i><b>' + esc(g.nome) + '</b><span>' + compacto(g.m.hrManut / 3600) + ' h · ' + (g.m.hrManut / total * 100).toFixed(1).replace('.', ',') + '%</span></div>';
    }).join('');
    return '<div class="os-donut"><svg viewBox="0 0 200 200">' + arcos + '<text x="100" y="97" text-anchor="middle" font-size="12" font-weight="700" fill="#7A8683">Horas</text><text x="100" y="116" text-anchor="middle" font-size="17" font-weight="800" fill="#22302E">' + compacto(total / 3600) + '</text></svg><div class="os-donut-legs">' + legs + '</div></div>';
  }

  function ticks(max) {
    if (!(max > 0)) return [0, 1];
    const bruto = max / 4; const mag = Math.pow(10, Math.floor(Math.log10(bruto)));
    const passo = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= bruto);
    const out = []; for (let v = 0; v <= max + passo * 0.999; v += passo) out.push(v);
    return out;
  }

  function dispersaoSvg(pts, dim) {
    if (!pts.length) return '<div class="os-vazio">Sem dados para o filtro atual.</div>';
    // no app do celular em pé (celular em pé) o gráfico é desenhado mais estreito, para o texto não ficar miúdo
    const vert = false;
    const W = vert ? 400 : 640; const H = vert ? 380 : 340; const L = 62; const R = 16; const T = 14; const Bt = 46;
    const tx = ticks(Math.max(...pts.map((p) => p.x))); const ty = ticks(Math.max(...pts.map((p) => p.y)));
    const mx = tx[tx.length - 1]; const my = ty[ty.length - 1];
    const X = (v) => L + (v / mx) * (W - L - R); const Y = (v) => H - Bt - (v / my) * (H - T - Bt);
    const fmtT = (v) => (v >= 1000 ? compacto(v) : nfq.format(v));
    let g = '';
    tx.forEach((v) => { g += '<line x1="' + X(v) + '" y1="' + T + '" x2="' + X(v) + '" y2="' + (H - Bt) + '" stroke="#EEF1F4"/><text x="' + X(v) + '" y="' + (H - Bt + 18) + '" text-anchor="middle" font-size="13" font-weight="800" fill="#22302E">' + fmtT(v) + '</text>'; });
    ty.forEach((v) => { g += '<line x1="' + L + '" y1="' + Y(v) + '" x2="' + (W - R) + '" y2="' + Y(v) + '" stroke="#EEF1F4"/><text x="' + (L - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="13" font-weight="800" fill="#22302E">' + fmtT(v) + '</text>'; });
    g += '<text x="' + (L + (W - L - R) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="13" font-weight="800" fill="#22302E">MTBF Horas</text>';
    g += '<text transform="translate(14 ' + (T + (H - T - Bt) / 2) + ') rotate(-90)" text-anchor="middle" font-size="13" font-weight="800" fill="#22302E">MTTR Horas</text>';
    const sel = S.pf.sel && S.pf.sel.src === 'sc';
    const rotular = pts.length <= 16;
    pts.forEach((p, i) => {
      const on = sel && S.pf.sel.f[dim] === p.cat && S.pf.sel.f.filUm === p.fil;
      const cor = UNIT_COLOR[nomeFil(p.fil)] || '#1F4F4B';
      g += '<g class="os-pt" data-act="scSel" data-i="' + i + '"' + (sel && !on ? ' opacity=".35"' : '') + '><circle cx="' + X(p.x) + '" cy="' + Y(p.y) + '" r="' + (on ? 9 : 7) + '" fill="' + cor + '" stroke="#fff" stroke-width="1.5"><title>' +
        esc(p.nome + ' — ' + nomeFil(p.fil) + '\nMTBF: ' + nf2.format(p.x) + ' h · MTTR: ' + nf2.format(p.y) + ' h\nQtde. OS: ' + FMT.n0(p.m.qtOS) + ' · Disponibilidade: ' + FMT.pct(p.m.disp)) + '</title></circle>' +
        (rotular ? '<text x="' + X(p.x) + '" y="' + (Y(p.y) - 11) + '" text-anchor="middle" font-size="11" font-weight="800" fill="#22302E">' + esc(String(p.nome).slice(0, 22)) + '</text>' : '') + '</g>';
    });
    const leg = M.pub.filiais.map((f) => '<span><i style="background:' + UNIT_COLOR[f.nome] + '"></i>' + esc(f.nome) + '</span>').join('');
    return '<div class="os-sc"><svg viewBox="0 0 ' + W + ' ' + H + '" class="os-chart">' + g + '</svg><div class="os-leg">' + leg + '</div></div>';
  }

  /* ----------------------------------------------------------- Interações */

  const mesmo = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  function alternaSel(src, f) {
    S.pf.sel = S.pf.sel && S.pf.sel.src === src && mesmo(S.pf.sel.f, f) ? null : { src, f };
  }
  const alterna = (sort, k, padrao) => (sort && sort.k === k ? { k, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { k, dir: padrao || 'asc' });

  function onClick(ev) {
    const el = ev.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'saf') return; // tratado no "change"
    const i = el.dataset.i != null ? Number(el.dataset.i) : null;
    const pf = S.pf;
    switch (act) {
      case 'nav': setView(el.dataset.go); return;
      case 'uni': {
        const id = Number(el.dataset.v); const k = S.fil.indexOf(id);
        if (k === -1) S.fil.push(id); else S.fil.splice(k, 1);
        break;
      }
      case 'ddToggle': S.dd = S.dd === el.dataset.dd ? null : el.dataset.dd; break;
      case 'sortAb': S.ab.sort = alterna(S.ab.sort, el.dataset.k); break;
      case 'rowAb': S.ab.sel = S.ab.sel === i ? null : i; break;
      case 'sortTab': pf.tabSort = alterna(pf.tabSort || { k: 'modelo', dir: 'asc' }, el.dataset.k); break;
      case 'rowTab': alternaSel('tab', { modelo: S._tab[i].key }); break;
      case 'barSel': { const f = comCaminho({}, pf.barPath); f[DIMS_BARRAS[pf.barPath.length]] = S._bar[i].g.key; alternaSel('bar', f); break; }
      case 'scSel': { const f = comCaminho({}, pf.scPath); const p = S._pts[i]; f[DIMS_BARRAS[pf.scPath.length]] = p.cat; f.filUm = p.fil; alternaSel('sc', f); break; }
      case 'roSel': { const f = comCaminho({}, pf.roPath); f[DIMS_ROSCA[pf.roPath.length]] = S._ro[i].key; alternaSel('ro', f); break; }
      case 'lvl': {
        const ch = el.dataset.chart; const path = ch === 'bar' ? pf.barPath : ch === 'sc' ? pf.scPath : pf.roPath;
        const dims = ch === 'ro' ? DIMS_ROSCA : DIMS_BARRAS;
        if (el.dataset.dir === 'up') path.pop();
        else if (pf.sel && pf.sel.src === ch) { const dim = dims[path.length]; path.push({ dim, key: pf.sel.f[dim] }); }
        if (pf.sel && pf.sel.src === ch) pf.sel = null;
        break;
      }
      default: return;
    }
    renderAtual();
  }

  function onChange(ev) {
    const el = ev.target;
    if (el.id === 'os-pf-param') { S.pf.param = el.value; renderAtual(); return; }
    const act = el.dataset && el.dataset.act;
    if (act === 'saf') {
      const dd = el.dataset.dd; const atual = S.safras || [M.ultima];
      const lista = atual.slice(); const k = lista.indexOf(el.dataset.v);
      if (k === -1) lista.push(el.dataset.v); else if (lista.length > 1) lista.splice(k, 1);
      lista.sort();
      S.safras = lista;
      renderAtual();
    }
  }

  /* --------------------------------------------------------------- carga */

  function carregar(recarregar) {
    if (carregando) return;
    carregando = true;
    const st = $('os-status');
    st.hidden = false; st.classList.remove('is-error');
    st.textContent = recarregar ? 'Atualizando os dados...' : 'Carregando os dados...';
    window.appData.osBase(recarregar).then((r) => {
      carregando = false;
      if (!r.ok) { st.classList.add('is-error'); st.textContent = 'Não foi possível carregar os dados: ' + r.error; return; }
      M = VM.iniciar(r.base);
      st.hidden = true;
      renderAtual();
    }).catch((err) => { carregando = false; st.classList.add('is-error'); st.textContent = 'Erro inesperado: ' + String(err); });
  }

  function limpar() {
    const v = S.view;
    S = estadoInicial(); S.view = v;
    renderAtual();
  }

  let montado = false;
  window.OsPanel = {
    open() {
      if (!montado) {
        montar(); montado = true;
        $('os-limpar').addEventListener('click', limpar);
      }
      S.drill = null;
      setView('inicio');
      if (!M) carregar(false);
    }
  };
})();
