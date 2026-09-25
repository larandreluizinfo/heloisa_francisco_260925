// Motor 3D (pseudo-3D) em tempo real: campo, jogadores, arbitro, torcida e celebrations
// Usa Canvas 2D com perspectiva para simular 3D sem dependencias externas.
let M3D = {
  canvas:null, ctx:null, running:false, speed:2, minuto:0, segundo:0,
  timeA:null, timeB:null, jogadores:[], bola:{x:0,y:0,vx:0,vy:0,comQuem:null},
  arbitro:{x:0,y:0}, torcida:[], ga:0, gb:0, lance:'', festa:0, festaQuem:null,
  confetes:[], apitoInicio:false
};

function iniciarPartida3D(){
  if(!meuTime||!advTime){alert('Escolha os dois times!');return;}
  if(meuTime===advTime){alert('Escolha times diferentes!');return;}
  const a=timeById(meuTime), b=timeById(advTime);
  M3D.timeA=a; M3D.timeB=b; M3D.ga=0; M3D.gb=0; M3D.minuto=0; M3D.segundo=0;
  M3D.festa=0; M3D.confetes=[]; M3D.lance='Apita o árbitro! Começa '+a.nome+' x '+b.nome+'! 🎺';
  $('log-sim').innerHTML=`<div>🟢 ${M3D.lance}</div>`;
  montarElenco3D();
  montarTorcida3D();
  $('arena').classList.remove('hidden');
  $('placar3d').textContent=`${a.sigla} 0 x 0 ${b.sigla} • 0'`;
  M3D.running=true; M3D.apitoInicio=true;
  requestAnimationFrame(loop3D);
  logSim(`👨‍⚖️ Árbitro em campo. Torcida lotada!`);
}

function montarElenco3D(){
  const a=M3D.timeA, b=M3D.timeB;
  const craquesA=a.craques.map(craqueById).filter(Boolean);
  const craquesB=b.craques.map(craqueById).filter(Boolean);
  M3D.jogadores=[];
  // 7 por time (1 goleiro + 6 linha) para performance e visibilidade
  const formA=[{x:-42,y:0},{x:-20,y:-22},{x:-20,y:22},{x:-5,y:-12},{x:-5,y:12},{x:8,y:0},{x:18,y:-8}];
  const formB=[{x:42,y:0},{x:20,y:22},{x:20,y:-22},{x:5,y:12},{x:5,y:-12},{x:-8,y:0},{x:-18,y:8}];
  for(let i=0;i<7;i++){
    const starA = i>=5 ? craquesA[(i-5)%Math.max(1,craquesA.length)] : null;
    const starB = i>=5 ? craquesB[(i-5)%Math.max(1,craquesB.length)] : null;
    M3D.jogadores.push({time:'A',idx:i,x:formA[i].x,y:formA[i].y,baseX:formA[i].x,baseY:formA[i].y,nome:starA?starA.apelido:(i===0?'GOL':'J'+(i+1)),cor:a.cor1,borda:a.cor2,ehGol:i===0,vel:0.25+Math.random()*0.15});
    M3D.jogadores.push({time:'B',idx:i,x:formB[i].x,y:formB[i].y,baseX:formB[i].x,baseY:formB[i].y,nome:starB?starB.apelido:(i===0?'GOL':'J'+(i+1)),cor:b.cor1,borda:b.cor2,ehGol:i===0,vel:0.25+Math.random()*0.15});
  }
  M3D.bola={x:0,y:0,vx:0,vy:0,comQuem:M3D.jogadores[2]};
  M3D.arbitro={x:0,y:14};
}

function montarTorcida3D(){
  M3D.torcida=[];
  const cores=[M3D.timeA.cor1,M3D.timeA.cor2,M3D.timeB.cor1,M3D.timeB.cor2,'#f1c40f','#fff','#e74c3c','#3498db'];
  for(let i=0;i<160;i++){
    M3D.torcida.push({x:Math.random(),y:Math.random(),cor:cores[Math.floor(Math.random()*cores.length)],fase:Math.random()*6,emoji:Math.random()<0.12});
  }
}

