(function(){
const el=id=>document.getElementById(id);
function fatal(m){el('msg').textContent=m;el('start').style.display='none';el('menu').style.display='flex';}

const store={get(k){try{return localStorage.getItem(k);}catch(e){return null;}},set(k,v){try{localStorage.setItem(k,v);}catch(e){}}};

if(typeof THREE==='undefined'){fatal('Não foi possível carregar o three.js. Verifique sua conexão com a internet e recarregue a página.');return;}

const canvas=document.getElementById('c');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true});}
catch(e){fatal('Seu navegador não conseguiu iniciar o WebGL. Tente atualizar o navegador ou ativar a aceleração de hardware.');return;}
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x87ceeb);
scene.fog=new THREE.Fog(0x87ceeb,40,160);
const camera=new THREE.PerspectiveCamera(70,1,0.1,300);
scene.add(new THREE.HemisphereLight(0xffffff,0x556655,0.9));
const sun=new THREE.DirectionalLight(0xffffff,0.8);sun.position.set(10,20,5);scene.add(sun);

const LANES=[-4.5,-1.5,1.5,4.5], ROAD_W=13;
function resize(){const w=window.innerWidth||800,h=window.innerHeight||600;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
addEventListener('resize',resize);resize();

// chão e estrada
const grass=new THREE.Mesh(new THREE.PlaneGeometry(400,400),new THREE.MeshLambertMaterial({color:0x3a8f3a}));
grass.rotation.x=-Math.PI/2;grass.position.y=-0.02;scene.add(grass);
const road=new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W,400),new THREE.MeshLambertMaterial({color:0x333333}));
road.rotation.x=-Math.PI/2;road.position.set(0,0,-100);scene.add(road);
[-ROAD_W/2,ROAD_W/2].forEach(x=>{const l=new THREE.Mesh(new THREE.PlaneGeometry(0.2,400),new THREE.MeshBasicMaterial({color:0xffffff}));l.rotation.x=-Math.PI/2;l.position.set(x,0.01,-100);scene.add(l);});
const dashes=[];const DASH_SP=8,DASH_N=30;
const dashGeo=new THREE.PlaneGeometry(0.15,3),dashMat=new THREE.MeshBasicMaterial({color:0xffffff});
[-3,0,3].forEach(x=>{for(let i=0;i<DASH_N;i++){const d=new THREE.Mesh(dashGeo,dashMat);d.rotation.x=-Math.PI/2;d.position.set(x,0.02,-i*DASH_SP+20);scene.add(d);dashes.push(d);}});

// cenário lateral
const props=[];
function makeTree(){const g=new THREE.Group();
 const t=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.3,2),new THREE.MeshLambertMaterial({color:0x6b4423}));t.position.y=1;g.add(t);
 const l=new THREE.Mesh(new THREE.ConeGeometry(1.4,3.5,8),new THREE.MeshLambertMaterial({color:0x1f6b2a}));l.position.y=3.5;g.add(l);return g;}
function makeBuilding(){const h=6+Math.random()*14;const m=new THREE.Mesh(new THREE.BoxGeometry(5,h,5),new THREE.MeshLambertMaterial({color:new THREE.Color().setHSL(Math.random(),0.2,0.6)}));m.position.y=h/2;const g=new THREE.Group();g.add(m);return g;}
for(let i=0;i<40;i++){const side=i%2?1:-1;const p=Math.random()<0.5?makeTree():makeBuilding();
 p.position.set(side*(ROAD_W/2+4+Math.random()*10),0,-(i>>1)*10+10);scene.add(p);props.push(p);}

