// V104 · Level 10 skeuomorphic field instruments (scoped to :root[data-ui-level="10"]).
// Bottom-left: one leather + brass case holding a stopwatch (stamina), a drum
// recorder (health), an aneroid barometer (sanity) and a corked test tube
// (hydration), wrapped by the three gradient half-arcs of the old dashboard.
// Top-right: brass pocket compass with hinged lid (paintBrassCompass).
// Static art is painted once per size; the live layer is light (30 fps, few paths).
let cCache=null;
const A='./assets/ui-v104/',U=n=>new URL(A+n,import.meta.url).href;
const isL10=()=>document.documentElement.dataset.uiLevel==='10';
const IMG={};let imgReady=null;
function loadImages(){return imgReady||=Promise.all(['leather.jpg','brass.jpg','enamel.jpg','cork.png','wheat.png'].map(n=>new Promise(r=>{const im=new Image();im.onload=im.onerror=()=>r();im.src=U(n);IMG[n.split('.')[0]]=im;})));}
const ok=im=>im&&im.complete&&im.naturalWidth>0;
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const SERIF="Georgia,'Times New Roman','Songti SC',SimSun,serif",CN="Vonwaon16,Vonwaon12,'Songti SC',SimSun,serif";
// ---------- shared material helpers ----------
function pat(c,im,scale=1,fallback='#6b5527'){if(!ok(im))return fallback;const p=c.createPattern(im,'repeat');if(p&&p.setTransform&&typeof DOMMatrix!=='undefined')p.setTransform(new DOMMatrix().scale(scale));return p;}
function brassRing(c,x,y,r0,r1,light=-2.3){
 // turned brass: textured base, conic-ish highlight via two linear gradients, bevel lines
 c.save();c.beginPath();c.arc(x,y,r1,0,TAU);c.arc(x,y,r0,0,TAU,true);c.closePath();c.fillStyle=pat(c,IMG.brass,.35);c.fill();
 const g=c.createLinearGradient(x+Math.cos(light)*r1,y+Math.sin(light)*r1,x-Math.cos(light)*r1,y-Math.sin(light)*r1);
 g.addColorStop(0,'#fff1b855');g.addColorStop(.35,'#d8b56a22');g.addColorStop(.65,'#2a1a0640');g.addColorStop(1,'#1a0f0490');c.fillStyle=g;c.fill();
 c.globalCompositeOperation='source-over';c.lineWidth=1.2;c.strokeStyle='#2a1c0a';c.beginPath();c.arc(x,y,r1-.6,0,TAU);c.stroke();c.strokeStyle='#f5dc9a90';c.beginPath();c.arc(x,y,r1-2.2,Math.PI*1.05,Math.PI*1.7);c.stroke();
 c.strokeStyle='#1c1206';c.beginPath();c.arc(x,y,r0+.5,0,TAU);c.stroke();c.strokeStyle='#f0d38a70';c.beginPath();c.arc(x,y,r0+2,Math.PI*.1,Math.PI*.75);c.stroke();
 c.restore();
}
function enamel(c,x,y,r,tone='#e9dcb8'){c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();c.fillStyle=tone;c.fillRect(x-r,y-r,2*r,2*r);if(ok(IMG.enamel)){c.globalAlpha=.9;c.drawImage(IMG.enamel,x-r,y-r,2*r,2*r);c.globalAlpha=1;}
 const v=c.createRadialGradient(x-r*.2,y-r*.25,r*.2,x,y,r);v.addColorStop(0,'#fff8e000');v.addColorStop(.75,'#5a3a1210');v.addColorStop(1,'#3a240a70');c.fillStyle=v;c.fillRect(x-r,y-r,2*r,2*r);c.restore();}
function glass(c,x,y,r,strength=1){c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();
 const g=c.createLinearGradient(x-r,y-r,x+r*.4,y+r*.4);g.addColorStop(0,`rgba(255,250,230,${.30*strength})`);g.addColorStop(.32,`rgba(255,250,230,${.06*strength})`);g.addColorStop(.33,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(x-r,y-r,2*r,2*r);
 c.strokeStyle=`rgba(255,252,236,${.55*strength})`;c.lineWidth=r*.07;c.lineCap='round';c.beginPath();c.arc(x,y,r*.82,Math.PI*1.08,Math.PI*1.38);c.stroke();
 c.lineWidth=r*.03;c.strokeStyle=`rgba(255,252,236,${.35*strength})`;c.beginPath();c.arc(x,y,r*.82,Math.PI*1.45,Math.PI*1.52);c.stroke();
 c.strokeStyle=`rgba(255,240,200,${.18*strength})`;c.lineWidth=r*.05;c.beginPath();c.arc(x,y,r*.9,Math.PI*.15,Math.PI*.45);c.stroke();
 const s=c.createRadialGradient(x,y,r*.7,x,y,r);s.addColorStop(0,'rgba(0,0,0,0)');s.addColorStop(1,'rgba(20,12,2,.35)');c.fillStyle=s;c.fillRect(x-r,y-r,2*r,2*r);c.restore();}
function rivet(c,x,y,r=4.2){const g=c.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r);g.addColorStop(0,'#fff0b8');g.addColorStop(.35,'#c79a4a');g.addColorStop(1,'#3b2610');c.fillStyle='#120a03aa';c.beginPath();c.arc(x+.8,y+1.2,r,0,TAU);c.fill();c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
function plaque(c,x,y,w,h,text,dot){c.save();c.fillStyle='#0d0803a0';c.fillRect(x+1,y+2,w,h);c.fillStyle=pat(c,IMG.brass,.3);c.fillRect(x,y,w,h);const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'#fff1c050');g.addColorStop(.5,'#00000000');g.addColorStop(1,'#2a180660');c.fillStyle=g;c.fillRect(x,y,w,h);
 c.strokeStyle='#2b1b08';c.lineWidth=1.2;c.strokeRect(x+.6,y+.6,w-1.2,h-1.2);c.strokeStyle='#f6dfa070';c.strokeRect(x+2,y+2,w-4,h-4);
 c.font=`${h*.68}px ${CN}`;c.textBaseline='middle';c.textAlign='center';const tx=x+w/2+(dot?h*.28:0);c.fillStyle='#f7e3a8a0';c.fillText(text,tx+.8,y+h/2+1.2);c.fillStyle='#24160a';c.fillText(text,tx,y+h/2+.4);
 if(dot){const d=c.createRadialGradient(x+h*.5,y+h*.42,1,x+h*.55,y+h/2,h*.3);d.addColorStop(0,dot[0]);d.addColorStop(1,dot[1]);c.fillStyle=d;c.beginPath();c.arc(x+h*.6,y+h/2,h*.24,0,TAU);c.fill();c.strokeStyle='#2b1b08';c.lineWidth=1;c.stroke();}
 rivet(c,x+3.5,y+h/2,1.8);rivet(c,x+w-3.5,y+h/2,1.8);c.restore();}
