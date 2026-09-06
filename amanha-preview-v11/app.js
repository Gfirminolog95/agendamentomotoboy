const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const PT=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}),MONTHS=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const fmt=v=>PT.format(v),short=v=>Math.abs(v)>=1000?'R$ '+(v/1000).toFixed(1).replace('.',',')+'k':'R$ '+Math.round(v).toLocaleString('pt-BR');
const AY=2026,AM=8;let hy=AY,hm=AM,tab='home',onStep=0;
let state={name:'Geovane',balance:1500,income:5000,incomeDay:5,flex:1800,reserve:500,reserveTarget:10000,tx:[
{name:'Renda principal',value:5000,day:5,type:'in',rec:true},{name:'Aluguel',value:-1800,day:7,type:'out',rec:true},{name:'Internet',value:-120,day:10,type:'out',rec:true},{name:'Vídeo game · 1/5',value:-720,day:10,type:'out',rec:true},{name:'Academia',value:-99,day:15,type:'out',rec:true}],cards:[{name:'Nubank',bill:720,limit:6000,due:10},{name:'Inter',bill:340,limit:4500,due:18}]};

function authGo(n){$$('[data-auth]').forEach(x=>x.classList.toggle('active',x.dataset.auth===n))}
$$('[data-auth-go]').forEach(b=>b.onclick=()=>authGo(b.dataset.authGo));
$$('[data-login]').forEach(b=>b.onclick=enterDemo);$('[data-demo]').onclick=enterDemo;
$('#startOnboarding').onclick=()=>{$('#auth').classList.remove('show');$('#onboarding').classList.add('show');onStep=0;renderOn()};
function enterDemo(){$('#auth').classList.remove('show');$('#app').classList.remove('hidden');render()}
function renderOn(){$$('[data-on]').forEach(x=>x.classList.toggle('active',+x.dataset.on===onStep));$('#onCount').textContent=`${onStep+1} de 4`;$('#onProgress').style.width=`${(onStep+1)*25}%`;$('#onBack').style.visibility=onStep?'visible':'hidden';$('#onNext').textContent=onStep===3?'Ver meu Horizonte':'Continuar'}
$('#onNext').onclick=()=>{if(onStep<3){onStep++;renderOn();return}state.balance=+$('#onBalance').value||0;state.income=+$('#onIncome').value||0;state.incomeDay=+$('#onIncomeDay').value||5;state.flex=+$('#onFlex').value||0;state.reserve=+$('#onReserve').value||0;state.reserveTarget=+$('#onReserveTarget').value||0;state.tx=[{name:'Renda principal',value:state.income,day:state.incomeDay,type:'in',rec:true},...$$('#commitments .commit').map(r=>({name:r.children[0].value||'Compromisso',value:-(+r.children[1].value||0),day:+r.children[2].value||1,type:'out',rec:true}))];$('#onboarding').classList.remove('show');$('#app').classList.remove('hidden');tab='horizon';render()};
$('#onBack').onclick=()=>{if(onStep){onStep--;renderOn()}};$('#addCommit').onclick=()=>{const d=document.createElement('div');d.className='commit';d.innerHTML='<input placeholder="Nome"><input type="number" placeholder="Valor"><input type="number" placeholder="Dia"><button>×</button>';$('#commitments').appendChild(d);d.lastElementChild.onclick=()=>d.remove()};$$('#commitments button').forEach(b=>b.onclick=()=>b.parentElement.remove());