// moto (com farol e lanterna)
let flame;
function makeBike(){
 const g=new THREE.Group();
 const black=new THREE.MeshLambertMaterial({color:0x111111}),red=new THREE.MeshLambertMaterial({color:0xd32f2f});
 [-0.75,0.75].forEach(z=>{const w=new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.4,0.2,16),black);w.rotation.z=Math.PI/2;w.position.set(0,0.4,z);g.add(w);});
 const body=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.4,1.2),red);body.position.set(0,0.8,0);g.add(body);
 const tank=new THREE.Mesh(new THREE.BoxGeometry(0.45,0.3,0.5),red);tank.position.set(0,1.1,-0.2);g.add(tank);
 const bar=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.08,0.08),black);bar.position.set(0,1.2,-0.6);g.add(bar);
 const rider=new THREE.Mesh(new THREE.BoxGeometry(0.45,0.7,0.35),new THREE.MeshLambertMaterial({color:0x1565c0}));rider.position.set(0,1.5,0.2);rider.rotation.x=-0.3;g.add(rider);
 const head=new THREE.Mesh(new THREE.SphereGeometry(0.25,12,12),new THREE.MeshLambertMaterial({color:0xffeb3b}));head.position.set(0,2.1,0);g.add(head);
 const tail=new THREE.Mesh(new THREE.BoxGeometry(0.25,0.1,0.05),new THREE.MeshBasicMaterial({color:0xff1111}));tail.position.set(0,0.95,0.62);g.add(tail);
 const lamp=new THREE.Mesh(new THREE.SphereGeometry(0.1,8,8),new THREE.MeshBasicMaterial({color:0xffffcc}));lamp.position.set(0,1.1,-0.85);g.add(lamp);
 flame=new THREE.Mesh(new THREE.ConeGeometry(0.12,0.8,8),new THREE.MeshBasicMaterial({color:0x40c4ff}));
 flame.rotation.x=-Math.PI/2;flame.position.set(0,0.6,1.1);flame.visible=false;g.add(flame);
 return g;}
const bike=makeBike();scene.add(bike);

// carros
const carColors=[0xe53935,0x1e88e5,0x43a047,0xfdd835,0xffffff,0x8e24aa,0xfb8c00,0x555555];
function makeCar(truck){
 const g=new THREE.Group();const col=carColors[Math.random()*carColors.length|0];
 const len=truck?6:3.6,h=truck?2.6:0.8;
 const body=new THREE.Mesh(new THREE.BoxGeometry(1.8,h,len),new THREE.MeshLambertMaterial({color:truck?0xeeeeee:col}));body.position.y=h/2+0.35;g.add(body);
 if(!truck){const top=new THREE.Mesh(new THREE.BoxGeometry(1.5,0.6,1.8),new THREE.MeshLambertMaterial({color:0x222a33}));top.position.y=1.5;g.add(top);}
 else{const cab=new THREE.Mesh(new THREE.BoxGeometry(1.8,1.8,1.4),new THREE.MeshLambertMaterial({color:col}));cab.position.set(0,1.25,len/2-0.7);g.add(cab);}
 const wm=new THREE.MeshLambertMaterial({color:0x111111});
 [[-0.9,-len/2+0.8],[0.9,-len/2+0.8],[-0.9,len/2-0.8],[0.9,len/2-0.8]].forEach(p=>{const w=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,0.3,12),wm);w.rotation.z=Math.PI/2;w.position.set(p[0],0.35,p[1]);g.add(w);});
 g.userData.len=len;g.userData.truck=truck;return g;}

/* ================= ÁUDIO (gerado por código, sem arquivos) ================= */
let ac=null,master,musicGain,sfxGain,engOsc,engOsc2,engGain,noiseBuf,musicOn=store.get('motoMusic')!=='0',sfxOn=store.get('motoSfx')!=='0',seqTimer=null,nextT=0,step=0;
function initAudio(){
 if(ac){if(ac.state==='suspended')ac.resume();return;}
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
 try{
  ac=new AC();master=ac.createGain();master.gain.value=0.8;master.connect(ac.destination);
  musicGain=ac.createGain();musicGain.gain.value=musicOn?0.35:0;musicGain.connect(master);
  sfxGain=ac.createGain();sfxGain.gain.value=sfxOn?0.5:0;sfxGain.connect(master);
  noiseBuf=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  // motor
  engOsc=ac.createOscillator();engOsc.type='sawtooth';engOsc2=ac.createOscillator();engOsc2.type='square';
  const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=700;
  engGain=ac.createGain();engGain.gain.value=0;
  engOsc.connect(f);engOsc2.connect(f);f.connect(engGain);engGain.connect(sfxGain);engOsc.start();engOsc2.start();
  nextT=ac.currentTime+0.1;step=0;
  seqTimer=setInterval(scheduler,25);
 }catch(e){ac=null;}
}
const BPM=124,SP=60/BPM/4; // duração de 1/16
const prog=[57,53,48,55]; // Lá, Fá, Dó, Sol (MIDI) - raiz de cada compasso
const mf=n=>440*Math.pow(2,(n-69)/12);
function tone(t,freq,dur,type,vol,dest){
 const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=freq;
 g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
 o.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+0.05);}