// ---------- dashboard geometry (logical 640 × 360) ----------
const W=640,H=360,SW={x:178,y:232,r:86},DR={x:318,y:122,w:286,h:84},BA={x:370,y:274,r:60},TU={x:470,top:228,bot:336,w:28},PL={x:512,y:214,w:94,h:120};
const ARCS=[{k:'stamina',r0:128,r1:141,c:['#7c3a1a','#d77a33','#f3b25c']},{k:'hydration',r0:113,r1:124,c:['#1f4a6a','#4e8fbf','#9fd0ea']},{k:'health',r0:99,r1:109,c:['#6a2433','#c45a73','#f2a7b4']}];
const A0=Math.PI,A1=Math.PI*1.66; // arcs sweep from 9 o'clock up to just past 12
const CROWN=-Math.PI/2+.92; // crown at ~1:30 so it never crosses the arcs
function casePath(){const p=new Path2D(),cx=SW.x,cy=SW.y,R=166,top=92;const dx=Math.sqrt(R*R-(cy-top)**2);
 p.moveTo(cx-R,342);p.lineTo(cx-R,cy);p.arc(cx,cy,R,Math.PI,Math.PI*1.5+Math.asin(dx/R)*1,false);p.lineTo(592,top);p.quadraticCurveTo(620,top,620,top+28);p.lineTo(620,332);p.quadraticCurveTo(620,350,602,350);p.lineTo(cx-R+14,350);p.quadraticCurveTo(cx-R,350,cx-R,342);p.closePath();return p;}
function paintBack(c){
 const path=casePath();
 // brass wheat crest rising behind the dome (left), mirrored small one on the right of the crown
 if(ok(IMG.wheat)){c.save();c.translate(150,236);c.rotate(-.62);c.drawImage(IMG.wheat,-50,-236,100,256);c.restore();c.save();c.translate(170,236);c.rotate(-.26);c.drawImage(IMG.wheat,-44,-226,88,225);c.restore();}
 c.save();c.translate(2,5);c.fillStyle='#07050299';c.fill(path);c.restore();
 // brass outer shell
 c.fillStyle=pat(c,IMG.brass,.4);c.fill(path);const sh=c.createLinearGradient(0,80,0,350);sh.addColorStop(0,'#ffe9a840');sh.addColorStop(.5,'#00000010');sh.addColorStop(1,'#1d100450');c.fillStyle=sh;c.fill(path);c.lineWidth=2;c.strokeStyle='#22160a';c.stroke(path);
 // leather inset
 c.save();c.translate(SW.x,221);c.scale(.955,.93);c.translate(-SW.x,-221);c.fillStyle=pat(c,IMG.leather,.55,'#2d2016');c.fill(path);const lv=c.createRadialGradient(330,210,40,330,210,380);lv.addColorStop(0,'#00000000');lv.addColorStop(1,'#000000a0');c.fillStyle=lv;c.fill(path);
 c.setLineDash([4,3]);c.lineWidth=1.3;c.strokeStyle='#c9a86a80';c.save();c.translate(SW.x,221);c.scale(.975,.965);c.translate(-SW.x,-221);c.stroke(path);c.restore();c.setLineDash([]);c.lineWidth=1.6;c.strokeStyle='#120b05';c.stroke(path);c.restore();
 // arc tracks (recessed grooves) — the retained half-arc design
 for(const a of ARCS){c.beginPath();c.arc(SW.x,SW.y,a.r1+2,A0,A1);c.arc(SW.x,SW.y,a.r0-2,A1,A0,true);c.closePath();c.fillStyle='#0d0905';c.fill();c.strokeStyle='#a8834480';c.lineWidth=1;c.stroke();}
 // brass fan rib separating arcs from the right body
 for(const a of [A0,A1]){c.strokeStyle='#2a1a08';c.lineWidth=3;c.beginPath();c.moveTo(SW.x+Math.cos(a)*96,SW.y+Math.sin(a)*96);c.lineTo(SW.x+Math.cos(a)*145,SW.y+Math.sin(a)*145);c.stroke();c.strokeStyle='#e2c27a';c.lineWidth=1.2;c.stroke();}
 // ---- stopwatch case ----
 const cr={x:SW.x+Math.cos(CROWN)*(SW.r+2),y:SW.y+Math.sin(CROWN)*(SW.r+2)};
 c.save();c.translate(cr.x,cr.y);c.rotate(CROWN+Math.PI/2);c.fillStyle=pat(c,IMG.brass,.3);c.fillRect(-6,-9,12,12);c.strokeStyle='#24160a';c.strokeRect(-6,-9,12,12);c.restore();
 c.fillStyle='#08050299';c.beginPath();c.arc(SW.x+2,SW.y+4,SW.r+1,0,TAU);c.fill();
 brassRing(c,SW.x,SW.y,SW.r-12,SW.r);enamel(c,SW.x,SW.y,SW.r-12);
 const R=SW.r-12;c.save();c.translate(SW.x,SW.y);
 for(let i=0;i<300;i++){const a=i/300*TAU-Math.PI/2,big=i%25===0,mid=i%5===0;const r0=R-(big?9:mid?6:3.2);c.strokeStyle=big?'#1b130c':'#2a2018';c.lineWidth=big?1.6:mid?.9:.45;c.beginPath();c.moveTo(Math.cos(a)*r0,Math.sin(a)*r0);c.lineTo(Math.cos(a)*(R-1.5),Math.sin(a)*(R-1.5));c.stroke();}
 c.font=`700 12px ${SERIF}`;c.textAlign='center';c.textBaseline='middle';for(let n=5;n<=60;n+=5){const a=n/60*TAU-Math.PI/2;c.fillStyle=n===60?'#a8241c':'#1b130c';c.fillText(String(n),Math.cos(a)*(R-17),Math.sin(a)*(R-17));}
 // 30-minute register
 c.strokeStyle='#2a2018';c.lineWidth=.8;c.beginPath();c.arc(0,R*.38,15,0,TAU);c.stroke();for(let i=0;i<30;i++){const a=i/30*TAU-Math.PI/2;c.beginPath();c.moveTo(Math.cos(a)*(i%5?13:11),R*.38+Math.sin(a)*(i%5?13:11));c.lineTo(Math.cos(a)*15,R*.38+Math.sin(a)*15);c.stroke();}
 c.font=`9px ${SERIF}`;c.fillStyle='#3a2a1a';c.fillText('30',0,R*.38-7.5);
 c.font=`14px ${CN}`;c.fillStyle='#4a1a12';c.fillText('体力',0,-R*.34);c.font=`italic 6.5px ${SERIF}`;c.fillStyle='#4a3a28';c.fillText('1/5 SEC',0,-R*.34+11);
 c.restore();
 // ---- drum recorder (health) ----
 const d=DR;c.fillStyle='#0a0603';c.fillRect(d.x-6,d.y-6,d.w+12,d.h+12);
 c.fillStyle=pat(c,IMG.brass,.35);c.beginPath();c.rect(d.x-8,d.y-8,d.w+16,d.h+16);c.rect(d.x,d.y,d.w,d.h);c.fill('evenodd');
 c.strokeStyle='#24160a';c.lineWidth=1.4;c.strokeRect(d.x-8,d.y-8,d.w+16,d.h+16);c.strokeStyle='#f3d99460';c.strokeRect(d.x-6.5,d.y-6.5,d.w+13,d.h+13);c.strokeStyle='#1a1006';c.strokeRect(d.x-.5,d.y-.5,d.w+1,d.h+1);
 for(const[x,y]of[[d.x-4,d.y-4],[d.x+d.w+4,d.y-4],[d.x-4,d.y+d.h+4],[d.x+d.w+4,d.y+d.h+4]])rivet(c,x,y,2.6);
 // pen carriage rail across the top + pivot block on the right
 c.fillStyle='#1a1006';c.fillRect(d.x+d.w-34,d.y-14,40,14);c.fillStyle=pat(c,IMG.brass,.3);c.fillRect(d.x+d.w-32,d.y-13,36,11);c.strokeStyle='#24160a';c.strokeRect(d.x+d.w-32,d.y-13,36,11);rivet(c,d.x+d.w-14,d.y-7.5,3.4);
 plaque(c,d.x+4,d.y-17,64,15,'血量',['#f6b8c4','#a8394f']);
 // ---- barometer (sanity) ----
 c.fillStyle='#08050299';c.beginPath();c.arc(BA.x+2,BA.y+4,BA.r,0,TAU);c.fill();brassRing(c,BA.x,BA.y,BA.r-10,BA.r);enamel(c,BA.x,BA.y,BA.r-10,'#e6d6ae');
 const br=BA.r-10;c.save();c.translate(BA.x,BA.y);
 const s0=Math.PI*.75,s1=Math.PI*2.25;c.strokeStyle='#2a1e14';c.lineWidth=.8;c.beginPath();c.arc(0,0,br-4,s0,s1);c.stroke();c.beginPath();c.arc(0,0,br-10,s0,s1);c.stroke();
 for(let i=0;i<=50;i++){const a=s0+(s1-s0)*i/50,big=i%10===0;c.lineWidth=big?1.3:.6;c.beginPath();c.moveTo(Math.cos(a)*(br-(big?12:9)),Math.sin(a)*(br-(big?12:9)));c.lineTo(Math.cos(a)*(br-4),Math.sin(a)*(br-4));c.stroke();}
 // weather-style zones: 狂 乱 静 明 (low → high sanity)
 const words=[['狂','#7a1c16'],['乱','#4a2a1a'],['静','#2a2a1a'],['明','#1a2a3a']];c.font=`12px ${CN}`;c.textAlign='center';c.textBaseline='middle';
 words.forEach(([w,col],i)=>{const a=s0+(s1-s0)*(i+.5)/4;c.fillStyle=col;c.fillText(w,Math.cos(a)*(br-21),Math.sin(a)*(br-21));});
 c.font=`13px ${CN}`;c.fillStyle='#3a2414';c.fillText('精神',0,br*.45);
 // aneroid capsule hint (concentric corrugations visible through the dial cut-out)
 c.strokeStyle='#8a6a3a70';c.lineWidth=.6;for(let r=4;r<12;r+=2.2){c.beginPath();c.arc(0,-br*.12,r,0,TAU);c.stroke();}
 c.restore();
 // ---- test tube rack (hydration) ----
 const t=TU;{const rg=c.createLinearGradient(t.x-t.w/2-5,0,t.x+t.w/2+5,0);rg.addColorStop(0,'#120a05');rg.addColorStop(.5,'#3a2a1c');rg.addColorStop(1,'#120a05');c.fillStyle=rg;}c.beginPath();c.roundRect?c.roundRect(t.x-t.w/2-5,t.top-6,t.w+10,t.bot-t.top+12,8):c.rect(t.x-t.w/2-5,t.top-6,t.w+10,t.bot-t.top+12);c.fill();
 // back of tube glass
 tubePath(c);c.fillStyle='#c9dcd838';c.fill();
 // ---- almond water plaque ----
 const p=PL;c.fillStyle='#0a0603';c.fillRect(p.x-3,p.y-3,p.w+6,p.h+6);c.fillStyle=pat(c,IMG.brass,.35);c.beginPath();c.rect(p.x-4,p.y-4,p.w+8,p.h+8);c.rect(p.x+3,p.y+3,p.w-6,p.h-6);c.fill('evenodd');c.strokeStyle='#24160a';c.lineWidth=1.2;c.strokeRect(p.x-4,p.y-4,p.w+8,p.h+8);c.strokeRect(p.x+3,p.y+3,p.w-6,p.h-6);
 c.fillStyle=pat(c,IMG.leather,.5,'#2d2016');c.fillRect(p.x+3,p.y+3,p.w-6,p.h-6);c.fillStyle='#00000055';c.fillRect(p.x+3,p.y+3,p.w-6,p.h-6);
 c.font=`15px ${CN}`;c.textAlign='center';c.textBaseline='middle';c.fillStyle='#0a0603';c.fillText('杏仁水',p.x+p.w/2+1,p.y+19);c.fillStyle='#e4c886';c.fillText('杏仁水',p.x+p.w/2,p.y+18);
 bottle(c,p.x+24,p.y+40);
 rivet(c,p.x+p.w/2-26,p.y+p.h-8,2.4);rivet(c,p.x+p.w/2+26,p.y+p.h-8,2.4);
 // rivets on the case rim
 for(const[x,y]of[[40,334],[96,342],[256,342],[604,108],[604,334],[300,108]])rivet(c,x,y,4.2);
}
function bottle(c,x,y){c.save();c.translate(x,y);const g=c.createLinearGradient(-8,0,8,0);g.addColorStop(0,'#5b4a2a');g.addColorStop(.4,'#d9c690');g.addColorStop(1,'#5b4a2a');
 c.fillStyle='#2a1a0a';c.fillRect(-3.5,0,7,6);c.fillStyle=g;c.beginPath();c.moveTo(-3,6);c.lineTo(3,6);c.lineTo(3,11);c.quadraticCurveTo(9,14,9,20);c.lineTo(9,42);c.quadraticCurveTo(9,45,6,45);c.lineTo(-6,45);c.quadraticCurveTo(-9,45,-9,42);c.lineTo(-9,20);c.quadraticCurveTo(-9,14,-3,11);c.closePath();c.fill();
 c.fillStyle='#efe2b8';c.fillRect(-8,24,16,10);c.fillStyle='#6a4a20';c.fillRect(-8,24,16,1.2);c.fillRect(-8,33,16,1.2);c.fillStyle='#ffffff60';c.fillRect(-6,13,2,28);c.restore();}
