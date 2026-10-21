// V140 P1c: liquor & smoke shop props in real shape (user 10-21 22:30), replacing every photo strip of retail138-bodega:
// beer-cave cases (own print / back / end / top faces, long-side or end-out, stacked), cigarette power wall (single packs
// with front / sides / lid in brand blocks over yellow price rails, brand headers), lottery dispenser (bins with LED game
// numbers and tickets hanging out of the slots), vape boxes + bare pens / pods, lathed glass pipes (beakers, bubblers,
// spoons, chillums), rolling-paper display boxes with open lids and standing booklets, a lighter tray, cigar boxes with
// open lids and banded cigars, and a detailed hookah (lathed vase, grommet, ornamented brass stem, purge valve, tray,
// clay bowl, hose with mouthpiece). Art = assets/l11-v140/bod140*.webp from bc/tools/retail140_p1c_bodega.py
// (baseColor, roughness/metal, normal); geometry via the Acc builder of retail140-fixtures.js.
import * as T from './vendor/three.module.min.js';
import {Acc} from './retail140-fixtures.js?v=140d';
import {UVB140,ASPB140} from './retail140-bodega-uv.js?v=140d';
const A=new URL('./assets/l11-v140/',import.meta.url).href,V='140d',PI=Math.PI;
function tex(name,srgb){const t=new T.TextureLoader().load(A+name+'.webp?v='+V);if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;return t;}
export function addRetail140Bodega(m){
 if(m.r138p140b)return m;
 const map=tex('bod140',true),orm=tex('bod140_r',false),nrm=tex('bod140_n',false);
 const mk=(glow,key)=>{const mat=new T.MeshStandardMaterial({map,emissive:0xffffff,emissiveMap:map,emissiveIntensity:glow,roughness:1,metalness:1,roughnessMap:orm,metalnessMap:orm,
   normalMap:nrm,normalScale:new T.Vector2(.9,.9),vertexColors:true});
  mat.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_begin>',
   'vec3 L140=normalize(vec3(-.25,.75,.62));totalEmissiveRadiance*=clamp((.5+.5*dot(normal,L140))/max(.25,.5+.5*dot(nonPerturbedNormal,L140)),.55,1.35);\n#include <lights_fragment_begin>');};
  mat.customProgramCacheKey=()=>key;return mat;};
 m.r138p140b=mk(.26,'r140b');m.r138p140bl=mk(.45,'r140bl'); // shop props / lit displays (cave, showcase, power wall)
 return m;
}
const acc=()=>new Acc(UVB140,ASPB140,addRetail140Bodega);
const rng=seed=>{let s=(seed>>>0)||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%100000)/100000;};};
const all=c=>({f:c,b:c,l:c,r:c,t:c});
/** triangle fan disc (planar uv into cell) facing +y at height y */
function disc(a,c,r,n,y,name,down=false){const rc=UVB140[name],U=(dx,dz)=>[rc[0]+(rc[2]-rc[0])*(.5+dx/(2*r)),rc[1]+(rc[3]-rc[1])*(.5+dz/(2*r))];
 for(let i=0;i<n;i++){const f0=i/n*2*PI,f1=(i+1)/n*2*PI,p0=[c[0]+Math.cos(f0)*r,y,c[2]+Math.sin(f0)*r],p1=[c[0]+Math.cos(f1)*r,y,c[2]+Math.sin(f1)*r],pc=[c[0],y,c[2]];
  const nn=[0,down?-1:1,0],q=down?[pc,p0,p1]:[pc,p1,p0];for(const p of q)a.v(p,nn,U(p[0]-c[0],p[2]-c[2]));}}
// ---------------- beer cave ----------------
const BEER={brennan:[.40,.13,.27],coldspur:[.42,.20,.27],faro:[.40,.25,.27]},BK=Object.keys(BEER);
function beerCase(a,r,k,x,y,z,ry){const[w,h,d]=BEER[k];a.push(x,y,z,ry);
 a.box(0,0,0,w,h,d,{f:a.fit(`beer_${k}_f`,w/h,.5+(r()-.5)*.08),b:a.fit(`beer_${k}_b`,w/h,r()),l:`beer_${k}_e`,r:`beer_${k}_e`,t:`beer_${k}_t`});a.pop();}
