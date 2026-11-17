/* Dados fictícios compartilhados entre o app de celular e o painel web (gerador com semente fixa). */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const rnd=mulberry32(2026), pick=a=>a[Math.floor(rnd()*a.length)], between=(a,b)=>a+rnd()*(b-a);
const HOJE=new Date(2026,10,12);
const TIPOS={Notebook:{vida:48,val:[4200,9800],mod:['Pro 14','Air 13','Book 15','Slim 16'],n:46},Desktop:{vida:60,val:[3200,7200],mod:['Tower S','Mini M','Office X'],n:22},Monitor:{vida:72,val:[800,2400],mod:['View 24"','View 27"','Ultra 32"'],n:30},Smartphone:{vida:36,val:[1800,5600],mod:['Z 12','Z 14','Lite 9'],n:18},Impressora:{vida:60,val:[1500,6500],mod:['Laser M2','Multi 300','Color 50'],n:8},Tablet:{vida:48,val:[1600,4200],mod:['Tab 10','Tab Pro 11'],n:10}};
const MARCAS=['Nova','Orbit','Kaon','Lumi','Vento'], SETORES=['Financeiro','Comercial','RH','Operações','Atendimento','TI','Diretoria'];
const NOMES=['Ana Souza','Bruno Lima','Carla Mendes','Diego Rocha','Eduarda Pires','Felipe Duarte','Gabriela Nunes','Heitor Alves','Isabela Costa','João Vieira','Karen Dias','Lucas Prado','Marina Teixeira','Nicolas Ramos','Olívia Freitas','Paulo Barros','Renata Cunha','Samuel Moraes','Talita Lopes','Vitor Cardoso','Yasmin Rezende','Rafael Pinto'];
const PREF={Notebook:'NB',Desktop:'DT',Monitor:'MN',Smartphone:'SP',Impressora:'IM',Tablet:'TB'};
const ativos=[]; let seq=1;
Object.entries(TIPOS).forEach(([tipo,t])=>{ for(let i=0;i<t.n;i++){
  const adq=new Date(HOJE.getTime()-Math.pow(rnd(),1.3)*t.vida*2629800000);
  const idade=(HOJE-adq)/2629800000, vida=Math.max(0,Math.min(100,100*(1-idade/t.vida)));
  const r=rnd(); const status=r<.70?'Em uso':r<.84?'Em estoque':r<.95?'Em manutenção':'Descartado';
  const g=new Date(adq); g.setMonth(g.getMonth()+(rnd()<.5?12:24));
  ativos.push({tag:PREF[tipo]+'-'+String(seq++).padStart(4,'0'),tipo,modelo:pick(MARCAS)+' '+pick(t.mod),resp:status==='Em uso'?pick(NOMES):'Sem responsável',setor:status==='Em uso'?pick(SETORES):(status==='Em estoque'?'Almoxarifado de TI':status==='Em manutenção'?'Assistência':'Baixado'),status,adq,valor:Math.round(between(...t.val)/10)*10,vida,garantia:g,serie:'SN'+Math.floor(rnd()*9e7+1e7)});
}});
const brl=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
const dt=d=>d.toLocaleDateString('pt-BR');
const stCls={ 'Em uso':'p-ok','Em estoque':'p-info','Em manutenção':'p-warn','Descartado':'p-mute' };
const vidaCor=v=>v>45?'#10B981':v>20?'#F59E0B':'#EF4444';
const vivos=ativos.filter(a=>a.status!=='Descartado');
const movs=[]; for(let i=0;i<40;i++){const a=pick(vivos); const k=pick(['Entrega','Devolução','Transferência','Entrega','Devolução']); const d=new Date(HOJE-Math.floor(rnd()*120)*86400000); movs.push({d,tag:a.tag,modelo:a.modelo,k,de:k==='Entrega'?'Estoque de TI':pick(NOMES),para:k==='Devolução'?'Estoque de TI':pick(NOMES),origem:'Web'});}
movs.sort((a,b)=>b.d-a.d);
const reparos=ativos.filter(a=>a.status==='Em manutenção').slice(0,8).map((a,i)=>({a,etapa:i%3,defeito:pick(['Bateria inchada','Tela com falha','Teclado sem resposta','Não liga','Troca de fonte','Ventoinha ruidosa','Placa de rede']),dias:1+Math.floor(rnd()*12),custo:Math.round(between(120,980)/10)*10}));
/* canal de sincronização entre o app (celular) e o painel (PC) */
const canal=('BroadcastChannel' in window)?new BroadcastChannel('ativos-sync'):null;