function tubePath(c,inset=0){const t=TU,x0=t.x-t.w/2+inset,x1=t.x+t.w/2-inset,r=t.w/2-inset;c.beginPath();c.moveTo(x0,t.top);c.lineTo(x0,t.bot-r);c.arc(t.x,t.bot-r,r,Math.PI,0,true);c.lineTo(x1,t.top);c.closePath();}
function paintFront(c){
 // glass over stopwatch & barometer, drum cylinder shading, tube glass + cork + brass clip
 glass(c,SW.x,SW.y,SW.r-12,1);glass(c,BA.x,BA.y,BA.r-10,1.1);
 const d=DR,g=c.createLinearGradient(0,d.y,0,d.y+d.h);g.addColorStop(0,'#1a0f06d0');g.addColorStop(.18,'#3a240c40');g.addColorStop(.42,'#fff8e018');g.addColorStop(.5,'#fff8e030');g.addColorStop(.62,'#00000000');g.addColorStop(.88,'#2a180850');g.addColorStop(1,'#120a04e0');c.fillStyle=g;c.fillRect(d.x,d.y,d.w,d.h);
 const e=c.createLinearGradient(d.x,0,d.x+d.w,0);e.addColorStop(0,'#000000a0');e.addColorStop(.06,'#00000000');e.addColorStop(.94,'#00000000');e.addColorStop(1,'#000000a0');c.fillStyle=e;c.fillRect(d.x,d.y,d.w,d.h);
 // tube glass
 const t=TU;tubePath(c);c.lineWidth=1.6;c.strokeStyle='#e8f2ee90';c.stroke();tubePath(c,1.6);c.lineWidth=.8;c.strokeStyle='#1a2a2a80';c.stroke();
 c.save();tubePath(c);c.clip();const tg=c.createLinearGradient(t.x-t.w/2,0,t.x+t.w/2,0);tg.addColorStop(0,'#ffffff30');tg.addColorStop(.18,'#ffffff70');tg.addColorStop(.26,'#ffffff08');tg.addColorStop(.75,'#ffffff00');tg.addColorStop(.88,'#ffffff40');tg.addColorStop(1,'#00000030');c.fillStyle=tg;c.fillRect(t.x-t.w/2,t.top,t.w,t.bot-t.top);c.restore();
 // lip & cork
 c.fillStyle='#e6efe880';c.fillRect(t.x-t.w/2-2.5,t.top-2,t.w+5,3);
 if(ok(IMG.cork)){const cw=t.w+2,ch=cw*IMG.cork.naturalHeight/IMG.cork.naturalWidth*.62;c.drawImage(IMG.cork,t.x-cw/2,t.top-ch*.62,cw,ch);}
 // brass clip band with engraved 水分 and blue enamel dot
 c.fillStyle=pat(c,IMG.brass,.3);c.fillRect(t.x-t.w/2-6,t.bot-58,t.w+12,16);const cg=c.createLinearGradient(0,t.bot-58,0,t.bot-42);cg.addColorStop(0,'#fff0c050');cg.addColorStop(1,'#2a160640');c.fillStyle=cg;c.fillRect(t.x-t.w/2-6,t.bot-58,t.w+12,16);
 c.strokeStyle='#24160a';c.lineWidth=1;c.strokeRect(t.x-t.w/2-6,t.bot-58,t.w+12,16);c.font=`11px ${CN}`;c.textAlign='center';c.textBaseline='middle';c.fillStyle='#24160a';c.fillText('水分',t.x+3,t.bot-49.6);
 c.fillStyle='#4e8fbf';c.beginPath();c.arc(t.x-12,t.bot-50,2.6,0,TAU);c.fill();
 for(let y=t.top+18;y<t.bot-64;y+=14){c.fillStyle='#e8eadc70';c.fillRect(t.x+t.w/2-7,y,5,.8);}
}
// ---------- audio (lazy, shared nodes, pre-rendered buffers) ----------
let AC=null,bus=null,tickBuf=null,creakBuf=null,lastTick=0,lastCreak=0;
function volume(){try{const v=JSON.parse(localStorage.getItem('level10.preferences.v1')||'{}').volume;return clamp((v??65)/100,0,1);}catch{return .65;}}
function audio(){if(AC)return AC.state==='running'?AC:null;try{AC=new (globalThis.AudioContext||globalThis.webkitAudioContext)();}catch{return null;}
 bus=AC.createGain();bus.gain.value=.16;bus.connect(AC.destination);const sr=AC.sampleRate;
 tickBuf=AC.createBuffer(1,Math.round(sr*.022),sr);{const d=tickBuf.getChannelData(0);let p=0;for(let i=0;i<d.length;i++){const t=i/sr,env=Math.exp(-t*420);p+=(Math.random()*2-1-p)*.55;d[i]=(Math.sin(t*TAU*3900)*.6+p*.8)*env+(i<sr*.0016?Math.sin(t*TAU*1700)*.5:0)*Math.exp(-t*900);}}
 creakBuf=AC.createBuffer(1,Math.round(sr*.75),sr);{const d=creakBuf.getChannelData(0);let ph=0,lp=0;for(let i=0;i<d.length;i++){const t=i/sr,f=95+40*Math.sin(t*9)+t*60;ph+=f/sr;// stick-slip friction pulses
  const pulse=Math.pow(Math.max(0,Math.sin(ph*TAU)),14),grit=(Math.random()*2-1);lp+=(grit-lp)*.25;const env=Math.min(1,t*30)*Math.exp(-t*2.6)*(t>.62?Math.max(0,1-(t-.62)/.13):1);
  d[i]=(pulse*.9*(.6+.4*Math.sin(t*TAU*2300))+lp*.25*pulse+Math.sin(t*TAU*(1800+300*Math.sin(t*5)))*.08)*env;}
  // final "spring snaps tight" clank
  for(let i=Math.round(sr*.6);i<d.length;i++){const t=(i/sr-.6);d[i]+=Math.sin(t*TAU*620)*Math.exp(-t*60)*.5;}}
 return AC.state==='running'?AC:null;}
