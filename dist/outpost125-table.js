// V125b-L10: M.E.G. lakeshore outpost reference table (files/l10-outpost-table-ref.png), replacing the V98 plank table.
// Rough weathered dark-red crate table; silver boombox (handle + telescopic antenna), red vanilla cola can, two blue/white
// light-beer cans, teal cigarette pack, white milk-glass ashtray with butts and a lit cigarette (thin rising smoke wisp),
// brass flip-top lighter. Brands are fictional (Cola-Kala, BRUDD LITE, PALE MOLL, SONAVOX).
// Low poly; every face / item has its own generated image (art-v125/v125_*.png, each generated large alone) packed by
// tools/v125_assets.py into assets/v125-props/table.webp (low-fi: downscaled + quantized, nearest filtering).
// All atlas meshes share ONE material, so the outpost batcher merges them into a single draw call.
import * as T from './vendor/three.module.min.js';
import {TABLE125 as A} from './outpost125-atlas.js?v=125b';
const TOP_Y=.776;
let atlasTex=null;
function atlas(){if(atlasTex)return atlasTex;atlasTex=new T.TextureLoader().load(new URL('./assets/v125-props/table.webp?v=125b',import.meta.url).href);atlasTex.colorSpace=T.SRGBColorSpace;atlasTex.magFilter=T.NearestFilter;atlasTex.minFilter=T.LinearFilter;atlasTex.generateMipmaps=false;return atlasTex;}
// sub-rect of an atlas rect (fractions in the rect's own 0..1 space, v from bottom)
const sub=(r,a,b,c,d)=>[r[0]+(r[2]-r[0])*a,r[1]+(r[3]-r[1])*b,r[0]+(r[2]-r[0])*c,r[1]+(r[3]-r[1])*d];
function rnd(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function createOutpostTable125(root,p,groundLocal,excluded){
 const R=rnd(12599),g=new T.Group();g.name='V125b lakeshore crate table / reference inventory';g.position.fromArray(p);root.add(g);
 const M=new T.MeshStandardMaterial({name:'V125b table atlas',map:atlas(),roughness:.86,metalness:0});
 const chrome=new T.MeshStandardMaterial({name:'V125b chrome',color:0xd2d5d8,roughness:.4,metalness:.35});
 const canTop=new T.MeshStandardMaterial({name:'V125b can top',color:0xb9bcbf,roughness:.36,metalness:.75});
 const dark=new T.MeshStandardMaterial({name:'V125b dark',color:0x1e1d1c,roughness:.9});
 const milk=new T.MeshStandardMaterial({name:'V125b milk glass',color:0xeeede6,roughness:.18,metalness:0});
 const paper=new T.MeshLambertMaterial({color:0xe9e6dc}),filter=new T.MeshLambertMaterial({color:0xc58a4f}),ash=new T.MeshLambertMaterial({color:0x6e6b66});
 function mesh(parent,geo,mat,pos=[0,0,0],rot=null){const o=new T.Mesh(geo,mat);o.position.fromArray(pos);if(rot)o.rotation.set(...rot);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 // box with one atlas rect per face; rot:{face:true} turns that face's image 90 degrees
 function abox(parent,w,h,d,faces,pos,rot=null,turn={}){
  const geo=new T.BoxGeometry(w,h,d),uv=geo.attributes.uv,keys=['px','nx','py','ny','pz','nz'];
  for(let f=0;f<6;f++){const r=faces[keys[f]]||faces.def;for(let k=f*4;k<f*4+4;k++){let u=uv.getX(k),v=uv.getY(k);if(turn[keys[f]])[u,v]=[1-v,u];uv.setXY(k,r[0]+(r[2]-r[0])*u,r[1]+(r[3]-r[1])*v);}}
  return mesh(parent,geo,M,pos,rot);
 }
 // ---- crate table: body sunk to the lowest ground under it, battens, five uneven top planks ----
 const W=.98,D=.76,TH=.04,bodyTop=TOP_Y-TH;let lo=0;for(const x of[-W/2,W/2])for(const z of[-D/2,D/2])lo=Math.min(lo,groundLocal(p[0]+x,p[2]+z));
 const by=lo-.06,bh=bodyTop-by;
 abox(g,W,bh,D,{pz:A.crateFront,nz:A.crateBack,px:A.crateRight,nx:A.crateLeft,py:sub(A.crateTop,0,0,1,.2),ny:A.crateBack},[0,by+bh/2,0]);
 for(const sx of[-1,1])for(const sz of[-1,1]){const r=sx*sz>0?sub(A.crateFront,0,0,.09,1):sub(A.crateLeft,.9,0,1,1);abox(g,.055,bh+.01,.055,{def:r},[sx*(W/2-.012),by+bh/2,sz*(D/2-.012)]);}
 for(const sz of[-1,1])abox(g,W+.01,.07,.03,{def:sub(sz>0?A.crateFront:A.crateBack,0,.82,1,1)},[0,bodyTop-.04,sz*(D/2+.008)]);
 const PL=5,pw=(D+.05)/PL;
 for(let k=0;k<PL;k++){const len=1.04-(k===0?.035:0)-(k===3?.02:0),z=-((D+.05)/2)+pw*(k+.5),dy=(R()-.5)*.006,dx=(R()-.5)*.02;
  const strip=sub(A.crateTop,0,1-(k+1)/PL,len/1.04,1-k/PL),edge=sub(A.crateFront,0,.1+k*.15,1,.16+k*.15);
  abox(g,len,TH,pw-.009,{py:strip,ny:strip,def:edge},[dx,bodyTop+TH/2+dy,z],[(R()-.5)*.012,0,(R()-.5)*.008]);}
 // ---- SONAVOX boombox (far side), handle + telescopic antenna ----
 const bb=new T.Group();bb.name='V125b silver boombox';bb.position.set(-.04,TOP_Y,-.2);bb.rotation.y=.03;g.add(bb);
 const BW=.5,BH=.232,BD=.12;
 abox(bb,BW,BH,BD,{pz:A.boomFront,nz:A.boomBack,py:A.boomTop,ny:sub(A.boomBack,.1,.1,.9,.3),px:A.boomR,nx:A.boomL},[0,BH/2+.004,0]);
 for(const s of[-1,1]){mesh(bb,new T.CylinderGeometry(.006,.008,.05,6),chrome,[s*.2,BH+.027,-.012]);mesh(bb,new T.BoxGeometry(.026,.01,.026),dark,[s*.2,BH+.004,-.012]);}
 mesh(bb,new T.CylinderGeometry(.007,.007,.4,6),chrome,[0,BH+.052,-.012],[0,0,Math.PI/2]);
 for(const s of[-1,1])mesh(bb,new T.SphereGeometry(.009,6,4),chrome,[s*.2,BH+.052,-.012]);
 {const base=new T.Vector3(-.235,BH+.01,-.045),dir=new T.Vector3(-.5,.85,-.12).normalize();let at=base.clone();
  mesh(bb,new T.SphereGeometry(.011,6,4),chrome,at.toArray());
  for(const [len,r]of[[.2,.0055],[.2,.0045],[.19,.0035]]){const end=at.clone().addScaledVector(dir,len),mid=at.clone().add(end).multiplyScalar(.5);const o=mesh(bb,new T.CylinderGeometry(r,r,len,6),chrome,mid.toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir);at=end;}
  mesh(bb,new T.SphereGeometry(.0065,6,4),chrome,at.toArray());}
 // ---- cans: label wrap + metal top with rim, mouth and tab ----
 function can(rect,x,z,h=.123,ry=0,tilt=0){const c=new T.Group();c.position.set(x,TOP_Y,z);c.rotation.set(tilt,ry,0);g.add(c);const r=.033;
  const side=new T.CylinderGeometry(r,r,h-.02,14,1,true),uv=side.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,rect[0]+(rect[2]-rect[0])*uv.getX(k),rect[1]+(rect[3]-rect[1])*uv.getY(k));
  mesh(c,side,M,[0,h/2,0]);
  mesh(c,new T.LatheGeometry([[0,0],[r*.84,0],[r,.009]].map(v=>new T.Vector2(...v)),14),canTop,[0,0,0]);
  mesh(c,new T.LatheGeometry([[r,h-.011],[r*.86,h-.002],[r*.88,h],[r*.84,h+.001],[r*.82,h-.003],[0,h-.003]].map(v=>new T.Vector2(...v)),14),canTop,[0,0,0]);
  mesh(c,new T.CircleGeometry(.008,6),dark,[0,h-.0025,.012],[-Math.PI/2,0,0]).scale.y=1.4;
  mesh(c,new T.BoxGeometry(.012,.002,.022),canTop,[0,h-.001,-.004]);return c;}
 can(A.canVanilla,-.37,.11,.123,2.2);
 can(A.beerA,.36,-.27,.123,-2.6);can(A.beerB,.405,-.06,.123,.9);
 // ---- PALE MOLL pack, lying flat, six different faces ----
 abox(g,.058,.022,.088,{py:A.packFront,ny:A.packBack,pz:A.packBottom,nz:A.packTop,px:A.packSide,nx:A.packSide2},[-.15,TOP_Y+.011,.25],[0,-.14,0],{px:true,nx:true});
 // ---- brass flip-top lighter, standing ----
 abox(g,.038,.058,.013,{pz:A.lighter,nz:A.lighterBack,def:sub(A.lighter,0,0,.12,1),py:sub(A.lighter,0,.92,1,1),ny:sub(A.lighter,0,0,1,.08)},[.30,TOP_Y+.029,.09],[0,-.35,0]);
 // ---- white milk-glass ashtray, ash, butts, lit cigarette + smoke ----
 const at=new T.Group();at.position.set(.15,TOP_Y,.25);at.rotation.y=.4;g.add(at);
 mesh(at,new T.LatheGeometry([[0,0],[.058,0],[.068,.006],[.072,.024],[.064,.027],[.058,.012],[0,.012]].map(v=>new T.Vector2(...v)),16),milk);
 const floorUV=new T.CircleGeometry(.056,12),fu=floorUV.attributes.uv;for(let k=0;k<fu.count;k++)fu.setXY(k,A.ash[0]+(A.ash[2]-A.ash[0])*fu.getX(k),A.ash[1]+(A.ash[3]-A.ash[1])*fu.getY(k));
 mesh(at,floorUV,M,[0,.0125,0],[-Math.PI/2,0,0]);
 function cig(parent,len,lit,pos,rot){const c=new T.Group();c.position.fromArray(pos);c.rotation.set(...rot);parent.add(c);
  mesh(c,new T.CylinderGeometry(.0039,.0039,len,6),paper,[0,len/2+.022,0]);mesh(c,new T.CylinderGeometry(.004,.004,.022,6),filter,[0,.011,0]);
  if(lit){mesh(c,new T.CylinderGeometry(.0037,.0039,.008,6),ash,[0,len+.026,0]);const ember=mesh(c,new T.CylinderGeometry(.0034,.0037,.003,6),new T.MeshBasicMaterial({color:0xff5418}),[0,len+.0215,0]);c.userData.ember=ember;}
  return c;}
 cig(at,.012,false,[-.02,.016,.01],[Math.PI/2,0,.9]);cig(at,.008,false,[.015,.016,-.018],[Math.PI/2-.2,0,2.4]);cig(at,.016,false,[.006,.017,.024],[Math.PI/2+.1,0,-.5]);
 // lit cigarette resting in the front notch, burning end pointing out over the table
 const lit=cig(at,.052,true,[Math.sin(.3)*.05,.027,Math.cos(.3)*.05],[Math.PI/2-.08,0,0]);lit.rotation.order='YXZ';lit.rotation.y=.3;
 lit.updateMatrixWorld(true);const tip=new T.Vector3(0,.052+.03,0);lit.localToWorld(tip);g.worldToLocal(tip);
 const smokeU={time:{value:0}};
 const smokeMat=new T.ShaderMaterial({name:'V125b cigarette smoke wisp',transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:smokeU,
  vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`varying vec2 v;uniform float time;void main(){float y=v.y;float c=.5+.16*y*sin(y*8.-time*1.5)+.07*y*y*sin(y*19.+time*.8)+.03*sin(y*3.+time*.4);
  float w=.012+.075*y*y;float a=exp(-pow((v.x-c)/w,2.))*smoothstep(0.,.04,y)*pow(1.-y,1.6);a*=.75+.25*sin(y*30.-time*3.);gl_FragColor=vec4(.80,.82,.84,a*.5);}`});
 const smoke=new T.Group();smoke.name='V125b smoke wisp';smoke.position.copy(tip);g.add(smoke);
 for(const ry of[0,Math.PI/2]){const s=new T.Mesh(new T.PlaneGeometry(.16,.42),smokeMat);s.position.y=.21;s.rotation.y=ry;s.renderOrder=3;smoke.add(s);
  s.onBeforeRender=()=>{const t=performance.now()/1000;smokeU.time.value=t%1000;const e=lit.userData.ember;if(e)e.material.color.setHSL(.04,1,.48+.08*Math.sin(t*5.3)*Math.sin(t*2.1));};}
 if(excluded){excluded.add(smoke);excluded.add(lit.userData.ember);}
 g.userData.legs=[];g.userData.smoke=smoke;
 return g;
}