/** one wire shelf of a cave door: cases long-side or end-out, two deep, stacked to the shelf above */
export function caveShelf140(b,r,k,cx,y,w,zFront,depth,hMax){const a=acc(),[cw,ch,cd]=BEER[k],st=Math.max(1,Math.floor(hMax/(ch+.004)));
 for(let row=0;row<2&&(row+1)*(cd+.01)<=depth;row++){let x=cx-w/2+.01;const zr=zFront-cd/2-.01-row*(cd+.02);
  const lim=cx+w/2-.01;while(true){let eo=r()<.4,ww=eo?cd:cw;if(x+ww>lim){if(!eo&&x+cd<=lim){eo=true;ww=cd;}else break;}
   const n=row===0&&r()<.15?st-1:st;// a few taken from the front
   for(let s=0;s<n;s++)beerCase(a,r,k,x+ww/2+(r()-.5)*.01,y+s*(ch+.002),zr+(r()-.5)*.015,(eo?PI/2:0)+(r()-.5)*.03);
   x+=ww+.012;}}
 a.flush(b,'r138p140bl');}
export function caveFloor140(b,r,cx,w,zFront){const a=acc(),k=BK[(r()*3)|0];const[cw,,cd]=BEER[k];
 for(let i=0;i<Math.floor(w/(cw+.01));i++)beerCase(a,r,k,cx-w/2+cw/2+.01+i*(cw+.01),.08,zFront-cd/2-.03,(r()-.5)*.04);a.flush(b,'r138p140bl');}
export const BEER140=BK;
// ---------------- cigarette power wall + lottery dispenser ----------------
const CIGK=['redcrest','pall','menthe'];
/** pw wide, centred at x=0; packs face +z with their front at z=zf; rows from y0 to y1 */
export function cigWall140(b,r,pw,y0,y1,zf){const a=acc(),rows=Math.floor((y1-y0-.06)/.128),pitch=.058,cols=Math.floor((pw-.02)/pitch),x0=-cols*pitch/2;
 const blocks=[];for(let c=0;c<cols;){const n=Math.min(cols-c,5+((r()*4)|0));blocks.push([c,n,CIGK[blocks.length%3]]);c+=n;}
 for(let j=0;j<rows;j++){const yb=y0+.01+j*.128,rail='cigrail'+((j+((r()*3)|0))%6);
  a.box(0,yb-.004,zf-.05,pw,.004,.1,{t:'dark',f:'dark'});// pusher tray floor
  a.quad([[-pw/2,yb-.012,zf+.006],[pw/2,yb-.012,zf+.006],[pw/2,yb+.008,zf+.006],[-pw/2,yb+.008,zf+.006]],a.fit(rail,pw/.02,r()));
  for(const[c0,n,k]of blocks){const tall=(j%4===1)&&k!=='menthe',ph=tall?.097:.087;
   for(let c=c0;c<c0+n;c++){if(r()<.04)continue;const x=x0+(c+.5)*pitch,fz=zf-r()*.006;// pusher nose: packs not all flush
    a.box(x,yb+.008,fz-.011,.055,ph,.022,{f:`cig_${k}_f`,l:`cig_${k}_s`,r:`cig_${k}_s`,t:`cig_${k}_t`});
    a.box(x,yb+.008+ph-.012,fz-.06,.055,.012,.075,{t:`cig_${k}_t`});}}}// lids of the packs queued behind
 const yh=y0+.01+rows*.128;for(const[c0,n,k]of blocks){const xa=x0+c0*pitch,xb=xa+n*pitch;a.quad([[xa+.004,yh,zf],[xb-.004,yh,zf],[xb-.004,yh+.03,zf],[xa+.004,yh+.03,zf]],a.fit(`cighead_${k}`,(xb-xa)/.03));}
 a.flush(b,'r138p140bl');return yh+.03;}