function play(buf,gain=1,rate=1){const ac=audio();if(!ac||!buf)return;const v=volume();if(v<=0)return;const s=ac.createBufferSource();s.buffer=buf;s.playbackRate.value=rate;const g=ac.createGain();g.gain.value=gain*v;s.connect(g);g.connect(bus);s.start();}
addEventListener('pointerdown',()=>{audio();if(AC&&AC.state==='suspended')AC.resume();},{passive:true});addEventListener('keydown',()=>{audio();if(AC&&AC.state==='suspended')AC.resume();},{passive:true});
// ---------- live dashboard ----------
let mounted=null,shiftHeld=false,fontGen=0;
document.fonts?.addEventListener?.('loadingdone',()=>{fontGen++;cCache=null;});
addEventListener('keydown',e=>{if(e.key==='Shift')shiftHeld=true;},{passive:true});addEventListener('keyup',e=>{if(e.key==='Shift')shiftHeld=false;},{passive:true});addEventListener('blur',()=>{shiftHeld=false;});
export function mountL10Dash(){if(mounted)return mounted;loadImages();
 let host=null,back,live,front,bctx,lctx,fctx,size='',raf=0,lastT=0,acc=0;
 const S={shown:[100,100,100,100],sw:{angle:0,running:false,press:0,stall:0,ticks:0,minutes:0,jam:0},paper:null,pctx:null,pw:0,head:0,penY:0,penV:0,burst:0,lastHealth:100,t:0,
  baro:{a:1,v:0,set:1},tube:{tilt:0,tv:0,wave:0,wv:0,phase:0,lastVx:0,lastVz:0,lastYaw:null,step:0},bottles:-1};
 function ensure(){const stats=document.querySelector('.stats');if(!stats)return false;if(host&&host.isConnected)return true;
  stats.insertAdjacentHTML('beforeend',`<div class="l10-dash" aria-hidden="true"><canvas class="l10-back"></canvas><canvas class="l10-live"></canvas><canvas class="l10-front"></canvas></div>`);
  host=stats.querySelector('.l10-dash');[back,live,front]=host.querySelectorAll('canvas');bctx=back.getContext('2d');lctx=live.getContext('2d');fctx=front.getContext('2d');size='';return true;}
 function resize(){const r=host.getBoundingClientRect();if(r.width<4)return false;const dpr=Math.min(2,devicePixelRatio||1),w=Math.round(r.width*dpr),h=Math.round(r.height*dpr),key=w+'x'+h+(ok(IMG.brass)?'i':'')+fontGen;if(key===size)return true;size=key;
  for(const cv of [back,live,front]){cv.width=w;cv.height=h;}const k=w/W;
  for(const c of [bctx,fctx]){c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,h);c.setTransform(k,0,0,k,0,0);}paintBack(bctx);paintFront(fctx);
  // paper ring buffer at device resolution
  S.pw=Math.round(DR.w*k);S.paper=document.createElement('canvas');S.paper.width=S.pw;S.paper.height=Math.round(DR.h*k);S.pctx=S.paper.getContext('2d');S.k=k;S.head=0;paperFill(0,S.pw);S.penY=0;S.bottles=-1;return true;}
 function paperFill(x0,n){const c=S.pctx,h=S.paper.height,k=S.k;c.fillStyle='#ecdfbf';c.fillRect(x0,0,n,h);
  // horizontal rules + time marks every 8 logical units (world-anchored by S.t)
  c.fillStyle='#b8484826';for(let y=6;y<DR.h;y+=6)c.fillRect(x0,Math.round(y*k),n,1);c.fillStyle='#b8484850';c.fillRect(x0,Math.round(DR.h/2*k),n,1);
  for(let i=0;i<n;i++){const col=(S.paperX||0)+i;if(col%Math.round(18*k)===0){c.fillStyle='#a0383848';c.fillRect(x0+i,0,1,h);}if(Math.random()<.004){c.fillStyle='#8a6a3a18';c.fillRect(x0+i,Math.random()*h,2,2);}}}
 function readVals(){const st=globalThis.__bcHudState,get=id=>Number(document.getElementById(id)?.getAttribute('aria-valuenow'));
  return st?[st.stamina,st.hydration,st.health,st.sanity??get('sanity-meter')]:[get('stamina-meter'),get('hydration-meter'),get('health-meter'),get('sanity-meter')].map(v=>Number.isFinite(v)?v:100);}
 function frame(now){raf=requestAnimationFrame(frame);if(!isL10()||document.hidden)return;if(!ensure())return;const dt=Math.min(.1,(now-(lastT||now))/1000);lastT=now;acc+=dt;if(acc<1/30)return;const step=Math.min(.1,acc);acc=0;
  if(!host.getClientRects().length)return;
  if(!resize())return;simulate(step);draw();}
 function simulate(dt){S.t+=dt;const v=readVals(),st=globalThis.__bcHudState;for(let i=0;i<4;i++){const t=clamp(Number(v[i])||0,0,100);S.shown[i]+=(t-S.shown[i])*(1-Math.exp(-dt*8));}
  const vx=st?.velocity?.x||0,vz=st?.velocity?.z||0,speed=Math.hypot(vx,vz),moving=speed>.4;
  // --- stopwatch ---
  const sw=S.sw,stam=S.shown[0],wantRun=speed>4.2;
  if(wantRun&&!sw.running){sw.running=true;sw.press=1;sw.jam=0;}
  if(!wantRun&&sw.running){sw.running=false;sw.press=1;}
  if(!sw.running&&sw.angle!==0&&v[0]>=99.5&&sw.press<=0){sw.angle=0;sw.ticks=0;sw.press=1;play(tickBuf,.7,.7);} // flyback reset
  sw.press=Math.max(0,sw.press-dt*7);
  if(sw.running){const rate=10;sw.tickAcc=(sw.tickAcc||0)+dt*rate;while(sw.tickAcc>=1){sw.tickAcc--;sw.angle+=TAU/30;sw.ticks++;if(sw.ticks%30===0)sw.minutes=(sw.minutes+1)%30;if(S.t-lastTick>.05){play(tickBuf,.55+Math.random()*.1,1+Math.random()*.08);lastTick=S.t;}}}
  // exhaustion: stamina hit zero while sprint held → mainspring jams with a creak
  const drained=v[0]<=1.5&&(S.prevStam??100)>1.5;S.prevStam=v[0];if(drained){sw.jam=1.2;if(S.t-lastCreak>1.2){play(creakBuf,1.1);lastCreak=S.t;}}
  if(v[0]<=1.5&&shiftHeld&&S.t-lastCreak>2.4&&moving){sw.jam=1.2;play(creakBuf,.8,.94+Math.random()*.1);lastCreak=S.t;}
  sw.jam=Math.max(0,sw.jam-dt);
  // --- drum recorder: dense ink trace, amplitude/tempo from health + damage bursts ---
  const hp=S.shown[2],dh=(S.lastHealth-v[2]);if(dh>.3)S.burst=Math.min(1.6,S.burst+dh*.12+.35);S.lastHealth=v[2];S.burst*=Math.exp(-dt*1.6);
  const k=S.k,speedPx=22*k,adv=speedPx*dt,n=Math.max(1,Math.round(adv));S.pAcc=(S.pAcc||0)+adv;let cols=Math.floor(S.pAcc);S.pAcc-=cols;
  const c=S.pctx,h=S.paper.height,penX=Math.round((DR.w-46)*k),weak=1-hp/100;
  for(let i=0;i<cols;i++){S.paperX=(S.paperX||0)+1;const x=(S.head+penX)%S.pw;paperFill(S.head,1);S.head=(S.head+1)%S.pw;
   // several sub-strokes per column → very dense line
   const sub=4;c.strokeStyle=`rgba(${88+weak*30|0},10,14,.82)`;c.lineWidth=Math.max(.6,.55*k);c.beginPath();const x0=(S.head+penX-1+S.pw)%S.pw;let y=S.penY;c.moveTo(x0+.5,h/2+y*h*.45);
   for(let s=1;s<=sub;s++){S.ph=(S.ph||0)+1;const t=S.t+(i*sub+s)/(cols*sub+1)*dt,beat=Math.pow(Math.max(0,Math.sin(t*TAU*(1.1+weak*1.4))),18)*(.35+weak*.4),
     trem=(Math.random()*2-1)*(.05+weak*.22+S.burst*.55),hf=Math.sin(S.ph*2.7)*(.04+weak*.06+S.burst*.3);
     const target=clamp(-beat+trem+hf+Math.sin(t*1.7)*.05*weak,-1,1);S.penV+=(target-y)*.6;S.penV*=.55;y+=S.penV;y=clamp(y,-1,1);c.lineTo(x0+s/sub,h/2+y*h*.45);}
   c.stroke();S.penY=y;}
  // --- barometer: needle with damped spring, brass set-hand slowly follows ---
  const b=S.baro,target=clamp(S.shown[3]/100,0,1)+(S.shown[3]<35?(Math.sin(S.t*23)*.006+(Math.random()-.5)*.01):0);b.v+=(target-b.a)*dt*60;b.v*=Math.exp(-dt*9);b.a+=b.v*dt;b.set+=(b.a-b.set)*(1-Math.exp(-dt*.25));
  // --- test tube: spring–damper surface tilt + step wave ---
  const tu=S.tube,yaw=st?.yaw||0;let ax=0;if(st){const fx=Math.cos(yaw),fz=-Math.sin(yaw);// player's right vector in world
   const dvx=(vx-tu.lastVx)/dt,dvz=(vz-tu.lastVz)/dt;ax=(dvx*fx+dvz*fz);tu.lastVx=vx;tu.lastVz=vz;let dyaw=tu.lastYaw==null?0:((yaw-tu.lastYaw+Math.PI*3)%TAU)-Math.PI;tu.lastYaw=yaw;ax+=dyaw/dt*1.4;}
  ax=clamp(ax,-30,30);tu.tv+=(-60*tu.tilt-3.2*tu.tv-ax*.022)*dt;tu.tilt=clamp(tu.tilt+tu.tv*dt,-.5,.5);
  if(moving){tu.step+=dt*speed*.62;if(tu.step>1){tu.step-=1;tu.wv+=(speed>4.2?1.6:.9)*(Math.random()*.4+.8);}}
  tu.wv+=(-140*tu.wave-4*tu.wv)*dt;tu.wave+=tu.wv*dt;tu.phase+=dt*9;
 }
 function draw(){const c=lctx,k=S.k;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,live.width,live.height);c.setTransform(k,0,0,k,0,0);
  // arcs
  ARCS.forEach((a,i)=>{const idx=i===0?0:i===1?1:2,val=S.shown[idx]/100;if(val<=.002)return;const end=A0+(A1-A0)*val,g=c.createLinearGradient(SW.x-a.r1,SW.y,SW.x+a.r1*.4,SW.y-a.r1);g.addColorStop(0,a.c[0]);g.addColorStop(.55,a.c[1]);g.addColorStop(1,a.c[2]);
   c.beginPath();c.arc(SW.x,SW.y,a.r1,A0,end);c.arc(SW.x,SW.y,a.r0,end,A0,true);c.closePath();c.fillStyle=g;c.fill();
   const hl=c.createRadialGradient(SW.x,SW.y,a.r0,SW.x,SW.y,a.r1);hl.addColorStop(0,'#00000040');hl.addColorStop(.45,'#ffffff30');hl.addColorStop(1,'#00000050');c.fillStyle=hl;c.fill();
   if(val<.25){c.fillStyle=`rgba(255,240,200,${.15+.15*Math.sin(S.t*6)})`;c.fill();}});
  // stopwatch hands + crown
  const sw=S.sw,R=SW.r-12;c.save();c.translate(SW.x,SW.y);
  // minute register hand
  c.save();c.translate(0,R*.38);c.rotate(sw.minutes/30*TAU+sw.ticks/900*TAU);c.strokeStyle='#1a1410';c.lineWidth=1.2;c.beginPath();c.moveTo(0,3);c.lineTo(0,-12);c.stroke();c.restore();
  const jitter=sw.jam>0?(Math.random()-.5)*.05*sw.jam:0;c.rotate(sw.angle+jitter);
  c.shadowColor='#0006';c.shadowBlur=2;c.shadowOffsetX=1.2;c.shadowOffsetY=1.8;c.fillStyle='#14100c';c.beginPath();c.moveTo(-1.1,16);c.lineTo(-.6,-R+6);c.lineTo(.6,-R+6);c.lineTo(1.1,16);c.closePath();c.fill();c.beginPath();c.arc(0,12,3.2,0,TAU);c.fill();c.shadowColor='transparent';
  c.fillStyle='#a8241c';c.fillRect(-.6,-R+6,1.2,10);c.restore();
  c.fillStyle='#3a2a10';c.beginPath();c.arc(SW.x,SW.y,3.6,0,TAU);c.fill();c.fillStyle='#e6c47a';c.beginPath();c.arc(SW.x-.6,SW.y-.6,1.8,0,TAU);c.fill();
  const push=sw.press>0?Math.sin(sw.press*Math.PI)*4:0,jamPush=sw.jam>0?2.4:0,cd=SW.r+10-push-jamPush,cx=SW.x+Math.cos(CROWN)*cd,cy=SW.y+Math.sin(CROWN)*cd;
  c.save();c.translate(cx,cy);c.rotate(CROWN+Math.PI/2);c.fillStyle='#1a1006';c.fillRect(-9,-8,18,15);const cg=c.createLinearGradient(-8,0,8,0);cg.addColorStop(0,'#5a3e18');cg.addColorStop(.35,'#f2d488');cg.addColorStop(.6,'#b8893c');cg.addColorStop(1,'#3a2610');c.fillStyle=cg;c.fillRect(-8,-7,16,13);
  c.strokeStyle='#3a2610';c.lineWidth=.7;for(let x=-6;x<=6;x+=2){c.beginPath();c.moveTo(x,-7);c.lineTo(x,6);c.stroke();}
  // bow ring
  c.strokeStyle='#2a1a08';c.lineWidth=4.2;c.beginPath();c.ellipse(0,-17,11,10,0,0,TAU);c.stroke();c.strokeStyle='#d6b066';c.lineWidth=2.2;c.stroke();c.strokeStyle='#fff1c080';c.lineWidth=.8;c.beginPath();c.ellipse(0,-17,11,10,0,Math.PI*1.1,Math.PI*1.6);c.stroke();c.restore();
  // drum paper (ring buffer → window), pen arm
  const d=DR,pw=S.pw,ph=S.paper.height,sx=S.head;c.save();c.setTransform(1,0,0,1,0,0);const X=Math.round(d.x*k),Y=Math.round(d.y*k),first=pw-sx;c.drawImage(S.paper,sx,0,first,ph,X,Y,first,ph);if(sx>0)c.drawImage(S.paper,0,0,sx,ph,X+first,Y,sx,ph);c.restore();
  const tipX=d.x+d.w-46,tipY=d.y+d.h/2+S.penY*d.h*.45,pvX=d.x+d.w-14,pvY=d.y-7.5;c.strokeStyle='#120a04';c.lineWidth=2.6;c.beginPath();c.moveTo(pvX,pvY);c.quadraticCurveTo(tipX+18,pvY+4,tipX+2,tipY-3);c.stroke();c.strokeStyle='#c9a258';c.lineWidth=1.2;c.stroke();
  c.fillStyle='#2a0608';c.beginPath();c.moveTo(tipX,tipY);c.lineTo(tipX+4.5,tipY-6);c.lineTo(tipX+1,tipY-7);c.closePath();c.fill();c.fillStyle='#7a1418';c.beginPath();c.arc(tipX+3,tipY-8,2.6,0,TAU);c.fill();
  // barometer needle + set hand
  const b=S.baro,s0=Math.PI*.75,s1=Math.PI*2.25,br=BA.r-10;c.save();c.translate(BA.x,BA.y);
  c.save();c.rotate(s0+(s1-s0)*b.set+Math.PI/2);c.strokeStyle='#b8893c';c.lineWidth=1.4;c.beginPath();c.moveTo(0,0);c.lineTo(0,-br+6);c.stroke();c.fillStyle='#d9b060';c.beginPath();c.arc(0,-br*.55,2.2,0,TAU);c.fill();c.restore();
  c.save();c.rotate(s0+(s1-s0)*clamp(b.a,0,1)+Math.PI/2);c.shadowColor='#0007';c.shadowBlur=2;c.shadowOffsetX=1.4;c.shadowOffsetY=2;c.fillStyle='#1d2433';c.beginPath();c.moveTo(-1.6,12);c.lineTo(-.5,-br+8);c.lineTo(0,-br+3);c.lineTo(.5,-br+8);c.lineTo(1.6,12);c.closePath();c.fill();
  c.beginPath();c.moveTo(0,10);c.arc(0,14,4.5,0,TAU);c.fill();c.shadowColor='transparent';c.restore();c.fillStyle='#c9a258';c.beginPath();c.arc(0,0,3.6,0,TAU);c.fill();c.fillStyle='#4a3010';c.beginPath();c.arc(0,0,1.4,0,TAU);c.fill();c.restore();
  // tube liquid
  const t=TU,tu=S.tube,lvl=clamp(S.shown[1]/100,0,1),inner=t.w/2-2,yTop=t.top+12,yBot=t.bot-2,yS=yBot-(yBot-yTop)*lvl;
  if(lvl>.003){c.save();tubePath(c,2);c.clip();const tilt=Math.tan(tu.tilt)*inner,amp=tu.wave*3;
   c.beginPath();c.moveTo(t.x-inner-2,yS+tilt);for(let i=1;i<=10;i++){const u=i/10,x=t.x-inner+u*inner*2;c.lineTo(x,yS+tilt*(1-2*u)+Math.sin(u*Math.PI*2+tu.phase)*amp*.6+Math.sin(u*Math.PI)*amp*.4);}c.lineTo(t.x+inner+2,t.bot+2);c.lineTo(t.x-inner-2,t.bot+2);c.closePath();
   const g=c.createLinearGradient(t.x-inner,0,t.x+inner,0);g.addColorStop(0,'#2a5a78d0');g.addColorStop(.3,'#6fa7c8b8');g.addColorStop(.62,'#9fd0eaa8');g.addColorStop(1,'#2a5a78d8');c.fillStyle=g;c.fill();
   const dg=c.createLinearGradient(0,yS,0,t.bot);dg.addColorStop(0,'#ffffff00');dg.addColorStop(1,'#0a2a4060');c.fillStyle=dg;c.fill();
   c.strokeStyle='#e6f6ffd0';c.lineWidth=1.2;c.beginPath();c.moveTo(t.x-inner,yS+tilt-1.2);c.quadraticCurveTo(t.x,yS+amp*.5,t.x+inner,yS-tilt-1.2);c.stroke();
   // a couple of slow bubbles
   for(let i=0;i<3;i++){const u=((S.t*.12+i*.37)%1),by=t.bot-6-u*(t.bot-6-yS),bx=t.x-6+i*6+Math.sin(S.t*2+i)*1.5;if(by>yS+3){c.strokeStyle='#e6f6ff80';c.lineWidth=.6;c.beginPath();c.arc(bx,by,1.1+i*.3,0,TAU);c.stroke();}}
   c.restore();}
  // almond water count (redrawn only when it changes is not worth a layer: two glyphs)
  const p=PL,n=parseInt(document.getElementById('bottle-count')?.textContent||'0',10)||0;c.font=`26px ${CN}`;c.textAlign='center';c.textBaseline='middle';c.fillStyle='#0a0603';c.fillText(String(n).padStart(2,'0'),p.x+p.w/2+16+1,p.y+66+1.5);
  const ng=c.createLinearGradient(0,p.y+54,0,p.y+78);ng.addColorStop(0,'#fbe6a6');ng.addColorStop(1,'#a8803a');c.fillStyle=ng;c.fillText(String(n).padStart(2,'0'),p.x+p.w/2+16,p.y+66);
  c.font=`10px ${CN}`;c.fillStyle='#c9a86ab0';c.fillText('Q 饮用',p.x+p.w/2,p.y+p.h-22);
 }
 raf=requestAnimationFrame(frame);
 mounted={stop(){cancelAnimationFrame(raf);}};return mounted;
}
// ---------- brass pocket compass (top-right). 256 × 296 logical frame ----------
const CC={x:128,y:156,R:100,ring:86,map:72};const needle={a:null,v:0};
function compassStatic(w,h,k){const back=document.createElement('canvas'),front=document.createElement('canvas'),ring=document.createElement('canvas');for(const cv of [back,front]){cv.width=w;cv.height=h;}
 const rs=Math.ceil(CC.ring*2*k);ring.width=ring.height=rs;
 const b=back.getContext('2d'),f=front.getContext('2d'),r=ring.getContext('2d');b.scale(k,k);f.scale(k,k);
 // open hinged lid behind (foreshortened), inside face darker polished brass
 b.save();b.fillStyle='#08050290';b.beginPath();b.ellipse(CC.x+2,40,96,30,0,0,TAU);b.fill();b.fillStyle=pat(b,IMG.brass,.35);b.beginPath();b.ellipse(CC.x,36,96,30,0,0,TAU);b.fill();
 const lg=b.createLinearGradient(0,6,0,66);lg.addColorStop(0,'#fff0c060');lg.addColorStop(.5,'#00000020');lg.addColorStop(1,'#1a0e0480');b.fillStyle=lg;b.fill();b.strokeStyle='#24160a';b.lineWidth=1.5;b.stroke();
 b.fillStyle='#2a1c0c';b.beginPath();b.ellipse(CC.x,37,84,24,0,0,TAU);b.fill();const ig=b.createRadialGradient(CC.x-30,30,4,CC.x,37,86);ig.addColorStop(0,'#e8c87ab0');ig.addColorStop(.5,'#8a6428a0');ig.addColorStop(1,'#2a1a08c0');b.fillStyle=ig;b.fill();
 b.strokeStyle='#f3d99440';b.lineWidth=1;b.beginPath();b.ellipse(CC.x,37,78,21,0,Math.PI*1.1,Math.PI*1.7);b.stroke();
 // engraved compass rose on lid interior (faint)
 b.strokeStyle='#3a2810a0';b.lineWidth=.8;b.beginPath();for(let i=0;i<8;i++){const a=i/8*TAU;b.moveTo(CC.x,37);b.lineTo(CC.x+Math.cos(a)*60,37+Math.sin(a)*16);}b.stroke();b.restore();
 // hinge knuckles
 { const x=CC.x-34,y=51,w=68,hh=12;b.fillStyle='#1a1006';b.beginPath();b.roundRect?b.roundRect(x-1,y-1,w+2,hh+2,6):b.rect(x-1,y-1,w+2,hh+2);b.fill();const hg=b.createLinearGradient(0,y,0,y+hh);hg.addColorStop(0,'#4a3212');hg.addColorStop(.35,'#f6dc98');hg.addColorStop(.6,'#b8893c');hg.addColorStop(1,'#2a1a08');b.fillStyle=hg;b.beginPath();b.roundRect?b.roundRect(x,y,w,hh,5):b.rect(x,y,w,hh);b.fill();
  b.strokeStyle='#2a1a08';b.lineWidth=1;for(const t of [w/3,w*2/3]){b.beginPath();b.moveTo(x+t,y);b.lineTo(x+t,y+hh);b.stroke();}b.fillStyle='#fff3c880';b.fillRect(x+3,y+3,w-6,1.2);}
 // case shadow + body
 b.fillStyle='#08050299';b.beginPath();b.arc(CC.x+2,CC.y+4,CC.R,0,TAU);b.fill();
 // stem + push button + bow at bottom
 b.fillStyle=pat(b,IMG.brass,.3);b.fillRect(CC.x-7,CC.y+CC.R-4,14,14);b.strokeStyle='#24160a';b.strokeRect(CC.x-7,CC.y+CC.R-4,14,14);
 brassRing(b,CC.x,CC.y,CC.ring,CC.R);
 // knurled coin edge
 b.save();b.translate(CC.x,CC.y);b.strokeStyle='#2a1a0880';b.lineWidth=.7;for(let i=0;i<120;i++){const a=i/120*TAU;b.beginPath();b.moveTo(Math.cos(a)*(CC.R-1),Math.sin(a)*(CC.R-1));b.lineTo(Math.cos(a)*(CC.R-5),Math.sin(a)*(CC.R-5));b.stroke();}b.restore();
 // fixed lubber line (heading index) at top of bezel
 b.fillStyle='#a8241c';b.beginPath();b.moveTo(CC.x,CC.y-CC.ring+9);b.lineTo(CC.x-5,CC.y-CC.R+3);b.lineTo(CC.x+5,CC.y-CC.R+3);b.closePath();b.fill();b.strokeStyle='#2a0806';b.lineWidth=.8;b.stroke();
 // caption plaque
 b.save();b.fillStyle='#0a060390';b.fillRect(CC.x-60,CC.y+CC.R+11,122,24);b.fillStyle=pat(b,IMG.brass,.3);b.fillRect(CC.x-61,CC.y+CC.R+9,122,24);const pg=b.createLinearGradient(0,CC.y+CC.R+9,0,CC.y+CC.R+33);pg.addColorStop(0,'#fff0c050');pg.addColorStop(1,'#2a160650');b.fillStyle=pg;b.fillRect(CC.x-61,CC.y+CC.R+9,122,24);b.strokeStyle='#24160a';b.lineWidth=1.2;b.strokeRect(CC.x-61,CC.y+CC.R+9,122,24);b.strokeStyle='#f3d99460';b.strokeRect(CC.x-59,CC.y+CC.R+11,118,20);rivet(b,CC.x-55,CC.y+CC.R+21,2);rivet(b,CC.x+55,CC.y+CC.R+21,2);b.restore();
 // rotating degree ring (aged enamel annulus) — painted once, rotated per frame
 r.scale(k,k);r.translate(CC.ring,CC.ring);r.save();r.beginPath();r.arc(0,0,CC.ring,0,TAU);r.arc(0,0,CC.map,0,TAU,true);r.closePath();r.clip();r.fillStyle='#e2d2a6';r.fillRect(-CC.ring,-CC.ring,CC.ring*2,CC.ring*2);if(ok(IMG.enamel)){r.globalAlpha=.85;r.drawImage(IMG.enamel,-CC.ring,-CC.ring,CC.ring*2,CC.ring*2);r.globalAlpha=1;}
 const rv=r.createRadialGradient(0,0,CC.map,0,0,CC.ring);rv.addColorStop(0,'#3a240a50');rv.addColorStop(.3,'#00000000');rv.addColorStop(1,'#3a240a60');r.fillStyle=rv;r.fillRect(-CC.ring,-CC.ring,CC.ring*2,CC.ring*2);r.restore();
 r.strokeStyle='#2a1e14';for(let i=0;i<72;i++){const a=i/72*TAU-Math.PI/2,big=i%9===0,mid=i%3===0;r.lineWidth=big?1.4:.7;r.beginPath();r.moveTo(Math.cos(a)*(CC.ring-1),Math.sin(a)*(CC.ring-1));r.lineTo(Math.cos(a)*(CC.ring-(big?7:mid?5:3)),Math.sin(a)*(CC.ring-(big?7:mid?5:3)));r.stroke();}
 r.textAlign='center';r.textBaseline='middle';const L=[['N','#a8241c'],['E','#1b130c'],['S','#1b130c'],['W','#1b130c']];
 L.forEach(([t,col],i)=>{r.save();r.rotate(i*Math.PI/2);r.font=`700 ${i?11:13}px ${SERIF}`;r.fillStyle=col;r.fillText(t,0,-(CC.map+7.5));r.restore();});
 for(let i=0;i<8;i++){if(i%2===0)continue;r.save();r.rotate(i*Math.PI/4);r.font=`7px ${SERIF}`;r.fillStyle='#3a2a1a';r.fillText(['','NE','','SE','','SW','','NW'][i],0,-(CC.map+7));r.restore();}
 r.strokeStyle='#1a1006';r.lineWidth=1.2;r.beginPath();r.arc(0,0,CC.map+.6,0,TAU);r.stroke();
 // glass dome reflection + inner shadow
 glass(f,CC.x,CC.y,CC.ring,1.15);
 return{back,front,ring,k,w,h};}
