// Jogo Futebol das Estrelas
let meuTime=null, advTime=null, meuCraque=null, rodada=1, meusGols=0, advGols=0, defendendo=false, maxRodadas=5;

function $(id){return document.getElementById(id)}
function timeById(id){return TIMES.find(t=>t.id===id)}
function craqueById(id){return CRAQUES.find(c=>c.id===id)}

function mostrar(tela){
  ['tela-inicio','tela-penaltis','tela-simulacao','tela-jogo'].forEach(t=>$(t).classList.add('hidden'));
  $(tela).classList.remove('hidden');
  window.scrollTo(0,0);
}
function irPenaltis(){montarTimes('lista-meu-time');montarTimes('lista-adv-time');montarCraques();mostrar('tela-penaltis')}
function irSimulacao(){montarTimes('sim-time-a');montarTimes('sim-time-b');mostrar('tela-simulacao')}

function montarTimes(elId){
  const el=$(elId);el.innerHTML='';
  TIMES.forEach(t=>{
    const d=document.createElement('div');d.className='time';d.dataset.id=t.id;
    d.innerHTML=`<span class="sigla" style="color:${t.cor2}">${t.sigla}</span><b>${t.nome}</b><small>${t.tipo==='clube'?'Clube':'Seleção'} • Força ${t.forca}<br>🧤 ${t.goleiro}</small>`;
    d.style.background=`linear-gradient(135deg, ${t.cor1}, #111 130%)`;
    d.onclick=()=>{el.querySelectorAll('.time').forEach(x=>x.classList.remove('sel'));d.classList.add('sel');
      if(elId==='lista-meu-time')meuTime=t.id;
      if(elId==='lista-adv-time')advTime=t.id;
      if(elId==='sim-time-a')meuTime=t.id;
      if(elId==='sim-time-b')advTime=t.id;
    };
    el.appendChild(d);
  });
}
function montarCraques(){
  const el=$('lista-craques');el.innerHTML='';
  CRAQUES.forEach(c=>{
    const d=document.createElement('div');d.className='craque';d.dataset.id=c.id;
    d.innerHTML=`<div class="av">${c.avatar}</div><b>${c.apelido}</b><small>${c.nome}<br>${c.pais} • ${c.pos}</small><br><span class="ov">${c.overall}</span><small> Pênalti ${c.penalti}</small>`;
    d.onclick=()=>{el.querySelectorAll('.craque').forEach(x=>x.classList.remove('sel'));d.classList.add('sel');meuCraque=c.id;};
    el.appendChild(d);
  });
}

function comecarPenaltis(){
  if(!meuTime||!advTime||!meuCraque){alert('Escolha seu time, o adversário e seu batedor!');return;}
  if(meuTime===advTime){alert('Escolha dois times diferentes!');return;}
  rodada=1;meusGols=0;advGols=0;defendendo=false;
  $('info-jogo').textContent=`${timeById(meuTime).nome} (${craqueById(meuCraque).apelido}) x ${timeById(advTime).nome}`;
  $('log').innerHTML='';atualizarPlacar();posicionarGoleiro('meio');mostrar('tela-jogo');
  log(`🏟️ Começa a disputa! ${timeById(meuTime).nome} x ${timeById(advTime).nome}`);
  log(`⭐ Seu batedor: ${craqueById(meuCraque).nome} (Pênalti ${craqueById(meuCraque).penalti})`);
  log(`🧤 Goleiro rival: ${timeById(advTime).goleiro}`);
  log(`👉 Rodada ${rodada}: clique em um canto do gol para chutar!`);
}