function kick(t){const o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(40,t+0.15);
 g.gain.setValueAtTime(0.9,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.2);o.connect(g);g.connect(musicGain);o.start(t);o.stop(t+0.25);}
function hat(t,vol){const s=ac.createBufferSource();s.buffer=noiseBuf;const f=ac.createBiquadFilter();f.type='highpass';f.frequency.value=7000;const g=ac.createGain();
 g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.05);s.connect(f);f.connect(g);g.connect(musicGain);s.start(t);s.stop(t+0.08);}
function playStep(s,t){
 const bar=(s>>4)&3,k=s&15,root=prog[bar];
 if(k%4===0)kick(t);
 if(k%4===2)hat(t,0.25);else if(k%2===1)hat(t,0.08);
 if(k%2===0||k===3||k===11)tone(t,mf(root-12),SP*1.8,'sawtooth',0.28,musicGain); // baixo
 const arp=[0,7,12,7,0,7,12,15][k&7]; // arpejo
 tone(t,mf(root+12+arp),SP*1.5,'square',0.07,musicGain);
 if(k===0)[0,3,7].forEach(i=>tone(t,mf(root+i+12),SP*14,'triangle',0.06,musicGain)); // acorde
}
function scheduler(){
 if(!ac||ac.state!=='running')return;
 while(nextT<ac.currentTime+0.12){if(musicOn)playStep(step,nextT);nextT+=SP;step=(step+1)%64;}
}
function sfxCrash(){
 if(!ac||!sfxOn)return;const t=ac.currentTime;
 const s=ac.createBufferSource();s.buffer=noiseBuf;const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(2500,t);f.frequency.exponentialRampToValueAtTime(100,t+0.8);
 const g=ac.createGain();g.gain.setValueAtTime(1,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.9);s.connect(f);f.connect(g);g.connect(sfxGain);s.start(t);s.stop(t+1);
 tone(t,90,0.5,'sawtooth',0.6,sfxGain);}
function sfxNitro(){if(!ac||!sfxOn)return;const t=ac.currentTime;const s=ac.createBufferSource();s.buffer=noiseBuf;const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.setValueAtTime(800,t);f.frequency.exponentialRampToValueAtTime(3500,t+0.5);
 const g=ac.createGain();g.gain.setValueAtTime(0.5,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.6);s.connect(f);f.connect(g);g.connect(sfxGain);s.start(t);s.stop(t+0.7);}
function updateEngine(rpm,on){
 if(!ac)return;const t=ac.currentTime;
 const fr=38+rpm*95;
 engOsc.frequency.setTargetAtTime(fr,t,0.05);engOsc2.frequency.setTargetAtTime(fr*0.5,t,0.05);
 engGain.gain.setTargetAtTime(on?0.12+rpm*0.12:0,t,0.08);}
function applyAudioUI(){
 el('bMusic').classList.toggle('off',!musicOn);el('bSfx').classList.toggle('off',!sfxOn);
 if(ac){musicGain.gain.value=musicOn?0.35:0;sfxGain.gain.value=sfxOn?0.5:0;}
 store.set('motoMusic',musicOn?'1':'0');store.set('motoSfx',sfxOn?'1':'0');}