const days=(y,m)=>new Date(y,m+1,0).getDate(),mi=(y,m)=>y*12+m;
function recurringNet(){return state.tx.filter(t=>t.rec).reduce((a,t)=>a+t.value,0)-state.flex}
function monthStart(y,m){let b=state.balance,delta=mi(y,m)-mi(AY,AM);if(delta>0)for(let i=0;i<delta;i++)b+=recurringNet();if(delta<0)for(let i=delta;i<0;i++)b-=recurringNet();return b}
function projection(y,m){let b=monthStart(y,m),n=days(y,m),a=[];for(let d=1;d<=n;d++){const items=state.tx.filter(t=>t.rec&&t.day===d||(!t.rec&&t.day===d&&t.year===y&&t.month===m));items.forEach(x=>b+=x.value);b-=state.flex/n;a.push({day:d,balance:b,items})}return a}
function incomeDistance(y,m,d){return d<state.incomeDay?state.incomeDay-d:days(y,m)-d+state.incomeDay}
function tone(b,y,m,d){if(b<0)return'bad';const need=Math.max(state.flex/30,35)*Math.max(1,incomeDistance(y,m,d))+150;if(b<need*.78)return'bad';if(b<need*1.45)return'warn';return'good'}
function metrics(){const a=projection(hy,hm),min=Math.min(...a.map(x=>x.balance));return{min,free:min-state.reserve}}
function rows(a){return a.map(t=>`<div class="row"><span class="dot">${t.type==='in'?'↙':'↗'}</span><span><b>${t.name}</b><small>dia ${t.day}${t.rec?' · recorrente':''}</small></span><span class="amount ${t.value>=0?'in':'out'}">${t.value>=0?'+':''}${fmt(t.value)}</span></div>`).join('')}
function nav(){$$('.bottom button').forEach(x=>x.classList.remove('active'));const map={home:0,horizon:1,cards:3,profile:4},b=$$('.bottom button')[map[tab]];if(b)b.classList.add('active')}
$$('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render();scrollTo(0,0)});$('#plus').onclick=()=>openSheet('ADICIONAR','O que aconteceu?',addMenu());

function render(){nav();({home,horizon,cards,profile}[tab]||home)();wire()}
function home(){const m=metrics();$('#content').innerHTML=`<section class="page"><div class="topbar"><div class="brand"><span class="brand-mark">◒</span><b>Amanhã</b></div><button class="iconbtn" data-open="help">?</button></div><div class="greet">Olá, ${state.name}</div><div class="date">Sábado, 5 de setembro</div><div class="hero"><small>DINHEIRO LIVRE</small><h1>${fmt(m.free)}</h1><p>A menor folga prevista no seu Horizonte, sem usar a Reserva Protegida.</p><button class="secondary" data-goto="horizon">Ver Horizonte</button></div><div class="metrics"><div class="metric"><small>SALDO ATUAL</small><b>${fmt(state.balance)}</b><em>em contas</em></div><div class="metric"><small>COMPROMETIDO</small><b>${fmt(Math.abs(state.tx.filter(t=>t.type==='out').reduce((a,t)=>a+t.value,0)))}</b><em>previsto</em></div><div class="metric"><small>RESERVA PROTEGIDA</small><b>${fmt(state.reserve)}</b><em>fora do dinheiro livre</em></div><div class="metric"><small>MENOR SALDO</small><b>${fmt(m.min)}</b><em>no Horizonte</em></div></div><div class="section"><div class="section-head"><div><h2>Seu Horizonte</h2><small>O que vai acontecer com seu dinheiro</small></div><button data-goto="horizon">Abrir</button></div><div class="mini-chart"><svg viewBox="0 0 320 100" preserveAspectRatio="none"><path d="M5 18L40 24L62 63L100 67L160 74L220 80L275 90L315 22" fill="none" stroke="#5b3bd1" stroke-width="4" stroke-linecap="round"/></svg></div></div><div class="section"><div class="section-head"><h2>Próximos movimentos</h2><button data-open="movements">Ver todos</button></div><div class="list">${rows(state.tx.slice(0,4))}</div></div><button class="sim-btn" data-sim>Antes de comprar, veja o impacto</button></section>`}
function horizon(){const a=projection(hy,hm),first=new Date(hy,hm,1).getDay(),m=metrics(),current=hy===AY&&hm===AM;let cells='<div class="day blank"></div>'.repeat(first);a.forEach(d=>cells+=`<div class="day ${tone(d.balance,hy,hm,d.day)} ${current&&d.day===5?'today':''}"><button data-day="${d.day}"><strong>${d.day}</strong><em>${short(d.balance)}</em></button></div>`);$('#content').innerHTML=`<section class="page"><div class="calendar-head"><div><div class="eyebrow">HORIZONTE DIÁRIO</div><h1>${MONTHS[hm]} de ${hy}</h1></div><button class="iconbtn" id="quickAdd">＋</button></div><div class="month-nav"><button data-prev>‹</button><strong>${MONTHS[hm]} de ${hy}</strong><button data-next>›</button>${current?'':'<button class="today-link" data-today>Voltar para este mês</button>'}</div><div class="week"><span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span></div><div class="cal">${cells}</div><div class="legend"><span><i class="g"></i>confortável</span><span><i class="y"></i>atenção</span><span><i class="r"></i>apertado</span></div><div class="summary"><div><small>MENOR SALDO</small><b>${fmt(m.min)}</b></div><div><small>DINHEIRO LIVRE</small><b>${fmt(m.free)}</b></div><div><small>RESERVA</small><b>${fmt(state.reserve)}</b></div></div><button class="sim-btn" data-sim>Simular uma compra neste Horizonte</button></section>`;$('#quickAdd').onclick=()=>openSheet('ADICIONAR','O que aconteceu?',addMenu())}
function cards(){$('#content').innerHTML=`<section class="page"><div class="calendar-head"><div><div class="eyebrow">SEUS CARTÕES</div><h1>Cartões</h1></div><button class="iconbtn" data-open="add-card">＋</button></div>${state.cards.map((c,i)=>`<button class="card" data-card="${i}"><div class="line"><h3>${c.name}</h3><b>${fmt(c.bill)}</b></div><small>Fatura atual · vence dia ${c.due}</small><div class="bar"><i style="width:${c.bill/c.limit*100}%"></i></div><small>${fmt(c.limit-c.bill)} disponíveis</small></button>`).join('')}<button class="secondary" data-open="installments">Parcelamentos ativos</button></section>`}
function profile(){$('#content').innerHTML=`<section class="page"><div class="eyebrow">SUA CONTA</div><div class="profile"><div class="avatar">GF</div><div><h2>${state.name}</h2><p>demo@amanha.app</p></div></div><div class="menu"><button data-open="reserve"><span><b>Reserva Protegida</b><small>${fmt(state.reserve)} guardados</small></span><span>›</span></button><button data-open="settings"><span><b>Configurações</b><small>Conta e preferências</small></span><span>›</span></button><button data-open="notifications"><span><b>Notificações</b><small>Alertas do Horizonte</small></span><span>›</span></button><button data-open="plan"><span><b>Amanhã Plus</b><small>Plano e assinatura</small></span><span>›</span></button><button data-open="help"><span><b>Ajuda</b><small>Entenda os cálculos</small></span><span>›</span></button><button id="logout"><span><b>Sair</b><small>Testar login novamente</small></span><span>›</span></button></div></section>`}

function wire(){$$('[data-goto]').forEach(b=>b.onclick=()=>{tab=b.dataset.goto;render()});$$('[data-open]').forEach(b=>b.onclick=()=>generic(b.dataset.open));$$('[data-day]').forEach(b=>b.onclick=()=>dayDetail(+b.dataset.day));$$('[data-sim]').forEach(b=>b.onclick=openSim);$$('[data-card]').forEach(b=>b.onclick=()=>cardDetail(+b.dataset.card));$('[data-prev]')?.addEventListener('click',()=>changeMonth(-1));$('[data-next]')?.addEventListener('click',()=>changeMonth(1));$('[data-today]')?.addEventListener('click',()=>{hy=AY;hm=AM;render()});$('#logout')?.addEventListener('click',()=>{$('#app').classList.add('hidden');$('#auth').classList.add('show');authGo('welcome')})}
function changeMonth(n){const d=new Date(hy,hm+n,1);hy=d.getFullYear();hm=d.getMonth();render();scrollTo(0,0)}
function openSheet(e,t,b){$('#sheetEye').textContent=e;$('#sheetTitle').textContent=t;$('#sheetBody').innerHTML=b;$('#sheet').classList.add('open');sheetWire()}
function closeSheet(){$('#sheet').classList.remove('open')}$$('[data-close]').forEach(b=>b.onclick=closeSheet);
function sheetWire(){$$('[data-action]').forEach(b=>b.onclick=()=>form(b.dataset.action));$$('[data-sheet]').forEach(b=>b.onclick=()=>generic(b.dataset.sheet));$('#simCalc')?.addEventListener('click',calcSim);$('#saveIncome')?.addEventListener('click',()=>saveTx('in'));$('#saveExpense')?.addEventListener('click',()=>saveTx('out'));$$('[data-sim]').forEach(b=>b.onclick=openSim)}
function icon(path,extra=''){return`<span class="action-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${extra}<path d="${path}"/></svg></span>`}
function addMenu(){return`<div class="sheet-actions">
<button class="action income-action" data-action="income">${icon('M12 5v14M5 12h14')}<span><b>Entrada</b><small>Salário, comissão, extra</small></span></button>
<button class="action expense-action" data-action="expense">${icon('M5 12h14')}<span><b>Saída</b><small>Conta, boleto, compra</small></span></button>
<button class="action recurring-action" data-action="recurring">${icon('M20 7h-5V2M4 17h5v5M5.5 9A7 7 0 0 1 17 5l3 2M18.5 15A7 7 0 0 1 7 19l-3-2')}<span><b>Compromisso recorrente</b><small>Algo que se repete todo mês</small></span></button>
<button class="action card-action" data-action="card">${icon('M3 10h18M7 15h3','<rect x="3" y="5" width="18" height="14" rx="2"/>')}<span><b>Compra no cartão</b><small>À vista ou parcelada</small></span></button>
<button class="action sim-action" data-action="simulate">${icon('M5 19v-6M10 19V9M15 19V5M20 19v-8')}<span><b>Simular compra</b><small>Impacto no Amanhã</small></span></button></div>`}
function dayDetail(d){const a=projection(hy,hm),x=a[d-1],before=d===1?monthStart(hy,hm):a[d-2].balance;openSheet('DETALHE DO DIA',`${String(d).padStart(2,'0')} de ${MONTHS[hm]}`,`<div class="summary"><div><small>INÍCIO</small><b>${short(before)}</b></div><div><small>MOVIMENTOS</small><b>${x.items.length}</b></div><div><small>FIM</small><b>${short(x.balance)}</b></div></div><div class="list">${x.items.length?rows(x.items):'<p>Nenhum lançamento específico neste dia.</p>'}</div><button class="sim-btn" data-sim>Simular compra a partir deste dia</button>`)}
function openSim(){openSheet('IMPACTO NO AMANHÃ','Simular uma compra',`<p>Compare cenários sem registrar nada.</p><label>Valor<input id="simValue" type="number" value="1200"></label><button class="primary" id="simCalc">Comparar cenários</button><div id="simResult"></div>`)}
function calcSim(){const v=+$('#simValue').value||0,b=metrics().min,sc=[['À vista',b-v,'Impacto imediato'],['3x',b-v/3,'Compromisso por 3 meses'],['6x',b-v/6,'Menor impacto mensal'],['Esperar',b+state.income-v,'Após próxima renda']];$('#simResult').innerHTML=sc.map((s,i)=>`<div class="scenario"><header><b>${s[0]}</b>${i===2?'<small>MENOR IMPACTO MENSAL</small>':''}</header><div class="scenario-grid"><div><small>MENOR SALDO</small><b>${fmt(s[1])}</b></div><div><small>LEITURA</small><b>${s[2]}</b></div></div></div>`).join('')}
function cardDetail(i){const c=state.cards[i];openSheet('FATURA',c.name,`<div class="hero"><small>FATURA ATUAL</small><h1>${fmt(c.bill)}</h1><p>Vence dia ${c.due} · limite ${fmt(c.limit)}</p></div>${rows([{name:'Vídeo game · 1/5',value:-Math.min(c.bill,720),day:c.due,type:'out'}])}<button class="secondary" data-action="card">Nova compra</button>`)}
function generic(k){const map={movements:['MOVIMENTOS','Próximos movimentos',`<div class="list">${rows(state.tx)}</div>`],reserve:['RESERVA','Reserva Protegida',`<div class="hero"><small>PROTEGIDO</small><h1>${fmt(state.reserve)}</h1><p>Meta ${fmt(state.reserveTarget)}</p></div>`],settings:['CONTA','Configurações','<div class="menu"><button><span><b>Segurança</b><small>Biometria e sessões</small></span><span>›</span></button><button><span><b>Exportar dados</b><small>Privacidade e LGPD</small></span><span>›</span></button></div>'],notifications:['ALERTAS','Notificações',rows([{name:'Conta amanhã',value:-120,day:10,type:'out'},{name:'Renda prevista',value:5000,day:5,type:'in'}])],plan:['AMANHÃ PLUS','Seu plano','<div class="hero"><small>PLANO DE TESTE</small><h1>Plus</h1><p>Horizonte completo e simulações.</p></div>'],help:['AJUDA','Como calculamos?','<div class="menu"><button><span><b>Dinheiro Livre</b><small>Menor saldo do Horizonte, sem a reserva.</small></span></button><button><span><b>Horizonte Diário</b><small>Saldo previsto em cada data.</small></span></button></div>'],installments:['PARCELAMENTOS','Parcelamentos ativos',rows([{name:'Vídeo game · 1/5',value:-720,day:10,type:'out'}])], 'add-card':['CARTÕES','Adicionar cartão','<label>Nome<input value="Novo cartão"></label><button class="primary">Salvar cartão</button>']};const x=map[k]||['AMANHÃ','Em desenvolvimento','<p>Tela do protótipo.</p>'];openSheet(x[0],x[1],x[2])}
function form(k){
  if(k==='simulate'){openSim();return}
  if(k==='income'||k==='expense'){
    const inc=k==='income';
    openSheet(
      inc?'NOVA ENTRADA':'NOVA SAÍDA',
      inc?'Recebi dinheiro':'Gastei dinheiro',
      `<label>Descrição<input id="fName" value="${inc?'Renda extra':'Compra'}"></label>
       <label>Valor<input id="fValue" type="number" value="${inc?500:120}"></label>
       <label>Dia<input id="fDay" type="number" value="12"></label>
       <button class="primary" id="${inc?'saveIncome':'saveExpense'}">Salvar</button>`
    );
    return
  }
  if(k==='recurring'){
    openSheet(
      'RECORRÊNCIA',
      'Novo compromisso mensal',
      `<label>Nome<input value="Nova conta"></label>
       <label>Valor<input value="150"></label>
       <label>Dia<input value="10"></label>
       <button class="primary" id="saveRecurring">Salvar</button>`
    );
    $('#saveRecurring')?.addEventListener('click',()=>{closeSheet();toast('Recorrência adicionada.')});
    return
  }
  if(k==='card'){
    openSheet(
      'CARTÃO',
      'Nova compra',
      `<label>Descrição<input value="Nova compra"></label>
       <label>Valor<input value="600"></label>
       <label>Parcelas<input value="3"></label>
       <button class="primary" id="saveCardPurchase">Registrar</button>`
    );
    $('#saveCardPurchase')?.addEventListener('click',()=>{closeSheet();toast('Compra registrada.')});
  }
}
function saveTx(type){const v=+$('#fValue').value||0;state.tx.push({name:$('#fName').value,value:type==='in'?v:-v,day:+$('#fDay').value||1,type,rec:false,year:hy,month:hm});closeSheet();render();toast('Horizonte recalculado.')}
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1900)}
render();