function logSim(t){const el=$('log-sim');el.innerHTML+=`<div>${t}</div>`;el.scrollTop=9999;}

function loop3D(){
  if(!M3D.running)return;
  atualizar3D();
  desenhar3D();
  requestAnimationFrame(loop3D);
}

function atualizar3D(){
  // tempo: 90 min em ~3 min reais (speed 2 = mais rapido)
  M3D.segundo+=M3D.speed;
  if(M3D.segundo>=36){M3D.segundo=0;M3D.minuto++;
    if(M3D.minuto>=90){M3D.running=false;fimPartida3D();return;}
    $('placar3d').textContent=`${M3D.timeA.sigla} ${M3D.ga} x ${M3D.gb} ${M3D.timeB.sigla} • ${M3D.minuto}'`;
  }
  if(M3D.festa>0){M3D.festa--;atualizarFesta3D();return;}

  const B=M3D.bola;
  // quem tem a bola leva em direcao ao gol adversario
  let dono=B.comQuem;
  if(!dono){
    // bola solta: mais proximo pega
    let best=null,bd=1e9;
    M3D.jogadores.forEach(j=>{const d=Math.hypot(j.x-B.x,j.y-B.y);if(d<bd){bd=d;best=j;}});
    if(bd<2){B.comQuem=best;}
    else{B.x+=B.vx;B.y+=B.vy;B.vx*=0.96;B.vy*=0.96;}
  } else {
    const alvoX = dono.time==='A'?48:-48;
    // conduz
    dono.x+=(alvoX-dono.x)*0.008*dono.vel*10*0.12 + (Math.random()-0.5)*0.15;
    dono.y+=(0-dono.y)*0.003 + (Math.random()-0.5)*0.2;
    B.x=dono.x+(dono.time==='A'?1.2:-1.2);B.y=dono.y+0.6;
    // passe ou chute
    const distGol=Math.abs(alvoX-dono.x);
    const forca = dono.time==='A'?M3D.timeA.forca:M3D.timeB.forca;
    if(distGol<14 && Math.random()<0.03+forca/5000){
      // CHUTA!
      B.comQuem=null;
      B.vx=(alvoX-dono.x)*0.12;B.vy=(Math.random()-0.5)*3;
      M3D.lance=`${dono.nome} chutou!`;
    } else if(Math.random()<0.02){
      // passa para companheiro a frente
      const mates=M3D.jogadores.filter(j=>j.time===dono.time&&j!==dono);
      const m=mates[Math.floor(Math.random()*mates.length)];
      B.comQuem=null;B.vx=(m.x-B.x)*0.08;B.vy=(m.y-B.y)*0.08;
    }
    // adversarios perseguem
    M3D.jogadores.forEach(j=>{
      if(j.time!==dono.time&&!j.ehGol){
        j.x+=(dono.x-j.x)*0.012*j.vel*8*0.12;j.y+=(dono.y-j.y)*0.012*j.vel*8*0.12;
      } else if(j.time===dono.time&&j!==dono){
        // apoio: volta a base
        j.x+=(j.baseX-j.x)*0.005;j.y+=(j.baseY-j.y)*0.005;
      }
    });
    // goleiros saem um pouco
    M3D.jogadores.forEach(j=>{if(j.ehGol){const gx=j.time==='A'?-46:46;j.x+=(gx-j.x)*0.02;const dy=B.y-j.y;j.y+=Math.max(-0.4,Math.min(0.4,dy*0.05));}});
    // arbitro segue a jogada de longe 👨‍⚖️
    M3D.arbitro.x+=(B.x*0.6-M3D.arbitro.x)*0.03;
    M3D.arbitro.y+=(B.y+10-M3D.arbitro.y)*0.03;
  }
  // gol?
  if(Math.abs(B.x)>48&&Math.abs(B.y)<9){
    gol3D(B.x>0?'A':'B');
  }
  // linha de fundo / lateral: volta ao centro
  if(Math.abs(B.x)>55||Math.abs(B.y)>38){B.x=0;B.y=0;B.vx=0;B.vy=0;B.comQuem=M3D.jogadores[2];}
}

