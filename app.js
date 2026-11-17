/* Monta o site a partir de conteudo.js. Sem dependências externas. */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ICONES_AREA = {
  bi: '<path d="M3 17l5-5 4 4 8-9"/><path d="M15 7h5v5"/>',
  ia: '<rect x="6" y="6" width="12" height="12" rx="2.5"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/><path d="M10 12h4"/>',
  auto: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/><path d="M10 6.5h4a3 3 0 0 1 3 3V14"/>'
};
function montarAreas() {
  $('#areas').innerHTML = AREAS.map((a) =>
    '<div class="area"><i class="ai-' + esc(a.icone) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ICONES_AREA[a.icone] || ICONES_AREA.bi) + '</svg></i>' +
    '<div><h3>' + esc(a.titulo) + '</h3><p>' + a.tags.map(esc).join(' · ') + '</p></div></div>').join('');
}

/* ---------- Sobre ---------- */
function montarSobre() {
  const ini = PERFIL.sigla || PERFIL.nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  $('#mono').textContent = ini; $('#logoNome').textContent = PERFIL.nome;
  $('#hCargo').textContent = PERFIL.cargo;
  $('#hTitulo').textContent = PERFIL.titulo || PERFIL.nome;
  // cada item é uma peça que não quebra no meio; no computador as linhas seguem a quebra de linha do conteudo.js, no celular quebram sozinhas em até 2 linhas equilibradas
  const gruposHl = PERFIL.headline.split('\n');
  $('#hHeadline').innerHTML = gruposHl.map((g, gi) => {
    const itens = g.split('|').map((t) => t.trim()).filter(Boolean);
    return itens.map((t, i) => '<span class="hl-i">' + esc(t) + (i < itens.length - 1 ? ' |' : (gi < gruposHl.length - 1 ? '<span class="hl-pipe"> |</span>' : '')) + '</span>').join(' ');
  }).join(' <br class="hl-br">'); $('#hResumo').textContent = PERFIL.resumo;
  const L = PERFIL.links;
  $('#hLinks').innerHTML =
    '<a class="btn" href="#projetos">Projetos</a><a class="btn ghost" href="#paineis">Painéis BI</a>' +
    (PERFIL.curriculo ? '<a class="btn ghost" target="_blank" rel="noopener" href="' + esc(PERFIL.curriculo) + '">Currículo</a>' : '') +
    (L.linkedin ? '<a class="btn ghost" target="_blank" rel="noopener" href="' + esc(L.linkedin) + '">LinkedIn</a>' : '') +
    (L.github ? '<a class="btn ghost" target="_blank" rel="noopener" href="' + esc(L.github) + '">GitHub</a>' : '') +
    (L.email ? '<a class="btn ghost" href="mailto:' + esc(L.email) + '">E-mail</a>' : '');
  $('#fLocal').textContent = PERFIL.local && !PERFIL.local.startsWith('[') ? PERFIL.local : '';
  $('#skills').innerHTML = HABILIDADES.map((g) => '<div class="sk"><h3>' + esc(g.grupo) + '</h3><div class="chips">' + g.itens.map((i) => '<span class="chip">' + esc(i) + '</span>').join('') + '</div></div>').join('');
  $('#exp').innerHTML = EXPERIENCIA.map((e) => '<div class="job"><h3>' + esc(e.cargo) + '</h3><div class="meta">' + [e.empresa, e.periodo].filter(Boolean).map(esc).join(' · ') + '</div><ul>' + e.pontos.map((p) => '<li>' + esc(p) + '</li>').join('') + '</ul></div>').join('');
}

