import {ALPHA150,inAlphaExterior150} from './alpha150-plan.js';
export function createAlphaExterior150(T,scene){
 let root=null;const b=ALPHA150.exterior,g=ALPHA150.gate;
 function build(){root=new T.Group();root.name='Alpha exterior proxy · sealed 300 x 260m';
  const wall=new T.MeshLambertMaterial({color:0x8d948b}),trim=new T.MeshLambertMaterial({color:0x4c5d50}),door=new T.MeshLambertMaterial({color:0x596e62});
  const box=(x,y,z,w,h,d,mat=wall)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;root.add(m);};
  const h=3.35,t=.5;box((b.x0+b.x1)/2,h/2,b.z0,300,h,t);box((b.x0+b.x1)/2,h/2,b.z1,300,h,t);box(b.x1,h/2,(b.z0+b.z1)/2,t,h,260);
  box(b.x0,h/2,(b.z0+g.z-3)/2,t,h,g.z-3-b.z0);box(b.x0,h/2,(b.z1+g.z+3)/2,t,h,b.z1-g.z-3);
  box(b.x0,3.025,g.z,t,.65,6);box(b.x0-.03,1.35,g.z,.18,2.7,6,door);
  // Gate is intentionally solid: E changes scenes; walking never enters a duplicate interior.
  for(const z of [g.z-3.15,g.z+3.15])box(b.x0-.3,1.65,z,.4,3.3,.35,trim);
  for(const z of [g.z-1.5,g.z+1.5])box(b.x0-.16,1.1,z,.06,.55,.055,trim);
  if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#35483b';ctx.fillRect(0,0,512,128);ctx.fillStyle='#f0e5ba';ctx.textAlign='center';ctx.font='bold 42px sans-serif';ctx.fillText('M.E.G.  ALPHA',256,54);ctx.font='24px sans-serif';ctx.fillText('西门  /  WEST ENTRANCE',256,99);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const mat=new T.MeshLambertMaterial({map:tex});const sign=new T.Mesh(new T.PlaneGeometry(5.5,1.375),mat);sign.rotation.y=-Math.PI/2;sign.position.set(b.x0-.27,2.18,g.z);root.add(sign);}
  scene.add(root);
 }
 function dispose(){if(!root)return;scene.remove(root);const mats=new Set();root.traverse(o=>{o.geometry?.dispose();if(o.material)mats.add(o.material);});for(const m of mats){m.map?.dispose();m.dispose();}root=null;}
 function update(x,z){const dx=Math.max(b.x0-x,0,x-b.x1),dz=Math.max(b.z0-z,0,z-b.z1),d=Math.hypot(dx,dz);if(d<145&&!root)build();else if(d>200)dispose();}
 function nearDoor(x,z,yaw){if(x>=b.x0||Math.hypot(x-(b.x0-1.1),z-g.z)>2.4)return null;const facingX=-Math.sin(yaw);return facingX>.35?{alpha:true,label:'E 进入 M.E.G. Alpha 基地 · 西门'}:null;}
 function map(ctx,sx,sz,scale){ctx.fillStyle='#414b45';ctx.fillRect(sx(b.x0),sz(b.z0),300*scale,260*scale);ctx.strokeStyle='#bfc8b7';ctx.lineWidth=2;ctx.strokeRect(sx(b.x0),sz(b.z0),300*scale,260*scale);ctx.fillStyle='#80d3a4';ctx.fillRect(sx(b.x0)-2,sz(g.z-3),4,6*scale);if(scale>.12){ctx.fillStyle='#e9e1c7';ctx.font='11px sans-serif';ctx.fillText('M.E.G. ALPHA · 独立区域',sx(b.x0+7),sz(b.z0+10));}}
 return{update,dispose,nearDoor,map,blocked:inAlphaExterior150};
}