function gol3D(lado){
  // lado = time que marcou
  if(lado==='A')M3D.ga++;else M3D.gb++;
  const art = M3D.bola.comQuem;
  const nomeGol = art?art.nome:(lado==='A'?M3D.timeA.nome:M3D.timeB.nome);
  M3D.festa=170;M3D.festaQuem=lado;
  M3D.confetes=[];
  for(let i=0;i<120;i++)M3D.confetes.push({x:Math.random()*640,y:-10-Math.random()*100,v:2+Math.random()*3,cor:['#f1c40f','#e74c3c','#2ecc71','#3498db','#fff'][i%5]});
  const txt=`⚽ GOOOL! ${nomeGol} marca para ${lado==='A'?M3D.timeA.nome:M3D.timeB.nome}! ${M3D.ga}x${M3D.gb} 🎉`;
  M3D.lance=txt;logSim(`<b>${M3D.minuto}' ${txt}</b>`);
  $('placar3d').textContent=`${M3D.timeA.sigla} ${M3D.ga} x ${M3D.gb} ${M3D.timeB.sigla} • ${M3D.minuto}'`;
}

function atualizarFesta3D(){
  M3D.confetes.forEach(c=>{c.y+=c.v;if(c.y>400)c.y=-10;});
  // jogadores do time que marcou correm para o centro e pulam
  M3D.jogadores.forEach(j=>{
    if(j.time===M3D.festaQuem){j.x+=(M3D.bola.x-j.x)*0.03;j.y+=(M3D.bola.y-4-j.y)*0.03;}
  });
  if(M3D.festa===1){M3D.bola.x=0;M3D.bola.y=0;M3D.bola.vx=0;M3D.bola.vy=0;M3D.bola.comQuem=M3D.jogadores[2];montarKickoff();}
}
function montarKickoff(){
  M3D.jogadores.forEach(j=>{j.x=j.baseX;j.y=j.baseY;});
}

function fimPartida3D(){
  const a=M3D.timeA,b=M3D.timeB;
  let res = M3D.ga>M3D.gb?`🏆 ${a.nome} VENCE!` : M3D.gb>M3D.ga?`🏆 ${b.nome} VENCE!`:`🤝 Empate!`;
  logSim(`<b>🏁 Fim: ${a.nome} ${M3D.ga} x ${M3D.gb} ${b.nome}. ${res}</b>`);
  logSim(`👨‍⚖️ Árbitro apita 3 vezes. Torcida aplaude! 👏`);
  M3D.lance=res;
  desenhar3D();
}

