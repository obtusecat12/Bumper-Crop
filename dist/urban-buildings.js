import * as THREE from './vendor/three.module.min.js';

// All dimensions are metres. The front of a lot is +Z, and every lot is centred.
// Geometry is emitted into the supplied material batch; there are no Mesh objects
// or materials here. Reusable non-box geometry is allocated once per module.
export const BUILDING_TYPES = Object.freeze([
  'strip_mall', 'two_story_shops', 'l_plaza', 'clinic', 'research_lab',
  'bakery', 'steel_prefab', 'auto_shop', 'substation', 'cinder_warehouse',
  'laundromat', 'travel_agency', 'corner_market', 'bank_branch', 'photo_studio',
  'courtyard_motel', 'sawtooth_factory', 'bus_depot',
  'brutalist_slab', 'brutalist_cross', 'precast_tower', 'international_tower',
  'international_slab', 'black_glass_setback', 'postmodern_crown', 'terraced_office',
  'parking_garage', 'office_podium', 'civic_hall', 'civic_steps',
  'stepped_hotel', 'art_deco_tower', 'twin_towers', 'residential_balconies',
  'point_tower', 'rounded_exchange'
]);

const PI = Math.PI;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
function random(seed) {
  let n = typeof seed === 'number' ? seed >>> 0 : 2166136261;
  if (typeof seed !== 'number') for (const c of String(seed ?? 'city')) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  return () => { n += 0x6D2B79F5; let t = n; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function geom(p, indices) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setIndex(indices); g.computeVertexNormals(); return g;
}
const wedge = geom([
  -.5,0,-.5, .5,0,-.5, -.5,0,.5, .5,0,.5, -.5,1,.5, .5,1,.5
], [0,4,5,0,5,1, 0,2,4, 1,5,3, 2,3,5,2,5,4, 0,1,3,0,3,2]);
const gable = geom([
  -.5,0,-.5, .5,0,-.5, 0,1,-.5, -.5,0,.5, .5,0,.5, 0,1,.5
], [0,2,1,3,4,5,0,3,5,0,5,2,2,5,4,2,4,1,0,1,4,0,4,3]);
const shed = geom([
  -.5,0,-.5,.5,0,-.5,-.5,0,.5,.5,0,.5,-.5,1,-.5,-.5,1,.5
], [0,4,1,2,3,5,4,5,3,4,3,1,0,2,5,0,5,4,0,1,3,0,3,2,1,4,3]);
const parabola = (() => {
  const p = [0,0,0], ix = [], sectors = 24, rings = 5;
  for (let j=1;j<=rings;j++) for(let k=0;k<sectors;k++) { const r=j/rings,a=k*2*PI/sectors;p.push(Math.cos(a)*r,Math.sin(a)*r,.42*r*r); }
  for(let k=0;k<sectors;k++) ix.push(0,1+k,1+(k+1)%sectors);
  for(let j=1;j<rings;j++) for(let k=0;k<sectors;k++) { const a=1+(j-1)*sectors+k,c=1+(j-1)*sectors+(k+1)%sectors,b=1+j*sectors+k,d=1+j*sectors+(k+1)%sectors;ix.push(a,b,d,a,d,c); }
  return geom(p,ix);
})();
const barrel = (() => {
  const p=[],ix=[],n=14;
  for(let i=0;i<=n;i++){const a=i*PI/n; p.push(Math.cos(a)*.5,Math.sin(a),-.5, Math.cos(a)*.5,Math.sin(a),.5);}
  for(let i=0;i<n;i++){const a=i*2;ix.push(a,a+1,a+3,a,a+3,a+2);}
  p.push(0,0,-.5,0,0,.5); const a=2*(n+1);
  for(let i=0;i<n;i++){ix.push(a,i*2+2,i*2,a+1,i*2+1,i*2+3);}
  return geom(p,ix);
})();
const unitBox = new THREE.BoxGeometry(1,1,1);
const ovalCylinder = new THREE.CylinderGeometry(1,1,1,24,1,false);
const awningSide = geom([0,0,-.5,0,1,-.5,0,0,.5], [0,1,2,2,1,0]);

function at(b,x,y,z,ry,fn) { b.push(x,y,z,ry); try { fn(); } finally { b.pop(); } }
function plinth(b,w,d,y=.18,key='concrete') { b.box(key,0,y/2,0,w,y,d); }
function parapet(b,w,d,y,key='concrete',h=.42) {
  b.box(key,0,y+h/2,d/2-.12,w,h,.24); b.box(key,0,y+h/2,-d/2+.12,w,h,.24);
  b.box(key,-w/2+.12,y+h/2,0,.24,h,d); b.box(key,w/2-.12,y+h/2,0,.24,h,d);
  b.box('asphalt',0,y-.04,0,w-.4,.08,d-.4);
  if(key!=='dark'&&h>.3)for(const [x,hh] of [[-w*.23,h*.71],[w*.36,h*.46]])b.plane(key,x,y+h-hh/2-.015,d/2+.003,.037,hh,0,0,.79);
}
function shell(b,w,d,h,key='stucco',base=0,roof=true) {
  b.box(key,-w/2+.18,base+h/2,0,.36,h,d); b.box(key,w/2-.18,base+h/2,0,.36,h,d);
  b.box(key,0,base+h/2,-d/2+.18,w,h,.36);
  b.box('dark',0,base+h/2,-d*.12,w-.6,h-.1,d*.65);
  b.box('concrete',0,base+.13,0,w,.26,d);
  b.box(key,0,base+h-.18,0,w,.36,d);
  if (roof) parapet(b,w,d,base+h,key);
  b.solid(0,0,w,d);
}
function door(b,x,z,y=0,w=1.35,h=2.5,glass=true,lod=0) {
  b.box('dark',x,y+h/2,z-.055,w+.14,h+.12,.14);
  b.plane(glass?'glassLight':'shutter',x,y+h/2,z+.025,w-.14,h-.16);
  b.box('metal',x-w/2,y+h/2,z+.045,.065,h,.08); b.box('metal',x+w/2,y+h/2,z+.045,.065,h,.08);
  b.box('metal',x,y+h,z+.045,w,.075,.08); b.box('concrete',x,y+.035,z+.1,w+.3,.07,.38);
  if(!lod) { b.box('metal',x+w*.26,y+h*.48,z+.09,.055,.48,.07); b.box('metal',x,y+.25,z+.05,w-.13,.12,.03); }
}
function shops(b,w,d,h,ids,r,lod=0,opts={}) {
  const n = clamp(Math.round(w/(opts.bay||5)),2,8), bay=w/n, wall=opts.key||'stucco', z=d/2;
  const low=opts.base||0, glassH=opts.glassH||2.65, fasciaY=low+glassH+.55;
  shell(b,w,d,h,wall,low);
  b.box(wall,0,fasciaY,z-.05,w,Math.max(.75,h-glassH),.6);
  b.box('concrete',0,low+.2,z-.08,w,.4,.44);
  for(let i=0;i<n;i++) {
    const x=-w/2+bay*(i+.5), ww=bay-.46;
    b.plane(b.mats.photoRetail?(ids[i%ids.length]==='market'?'photoShop':ids[i%ids.length]==='bakery'?'photoBakeryInside':'photoRetail'):(i%3?'glass':'glassLight'),x,low+.4+glassH/2,z-.19,ww,glassH-.15);
    b.box(wall,x-bay/2+.16,low+glassH/2,z-.05,.32,glassH+.5,.64);
    b.box('metal',x+ww*.12,low+glassH/2+.25,z-.10,.055,glassH,.07);
    door(b,x+bay*.21,z-.09,low+.16,Math.min(1.3,bay*.28),2.4,true,lod);
    b.box('concrete',x,low+.39,z+.03,ww,.12,.32);
    if(!lod) b.sign(ids[i%ids.length],x,fasciaY+.03,z+.27,Math.min(ww-.3,4.6),.74);
    if(opts.awning) {
      if(opts.awning==='yellow') {
        b.add(barrel,opts.awning,x,low+2.64,z+.58,ww,.58,1.38);
        b.box(opts.awning,x,low+2.53,z+1.27,ww,.23,.055);
      } else {
        // A thin sloping fabric sheet, closed triangular cheeks, and hanging valance.
        b.add(unitBox,opts.awning,x,low+2.93,z+.58,ww,.055,1.46,0,.273);
        b.box(opts.awning,x,low+2.62,z+1.28,ww,.24,.05);
        for(const side of [-1,1])b.add(awningSide,opts.awning,x+side*ww/2,low+2.73,z+.58,1,.4,1.41);
      }
      if(!lod)for(const side of [-1,1]){const xx=x+side*ww*.45;b.rod('metal',[xx,low+2.24,z],[xx,low+2.73,z+1.26],.033);b.rod('metal',[xx,low+3.12,z-.13],[xx,low+2.73,z+1.26],.025);}
    }
  }
  b.box(wall,w/2-.16,low+glassH/2,z-.05,.32,glassH+.5,.64);
  return h+low+.42;
}
function windowBand(b,w,d,base,floors,fh,key='concrete',opts={}) {
  const h=floors*fh, inset=opts.inset??.5, pier=opts.pier??.38, spacing=opts.spacing??3.8, slab=opts.slab??.58, lod=opts.lod||0;
  // The inner body stops behind glazing; slabs and piers form actual deep jambs.
  b.box('dark',0,base+h/2,0,Math.max(.3,w-2*inset-.12),h,Math.max(.3,d-2*inset-.12));
  for(let f=0;f<floors;f++) {
    const y=base+(f+.5)*fh, gw=Math.max(.3,w-.24), gh=fh-slab-.15;
    b.plane(opts.glass||'glass',0,y,d/2-inset,gw,gh);
    b.plane(opts.glass||'glass',0,y,-d/2+inset,gw,gh,PI);
    b.plane(opts.glass||'glass',-w/2+inset,y,0,Math.max(.3,d-.24),gh,-PI/2);
    b.plane(opts.glass||'glass',w/2-inset,y,0,Math.max(.3,d-.24),gh,PI/2);
    b.box(key,0,base+f*fh+slab/2,0,w,slab,d);
    if(!lod && opts.sills) { b.box('travertine',0,base+f*fh+slab+.045,d/2-.03,w,.09,.2);b.box('travertine',0,base+f*fh+slab+.045,-d/2+.03,w,.09,.2); }
    if(!lod && f%6===2)for(const xx of [-w*.28,w*.19])b.plane(key,xx,base+f*fh+slab*.60,d/2+.007,.035,slab*.55,0,0,.8);
  }
  b.box(key,0,base+h-.13,0,w,.26,d);
  const nx=clamp(Math.round(w/spacing),2,14),nz=clamp(Math.round(d/spacing),2,12);
  for(let i=0;i<=nx;i++){const x=-w/2+(.5* pier)+(w-pier)*i/nx;b.box(key,x,base+h/2,d/2-inset/2,pier,h,inset+.16);b.box(key,x,base+h/2,-d/2+inset/2,pier,h,inset+.16);}
  for(let i=1;i<nz;i++){const z=-d/2+(d)*i/nz;b.box(key,-w/2+inset/2,base+h/2,z,inset+.16,h,pier);b.box(key,w/2-inset/2,base+h/2,z,inset+.16,h,pier);}
  if(opts.ribs) for(let i=0;i<=nx;i++){const x=-w/2+(w)*i/nx;b.box(opts.ribKey||key,x,base+h/2,d/2+.18,pier*.65,h,.62);b.box(opts.ribKey||key,x,base+h/2,-d/2-.18,pier*.65,h,.62);}
  b.solid(0,0,w,d); return base+h;
}
function curtain(b,w,d,base,floors,fh,lod=0,glass='glass',mullion='metal',grid=2.6) {
  const h=floors*fh, nx=clamp(Math.round(w/grid),2,16), nz=clamp(Math.round(d/grid),2,14), step=lod?2:1;
  b.box('dark',0,base+h/2,0,w-.25,h,d-.25);
  b.plane(glass,0,base+h/2,d/2,w,h);b.plane(glass,0,base+h/2,-d/2,w,h,PI);
  b.plane(glass,w/2,base+h/2,0,d,h,PI/2);b.plane(glass,-w/2,base+h/2,0,d,h,-PI/2);
  for(let i=0;i<=nx;i+=step){const x=-w/2+i*w/nx;b.box(mullion,x,base+h/2,d/2+.04,.065,h,.11);b.box(mullion,x,base+h/2,-d/2-.04,.065,h,.11);}
  for(let i=0;i<=nz;i+=step){const z=-d/2+i*d/nz;b.box(mullion,w/2+.04,base+h/2,z,.11,h,.065);b.box(mullion,-w/2-.04,base+h/2,z,.11,h,.065);}
  for(let j=0;j<=floors;j+=step){const y=base+j*fh;b.box(mullion,0,y,d/2+.035,w,.075,.09);b.box(mullion,0,y,-d/2-.035,w,.075,.09);b.box(mullion,w/2+.035,y,0,.09,.075,d);b.box(mullion,-w/2-.035,y,0,.09,.075,d);}
  b.box(mullion,0,base+h+.06,0,w+.18,.12,d+.18);b.solid(0,0,w,d);return base+h;
}
function louver(b,x,y,z,w,h,lod=0) {
  b.box('dark',x,y,z,w,h,.07);
  const n=lod?3:8;for(let i=0;i<n;i++) b.box('metal',x,y-h/2+(i+.5)*h/n,z+.055,w,.045,.09);
}
function equipment(b,w,d,y,r,lod=0,scale=1) {
  const ew=Math.min(3,w*.22)*scale,ed=Math.min(2.05,d*.19)*scale,ex=w*.18*(r()>.5?1:-1),ez=-d*.13;
  b.box('concrete',ex,y+.1,ez,ew+.35,.2,ed+.35);
  b.box('metal',ex,y+.73,ez,ew,1.18,ed,0,.93+r()*.11);
  louver(b,ex,y+.72,ez+ed/2+.045,ew-.2,.88,lod);
  b.box('dark',ex,y+1.34,ez,ew-.2,.04,ed-.2);
  const fans=ew>2.25?2:1;
  for(let f=0;f<fans;f++) {
    const x=ex+(f-(fans-1)/2)*ew*.43,rad=Math.min(.51,ed*.32);
    b.cylinder('steel',x,y+1.39,ez,rad,rad,.09,12);
    b.cylinder('dark',x,y+1.45,ez,rad*.83,rad*.83,.022,12);
    if(!lod) for(let k=0;k<6;k++){const a=k*PI/3;b.rod('metal',[x,y+1.47,ez],[x+Math.cos(a)*rad*.8,y+1.47,ez+Math.sin(a)*rad*.8],.022);}
  }
  const px=-ex,pz=-d*.26;
  b.cylinder('metal',px,y+.69,pz,.15,.15,1.35,8);
  b.sphere('metal',px,y+1.32,pz,.19,.19,.19);
  b.cylinder('metal',px,y+1.32,pz+.3,.16,.16,.65,8,PI/2);
  b.cylinder('dark',px,y+1.32,pz+.65,.115,.115,.025,8,PI/2);
  if(!lod && w*d>220 && r()>.25) waterTank(b,w*.27,y,d*.23,Math.min(1.1,w*.055));
  if(r()>.43) antenna(b,-w*.31,y,-d*.25,lod);
  else if(!lod && w*d>150) dish(b,-w*.26,y,d*.14,.78);
}
function waterTank(b,x,y,z,r=1) {
  for(const sx of [-1,1])for(const sz of [-1,1]) b.box('steel',x+sx*r*.64,y+.55,z+sz*r*.64,.1,1.1,.1);
  b.cylinder('metal',x,y+1.75,z,r,r,1.75,12,0,0,.96);
  b.cylinder('steel',x,y+2.78,z,0,r+.08,.32,12);
  b.cylinder('steel',x,y+.9,z,r+.05,r+.05,.11,12);
  b.cylinder('steel',x,y+2.53,z,r+.05,r+.05,.1,12);
  b.cylinder('metal',x+r*.82,y+.5,z,.08,.08,1.1,7);
}
function antenna(b,x,y,z,lod) {
  const h=lod?3:3.8,rr=.38,p=[];
  for(let k=0;k<3;k++){const a=k*2*PI/3;p.push([x+Math.cos(a)*rr,z+Math.sin(a)*rr]);b.rod('steel',[p[k][0],y,p[k][1]],[x,y+h,z],.035);}
  if(!lod) for(let j=0;j<4;j++) for(let k=0;k<3;k++){const t=j/4,tt=(j+1)/4,a=p[k],c=p[(k+1)%3];b.rod('metal',[x+(a[0]-x)*(1-t),y+h*t,z+(a[1]-z)*(1-t)],[x+(c[0]-x)*(1-tt),y+h*tt,z+(c[1]-z)*(1-tt)],.021);}
  b.rod('metal',[x,y+h-.4,z],[x,y+h+1.1,z],.025);
  for(let k=0;k<3;k++)b.rod('metal',[x-.7+k*.14,y+h+.14+k*.25,z],[x+.7-k*.14,y+h+.14+k*.25,z],.026);
}
function dish(b,x,y,z,r) {
  const cy=y+1.45,a=-.72,c=Math.cos(a),s=Math.sin(a);
  const p=(xx,yy,zz)=>[x+xx,cy+yy*c-zz*s,z+yy*s+zz*c];
  b.add(parabola,'dishMesh',x,cy,z,r,r,r,0,a,0,.93);
  for(let k=0;k<12;k++) {
    const t=k*PI/6;
    for(let j=0;j<4;j++){const q=j/4,qq=(j+1)/4;b.rod('steel',p(Math.cos(t)*r*q,Math.sin(t)*r*q,r*.42*q*q),p(Math.cos(t)*r*qq,Math.sin(t)*r*qq,r*.42*qq*qq),.013);}
  }
  for(let k=0;k<3;k++){const a=k*PI*2/3;b.rod('metal',p(Math.cos(a)*r*.87,Math.sin(a)*r*.87,r*.32),p(0,0,r*.72),.025);}
  b.sphere('dark',...p(0,0,r*.73),.1,.1,.15);
  b.rod('steel',[x,y,z],[x,cy-.4,z],.075);
  for(const sign of [-1,1])b.rod('metal',[x+sign*.55,y,z+.35],[x,cy-.5,z],.045);
}
function ramp(b,x,z,w,len,base,rise,lod=0,reverse=false) {
  const ry=reverse?PI:0;
  b.add(wedge,'concrete',x,base,z,w,rise,len,ry);
  b.walk(x,z,w,len,base+rise/2,0,(reverse?-1:1)*rise/len);
  for(const sign of [-1,1]) {
    b.add(wedge,'white',x+sign*(w/2-.06),base+.13,z,.12,rise,len,ry);
    const ya=base+(reverse?rise:0),yb=base+(reverse?0:rise),xx=x+sign*(w/2-.12);
    for(const rh of [.7,1.03])b.rod('white',[xx,ya+rh,z-len/2],[xx,yb+rh,z+len/2],.037);
    const n=lod?2:Math.ceil(len/1.5);
    for(let i=0;i<=n;i++){const t=i/n;b.rod('metal',[xx,ya+(yb-ya)*t,z-len/2+t*len],[xx,ya+(yb-ya)*t+1.03,z-len/2+t*len],.035);}
  }
}
function stairs(b,x,z,w,run,steps,topY,base=0,key='concrete',rail=false,lod=0) {
  for(let i=0;i<steps;i++){const h=base+(i+1)*(topY-base)/steps,zz=z+run/2-(i+.5)*run/steps;b.box(key,x,h/2,zz,w,h,run/steps+.018);b.walk(x,zz,w,run/steps,h);}
  if(rail) for(const s of [-1,1]) {
    const xx=x+s*(w/2-.16);b.rod('metal',[xx,base+.94,z+run/2],[xx,topY+.94,z-run/2],.042);
    if(!lod) for(let i=0;i<=steps;i+=2){const yy=base+(topY-base)*i/steps,zz=z+run/2-run*i/steps;b.rod('metal',[xx,yy,zz],[xx,yy+.94,zz],.035);}
  }
}
function fireEscape(b,x,z,floors,fh,lod=0) {
  if(lod)return;
  const n=Math.min(5,floors),ww=2.7,dd=1.15;
  for(let i=1;i<n;i++) {
    const y=i*fh+.25;b.box('steel',x,y,z,ww,.09,dd);
    for(const s of [-1,1]){b.rod('steel',[x+s*ww/2,y,z-dd/2],[x+s*ww/2,y+1,z-dd/2],.035);b.rod('steel',[x+s*ww/2,y,z+dd/2],[x+s*ww/2,y+1,z+dd/2],.035);}
    b.rod('steel',[x-ww/2,y+1,z+dd/2],[x+ww/2,y+1,z+dd/2],.035);
    if(i<n-1){const a=x+(i%2?-.95:.95),c=x+(i%2?.95:-.95);for(const dz of [-.31,.31])b.rod('steel',[a,y,z+dz],[c,y+fh,z+dz],.035);for(let s=0;s<11;s++){const t=s/10;b.box('steel',a+(c-a)*t,y+fh*t,z,.24,.055,.67);}}
  }
}
function loadingDoor(b,x,z,y,w,h,lod=0) {
  b.box('dark',x,y+h/2,z-.08,w+.16,h+.14,.17);
  b.plane('shutter',x,y+h/2,z+.02,w,h);
  b.box('steel',x,y+h+.13,z+.08,w+.3,.22,.27);
  b.box('yellow',x-w/2-.35,y+.55,z+.25,.11,1.1,.11);b.box('yellow',x+w/2+.35,y+.55,z+.25,.11,1.1,.11);
  if(!lod)b.box('metal',x,y+.72,z+.06,.5,.04,.05);
}
function lowRoof(b,w,d,h,r,lod) { equipment(b,w,d,h+.06,r,lod); }

// Built-up channel letters: extruded metal returns with pale faces, on a steel rack.
const letterStrokes = {
  T:[[0,1,.9,1],[.45,1,.45,0]],
  O:[[.16,0,.72,0],[.72,0,.9,.17],[.9,.17,.9,.83],[.9,.83,.72,1],[.72,1,.16,1],[.16,1,0,.83],[0,.83,0,.17],[0,.17,.16,0]],
  W:[[0,1,.19,0],[.19,0,.45,.61],[.45,.61,.7,0],[.7,0,.9,1]],
  E:[[0,0,0,1],[0,1,.9,1],[0,.52,.73,.52],[0,0,.9,0]],
  R:[[0,0,0,1],[0,1,.72,1],[.72,1,.9,.82],[.9,.82,.9,.64],[.9,.64,.72,.5],[.72,.5,0,.5],[.43,.5,.92,0]],
  P:[[0,0,0,1],[0,1,.72,1],[.72,1,.9,.82],[.9,.82,.9,.64],[.9,.64,.72,.5],[.72,.5,0,.5]],
  G:[[.88,.84,.7,1],[.7,1,.16,1],[.16,1,0,.82],[0,.82,0,.17],[0,.17,.17,0],[.17,0,.75,0],[.75,0,.9,.17],[.9,.17,.9,.47],[.9,.47,.48,.47]],
  A:[[0,0,.45,1],[.45,1,.9,0],[.2,.4,.7,.4]],
  S:[[.88,.86,.7,1],[.7,1,.15,1],[.15,1,0,.83],[0,.83,0,.63],[0,.63,.17,.51],[.17,.51,.73,.51],[.73,.51,.9,.37],[.9,.37,.9,.15],[.9,.15,.74,0],[.74,0,.16,0],[.16,0,0,.13]],
  U:[[0,1,0,.18],[0,.18,.16,0],[.16,0,.73,0],[.73,0,.9,.18],[.9,.18,.9,1]],
  K:[[0,0,0,1],[0,.47,.9,1],[.15,.57,.9,0]],
  I:[[.18,1,.72,1],[.45,1,.45,0],[.18,0,.72,0]],
  N:[[0,0,0,1],[0,1,.9,0],[.9,0,.9,1]],
};
function fabricBanner(b,x,y,z,width=4.4){
  const h=width*3,g=new THREE.PlaneGeometry(width,h,4,12),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const u=(p.getX(i)/width+.5),v=(p.getY(i)/h+.5);p.setZ(i,.025*Math.sin(u*PI*3)*Math.sin(v*PI));}g.computeVertexNormals();
  b.add(g,'sign:pegasus',x,y,z);g.dispose();for(const k of[-1,1]){b.rod('steel',[x-width/2-.10,y+k*h/2,z],[x+width/2+.10,y+k*h/2,z],.055);b.box('steel',x,y+k*h/2,z-.12,width+.12,.06,.26);}
}
function roofLetters(b,word,x,y,z,width,height=1.35,lod=0) {
  const advance=Math.min(height*1.02,width/word.length),scale=Math.min(height,advance/.97),full=advance*word.length;
  b.box('steel',x,y+.16,z-.17,full,.1,.13);b.box('steel',x,y+scale*.83,z-.17,full,.07,.10);
  for(const s of [-1,1]){b.box('steel',x+s*full*.38,y-.38,z-.17,.07,.9,.08);b.rod('steel',[x+s*full*.38,y-.76,z-.8],[x+s*full*.38,y+.47,z-.17],.036);}
  for(let i=0;i<word.length;i++)for(const [ax,ay,bx,by] of letterStrokes[word[i]]||[]){const dx=(bx-ax)*scale,dy=(by-ay)*scale,len=Math.hypot(dx,dy),cx=x-full/2+i*advance+(ax+bx)*scale/2,cy=y+(ay+by)*scale/2,angle=Math.atan2(dy,dx),th=scale*.10;b.add(unitBox,'metal',cx,cy,z,len+th*.22,th,.19,0,0,angle);if(!lod)b.add(unitBox,'letters',cx,cy,z+.105,len+th*.12,th*.84,.035,0,0,angle);}
}

