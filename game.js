(() => {
  'use strict';
  const cfg = window.BIRTHDAY_CONFIG;
  const $ = id => document.getElementById(id);
  const canvas = $('game'), ctx = canvas.getContext('2d');
  const W = 1440, H = 960, keys = new Set(), particles = [];
  const starPositions = [[245,650],[350,630],[450,710],[210,800],[380,845],[550,825],[680,720],[800,820],[945,800],[1110,790],[1270,840],[1315,670],[1150,590],[980,570],[865,455],[980,360],[1130,360],[1310,425],[410,450],[260,310],[470,210],[790,190]];
  const cake = {x:1195,y:215}, gift = {x:1320,y:260};
  const snacks = [{x:510,y:620},{x:895,y:690},{x:1070,y:300}];
  const pond = {x:555,y:310,w:260,h:190};
  const trees = [[90,160],[190,110],[325,130],[90,370],[110,530],[80,750],[135,910],[500,100],[665,100],[880,90],[1050,85],[1370,105],[1380,490],[1380,730],[1370,920],[1120,920],[940,925],[660,925],[430,930],[570,570],[1010,450],[360,330]];
  let state = {x:190,y:650,stars:[],snacks:[],cakeLit:false,giftOpened:false}, started=false, paused=false, showMap=false, t=0, last=0, saveClock=0, jump=0, jumpVelocity=0, cheer=0, moving=false, facing=1, toastTimer, typeTimer, typing=false;
  let vw=960,vh=530, cam={x:0,y:0};
  let direction='down', walkTime=0;
  const ride=new window.KebabRide(cfg.ride_skill);
  const rideSprite=new Image();let rideReady=false,rideFrames=[],rideScales=[],lastSkillText='';
  const rideEffects=[];let effectClock=0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function load(){try{const s=JSON.parse(localStorage.getItem(cfg.storage_key));if(s&&Array.isArray(s.stars)){state.x=Number.isFinite(s.x)?Math.max(35,Math.min(W-35,s.x)):190;state.y=Number.isFinite(s.y)?Math.max(70,Math.min(H-35,s.y)):650;state.stars=[...new Set(s.stars.filter(n=>Number.isInteger(n)&&n>=0&&n<22))];state.snacks=Array.isArray(s.snacks)?s.snacks.filter(n=>n>=0&&n<3):[];state.cakeLit=state.stars.length===22&&!!s.cakeLit;state.giftOpened=state.cakeLit&&!!s.giftOpened;}}catch{}}
  function save(){try{localStorage.setItem(cfg.storage_key,JSON.stringify(state));}catch{}}
  load();save();
  function spriteBounds(data,width,ox,oy,cw,ch){
    if(!data)return {x:ox,y:oy,w:cw,h:ch};
    // Find the actual connected sprite, excluding neighboring-frame fragments
    // and detached export speckles that otherwise shift or stretch its crop.
    const visited=new Uint8Array(cw*ch),queue=new Int32Array(cw*ch);let best=null;
    const solid=(x,y)=>{const i=((oy+y)*width+ox+x)*4;return data[i+3]>160&&!(data[i]>245&&data[i+1]<10&&data[i+2]<10);};
    for(let start=0;start<visited.length;start++){
      if(visited[start])continue;visited[start]=1;const sx=start%cw,sy=Math.floor(start/cw);if(!solid(sx,sy))continue;
      let head=0,tail=1,left=sx,right=sx,top=sy,bottom=sy;queue[0]=start;
      while(head<tail){const p=queue[head++],x=p%cw,y=Math.floor(p/cw);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx<0||nx>=cw||ny<0||ny>=ch)continue;const n=ny*cw+nx;if(visited[n])continue;visited[n]=1;if(solid(nx,ny))queue[tail++]=n;}
      }
      if(!best||tail>best.area)best={area:tail,left,right,top,bottom};
    }
    if(!best)return {x:ox,y:oy,w:cw,h:ch};
    const left=Math.max(0,best.left-1),top=Math.max(0,best.top-1),right=Math.min(cw-1,best.right+1),bottom=Math.min(ch-1,best.bottom+1);
    return {x:ox+left,y:oy+top,w:right-left+1,h:bottom-top+1};
  }
  const sprite = new Image();let spriteReady=false;
  sprite.onload=()=>{spriteReady=true;};sprite.onerror=()=>{if(!sprite.src.endsWith(cfg.character_fallback_path))sprite.src=cfg.character_fallback_path;else toast('Karakter belum termuat. Coba muat ulang halaman.');};sprite.src=cfg.character_sprite_path;
  const walkSprite=new Image();let walkReady=false,walkFrames=[],walkScale=1,frontPose=null;
  if(cfg.directional_sprite){
    walkSprite.onload=()=>{
      const spec=cfg.directional_sprite, sheet=document.createElement('canvas');
      sheet.width=walkSprite.naturalWidth;sheet.height=walkSprite.naturalHeight;
      const sc=sheet.getContext('2d',{willReadFrequently:true});sc.drawImage(walkSprite,0,0);
      let data=null;try{data=sc.getImageData(0,0,sheet.width,sheet.height).data;}catch{}
      walkFrames=[];
      for(let row=0;row<spec.rows;row++)for(let col=0;col<spec.columns;col++){
        const edgeX=i=>Math.round(i*sheet.width/spec.columns),edgeY=i=>Math.round(spec.row_edges?spec.row_edges[i]*sheet.height/spec.atlas_size:i*sheet.height/spec.rows);
        const ox=edgeX(col),oy=edgeY(row),cw=edgeX(col+1)-ox,ch=edgeY(row+1)-oy;
        walkFrames.push(spriteBounds(data,sheet.width,ox,oy,cw,ch));
      }
      walkScale=72/Math.max(...walkFrames.map(f=>f.h));
      // Cache one immutable front-facing standing image. Idle and celebration
      // both draw these exact pixels at 1:1 size, so the body cannot squash.
      const f=walkFrames[0],front=document.createElement('canvas');front.width=Math.round(f.w*walkScale);front.height=Math.round(f.h*walkScale);
      const fc=front.getContext('2d');fc.imageSmoothingEnabled=false;fc.drawImage(walkSprite,f.x,f.y,f.w,f.h,0,0,front.width,front.height);
      frontPose={canvas:front,width:front.width,height:front.height};walkReady=true;
    };
    walkSprite.onerror=()=>{walkReady=false;};walkSprite.src=cfg.directional_sprite.path;
  }
  function chooseDirection(dx,dy,previous){
    // Keep the facing stable while two diagonal keys are held.
    if(dx&&dy){if((previous==='left'&&dx<0)||(previous==='right'&&dx>0)||(previous==='up'&&dy<0)||(previous==='down'&&dy>0))return previous;}
    if(Math.abs(dy)>Math.abs(dx))return dy<0?'up':'down';
    if(dx)return dx<0?'left':'right';
    return dy?(dy<0?'up':'down'):previous;
  }
  function walkFrame(){
    const spec=cfg.directional_sprite;if(!spec)return null;
    const row=spec.directions.indexOf(direction),frame=moving&&!reduced?Math.floor(walkTime*(spec.fps||8))%spec.columns:0;
    return {row:Math.max(0,row),frame,index:Math.max(0,row)*spec.columns+frame};
  }
  rideSprite.onload=()=>{
    const sheet=document.createElement('canvas');sheet.width=rideSprite.naturalWidth;sheet.height=rideSprite.naturalHeight;
    const sc=sheet.getContext('2d',{willReadFrequently:true});sc.drawImage(rideSprite,0,0);let data=null;
    try{data=sc.getImageData(0,0,sheet.width,sheet.height).data;}catch{}
    rideFrames=[];
    for(let row=0;row<4;row++)for(let col=0;col<4;col++){
      const spec=cfg.ride_skill;
      const edgeX=i=>Math.round(spec.column_edges?spec.column_edges[i]*sheet.width/spec.atlas_size:i*sheet.width/4);
      const edgeY=i=>Math.round(spec.row_edges?spec.row_edges[i]*sheet.height/spec.atlas_size:i*sheet.height/4);
      const ox=edgeX(col),oy=edgeY(row),cw=edgeX(col+1)-ox,ch=edgeY(row+1)-oy;
      rideFrames.push(spriteBounds(data,sheet.width,ox,oy,cw,ch));
    }
    const boyHeight=Math.max(...rideFrames.slice(0,4).map(f=>f.h)),bikeHeight=Math.max(...rideFrames.slice(4,8).map(f=>f.h)),pairHeight=Math.max(...rideFrames.slice(8).map(f=>f.h));
    rideScales=[72/boyHeight,49/bikeHeight,98/pairHeight,98/pairHeight];rideReady=true;updateRideUI();
  };
  rideSprite.onerror=()=>{rideReady=false;updateRideUI();};rideSprite.src=cfg.ride_skill.asset_path;
  function updateRideUI(){
    const button=$('ride-skill'),phase=ride.phase;
    const blocked=!started||paused||anyDialog()||!rideReady||phase!=='ready';button.disabled=blocked;
    button.dataset.phase=phase;
    const value=phase==='ready'?'SIAP':ride.remaining.toFixed(1)+'d';
    const label=!rideReady?'Memuat Scoopy…':!started?'Mulai game untuk memanggil':phase==='riding'?'Sero & Kebab · boncengan':phase==='cooldown'?'Tunggu sebentar ya…':'Minta antar · tekan Q';
    const signature=label+value+blocked;
    if(signature!==lastSkillText){lastSkillText=signature;$('skill-label').textContent=label;$('skill-timer').textContent=value;button.setAttribute('aria-label','Call Kebab, '+label+', '+value);}
    const ratio=phase==='ready'?1:phase==='riding'?ride.remaining/ride.duration:1-ride.remaining/ride.cooldown;
    button.style.setProperty('--skill-progress',Math.max(0,Math.min(100,ratio*100))+'%');
    $('ride-status').hidden=!ride.active;$('ride-status').textContent='Boncengan · '+ride.remaining.toFixed(1)+'d';
  }
  function summonKebab(){
    if(!started||paused||anyDialog()||!rideReady)return false;
    if(!ride.activate())return false;
    jump=0;jumpVelocity=0;cheer=0;effectClock=0;sfx('fanfare');burst(state.x,state.y-20,24);
    toast('Kebab datang! Yuk boncengan. Gunakan panah / WASD / D-Pad.');updateRideUI();canvas.focus({preventScroll:true});return true;
  }
  $('ride-skill').addEventListener('click',summonKebab);
  document.querySelector('.memory img').src=cfg.memory_photo_path;
  function resize(){const box=$('viewport').getBoundingClientRect();const width=Math.max(1,box.width),height=Math.max(1,box.height);vw=Math.max(280,Math.min(960,Math.round(width)));vh=Math.max(1,Math.round(height/(width/vw)));canvas.width=vw;canvas.height=vh;ctx.imageSmoothingEnabled=false;}
  new ResizeObserver(resize).observe($('viewport'));resize();
  function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3000);}
  function updateHud(){const n=state.stars.length;$('count').textContent=n;const percent=state.giftOpened?100:state.cakeLit?92:Math.round(n/22*80);$('quest-progress').textContent=percent+'%';$('progress-bar').style.width=percent+'%';$('phase-label').textContent=state.giftOpened?'Level 22 Achieved':state.cakeLit?'Secret Gift Unboxing':n===22?'The Giant Cake Encounter':'Birthday Quest';$('objective').textContent=state.giftOpened?'Level 22 tercapai! Nikmati taman dan buka lagi pesanmu kapan saja.':state.cakeLit?'Kado emas sudah terbuka untukmu. Dekati kado di samping kue.':n===22?'Semua bintang terkumpul! Datangi kue di timur laut, lalu tekan interaksi.':'Kumpulkan 22 bintang untuk menyalakan lilin ulang tahun.';[1,2,3].forEach((step)=>{const done=step===1?n===22:step===2?state.cakeLit:state.giftOpened;const active=step===1?n<22:step===2?n===22&&!state.cakeLit:state.cakeLit&&!state.giftOpened;const el=$('step'+step);el.classList.toggle('complete',done);el.classList.toggle('active',active);el.querySelector('.step-state').textContent=done?'COMPLETE':active?'IN PROGRESS':'LOCKED';});}
  updateHud();
  // Audio is synthesized locally. Nothing is downloaded or autoplayed before a gesture.
  let audio=null, master=null, musicOn=false, musicTimer=null, noteIndex=0;
  const melody=[[67,.25],[67,.25],[69,.5],[67,.5],[72,.5],[71,1],[67,.25],[67,.25],[69,.5],[67,.5],[74,.5],[72,1],[67,.25],[67,.25],[79,.5],[76,.5],[72,.5],[71,.5],[69,1],[77,.25],[77,.25],[76,.5],[72,.5],[74,.5],[72,1.5]];
  async function ensureAudio(){try{if(!audio){audio=new (window.AudioContext||window.webkitAudioContext)();master=audio.createGain();master.gain.value=.13;master.connect(audio.destination);}if(audio.state==='suspended')await audio.resume();return true;}catch{return false;}}
  function tone(midi,duration=.12,delay=0,type='square',volume=.28){if(!audio||!musicOn||audio.state!=='running')return;const o=audio.createOscillator(),g=audio.createGain(),at=audio.currentTime+delay;o.type=type;o.frequency.value=440*2**((midi-69)/12);g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(volume,at+.008);g.gain.exponentialRampToValueAtTime(.001,at+duration);o.connect(g);g.connect(master);o.start(at);o.stop(at+duration+.02);}
  function musicStep(){if(!musicOn||paused||document.hidden)return;const [note,len]=melody[noteIndex%melody.length];tone(note,len*.39,0,'square',.17);if(noteIndex%2===0)tone(note-24,len*.42,0,'triangle',.35);noteIndex++;musicTimer=setTimeout(musicStep,len*470);}
  async function sound(enable){if(enable&&!(await ensureAudio())){toast('Audio belum tersedia di browser ini.');return;}musicOn=enable;$('sound-label').textContent=enable?'ON':'OFF';$('sound-button').setAttribute('aria-pressed',enable);$('sound-button').setAttribute('aria-label',enable?'Matikan musik':'Nyalakan musik');clearTimeout(musicTimer);if(master)master.gain.value=enable?.13:0;if(enable&&!paused)musicStep();}
  function sfx(kind){if(kind==='coin'){tone(84,.1);tone(91,.22,.08);}else if(kind==='jump'){tone(60,.08);tone(72,.12,.06);}else{[72,76,79,84].forEach((n,i)=>tone(n,.3,i*.12));}}
  $('sound-button').addEventListener('click',()=>sound(!musicOn));
  $('start').addEventListener('click',()=>{started=true;$('welcome').hidden=true;canvas.focus({preventScroll:true});document.querySelector('.game-frame').scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});sound(true);toast(state.stars.length?'Selamat datang kembali! Petualanganmu tersimpan.':'Halo, Sero! Ikuti bintang emas. Taman ini milikmu hari ini.');});
  $('map-button').addEventListener('click',()=>{showMap=!showMap;$('map-button').setAttribute('aria-pressed',showMap);if(started)canvas.focus({preventScroll:true});});
  function anyDialog(){return !!document.querySelector('dialog[open]');}
  function setPaused(value){paused=value;keys.clear();$('pause-screen').hidden=!value;clearTimeout(musicTimer);if(audio){if(value)audio.suspend();else{audio.resume();if(musicOn)musicStep();}}updateRideUI();}
  $('pause-button').addEventListener('click',()=>{if(started)setPaused(!paused);});$('resume').addEventListener('click',()=>{setPaused(false);canvas.focus({preventScroll:true});});
  $('help-button').addEventListener('click',()=>{keys.clear();$('help-dialog').showModal();});
  document.querySelectorAll('.close-dialog').forEach(b=>b.addEventListener('click',()=>{b.closest('dialog').close();canvas.focus({preventScroll:true});}));
  document.querySelectorAll('dialog').forEach(d=>d.addEventListener('close',()=>keys.clear()));
  $('restart').addEventListener('click',()=>$('reset-dialog').showModal());$('cancel-reset').addEventListener('click',()=>$('reset-dialog').close());
  $('confirm-reset').addEventListener('click',()=>{state={x:190,y:650,stars:[],snacks:[],cakeLit:false,giftOpened:false};jump=0;jumpVelocity=0;cheer=0;particles.length=0;rideEffects.length=0;effectClock=0;ride.reset();save();updateHud();$('reset-dialog').close();if(paused)setPaused(false);updateRideUI();toast('Petualangan baru. 22 harapan menantimu!');});
  function doJump(){if(!started||paused||anyDialog()||jump>0)return;if(ride.active){toast('Lagi boncengan! Kendalikan Scoopy dengan tombol arah.');return;}jumpVelocity=190;jump=.01;sfx('jump');}
  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
  function interact(){if(!started||paused||anyDialog())return;if(ride.active){toast('Sebentar ya, turun dari Scoopy setelah waktunya habis.');return;}if(distance(state,cake)<115){if(state.stars.length<22){toast('Kue ini butuh 22 bintang. Masih '+(22-state.stars.length)+' lagi!');return;}if(!state.cakeLit){state.cakeLit=true;cheer=5;sfx('fanfare');burst(cake.x,cake.y-55,120);save();updateHud();toast('Make a wish, Sero! Sekarang buka kado di sebelah kanan.');return;}}if(distance(state,gift)<100){if(!state.cakeLit){toast('Nyalakan lilin ulang tahun terlebih dahulu.');return;}state.giftOpened=true;cheer=4;save();updateHud();burst(gift.x,gift.y-25,90);openGift();return;}if(distance(state,cake)<115&&state.cakeLit){cheer=3;burst(cake.x,cake.y-45,60);sfx('fanfare');toast('Selamat ulang tahun, Sero! Semoga harapanmu terwujud.');return;}toast('Dekati kue atau kado untuk berinteraksi.');}
  $('interact').addEventListener('click',()=>{interact();if(!anyDialog())canvas.focus({preventScroll:true});});$('touch-a').addEventListener('pointerdown',e=>{e.preventDefault();doJump();});$('touch-b').addEventListener('pointerdown',e=>{e.preventDefault();interact();});
  document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);});['pointerup','pointercancel','lostpointercapture'].forEach(event=>b.addEventListener(event,()=>keys.delete(b.dataset.key)));});
  // Long presses are game input, not text-selection or browser-menu gestures.
  document.querySelectorAll('.control-deck,.dpad,.action-pad,.skill-button,.tools,#game').forEach(surface=>{
    ['contextmenu','selectstart','dragstart'].forEach(event=>surface.addEventListener(event,e=>e.preventDefault()));
  });
  window.addEventListener('keydown',e=>{if(anyDialog())return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','w','a','s','d','W','A','S','D'].includes(e.key)&&started){if(e.target instanceof HTMLButtonElement&&e.key===' ')return;e.preventDefault();}if(!started)return;if(e.key==='Escape'){setPaused(!paused);return;}if(paused)return;if(e.key.toLowerCase()==='q'&&!e.repeat){e.preventDefault();summonKebab();}else if(e.key===' '&&!e.repeat){if(distance(state,cake)<115||distance(state,gift)<100)interact();else doJump();}else if(e.key.toLowerCase()==='e'&&!e.repeat)interact();else keys.add(e.key.length===1?e.key.toLowerCase():e.key);});
  window.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));window.addEventListener('blur',()=>{keys.clear();save();});document.addEventListener('visibilitychange',()=>{keys.clear();if(document.hidden){save();clearTimeout(musicTimer);if(audio)audio.suspend();}else if(!paused&&audio){audio.resume();if(musicOn)musicStep();}});
  function finishText(){clearInterval(typeTimer);typing=false;$('greeting').textContent=cfg.greeting;$('next-dialog').innerHTML='Close <span class="blink">▶</span>';}
  function openGift(){keys.clear();sfx('fanfare');$('gift-dialog').showModal();$('greeting').textContent='';$('next-dialog').innerHTML='Next <span class="blink">▶</span>';let i=0;typing=true;clearInterval(typeTimer);if(reduced){finishText();return;}typeTimer=setInterval(()=>{$('greeting').textContent=cfg.greeting.slice(0,++i);if(i>=cfg.greeting.length)finishText();},28);}
  $('next-dialog').addEventListener('click',()=>{if(typing)finishText();else{$('gift-dialog').close();canvas.focus({preventScroll:true});}});$('gift-dialog').addEventListener('close',()=>clearInterval(typeTimer));
  function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  function text(s,x,y,size=14,color='#594059',align='center'){ctx.fillStyle=color;ctx.font=`${size}px "VT323", monospace`;ctx.textAlign=align;ctx.fillText(s,Math.round(x),Math.round(y));}
  function star(x,y,size=1,color='#ffda73'){ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(size,size);const pattern=['...XX...','...XX...','XXXXXXXX','.XXXXXX.','..XXXX..','.XX..XX.','.X....X.'];pattern.forEach((r,j)=>[...r].forEach((v,i)=>{if(v==='X')rect(i-4,j-3,1,1,color);}));ctx.restore();}
  function cloud(x,y){rect(x+10,y,45,12,'#f9f0f1');rect(x,y+10,80,16,'#f9f0f1');rect(x+15,y+26,50,5,'#dcd5eb');}
  function tree(x,y,pink=false){rect(x-21,y+3,46,10,'#8fb277');rect(x-6,y-28,13,33,'#936b69');rect(x+3,y-28,4,33,'#775c61');const dark=pink?'#b77392':'#678d66',mid=pink?'#df9bb1':'#83ad77',light=pink?'#f2b8c8':'#a0c68c';rect(x-28,y-67,55,40,dark);rect(x-38,y-55,75,26,dark);rect(x-22,y-82,44,25,mid);rect(x-32,y-63,62,28,mid);rect(x-23,y-73,35,18,light);rect(x-27,y-54,20,9,light);rect(x+12,y-45,15,8,light);if(pink){rect(x-17,y-60,4,4,'#fff1dc');rect(x+14,y-65,4,4,'#fff1dc');}}
  function flower(x,y,c){rect(x,y,2,7,'#6d9b65');rect(x-3,y-4,8,6,c);rect(x-1,y-6,4,10,c);rect(x,y-2,2,2,'#fff2b5');}
  function fence(x,y,len){rect(x,y+7,len,5,'#e4cdac');rect(x,y+19,len,4,'#bb9f91');for(let i=0;i<len;i+=22){rect(x+i,y,7,29,'#fcf1d1');rect(x+i+5,y+3,2,26,'#d7bd9f');}}
  function sign(x,y,label){ctx.save();ctx.font='14px "VT323", monospace';const width=Math.ceil((Math.max(96,ctx.measureText(label).width+24))/4)*4;rect(x-3,y,6,30,'#946b67');rect(x-width/2,y-23,width,30,'#795b66');rect(x-width/2+3,y-20,width-6,24,'#f9e9c3');text(label,x,y-4,14);ctx.restore();}
  function bush(x,y){rect(x-17,y-10,35,19,'#7da875');rect(x-11,y-16,23,9,'#95bd83');rect(x-14,y-8,8,4,'#b1cd8d');}
  function bunting(x1,y1,x2,y2){const cols=['#e9a0b7','#e9d59a','#b4a3d1','#98bdce'];ctx.strokeStyle='#997780';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x1,y1);ctx.quadraticCurveTo((x1+x2)/2,(y1+y2)/2+45,x2,y2);ctx.stroke();for(let i=1;i<12;i++){const u=i/12,x=x1+(x2-x1)*u,y=y1+(y2-y1)*u+Math.sin(Math.PI*u)*22;rect(x,y,14,9,cols[i%4]);rect(x+3,y+9,8,5,cols[i%4]);rect(x+6,y+14,2,3,cols[i%4]);}}
  // A cached, deterministic garden keeps the pixel scene inexpensive on phones.
  const world=document.createElement('canvas');world.width=W;world.height=H;const worldCtx=world.getContext('2d');
  function renderGround(){ctx.save();rect(0,0,W,H,'#b6d595');let seed=22;function rnd(){seed=(seed*16807)%2147483647;return seed/2147483647;}for(let i=0;i<2700;i++){const x=rnd()*W,y=rnd()*H;rect(x,y,3,2,i%2?'#a7c989':'#c3dda0');if(i%4===0)rect(x+2,y-2,2,2,'#a7c989');}
    // Lavender sky and distant scalloped hills at the northern garden edge.
    rect(0,0,W,100,'#d9d1ec');for(let x=0;x<W;x+=100){rect(x,72,120,35,'#a8bd9c');rect(x+20,59,70,20,'#a8bd9c');rect(x,98,100,20,'#95b68c');}cloud(140,24);cloud(650,12);cloud(1120,28);
    rect(150,597,1110,62,'#d8bd9a');rect(155,595,1100,55,'#f2dcaf');rect(350,190,62,650,'#d8bd9a');rect(353,190,56,650,'#f2dcaf');rect(380,190,930,62,'#d8bd9a');rect(380,190,930,55,'#f2dcaf');rect(1030,230,62,420,'#d8bd9a');rect(1033,230,56,420,'#f2dcaf');rect(375,805,700,48,'#ecd3a8');for(let i=0;i<300;i++){const x=rnd()*W,y=rnd()*H;if((y>600&&y<645)||(x>357&&x<402&&y>200&&y<830)||(x>1040&&x<1085&&y>245&&y<640)||(y>195&&y<242&&x>400)){rect(x,y,4,2,'#e6c999');}}
    // Pond, reeds and a little timber crossing.
    rect(pond.x-9,pond.y+12,pond.w+18,pond.h-24,'#91b788');rect(pond.x+12,pond.y-8,pond.w-24,pond.h+16,'#91b788');rect(pond.x,pond.y+15,pond.w,pond.h-30,'#88bac5');rect(pond.x+15,pond.y,pond.w-30,pond.h,'#88bac5');rect(pond.x+14,pond.y+14,pond.w-28,pond.h-28,'#a4d3d6');rect(pond.x+100,pond.y-10,60,pond.h+20,'#967c75');for(let y=pond.y-10;y<pond.y+pond.h+10;y+=13){rect(pond.x+97,y,66,10,'#d4ae84');rect(pond.x+102,y+1,55,3,'#e5c197');}rect(pond.x+93,pond.y-18,5,pond.h+36,'#84696a');rect(pond.x+163,pond.y-18,5,pond.h+36,'#84696a');
    // Stage for the cake.
    rect(1100,154,260,177,'#a98b9e');rect(1104,148,252,174,'#d6b8cb');rect(1115,159,230,152,'#e8cada');rect(1115,307,230,8,'#c19aaa');for(let x=1115;x<1350;x+=23)rect(x,163,2,140,'#ddbdd0');fence(1110,122,242);bunting(1040,104,1390,124);sign(1130,370,'BIRTHDAY STAGE');
    fence(160,868,330);fence(800,870,300);sign(210,575,'WISHING GARDEN');sign(420,300,'CAKE →');sign(880,710,'MAKE A WISH');
    for(let i=0;i<130;i++){const x=40+rnd()*(W-80),y=135+rnd()*(H-170);if((x>140&&x<430&&y>580&&y<670)||(x>540&&x<830&&y>290&&y<520)||(x>1090&&y<380))continue;flower(x,y,['#f3b4c3','#f4e7b2','#c4aed8'][i%3]);}
    [[470,520],[490,520],[510,520],[930,270],[950,270],[970,270],[210,220],[230,220],[250,220],[1190,725],[1210,725]].forEach(([x,y],i)=>flower(x,y,i%2?'#f2b9c7':'#fcdf99'));
    // Benches and a garden wishing well.
    [[460,735],[875,275],[1200,690]].forEach(([x,y])=>{rect(x,y,70,8,'#ab7a75');rect(x,y+11,70,13,'#c79284');rect(x+5,y+24,6,10,'#795e64');rect(x+58,y+24,6,10,'#795e64');});
    rect(720,605,80,29,'#b9a4a3');rect(727,597,66,10,'#e4d5bd');rect(737,602,44,8,'#82b4c0');rect(725,559,5,42,'#957978');rect(787,559,5,42,'#957978');rect(714,553,88,9,'#b5829c');rect(723,541,70,13,'#d59ab1');rect(733,534,50,8,'#e9b6c5');
    bushes.forEach(([x,y])=>bush(x,y));ctx.restore();worldCtx.drawImage(canvas,0,0);
  }
  // Render the large ground once using its own drawing context.
  const bushes=[[160,410],[460,380],[890,530],[950,900],[1250,520],[120,850],[550,900],[930,130],[1280,125],[530,255]];
  // Drawing helpers close over ctx; use a temporary same-size canvas viewport for caching.
  function refreshGround(){canvas.width=W;canvas.height=H;renderGround();resize();}
  refreshGround();if(document.fonts?.ready)document.fonts.ready.then(refreshGround);
  function cakeDraw(){const x=cake.x,y=cake.y;rect(x-62,y+25,126,13,'#b6a2b5');rect(x-55,y-8,110,38,'#d88ea6');rect(x-55,y-12,110,13,'#fff0d6');for(let i=-48;i<50;i+=17)rect(x+i,y-1,10,8,'#fff0d6');rect(x-42,y-43,84,32,'#edb0c3');rect(x-42,y-46,84,11,'#fff3df');for(let i=-35;i<35;i+=18)rect(x+i,y-37,8,8,'#fff3df');text('22',x,y-16,31,'#a56887');[-17,16].forEach((dx)=>{rect(x+dx,y-65,6,19,'#f5cd71');rect(x+dx+2,y-62,2,14,'#fff3b3');if(state.cakeLit){rect(x+dx,y-75+Math.sin(t*9)*2,6,9,'#f6b05b');rect(x+dx+2,y-78,2,7,'#fff2aa');}});if(state.stars.length===22&&!state.cakeLit)star(x,y-92+Math.sin(t*3)*3,2,'#fff3b3');}
  function giftDraw(){const x=gift.x,y=gift.y;rect(x-22,y,46,8,'#b69cab');rect(x-23,y-35,46,37,state.giftOpened?'#c98b9d':'#e89bad');rect(x-27,y-42-(state.giftOpened?14:0),54,12,'#f3b3c4');rect(x-5,y-42,10,44,'#eec877');rect(x-26,y-26,52,7,'#f5d68a');if(!state.giftOpened){rect(x-17,y-54,14,12,'#e5b45e');rect(x+3,y-54,14,12,'#e5b45e');rect(x-12,y-51,8,5,'#ffe3a0');rect(x+5,y-51,8,5,'#ffe3a0');}if(state.cakeLit)star(x,y-70+Math.sin(t*3)*4,1.5,'#fff1a5');}
  function burst(x,y,n){if(reduced)n=Math.min(n,15);for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*210,vy:-70-Math.random()*180,life:2+Math.random(),color:['#f5b2c5','#ffdf8f','#bb9dd5','#fff4d4','#87bdcf'][i%5],size:2+Math.random()*4});}
  function drawCharacter(){
    if(ride.active&&rideReady){drawRidingPair();return;}
    const x=Math.round(state.x),y=Math.round(state.y);rect(x-13,y-2,26,6,'#8ca974');
    const anim=cheer>0?'celebrate_cheer':jump>0?'jump':moving?'walk':'idle';
    const bounce=reduced?0:anim==='walk'?Math.abs(Math.sin(walkTime*Math.PI*8))*1.5:anim==='celebrate_cheer'?Math.abs(Math.sin(t*9))*12:Math.sin(t*2)*1.2;
    ctx.save();ctx.translate(x,y-jump-bounce);
    if(walkReady){
      if(frontPose&&(cheer>0||(!moving&&direction==='down'))){
        const p=frontPose;ctx.drawImage(p.canvas,0,0,p.width,p.height,-Math.round(p.width/2),-p.height,p.width,p.height);
      }else{
        const selected=walkFrame(),f=walkFrames[selected.index],dw=f.w*walkScale,dh=f.h*walkScale;
        ctx.drawImage(walkSprite,f.x,f.y,f.w,f.h,Math.round(-dw/2),Math.round(-dh),Math.round(dw),Math.round(dh));
      }
    }else if(spriteReady){
      if(facing<0&&cheer<=0)ctx.scale(-1,1);
      if(cfg.sprite_sheet){const s=cfg.sprite_sheet,row=['idle','walk','jump','celebrate_cheer'].indexOf(anim),frame=Math.floor(t*(s.fps||8))%s.frames,scale=72/s.frameHeight;ctx.drawImage(sprite,frame*s.frameWidth,row*s.frameHeight,s.frameWidth,s.frameHeight,-s.frameWidth*scale/2,-72,s.frameWidth*scale,72);}
      else{const sway=!reduced&&moving?Math.sin(walkTime*12)*.025:0;ctx.rotate(sway);const height=76,width=height*(sprite.naturalWidth||1)/(sprite.naturalHeight||1);ctx.drawImage(sprite,-width/2,-height,width,height);}
    }else{rect(-13,-42,26,34,'#fff4e6');rect(-19,-66,38,33,'#e2ba9c');rect(-11,-8,9,9,'#6884a3');rect(3,-8,9,9,'#6884a3');}
    if(cheer>0){star(-35,-55,1.1);star(35,-65,1.2);}ctx.restore();if(started&&t%5<3)text('SERO',x,y+18,12,'#536d4d');
  }
  function drawRideAsset(row,col,x,y){
    if(!rideReady)return;const f=rideFrames[row*4+col],scale=rideScales[row];
    ctx.drawImage(rideSprite,f.x,f.y,f.w,f.h,Math.round(x-f.w*scale/2),Math.round(y-f.h*scale),Math.round(f.w*scale),Math.round(f.h*scale));
  }
  function rideFrame(){const col=['down','left','right','up'].indexOf(direction);return {row:2+(moving&&!reduced?Math.floor(walkTime*6)%2:0),col:Math.max(0,col)};}
  function drawRidingPair(){
    const x=state.x,y=state.y,f=rideFrame();rect(x-28,y-3,56,7,'#8ca974');
    drawRideAsset(f.row,f.col,x,y-(moving&&!reduced?Math.sin(walkTime*18)*1:0));
    text('SERO & KEBAB',x,y+17,12,'#714750');
  }
  function updateRideEffects(dt){
    for(let i=rideEffects.length-1;i>=0;i--){const p=rideEffects[i];p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.age>=p.life)rideEffects.splice(i,1);}
  }
  function emitRideEffects(dt){
    if(!ride.active||!moving){effectClock=0;return;}
    effectClock+=dt;if(effectClock<(reduced?.17:.065))return;effectClock=0;
    const offsets={right:{x:-43,y:-10,bx:-1,by:0},left:{x:43,y:-10,bx:1,by:0},up:{x:14,y:2,bx:0,by:1},down:{x:-23,y:-32,bx:0,by:-1}};
    const o=offsets[direction];
    rideEffects.push({kind:'smoke',x:state.x+o.x,y:state.y+o.y,vx:o.bx*27+(Math.random()-.5)*9,vy:o.by*15-12,age:0,life:.9,size:8,color:'#b9aaa5'});
    if(!reduced)rideEffects.push({kind:'dust',x:state.x+o.bx*29,y:state.y+o.by*12+3,vx:o.bx*35+(Math.random()-.5)*16,vy:o.by*18-7,age:0,life:.65,size:7,color:'#d9bb91'});
  }
  function drawRideEffects(){
    ctx.save();
    for(const p of rideEffects){const progress=p.age/p.life,s=Math.round((p.size+progress*(p.kind==='smoke'?19:14))/2)*2,x=Math.round(p.x/2)*2,y=Math.round(p.y/2)*2;
      ctx.globalAlpha=(1-progress)*(p.kind==='smoke'?.72:.68);
      rect(x-s/2,y-s/4,s,s/2,p.color);rect(x-s/4,y-s/2,s/2,s,p.color);
      if(p.kind==='dust'){rect(x+s/2+3,y+1,3,3,p.color);rect(x-s/2-4,y-3,2,2,p.color);}
    }
    ctx.restore();
  }
  function drawKebabStop(){
    if(!rideReady||ride.phase!=='ready')return;
    drawRideAsset(1,2,325,760);drawRideAsset(0,0,285,760);text('KEBAB · [Q] MINTA ANTAR',303,779,12,'#714750');
  }
  function drawMap(){const mw=Math.min(vw-36,300),mh=mw*H/W,x=vw-mw-18,y=55;rect(x-4,y-4,mw+8,mh+8,'#49334e');rect(x,y,mw,mh,'#d7e6b6');const sx=mw/W,sy=mh/H;rect(x+pond.x*sx,y+pond.y*sy,pond.w*sx,pond.h*sy,'#88bac5');starPositions.forEach(([a,b],i)=>{if(!state.stars.includes(i))rect(x+a*sx-2,y+b*sy-2,4,4,'#b67c27');});rect(x+cake.x*sx-3,y+cake.y*sy-3,6,6,'#bf7091');rect(x+gift.x*sx-2,y+gift.y*sy-2,4,4,'#8a679b');rect(x+state.x*sx-3,y+state.y*sy-3,6,6,'#674565');text('★ BINTANG   ■ KUE / KADO',x+mw/2,y+mh+20,12,'#49334e');}
  function draw(){ctx.clearRect(0,0,vw,vh);ctx.imageSmoothingEnabled=false;cam.x=Math.max(0,Math.min(W-vw,state.x-vw/2));cam.y=Math.max(0,Math.min(H-vh,state.y-vh*.58));ctx.save();ctx.translate(-Math.round(cam.x),-Math.round(cam.y));ctx.drawImage(world,0,0);
    // Water highlights and floating lily pads.
    for(let i=0;i<10;i++){const x=pond.x+20+(i*47)%225,y=pond.y+25+(i*31)%140;if(x>pond.x+90&&x<pond.x+170)continue;rect(x+Math.sin(t+i)*3,y,16,2,'#cde7df');}[[590,370],[770,460]].forEach(([x,y])=>{rect(x,y,14,7,'#83b58e');rect(x+5,y-2,5,4,'#f4bccd');});
    starPositions.forEach(([x,y],i)=>{if(state.stars.includes(i))return;const bob=reduced?0:Math.sin(t*3+i)*3;rect(x-6,y+9,12,3,'#a3bc80');star(x+1,y+bob+1,2.4,'#b88743');star(x,y+bob-1,2.1,'#ffe18a');rect(x-2,y+bob-5,3,3,'#fff4c8');if(!reduced&&Math.sin(t*3+i)>0.8)star(x+15,y-11,0.6,'#fff4d4');});
    snacks.forEach((p,i)=>{if(state.snacks.includes(i))return;rect(p.x-8,p.y,18,9,'#f4d092');rect(p.x-8,p.y-4,18,5,'#fff3dc');rect(p.x-7,p.y+5,16,2,'#e9a4ba');rect(p.x+1,p.y-9,4,5,'#d77f94');});
    drawRideEffects();
    // Y sorting lets Sero walk in front of and behind the trees and stage props.
    const objects=trees.map(([x,y],i)=>({y,draw:()=>tree(x,y,i%4===0)}));objects.push({y:cake.y+30,draw:cakeDraw},{y:gift.y+5,draw:giftDraw},{y:760,draw:drawKebabStop},{y:state.y,draw:drawCharacter});objects.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
    if(started&&!state.giftOpened){let target;if(state.stars.length<22){const remaining=starPositions.map(([x,y],i)=>({x,y,i})).filter(p=>!state.stars.includes(p.i));target=remaining.sort((a,b)=>distance(a,state)-distance(b,state))[0];}else target=state.cakeLit?gift:cake;if(target&&distance(state,target)>90){const a=Math.atan2(target.y-state.y,target.x-state.x),x=state.x+Math.cos(a)*52,y=state.y-20+Math.sin(a)*46;ctx.save();ctx.translate(x,y);ctx.rotate(a);rect(-4,-3,7,6,'#fff4cb');rect(3,-1,3,2,'#fff4cb');ctx.restore();}}
    particles.forEach(p=>rect(p.x,p.y,p.size,p.size,p.color));if(state.cakeLit&&!reduced){for(let i=0;i<6;i++)star(1110+i*40,140+Math.sin(t*2+i)*15,0.7,'#fff1be');}ctx.restore();if(showMap)drawMap();}
  function canWalk(x,y){if(x<35||x>W-35||y<135||y>H-35)return false;const inPond=x>pond.x-7&&x<pond.x+pond.w+7&&y>pond.y-3&&y<pond.y+pond.h+6;const bridge=x>pond.x+88&&x<pond.x+172;return !inPond||bridge;}
  function update(dt){if(!started||paused||anyDialog())return;updateRideEffects(dt);let dx=(keys.has('d')||keys.has('ArrowRight')?1:0)-(keys.has('a')||keys.has('ArrowLeft')?1:0),dy=(keys.has('s')||keys.has('ArrowDown')?1:0)-(keys.has('w')||keys.has('ArrowUp')?1:0);
    const previousX=state.x,previousY=state.y;
    if(dx||dy){const next=chooseDirection(dx,dy,direction);if(next!==direction)walkTime=0;direction=next;const norm=Math.hypot(dx,dy),speed=ride.active?ride.speed:145;dx=dx/norm*speed*dt;dy=dy/norm*speed*dt;if(dx)facing=dx>0?1:-1;if(canWalk(state.x+dx,state.y))state.x+=dx;if(canWalk(state.x,state.y+dy))state.y+=dy;}
    moving=state.x!==previousX||state.y!==previousY;walkTime=moving?walkTime+dt:0;
    emitRideEffects(dt);
    if(ride.tick(dt)){burst(state.x,state.y-15,18);toast('Makasih, Kebab! Turun di sini dulu. Bisa panggil lagi 10 detik.');save();}updateRideUI();
    if(jump>0||jumpVelocity){jump+=jumpVelocity*dt;jumpVelocity-=550*dt;if(jump<=0){jump=0;jumpVelocity=0;}}cheer=Math.max(0,cheer-dt);
    starPositions.forEach(([x,y],i)=>{if(!state.stars.includes(i)&&Math.hypot(x-state.x,y-state.y)<29){state.stars.push(i);sfx('coin');burst(x,y,14);updateHud();save();if(state.stars.length===22){sfx('fanfare');cheer=3;toast('22/22! Semua harapan terkumpul. Kue menunggumu di timur laut!');}else if(state.stars.length%5===0)toast(state.stars.length+' bintang terkumpul. Teruskan petualanganmu!');}});
    snacks.forEach((p,i)=>{if(!state.snacks.includes(i)&&distance(p,state)<27){state.snacks.push(i);burst(p.x,p.y,12);sfx('coin');save();toast('Sepotong kebahagiaan! Bonus kue '+state.snacks.length+'/3.');}});
    const nearCake=distance(state,cake)<115,nearGift=distance(state,gift)<100;$('interact').hidden=ride.active||!(nearCake||nearGift);$('interact').textContent=nearGift?(state.giftOpened?'ⓔ Baca ucapan lagi':'ⓔ Buka kado'):(state.cakeLit?'ⓔ Rayakan!':'ⓔ Nyalakan lilin');$('location-name').textContent=state.x>1000&&state.y<450?'BIRTHDAY STAGE':state.x>500&&state.x<880&&state.y<550?'WISHING POND':'WISHING GARDEN';saveClock+=dt;if(saveClock>2){saveClock=0;save();}}
  function frame(now){const dt=Math.min(.04,(now-last)/1000||.016);last=now;if(!paused&&!document.hidden){t+=dt;update(dt);for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=140*dt;p.life-=dt;if(p.life<=0)particles.splice(i,1);}draw();}requestAnimationFrame(frame);}
  requestAnimationFrame(frame);
})();