// ---- DESENHO ----
function desenhar3D(){
  const cv=$('campo3d');if(!cv)return;
  const ctx=cv.getContext('2d');
  const W=cv.width,H=cv.height;
  // ceu + arquibancada (torcida com pessoas)
  ctx.fillStyle='#0a2240';ctx.fillRect(0,0,W,120);
  // faixas da arquibancada
  for(let r=0;r<4;r++){
    for(let i=0;i<40;i++){
      const f=M3D.torcida[(r*40+i)%M3D.torcida.length];
      const x=(i/40)*W+((r%2)*8);
      const y=12+r*26 + Math.sin(Date.now()/300+f.fase)*(M3D.festa>0?6:1.5);
      ctx.fillStyle=f.cor;
      // corpinho
      ctx.beginPath();ctx.arc(x,y,7,0,7);ctx.fill();
      ctx.fillStyle='#f5cba7';ctx.beginPath();ctx.arc(x,y-6,4.5,0,7);ctx.fill();
      if(f.emoji){ctx.font='10px serif';ctx.fillText(M3D.festa>0?'🎉':'👏',x-5,y-12);}
    }
  }
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(0,112,W,10);
  ctx.fillStyle='#fff';ctx.font='bold 13px Arial';ctx.fillText(`🎺 FOOTBALL GAME CELEBRATIONS • 👨‍⚖️ Árbitro • 🥁 Torcida`,10,118-108+108);
  // campo em perspectiva (trapezio = 3D)
  ctx.fillStyle='#27ae60';ctx.fillRect(0,120,W,H-120);
  ctx.fillStyle='#2ecc71';
  for(let i=0;i<6;i++){if(i%2===0)ctx.fillRect(0,120+i*((H-120)/6),W,(H-120)/6);}
  // linhas
  ctx.strokeStyle='#fff';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(60,120);ctx.lineTo(10,H-10);ctx.moveTo(W-60,120);ctx.lineTo(W-10,H-10);ctx.stroke();
  ctx.strokeRect(10,H-10-0,W-20,0);
  ctx.beginPath();ctx.ellipse(W/2,(H+120)/2,70,26,0,0,7);ctx.stroke();
  ctx.beginPath();ctx.moveTo(W/2,120);ctx.lineTo(W/2,H-10);ctx.stroke();
  // projetar coordenadas logicas (-50..50, -35..35) para tela com perspectiva
  function proj(x,y){
    const nx=(x+50)/100; // 0..1
    const ny=(y+35)/70; // 0..1 fundo->frente
    const topW=W*0.72, botW=W*0.98;
    const w=topW+(botW-topW)*ny;
    const cx=W/2 + (nx-0.5)*w;
    const cy=128 + ny*(H-140);
    const escala=0.55+ny*0.9; // 3D: longe pequeno, perto grande
    return {x:cx,y:cy,s:escala};
  }
  // ordenar por y (profundidade)
  const ents=[...M3D.jogadores.map(j=>({...j,tipo:'jog'})),{tipo:'arb',x:M3D.arbitro.x,y:M3D.arbitro.y,nome:'ÁRBITRO'}, {tipo:'bola',x:M3D.bola.x,y:M3D.bola.y}];
  ents.sort((a,b)=>a.y-b.y);
  ents.forEach(e=>{
    const p=proj(e.x,e.y);
    // sombra
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(p.x,p.y+8*p.s,10*p.s,4*p.s,0,0,7);ctx.fill();
    if(e.tipo==='jog'){
      const pulo = (M3D.festa>0&&e.time===M3D.festaQuem)?Math.abs(Math.sin(Date.now()/150+e.idx))*-10:0;
      ctx.fillStyle=e.cor;ctx.strokeStyle=e.borda;ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(p.x,p.y+pulo,9*p.s,0,7);ctx.fill();ctx.stroke();
      ctx.fillStyle='#000';ctx.font=`bold ${Math.max(8,10*p.s)}px Arial`;ctx.textAlign='center';
      ctx.fillStyle='#fff';ctx.fillText(e.ehGol?'🧤':(e.nome||'').substring(0,6),p.x,p.y+pulo-12*p.s);
    } else if(e.tipo==='arb'){
      ctx.font=`${22*p.s}px serif`;ctx.textAlign='center';ctx.fillText('👨‍⚖️',p.x,p.y);
      ctx.fillStyle='#ffeb3b';ctx.font='bold 9px Arial';ctx.fillText('ÁRBITRO',p.x,p.y+12);
    } else {
      ctx.font=`${16*p.s}px serif`;ctx.textAlign='center';ctx.fillText('⚽',p.x,p.y-4);
    }
  });
  // confetes da celebration
  M3D.confetes.forEach(c=>{ctx.fillStyle=c.cor;ctx.fillRect(c.x*W/640,c.y,5,8);});
  // placar na tela
  ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(8,126,300,26);
  ctx.fillStyle='#fff';ctx.font='bold 14px Arial';ctx.textAlign='left';
  ctx.fillText(`${M3D.timeA?M3D.timeA.sigla:''} ${M3D.ga} x ${M3D.gb} ${M3D.timeB?M3D.timeB.sigla:''} • ${M3D.minuto}'`,14,144);
  if(M3D.festa>0){ctx.fillStyle='#f1c40f';ctx.font='bold 22px Arial';ctx.textAlign='center';ctx.fillText('🎉 GOOOL! CELEBRATION! 🎉',W/2,180);}
}
function mudarVelocidade(v){M3D.speed=v;}