const builders = {
  strip_mall({b,w,d,r,lod}) {
    const bw=w-.8,bd=d-3,h=4.15;
    at(b,0,0,-.7,0,()=>{ shops(b,bw,bd,h,['bakery','photo','cleaners','travel','market'],r,lod,{awning:r()>.5?'green':'blue'});lowRoof(b,bw,bd,h,r,lod); });
    return h+4.4;
  },
  two_story_shops({b,w,d,r,lod}) {
    const bw=w-.8,bd=d-3,h=7.75;
    at(b,0,0,-.7,0,()=>{
      shops(b,bw,bd,4,['market','pharmacy','photo','travel'],r,lod,{key:'brickOchre',awning:'green'});
      windowBand(b,bw,bd,4,1,3.75,'brickOchre',{inset:.42,pier:.75,spacing:4.3,slab:1.1,sills:true,lod});
      parapet(b,bw+.12,bd+.12,h,'travertine',.35);lowRoof(b,bw,bd,h,r,lod);
      fireEscape(b,bw*.3,bd/2+.62,2,3.85,lod);
    });return h+4.4;
  },
  l_plaza({b,w,d,r,lod}) {
    const bw=w-.8,backD=d*.32,sideD=w*.23,sideW=d*.60,h=4.3;
    at(b,0,0,-d/2+backD/2+.4,0,()=>{shops(b,bw,backD,h,['market','cleaners','pharmacy','photo'],r,lod);lowRoof(b,bw,backD,h,r,lod);});
    at(b,-w/2+sideD/2+.4,0,d*.10,PI/2,()=>{shops(b,sideW,sideD,h,['bakery','travel','photo'],r,lod);equipment(b,sideW,sideD,h,r,lod);});
    b.box('sidewalk',w*.12,.10,d*.1,w*.7,.2,d*.68);b.walk(w*.12,d*.1,w*.7,d*.68,.2);
    for(const x of [w*.04,w*.31]) {b.box('concrete',x,.39,d*.33,2.5,.78,1.1);b.box('dark',x,.78,d*.33,2.3,.04,.9);b.sphere('foliage',x,.97,d*.33,1.03,.43,.43);}
    return h+4.4;
  },
  clinic({b,w,d,r,lod}) {
    const bw=w-.8,bd=d*.53,cz=-d*.22,front=cz+bd/2,run=clamp(d*.46-2.7,1.8,5.4),rise=run/12,level=rise*2,h=4.25;
    at(b,0,0,cz,0,()=>{
      plinth(b,bw,bd,level,'concrete');shell(b,bw,bd,h,'white',level);
      b.box('white',0,level+3.65,bd/2-.12,bw,1.22,.6);
      b.plane('glassLight',0,level+1.75,bd/2-.4,bw-.8,2.6);
      const nx=clamp(Math.round(bw/3.2),3,9);for(let i=0;i<=nx;i++) b.box('white',-bw/2+i*bw/nx,level+1.9,bd/2-.09,.3,3.5,.62);
      b.box('blue',0,level+3.04,bd/2+.07,bw,.1,.1);
      if(!lod)b.sign('clinic',bw*.20,level+3.68,bd/2+.20,Math.min(5,bw*.32),.83);
      equipment(b,bw,bd,level+h,r,lod);parapet(b,bw,bd,level+h,'white');
    });
    const rx=-w*.25,zc=front+1.18+run/2,rw=Math.min(1.55,w*.075),gap=.22;
    ramp(b,rx-rw/2-gap/2,zc,rw,run,0,rise,lod);
    ramp(b,rx+rw/2+gap/2,zc,rw,run,rise,rise,lod,true);
    b.box('concrete',rx,rise/2,zc+run/2+.55,rw*2+gap,rise,1.1);b.walk(rx,zc+run/2+.55,rw*2+gap,1.1,rise);
    for(const hh of [.7,1.03])b.rod('white',[rx-rw-gap/2,rise+hh,zc+run/2+1.02],[rx+rw+gap/2,rise+hh,zc+run/2+1.02],.037);
    b.box('concrete',rx+rw/2+gap/2,level/2,front+.58,rw+.28,level,1.2);b.walk(rx+rw/2+gap/2,front+.58,rw+.28,1.2,level);
    door(b,rx+rw/2+gap/2,front-.27,level,1.5,2.65,true,lod);
    stairs(b,w*.17,front+.88,Math.min(4.6,w*.28),1.7,Math.max(3,Math.round(level/.16)),level,0,'concrete',true,lod);
    door(b,w*.17,front-.27,level,1.7,2.65,true,lod);
    return level+h+4.4;
  },
  research_lab({b,w,d,r,lod}) {
    const bw=w*.91,bd=d*.71,h=7.9;
    at(b,0,0,-d*.10,0,()=>{
      windowBand(b,bw,bd,.2,2,3.8,'white',{inset:.62,pier:.28,spacing:4.8,slab:1.3,glass:'glassLight',lod});
      b.box('ribbed',-bw*.36,h/2,0,bw*.18,h+.4,bd+.18);
      parapet(b,bw,bd,h,'white');equipment(b,bw,bd,h,r,lod);
      b.box('metal',0,h+1.0,-bd*.12,bw*.28,1.8,bd*.32);louver(b,0,h+1.05,-bd*.12+bd*.16+.03,bw*.25,1.5,lod);
      for(let i=0;i<3;i++){b.cylinder('steel',bw*.1+i*.4,h+2.65,-bd*.12,.15,.15,1.5,8);b.cylinder('dark',bw*.1+i*.4,h+3.43,-bd*.12,.16,.16,.12,8);}
      b.box('white',bw*.12,3.0,bd/2+.7,Math.min(7,bw*.38),.22,1.9);door(b,bw*.12,bd/2-.55,.1,1.9,2.65,true,lod);
      if(!lod)b.sign('lab',bw*.14,3.45,bd/2+.06,Math.min(5,bw*.35),.75);
    });return h+4.4;
  },
  bakery({b,w,d,r,lod}) {
    const bw=w*.84,bd=d*.80,h=4.45;
    at(b,0,0,-.4,0,()=>{
      shops(b,bw,bd,h,['bakery'],r,lod,{key:'brickRed',bay:8,awning:'yellow'});
      b.box('travertine',0,h-.2,bd/2+.06,bw+.25,.28,.52);
      at(b,0,0,-bd/2-.035,PI,()=>loadingDoor(b,bw*.19,0,0,Math.min(3.5,bw*.29),3.1,lod));
      b.box('brickRed',-bw*.34,h+1.6,-bd*.29,1.05,3.3,1.05);b.box('concrete',-bw*.34,h+3.3,-bd*.29,1.27,.2,1.27);
      lowRoof(b,bw,bd,h,r,lod);b.cylinder('metal',bw*.2,h+.7,-bd*.34,.42,.42,1.3,10);b.cylinder('metal',bw*.2,h+1.35,-bd*.34,.6,.18,.22,10);
    });return h+4.4;
  },
  steel_prefab({b,w,d,r,lod}) {
    const bw=w*.88,bd=d*.90,h=3.9,rh=clamp(bw*.15,1.25,3.1);
    shell(b,bw,bd,h,'steel',0,false);b.add(gable,'metal',0,h,0,bw+.3,rh,bd+.3);
    b.box('steel',0,h/2,bd/2-.14,bw,h,.28);
    const bays=clamp(Math.floor(bw/3),3,9);for(let i=0;i<=bays;i++){const x=-bw/2+i*bw/bays;b.box('metal',x,h/2,bd/2+.045,.09,h,.13);b.box('metal',x,h/2,-bd/2-.045,.09,h,.13);}
    loadingDoor(b,-bw*.13,bd/2+.025,0,Math.min(5.5,bw*.42),3.5,lod);door(b,bw*.35,bd/2+.04,0,1.1,2.4,false,lod);
    for(const s of [-1,1])b.rod('steel',[s*bw/2,h,bd/2+.18],[0,h+rh,bd/2+.18],.065);
    b.box('metal',0,h+rh+.045,0,.18,.13,bd+.38);
    if(!lod){b.cylinder('metal',-bw*.25,h+rh*.65+.45,-bd*.22,.17,.17,1,8);b.cylinder('metal',-bw*.25,h+rh*.65+.98,-bd*.22,.29,.1,.18,8);}
    return h+rh+1;
  },
  auto_shop({b,w,d,r,lod}) {
    const bw=w-.8,bd=d*.74,h=4.8,n=clamp(Math.round(bw/5.1),2,6),bay=bw/n;
    at(b,0,0,-d*.08,0,()=>{
      shell(b,bw,bd,h,'brickOchre');b.box('white',0,4.25,bd/2-.04,bw,1.0,.65);
      for(let i=0;i<n;i++){const x=-bw/2+(i+.5)*bay;b.box('concrete',x-bay/2+.17,2,bd/2-.05,.34,4,.6);loadingDoor(b,x,bd/2+.02,0,bay-.85,3.6,lod);}
      b.box('red',0,4.94,bd/2+.05,bw+.1,.22,.54);if(!lod)b.sign('auto',0,4.24,bd/2+.32,Math.min(6,bw*.46),.68);
      lowRoof(b,bw,bd,h,r,lod);
      for(const x of [-bw*.40,bw*.40])b.box('yellow',x,.44,bd/2+.85,.14,.88,.14);
      for(let i=0;i<3&&!lod;i++){b.cylinder('rubber',bw*.43,.19+i*.25,bd*.15,.37,.37,.24,10);b.cylinder('dark',bw*.43,.32+i*.25,bd*.15,.18,.18,.025,10);}
    });return h+4.4;
  },
  substation({b,w,d,lod}) {
    const bw=w-.8,bd=d-.8;
    plinth(b,bw,bd,.17);b.box('cinder',0,1.22,-bd/2+.18,bw,2.44,.36);b.box('cinder',-bw/2+.18,1.05,0,.36,2.1,bd);b.box('cinder',bw/2-.18,1.05,0,.36,2.1,bd);
    b.box('cinder',-bw*.32,.73,bd/2-.15,bw*.36,1.46,.3);b.box('cinder',bw*.32,.73,bd/2-.15,bw*.36,1.46,.3);
    b.box('concrete',0,.09,0,bw-.5,.18,bd-.5);b.solid(0,0,bw,bd);
    for(let i=0;i<2;i++){
      const x=(i-.5)*bw*.43,z=-bd*.07,tw=Math.min(3.6,bw*.25),td=Math.min(3.0,bd*.30);
      b.box('concrete',x,.38,z,tw+.7,.55,td+.7);b.box('green',x,1.55,z,tw,2.0,td,0,.74);
      b.box('metal',x,2.62,z,tw+.12,.2,td+.12);
      const fins=lod?4:10;for(let k=0;k<fins;k++){const zz=z-td*.43+k*td*.86/(fins-1);b.box('steel',x-tw/2-.22,1.55,zz,.45,1.6,.09);b.box('steel',x+tw/2+.22,1.55,zz,.45,1.6,.09);}
      b.cylinder('metal',x,3.03,z-.15,.28,.28,.62,10);
      for(let q=0;q<3;q++){const xx=x+(q-1)*tw*.28;b.cylinder('dark',xx,3.1,z+td*.28,.095,.095,.9,8);for(let k=0;k<(lod?3:6);k++)b.cylinder('white',xx,2.8+k*.13,z+td*.28,.2,.15,.095,8);b.rod('metal',[xx,3.65,z+td*.28],[xx,4.35,-bd*.31],.055);}
    }
    for(const x of [-bw*.35,bw*.35]){b.box('steel',x,2.3,-bd*.33,.16,4.6,.16);b.box('steel',x,2.3,bd*.21,.16,4.6,.16);}
    b.box('steel',0,4.6,-bd*.33,bw*.74,.15,.17);b.box('steel',0,4.6,bd*.21,bw*.74,.15,.17);
    for(let j=0;j<3;j++)b.rod('metal',[-bw*.36,4.46,-bd*.22+j*bd*.18],[bw*.36,4.46,-bd*.22+j*bd*.18],.055);
    const gw=bw*.25;b.box('steel',0,1.05,bd/2-.1,gw,2.1,.09);const gn=lod?5:12;for(let k=0;k<gn;k++)b.box('metal',-gw/2+k*gw/(gn-1),1.05,bd/2-.025,.03,2.1,.03);
    b.box('yellow',0,1.32,bd/2+.025,.65,.72,.04);b.rod('dark',[.08,1.60,bd/2+.06],[-.09,1.33,bd/2+.06],.037);b.rod('dark',[-.09,1.33,bd/2+.06],[.1,1.33,bd/2+.06],.037);b.rod('dark',[.1,1.33,bd/2+.06],[-.08,1.07,bd/2+.06],.037);
    return 4.85;
  },
  cinder_warehouse({b,w,d,r,lod}) {
    const bw=w*.93,bd=d*.86,h=6.1;
    shell(b,bw,bd,h,'cinder');b.box('cinder',0,h/2,bd/2-.1,bw,h,.3);b.plane('sign:ghost',bw/2+.014,3.65,0,Math.min(10,bd*.78),2.05,PI/2);
    loadingDoor(b,-bw*.20,bd/2+.035,.45,Math.min(5.2,bw*.31),4.2,lod);door(b,bw*.31,bd/2+.04,.05,1.2,2.5,false,lod);
    b.box('concrete',-bw*.20,.3,bd/2+.5,Math.min(6.2,bw*.38),.6,1.1);b.walk(-bw*.20,bd/2+.5,Math.min(6.2,bw*.38),1.1,.6);
    b.box('steel',-bw*.20,4.98,bd/2+.6,Math.min(6,bw*.4),.13,1.4);
    windowBand(b,bw*.74,bd*.45,h,1,1.6,'steel',{inset:.15,spacing:2.7,pier:.09,slab:.25,lod});parapet(b,bw*.74,bd*.45,h+1.6,'steel',.18);
    equipment(b,bw*.7,bd*.4,h+1.75,r,lod,.8);return h+5.8;
  },
  laundromat({b,w,d,r,lod}) {
    const bw=w*.92,bd=d*.76,h=3.95;
    shops(b,bw,bd,h,['cleaners'],r,lod,{bay:9,key:'stucco'});b.box('blue',0,3.03,bd/2+.1,bw,.19,.22);
    if(!lod){const count=clamp(Math.floor(bw/1.4),4,9);for(let k=0;k<count;k++){const x=-bw*.4+k*bw*.8/(count-1);b.box('white',x,.72,bd/2-.61,1.02,1.3,.6);b.cylinder('metal',x,.7,bd/2-.285,.34,.34,.055,12,PI/2);b.cylinder('dark',x,.7,bd/2-.248,.26,.26,.04,12,PI/2);b.box('dark',x,1.18,bd/2-.24,.42,.11,.015);}}
    b.box('white',-bw*.32,h+.5,0,bw*.2,1,bd*.72);louver(b,-bw*.32,h+.5,bd*.36+.04,bw*.2-.2,.75,lod);lowRoof(b,bw,bd,h,r,lod);return h+4.4;
  },
  travel_agency({b,w,d,r,lod}) {
    const bw=w*.91,bd=d*.68,h=4.05;
    shops(b,bw,bd,h,['travel'],r,lod,{bay:8,key:'travertine'});
    b.box('blue',bw*.3,h/2+.55,bd*.12,bw*.14,h+1.1,bd*.67);
    b.add(barrel,'metal',-bw*.15,2.8,bd/2+.57,bw*.45,.68,1.5);
    if(!lod)b.sign('travel',bw*.3,h+.35,bd*.46,Math.min(3.4,bw*.24),.75);
    lowRoof(b,bw,bd,h,r,lod);return h+4.4;
  },
  corner_market({b,w,d,r,lod}) {
    const bw=w*.86,bd=d*.82,h=4.45;
    shell(b,bw,bd,h,'brickOchre');b.box('brickOchre',0,3.76,bd/2-.12,bw,1.38,.45);
    b.plane('glassLight',0,1.7,bd/2-.23,bw-.7,2.7);door(b,bw*.20,bd/2-.14,.05,1.6,2.55,true,lod);
    for(let i=0;i<5;i++)b.box('metal',-bw*.46+i*bw*.23,1.7,bd/2-.13,.065,2.9,.12);
    b.box('green',0,3.02,bd/2+.52,bw+1,.20,1.30);b.box('green',bw/2+.45,3.02,0,1.15,.20,bd+1.4);
    b.box('green',0,2.83,bd/2+1.13,bw+1,.27,.08);b.box('green',bw/2+1,2.83,0,.08,.27,bd+1.4);
    if(!lod){b.sign('market',-bw*.10,3.85,bd/2+.15,Math.min(6,bw*.54),.78);at(b,bw/2+.19,3.75,0,PI/2,()=>b.sign('market',0,0,0,Math.min(6,bd*.63),.78));}
    lowRoof(b,bw,bd,h,r,lod);return h+4.4;
  },
  bank_branch({b,w,d,r,lod}) {
    const bw=w*.88,bd=d*.68,h=5.4,z=-d*.08;
    at(b,0,0,z,0,()=>{
      shell(b,bw,bd,h,'travertine');b.plane('glass',0,2.4,bd/2-1.02,bw-.7,4.15);
      b.box('travertine',0,4.84,bd/2-.07,bw+.2,1.13,2.4);
      const cols=clamp(Math.round(bw/3.7),3,7);for(let i=0;i<=cols;i++)b.box('travertine',-bw/2+.27+i*(bw-.54)/cols,2.45,bd/2+.47,.52,4.9,.64);
      plinth(b,bw+.35,bd+.5,.2,'travertine');door(b,0,bd/2-.93,.2,2,2.75,true,lod);
      b.box('travertine',0,h+.75,-bd*.1,bw*.54,1.5,bd*.58);parapet(b,bw*.54,bd*.58,h+1.5,'travertine',.25);
      equipment(b,bw*.52,bd*.54,h+1.55,r,lod,.8);if(!lod)b.sign('bank',0,4.91,bd/2+1.17,Math.min(5,bw*.43),.72);
    });return h+5.9;
  },
  photo_studio({b,w,d,r,lod}) {
    const bw=w*.80,bd=d*.82,h=6.2;
    shell(b,bw,bd,h,'brickRed',0,false);b.box('brickRed',0,5.35,bd/2-.1,bw,1.7,.4);
    b.plane('glass',-bw*.12,2.62,bd/2-.48,bw*.7,4.75);b.box('metal',-bw*.12,3.30,bd/2-.36,bw*.72,.14,.2);
    for(let i=0;i<4;i++)b.box('metal',-bw*.45+i*bw*.22,2.65,bd/2-.33,.1,4.9,.2);
    b.box('brickRed',bw*.36,3.1,bd/2-.07,bw*.25,6.2,.58);door(b,bw*.36,bd/2+.04,.05,1.55,2.75,true,lod);
    b.add(shed,'steel',0,h,0,bw,1.1,bd);b.plane('glassLight',-bw/2-.01,h+.54,0,bd,1.05,-PI/2);
    if(!lod)b.sign('photo',-bw*.1,5.30,bd/2+.15,Math.min(5,bw*.58),.86);
    equipment(b,bw*.68,bd*.7,h+1.1,r,lod,.7);return h+5.5;
  },
  courtyard_motel({b,w,d,r,lod}) {
    const bw=w-.8,backD=d*.28,sideD=w*.22,h=6.7;
    const wing=(ww,dd)=>{
      windowBand(b,ww,dd,.15,2,3.2,'stucco',{inset:.4,pier:.55,spacing:3.9,slab:.7,glass:'glassLight',lod});
      for(let j=0;j<2;j++){const y=.2+j*3.2;b.box('concrete',0,y,dd/2+.49,ww,.16,1.05);b.rod('metal',[-ww/2,y+1.06,dd/2+.97],[ww/2,y+1.06,dd/2+.97],.038);for(let k=0;k<Math.ceil(ww/4);k++){const x=-ww/2+2+k*4;door(b,x,dd/2-.32,y+.08,1.05,2.35,false,lod);if(!lod)b.box('metal',x,y+.58,dd/2+.97,.045,1.05,.045);}}
      parapet(b,ww,dd,h,'white',.27);equipment(b,ww,dd,h,r,lod,.7);
    };
    at(b,0,0,-d/2+backD/2+.4,0,()=>wing(bw,backD));
    at(b,-w/2+sideD/2+.4,0,d*.08,PI/2,()=>wing(d*.54,sideD));
    at(b,w/2-sideD/2-.4,0,d*.08,-PI/2,()=>wing(d*.54,sideD));
    const sw=Math.min(2.3,w*.13);stairs(b,0,d*.25,sw,3.8,18,3.4,0,'concrete',true,lod);
    b.box('concrete',0,.22,0,w*.36,.44,d*.24);b.box('blue',0,.45,0,w*.31,.025,d*.20);
    if(!lod)b.sign('leasing',0,5.6,-d*.2,Math.min(5,w*.3),.76);
    return h+4.4;
  },
  sawtooth_factory({b,w,d,r,lod}) {
    const bw=w*.94,bd=d*.9,h=5.2,n=clamp(Math.round(bw/7),3,6),bay=bw/n,rh=1.8;
    shell(b,bw,bd,h,'brickRed',0,false);b.box('brickRed',0,2.6,bd/2-.1,bw,5.2,.3);
    for(let i=0;i<n;i++){const x=-bw/2+(i+.5)*bay;b.add(shed,'steel',x,h,0,bay,rh,bd);b.plane('glassLight',x-bay/2-.012,h+rh/2,0,bd-.1,rh-.12,-PI/2);b.box('metal',x-bay/2,h+rh,0,.12,.12,bd+.16);}
    loadingDoor(b,-bw*.28,bd/2+.035,0,Math.min(5,bw*.24),3.9,lod);
    for(let i=0;i<3;i++){const x=bw*.05+i*bw*.18;b.plane('glassLight',x,3.26,bd/2+.035,bw*.14,1.4);b.box('concrete',x,2.48,bd/2+.085,bw*.15,.12,.23);}
    b.box('brickRed',bw*.38,h+2.05,-bd*.34,.95,4.2,.95);b.box('concrete',bw*.38,h+4.2,-bd*.34,1.16,.22,1.16);
    if(!lod)for(let i=0;i<2;i++){const x=-bw*.12+i*bw*.25;b.cylinder('metal',x,h+rh+1,-bd*.2,.3,.3,1.7,10);b.cylinder('metal',x,h+rh+1.92,-bd*.2,.48,.15,.18,10);}
    return h+4.4;
  },
  bus_depot({b,w,d,r,lod}) {
    const bw=w*.94,bd=d*.30,backZ=-d*.29,h=4.35;
    at(b,0,0,backZ,0,()=>{shops(b,bw,bd,h,['travel','market'],r,lod,{bay:9,key:'concrete'});equipment(b,bw,bd,h,r,lod);});
    const cd=d*.55,cz=d*.11,cy=4.65;
    b.add(barrel,'metal',0,cy,cz,bw+.1,.85,cd);
    b.box('steel',0,cy,cz-cd/2,bw,.17,.2);b.box('steel',0,cy,cz+cd/2,bw,.17,.2);
    const n=clamp(Math.floor(bw/6),2,7);for(let i=0;i<=n;i++){const x=-bw/2+.3+i*(bw-.6)/n;b.box('concrete',x,cy/2,cz+cd/2-.3,.3,cy,.3);if(!lod)b.rod('steel',[x,cy-1,cz+cd/2-.3],[x,cy,cz+cd*.25],.09);}
    b.box('sidewalk',0,.13,cz,bw,.26,cd);b.walk(0,cz,bw,cd,.26);
    for(let i=0;i<n;i++){const x=-bw/2+(i+.5)*bw/n;b.box('metal',x,.7,cz,2.8,.09,.44);for(const s of [-1,1])b.box('steel',x+s*1.05,.36,cz,.065,.7,.32);}
    return h+4.4;
  },
};