function toggleMusic(){initAudio();musicOn=!musicOn;applyAudioUI();}
function toggleSfx(){initAudio();sfxOn=!sfxOn;applyAudioUI();}
applyAudioUI();
el('bMusic').addEventListener('click',toggleMusic);
el('bSfx').addEventListener('click',toggleSfx);

/* ================= JOGO ================= */
let cars=[],state='menu',dist=0,speed=0,lane=1,targetX=LANES[1],spawnT=0,best=+store.get('motoBest')||0,nitro=100,nitroOn=false,rpm=0,gear=1;
el('best').textContent='Recorde: '+best;
const keys={};let accel=false,brake=false,nitroBtn=false;
addEventListener('keydown',e=>{
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].indexOf(e.code)>=0)e.preventDefault();
 if(e.repeat)return;keys[e.code]=1;
 if(e.code==='KeyM'){toggleMusic();return;}
 if(e.code==='KeyP'||e.code==='Escape'){togglePause();return;}
 if(state==='pause')return;
 if(state!=='play'){if(e.code==='Enter'||e.code==='Space')start();return;}
 if(e.code==='ArrowLeft'||e.code==='KeyA')move(-1);
 if(e.code==='ArrowRight'||e.code==='KeyD')move(1);});
addEventListener('keyup',e=>keys[e.code]=0);
function move(d){lane=Math.max(0,Math.min(3,lane+d));targetX=LANES[lane];}
function hold(id,on,off){const b=el(id);b.addEventListener('touchstart',e=>{e.preventDefault();on();},{passive:false});b.addEventListener('touchend',e=>{e.preventDefault();off&&off();},{passive:false});b.addEventListener('touchcancel',()=>off&&off());b.addEventListener('mousedown',on);b.addEventListener('mouseup',()=>off&&off());b.addEventListener('mouseleave',()=>off&&off());}
hold('bl',()=>state==='play'&&move(-1));hold('br',()=>state==='play'&&move(1));
hold('ba',()=>accel=true,()=>accel=false);hold('bb',()=>brake=true,()=>brake=false);
hold('bn',()=>nitroBtn=true,()=>nitroBtn=false);
let sx=0;
canvas.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;},{passive:true});
canvas.addEventListener('touchend',e=>{if(state!=='play')return;const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>30)move(dx>0?1:-1);});

function start(){
 initAudio();
 cars.forEach(c=>scene.remove(c.mesh));cars=[];dist=0;speed=20;lane=1;targetX=LANES[1];bike.position.set(targetX,0,0);bike.rotation.z=0;spawnT=0;nitro=100;nitroOn=false;
 el('menu').style.display='none';el('pause').style.display='none';state='play';}
el('start').addEventListener('click',start);

function togglePause(){
 if(state==='play'){state='pause';el('pause').style.display='flex';updateEngine(0,false);if(ac&&ac.state==='running')ac.suspend();}
 else if(state==='pause'){resume();}}
function resume(){el('pause').style.display='none';state='play';if(ac&&ac.state==='suspended')ac.resume();last=performance.now();}
el('bPause').addEventListener('click',togglePause);
el('bResume').addEventListener('click',resume);
el('bQuit').addEventListener('click',()=>{
 el('pause').style.display='none';state='menu';if(ac&&ac.state==='suspended')ac.resume();updateEngine(0,false);
 el('msg').textContent='Desvie dos carros e vá o mais longe possível!';el('start').textContent='Jogar';el('menu').style.display='flex';speed=0;});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='play')togglePause();});

function spawn(){
 const l=Math.random()*4|0;const truck=Math.random()<0.2;
 const m=makeCar(truck);const z=-150;
 m.position.set(LANES[l],0,z);scene.add(m);
 cars.push({mesh:m,lane:l,v:8+Math.random()*10,len:m.userData.len,truck});}