/* ---------- Projetos e painéis ---------- */
const galerias = {};
function cardProjeto(p) {
  galerias[p.id] = p.prints;
  const v0 = p.videos[0];
  return '<article class="proj" id="' + p.id + '" data-id="' + p.id + '">' +
    '<div class="proj-head">' +
    '<h2>' + esc(p.titulo) + '</h2></div>' +
    '<div class="media">' +
    (p.videos.length > 1 ? '<div class="vtabs">' + p.videos.map((v, i) => '<button type="button" class="' + (i === 0 ? 'on' : '') + '" data-v="' + i + '">' + esc(v.rotulo) + '</button>').join('') + '</div>' : '') +
    '<div class="vwrap" data-ar="' + v0.proporcao + '"></div>' +
    '<div class="thumbs">' + p.prints.map((pr, i) => '<button type="button" class="th" data-i="' + i + '" aria-label="' + esc(pr[1]) + '"><img loading="lazy" src="' + esc(pr[0]) + '" alt="' + esc(pr[1]) + '"></button>').join('') + '</div>' +
    '</div>' +
    '<div class="proj-txt"><p class="d">' + esc(p.descricao) + '</p>' +
    '<ul>' + p.pontos.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
    '<div class="stack"><b>Tecnologias:</b> ' + esc(p.stack.join(' · ')) + '</div>' +
    '<div class="btns"><a class="btn" href="' + esc(p.demo) + '?v=' + (window.VERSAO || Date.now()) + '">' + esc(p.demoRotulo) + ' →</a>' +
    (p.codigo ? '<a class="btn ghost" target="_blank" rel="noopener" href="' + esc(p.codigo) + '">Ver código</a>' : '') + '</div></div>' +
    '</article>';
}
function tocar(card, p, idx) {
  const v = p.videos[idx], w = $('.vwrap', card);
  const tall = (() => { const [a, b] = v.proporcao.split('/').map(Number); return b > a; })();
  w.className = 'vwrap' + (tall ? ' tall' : ''); w.style.aspectRatio = tall ? '' : v.proporcao.replace('/', ' / ');
  w.innerHTML = '<video muted loop playsinline controls preload="metadata" poster="' + esc(v.poster) + '"><source src="' + esc(v.src) + '" type="video/webm"></video>';
  const el = $('video', w);
  el.querySelector('source').addEventListener('error', () => { w.innerHTML = '<img class="fb" src="' + esc(v.gif) + '" alt="' + esc(v.rotulo) + '">'; });
  if (card._io) card._io.disconnect();
  if ('IntersectionObserver' in window) {
    card._io = new IntersectionObserver((es) => es.forEach((e) => { const vd = $('video', card); if (!vd) return; if (e.isIntersecting) vd.play().catch(() => {}); else vd.pause(); }), { threshold: 0.45 });
    card._io.observe(w);
  }
}
function montarLista(id, lista) {
  const raiz = $('#' + id); raiz.innerHTML = lista.map(cardProjeto).join('');
  raiz.querySelectorAll('.proj').forEach((card) => {
    const p = lista.find((x) => x.id === card.dataset.id);
    tocar(card, p, 0);
    card.addEventListener('click', (e) => {
      const t = e.target.closest('.th'); if (t) { abrirLb(p.id, Number(t.dataset.i)); return; }
      const b = e.target.closest('.vtabs button'); if (b) { card.querySelectorAll('.vtabs button').forEach((x) => x.classList.toggle('on', x === b)); tocar(card, p, Number(b.dataset.v)); }
    });
  });
}

/* ---------- Automações ---------- */
function montarAuto() {
  $('#lista-auto').innerHTML = AUTOMACOES.map((a) =>
    '<article class="acard"><h2>' + esc(a.titulo) + '</h2><p>' + esc(a.descricao) + '</p><div class="flow">' +
    a.fluxo.map((f, i) => '<div class="step"><i>' + (i + 1) + '</i><div><b>' + esc(f[0]) + '</b><span>' + esc(f[1]) + '</span></div></div>').join('') +
    '</div><div class="stack"><b>Tecnologias:</b> ' + esc(a.stack.join(' · ')) + '</div></article>').join('');
}

