// V122-L11 new block between the high- and low-density districts (ref files/uploads/image-48.webp).
// Occupies city block ix=1, iz=2 (reserved in urban-layout.js) plus the west frontage of ix=2, iz=2.
// Authored in "view" coordinates: x = block-local x (0..112 -> city 112..224), v = distance south of the
// block's north edge (z = 112 - v), so the F2 photo camera on the elevated guideway looks along +v.
// Textures: art-l11v122n/n122_*.png (each generated large on its own) -> tools/block122_assets.py -> assets/l11-v122/b_*.
import * as T from './vendor/three.module.min.js';
import {URBAN_TILE_SIZE} from './urban-materials.js?v=60';
import {UrbanBatch,urbanRandom} from './urban-batch.js?v=60';
import {CITY_ORIGIN,CITY_ANGLE,CITY_BLOCK,cityToWorld} from './urban-layout.js?v=60';
import {EXIT_CITY_Y} from './exit-route.js?v=60';
import {car122} from './hopest122-street.js?v=122';
const A=new URL('./assets/l11-v122/',import.meta.url).href,Y=EXIT_CITY_Y,BX=CITY_BLOCK,BZ=CITY_BLOCK*2;
function tex(name,{repeat=false,srgb=true}={}){const t=new T.TextureLoader().load(A+'b_'+name+'.webp?v=122');if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;if(repeat)t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
const TILED={b122HotelUp:['hotel_upper',28],b122HotelSide:['hotel_side',12],b122MidA:['midrise_a',16],b122MidB:['midrise_b',14],b122Yellow:['yellow',12],b122RedTower:['redbrick_tower',18],b122Brick:['brick',3],b122Lot:['lot',12],b122Roof:['roof',6]};
export function addBlock122Materials(m){
 for(const[key,[file,tile]]of Object.entries(TILED)){m[key]=new T.MeshStandardMaterial({map:tex(file,{repeat:true}),normalMap:tex(file+'-n',{repeat:true,srgb:false}),roughness:.86,vertexColors:true});if(key==='b122Lot')m[key].color.set(0xaeb4bd);URBAN_TILE_SIZE[key]=tile;}
 m.b122HotelBase=new T.MeshStandardMaterial({map:tex('hotel_base',{repeat:true}),normalMap:tex('hotel_base-n',{repeat:true,srgb:false}),roughness:.8,vertexColors:true});
 for(const[key,file,cut]of[['b122NickFront','nick_front'],['b122NickSide','nick_side'],['b122Gothic','gothic',1],['b122BillA','billboard_a'],['b122BillB','billboard_b'],['b122HvacSide','hvac_side'],['b122HvacTop','hvac_top'],['b122Barrier','barrier',1]]){const t=tex(file);m[key]=new T.MeshStandardMaterial({map:t,roughness:.8,vertexColors:true,...(cut?{alphaTest:.5,side:T.DoubleSide}:{})});}
 m.b122BillA.emissiveMap=m.b122BillA.map;m.b122BillA.emissive.set(0xffffff);m.b122BillA.emissiveIntensity=.12;
 m.b122Stone=new T.MeshStandardMaterial({color:0xcdbf9f,roughness:.85,vertexColors:true});
 m.b122Concrete=new T.MeshStandardMaterial({color:0xa9a59a,roughness:.9,vertexColors:true});
 return m;
}
// textured quad with explicit uv range; corner order bl, br, tr, tl seen from the front
function quad(b,key,p,uv=[0,0,1,1],tone=1){const[u0,v0,u1,v1]=uv,g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p.flat(),3));g.setAttribute('uv',new T.Float32BufferAttribute([u0,v0,u1,v0,u1,v1,u0,v1],2));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();b.add(g,key,0,0,0,1,1,1,0,0,0,tone);g.dispose();}
// wall facing direction (nx,nz) in block coords: a->b runs left-to-right for a viewer outside
function wall(b,key,ax,az,bx,bz,y0,y1,uv,tone){quad(b,key,[[ax,y0,az],[bx,y0,bz],[bx,y1,bz],[ax,y1,az]],uv,tone);}
const Z=v=>112-v; // view distance -> block z
// box in view coords: x0..x1, v0..v1 (v0 nearer the camera = larger z)
function vbox(b,key,x0,x1,v0,v1,y0,y1,tone=1){b.box(key,(x0+x1)/2,(y0+y1)/2,Z((v0+v1)/2),x1-x0,y1-y0,v1-v0,0,tone);}
function hvac(b,x,v,y,w=2.6,d=1.6,h=1.3,ry=0){
 b.push(x,y,Z(v),ry);b.box('b122Concrete',0,.08,0,w+.3,.16,d+.3,0,.8);
 const s=[0,0,1,1];wall(b,'b122HvacSide',-w/2,d/2,w/2,d/2,.16,.16+h,s);wall(b,'b122HvacSide',w/2,-d/2,-w/2,-d/2,.16,.16+h,[1,0,0,1]);
 wall(b,'b122HvacSide',w/2,d/2,w/2,-d/2,.16,.16+h,[.15,0,.55,1]);wall(b,'b122HvacSide',-w/2,-d/2,-w/2,d/2,.16,.16+h,[.5,0,.9,1]);
 quad(b,'b122HvacTop',[[-w/2,.16+h,d/2],[w/2,.16+h,d/2],[w/2,.16+h,-d/2],[-w/2,.16+h,-d/2]]);b.pop();
}
function lamp(b,x,v,side){b.cylinder('photoSteel',x,4.6,Z(v),.07,.11,9.2,8);b.rod('photoSteel',[x,9,Z(v)],[x+side*2.4,9.35,Z(v)],.05);b.box('photoSteel',x+side*2.6,9.3,Z(v),.7,.16,.3);b.box('lamp',x+side*2.6,9.21,Z(v),.5,.03,.2);b.circle(x,Z(v),.15);}
function barrier(b,x,v,ry){b.push(x,.03,Z(v),ry);for(const s of[-1,1])b.plane('b122Barrier',0,.5,s*.22,1.9,.95,s>0?0:Math.PI);b.box('b122Concrete',0,.45,0,1.7,.85,.34,0,.0001);b.solid(0,0,1.9,.5);b.pop();}
export function createBlock122(mats){
 const b=new UrbanBatch(mats);b.push(CITY_ORIGIN.x,Y,CITY_ORIGIN.z,CITY_ANGLE);b.push(BX,0,BZ);
 // ---- ground: gravel lot (whole near half), sidewalk ring, avenue-side curb
 vbox(b,'b122Lot',0,100,2,112,.0,.035);b.walk(50,Z(57),100,110,.035);
 vbox(b,'sidewalk',0,112,-0.0,2,.0,.15);vbox(b,'sidewalk',100,112,2,112,0,.15);b.walk(106,Z(57),12,110,.15);vbox(b,'photoGranite',111.8,112,0,112,0,.17);
 for(let k=0;k<6;k++){const x=24+k*12;b.box('white',x,.04,Z(40),.1,.01,8,0,.5);}
 b.push(40,0,0); // composition sits beside the avenue, as in the photo (camera above the avenue's west curb)
 // ---- 1920s beige-brick hotel: 3-storey arched base, 16 upper floors, cornice and crown
 const hx0=-16,hx1=18,hv0=88,hv1=111,base=11.4,top=46.6;
 vbox(b,'b122HotelUp',hx0,hx1,hv0,hv1,base,top);b.solid((hx0+hx1)/2,Z((hv0+hv1)/2),hx1-hx0,hv1-hv0);
 wall(b,'b122HotelSide',hx1,Z(hv1)-.02,hx0,Z(hv1)-.02,base,top,[0,0,1,(top-base)/(hx1-hx0)]); // rear wall: the painted HOTEL side, once
 wall(b,'b122HotelBase',hx0,Z(hv0)+.03,hx1,Z(hv0)+.03,0,base,[0,0,(hx1-hx0)/30,1]);
 wall(b,'b122HotelBase',hx1+.03,Z(hv0),hx1+.03,Z(hv1),0,base,[0,0,(hv1-hv0)/30,1]); // long face toward the lot/avenue
 vbox(b,'b122Stone',hx0-.3,hx1+.4,hv0-.4,hv1,base-.2,base+.5);vbox(b,'b122Stone',hx0-.5,hx1+.6,hv0-.6,hv1,top,top+1.1);vbox(b,'b122Stone',hx0+3,hx1-3,hv0+4,hv1-4,top+1.1,top+4.2,.9);
 for(let y=base+9.6;y<top;y+=12.8)vbox(b,'b122Stone',hx1,hx1+.18,hv0,hv1,y,y+.28,.92);
 b.box('photoSteel',hx1-6,top+6.2,Z(hv0+12),.12,4,.12);vbox(b,'b122Brick',hx0+8,hx0+13,hv0+16,hv0+21,top+4.2,top+7.5,.8);
 // ---- mid-rise beige blocks behind and right of the hotel
 vbox(b,'b122MidA',22,40,94,111,0,25);b.solid(31,Z(102.5),18,17);vbox(b,'b122Stone',21.8,40.2,93.8,111,25,25.8,.85);
 vbox(b,'b122MidB',40,56,99,111,0,19);b.solid(48,Z(105),16,12);vbox(b,'b122Stone',39.8,56.2,98.8,111,19,19.7,.85);
 hvac(b,30,100,25.8,3.2,2,1.6);hvac(b,50,104,19.7,2.6,1.6,1.3,.4);
 // ---- Nick's Gaslight: one-storey red brick bar with roof clutter
 const nx0=28,nx1=52,nv0=74,nv1=86,nh=4.6;
 vbox(b,'b122Brick',nx0,nx1,nv0,nv1,0,nh);b.solid((nx0+nx1)/2,Z((nv0+nv1)/2),nx1-nx0,nv1-nv0);
 wall(b,'b122NickFront',nx0,Z(nv0)+.02,nx1,Z(nv0)+.02,0,nh);
 wall(b,'b122NickSide',nx1+.02,Z(nv0),nx1+.02,Z(nv1),0,nh);wall(b,'b122NickSide',nx0-.02,Z(nv1),nx0-.02,Z(nv0),0,nh,[1,0,.25,1],.9);
 vbox(b,'b122Roof',nx0+.2,nx1-.2,nv0+.2,nv1-.2,nh,nh+.05);
 for(const[x0,x1,v0,v1]of[[nx0,nx1,nv0,nv0+.25],[nx0,nx1,nv1-.25,nv1],[nx0,nx0+.25,nv0,nv1],[nx1-.25,nx1,nv0,nv1]])vbox(b,'b122Brick',x0,x1,v0,v1,nh,nh+.55);
 vbox(b,'b122Stone',nx0-.05,nx1+.05,nv0-.06,nv0+.3,nh+.55,nh+.68,.8);
 vbox(b,'b122Brick',nx0+2,nx0+3.1,nv1-3,nv1-1.9,nh,nh+2.4);vbox(b,'b122Stone',nx0+1.9,nx0+3.2,nv1-3.1,nv1-1.8,nh+2.4,nh+2.55,.8);
 hvac(b,nx0+8,nv0+5,nh+.05);hvac(b,nx0+12.5,nv0+7.5,nh+.05,2,1.4,1.1,.3);
 b.box('photoSteel',nx1-3,nh+1.2,Z(nv0+4),.08,2.4,.08);b.sphere('white',nx1-3.2,nh+2.3,Z(nv0+3.8),.45,.45,.12);
 vbox(b,'photoBlue',nx1-6,nx1-4.8,nv0+8,nv0+8.8,nh,nh+1.1,.8);
 b.box('photoSteel',nx0+16,nh+1.6,Z(nv0+1.2),.08,3.2,.08);b.box('photoSteel',nx0+14,nh+1.6,Z(nv0+1.2),.08,3.2,.08);b.box('white',nx0+15,nh+2.8,Z(nv0+1.2),3,1.4,.08,0,.95);
 b.rod('photoSteel',[nx0+1,0,Z(nv0)+.3],[nx0+1,nh+1.8,Z(nv0)+.3],.04);
 // ---- orange barriers and parked cars on the lot
 for(let k=0;k<8;k++)barrier(b,1+k*2.05,62,0);for(let k=0;k<6;k++)barrier(b,14+k*2.05,62,.03);for(let k=0;k<4;k++)barrier(b,58+k*2.05,70,.04);
 car122(b,'sedan',10,Z(56),Math.PI/2);car122(b,'suv',72,Z(60),-Math.PI/2+.1,{tone:.95});car122(b,'sedan',20,Z(30),Math.PI/2+.05);
 b.pop();
 // ---- lamp posts along the avenue
 for(let v=6;v<310;v+=22){if(v<112)lamp(b,104.5,v,1);lamp(b,119.5,v+11,-1);}
 // ---- across the avenue (ix=2 west frontage): Gothic red-brick hall, yellow tower, old brick block, billboards
 const gx=125,gv0=270,gv1=296,gw=gv1-gv0,gh=26;
 vbox(b,'b122Brick',gx+.4,gx+16,gv0+.4,gv1-.4,0,gh*.62);b.solid(gx+8.2,Z((gv0+gv1)/2),15.6,gw);
 vbox(b,'b122Roof',gx+.6,gx+15.8,gv0+.6,gv1-.6,gh*.62,gh*.63);
 wall(b,'b122Gothic',gx,Z(gv0),gx,Z(gv1),0,gh); // cut-out front incl. roofline, gables and turret
 wall(b,'b122Gothic',gx+16,Z(gv1),gx+16,Z(gv0),0,gh,[1,0,0,1],.85);
 vbox(b,'b122Yellow',gx,gx+20,152,176,0,46);b.solid(gx+10,Z(164),20,24);vbox(b,'b122Stone',gx-.2,gx+20.2,151.8,176.2,46,47,.9);hvac(b,gx+8,160,47,3,2,1.5);
 vbox(b,'b122RedTower',gx,gx+18,114,142,0,27);b.solid(gx+9,Z(128),18,28);vbox(b,'b122Stone',gx-.2,gx+18.2,113.8,142.2,27,27.8,.75);vbox(b,'b122MidB',gx,gx+16,60,100,0,18);b.solid(gx+8,Z(80),16,40);
 for(const[key,x,v,y,w,h,ry]of[['b122BillA',96,112,5.6,7,2.4,-.15],['b122BillB',gx-4,40,7.4,9,3,-1.25]]){
  b.push(x,0,Z(v),ry);b.plane(key,0,y,0,w,h);b.box('photoFrame',0,y,-.12,w+.3,h+.3,.18);b.box('photoSteel',0,y-h/2-.3,-.6,w,.08,.9);
  for(const s of[-1,1])b.rod('photoSteel',[s*w*.3,0,-.3],[s*w*.3,y-h/2,-.3],.14);b.pop();}
 // ---- elevated guideway the photo camera stands on (people-mover style), spanning the north road
 b.box('b122Concrete',56,8.1,Z(-3),112,1.1,2.6);for(const x of[18,48,78])b.cylinder('b122Concrete',x,3.8,Z(-3),.55,.6,7.6,10);
 for(const s of[-1,1])b.box('photoSteel',56,9.55,Z(-3)+s*1.2,112,.06,.06);for(let x=1;x<112;x+=2.4)for(const s of[-1,1])b.box('photoSteel',x,9.1,Z(-3)+s*1.2,.05,.9,.05);
 b.pop();b.pop();
 return{object:b.finish('L11 block 122 / Nick\'s Gaslight (ref image-48)'),colliders:b.colliders,walks:b.walks};
}
// F2 photo camera on the guideway, framing image-48.
export function block122Waypoint(){const yaw0=.227,p=cityToWorld(BX+100,BZ+112+3);return{...p,label:'图三 · 酒店与 Nick\'s Gaslight',yaw:CITY_ANGLE+yaw0,pitch:.11,eye:10.4,floorY:8.65,fov:36,referenceAspect:1024/698,range:520,urbanPhoto:true};}