function crash(){
 if(state!=='play')return;
 state='over';const sc=Math.floor(dist);
 if(sc>best){best=sc;store.set('motoBest',best);}
 el('best').textContent='Recorde: '+best;
 el('msg').textContent='💥 Você bateu! Distância: '+sc+' m';
 el('start').textContent='Jogar de novo';el('menu').style.display='flex';speed=0;nitroOn=false;
 updateEngine(0,false);sfxCrash();}

/* ===== HUD próprio: velocímetro analógico + marcha/RPM ===== */
const gctx=el('gauge').getContext('2d');
function drawGauge(kmh){
 const W=260,cx=130,cy=130,r=110,a0=Math.PI*0.75,a1=Math.PI*2.25,max=260;
 gctx.clearRect(0,0,W,W);
 gctx.lineCap='round';
 gctx.lineWidth=10;gctx.strokeStyle='#ffffff30';gctx.beginPath();gctx.arc(cx,cy,r,a0,a1);gctx.stroke();
 const fr=Math.min(kmh/max,1);
 gctx.strokeStyle=nitroOn?'#40c4ff':(fr>0.75?'#ff5252':'#ff9800');
 gctx.beginPath();gctx.arc(cx,cy,r,a0,a0+(a1-a0)*fr);gctx.stroke();
 gctx.fillStyle='#fff';gctx.font='bold 16px system-ui';gctx.textAlign='center';gctx.textBaseline='middle';
 for(let v=0;v<=max;v+=40){const a=a0+(a1-a0)*v/max;
  gctx.fillText(v,cx+Math.cos(a)*84,cy+Math.sin(a)*84);}
 // ponteiro
 const a=a0+(a1-a0)*fr;gctx.strokeStyle='#ff1744';gctx.lineWidth=4;
 gctx.beginPath();gctx.moveTo(cx,cy);gctx.lineTo(cx+Math.cos(a)*70,cy+Math.sin(a)*70);gctx.stroke();
 gctx.fillStyle='#fff';gctx.beginPath();gctx.arc(cx,cy,7,0,7);gctx.fill();
 gctx.font='bold 40px system-ui';gctx.fillText(Math.round(kmh),cx,cy+48);
 gctx.font='bold 14px system-ui';gctx.fillText('km/h',cx,cy+74);
 // marcha
 gctx.font='bold 26px system-ui';gctx.fillStyle='#ffd54f';gctx.fillText(gear,cx,cy-38);
 gctx.font='bold 10px system-ui';gctx.fillStyle='#fff';gctx.fillText('MARCHA',cx,cy-58);
 // barra de RPM
 gctx.fillStyle='#ffffff30';gctx.fillRect(cx-40,cy+92,80,6);
 gctx.fillStyle=rpm>0.85?'#ff1744':'#76ff03';gctx.fillRect(cx-40,cy+92,80*rpm,6);
}

/* ===== Minimapa (vista de cima) ===== */
const mctx=el('minimap').getContext('2d');
function drawMinimap(){
 const W=140,H=280,Z0=-90,Z1=15,sx=W/(ROAD_W+1),sz=H/(Z1-Z0);
 const X=x=>(x+ROAD_W/2+0.5)*sx,Y=z=>(z-Z0)*sz;
 mctx.clearRect(0,0,W,H);
 mctx.fillStyle='#2b2b2b';mctx.fillRect(X(-ROAD_W/2),0,ROAD_W*sx,H);
 mctx.fillStyle='#fff';mctx.fillRect(X(-ROAD_W/2),0,2,H);mctx.fillRect(X(ROAD_W/2)-2,0,2,H);
 mctx.fillStyle='#ffffff80';
 [-3,0,3].forEach(x=>{for(let y=(dist*sz*0.5)%24;y<H;y+=24)mctx.fillRect(X(x)-1,y,2,10);});
 cars.forEach(c=>{const z=c.mesh.position.z;if(z<Z0||z>Z1)return;
  mctx.fillStyle=c.truck?'#eeeeee':'#ef5350';
  const w=1.8*sx,h=c.len*sz;mctx.fillRect(X(c.mesh.position.x)-w/2,Y(z)-h/2,w,h);});
 mctx.fillStyle='#ffb300';const bw=1.1*sx,bh=2*sz;
 mctx.fillRect(X(bike.position.x)-bw/2,Y(0)-bh/2,bw,bh);
 mctx.strokeStyle='#fff';mctx.lineWidth=1;mctx.strokeRect(X(bike.position.x)-bw/2,Y(0)-bh/2,bw,bh);
}