/** scratch-off dispenser: w wide, centred at x=0, top at y, front at z */
export function lottoDisp140(b,r,w,y,z){const a=acc(),bw=.085,n=Math.max(2,Math.floor((w-.02)/bw)),W=n*bw+.02,H=.3,D=.16;
 a.box(0,y-H,z-D/2,W,H,D,{f:'acryl',b:'acryl',l:'acryl',r:'acryl',t:'acryl'});
 for(let i=0;i<n;i++){const x=-W/2+.01+(i+.5)*bw,t=(i*7+((r()*3)|0))%3?'lotto_7s':'lotto_gold',tw=t==='lotto_7s'?.056:.067,th=.1,l='lbin'+((i+((r()*6)|0))%6);
  a.quad([[x-.034,y-.05,z+.002],[x+.034,y-.05,z+.002],[x+.034,y-.023,z+.002],[x-.034,y-.023,z+.002]],a.fit(l,.068/.027));// LED game no. + price
  a.box(x,y-.27,z,.07,.012,.03,{f:'dark',t:'dark'});// slot lip
  const hang=.04+r()*.07,tl=.18;// tickets fanning out of the slot, a fold at each perforation
  for(let s=0;s<2;s++){const zz=z+.016+s*.004,yt=y-.27+.006-s*.003,len=s?hang*.5:hang;const c=Math.cos(tl),sn=Math.sin(tl);
   const P=(u,v)=>[x+u,yt-v*c,zz+v*sn];a.dquad([P(-tw/2,len),P(tw/2,len),P(tw/2,len-th),P(-tw/2,len-th)].map(p=>p),[UVB140[t][0],UVB140[t][1],UVB140[t][2],UVB140[t][3]]);}
  a.quad([[x-.035,y-.26,z+.001],[x+.035,y-.26,z+.001],[x+.035,y-.06,z+.001],[x-.035,y-.06,z+.001]],a.fit('acryl',.07/.2));}
 a.flush(b,'r138p140bl');}
// ---------------- vapes ----------------
const VK=['nublr','vapora'],VD=['vpink','vteal','vblack','vgold'];
/** boxes standing in rows on a shelf (x0..x1, front at zf, depth), a row of bare devices on a riser in front */
export function vapeShelf140(b,r,x0,x1,y,zf,depth){const a=acc();
 const nx=Math.floor((x1-x0-.12)/.05);for(let row=0;row<3;row++){const z=zf-.09-row*.05;
  for(let i=0;i<nx;i++){if(r()<.08)continue;const k=VK[((i/4)|0)%2],x=x0+.1+(i+.5)*.05;a.push(x,y+row*.03,z,(r()-.5)*.06);
   a.box(0,0,0,.045,.11,.026,{f:`vape_${k}_f`,l:`vape_${k}_s`,r:`vape_${k}_s`,t:`vape_${k}_t`,b:`vape_${k}_s`});a.pop();}
  a.box((x0+x1)/2,y,z-.013,x1-x0-.06,row*.03,.05,{f:'acryl',t:'acryl'});}// stepped riser
 for(let i=0;i<Math.floor((x1-x0-.1)/.07);i++){const x=x0+.08+i*.07,c=VD[(i+((r()*2)|0))%4],z=zf-.035;
  if(i%3===2){a.push(x,y,z,(r()-.5)*.4);a.box(0,0,0,.03,.07,.018,all(c));a.box(0,.07,0,.014,.016,.01,all('vblack'));a.pop();}// pod
  else{const ang=(r()-.5)*.3,dx=Math.cos(ang)*.055,dz=Math.sin(ang)*.055;a.tube([x-dx,y+.008,z-dz],[x+dx,y+.008,z+dz],.008,8,c);a.tube([x+dx,y+.008,z+dz],[x+dx*1.25,y+.008,z+dz*1.25],.005,6,'vblack');}}
 a.flush(b,'r138p140bl');}
// ---------------- glass pipes (lathed, coloured glass mats of retail138) ----------------
const GL=['r138blueG','r138greenG','r138purpleG','r138clearG','r138amberG'];
const lat=(pts,n=10)=>new T.LatheGeometry(pts.map(([x,y])=>new T.Vector2(x,y)),n);
export function pipes140(b,r,x0,x1,y,zc){let x=x0+.08;
 while(x<x1-.08){const g=GL[(r()*GL.length)|0],k=r();
  if(k<.35){// beaker
   const h=.22+r()*.1;b.add(lat([[0,0],[.055,0],[.06,.008],[.03,.09],[.018,.11],[.018,h],[.024,h+.01]]),g,x,y,zc);
   b.add(lat([[0,0],[.006,0],[.006,.13],[0,.13]],6),'r138clearG',x+.012,y+.03,zc+.012,1,1,1,0,-.75);// downstem
   b.add(lat([[0,0],[.01,0],[.018,.022],[.012,.026]],8),g,x+.012+.0,y+.13,zc+.09,1,1,1,0,0);x+=.15;}
  else if(k<.6){// bubbler
   b.add(lat([[0,0],[.035,0],[.04,.03],[.028,.06],[.012,.07],[.012,.14],[.016,.15]]),g,x,y,zc);
   b.add(lat([[0,0],[.008,0],[.008,.07],[.0,.07]],6),g,x+.03,y+.04,zc,1,1,1,0,0,-.9);x+=.12;}
  else if(k<.88){// spoon pipe lying on a little stand
   b.box('r138dark',x,y+.006,zc,.04,.012,.03);
   b.add(lat([[0,0],[.008,0],[.012,.04],[.02,.07],[.022,.09],[.018,.11],[.008,.12]],8),g,x-.05,y+.02,zc,1,1,1,0,0,-PI/2);x+=.15;}
  else{b.add(lat([[0,0],[.006,0],[.01,.08],[.014,.1],[.012,.105]],8),g,x,y+.012,zc+(r()-.5)*.1,1,1,1,0,0,-PI/2+.1);x+=.1;}// chillum
 }}