/* ---------- Lightbox ---------- */
let lbId = null, lbI = 0;
function abrirLb(id, i) { lbId = id; lbI = i; pintarLb(); $('#lb').hidden = false; document.body.style.overflow = 'hidden'; }
function pintarLb() { const g = galerias[lbId], it = g[lbI]; $('#lbImg').src = it[0]; $('#lbImg').alt = it[1]; $('#lbCap').textContent = it[1] + '  ·  ' + (lbI + 1) + ' de ' + g.length; }
function fecharLb() { $('#lb').hidden = true; document.body.style.overflow = ''; }
function passoLb(d) { const n = galerias[lbId].length; lbI = (lbI + d + n) % n; pintarLb(); }
$('#lbX').onclick = fecharLb; $('#lbP').onclick = () => passoLb(-1); $('#lbN').onclick = () => passoLb(1);
$('#lb').addEventListener('click', (e) => { if (e.target.id === 'lb') fecharLb(); });
document.addEventListener('keydown', (e) => { if ($('#lb').hidden) return; if (e.key === 'Escape') fecharLb(); if (e.key === 'ArrowLeft') passoLb(-1); if (e.key === 'ArrowRight') passoLb(1); });

/* ---------- Abas (por hash) ---------- */
const ABAS = ['sobre', 'projetos', 'paineis', 'automacoes'];
const pilha = [location.hash || '#sobre'];   // abas visitadas, para o botão voltar
$('#voltar').addEventListener('click', () => { if (pilha.length > 1) history.back(); else location.hash = '#sobre'; });
function rota() {
  const h = (location.hash || '#sobre').slice(1);
  const aba = ABAS.includes(h) ? h : PROJETOS.some((p) => p.id === h) ? 'projetos' : PAINEIS.some((p) => p.id === h) ? 'paineis' : 'sobre';
  ABAS.forEach((a) => { $('#v-' + a).hidden = a !== aba; });
  document.body.classList.toggle('aba-fit', aba !== 'sobre');
  document.body.classList.toggle('aba-sobre', aba === 'sobre');
  document.querySelectorAll('.tabs a').forEach((t) => t.classList.toggle('on', t.dataset.tab === aba));
  document.title = (aba === 'sobre' ? 'Portfólio' : $('.tabs a.on').textContent + ' · Portfólio') + ' · ' + PERFIL.nome;
  if (!ABAS.includes(h) && document.getElementById(h)) setTimeout(() => document.getElementById(h).scrollIntoView({ block: 'start' }), 60);
  else window.scrollTo(0, 0);
  $('#voltar').hidden = aba === 'sobre';   // a seta só aparece nas outras abas
  if (aba === 'sobre') animarSobre();
}
/* ---------- Abertura: a página carrega de cima para baixo, em fade (ritmo definido no CSS) ---------- */
const reduzMovimento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function animarSobre() {   // reinicia a cascata toda vez que a primeira aba é exibida
  if (reduzMovimento()) return;
  const r = document.documentElement; r.classList.remove('intro'); void r.offsetWidth; r.classList.add('intro');
}
function prepararIntro() {
  const dividir = (el, classe, passo, inicio) => {
    const palavras = el.textContent.trim().split(/\s+/); let n = 0; el.textContent = '';
    palavras.forEach((p, i) => {
      const w = document.createElement('span'); w.className = 'wd';
      if (classe === 'ch') { [...p].forEach((c) => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; s.style.setProperty('--d', (inicio + n++ * passo).toFixed(3) + 's'); w.appendChild(s); }); }
      else { w.className = 'wd w'; w.textContent = p; w.style.setProperty('--d', (inicio + n++ * passo).toFixed(3) + 's'); }
      el.appendChild(w); if (i < palavras.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return n;
  };
  dividir($('#hTitulo'), 'ch', 0.013, 0.13);    // nome: letra por letra
  dividir($('#hResumo'), 'w', 0.005, 0.32);    // resumo: palavra por palavra
}
montarSobre(); prepararIntro(); montarAreas(); montarLista('lista-projetos', PROJETOS); montarLista('lista-paineis', PAINEIS); montarAuto();
window.addEventListener('hashchange', () => {
  const h = location.hash || '#sobre';
  if (pilha.length > 1 && pilha[pilha.length - 2] === h) pilha.pop(); else if (pilha[pilha.length - 1] !== h) pilha.push(h);
  rota(); revelar();
}); rota(); revelar();

/* ---------- Animação ao rolar: elementos surgem quando entram na tela ---------- */
function revelar() {   // abas de projetos, painéis e automações: os blocos descem em fade a cada visita
  if (reduzMovimento() || !('IntersectionObserver' in window)) return;
  const alvos = document.querySelectorAll('.view:not([hidden]):not(#v-sobre) :is(.block, .proj, .acard, .page-h, .sk, .job)');
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; io.unobserve(e.target);
    const el = e.target; el.classList.add('in');
    el._fim = setTimeout(() => el.classList.remove('rv', 'in'), 800 + (parseFloat(el.style.transitionDelay) || 0) * 1000);
  }), { threshold: 0.12 });
  alvos.forEach((el, i) => {
    clearTimeout(el._fim);
    el.style.transition = 'none'; el.classList.remove('in'); el.classList.add('rv', 'rv-ok'); void el.offsetWidth; el.style.transition = '';
    el.style.transitionDelay = ((i % 4) * 0.07) + 's'; io.observe(el);
  });
}