function updateGear(kmh){
 const lim=[0,45,85,125,170,215,999];
 gear=1;for(let g=1;g<=6;g++){if(kmh>=lim[g-1])gear=g;}
 const lo=lim[gear-1],hi=Math.min(lim[gear],270);
 rpm=Math.max(0.15,Math.min(1,(kmh-lo)/(hi-lo)*0.8+0.2));}

let last=performance.now(),tilt=0,wasNitro=false;
function loop(t){
 requestAnimationFrame(loop);
 const dt=Math.min(Math.max((t-last)/1000,0),0.05);last=t;
 if(state==='play'){
  const up=keys.ArrowUp||keys.KeyW||accel,dn=keys.ArrowDown||keys.KeyS||brake;
  const wantN=(keys.ShiftLeft||keys.ShiftRight||keys.Space||nitroBtn)&&nitro>0;
  nitroOn=!!wantN;
  if(nitroOn&&!wasNitro)sfxNitro();wasNitro=nitroOn;
  if(nitroOn)nitro=Math.max(0,nitro-28*dt);else nitro=Math.min(100,nitro+7*dt);
  const maxS=nitroOn?70:(up?55:38);
  if(nitroOn)speed+=22*dt;else if(up)speed+=14*dt;else if(dn)speed-=30*dt;else speed+=(speed<30?6:-3)*dt;
  speed=Math.max(10,Math.min(maxS,speed));
  if(!nitroOn&&speed>maxS)speed=maxS;
  dist+=speed*dt;
  const dx=targetX-bike.position.x;const st=Math.sign(dx)*Math.min(Math.abs(dx),14*dt);
  bike.position.x+=st;tilt+=((-dx*0.15)-tilt)*8*dt;bike.rotation.z=tilt;
  flame.visible=nitroOn;if(nitroOn)flame.scale.z=0.8+Math.random()*0.6;
  spawnT-=dt*(speed/30);
  if(spawnT<=0){spawn();if(Math.random()<0.5)spawn();spawnT=0.55+Math.random()*0.5;}
  for(let i=cars.length-1;i>=0;i--){
   const c=cars[i];c.mesh.position.z+=(speed-c.v)*dt;
   const dz=Math.abs(c.mesh.position.z-bike.position.z),dxx=Math.abs(c.mesh.position.x-bike.position.x);
   if(dz<c.len/2+0.9&&dxx<1.2){crash();}
   if(c.mesh.position.z>20||c.mesh.position.z<-200){scene.remove(c.mesh);cars.splice(i,1);}
  }
  const kmh=speed*3.6;updateGear(kmh);
  updateEngine(rpm,true);
  el('score').textContent=Math.floor(dist)+' m';
  el('nitroFill').style.width=nitro+'%';
  drawGauge(kmh);drawMinimap();
 } else if(state==='menu'||state==='over'){drawGauge(0);drawMinimap();}
 const s=state==='play'?speed:0;
 dashes.forEach(d=>{d.position.z+=s*dt;if(d.position.z>20)d.position.z-=DASH_N*DASH_SP;});
 props.forEach(p=>{p.position.z+=s*dt;if(p.position.z>20)p.position.z-=200;});
 const shake=nitroOn?(Math.random()-0.5)*0.05:0;
 camera.position.set(bike.position.x*0.6+shake,3.5+shake,6);
 camera.lookAt(bike.position.x*0.8,1,-12);
 camera.fov=70+(Math.max(speed,10)-10)*0.2;camera.updateProjectionMatrix();
 renderer.render(scene,camera);
}
bike.position.set(LANES[1],0,0);
requestAnimationFrame(loop);
})();