export function paintBrassCompass(c,rect,map,yaw,bearing){
 const w=Math.round(rect.width),h=Math.round(rect.height),k=Math.min(w/256,h/296),ox=rect.left+(w-256*k)/2,oy=rect.top+(h-296*k)/2;
 if(!cCache||cCache.w!==w||cCache.h!==h||cCache.img!==ok(IMG.brass)){loadImages();cCache={...compassStatic(w,h,k),img:ok(IMG.brass)};}
 c.save();c.setTransform(1,0,0,1,0,0);c.drawImage(cCache.back,ox,oy);c.translate(ox,oy);c.scale(k,k);
 // rotating map, warm-toned under the glass
 c.save();c.beginPath();c.arc(CC.x,CC.y,CC.map,0,TAU);c.clip();c.fillStyle='#e8dcb4';c.fillRect(CC.x-CC.map,CC.y-CC.map,CC.map*2,CC.map*2);c.translate(CC.x,CC.y);c.rotate(yaw);const m=CC.map*2*310/190;c.drawImage(map,-m/2,-m/2,m,m);c.rotate(-yaw);
 c.globalCompositeOperation='multiply';c.fillStyle='#e0c89a';c.fillRect(-CC.map,-CC.map,CC.map*2,CC.map*2);c.globalCompositeOperation='source-over';
 const vg=c.createRadialGradient(0,0,CC.map*.55,0,0,CC.map);vg.addColorStop(0,'#00000000');vg.addColorStop(1,'#2a180a70');c.fillStyle=vg;c.fillRect(-CC.map,-CC.map,CC.map*2,CC.map*2);c.restore();
 // rotating degree ring
 c.save();c.translate(CC.x,CC.y);c.rotate(yaw);c.drawImage(cCache.ring,-CC.ring,-CC.ring,CC.ring*2,CC.ring*2);c.restore();
 // magnetic needle: underdamped spring toward north (= yaw in screen space)
 const now=performance.now()/1000,dt=Math.min(.1,needle.t?now-needle.t:0);needle.t=now;if(needle.a==null)needle.a=yaw;let diff=((yaw-needle.a+Math.PI*3)%TAU)-Math.PI;needle.v+=diff*dt*38;needle.v*=Math.exp(-dt*3.2);needle.a+=needle.v*dt;
 c.save();c.translate(CC.x,CC.y);c.rotate(needle.a);c.shadowColor='#0008';c.shadowBlur=3;c.shadowOffsetX=2;c.shadowOffsetY=3;
 c.fillStyle='#b02a20';c.beginPath();c.moveTo(0,-CC.map+6);c.lineTo(6,0);c.lineTo(-6,0);c.closePath();c.fill();c.fillStyle='#2c3440';c.beginPath();c.moveTo(0,CC.map-10);c.lineTo(6,0);c.lineTo(-6,0);c.closePath();c.fill();c.shadowColor='transparent';
 c.fillStyle='#ffffff30';c.beginPath();c.moveTo(0,-CC.map+6);c.lineTo(0,0);c.lineTo(-6,0);c.closePath();c.fill();c.fillStyle='#ffffff18';c.beginPath();c.moveTo(0,CC.map-10);c.lineTo(0,0);c.lineTo(-6,0);c.closePath();c.fill();
 const pg=c.createRadialGradient(-1.5,-1.5,.5,0,0,6);pg.addColorStop(0,'#fff0b8');pg.addColorStop(.5,'#c9a258');pg.addColorStop(1,'#3a2610');c.fillStyle=pg;c.beginPath();c.arc(0,0,5.2,0,TAU);c.fill();c.restore();
 // player marker under the pivot: small red heading chevron
 c.fillStyle='#a8241cd0';c.beginPath();c.moveTo(CC.x,CC.y-15);c.lineTo(CC.x+4.5,CC.y-8);c.lineTo(CC.x-4.5,CC.y-8);c.closePath();c.fill();
 c.setTransform(1,0,0,1,0,0);c.drawImage(cCache.front,ox,oy);c.translate(ox,oy);c.scale(k,k);
 // bearing on plaque
 c.font=`16px ${CN}`;c.textAlign='center';c.textBaseline='middle';c.fillStyle='#f6dfa080';c.fillText(bearing||'',CC.x+.8,CC.y+CC.R+22);c.fillStyle='#24160a';c.fillText(bearing||'',CC.x,CC.y+CC.R+21);
 c.restore();
 return Math.abs(needle.v)>.002||Math.abs(diff)>.002;
}