/* ---------- Demos no celular: abrem em tela cheia e, quando o aparelho permite, deitadas ---------- */
const ehCelular = () => matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 600;
// A tela cheia pedida pelo navegador faz o Android mostrar o aviso "para sair da tela cheia, arraste..." e esse aviso não pode ser escondido.
// Por isso fica desligada (false). No aplicativo instalado (manifest com display "fullscreen") a tela já é cheia, sem aviso nenhum.
const TELA_CHEIA_DEMOS = false;
let demoOv = null, demoEmTelaCheia = false;
function ajustarDemo() {   // a demo é desenhada para 1280 px de largura (layout de computador) e é reduzida para caber na tela
  if (!demoOv) return;
  const f = demoOv.querySelector('iframe'), W = innerWidth, H = innerHeight, retrato = H > W;
  const lado = retrato ? H : W, curto = retrato ? W : H, k = lado / 1280;
  f.style.width = '1280px'; f.style.height = Math.ceil(curto / k) + 'px';
  // celular em pé: a demo é girada 90° e já aparece deitada, ocupando a tela toda; ao girar o aparelho, volta ao normal
  f.style.transform = retrato ? 'translateX(' + W + 'px) rotate(90deg) scale(' + k + ')' : 'scale(' + k + ')';
}
function abrirDemo(url) {
  demoOv = document.createElement('div'); demoOv.className = 'demo-ov';
  demoOv.innerHTML = '<iframe src="' + esc(url) + '" title="Demonstração"></iframe>';
  document.body.appendChild(demoOv); document.body.style.overflow = 'hidden'; ajustarDemo();
  history.pushState({ demo: 1 }, '', location.href);
  // tela cheia e trava na horizontal, no mesmo toque (Android/Chrome). O aviso "para sair da tela cheia..." é do próprio navegador e não dá para esconder.
  const instalado = matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (instalado) {   // aplicativo instalado: já não há barra do navegador nem aviso; só trava na horizontal
    try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {}
  } else if (TELA_CHEIA_DEMOS && demoOv.requestFullscreen) {
    demoOv.requestFullscreen().then(() => { demoEmTelaCheia = true; return screen.orientation && screen.orientation.lock ? screen.orientation.lock('landscape') : null; }).catch(() => {});
  }
}
function fecharDemo() {
  if (!demoOv) return;
  demoOv.remove(); demoOv = null; document.body.style.overflow = ''; demoEmTelaCheia = false;
  try { screen.orientation.unlock(); } catch (e) {}
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  if (history.state && history.state.demo) history.back();
}
// o voltar do celular (ou o gesto de sair da tela cheia) fecha a demo de uma vez, em vez de só sair da tela cheia
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && demoOv && demoEmTelaCheia) fecharDemo(); });
addEventListener('resize', ajustarDemo); addEventListener('orientationchange', () => setTimeout(ajustarDemo, 150));
addEventListener('message', (e) => { if (e.data && e.data.fecharDemo) fecharDemo(); });
addEventListener('popstate', () => { if (demoOv) fecharDemo(); });
document.addEventListener('click', (e) => {
  const a = e.target.closest('.proj .btns a.btn[href^="demos/"]');
  if (!a || !ehCelular() || e.metaKey || e.ctrlKey) return;
  e.preventDefault(); abrirDemo(a.getAttribute('href'));
});
