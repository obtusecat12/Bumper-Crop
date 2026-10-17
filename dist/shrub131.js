// V131 L11 shrubs: cross-card plants replacing the old icosphere "ball" bushes everywhere in Level 11.
// Atlas assets/l11-v131s/shrubs.webp = 9 plants, each generated large on its own (art-l11v131s/s131_*.png), keyed, downsampled,
// lightly blurred + palette quantised (tools/shrub131_assets.py). One material ('sh131', alphaTest cut-out, no blending) so a
// whole city batch draws all of its shrubs in ONE merged draw call; per-plant hue/brightness tint rides a vertex attribute.
// Each plant = 2-3 vertical cards crossing at hashed angles (double-faced, up-biased normals so both faces light alike),
// hedges = side cards + a leafy top card + cross cards for depth.
import * as T from './vendor/three.module.min.js';
const A=new URL('./assets/l11-v131s/',import.meta.url).href;
// atlas cells (from shrubs.json): u0,u1,v0,v1 of the 128 px cell, fill = plant bbox share of the cell (bottom aligned, 2 px pad)
const CELL={boxwood:[0,.25,.75,1,.953,.75],euonymus:[.25,.5,.75,1,.953,.633],grass:[.5,.75,.75,1,.953,.531],hosta:[.75,1,.75,1,.953,.477],
 hydrangea:[0,.25,.5,.75,.953,.68],juniper:[.25,.5,.5,.75,.555,.969],laurel:[.5,.75,.5,.75,.953,.5],lavender:[.75,1,.5,.75,.953,.555],privet:[0,.5,.25,.5,.977,.945]};
export const SHRUB131_KINDS=Object.keys(CELL);
// real-world size hints per kind [width m, height m]
const SIZE={boxwood:[1.0,.8],euonymus:[1.0,.7],grass:[.9,.55],hosta:[.8,.4],hydrangea:[1.1,.8],juniper:[.6,1.1],laurel:[1.3,.75],lavender:[.8,.45],privet:[2,1]};
const hsh=(a,b,c=0)=>{let h=Math.imul(a|0,73856093)^Math.imul(b|0,19349663)^Math.imul(c|0,83492791)^0x5b131;h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296;};
let MAT=null;
export function addShrub131Materials(m){
 if(m.sh131)return m;
 if(!MAT){const t=new T.TextureLoader().load(A+'shrubs.webp?v=131');t.colorSpace=T.SRGBColorSpace;t.magFilter=T.NearestFilter;t.minFilter=T.LinearMipmapLinearFilter;t.anisotropy=4;
  MAT=new T.MeshStandardMaterial({map:t,alphaTest:.5,roughness:.95,metalness:0,vertexColors:true,side:T.FrontSide});MAT.name='V131 cross-card shrubs';
  MAT.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 shTint;varying vec3 vShTint;').replace('#include <begin_vertex>','#include <begin_vertex>\nvShTint=shTint;');
   s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vShTint;').replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=vShTint;');};
  MAT.customProgramCacheKey=()=>'sh131';}
 m.sh131=MAT;return m;
}
// geometry builder: quads in plant-local space, both faces, tint per plant
function G(){return{p:[],n:[],uv:[],t:[]};}
function quad(g,P,UV,N,tint){for(const i of[0,1,2,0,2,3]){g.p.push(...P[i]);g.n.push(...N);g.uv.push(...UV[i]);g.t.push(...tint);}}
function card(g,cx,cy,cz,w,h,ang,cell,tint,flip){ // vertical card centred at cx,cz, bottom at cy, facing ang
 const[u0,u1,v0,v1,fx,fy]=CELL[cell],uc=(u0+u1)/2,hu=(u1-u0)*fx/2,vb=v0+(v1-v0)*2/128,vt=vb+(v1-v0)*fy;
 const ua=flip?uc+hu:uc-hu,ub=flip?uc-hu:uc+hu,c=Math.cos(ang),s=Math.sin(ang),dx=c*w/2,dz=-s*w/2;
 const a=[cx-dx,cy,cz-dz],b=[cx+dx,cy,cz+dz],bt=[cx+dx,cy+h,cz+dz],at=[cx-dx,cy+h,cz-dz];
 const nx=s*.42,nz=c*.42,ny=.9,l=Math.hypot(nx,ny,nz);
 quad(g,[a,b,bt,at],[[ua,vb],[ub,vb],[ub,vt],[ua,vt]],[nx/l,ny/l,nz/l],tint);
 quad(g,[b,a,at,bt],[[ub,vb],[ua,vb],[ua,vt],[ub,vt]],[-nx/l,ny/l,-nz/l],tint);
}
function topCard(g,cx,cy,cz,w,d,ang,tint){ // horizontal leafy lid from the opaque middle of the privet cell
 const[u0,u1,v0,v1]=CELL.privet,ua=u0+(u1-u0)*.12,ub=u0+(u1-u0)*.88,va=v0+(v1-v0)*.25,vb=v0+(v1-v0)*.62,c=Math.cos(ang),s=Math.sin(ang);
 const P=(x,z)=>[cx+c*x+s*z,cy,cz-s*x+c*z];
 quad(g,[P(-w/2,d/2),P(w/2,d/2),P(w/2,-d/2),P(-w/2,-d/2)],[[ua,va],[ub,va],[ub,vb],[ua,vb]],[0,1,0],tint);
}
function emit(b,g,x,y,z){if(!g.p.length)return;addShrub131Materials(b.mats);const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.Float32BufferAttribute(g.p,3));geo.setAttribute('normal',new T.Float32BufferAttribute(g.n,3));geo.setAttribute('uv',new T.Float32BufferAttribute(g.uv,2));geo.setAttribute('shTint',new T.Float32BufferAttribute(g.t,3));
 b.add(geo,'sh131',x,y,z);geo.dispose();}
