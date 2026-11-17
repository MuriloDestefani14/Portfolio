// Medidas e regras de filtro do painel "Orçamentos de Manutenção" (réplica das medidas DAX do .pbix
// "Orçamentos de Manutenção"). UMD: a tela carrega via <script> (window.OrcVM) e o Node via require.
// Entrada: a "base pública" de orcamento/calc.js (arrays compactos).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.OrcVM = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SAFRAS = ['24/25', '25/26', '26/27'];
  const CLASSES_EXCL_CRM = ['Area De Vivência', 'Diversos', 'Implemento Rodoviário', 'Implementos Agrícolas', 'Micro Trator', 'Motor Estacionário'];
  const n0 = (v) => (v == null ? 0 : v);
  const divide = (a, b) => (b == null || b === 0 || a == null ? null : a / b);

  // Prepara índices a partir da base pública.
  function iniciar(pub) {
    const porFrota = new Map();
    const eqs = pub.equipamentos.map((e) => e);
    eqs.forEach((e) => { if (!porFrota.has(e.frota)) porFrota.set(e.frota, e); });
    const nomeEmp = new Map(pub.empresas.map((e) => [e.cod, e.nome]));
    const cleDe = new Map();
    pub.cle.forEach((c) => { if (!cleDe.has(c[0])) cleDe.set(c[0], []); cleDe.get(c[0]).push(c); });
    // [s, ec, f, o, r, d, dr, st, stAc, dif]
    const fato = pub.fato.map((x) => ({ s: x[0], ec: x[1], f: x[2], o: x[3], r: x[4], d: x[5], dr: x[6], st: x[7], stAc: x[8], dif: x[9], fs: x[10] }));
    return {
      pub, equipamentos: eqs, porFrota, nomeEmp, cleDe, fato,
      s2425: pub.s2425.map((x) => ({ e: x[0], o: x[1], r: x[2] })),
      s2526: pub.s2526.map((x) => ({ e: x[0], o: x[1], r: x[2] })),
      acomp: fato.filter((x) => x.s === '26/27')
    };
  }

  const setDe = (v) => (v == null ? null : (v instanceof Set ? v : new Set(v)));

  // Filtros de contexto: emps = Empresas[Desc_uni] (códigos) ; bd = predicado sobre o cadastro (BD_SQL).
  function mantem(B, ctx, ec, frota, ehTabelaSemBD) {
    const emps = setDe(ctx.emps);
    if (emps && !emps.has(ec)) return false;
    if (ctx.bd && !ehTabelaSemBD) {
      const e = frota == null ? null : B.porFrota.get(frota);
      if (!e || !ctx.bd(e)) return false;
    }
    return true;
  }
  const soma = (arr, f) => arr.reduce((s, x) => s + n0(f(x)), 0);

  /* ============================ Compara safras ============================ */
  function comparaSafras(B, ctx) {
    const fato = B.fato.filter((x) => mantem(B, ctx, x.ec, x.f));
    const porSafra = {};
    SAFRAS.forEach((s) => {
      const rows = fato.filter((x) => x.s === s);
      porSafra[s] = { orcado: soma(rows, (x) => x.o), realizado: soma(rows, (x) => x.r), diferenca: soma(rows, (x) => n0(x.o) - n0(x.r)) };
    });
    // 'Safra 24/25' e 'Safra 25/26' não se ligam ao cadastro (só à empresa); 'Acompanhamento' sim.
    const s25 = B.s2425.filter((x) => !setDe(ctx.emps) || setDe(ctx.emps).has(x.e));
    const s26 = B.s2526.filter((x) => !setDe(ctx.emps) || setDe(ctx.emps).has(x.e));
    const ac = B.acomp.filter((x) => mantem(B, ctx, x.ec, x.f));
    const so25 = soma(s25, (x) => x.o); const sr25 = soma(s25, (x) => x.r);
    const so26 = soma(s26, (x) => x.o); const sr26 = soma(s26, (x) => x.r);
    const ao = soma(ac, (x) => x.o); const ar = soma(ac, (x) => x.r);
    return {
      porSafra,
      pctOrc2425: divide(so26 - so25, so25) || 0,
      pctReal2425: divide(sr26 - sr25, sr25) || 0,
      pctOrc2526: divide(ao - so26, so26) || 0,
      pctReal2526: divide(ar - sr26, sr26) || 0
    };
  }

  /* ============================== Safra 26/27 ============================== */
  function safra2627(B, ctx) {
    const ac = B.acomp.filter((x) => mantem(B, ctx, x.ec, x.f));
    const orcado = soma(ac, (x) => x.o);
    const realizado = soma(ac, (x) => x.r);
    const dist = (rows) => new Set(rows.map((x) => x.f == null ? 'f:' + x.fs : x.f)).size;
    const distFrota = (rows) => new Set(rows.map((x) => x.fs)).size;
    const qtd = (st) => distFrota(ac.filter((x) => x.stAc === st));
    const porEmpresa = new Map();
    ac.forEach((x) => {
      const nome = B.nomeEmp.get(x.ec) || null;
      const a = porEmpresa.get(nome) || { nome, orcado: 0, realizado: 0 };
      a.orcado += n0(x.o); a.realizado += n0(x.r);
      porEmpresa.set(nome, a);
    });
    const porClasse = new Map();
    ac.forEach((x) => {
      const e = x.f == null ? null : B.porFrota.get(x.f);
      const nome = e ? e.classe : null;
      const a = porClasse.get(nome) || { nome, orcado: 0, realizado: 0 };
      a.orcado += n0(x.o); a.realizado += n0(x.r);
      porClasse.set(nome, a);
    });
    return {
      orcado, realizado,
      saldo: soma(ac, (x) => x.dif),
      pctRestante: divide(orcado - realizado, orcado) || 0,
      qtdFrotas: distFrota(ac),
      bom: qtd('Bom'), atencao: qtd('Atenção'), critico: qtd('Crítico'), estouro: qtd('Estouro'),
      porEmpresa: [...porEmpresa.values()].filter((a) => a.nome != null).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
      topClasses: [...porClasse.values()].filter((a) => a.nome != null).sort((a, b) => b.orcado - a.orcado).slice(0, 5)
    };
  }

  /* ---- Safra 26/27 com filtro cruzado (clique nos gráficos/status) ----
     f = { emp (código), classe, sub, frota (Frota_conjunto), status }. Cada visual ignora o filtro da
     própria dimensão ("excl"), pra continuar mostrando as outras barras com a selecionada destacada. */
  function filtraAcomp(B, f, excl) {
    return B.acomp.filter((x) => {
      const e = x.f == null ? null : B.porFrota.get(x.f);
      if (!e || e.propTer !== 'Próprio') return false;
      if (f.emp != null && excl !== 'emp' && x.ec !== f.emp) return false;
      if (f.classe && excl !== 'classe' && e.classe !== f.classe) return false;
      if (f.sub && excl !== 'sub' && e.sub !== f.sub) return false;
      if (f.frota && excl !== 'frota' && e.conj !== f.frota) return false;
      if (f.status && excl !== 'status' && x.stAc !== f.status) return false;
      return true;
    });
  }
  function safraKpis(B, f) {
    const ac = filtraAcomp(B, f, null);
    const orcado = soma(ac, (x) => x.o); const realizado = soma(ac, (x) => x.r);
    return { orcado, realizado, saldo: soma(ac, (x) => x.dif), pctRestante: divide(orcado - realizado, orcado) || 0, qtdFrotas: new Set(ac.map((x) => x.fs)).size };
  }
  function safraStatus(B, f) {
    const ac = filtraAcomp(B, f, 'status');
    const q = (st) => new Set(ac.filter((x) => x.stAc === st).map((x) => x.fs)).size;
    return { Bom: q('Bom'), 'Atenção': q('Atenção'), 'Crítico': q('Crítico'), Estouro: q('Estouro') };
  }
  // Agrupa por uma dimensão (emp | classe | sub | frota) ignorando o filtro dela mesma.
  function safraGrupos(B, f, dim) {
    const ac = filtraAcomp(B, f, dim);
    const m = new Map();
    ac.forEach((x) => {
      const e = B.porFrota.get(x.f);
      const nome = dim === 'emp' ? B.nomeEmp.get(x.ec) : dim === 'classe' ? e.classe : dim === 'sub' ? e.sub : e.conj;
      if (nome == null) return;
      const a = m.get(nome) || { nome, orcado: 0, realizado: 0 };
      a.orcado += n0(x.o); a.realizado += n0(x.r);
      m.set(nome, a);
    });
    const arr = [...m.values()];
    return dim === 'emp' ? arr.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')) : arr.sort((a, b) => b.orcado - a.orcado);
  }

  /* CRM: comparativo de um nível (classe | sub | frota) ignorando os filtros dessa dimensão e das mais profundas. */
  function crmComparativo(B, f, dim) {
    const f2 = Object.assign({}, f);
    if (dim === 'classe') { f2.classe = null; f2.sub = null; f2.frota = null; }
    if (dim === 'sub') { f2.sub = null; f2.frota = null; }
    if (dim === 'frota') f2.frota = null;
    const frotas = frotasCrm(B, f2);
    const m = new Map();
    frotas.forEach((e) => {
      const k = dim === 'classe' ? e.classe : dim === 'sub' ? e.sub : e.conj;
      if (!m.has(k)) m.set(k, { fs: [], classe: e.classe, frota: e.frota });
      m.get(k).fs.push(e);
    });
    return [...m.entries()].map(([nome, g]) => ({ nome, classe: g.classe, frota: g.frota, y: rhr(somarCle(B, g.fs, null)) })).filter((x) => x.y != null).sort((a, b) => b.y - a.y);
  }

  // Dispersão CRM x Idade no mesmo nível do comparativo: 1 ponto por classe | subclasse | frota
  // (x = idade média das frotas do grupo, y = R$/hr corrigido do grupo).
  function crmPontos(B, f, dim, hoje) {
    const f2 = Object.assign({}, f);
    if (dim === 'classe') { f2.classe = null; f2.sub = null; f2.frota = null; }
    if (dim === 'sub') { f2.sub = null; f2.frota = null; }
    if (dim === 'frota') f2.frota = null;
    const ano = hoje.getFullYear();
    const m = new Map();
    frotasCrm(B, f2).forEach((e) => {
      const k = dim === 'classe' ? e.classe : dim === 'sub' ? e.sub : e.conj;
      if (!m.has(k)) m.set(k, { fs: [], classe: e.classe, frota: e.frota });
      m.get(k).fs.push(e);
    });
    return [...m.entries()].map(([nome, g]) => {
      const idades = g.fs.filter((e) => e.ano != null).map((e) => ano - e.ano);
      const x = idades.length ? idades.reduce((s, v) => s + v, 0) / idades.length : null;
      return { nome, classe: g.classe, frota: g.frota, x, y: rhr(somarCle(B, g.fs, null)) };
    }).filter((p) => p.x != null && p.y != null);
  }

  /* ============================ Análise detalhada ============================ */
  // Tabela de 'Fato Safras' agrupada por Safra, Empresa, Frota_conjunto e Status (sem totais).
  function detalhada(B, opts) {
    const emps = new Set([1, 2, 3, 4]);
    const grupos = new Map();
    B.fato.forEach((x) => {
      if (opts.safra && x.s !== opts.safra) return;
      if (!emps.has(x.ec)) return;
      const e = x.f == null ? null : B.porFrota.get(x.f);
      if (opts.conj != null && (!e || e.conj !== opts.conj)) return;
      if (opts.status != null && x.st !== opts.status) return;
      if (opts.emp != null && x.ec !== opts.emp) return;
      if (opts.busca === true && !e) return;
      const chave = [x.s, x.ec, e ? e.conj : '', x.st].join('|');
      const g = grupos.get(chave) || { safra: x.s, empresa: B.nomeEmp.get(x.ec), conj: e ? e.conj : '', orcado: 0, realizado: 0, saldo: 0, status: x.st };
      g.orcado += n0(x.o); g.realizado += n0(x.r); g.saldo += n0(x.o) - n0(x.r);
      grupos.set(chave, g);
    });
    return [...grupos.values()].sort((a, b) => a.empresa.localeCompare(b.empresa, 'pt-BR') || a.safra.localeCompare(b.safra) || a.conj.localeCompare(b.conj, 'pt-BR', { numeric: true }));
  }

  /* ================================ Custos e CRM ================================ */
  // Frotas do contexto (BD_SQL) da página: Ativo, classe fora da lista, Próprio + slicers/drill.
  function frotasCrm(B, f) {
    const emp = f.emps ? setDe(f.emps) : null;
    return B.equipamentos.filter((e) => {
      if (e.status !== 'Ativo') return false;
      if (!f.ignorarProprio && e.propTer !== 'Próprio') return false;
      if (!f.ignorarProprio && CLASSES_EXCL_CRM.indexOf(e.classe) !== -1) return false;
      if (emp && !emp.has(codEmpresa(B, e.emp))) return false;
      if (f.classe && e.classe !== f.classe) return false;
      if (f.sub && e.sub !== f.sub) return false;
      if (f.frota != null && e.frota !== f.frota) return false;
      return true;
    });
  }
  function codEmpresa(B, nome) {
    for (const [cod, n] of B.nomeEmp) if (n === nome) return cod;
    return null;
  }

  function somarCle(B, frotas, safra) {
    const a = { trab: null, custo: 0, corr: 0, lub: 0, pec: 0, ter: 0, fil: 0, pne: 0, n: 0 };
    frotas.forEach((e) => {
      const rows = B.cleDe.get(e.frota);
      if (!rows) return;
      rows.forEach((c) => {
        if (safra != null && c[1] !== safra) return;
        if (c[2] != null) a.trab = (a.trab || 0) + c[2];
        a.custo += c[3]; a.corr += c[4]; a.lub += c[5]; a.pec += c[6]; a.ter += c[7]; a.fil += c[8]; a.pne += c[9]; a.n++;
      });
    });
    return a;
  }
  const rhr = (a) => divide(a.corr, a.trab);

  function safrasComDados(B, frotas) {
    const s = new Set();
    frotas.forEach((e) => (B.cleDe.get(e.frota) || []).forEach((c) => s.add(c[1])));
    return [...s].sort((a, b) => a - b);
  }

  function crm(B, f, hoje) {
    const frotas = frotasCrm(B, f);
    const total = somarCle(B, frotas, null);
    const safras = safrasComDados(B, frotas);
    // Para a série "Frota": só existe quando exatamente 1 frota está no contexto.
    const umaFrota = frotas.length === 1;
    const todas = f.emps ? B.equipamentos.filter((e) => setDe(f.emps).has(codEmpresa(B, e.emp))) : B.equipamentos;
    const serie = safras.map((s) => {
      const comDado = frotas.filter((e) => (B.cleDe.get(e.frota) || []).some((c) => c[1] === s));
      const subs = new Set(comDado.map((e) => e.sub));
      let crmSub = null;
      if (subs.size === 1) {
        const sub = [...subs][0];
        crmSub = rhr(somarCle(B, todas.filter((e) => e.sub === sub), s));
      }
      const a = somarCle(B, frotas, s);
      return { safra: s, frota: umaFrota ? rhr(a) : null, subclasse: crmSub, custo: a.corr };
    });
    let acum = 0;
    const linhaCusto = safras.map((s) => { const a = somarCle(B, frotas, s); acum += a.corr; return { safra: s, acumulado: acum, custo: a.corr }; });
    const ano = hoje.getFullYear();
    const pontos = frotas.map((e) => {
      const y = rhr(somarCle(B, [e], null));
      return y == null || e.ano == null ? null : { frota: e.frota, conj: e.conj, classe: e.classe, sub: e.sub, x: ano - e.ano, y };
    }).filter(Boolean);
    const agrup = (chaveFn) => {
      const m = new Map();
      frotas.forEach((e) => { const k = chaveFn(e); if (!m.has(k)) m.set(k, []); m.get(k).push(e); });
      return [...m.entries()].map(([k, fs]) => ({ nome: k, y: rhr(somarCle(B, fs, null)) })).filter((x) => x.y != null).sort((a, b) => b.y - a.y);
    };
    let nivel = 'classe';
    if (f.classe && !f.sub) nivel = 'sub';
    if (f.classe && f.sub) nivel = 'frota';
    const comparativo = nivel === 'classe' ? agrup((e) => e.classe) : nivel === 'sub' ? agrup((e) => e.sub) : agrup((e) => e.conj);
    return {
      qtdFrotas: frotas.length,
      rhr: rhr(total),
      custoCorrigido: total.corr,
      aquisicao: frotas.reduce((s, e) => s + n0(e.preco), 0),
      linhaCrm: serie.filter((x) => x.frota != null || x.subclasse != null),
      linhaCusto,
      donut: [
        { nome: 'Lubrificantes', v: total.lub }, { nome: 'Peças', v: total.pec }, { nome: 'Serviços', v: total.ter },
        { nome: 'Filtros', v: total.fil }, { nome: 'Pneus', v: total.pne }
      ].sort((a, b) => b.v - a.v),
      pontos, comparativo, nivel,
      aviso: !umaFrota && !f.sub && !f.classe && !(new Set(frotas.map((e) => e.sub)).size === 1) ? 'Selecione uma frota ou subclasse para visualizar' : ''
    };
  }

  /* ====================== Benchmark CRM (página oculta do BI) ======================
     Não aparece no painel por enquanto (sem botão no BI), mas a lógica já está pronta e validada:
     faixas de referência por subclasse + CRM da empresa (R$/hr corrigido, +35% de mão de obra). */
  const BENCHMARK = [
    ['colhedora de cana picada', 0, 145.99, 'Baixo'], ['colhedora de cana picada', 146, 189.99, 'Regular'], ['colhedora de cana picada', 190, 266.59, 'Médio'], ['colhedora de cana picada', 266.6, 500, 'Alto'],
    ['tratores pequenos', 0, 31.39, 'Baixo'], ['tratores pequenos', 31.4, 39.99, 'Regular'], ['tratores pequenos', 40, 55.99, 'Médio'], ['tratores pequenos', 56, 10000, 'Alto'],
    ['tratores médios', 0, 31.39, 'Baixo'], ['tratores médios', 31.4, 39.99, 'Regular'], ['tratores médios', 40, 55.99, 'Médio'], ['tratores médios', 56, 10000, 'Alto'],
    ['tratores grandes', 0, 31.39, 'Baixo'], ['tratores grandes', 31.4, 39.99, 'Regular'], ['tratores grandes', 40, 55.99, 'Médio'], ['tratores grandes', 56, 10000, 'Alto']
  ];
  const FATOR_MO = 1.35;

  function benchmark(B, ctx, safra) {
    const subs = new Set(frotasCrm(B, { emps: ctx.emps, classe: ctx.classe, sub: ctx.sub, frota: ctx.frota, ignorarProprio: true }).map((e) => e.sub));
    if (subs.size !== 1) return null;
    const sub = [...subs][0];
    const faixas = BENCHMARK.filter((b) => b[0] === sub.toLowerCase());
    const pega = (nome, fn) => { const f = faixas.filter((b) => b[3] === nome); return f.length ? fn(f) : null; };
    const todas = B.equipamentos.filter((e) => e.sub === sub && (!ctx.emps || setDe(ctx.emps).has(codEmpresa(B, e.emp))));
    const empSub = rhr(somarCle(B, todas, safra));
    return {
      subclasse: sub,
      baixo: pega('Baixo', (f) => Math.max(...f.map((x) => x[2]))),
      medio: pega('Médio', (f) => Math.max(...f.map((x) => x[2]))),
      regular: pega('Regular', (f) => Math.max(...f.map((x) => x[2]))),
      alto: pega('Alto', (f) => Math.min(...f.map((x) => x[1]))),
      empSubclasse: empSub == null ? null : empSub * FATOR_MO,
      empFrota: (() => {
        const fs = frotasCrm(B, { emps: ctx.emps, classe: ctx.classe, sub: ctx.sub, frota: ctx.frota, ignorarProprio: true });
        const v = rhr(somarCle(B, fs, safra));
        return v == null ? null : v * FATOR_MO;
      })()
    };
  }

  /* ================================ Formatação ================================ */
  const nfM = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const nfI = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
  const nfP = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money = (v) => nfM.format(Object.is(v, -0) ? 0 : n0(v)).replace(/ /g, ' ');
  const pct = (v) => nfP.format(100 * n0(v)) + '%';
  const compact = (v) => {
    const a = Math.abs(n0(v));
    if (a >= 1e6) return 'R$ ' + (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' mi';
    if (a >= 1e3) return 'R$ ' + (v / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil';
    return 'R$ ' + nfI.format(n0(v));
  };

  return { SAFRAS, CLASSES_EXCL_CRM, iniciar, comparaSafras, safra2627, safraKpis, safraStatus, safraGrupos, crmComparativo, crmPontos, detalhada, crm, frotasCrm, benchmark, BENCHMARK, money, pct, compact, nfI };
});
