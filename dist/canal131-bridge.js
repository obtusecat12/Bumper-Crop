// V131 L11 hero footbridge rebuild (canal photo reach, city x 149): granite-sett deck + concrete kerbs (own generated textures
// with normal maps, tools/shrub131_assets.py), symmetric stairs on BOTH sides at both ends (the west side used to be a dead end),
// end railings so nobody walks off the deck ends, sloped stair handrails, walk planes + colliders kept in sync.
// Also exports the placement-exclusion helpers canal130-life / canal128 use so promenade props, boats and pontoons never
// overlap the bridges, stairs, lock gates or each other (also on the infinite hashed canal blocks).
import * as T from './vendor/three.module.min.js';
const A=new URL('./assets/l11-v131s/',import.meta.url).href;
function tex(n,srgb=true){const t=new T.TextureLoader().load(A+n+'.webp?v=131');if(srgb)t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;return t;}
export function addBridge131Materials(m){
 if(m.k131Deck)return m;
 m.k131Deck=new T.MeshStandardMaterial({map:tex('deck'),normalMap:tex('deck-n',false),normalScale:new T.Vector2(.9,.9),roughness:.88,vertexColors:true});
 m.k131Curb=new T.MeshStandardMaterial({map:tex('curb'),normalMap:tex('curb-n',false),normalScale:new T.Vector2(.7,.7),roughness:.9,vertexColors:true});
 return m;
}
// box with metric UVs: sides use [tw along the long axis, th up], the top uses [tw, tw*aspect]
function mbox(b,key,x0,x1,y0,y1,z0,z1,tw,th,topTh=th){
 const g=new T.BufferGeometry(),p=[],n=[],uv=[];
 const q=(a,bq,c,d,nn,u0,u1,v0,v1)=>{for(const[v,uu,vv]of[[a,u0,v0],[bq,u1,v0],[c,u1,v1],[a,u0,v0],[c,u1,v1],[d,u0,v1]]){p.push(...v);n.push(...nn);uv.push(uu,vv);}};
 const alongX=(x1-x0)>=(z1-z0);
 q([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,1],x0/tw,x1/tw,y0/th,y1/th);
 q([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[0,0,-1],-x1/tw,-x0/tw,y0/th,y1/th);
 q([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[1,0,0],-z1/tw,-z0/tw,y0/th,y1/th);
 q([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[-1,0,0],z0/tw,z1/tw,y0/th,y1/th);
 {const P=[[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0]],U=P.map(v=>alongX?[v[0]/tw,v[2]/topTh]:[v[2]/tw,v[0]/topTh]);for(const i of[0,1,2,0,2,3]){p.push(...P[i]);n.push(0,1,0);uv.push(...U[i]);}}
 g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 b.add(g,key,0,0,0);g.dispose();
}
// footbridge spanning local z0..z1 at local x, deck top d, street top `top`; rail(b,x0,x1,z,y,lod,face) / railZ(b,x,z0,z1,y,lod) from canal128
export function footbridge131(b,{x,d,z0,z1,top,WY,lod,railZ,railX,piers}){
 addBridge131Materials(b.mats);
 const hw=1.75,zc=(z0+z1)/2,L=z1-z0,run=4.2,sw=1.7,n=14;
 // green plate girders under both deck edges (as before), deck slab with sett paving, kerbs on both edges + across the ends
 for(const xs of[x-hw,x+hw])b.box('k128Bridge',xs,d-.6,zc,.18,1.0,L);
 mbox(b,'k131Deck',x-hw+.02,x+hw-.02,d-.22,d,z0,z1,3.3,1.8);
 for(const s of[-1,1])mbox(b,'k131Curb',x+s*(hw-.1)-.1,x+s*(hw-.1)+.1,d-.22,d+.12,z0,z1,1.6,.42,1.6);
 // stair landings: the stairs leave the deck sideways at both ends, so the end kerb only covers the middle
 for(const ze of[z0,z1]){const s=ze===z0?1:-1;mbox(b,'k131Curb',x-hw+.02,x+hw-.02,d-.22,d+.12,ze===z0?z0:z1-.2,ze===z0?z0+.2:z1,1.6,.42,1.6);}
 b.walk(x,zc,2*hw,L,d);
 // side railings with openings where the stairs join (z0..z0+sw+.15 and z1-sw-.15..z1), end railings across the deck
 for(const s of[-1,1])railZ(b,x+s*(hw-.05),z0+sw+.2,z1-sw-.2,d+.12,lod);
 railX(b,x-hw,x+hw,z0+.1,d+.12,lod,-1);railX(b,x-hw,x+hw,z1-.1,d+.12,lod,1);
 // stairs: 14 risers (2 m) down to the promenade on both sides, at both ends, inside the promenade (clear of the canal railing)
 for(const zsC of[z0+.12+sw/2,z1-.12-sw/2])for(const s of[-1,1]){
  for(let k=0;k<n;k++){const h=d-(d-top)*(k)/n,xc=x+s*(hw+run*(k+.5)/n);b.box('k128Steps',xc,(top+h)/2-.01,zsC,run/n+.004,h-top+.02,sw);}
  b.walk(x+s*(hw+run/2),zsC,run,sw,top+(d-top)/2,-s*(d-top)/run,0);
  // stringers (kerb-textured) + sloped handrails on both sides of each stair
  for(const e of[-1,1]){const ze=zsC+e*(sw/2+.06),xa=x+s*hw,xb=x+s*(hw+run);
   for(let k=0;k<n;k++){const h=d-(d-top)*k/n,xc=x+s*(hw+run*(k+.5)/n);b.box('k131Curb',xc,(top+h)/2+.05,ze,run/n+.01,h-top+.12,.12);}
   b.rod('k128Rail',[xa,d+1.1,ze],[xb,top+1.0,ze],.03);b.rod('k128Rail',[xa,d+.55,ze],[xb,top+.5,ze],.018);
   for(let k=0;k<=3;k++){const t=k/3,xx=xa+(xb-xa)*t,yy=d+(top-d)*t;b.rod('k128Rail',[xx,yy,ze],[xx,yy+1.1-.1*t,ze],.028);}
   b.solid((xa+xb)/2,ze,run,.14);}
 }
 // piers standing on the canal bed against the embankment walls
 for(const z of piers||[])b.box('k128Conc',x,(WY+d-.22)/2,z,1.2,d-.22-WY,1.2);
}
// ---------------------------------------------------------------- placement exclusion (block-local x,z)
// footprint list of fixed structures on a canal block, used to drop/shift props, boats and pontoons that would overlap them
export function canalKeepOut131(cn,C,B=112,heroBridgeX=null){
 const R=[];const lw=cn.portalW?30:0,le=cn.portalE?B-30:B;
 if(!cn.noRoadW)R.push([-1,13.5,C.p0-1,C.p1+1,'road']);if(!cn.noRoadE)R.push([B-13.5,B+1,C.p0-1,C.p1+1,'road']);
 if(cn.portalW)R.push([lw-3.5,lw+3.5,C.z0-1,C.z1+1,'lock']);if(cn.portalE)R.push([le-3.5,le+3.5,C.z0-1,C.z1+1,'lock']);
 if(heroBridgeX!=null){const x=heroBridgeX;R.push([x-6.6,x+6.6,C.p0+1.5,C.z0+.5,'stairs'],[x-6.6,x+6.6,C.z1-.5,C.p1-1.5,'stairs'],[x-2.6,x+2.6,C.z0-1,C.z1+1,'bridge']);}
 return R;
}
export function hits131(R,x0,x1,z0,z1,pad=.3){for(const r of R)if(x1+pad>r[0]&&x0-pad<r[1]&&z1+pad>r[2]&&z0-pad<r[3])return r;return null;}
