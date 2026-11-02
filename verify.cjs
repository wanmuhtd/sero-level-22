// Integration checks execute the actual game in a deterministic DOM/canvas harness.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map(),windowEvents={},storage={};let raf;
const noop=()=>{};let lastImageDraw;const alpha=new Uint8ClampedArray(1024*1024*4).fill(255);
const draw=new Proxy({},{get:(_,key)=>key==='measureText'?text=>({width:text.length*8}):key==='getImageData'?()=>({data:alpha}):key==='drawImage'?(...args)=>{lastImageDraw=args;}:noop,set:()=>true});
class Element{constructor(){this.hidden=false;this.textContent='';this.style={setProperty:noop};this.events={};this.classList={add:noop,remove:noop,toggle:noop};this.dataset={};this.open=false;}addEventListener(n,f){this.events[n]=f;}setAttribute(){}getBoundingClientRect(){return{width:960,height:530};}getContext(){return draw;}focus(){}querySelector(){return new Element();}showModal(){this.open=true;}close(){this.open=false;this.events.close?.();}click(){this.events.click?.({});}}
const el=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
const context={console,Math,Set,JSON,Number,Array,HTMLButtonElement:Element,Image:class{naturalWidth=1024;naturalHeight=1024;set src(v){this._src=v;this.onload?.();}get src(){return this._src;}},ResizeObserver:class{observe(){}},matchMedia:()=>({matches:false}),localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},setTimeout:()=>1,clearTimeout:noop,setInterval:()=>1,clearInterval:noop,requestAnimationFrame:f=>raf=f,document:{hidden:false,getElementById:el,createElement:()=>new Element(),querySelector:s=>s==='dialog[open]'?[...elements.values()].find(e=>e.open):el(s),querySelectorAll:()=>[],addEventListener:noop}};
context.window=context;context.addEventListener=(n,f)=>windowEvents[n]=f;vm.createContext(context);vm.runInContext(fs.readFileSync('dist/config.js','utf8'),context);vm.runInContext(fs.readFileSync('dist/ride.js','utf8'),context);
const source=fs.readFileSync('dist/game.js','utf8').replace(/\}\)\(\);\s*$/,'window.__test={get state(){return state}, get frontPose(){return frontPose}, get particles(){return particles}, get rideEffects(){return rideEffects}, spriteBounds, ride, summonKebab, rideFrame, updateRideUI, update, draw, drawCharacter, walkFrame, chooseDirection, interact, keys, canWalk, doJump, get jump(){return jump}, get paused(){return paused}, setPaused, get moving(){return moving}, get direction(){return direction}, get walkReady(){return walkReady}, get rideReady(){return rideReady}, get spriteReady(){return spriteReady}, starPositions, start(){started=true}};})();');
vm.runInContext(source,context);const g=context.__test;assert.equal(g.summonKebab(),false);g.start();g.draw();assert.equal(g.spriteReady,true);
// Detached bits from adjacent animation rows must not stretch the character crop.
const pixels=new Uint8ClampedArray(20*20*4),opaque=(x,y)=>pixels[(y*20+x)*4+3]=255;
for(let y=7;y<=11;y++)for(let x=7;x<=10;x++)opaque(x,y);
for(let x=5;x<15;x++)opaque(x,14);opaque(13,5);
assert.deepEqual(JSON.parse(JSON.stringify(g.spriteBounds(pixels,20,5,5,10,10))),{x:6,y:6,w:6,h:7});
// Every input direction selects a distinct sprite row, including a genuine back view.
assert.equal(g.walkReady,true);
for(const [key,direction,row] of [['d','right',2],['w','up',3],['a','left',1],['s','down',0]]){
  g.state.x=400;g.state.y=650;g.keys.add(key);g.update(.14);g.keys.clear();
  assert.equal(g.direction,direction);assert.equal(g.walkFrame().row,row);assert.equal(g.moving,true);
  g.drawCharacter();assert.equal(lastImageDraw[0].src,context.BIRTHDAY_CONFIG.directional_sprite.path);const spec=context.BIRTHDAY_CONFIG.directional_sprite;assert.equal(lastImageDraw[2],Math.round(spec.row_edges[row]*1024/spec.atlas_size));assert.equal(lastImageDraw.length,9);
  const movingFrame=g.walkFrame().frame;g.update(.01);assert.equal(g.walkFrame().frame,0);assert.equal(g.direction,direction);assert.equal(g.moving,false);assert.notEqual(movingFrame,0);
}
g.drawCharacter();assert.equal(lastImageDraw[0],g.frontPose.canvas,'Idle must use the same fixed front image as celebration');assert.equal(lastImageDraw[7],g.frontPose.width);assert.equal(lastImageDraw[8],g.frontPose.height);
assert.equal(g.chooseDirection(1,-1,'up'),'up');assert.equal(g.chooseDirection(1,-1,'right'),'right');
g.state.x=1405;g.state.y=600;g.keys.add('d');g.update(.1);g.keys.clear();assert.equal(g.moving,false);assert.equal(g.walkFrame().frame,0);
g.state.x=400;g.state.y=650;g.keys.add('a');g.keys.add('d');g.update(.1);g.keys.clear();assert.equal(g.moving,false);
// Ride skill: five seconds active, then a full ten-second cooldown, no stacking.
const timer=new context.KebabRide();assert.equal(timer.activate(),true);assert.equal(timer.activate(),false);timer.tick(4.99);assert.equal(timer.active,true);timer.tick(.01);assert.equal(timer.phase,'cooldown');assert.equal(timer.remaining,10);assert.equal(timer.activate(),false);timer.tick(9.99);assert.equal(timer.phase,'cooldown');timer.tick(.01);assert.equal(timer.phase,'ready');assert.equal(timer.activate(),true);timer.tick(15);assert.equal(timer.phase,'ready');
assert.equal(g.rideReady,true);assert.equal(g.summonKebab(),true);assert.equal(g.summonKebab(),false);g.doJump();assert.equal(g.jump,0);
g.state.x=900;g.state.y=620;const particleCount=g.particles.length;g.keys.add('d');g.update(.2);g.keys.clear();assert.equal(g.particles.length,particleCount,'Riding should not emit celebration confetti');
assert.ok(g.rideEffects.some(p=>p.kind==='smoke'));assert.ok(g.rideEffects.some(p=>p.kind==='dust'));assert.ok(g.rideEffects.every(p=>p.x<g.state.x),'Smoke must come from behind a right-facing scooter');
const effectCount=g.rideEffects.length;g.update(.1);assert.equal(g.rideEffects.length,effectCount,'Idle scooter should not emit more smoke');
g.state.x=400;g.state.y=650;g.keys.add('d');g.update(.1);g.keys.clear();assert.ok(g.state.x>424&&g.state.x<425);
for(const [key,col] of [['s',0],['a',1],['d',2],['w',3]]){g.keys.add(key);g.update(.1);g.keys.clear();assert.equal(g.rideFrame().col,col);g.drawCharacter();assert.equal(lastImageDraw[0].src,context.BIRTHDAY_CONFIG.ride_skill.asset_path);}
g.setPaused(true);const remaining=g.ride.remaining;g.update(3);assert.equal(g.ride.remaining,remaining);g.setPaused(false);
el('help-dialog').showModal();g.update(3);assert.equal(g.ride.remaining,remaining);el('help-dialog').close();
g.state.x=560;g.state.y=400;g.keys.add('d');g.update(.04);g.keys.clear();assert.equal(g.state.x,560);assert.equal(g.moving,false);
g.state.x=680;g.state.y=400;g.keys.add('s');g.update(.04);g.keys.clear();assert.ok(g.state.y>400);
g.state.x=1195;g.state.y=215;g.interact();assert.equal(g.state.cakeLit,false);
g.update(g.ride.remaining);assert.equal(g.ride.phase,'cooldown');assert.equal(g.ride.remaining,10);assert.equal(g.summonKebab(),false);g.update(10);assert.equal(g.ride.phase,'ready');assert.equal(g.summonKebab(),true);g.ride.reset();
// Locked cake and gift cannot skip collection.
g.state.x=1195;g.state.y=215;g.interact();assert.equal(g.state.cakeLit,false);g.state.x=1320;g.state.y=260;g.interact();assert.equal(g.state.giftOpened,false);
// Pond rejects entry but crossing is walkable.
assert.equal(g.canWalk(580,400),false);assert.equal(g.canWalk(680,400),true);assert.equal(g.canWalk(-5,100),false);
g.state.x=190;g.state.y=650;g.keys.add('d');g.update(.2);g.keys.clear();assert.ok(g.state.x>190);g.doJump();g.update(.1);assert.ok(g.jump>0);for(let i=0;i<40;i++)g.update(.03);assert.equal(g.jump,0);
g.setPaused(true);let px=g.state.x;g.keys.add('d');g.update(1);assert.equal(g.state.x,px);g.setPaused(false);
// All 22 world pickups are reachable and cannot be counted twice.
for(const [x,y] of g.starPositions){assert.ok(g.canWalk(x,y),`Unreachable star ${x},${y}`);g.state.x=x;g.state.y=y;g.update(.016);g.update(.016);}assert.equal(g.state.stars.length,22);assert.equal(el('count').textContent,22);
g.state.x=1195;g.state.y=215;g.interact();assert.equal(g.state.cakeLit,true);assert.equal(g.state.giftOpened,false);
g.drawCharacter();assert.equal(lastImageDraw[0],g.frontPose.canvas);assert.equal(lastImageDraw[7],g.frontPose.width);assert.equal(lastImageDraw[8],g.frontPose.height);assert.equal(lastImageDraw[1],0);assert.equal(lastImageDraw[2],0);assert.ok(Math.abs(lastImageDraw[7]/lastImageDraw[8]-lastImageDraw[3]/lastImageDraw[4])<.02,'Celebration must preserve the sprite aspect ratio');
g.state.x=1320;g.state.y=260;g.interact();assert.equal(g.state.giftOpened,true);assert.equal(el('gift-dialog').open,true);el('next-dialog').click();assert.match(el('greeting').textContent,/Sero/);assert.equal(el('quest-progress').textContent,'100%');g.drawCharacter();assert.equal(lastImageDraw[0],g.frontPose.canvas,'Reading the letter must keep the same fixed character image');assert.equal(lastImageDraw[7],g.frontPose.width);assert.equal(lastImageDraw[8],g.frontPose.height);g.draw();
el('gift-dialog').close();g.interact();assert.equal(el('gift-dialog').open,true);assert.equal(JSON.parse(storage[context.BIRTHDAY_CONFIG.storage_key]).giftOpened,true);
el('gift-dialog').close();el('confirm-reset').click();assert.equal(g.state.stars.length,0);assert.equal(g.state.cakeLit,false);assert.equal(g.state.giftOpened,false);
console.log('PASS: 5s ride / 10s cooldown, retrigger guards, ride speed, 4 mounted directions, pause/dialog freeze, mounted collision and dismount; four walking directions, idle, jump, 22 stars, cake/gift gates, persistence and reset.');