Object.assign(builders, {
  brutalist_slab({b,w,d,n,r,lod}) {
    const bw=w*.90,bd=d*.56,fh=3.6,base=3.7;
    plinth(b,bw+.4,bd+.4,.22);b.box('ribbed',0,base/2,0,bw*.78,base,bd*.65);
    b.plane('glass',0,1.8,bd*.34,bw*.77,3.1);
    const cols=clamp(Math.round(bw/5),3,9);for(let i=0;i<=cols;i++)b.box('concrete',-bw/2+i*bw/cols,base/2,bd/2-.12,.58,base,.9);
    const h=windowBand(b,bw,bd,base,n-1,fh,'concrete',{inset:.84,pier:.68,spacing:4.1,slab:1.08,ribs:true,ribKey:'ribbed',lod});
    b.box('ribbed',-bw*.37,h/2,0,bw*.18,h,bd+.52);
    door(b,bw*.13,bd*.34+.07,.22,2.2,2.9,true,lod);b.box('concrete',bw*.13,3.1,bd/2+.65,6,.22,1.8);
    parapet(b,bw,bd,h,'concrete',.58);equipment(b,bw,bd,h+.1,r,lod);if(!lod)b.sign('tower',bw*.25,base+.8,bd/2+.53,4.4,.65);
    return h+5;
  },
  brutalist_cross({b,w,d,n,r,lod}) {
    const fh=3.55,aw=w*.89,ad=d*.33,bw=w*.32,bd=d*.88,h=n*fh;
    windowBand(b,aw,ad,0,n,fh,'concrete',{inset:.68,pier:.58,spacing:3.9,slab:.89,ribs:true,lod});
    windowBand(b,bw,bd,0,n,fh,'concrete',{inset:.68,pier:.58,spacing:3.9,slab:.89,ribs:true,lod});
    b.box('ribbed',0,h/2,0,bw*.70,h+.8,ad*.70);b.box('concrete',0,h+1.4,0,bw*.8,2.8,ad*.8);
    door(b,0,bd/2-.53,.1,2.05,2.85,true,lod);b.box('concrete',0,3.1,bd/2+.35,bw*.72,.22,1.1);
    equipment(b,bw*.85,bd*.65,h+.1,r,lod,.8);return h+5;
  },
  precast_tower({b,w,d,n,r,lod}) {
    const bw=w*.73,bd=d*.75,fh=3.45;
    const h=windowBand(b,bw,bd,.25,n,fh,'travertine',{inset:.79,pier:.64,spacing:3.0,slab:1.06,sills:!lod,lod});
    b.box('ribbed',bw*.36,h/2,0,bw*.12,h,bd+.1);
    b.box('travertine',0,h+.58,0,bw+.22,1.16,bd+.22);b.box('dark',0,h+.64,bd/2+.13,bw*.82,.36,.03);
    const ew=Math.min(6,bw*.46);b.box('travertine',-bw*.16,3.17,bd/2+.52,ew,.24,1.4);door(b,-bw*.16,bd/2-.64,.12,2.0,2.8,true,lod);
    equipment(b,bw*.7,bd*.7,h+1.2,r,lod);return h+6.3;
  },
  international_tower({b,w,d,n,r,lod}) {
    const bw=w*.66,bd=d*.70,fh=3.55,h=n*fh;
    plinth(b,bw+1.2,bd+1.2,.18,'travertine');curtain(b,bw,bd,.18,n,fh,lod,'glass','metal',2.65);
    for(const sx of [-1,1])for(const sz of [-1,1])b.box('steel',sx*bw/2,h/2,sz*bd/2,.17,h,.17);
    b.box('metal',0,h+.62,0,bw*.81,1.1,bd*.79);louver(b,0,h+.6,bd*.395+.035,bw*.75,.77,lod);
    roofLetters(b,'TOWER',0,h+1.06,bd*.40,Math.min(9,bw*.73),1.35,lod);
    b.box('glassLight',0,3.18,bd/2+.85,Math.min(7,bw*.54),.075,2.0);for(const side of[-1,1])b.box('steel',side*Math.min(7,bw*.54)/2,3.16,bd/2+.85,.08,.14,2.1);b.box('steel',0,3.16,bd/2+1.88,Math.min(7,bw*.54),.14,.08);door(b,0,bd/2+.06,.18,2.35,2.85,true,lod);
    if(!lod){b.sign('tower',0,h-2.2,bd/2+.09,Math.min(6,bw*.48),.65);antenna(b,bw*.2,h+1.17,-bd*.22,0);}return h+6.1;
  },
  international_slab({b,w,d,n,r,lod}) {
    const bw=w*.93,bd=d*.43,fh=3.5,h=n*fh;
    curtain(b,bw,bd,.2,n,fh,lod,'glassLight','dark',2.4);
    b.box('concrete',-bw*.40,h/2+.1,0,bw*.13,h+.3,bd+.42);b.box('concrete',bw*.40,h/2+.1,0,bw*.06,h+.3,bd+.42);
    for(let i=0;i<=n;i+=lod?3:1)b.box('metal',0,.2+i*fh,bd/2+.13,bw,.13,.30);
    b.box('white',bw*.05,3.0,bd/2+.95,Math.min(9,bw*.43),.19,2.3);door(b,bw*.05,bd/2+.055,.2,2.5,2.7,true,lod);
    equipment(b,bw*.8,bd*.8,h+.25,r,lod,.8);return h+5.4;
  },
  black_glass_setback({b,w,d,n,r,lod}) {
    const fh=3.65,stages=[Math.max(3,Math.round(n*.44)),Math.max(2,Math.round(n*.31))];stages.push(n-stages[0]-stages[1]);
    const ws=[.92,.72,.52],ds=[.88,.70,.49];let h=.16;
    plinth(b,w*.96,d*.92,.16,'dark');
    for(let i=0;i<3;i++){const ww=w*ws[i],dd=d*ds[i];curtain(b,ww,dd,h,stages[i],fh,lod,'glass','dark',3.2);h+=stages[i]*fh;b.box('dark',0,h+.10,0,ww+.16,.2,dd+.16);if(i<2)parapet(b,ww,dd,h,'dark',.3);}
    b.box('dark',0,h+1.25,0,w*.36,2.5,d*.30);louver(b,0,h+1.25,d*.15+.035,w*.31,2,lod);
    roofLetters(b,'PEGASUS',0,h+2.9,d*.15,Math.min(11,w*.48),1.3,lod);
    door(b,0,d*.44+.05,.16,2.45,2.9,true,lod);b.box('dark',0,3.2,d*.44+.6,Math.min(8,w*.40),.15,1.4);
    fabricBanner(b,-w*.28,13.0,d*.44+.16,Math.min(4.4,w*.15));return h+4.25;
  },
  postmodern_crown({b,w,d,n,r,lod}) {
    const bw=w*.77,bd=d*.73,fh=3.6,podium=7.2;
    windowBand(b,w*.92,d*.87,.1,2,3.55,'sandstone',{inset:.55,pier:.8,spacing:5.1,slab:.95,lod});
    let h=curtain(b,bw,bd,podium,n-2,fh,lod,'glass','dark',2.7);
    for(const sx of [-1,1])for(const sz of [-1,1])b.box('sandstone',sx*(bw/2-.65),podium+(h-podium)/2,sz*(bd/2-.65),1.3,h-podium,1.3);
    b.box('sandstone',0,h+.45,0,bw+.25,.9,bd+.25);
    b.box('sandstone',0,h+1.6,0,bw*.78,2.4,bd*.73);
    b.add(gable,'sandstone',0,h+2.8,0,bw*.79,3.6,bd*.74);
    b.plane('glass',0,h+3.4,bd*.371,bw*.47,1.25);
    b.box('dark',0,h+2.9,bd*.38,bw*.56,.13,.2);
    b.box('sandstone',0,3.1,d*.435+.62,Math.min(8,w*.41),.25,1.5);door(b,0,d*.435-.43,.1,2.3,2.85,true,lod);
    if(!lod)b.sign('bank',0,5.6,d*.435+.15,Math.min(6,w*.34),.77);
    return h+6.45;
  },
  terraced_office({b,w,d,n,r,lod}) {
    const fh=3.55,f=[Math.max(3,Math.round(n*.40)),Math.max(2,Math.round(n*.34))];f.push(n-f[0]-f[1]);
    let h=.2;
    for(let i=0;i<3;i++) {
      const ww=w*[.92,.70,.47][i],dd=d*[.85,.69,.51][i],x=w*[0,.10,.20][i],z=-d*[0,.04,.09][i];
      at(b,x,0,z,0,()=>{windowBand(b,ww,dd,h,f[i],fh,'white',{inset:.48,pier:.19,spacing:4.7,slab:.82,lod});parapet(b,ww,dd,h+f[i]*fh,'white',.38);});h+=f[i]*fh;
      if(!lod&&i<2){const px=x-ww*.37;for(let q=0;q<3;q++){const pz=z-dd*.26+q*dd*.25;b.box('concrete',px,h+.24,pz,1.7,.48,2);b.sphere('foliage',px,h+.60,pz,.72,.48,.86);}}
    }
    at(b,w*.20,0,-d*.09,0,()=>equipment(b,w*.45,d*.49,h+.1,r,lod,.8));
    door(b,-w*.14,d*.425-.36,.2,2.2,2.8,true,lod);b.box('white',-w*.14,3.14,d*.425+.61,Math.min(7,w*.38),.21,1.5);
    return h+5.1;
  },
  parking_garage({b,w,d,n,lod}) {
    const bw=w*.93,bd=d*.90,fh=3.25,floors=Math.min(n,14),h=floors*fh,rw=Math.min(3.65,bw*.19),rampX=bw/2-rw/2-.22,run=Math.max(4,bd-6.1),mainW=bw-rw-.42;
    b.box('concrete',0,.1,0,bw,.2,bd);b.walk(0,0,bw,bd,.2);
    const nc=clamp(Math.round(bw/5.3),3,8);
    for(let k=0;k<=nc;k++)for(const s of [-1,1]){const x=-bw/2+.23+k*(bw-.46)/nc,z=s*(bd/2-.25);b.box('concrete',x,h/2,z,.46,h,.50);b.solid(x,z,.46,.50);}
    b.box('ribbed',-bw*.38,h/2,-bd*.25,bw*.16,h+1.0,bd*.30);b.solid(-bw*.38,-bd*.25,bw*.16,bd*.30);
    for(let f=1;f<=floors;f++){
      const y=f*fh;b.box('concrete',-rw/2-.21,y,0,mainW,.25,bd);
      for(const s of [-1,1])b.box('concrete',rampX,y,s*(bd/2-1.5),rw+.4,.25,3.0);
      for(const s of [-1,1]){
        b.box('concrete',0,y+.73,s*(bd/2-.05),bw,.58,.2);
        b.box('concrete',s*(bw/2-.04),y+.73,0,.2,.58,bd);
        if(!lod){b.box('concrete',0,y+1.27,s*(bd/2-.04),bw,.16,.15);b.box('concrete',s*(bw/2-.035),y+1.27,0,.15,.16,bd);}
      }
      if(f<floors){const sign=f%2?1:-1,ry=f*fh+fh/2,angle=-sign*Math.atan(fh/run);b.add(unitBox,'concrete',rampX,ry,0,rw,.23,Math.hypot(run,fh),0,angle);}
    }
    const rw0=Math.min(5,bw*.24);ramp(b,bw*.07,bd/2+.45,rw0,.95,0,.2,lod,true);
    b.box('concrete',0,3.03,bd/2+.035,bw,.42,.46);
    roofLetters(b,'PARKING',0,h+1.65,bd/2-.25,Math.min(11,bw*.63),1.0,lod);
    if(!lod){b.sign('parking',0,2.83,bd/2+.28,Math.min(6,bw*.40),.79);b.box('yellow',bw*.24,1.05,bd/2+.2,.22,2.1,.22);b.box('white',bw*.15,1.4,bd/2+.2,bw*.2,.09,.09);}
    return h+2.8;
  },
  office_podium({b,w,d,n,r,lod}) {
    const pw=w*.94,pd=d*.88,base=8.2,tw=w*.56,td=d*.59;
    shell(b,pw,pd,4.1,'travertine');b.plane('glassLight',0,1.8,pd/2-1.05,pw-.5,3.3);
    const cols=clamp(Math.round(pw/4.8),3,9);for(let i=0;i<=cols;i++){const x=-pw/2+.3+i*(pw-.6)/cols;b.box('travertine',x,1.98,pd/2+.04,.59,3.96,.66);if(!lod&&i<cols)b.sign(['market','bank','pharmacy','photo'][i%4],x+pw/cols/2,3.44,pd/2-.79,Math.min(3.5,pw/cols-.5),.55);}
    b.box('travertine',0,4.13,pd/2+.10,pw+.13,.36,.73);
    windowBand(b,pw,pd,4.3,1,3.9,'travertine',{inset:.47,pier:.28,spacing:4.8,slab:1.05,lod});parapet(b,pw,pd,base,'travertine',.38);
    let h=0;at(b,-w*.11,0,-d*.04,0,()=>{h=curtain(b,tw,td,base,n-2,3.6,lod,'glass','metal',2.75);b.box('concrete',-tw*.35,base+(h-base)/2,0,tw*.11,h-base,td+.30);equipment(b,tw*.8,td*.8,h+.1,r,lod);});
    door(b,w*.15,pd/2-.96,.1,2.2,2.75,true,lod);b.box('travertine',w*.15,3.13,pd/2+.66,7,.23,1.50);
    fabricBanner(b,-w*.11+tw*.22,base+8.1,-d*.04+td/2+.15,Math.min(4.1,tw*.25));
    return h+5.2;
  },
  civic_hall({b,w,d,n,r,lod}) {
    const bw=w*.88,bd=d*.52,cz=-d*.19,front=cz+bd/2,level=1.75,fh=3.65,nf=clamp(Math.round(n*.48),3,8),h=level+nf*fh;
    at(b,0,0,cz,0,()=>{
      plinth(b,bw,bd,level,'travertine');windowBand(b,bw,bd,level,nf,fh,'travertine',{inset:.93,pier:1.0,spacing:5.2,slab:1.62,lod});
      b.box('ribbed',0,h-1.2,bd/2+.27,bw,2.4,1.1);parapet(b,bw,bd,h,'travertine',.5);
      const col=clamp(Math.round(bw/4.5),4,10);for(let i=0;i<=col;i++){const x=-bw/2+.5+i*(bw-1)/col;b.box('travertine',x,level+(h-level)/2,bd/2+.15,.9,h-level,1.05);}
      equipment(b,bw*.7,bd*.6,h+.1,r,lod,.8);door(b,0,bd/2-.79,level,2.8,3.4,true,lod);
      if(!lod)b.sign('bank',0,h-1.2,bd/2+.85,Math.min(6,bw*.28),.8);
    });
    const run=Math.min(4.4,d*.23);stairs(b,0,front+.75+run/2,bw*.82,run,10,level,0,'travertine',false,lod);
    b.box('travertine',0,level/2,front+.37,bw,level,.78);b.walk(0,front+.37,bw,.78,level);
    for(const sx of [-1,1]){b.box('travertine',sx*bw*.47,.75,front+run*.5,.8,1.5,run+1.3);b.cylinder('metal',sx*bw*.47,2.35,front+.8,.055,.055,3.15,8);}
    return h+5.1;
  },
  civic_steps({b,w,d,n,r,lod}) {
    const level=1.8,baseD=d*.67,cz=-d*.10,front=cz+baseD/2,fh=3.7,nf=clamp(Math.round(n*.57),4,12),f=[2,Math.max(1,Math.round(nf*.36))];f.push(nf-f[0]-f[1]);let h=level;
    at(b,0,0,cz,0,()=>{
      plinth(b,w*.94,baseD,level,'sandstone');
      for(let i=0;i<3;i++){const ww=w*[.94,.73,.49][i],dd=baseD*[1,.78,.56][i];windowBand(b,ww,dd,h,f[i],fh,'sandstone',{inset:.73,pier:.45,spacing:5.0,slab:1.65,lod});h+=f[i]*fh;b.box('travertine',0,h+.14,0,ww+.2,.28,dd+.2);parapet(b,ww,dd,h+.27,'sandstone',.27);}
      equipment(b,w*.44,baseD*.51,h+.58,r,lod,.8);
    });
    const run=Math.min(4.6,d*.24);stairs(b,0,front+.4+run/2,w*.83,run,11,level,0,'sandstone',false,lod);
    b.box('travertine',0,level/2,front+.18,w*.90,level,.45);b.walk(0,front+.18,w*.90,.45,level);door(b,0,front-.55,level,2.7,3.2,true,lod);
    return h+5.7;
  },
  stepped_hotel({b,w,d,n,r,lod}) {
    const fh=3.35,fs=[Math.max(3,Math.round(n*.48)),Math.max(2,Math.round(n*.29))];fs.push(n-fs[0]-fs[1]);let h=.18;
    for(let i=0;i<3;i++){
      const ww=w*[.91,.69,.43][i],dd=d*[.72,.60,.46][i],x=w*[0,.075,.15][i],z=-d*[0,.035,.06][i];
      at(b,x,0,z,0,()=>{windowBand(b,ww,dd,h,fs[i],fh,'brickOchre',{inset:.5,pier:.55,spacing:3.3,slab:.92,sills:true,lod});for(let f=1;f<=fs[i];f++)b.box('travertine',0,h+f*fh,dd/2+.20,ww,.13,.52);parapet(b,ww,dd,h+fs[i]*fh,'travertine',.36);});h+=fs[i]*fh;
    }
    at(b,w*.15,0,-d*.06,0,()=>equipment(b,w*.4,d*.42,h+.1,r,lod,.8));
    const pw=Math.min(8,w*.38),pz=d*.36+1.25;b.box('travertine',0,3.35,pz,pw,.3,2.9);for(const s of [-1,1])b.box('travertine',s*(pw/2-.25),1.65,pz+1,.42,3.3,.42);
    door(b,0,d*.36-.40,.18,2.2,2.8,true,lod);if(!lod)b.sign('tower',w*.32,fh*2,d*.36+.28,2.3,1.0);
    fireEscape(b,-w*.28,d*.36+.67,Math.min(n,5),fh,lod);return h+5.1;
  },
  art_deco_tower({b,w,d,n,r,lod}) {
    const fh=3.55,podium=2,shaft=Math.max(3,Math.round((n-2)*.68)),crown=n-podium-shaft;let h=.2;
    windowBand(b,w*.9,d*.84,h,podium,fh,'sandstone',{inset:.6,pier:.8,spacing:4.6,slab:1.2,lod});h+=podium*fh;
    const bw=w*.66,bd=d*.65;
    windowBand(b,bw,bd,h,shaft,fh,'sandstone',{inset:.67,pier:.55,spacing:3.1,slab:.78,ribs:true,ribKey:'travertine',lod});h+=shaft*fh;
    b.box('travertine',0,h+.21,0,bw+.26,.42,bd+.26);
    const cw=w*.44,cd=d*.43;windowBand(b,cw,cd,h,crown,fh,'sandstone',{inset:.55,pier:.50,spacing:2.8,slab:.65,ribs:true,ribKey:'travertine',lod});h+=crown*fh;
    b.box('sandstone',0,h+.75,0,cw*.77,1.5,cd*.77);b.box('travertine',0,h+1.83,0,cw*.49,.68,cd*.49);b.box('sandstone',0,h+2.52,0,cw*.27,.75,cd*.27);
    b.rod('metal',[0,h+2.85,0],[0,h+7.0,0],.075);
    b.box('dark',0,2.6,d*.42+.025,3.3,5.2,.08);door(b,0,d*.42+.11,.2,2.25,3.1,true,lod);b.box('travertine',0,3.52,d*.42+.55,4.4,.18,1.15);
    if(!lod)b.sign('tower',0,5.5,d*.42+.12,4,.7);return h+7.1;
  },
  twin_towers({b,w,d,n,r,lod}) {
    const ph=5.1,tw=w*.32,td=d*.63,fh=3.5,xoff=w*.255;
    windowBand(b,w*.94,d*.86,.1,1,5,'travertine',{inset:.7,pier:.55,spacing:4.7,slab:1.4,lod});
    let h=0;for(const s of [-1,1])at(b,s*xoff,0,-d*.035,0,()=>{const top=curtain(b,tw,td,ph,n-(s>0?3:1),fh,lod,'glass','metal',2.5);h=Math.max(h,top);b.box('concrete',s*tw*.35,(top+ph)/2,0,tw*.12,top-ph,td+.2);equipment(b,tw*.8,td*.8,top+.1,r,lod,.72);});
    const by=ph+Math.max(3,Math.floor(n*.4))*fh,gap=2*xoff-tw;
    b.box('metal',0,by,-d*.035,gap+.1,2.9,td*.28);b.plane('glassLight',0,by,-d*.035+td*.14+.015,gap,2.57);b.box('concrete',0,by-1.50,-d*.035,gap+.3,.17,td*.30);
    door(b,0,d*.43-.57,.1,2.5,3.15,true,lod);fabricBanner(b,xoff,14,-d*.035+td/2+.16,Math.min(3.6,tw*.42));
    return h+5.1;
  },
  residential_balconies({b,w,d,n,r,lod}) {
    const bw=w*.77,bd=d*.66,fh=3.25,h=n*fh;
    windowBand(b,bw,bd,.1,n,fh,'stucco',{inset:.44,pier:.54,spacing:3.6,slab:.8,glass:'glassLight',lod});
    b.box('brickOchre',0,h/2,0,bw*.17,h+.6,bd+.28);
    for(let f=1;f<n;f++)for(const s of [-1,1]){
      const y=f*fh+.11,z=s*(bd/2+.56);
      if(lod){b.box('concrete',0,y,z,bw*.92,.13,1.12);b.box('white',0,y+.65,z+s*.5,bw*.92,.42,.08);}
      else for(const xx of [-bw*.285,bw*.285]){const ww=bw*.32;b.box('concrete',xx,y,z,ww,.15,1.22);b.plane('glassLight',xx,y+.66,z+s*.54,ww,1.0,s<0?PI:0);b.box('white',xx,y+1.17,z+s*.55,ww,.058,.058);for(const sx of [-1,1]){b.box('white',xx+sx*ww/2,y+.63,z+s*.55,.052,1.08,.052);b.box('white',xx+sx*ww/2,y+1.17,z+s*.025,.052,.052,1.05);}}
    }
    parapet(b,bw,bd,h+.1,'white',.48);equipment(b,bw*.8,bd*.8,h+.15,r,lod);door(b,0,bd/2+.19,.1,1.8,2.75,true,lod);
    if(!lod)b.sign('leasing',bw*.24,2.9,bd/2+.08,3.7,.61);return h+5.2;
  },
  point_tower({b,w,d,n,r,lod}) {
    const radius=Math.min(w,d)*.42,apothem=radius*Math.cos(PI/8),fw=radius*2*Math.sin(PI/8),fh=3.55,h=n*fh;
    b.cylinder('dark',0,h/2,0,radius*.91,radius*.91,h,16);
    for(let i=0;i<8;i++){
      const a=i*PI/4,x=Math.sin(a)*apothem,z=Math.cos(a)*apothem;
      at(b,x,0,z,a,()=>{b.plane('glass',0,h/2,0,fw,h);b.box('travertine',-fw/2,h/2,.05,.24,h,.29);b.box('travertine',fw/2,h/2,.05,.24,h,.29);for(let f=0;f<=n;f+=lod?2:1)b.box('metal',0,f*fh,.035,fw,.105,.10);if(!lod)b.box('metal',0,h/2,.04,.075,h,.10);});
    }
    b.cylinder('concrete',0,h+.25,0,radius*.96,radius*.96,.5,8);
    b.cylinder('metal',0,h+1.13,0,radius*.66,radius*.66,1.3,8);b.cylinder('dark',0,h+1.82,0,radius*.65,radius*.65,.10,8);
    b.solid(0,0,radius*1.55,radius*1.55);door(b,0,apothem+.045,.1,2.0,2.85,true,lod);b.box('travertine',0,3.2,apothem+.65,Math.min(6,radius*1.1),.22,1.5);
    if(!lod)antenna(b,0,h+1.9,0,0);return h+6.85;
  },
  rounded_exchange({b,w,d,n,r,lod}) {
    const bw=w*.85,bd=d*.74,fh=3.65,h=n*fh;
    b.add(ovalCylinder,'dark',0,h/2,0,bw*.488,h,bd*.488);
    b.add(ovalCylinder,'glass',0,h/2,0,bw/2,h,bd/2);
    for(let f=0;f<=n;f++)b.add(ovalCylinder,'concrete',0,f*fh,0,bw/2+.13,.36,bd/2+.13);
    const m=lod?12:24;for(let i=0;i<m;i++){const a=i*2*PI/m;b.box('metal',Math.sin(a)*bw/2,h/2,Math.cos(a)*bd/2,.095,h,.095);}
    b.add(ovalCylinder,'concrete',0,h+.5,0,bw*.46,1,bd*.46);b.add(ovalCylinder,'metal',0,h+1.33,0,bw*.34,.67,bd*.34);
    b.solid(0,0,bw*.84,bd*.84);door(b,0,bd/2+.045,.1,2.5,2.95,true,lod);b.add(barrel,'metal',0,3.04,bd/2+.48,Math.min(8,bw*.44),.47,1.65);
    if(!lod)b.sign('tower',0,5.25,bd/2+.05,Math.min(6,bw*.38),.8);return h+1.8;
  },
});

/** Add one deterministic building. spec dimensions describe the entire lot. */
export function addBuilding(batch, spec = {}) {
  const type=BUILDING_TYPES.includes(spec.type)?spec.type:'strip_mall';
  const w=Math.max(8,Number(spec.w)||28),d=Math.max(8,Number(spec.d)||22);
  const n=clamp(Math.round(Number(spec.floors)||12),8,30),lod=spec.lod?1:0;
  const r=random(spec.seed??1);
  // Low buildings include a conservative envelope for their seeded roof plant.
  const height=builders[type]({b:batch,w,d,n,r,lod})+(BUILDING_TYPES.indexOf(type)<18?1:0);
  return {height,type};
}
