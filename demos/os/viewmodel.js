// Medidas e regras de filtro do painel "OSs de Manutenção" (réplica das medidas DAX do .pbix "Manutencao").
// UMD: a tela carrega via <script> (window.OsVM) e o Node via require (validação). Entrada: a "base pública" de os/calc.js.
//
// Regras do BI replicadas (tudo em segundos; "HR" = ÷3600):
//  Qtde. OS          = OS corretivas (motivo 1) de equipamento (tipo 1)
//  Qtde. OS em Aberto= OS com situação 'A' (qualquer motivo/tipo)
//  Qtde. Equipamentos= equipamentos distintos com OS tipo 1 (qualquer motivo)
//  Hr. Manutencao    = Σ hrParada, tipo 1, motivo fora de {6 Reforma, 12 Melhoria/Adapt}
//  Hr. Disponivel    = (fim − início do calendário das safras escolhidas, fim limitado a HOJE) × Qtde. Equipamentos
//  Disponibilidade   = HrDisp ÷ (HrManut + HrDisp);  MTBF = HrDisp ÷ Qtde. OS;  MTTR = média de hrParada das corretivas
//  Valor total       = Σ qtde × valor das peças/serviços de terceiros da OS
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.OsVM = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DIA = 86400000;
  const MOT_CORRETIVA = 1;
  const MOT_FORA_MANUT = [6, 12];
  const SEM_NOME = '(Em branco)';

  const safraDe = (ms) => {
    if (ms == null) return null;
    const d = new Date(ms);
    const a = d.getUTCFullYear();
    return d.getUTCMonth() + 1 <= 3 ? (a - 1) + '/' + a : a + '/' + (a + 1);
  };
  const hojeLocal = () => { const d = new Date(); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); };

  function iniciar(pub, hojeMs) {
    const eq = pub.eq;
    const mot = new Map(pub.motivos.map((m) => [m.id, m.nome]));
    const age = new Map(pub.agentes.map((a) => [a.id, a.nome]));
    const ofi = new Map(pub.oficinas.map((o) => [o.id, o]));
    const fil = new Map(pub.filiais.map((f) => [f.id, f]));
    const rows = pub.os.map((o) => {
      const e = o[3] >= 0 ? eq[o[3]] : null;
      return {
        id: o[0], fil: o[1], tipo: o[2], eq: o[3], mot: o[4], ofi: o[5], age: o[6], ab: o[7] === 1,
        tCom: o[8], tEnt: o[9], tSai: o[10], hr: o[11], val: o[12], qt: o[13],
        safra: safraDe(o[9]),
        eqId: e ? e[0] : null, modelo: e ? e[1] : null, classe: e ? e[2] : null, sub: e ? e[3] : null
      };
    });
    const safras = [...new Set(rows.map((r) => r.safra).filter(Boolean))].sort();
    return { pub, rows, safras, ultima: safras[safras.length - 1], mot, age, ofi, fil, hoje: hojeMs == null ? hojeLocal() : hojeMs };
  }

  const nomeMot = (M, id) => (id == null ? SEM_NOME : M.mot.get(id) || SEM_NOME);
  const nomeAge = (M, id) => (id == null ? SEM_NOME : M.age.get(id) || SEM_NOME);

  // OS sem data de entrada caem na safra "em branco" do BI, que só entra quando a seleção é invertida (safra atual
  // + em branco); aqui elas acompanham a safra mais recente.
  function noSafra(M, r, safras) {
    if (!safras) return true;
    return r.safra == null ? safras.indexOf(M.ultima) !== -1 : safras.indexOf(r.safra) !== -1;
  }

  // f: { safras, fil:[ids], classe, sub, modelo, eqId, mot, age, osId, dtDe, dtAte, ab }
  function filtrar(M, f) {
    f = f || {};
    return M.rows.filter((r) => {
      if (f.safras && !noSafra(M, r, f.safras)) return false;
      if (f.fil && f.fil.length && f.fil.indexOf(r.fil) === -1) return false;
      if (f.filUm != null && r.fil !== f.filUm) return false;
      if (f.classe != null && r.classe !== f.classe) return false;
      if (f.sub != null && r.sub !== f.sub) return false;
      if (f.modelo != null && r.modelo !== f.modelo) return false;
      if (f.mot != null && r.mot !== f.mot) return false;
      if (f.age != null && r.age !== f.age) return false;
      if (f.osId != null && r.id !== f.osId) return false;
      if (f.ab && !r.ab) return false;
      if (f.dtDe != null && (r.tEnt == null || r.tEnt < f.dtDe)) return false;
      if (f.dtAte != null && (r.tEnt == null || r.tEnt >= f.dtAte + DIA)) return false;
      return true;
    });
  }

  // Dias do calendário no contexto de safras (início da 1ª, fim da última, limitado a hoje).
  function diasCalendario(M, safras) {
    const pub = M.pub;
    if (!safras || !safras.length || pub.calIni == null) return 0;
    let ini = Infinity; let fim = -Infinity;
    safras.forEach((s) => {
      const a = Number(s.slice(0, 4));
      const i = Math.max(Date.UTC(a, 3, 1), pub.calIni);
      const f = Math.min(Date.UTC(a + 1, 2, 31), pub.calFim);
      if (i <= f) { ini = Math.min(ini, i); fim = Math.max(fim, f); }
    });
    if (ini === Infinity) return 0;
    return Math.max(0, (Math.min(fim, M.hoje) - ini) / DIA);
  }

  function medidas(M, rows, safras, diasOv) {
    let qtOS = 0; let ab = 0; let hrManut = 0; let temManut = false; let somaCorr = 0; let valor = 0;
    const eqs = new Set();
    rows.forEach((r) => {
      if (r.ab) ab++;
      valor += r.val || 0;
      if (r.tipo !== 1) return;
      eqs.add(r.eq);
      if (r.mot == null || MOT_FORA_MANUT.indexOf(r.mot) === -1) { hrManut += r.hr || 0; temManut = true; }
      if (r.mot === MOT_CORRETIVA) { qtOS++; somaCorr += r.hr || 0; }
    });
    const nEq = eqs.size;
    const hrDisp = nEq ? (diasOv != null ? diasOv : diasCalendario(M, safras)) * 86400 * nEq : null;
    const manut = temManut ? hrManut : null;
    const den = (manut || 0) + (hrDisp || 0);
    return {
      qtOS: qtOS || null, abertas: ab || null, nEq: nEq || null,
      hrManut: manut, hrDisp, valor: valor || null, n: rows.length,
      disp: hrDisp == null || !den ? null : hrDisp / den,
      mtbf: hrDisp == null || !qtOS ? null : hrDisp / qtOS,
      mttr: qtOS ? somaCorr / qtOS : null
    };
  }

  // Mesmo dia um ano antes (29/fev vira 28/fev), como o DATEADD(-1, YEAR) do BI.
  function menosUmAno(ms) {
    const d = new Date(ms); const a = d.getUTCFullYear() - 1; const m = d.getUTCMonth(); const dia = d.getUTCDate();
    const r = Date.UTC(a, m, dia);
    return new Date(r).getUTCMonth() !== m ? Date.UTC(a, m, dia - 1) : r;
  }

  // Ano anterior (LY) e variação (YoY). f = filtros sem 'safras'. O período do LY é o das safras escolhidas até a
  // última entrada de OS no contexto, deslocado 1 ano (igual às medidas "... LY" do BI).
  function comparaAnoAnterior(M, f, safras) {
    const pub = M.pub;
    const rowsAtuais = filtrar(M, Object.assign({}, f, { safras }));
    let ultima = null;
    rowsAtuais.forEach((r) => { if (r.tEnt != null && (ultima == null || r.tEnt > ultima)) ultima = r.tEnt; });
    const atual = medidas(M, rowsAtuais, safras);
    if (ultima == null || pub.calIni == null) return { atual, ly: null, yoy: {} };
    const ult = ultima - (ultima % DIA);
    const faixas = [];
    safras.forEach((sf) => {
      const a = Number(sf.slice(0, 4));
      const ini = Math.max(Date.UTC(a, 3, 1), pub.calIni);
      const fim = Math.min(Date.UTC(a + 1, 2, 31), pub.calFim, ult);
      if (ini > fim) return;
      const i2 = menosUmAno(ini); const f2 = menosUmAno(fim);
      const i3 = Math.max(i2, pub.calIni);
      if (i3 <= f2) faixas.push([i3, f2]);
    });
    if (!faixas.length) return { atual, ly: null, yoy: {} };
    const rowsLY = filtrar(M, f).filter((r) => r.tEnt != null && faixas.some((g) => r.tEnt >= g[0] && r.tEnt < g[1] + DIA));
    const ini = Math.min(...faixas.map((g) => g[0])); const fim = Math.min(Math.max(...faixas.map((g) => g[1])), M.hoje);
    const ly = medidas(M, rowsLY, null, Math.max(0, (fim - ini) / DIA));
    const v = (x, y) => (x == null || y == null || y === 0 ? null : (x - y) / y);
    return { atual, ly, yoy: { qtOS: v(atual.qtOS, ly.qtOS), disp: v(atual.disp, ly.disp), mtbf: v(atual.mtbf, ly.mtbf), mttr: v(atual.mttr, ly.mttr) } };
  }

  const DIMS = {
    classe: { nome: 'Classe', key: (r) => r.classe, rot: (M, k) => k },
    sub: { nome: 'Subclasse', key: (r) => r.sub, rot: (M, k) => k },
    modelo: { nome: 'Modelo', key: (r) => r.modelo, rot: (M, k) => k },
    mot: { nome: 'Motivo', key: (r) => r.mot, rot: (M, k) => nomeMot(M, k) },
    age: { nome: 'Agente', key: (r) => r.age, rot: (M, k) => nomeAge(M, k) },
    fil: { nome: 'Filial', key: (r) => r.fil, rot: (M, k) => (M.fil.get(k) || {}).nome || SEM_NOME },
    ofi: { nome: 'Oficina', key: (r) => r.ofi, rot: (M, k) => (M.ofi.get(k) || {}).abv || SEM_NOME }
  };

  // Agrupa as linhas por dimensão e calcula as medidas de cada grupo. Ordem natural: pelo nome.
  function agrupar(M, rows, dims, safras) {
    const d = typeof dims === 'string' ? [dims] : dims;
    const mp = new Map();
    rows.forEach((r) => {
      const ks = d.map((x) => DIMS[x].key(r));
      const k = ks.join('\u0001');
      if (!mp.has(k)) mp.set(k, { ks, rows: [] });
      mp.get(k).rows.push(r);
    });
    return [...mp.values()].map((g) => ({
      ks: g.ks, key: g.ks[g.ks.length - 1], nome: DIMS[d[d.length - 1]].rot(M, g.ks[g.ks.length - 1]),
      rows: g.rows, m: medidas(M, g.rows, safras)
    }));
  }

  // Medidas selecionáveis (parâmetro de campos do BI): Disponibilidade / MTBF HR / MTTR HR / Qtde. OS.
  const PARAMS = [
    { id: 'disp', nome: 'Disponibilidade', get: (m) => m.disp, pct: true },
    { id: 'mtbf', nome: 'MTBF', get: (m) => (m.mtbf == null ? null : m.mtbf / 3600), hr: true },
    { id: 'mttr', nome: 'MTTR', get: (m) => (m.mttr == null ? null : m.mttr / 3600), hr: true },
    { id: 'qtos', nome: 'Qtde. OS', get: (m) => m.qtOS, int: true }
  ];

  const p2 = (n) => String(n).padStart(2, '0');
  const nfN = (d) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const nf0 = nfN(0); const nf2 = nfN(2);
  const fmt = {
    n0: (v) => (v == null ? '' : nf0.format(v)),
    n2: (v) => (v == null ? '' : nf2.format(v)),
    pct: (v) => (v == null ? '' : nf2.format(v * 100) + '%'),
    // MTBF/MTTR: "HHH:MM" (horas acumuladas, sem dias)
    hm: (s) => (s == null ? '' : p2(Math.floor(s / 3600)) + ':' + p2(Math.floor((s % 3600) / 60))),
    // Disponível/Manutenção: "xD HH:MM"
    dhm: (s, soDias) => {
      if (s == null) return '';
      const d = Math.floor(s / 86400);
      const hh = p2(Math.floor((s % 86400) / 3600)) + ':' + p2(Math.floor((s % 3600) / 60));
      return soDias && d < 1 ? hh : d + 'D ' + hh;
    },
    data: (ms) => {
      if (ms == null) return '';
      const d = new Date(ms);
      return p2(d.getUTCDate()) + '/' + p2(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear() + ' ' + p2(d.getUTCHours()) + ':' + p2(d.getUTCMinutes());
    },
    dia: (ms) => {
      if (ms == null) return '';
      const d = new Date(ms);
      return p2(d.getUTCDate()) + '/' + p2(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear();
    },
    param: (p, v) => (v == null ? '' : p.pct ? fmt.pct(v) : p.int ? nf0.format(v) : nf2.format(v))
  };

  return { iniciar, filtrar, medidas, comparaAnoAnterior, menosUmAno, agrupar, diasCalendario, DIMS, PARAMS, fmt, safraDe, hojeLocal, SEM_NOME, nomeMot, nomeAge };
});
