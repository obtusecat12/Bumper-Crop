// V122-L11 Hope Street completion (ref files/uploads/image-47.webp, real LA Hope St).
// Authored in the un-mirrored Hope frame like reference-scenes.js; photoHandedness mirrors x afterwards.
// Textures: art-l11v122/h122_*.png (each generated large on its own) -> tools/hopest122_assets.py -> assets/l11-v122.
import * as T from './vendor/three.module.min.js';
import {parkCar132} from './cars132.js?v=132t';
import {URBAN_TILE_SIZE} from './urban-materials.js?v=60';
import {urbanRandom} from './urban-batch.js?v=60';
import {H122_CARS} from './hopest122-atlas.js?v=122';
const A=new URL('./assets/l11-v122/',import.meta.url).href,A3=new URL('./assets/l11-v123/',import.meta.url).href;
function tex(name,{repeat=false,srgb=true,v3=false}={}){const t=new T.TextureLoader().load(v3?A3+name+'.webp?v=123':A+name+'.webp?v=122');if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;if(repeat)t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
const FACADES={h122Rib:['rib_tower',26],h122Beige:['beige_facade',36],h122DistA:['distant_a',24],h122DistB:['distant_b',14],h122DistC:['distant_c',20]};
const FAR3={h123FarA:'c_far_a',h123FarB:'c_far_b',h123FarC:'c_far_c'}; // V123 street-end towers, each its own generated facade
export function addHope122Materials(m){
 for(const[key,[file,tile]]of Object.entries(FACADES)){m[key]=new T.MeshStandardMaterial({map:tex(file,{repeat:true}),normalMap:tex(file+'-n',{repeat:true,srgb:false}),normalScale:new T.Vector2(.8,.8),roughness:.82,vertexColors:true});if(key==='h122Rib'){m[key].color.set(0xe2e4e6);m[key].emissiveMap=m[key].map;m[key].emissive.set(0xffffff);m[key].emissiveIntensity=.78;}URBAN_TILE_SIZE[key]=tile;}
 m.h122RibFin=new T.MeshStandardMaterial({color:0x958e84,emissive:0x3e3a35,roughness:.9,vertexColors:true});
 for(const[key,file]of Object.entries(FAR3)){m[key]=new T.MeshStandardMaterial({map:tex(file,{repeat:true,v3:true}),normalMap:tex(file+'-n',{repeat:true,srgb:false,v3:true}),roughness:.85,vertexColors:true,emissiveMap:tex(file,{repeat:true,v3:true}),emissive:0xffffff,emissiveIntensity:.18});URBAN_TILE_SIZE[key]=key==='h123FarC'?26:30;}
 m.h122Bark=new T.MeshStandardMaterial({map:tex('bark',{repeat:true}),color:0xeeebe0,emissive:0x302e28,roughness:.92,vertexColors:true});
 for(const[key,file]of[['h122FicusA','ficus_a'],['h122FicusB','ficus_b']]){const t=tex(file);m[key]=new T.MeshStandardMaterial({map:t,alphaTest:.5,side:T.DoubleSide,roughness:.9,vertexColors:true,emissiveMap:t,emissive:0xe4f0d0,emissiveIntensity:.3,color:0xeef8e6});}
 const store=tex('famima_store');m.h122FamStore=new T.MeshStandardMaterial({map:store,emissiveMap:store,emissive:0xffffff,emissiveIntensity:.32,roughness:.4,side:T.DoubleSide,vertexColors:true});
 for(const car of['suv','sedan']){const t=tex('car-'+car);m['h122Car_'+car]=new T.MeshStandardMaterial({map:t,alphaTest:.5,side:T.DoubleSide,roughness:.5,metalness:.1,vertexColors:true});}
 m.h122CarCore=new T.MeshStandardMaterial({color:0x26282a,roughness:.7,vertexColors:true});
 // Existing sign materials keep their keys (photoHandedness un-mirrors their u); only the bitmaps change.
 if(m.photoFamima){m.photoFamima.map=tex('famima_sign');m.photoFamima.needsUpdate=true;}
 if(m.photoBanner){m.photoBanner.map=tex('banner',{v3:true});m.photoBanner.color?.set(0xffffff);m.photoBanner.needsUpdate=true;}
 return m;
}
// Letter-bearing materials added by this module (u is restored after the mirror).
export const H122_LETTER_KEYS=['h122FamStore'];
// One textured quad: centre c, half-axes r (u) and u (v), atlas rect [x,y,w,h], optional u flip.
function face(b,key,c,r,u,rect,flip=false,tone=1){
 const p=[[c[0]-r[0]-u[0],c[1]-r[1]-u[1],c[2]-r[2]-u[2]],[c[0]+r[0]-u[0],c[1]+r[1]-u[1],c[2]+r[2]-u[2]],[c[0]+r[0]+u[0],c[1]+r[1]+u[1],c[2]+r[2]+u[2]],[c[0]-r[0]+u[0],c[1]-r[1]+u[1],c[2]-r[2]+u[2]]];
 let[x,y,w,h]=rect,u0=x,u1=x+w;if(flip)[u0,u1]=[u1,u0];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p.flat(),3));g.setAttribute('uv',new T.Float32BufferAttribute([u0,y,u1,y,u1,y+h,u0,y+h],2));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();b.add(g,key,0,0,0,1,1,1,0,0,0,tone);g.dispose();
}
// Parked car: cut-out side/front/rear/top photo planes around a dark core (PS1 billboard-box car).
// V132-traffic: the photo-card cars are replaced by the CC0 PSX car set (cars132.js); SUV slots stay tall. Old body = car122V1.
export function car122(b,kind,x,z,ry=0,{tone=1}={}){parkCar132(b,Math.round(x*7.3+z*13.1)+(kind==='suv'?5:0),{x,z,ry,tone,kinds:kind==='suv'?['minivan','wagon','van']:['sedan','saloon','hatch','wagon','taxi']});}
export function car122V1(b,kind,x,z,ry=0,{tone=1}={}){
 const C=H122_CARS[kind],R=C.rects,key='h122Car_'+kind,L=kind==='suv'?4.6:4.8,W=kind==='suv'?1.86:1.80;
 const H=L/C.aspect.side,HF=W/C.aspect.front*1.02,HR=W/C.aspect.rear*1.02;
 b.push(x,.02,z,ry);
 b.box('h122CarCore',0,H*.43,0,W*.9,H*.5,L*.9,0,.8);
 face(b,key,[W/2,H/2,0],[0,0,-L/2],[0,H/2,0],R.side,false,tone);
 face(b,key,[-W/2,H/2,0],[0,0,L/2],[0,H/2,0],R.side,true,tone*.92);
 face(b,key,[0,HF/2,L/2-.02],[W/2,0,0],[0,HF/2,0],R.front,false,tone);
 face(b,key,[0,HR/2,-L/2+.02],[-W/2,0,0],[0,HR/2,0],R.rear,false,tone);
 face(b,key,[0,H*.985,0],[0,0,L*.47],[W*.47,0,0],R.top,false,tone);
 b.solid(0,0,W,L);b.pop();
}
// Indian laurel fig: pale forked trunk + a dense dome of cross-quad leaf clumps (each its own generated photo).
export function ficus122(b,x,z,{height=10.4,width=7.4,seed=1,small=false}={}){
 const r=urbanRandom(seed),trunk=height*(small?.4:.34),lean=(r()-.5)*.4;
 const root=[x,.12,z],fork=[x+lean,trunk,z+(r()-.5)*.3];
 b.rod('h122Bark',root,fork,small?.14:.24);
 for(let i=0;i<4;i++){const a=i*1.57+r()*.6;b.rod('h122Bark',[x,.25,z],[x+Math.cos(a)*.5,.05,z+Math.sin(a)*.5],.08);}
 const cy=trunk+height*.36,rx=width*.56,ryy=height*.27; // V123: wider, flatter umbrella crown like the photo's laurels
 for(let i=0;i<5;i++){const a=i*1.257+r()*.5,end=[x+Math.cos(a)*rx*.62,cy+(r()-.3)*ryy*.6,z+Math.sin(a)*rx*.58];b.rod('h122Bark',fork,end,.09);}
 const n=small?10:18;
 for(let k=0;k<n;k++){
  // golden-spiral points on the upper 75% of an ellipsoid shell, pulled slightly inward
  const t=(k+.5)/n,phi=Math.acos(1-1.55*t),th=k*2.39996+seed,s=.62+r()*.42;
  const px=x+Math.sin(phi)*Math.cos(th)*rx*s,py=cy+Math.cos(phi)*ryy*s,pz=z+Math.sin(phi)*Math.sin(th)*rx*s;
  const w=(small?1.7:3.3)+r()*1.6,h=w*.6,key=k%3===2?'h122FicusB':'h122FicusA',tone=.84+.4*(py-cy+ryy)/(2*ryy),a=th+r()*.6;
  if(!small&&k%5===3)continue; // V123: sparser dome, sky gaps like the photo's laurels
  for(let j=0;j<2;j++)b.plane(key,px,py,pz,w,h,a+j*Math.PI/2,0,tone);
 }
 // shaded underside: tilted dark clumps closing the dome bottom
 for(let k=0;k<(small?3:6);k++){const a=k*1.05+r(),px=x+Math.cos(a)*rx*.45,pz=z+Math.sin(a)*rx*.45;b.plane('h122FicusB',px,cy-ryy*.55,pz,rx*1.0,rx*.62,a,-1.15,.62);}
 b.circle(x,z,.29);b.box('photoSteel',x,.012,z,1.44,.025,1.44);for(let i=-4;i<=4;i++)b.box('photoGranite',x+i*.15,.031,z,.026,.014,1.33);
}
// Left foreground tower: textured dark precast body + real projecting vertical fins and floor bands.
export function ribTower122(b){
 const x0=-45.5,x1=-14.5,z0=7.9,z1=70.1,top=62,base=5;
 b.box('h122Rib',(x0+x1)/2,top/2,(z0+z1)/2,x1-x0,top,z1-z0);b.solid((x0+x1)/2,(z0+z1)/2,x1-x0,z1-z0);
 for(let z=z0+.8;z<z1;z+=1.625)b.box('h122RibFin',x1+.26,(top+base)/2,z,.52,top-base,.34);
 for(let z=z0+.8;z<z1;z+=1.625)b.box('dark',x1+.535,(top+base)/2,z,.03,top-base,.26,0,.55); // V123: dark fin noses -> the photo's light/dark rib striping at grazing angles
 for(let x=x0+.8;x<x1;x+=1.625)b.box('h122RibFin',x,(top+base)/2,z0-.26,.34,top-base,.52);
 for(let y=base;y<=top;y+=3.65){b.box('h122RibFin',x1+.12,y,(z0+z1)/2,.24,.16,z1-z0);b.box('h122RibFin',(x0+x1)/2,y,z0-.12,x1-x0,.16,.24);}
 b.box('h122RibFin',x1+.35,top+.4,(z0+z1)/2,.7,.8,z1-z0+.7);b.box('h122RibFin',(x0+x1)/2,top+.4,z0-.35,x1-x0+.7,.8,.7);
}
// Distant blocks down the hill: deduced massing with setbacks, roof plant and parapets.
export function distant122(b){
 const blocks=[
  // [x, z, w, d, h, key, setback]
  [-30,283,26,25,30,'h122DistC',0],[30,312,26,25,43,'h122DistA',.18],[-30,341,26,25,56,'h122DistB',0],[30,370,26,25,26,'h122DistC',0],
  [-30,397,26,24,38,'h122DistA',.22],[30,428,26,24,50,'h122DistB',.15],[-30,428,26,22,64,'h122DistA',0]];
 for(const[x,z,w,d,h,key,sb]of blocks){
  const h1=sb?h*(1-sb*1.6):h;b.box(key,x,h1/2,z,w,h1,d);b.solid(x,z,w,d);
  if(sb){b.box(key,x,h1+(h-h1)/2,z+d*.08,w*.7,h-h1,d*.7);b.box('photoCream',x,h1+.25,z,w+.3,.5,d+.3);}
  const top=h,r=urbanRandom(Math.round(x*7+z));
  b.box('photoCream',x,top+.45,z,w*(sb?.7:1)+.25,.9,d*(sb?.7:1)+.25,0,.9);
  for(let k=0;k<3;k++)b.box('metal',x+(r()-.5)*w*.4,top+1.3,z+(r()-.5)*d*.4,2+r()*2.5,1.2+r(),2+r()*2,0,.75);
  if(r()>.5){b.cylinder('photoSteel',x+w*.25,top+3,z,.06,.06,4,6);}
 }

 // V123: the street terminates on a pale International-style mid-rise straddling the axis ~430 m out (image-47's end-of-street
 // building), with a dark bronze slab and a slim sandy tower stepping up behind it; bases sit below the photo's crest line.
 b.box('h123FarC',1,28.5,424,30,57,28);b.solid(1,424,30,28);b.box('photoCream',1,57.4,424,30.4,.8,28.4,0,.9);
 for(let k=0;k<3;k++)b.box('metal',-6+k*6,58.6,422+k*2,3.2,1.6,2.6,0,.7);
 b.box('h123FarB',9,41,441,13,82,8);b.box('h123FarA',-9,52,443,9,104,6);b.box('photoCream',-9,104.4,443,9.3,.8,6.3,0,.85);
}