function tintOf(r,base=1){const k=base*(.82+.3*r),hue=(hsh(r*1e6|0,7)-.5)*.16;return[k*(1+hue*.6),k*(1+hue*.15),k*(1-hue)];}
// one plant: kind or a hashed pick from `kinds`; w = target width (m) or the kind's natural size * scale
export function shrub131(b,x,y,z,{kind,kinds,seed=0,scale=1,w,h,cards}={}){
 const r1=hsh(seed,x*31|0,z*17|0),r2=hsh(seed+3,z*29|0,x*13|0),r3=hsh(seed+9,x*7|0,z*41|0);
 const k=kind||(kinds||SHRUB131_KINDS.filter(n=>n!=='privet'))[Math.floor(r1*(kinds||SHRUB131_KINDS.filter(n=>n!=='privet')).length)];
 const[sw,shh]=SIZE[k],[,,,,fx,fy]=CELL[k],aspect=(fx*(CELL[k][1]-CELL[k][0])*4)/(fy*(CELL[k][3]-CELL[k][2])*4);
 const ww=(w||sw*scale)*(.85+.3*r2),hh=h?h*(.88+.24*r3):ww/aspect*(.9+.2*r3),n=cards||(k==='juniper'||k==='grass'?2:3),a0=r3*Math.PI,g=G(),tint=tintOf(r2);
 for(let i=0;i<n;i++)card(g,0,0,0,ww,hh,a0+i*Math.PI/n,k,tint,(i+(r1*4|0))%2===1);
 emit(b,g,x,y,z);
}
// a clipped hedge along local x from x0 to x1 at z (depth d, height h), sitting on y
export function hedge131(b,x0,x1,z,y,{d=1,h=.8,seed=0,kind='privet'}={}){
 const L=x1-x0;if(L<.3)return;const g=G(),tint=tintOf(hsh(seed,x0*7|0,z*3|0),.95);
 const seg=Math.max(.8,h*1.9),n=Math.max(1,Math.round(L/seg)),sl=L/n;
 for(let i=0;i<n;i++){const cx=x0+sl*(i+.5),r=hsh(seed+i,x0*11|0,z*5|0),jit=(r-.5)*.08,hi=h*(.94+.12*r);
  for(const sd of[-1,1])card(g,cx,0,z+sd*(d/2-.04+jit),sl*1.06,hi,0,kind,tint,(i+(sd>0?1:0))%2===1);
  card(g,cx,0,z,Math.hypot(sl,d)*.9,hi*.98,Math.atan2(d,sl)*(i%2?1:-1),kind,tint,i%2===0);   // diagonal through the body
  topCard(g,cx,hi*.92,z,sl*1.02,d*.98,0,[tint[0]*1.08,tint[1]*1.08,tint[2]*1.04]);}
 for(const[ex,sd]of[[x0+.02,-1],[x1-.02,1]])card(g,ex,0,z,d,h*.95,Math.PI/2,kind,tint,sd>0);
 emit(b,g,0,y,0);
}
// fill a planter bed (local rectangle w x d centred on x,z) with a hashed mix of plants
export function bed131(b,x,y,z,w,d,{seed=0,kinds,step=.75,scale=.8}={}){
 const nx=Math.max(1,Math.round(w/step)),nz=Math.max(1,Math.round(d/step));
 for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const r=hsh(seed+i*5,j*9+3,x*3|0);if(nx*nz>2&&r<.18)continue;
  const px=x-w/2+(i+.5)*w/nx+(hsh(seed,i,j)-.5)*w/nx*.5,pz=z-d/2+(j+.5)*d/nz+(hsh(seed+1,j,i)-.5)*d/nz*.5;
  shrub131(b,px,y,pz,{kinds,seed:seed+i*13+j*7,w:Math.min(w/nx,d/nz)*1.45*scale/.8});}
}