function atualizarPlacar(){$('placar').textContent=`${timeById(meuTime)?.sigla||''} ${meusGols} x ${advGols} ${timeById(advTime)?.sigla||''} • Rodada ${rodada}/${maxRodadas}`;}
function log(t){$('log').innerHTML+=`<div>${t}</div>`;$('log').scrollTop=9999;}
function posicionarGoleiro(lado){
  const g=$('goleiro');
  if(lado==='esq')g.style.left='18%';
  else if(lado==='dir')g.style.left='82%';
  else g.style.left='50%';
}
function chutar(ladoEscolhido){
  if(defendendo){defender(ladoEscolhido);return;}
  const k=craqueById(meuCraque), adv=timeById(advTime);
  // IA do goleiro: chance de acertar o canto
  const forcaGol = adv.forca/100; // 0.8-0.94
  const habilidade = k.penalti/100;
  const r=Math.random();
  // goleiro escolhe lado
  const lados=['esq','meio','dir'];
  let goleiroLado = lados[Math.floor(Math.random()*3)];
  // goleiro bom tem mais chance de ir no lado certo
  if(r < forcaGol*0.55) goleiroLado = ladoEscolhido;
  posicionarGoleiro(goleiroLado);
  // animar bola
  const bola=$('bola');
  bola.style.left = ladoEscolhido==='esq'?'20%':ladoEscolhido==='dir'?'80%':'50%';
  bola.style.bottom='180px';
  setTimeout(()=>{
    let gol=false;
    if(goleiroLado!==ladoEscolhido) gol = Math.random() < (0.85 + habilidade*0.1);
    else gol = Math.random() < (habilidade - forcaGol + 0.35);
    // chance de trave
    if(Math.random()<0.06){log(`💥 TRAVE! ${k.apelido} carimbou o poste!`);}
    else if(gol){meusGols++;log(`⚽ GOOOL! ${k.apelido} marca para ${timeById(meuTime).nome}! (goleiro foi para ${goleiroLado})`);}
    else{log(`🧤 DEFESA! ${adv.goleiro} pegou o chute de ${k.apelido}! (lado ${goleiroLado})`);}
    bola.style.left='50%';bola.style.bottom='6px';
    atualizarPlacar();
    setTimeout(()=>{
      defendendo=true;posicionarGoleiro('meio');
      log(`🧤 Agora defenda! Clique onde o rival vai bater (rodada ${rodada} do adversário).`);
    },900);
  },600);
}
function defender(ladoEscolhido){
  posicionarGoleiro(ladoEscolhido);
  const adv=timeById(advTime), meu=timeById(meuTime);
  const lados=['esq','meio','dir'];
  const chuteAdv = lados[Math.floor(Math.random()*3)];
  const bola=$('bola');
  bola.style.left = chuteAdv==='esq'?'20%':chuteAdv==='dir'?'80%':'50%';
  bola.style.bottom='180px';
  setTimeout(()=>{
    let gol = ladoEscolhido!==chuteAdv ? Math.random()<0.75 : Math.random()<0.25;
    if(gol){advGols++;log(`⚽ Gol do ${adv.nome}! Rival chutou na ${chuteAdv}, você foi na ${ladoEscolhido}. 🧤 ${meu.goleiro} quase pegou!`);}
    else{log(`🧤 DEFESAÇA SUA! Você pulou na ${ladoEscolhido} e pegou o pênalti do ${adv.nome}!`);}
    bola.style.left='50%';bola.style.bottom='6px';
    atualizarPlacar();defendendo=false;posicionarGoleiro('meio');
    rodada++;
    if(rodada>maxRodadas || (rodada>=3 && Math.abs(meusGols-advGols)>(maxRodadas-rodada+1))){
      fimJogo();return;
    }
    atualizarPlacar();
    log(`👉 Rodada ${rodada}: sua vez de bater! Clique no canto.`);
  },600);
}
function fimJogo(){
  let msg;
  if(meusGols>advGols)msg=`🏆 VITÓRIA! ${timeById(meuTime).nome} venceu ${meusGols}x${advGols}! ${craqueById(meuCraque).apelido} é o herói!`;
  else if(meusGols<advGols)msg=`😢 Derrota... ${timeById(advTime).nome} venceu ${advGols}x${meusGols}. Tente de novo!`;
  else msg=`🤝 Empate ${meusGols}x${advGols}! Que disputa!`;
  log(`<b>${msg}</b>`);
  alert(msg);
}

// Simulação de partida
function simularPartida(){
  if(!meuTime||!advTime){alert('Escolha os dois times!');return;}
  if(meuTime===advTime){alert('Escolha times diferentes!');return;}
  const a=timeById(meuTime), b=timeById(advTime);
  let ga=0, gb=0; const lg=$('log-sim'); lg.innerHTML='';
  lg.innerHTML+=`<div>🏟️ ${a.nome} x ${b.nome} — Começa o jogo!</div>`;
  const craquesA = a.craques.map(craqueById).filter(Boolean);
  const craquesB = b.craques.map(craqueById).filter(Boolean);
  const todosA = craquesA.length?craquesA:[{apelido:'Atacante',nome:'Atacante'}];
  const todosB = craquesB.length?craquesB:[{apelido:'Atacante',nome:'Atacante'}];
  for(let m=1;m<=90;m+=Math.floor(Math.random()*12)+4){
    const chanceA = a.forca/(a.forca+b.forca);
    const lance = Math.random();
    if(lance<chanceA*0.45){
      ga++;
      const art=todosA[Math.floor(Math.random()*todosA.length)];
      lg.innerHTML+=`<div>⚽ ${m}' GOOOL do ${a.nome}! ${art.apelido} marca! (${ga}x${gb})</div>`;
    }else if(lance>1-(1-chanceA)*0.45){
      gb++;
      const art=todosB[Math.floor(Math.random()*todosB.length)];
      lg.innerHTML+=`<div>⚽ ${m}' GOOOL do ${b.nome}! ${art.apelido} marca! (${ga}x${gb})</div>`;
    }else if(Math.random()<0.3){
      const nomes=['que drible lindo','que defesa do goleiro','que chance perdida','que jogada ensaiada','torcida vai à loucura'];
      lg.innerHTML+=`<div>⏱️ ${m}' ${nomes[Math.floor(Math.random()*nomes.length)]}.</div>`;
    }
  }
  lg.innerHTML+=`<div><b>🏁 Fim de jogo: ${a.nome} ${ga} x ${gb} ${b.nome}</b></div>`;
  if(ga>gb)lg.innerHTML+=`<div>🏆 ${a.nome} vence!</div>`;
  else if(gb>ga)lg.innerHTML+=`<div>🏆 ${b.nome} vence!</div>`;
  else lg.innerHTML+=`<div>🤝 Empate!</div>`;
  lg.scrollTop=9999;
}
