import * as T from './vendor/three.module.min.js';
const textures={};
const dataNames=['jade','ivory','floor','paving','plaster','stone','plastic','towel','glass','wood'];
export async function initializeBathRefitTextures(decode){
 const load=new T.TextureLoader();
 await Promise.all([...dataNames.flatMap(n=>[n,n+'-normal',n+'-roughness']), 'border','sign','ivy','label','wetness'].map(async n=>{
  const url=new URL('./textures/bath-v61/'+n+'.webp',import.meta.url);let t;if(decode){const wide=['sign','label','border'].includes(n),im=await decode(url,wide?768:512,wide?256:512);t=new T.DataTexture(im.data,im.width,im.height);t.flipY=true;t.needsUpdate=true;}else t=await load.loadAsync(url.href);
  t.colorSpace=/-normal|-roughness|wetness/.test(n)?T.NoColorSpace:T.SRGBColorSpace;
  t.wrapS=t.wrapT=['sign','ivy','label'].includes(n)?T.ClampToEdgeWrapping:T.RepeatWrapping;
  t.anisotropy=4;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.name='Bath refit / '+n;textures[n]=t;
 }));
}
export function bathRefitTextures(){return textures;}
export function bathRefitMaterials(){
 const surface=(n,color=0xffffff,roughness=.9,normal=.45)=>new T.MeshStandardMaterial({name:'V61 '+n,map:textures[n],normalMap:textures[n+'-normal'],normalScale:new T.Vector2(normal,normal),roughnessMap:textures[n+'-roughness'],color,roughness,metalness:0});
 const m={jade:surface('jade',0xd3ded3,.7),ivory:surface('ivory',0xe5e4d3,.63),floor:surface('floor',0xd4cbbb,.84),paving:surface('paving',0xc9c6b8,.95),plaster:surface('plaster',0xd5d2c4,1,.6),stone:surface('stone',0xc9c3ab,.92,.8),plastic:surface('plastic',0xe2dfc8,.72,.23),towel:surface('towel',0xd3dfd6,1,.5)};
 m.wood=surface('wood',0xb6a18a,.85,.36);
 m.dark=surface('plastic',0x242e2a,.85,.25);m.metal=surface('plastic',0x95a7a4,.44,.15);m.metal.metalness=.78;
 m.glass=new T.MeshPhysicalMaterial({name:'Embossed frosted glass',map:textures.glass,normalMap:textures['glass-normal'],normalScale:new T.Vector2(.45,.45),color:0xc1d5c5,metalness:0,roughness:.45,transparent:true,opacity:.65,side:T.DoubleSide,depthWrite:false});
 m.water=new T.MeshPhysicalMaterial({name:'Clear water inside polycarbonate',color:0x9bbac0,roughness:.1,metalness:0,transparent:true,opacity:.30,depthWrite:false});
 m.foliage=new T.MeshStandardMaterial({name:'Generated ivy alpha card',map:textures.ivy,normalMap:textures['towel-normal'],normalScale:new T.Vector2(.08,.08),alphaTest:.45,side:T.DoubleSide,roughness:.95});
 m.border=new T.MeshStandardMaterial({name:'1980s glazed palm geometric border',map:textures.border,normalMap:textures['jade-normal'],normalScale:new T.Vector2(.15,.15),roughness:.65});
 m.sign=new T.MeshStandardMaterial({name:'Generated BAÑOS acrylic lightbox',map:textures.sign,emissiveMap:textures.sign,emissive:0xdce5c9,emissiveIntensity:.42,normalMap:textures['plastic-normal'],normalScale:new T.Vector2(.1,.1),roughness:.62});
 m.label=new T.MeshStandardMaterial({name:'Generated water brand label',map:textures.label,normalMap:textures['plastic-normal'],normalScale:new T.Vector2(.06,.06),roughness:.82});
 m.lamp=new T.MeshStandardMaterial({name:'Aged opal glass',map:textures.plastic,emissive:0xffe0a3,emissiveIntensity:1.8,color:0xf1e3b2,roughness:.55});
 return m;
}
export function bevelBox(w,h,d,r=.025){
 r=Math.min(r,w*.2,h*.2,d*.2);const s=new T.Shape(),x=-w/2+r,y=-h/2+r,W=w-2*r,H=h-2*r;
 s.moveTo(x,y);s.lineTo(x+W,y);s.lineTo(x+W,y+H);s.lineTo(x,y+H);s.closePath();
 const g=new T.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:r,bevelThickness:r,curveSegments:1});g.translate(0,0,-d/2+r);g.computeVertexNormals();return g;
}
export function worldUV(g,scale=1.25){const p=g.attributes.position,n=g.attributes.normal;const uv=new Float32Array(p.count*2);for(let i=0;i<p.count;i++){const x=Math.abs(n.getX(i)),y=Math.abs(n.getY(i)),z=Math.abs(n.getZ(i));uv[i*2]=(x>y&&x>z?p.getZ(i):p.getX(i))/scale;uv[i*2+1]=(y>x&&y>z?p.getZ(i):p.getY(i))/scale;}g.setAttribute('uv',new T.BufferAttribute(uv,2));return g;}
export function addBox(root,m,x,y,z,w,h,d,name='',r=.025){const o=new T.Mesh(worldUV(bevelBox(w,h,d,r),m===undefined?1:1.25),m);o.position.set(x,y,z);o.name=name;o.castShadow=o.receiveShadow=true;root.add(o);return o;}
export function addPlane(root,m,x,y,z,w,h,ry=0,rx=0,name=''){const o=new T.Mesh(new T.PlaneGeometry(w,h),m);o.position.set(x,y,z);o.rotation.set(rx,ry,0);o.name=name;o.receiveShadow=true;root.add(o);return o;}
export function addTube(root,m,points,r=.02,name='',segments=24){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const o=new T.Mesh(new T.TubeGeometry(curve,segments,r,7,false),m);o.castShadow=o.receiveShadow=true;o.name=name;root.add(o);return o;}
export function rock(root,m,x,y,z,w,h,d,seed=1){const g=new T.IcosahedronGeometry(1,2),p=g.attributes.position;for(let i=0;i<p.count;i++){const a=p.getX(i),b=p.getY(i),c=p.getZ(i),v=1+.11*Math.sin(a*12.7+b*6.3+c*9.1+seed)*Math.cos(c*15.3+a*8.4);p.setXYZ(i,a*w*.5*v,b*h*.5*v,c*d*.5*v);}g.computeVertexNormals();worldUV(g,.9);const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;root.add(o);return o;}