// ---------------- rolling papers + lighters (counter top) ----------------
export function papers140(b,r,x,y,z){const a=acc();a.push(x,y,z,0);
 ['zagra','rawleaf'].forEach((k,i)=>{const bx=-.2+i*.25,w=.22,d=.15,h=.05;a.push(bx,0,0,0);
  a.box(0,0,0,w,.006,d,{t:'white'});a.box(0,0,d/2-.003,w,h,.006,{f:`pap_${k}_bx`,b:'white',t:'white'});a.box(0,0,-d/2+.003,w,h,.006,{b:'white',f:'white',t:'white'});
  for(const s of[-1,1])a.box(s*(w/2-.003),0,0,.006,h,d,{l:'white',r:'white',t:'white'});
  const th=1.95,c=Math.cos(th),sn=Math.sin(th),P=(u,v)=>[u,h+v*sn,-d/2+v*c];// lid hinged at the back, opened past vertical
  a.quad([P(-w/2,0),P(w/2,0),P(w/2,d),P(-w/2,d)],a.fit(`pap_${k}_lid`,w/d));a.quad([P(w/2,0),P(-w/2,0),P(-w/2,d),P(w/2,d)],UVB140.white);
  for(let row=0;row<4;row++)for(let col=0;col<2;col++){if(r()<.12)continue;const zz=-d/2+.025+row*.034,xx=-.052+col*.104,tl=-.25;
   a.push(xx,.006,zz,0);const C=Math.cos(tl),S=Math.sin(tl),R=(px,py,pz)=>[px,py*C-pz*S,py*S+pz*C];
   const f=[R(-.035,0,.003),R(.035,0,.003),R(.035,.045,.003),R(-.035,.045,.003)],tp=[R(-.035,.045,.003),R(.035,.045,.003),R(.035,.045,-.003),R(-.035,.045,-.003)];
   a.quad(f,a.fit(`pap_${k}_f`,.07/.045));a.quad(tp,a.fit('pap_edge',.07/.006));a.pop();}
  a.pop();});
 // lighter tray: lighters standing in a grid
 a.push(.32,0,0,0);a.box(0,0,0,.16,.03,.12,{f:'acryl',b:'acryl',l:'acryl',r:'acryl',t:'acryl'});
 for(let i=0;i<5;i++)for(let j=0;j<4;j++){const lx=-.06+i*.03,lz=-.042+j*.028,c='lt'+((i+j*2+((r()*2)|0))%6);
  a.box(lx,.03,lz,.024,.06,.012,all(c));a.box(lx,.09,lz,.024,.011,.012,all('steel'));a.tube([lx-.006,.098,lz],[lx+.002,.098,lz],.004,6,'dark');}
 a.pop();a.pop();a.flush(b,'r138p140b');}
// ---------------- cigar boxes (humidor shelves) ----------------
const CGK=['paloma','esteban'];
function cigarBox(a,r,k,x,y,z,open){const w=.22,h=.055,d=.15,s=`cgr_${k}_s`,wood=k==='esteban'?'mahog':'cedar';a.push(x,y,z,(r()-.5)*.05);
 if(!open)a.box(0,0,0,w,h,d,{f:s,b:s,l:wood,r:wood,t:`cgr_${k}_lid`});
 else{a.box(0,0,0,w,.008,d,{t:'cedar'});a.box(0,0,d/2-.004,w,h-.012,.008,{f:s,b:'cedar',t:wood});a.box(0,0,-d/2+.004,w,h,.008,{b:s,f:'cedar',t:wood});
  for(const sd of[-1,1])a.box(sd*(w/2-.004),0,0,.008,h-.006,d,{l:wood,r:wood,t:wood});
  const th=1.85,c=Math.cos(th),sn=Math.sin(th),P=(u,v)=>[u,h+v*sn,-d/2+v*c];
  a.quad([P(-w/2,0),P(w/2,0),P(w/2,d),P(-w/2,d)],a.fit(`cgr_${k}_in`,w/d));a.quad([P(w/2,0),P(-w/2,0),P(-w/2,d),P(w/2,d)],a.fit(`cgr_${k}_lid`,w/d));
  const band='cband'+(k==='paloma'?0:(r()<.5?1:2)),n=10,rr=.0095;
  for(let i=0;i<n;i++){if(r()<.1)continue;const cx=-w/2+.016+i*(w-.032)/(n-1),cy=.008+rr+.002,z0=-d/2+.012,z1=d/2-.012;
   a.tube([cx,cy,z0],[cx,cy,z1-.004],rr,8,'tobacco');a.tube([cx,cy,z1-.045],[cx,cy,z1-.03],rr+.0006,8,band);
   a.rev([cx,cy,z1-.004],[0,0,1],[[rr,0],[rr*.7,.003],[0,.004]],8,'tobaccod');}}
 a.pop();}
export function cigarShelves140(b,r,w,ys,z){const a=acc();
 ys.forEach((y,li)=>{const n=Math.floor((w-.02)/.235);for(let i=0;i<n;i++){const k=CGK[(i+li)%2],x=-w/2+.01+(i+.5)*(w-.02)/n,st=1+((r()*2.2)|0);
  for(let s=0;s<st;s++)cigarBox(a,r,k,x,y+s*.057,z,s===st-1&&r()<.45);}});
 a.flush(b,'r138p140b');}
// ---------------- hookah ----------------
export function hookah140(b,r,x,y,z,s=1){const g=GL[(r()*4)|0],a=acc(),S=v=>v*s;
 b.add(lat([[0,0],[.07,.0],[.085,.01],[.105,.05],[.108,.09],[.095,.14],[.06,.18],[.035,.2],[.028,.22],[.032,.225]].map(([p,q])=>[S(p),S(q)]),14),g,x,y,z);
 const c=[x,y,z],up=[0,1,0],P=h=>[x,y+S(h),z];
 a.rev(P(.215),up,[[S(.026),0],[S(.034),S(.006)],[S(.034),S(.02)],[S(.02),S(.026)]],10,'rubber');// grommet
 a.rev(P(.24),up,[[S(.013),0],[S(.02),S(.02)],[S(.013),S(.04)],[S(.016),S(.08)],[S(.026),S(.1)],[S(.016),S(.12)],[S(.013),S(.2)],[S(.022),S(.21)],[S(.013),S(.23)],[S(.012),S(.262)]],10,'brass');// ornamented stem
 a.rev(P(.46),up,[[0,0],[S(.07),S(.004)],[S(.082),S(.014)],[S(.072),S(.018)],[0,S(.018)]],14,'steel');disc(a,c,S(.07),14,y+S(.478),'tray');// tray
 a.rev(P(.478),up,[[S(.012),0],[S(.016),S(.018)],[S(.03),S(.035)],[S(.046),S(.06)],[S(.04),S(.065)]],10,'clay');disc(a,c,S(.04),10,y+S(.543),'clay');// clay bowl
 // purge valve + hose port, hose drooping to the counter and back up to a brass mouthpiece
 a.tube(P(.3),[x+S(.05),y+S(.29),z],S(.007),6,'brass');a.rev([x+S(.05),y+S(.29),z],[1,0,0],[[S(.012),0],[S(.014),S(.012)],[0,S(.014)]],8,'brass');
 const p0=[x-S(.015),y+S(.32),z],pts=[p0];for(let i=1;i<=10;i++){const t=i/10;pts.push([x-S(.04)-t*S(.22),y+S(.32)-Math.sin(t*PI*.9)*S(.3)+t*S(.05),z+t*S(.08)]);}
 a.line(pts,S(.008),6,'hose');const e=pts.at(-1);a.tube(e,[e[0]-S(.1),e[1]+S(.02),e[2]+S(.015)],S(.007),8,'brass');
 a.flush(b,'r138p140b');}
