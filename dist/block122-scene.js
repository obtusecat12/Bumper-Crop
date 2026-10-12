// V122-L11 new block between the high- and low-density districts (ref files/uploads/image-48.webp).
// V123-L11: re-solved from the photo by ground-plane photogrammetry (camera 9 m up on a people-mover guideway, looking
// 0.182 rad left of the grid avenue and 0.091 rad up, fov 36): hotel sits ACROSS the cross street in block (1,1) at its
// real corner angle, mid-rises behind it, Gothic hall + yellow tower down the avenue in block (2,0), red-brick loft near right.
// Authored in "view" coordinates of block (1,2): x = block-local x, v = distance south of the block's north edge (z = 112 - v);
// v > 112 reaches into block (1,1) / (2,1) / (2,0). urban-layout.js drops the procedural buildings these replace.
// Textures: art-l11v122n/n122_* (V122) + art-l11v123/n123_* (V123), each generated large on its own -> tools/block12{2,3}_assets.py.
import * as T from './vendor/three.module.min.js';
import {URBAN_TILE_SIZE} from './urban-materials.js?v=60';
import {UrbanBatch} from './urban-batch.js?v=60';
import {CITY_ORIGIN,CITY_ANGLE,CITY_BLOCK,cityToWorld} from './urban-layout.js?v=60';
import {EXIT_CITY_Y} from './exit-route.js?v=60';
import {car122} from './hopest122-street.js?v=122';
const A=new URL('./assets/l11-v122/',import.meta.url).href,A3=new URL('./assets/l11-v123/',import.meta.url).href,Y=EXIT_CITY_Y,BX=CITY_BLOCK,BZ=CITY_BLOCK*2;
function tex(name,{repeat=false,srgb=true,v3=false}={}){const t=new T.TextureLoader().load(v3?A3+name+'.webp?v=123':A+'b_'+name+'.webp?v=122');if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;if(repeat)t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
const TILED={b122HotelUp:['hotel_upper',28],b122HotelSide:['hotel_side',12],b122MidA:['midrise_a',16],b122MidB:['midrise_b',14],b122RedTower:['redbrick_tower',18],b122Brick:['brick',3],b122Roof:['roof',6]};
// V123 faces: [key, file] - every one its own generated image, UVs set per face (window pitch matched to the photo)
const V3={c123HotelLong:'c_hotel_long',c123HotelShort:'c_hotel_short',c123HotelBase2:'c_hotel_base2',c123YellowMain:'c_yellow_main',c123YellowSide:'c_yellow_side',c123YellowWing:'c_yellow_wing',
 c123Brick3:'c_brick3',c123Brick3Side:'c_brick3_side',c123Brown2:'c_brown2',c123MidASide:'c_midrise_a_side',c123MidBSide:'c_midrise_b_side',c123NearN:'c_nearbrick_n',c123GothicSide:'c_gothic_side',c123Lot:'c_lot',c123HotelBase:'c_hotel_base'};
export function addBlock122Materials(m){
 for(const[key,[file,tile]]of Object.entries(TILED)){m[key]=new T.MeshStandardMaterial({map:tex(file,{repeat:true}),normalMap:tex(file+'-n',{repeat:true,srgb:false}),roughness:.86,vertexColors:true});URBAN_TILE_SIZE[key]=tile;}
 for(const[key,file]of Object.entries(V3)){m[key]=new T.MeshStandardMaterial({map:tex(file,{repeat:true,v3:true}),normalMap:tex(file+'-n',{repeat:true,srgb:false,v3:true}),normalScale:new T.Vector2(.7,.7),roughness:.85,vertexColors:true});}
 URBAN_TILE_SIZE.c123Lot=11;
 for(const[key,file,cut]of[['b122Gothic','gothic',1],['b122BillA','billboard_a'],['b122BillB','billboard_b'],['b122HvacSide','hvac_side'],['b122HvacTop','hvac_top']]){const t=tex(file);m[key]=new T.MeshStandardMaterial({map:t,roughness:.8,vertexColors:true,...(cut?{alphaTest:.5,side:T.DoubleSide}:{})});}
 for(const[key,file]of[['c123NickFront','c_nick_front'],['c123NickSide','c_nick_side']])m[key]=new T.MeshStandardMaterial({map:tex(file,{v3:true}),roughness:.8,vertexColors:true});
 {const t=tex('c_barricade',{v3:true});m.c123Barricade=new T.MeshStandardMaterial({map:t,alphaTest:.5,side:T.DoubleSide,roughness:.8,vertexColors:true});}
 m.b122BillA.emissiveMap=m.b122BillA.map;m.b122BillA.emissive.set(0xffffff);m.b122BillA.emissiveIntensity=.12;
 m.b122Stone=new T.MeshStandardMaterial({color:0xcdbf9f,roughness:.85,vertexColors:true});
 m.b122Concrete=new T.MeshStandardMaterial({color:0xa9a59a,roughness:.9,vertexColors:true});
 m.c123Navy=new T.MeshStandardMaterial({color:0x1f2c49,roughness:.45,metalness:.35,vertexColors:true});
 m.c123Pole=new T.MeshStandardMaterial({color:0x6e6253,roughness:.95,vertexColors:true});
 return m;
}
// textured quad with explicit uv range; corner order bl, br, tr, tl seen from the front
function quad(b,key,p,uv=[0,0,1,1],tone=1){const[u0,v0,u1,v1]=uv,g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p.flat(),3));g.setAttribute('uv',new T.Float32BufferAttribute([u0,v0,u1,v0,u1,v1,u0,v1],2));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();b.add(g,key,0,0,0,1,1,1,0,0,0,tone);g.dispose();}
// wall facing outward: a->b runs left-to-right for a viewer outside (current frame coords x,z)
function wall(b,key,ax,az,bx,bz,y0,y1,uv,tone){quad(b,key,[[ax,y0,az],[bx,y0,bz],[bx,y1,bz],[ax,y1,az]],uv,tone);}
const Z=v=>112-v; // view distance -> block z
function vbox(b,key,x0,x1,v0,v1,y0,y1,tone=1){b.box(key,(x0+x1)/2,(y0+y1)/2,Z((v0+v1)/2),x1-x0,y1-y0,v1-v0,0,tone);}
// Oriented building box. Local frame: x along the front face (left->right for a viewer in front), +z = out of the front face.
// faces: {front,right,back,left} = [key, uRepeats, vRepeats, tone, y0?, y1?] ; top gets 'b122Roof'.
function obox(b,cx,cv,w,d,y0,y1,ry,faces,{roof='b122Roof',solid=true}={}){
 b.push(cx,0,Z(cv),ry);const hw=w/2,hd=d/2;
 const F={front:[-hw,hd,hw,hd],right:[hw,hd,hw,-hd],back:[hw,-hd,-hw,-hd],left:[-hw,-hd,-hw,hd]};
 for(const[k,[ax,az,bx,bz]]of Object.entries(F)){const f=faces[k];if(!f)continue;const[key,ur=1,vr=1,tone=1,fy0=y0,fy1=y1,u0=0,v0=0]=f;wall(b,key,ax,az,bx,bz,fy0,fy1,[u0,v0,u0+ur,v0+vr],tone);}
 if(roof)quad(b,roof,[[-hw,y1,hd],[hw,y1,hd],[hw,y1,-hd],[-hw,y1,-hd]],[0,0,w/6,d/6],.8);
 if(solid)b.solid(0,0,w,d);b.pop();
}
function hvac(b,x,v,y,w=2.6,d=1.6,h=1.3,ry=0){
 b.push(x,y,Z(v),ry);b.box('b122Concrete',0,.08,0,w+.3,.16,d+.3,0,.8);
 const s=[0,0,1,1];wall(b,'b122HvacSide',-w/2,d/2,w/2,d/2,.16,.16+h,s);wall(b,'b122HvacSide',w/2,-d/2,-w/2,-d/2,.16,.16+h,[1,0,0,1]);
 wall(b,'b122HvacSide',w/2,d/2,w/2,-d/2,.16,.16+h,[.15,0,.55,1]);wall(b,'b122HvacSide',-w/2,-d/2,-w/2,d/2,.16,.16+h,[.5,0,.9,1]);
 quad(b,'b122HvacTop',[[-w/2,.16+h,d/2],[w/2,.16+h,d/2],[w/2,.16+h,-d/2],[-w/2,.16+h,-d/2]]);b.pop();
}
function lamp(b,x,v,side){b.cylinder('photoSteel',x,4.6,Z(v),.07,.11,9.2,8);b.rod('photoSteel',[x,9,Z(v)],[x+side*2.4,9.35,Z(v)],.05);b.box('photoSteel',x+side*2.6,9.3,Z(v),.7,.16,.3);b.box('lamp',x+side*2.6,9.21,Z(v),.5,.03,.2);b.circle(x,Z(v),.15);}
// sawhorse barricade: two crossed cut-out planes (front/back) on a thin footprint
function barricade(b,x,v,ry){b.push(x,0,Z(v),ry);b.plane('c123Barricade',0,.5,0,2.1,.8,0);b.plane('c123Barricade',0,.5,-.02,2.1,.8,Math.PI,0,.9);b.solid(0,0,2.1,.5);b.pop();}
function billboard(b,key,x,v,y,w,h,ry){b.push(x,0,Z(v),ry);b.plane(key,0,y,0,w,h);b.box('photoFrame',0,y,-.12,w+.3,h+.3,.18);b.box('photoSteel',0,y-h/2-.3,-.6,w,.08,.9);
 for(const s of[-1,1])b.rod('photoSteel',[s*w*.3,0,-.3],[s*w*.3,y-h/2,-.3],.14);b.pop();}
// camera station (photo): x=CX above the avenue's west curb line, v=0, eye 9 m; looks 0.182 rad left of the avenue
const CX=101.5,CYAW=.182,EYE=9;
export function createBlock122(mats){
 const b=new UrbanBatch(mats);b.push(CITY_ORIGIN.x,Y,CITY_ORIGIN.z,CITY_ANGLE);b.push(BX,0,BZ);
 // ---- ground: pale concrete/gravel lot inside the sidewalk ring, sidewalks on the avenue and cross-street sides
 vbox(b,'c123Lot',7.5,100,7.5,100,0,.035);b.walk(53.75,Z(53.75),92.5,92.5,.035);
 vbox(b,'sidewalk',7.5,104.5,100,104.5,0,.15);b.walk(56,Z(102.25),97,4.5,.15);
 vbox(b,'sidewalk',100,104.5,7.5,100,0,.15);b.walk(102.25,Z(53.75),4.5,92.5,.15);vbox(b,'photoGranite',104.3,104.5,7.5,104.5,0,.17);
 for(let k=0;k<5;k++){const x=30+k*9;b.box('white',x,.04,Z(30),.1,.01,6,0,.4);}
 // ---- Nick's Gaslight: one-storey red brick bar, front square to the camera, right side to the avenue sidewalk
 const nx0=82.5,nx1=100,nv0=56,nv1=70,nh=4.4;
 vbox(b,'b122Brick',nx0,nx1,nv0,nv1,0,nh);b.solid((nx0+nx1)/2,Z((nv0+nv1)/2),nx1-nx0,nv1-nv0);
 wall(b,'c123NickFront',nx0,Z(nv0)+.02,nx1,Z(nv0)+.02,0,nh);
 wall(b,'c123NickSide',nx1+.02,Z(nv0),nx1+.02,Z(nv1),0,nh);
 vbox(b,'b122Roof',nx0+.2,nx1-.2,nv0+.2,nv1-.2,nh,nh+.05);
 vbox(b,'b122Brick',nx0+.3,nx1-.3,nv0+7.5,nv1-.3,nh,6.2,.85);vbox(b,'b122Roof',nx0+.2,nx1-.2,nv0+7.4,nv1-.2,6.2,6.3,.75); // raised rear bay with its grey roof
 for(const[x0,x1,v0,v1]of[[nx0,nx1,nv0,nv0+.25],[nx0,nx1,nv1-.25,nv1],[nx0,nx0+.25,nv0,nv1],[nx1-.25,nx1,nv0,nv1]])vbox(b,'b122Brick',x0,x1,v0,v1,nh,nh+.6);
 vbox(b,'b122Stone',nx0-.05,nx1+.05,nv0-.06,nv0+.3,nh+.6,nh+.72,.8);
 vbox(b,'b122Brick',nx0+2,nx0+3.1,nv1-3,nv1-1.9,nh,nh+2.6);vbox(b,'b122Stone',nx0+1.9,nx0+3.2,nv1-3.1,nv1-1.8,nh+2.6,nh+2.75,.8);
 hvac(b,nx0+7,nv0+5,nh+.05);hvac(b,nx0+11,nv0+8,nh+.05,2,1.4,1.1,.3);
 b.box('photoSteel',nx1-3,nh+1.2,Z(nv0+4),.08,2.4,.08);b.sphere('white',nx1-3.2,nh+2.3,Z(nv0+3.8),.45,.45,.12);
 vbox(b,'photoBlue',nx1-6,nx1-4.8,nv0+8,nv0+8.8,nh,nh+1.1,.8);
 b.box('photoSteel',nx1-2.2,nh+1.7,Z(nv1-2),.08,3.4,.08);b.box('photoSteel',nx1-4.4,nh+1.7,Z(nv1-2),.08,3.4,.08);b.box('white',nx1-3.3,nh+3,Z(nv1-2),3,1.5,.08,0,.95);
 // big dish on a mast behind the bar's left end (reads against the hotel base in the photo)
 b.cylinder('photoSteel',nx0+1.2,4.2,Z(nv1+1.5),.09,.11,8.4,8);b.sphere('white',nx0+1.2,7.4,Z(nv1+1.2),1.25,1.25,.35);b.rod('photoSteel',[nx0+1.2,7.4,Z(nv1+1.2)-.2],[nx0+1.2,7.4,Z(nv1+1.2)-1.1],.03);
 // wooden utility pole with a grey transformer box at the bar's front-left corner
 b.cylinder('c123Pole',nx0+3,3.8,Z(nv0-1.2),.13,.16,7.6,8);b.box('b122Concrete',nx0+3,5.4,Z(nv0-1.45),.55,.8,.42,0,.95);b.box('c123Pole',nx0+3,7.2,Z(nv0-1.2),1.8,.12,.12);
 // ---- sawhorse barricades along the lot's cross-street edge and by the bar
 for(let k=0;k<8;k++)barricade(b,38+k*2.25,93,0);for(let k=0;k<4;k++)barricade(b,64+k*2.25,93.5,.04);barricade(b,78,74,.5);barricade(b,59.5,93.2,0);
 // ---- cars parked on the cross street's near kerb, one by the bar
 for(const[x,kind,t]of[[18,'sedan',1],[27,'suv',.9],[36,'sedan',.8],[51,'sedan',1],[60,'suv',.95],[72,'sedan',.85]])car122(b,kind,x,Z(108.6),Math.PI/2,{tone:t});
 // ---- 1920s hotel across the cross street (block 1,1): 14 bays x 21 floors, long face toward the lot, short face toward the avenue
 {const ry=-.555,W=52,D=39.5,base=14,top=62.6,cornerX=40.8,cornerV=125;
  const a=[Math.cos(-ry),-Math.sin(-ry)],n=[-a[1],a[0]]; // a=(.85,-.527) along the front, n=(.527,.85) into the building
  const cx=cornerX-a[0]*W/2+n[0]*D/2,cv=cornerV-a[1]*W/2+n[1]*D/2;
  obox(b,cx,cv,W,D,0,base,ry,{front:['c123HotelBase',W/34.7,1],right:['c123HotelBase2',D/33,1],back:['b122Brick',W/3,base/3,.8],left:['b122Brick',D/3,base/3,.8]},{roof:null});
  obox(b,cx,cv,W,D,base,top,ry,{front:['c123HotelLong',26/6,18/7],right:['c123HotelShort',2,3],back:['b122HotelUp',W/28,(top-base)/28,.9],left:['b122HotelSide',1,(top-base)/D,.95]},{solid:false});
  b.push(cx,0,Z(cv),ry);
  b.box('b122Stone',0,base+.25,0,W+.5,.6,D+.5,0,.95);b.box('b122Stone',0,base-4.8,0,W+.24,.3,D+.24,0,.9); // belt courses
  b.box('b122Stone',0,top+.5,0,W+.9,1,D+.9,0,.92);b.box('b122Stone',0,top+1.25,0,W+.3,.5,D+.3,0,.85); // cornice + parapet
  b.box('b122Stone',W/2-11,top+3.4,D/2-9,16,3.8,12,0,.88);b.box('b122Stone',W/2-11,top+5.45,D/2-9,16.6,.3,12.6,0,.8); // crown penthouse near the corner
  for(const s of[-1,1])b.box('b122Stone',s*(W/2-.3),(base+top)/2,D/2+.12,.8,top-base,.3,0,.93); // corner piers, front
  b.box('b122Stone',W/2+.12,(base+top)/2,-D/2+.4,.3,top-base,.8,0,.93);
  b.cylinder('b122Brick',-W/2+12,top+4.2,-D/2+10,1.6,1.6,3.2,10,0,0,.8);b.box('photoSteel',-W/2+12,top+2.2,-D/2+10,2.4,1.6,2.4,0,.6); // water tank
  b.cylinder('photoSteel',W/2-6,top+8.5,D/2-6,.06,.06,6,6);
  b.pop();}
 // ---- behind the hotel (block 1,1 north row): two beige mid-rises
 obox(b,101.5-50,200,10,20,0,29.5,0,{front:['b122MidA',10/16,29.5/16],right:['c123MidASide',20/14,29.5/16,.92,27.7,29.5]});
 obox(b,101.5-33.5,200,23,20,0,27.7,0,{front:['b122MidB',23/14,27.7/14],right:['c123MidBSide',20/14,27.7/14,.9]});
 b.box('b122Stone',101.5-50,29.9,Z(200),10.3,.8,20.3,0,.85);b.box('b122Stone',101.5-33.5,28.1,Z(200),23.3,.8,20.3,0,.85);
 hvac(b,101.5-36,198,28.5,3.2,2,1.6);hvac(b,101.5-28,203,28.5,2.6,1.6,1.3,.4);
 // ---- block (1,1) cross-street row east of the hotel: 3-storey brick behind the bar, 2-storey brown with a rooftop billboard
 obox(b,92,136,11,20,0,10.5,0,{front:['c123Brick3',1,1],right:['c123Brick3Side',1,1,.9],back:['b122Brick',11/3,3.5,.8],left:['b122Brick',20/3,3.5,.8]});
 obox(b,71,137,18,18,0,7.5,0,{front:['c123Brown2',1,1],right:['b122Brick',6,2.5,.62],back:['b122Brick',6,2.5,.6],left:['b122Brick',6,2.5,.6]});
 billboard(b,'b122BillB',70,140,10.6,9,3,0);
 // ---- avenue lamps (west sidewalk x 102.6, east sidewalk x 121) far down the avenue
 for(let v=34;v<330;v+=26){lamp(b,102.6,v,1);lamp(b,121.2,v+13,-1);}
 // ---- east of the avenue: red-brick loft (near right), low dark annex, KQB billboard, yellow tower, Gothic hall
 obox(b,138,82,28,36,0,22.6,0,{front:['c123NearN',28/18,22.6/20.4],left:['b122RedTower',36/18,22.6/18],back:['b122Brick',9,7.5,.6],right:['b122Brick',12,7.5,.6]});
 b.box('b122Stone',138,22.85,Z(82),28.3,.5,36.3,0,.7);vbox(b,'photoShade',124.05,124.3,66,98,0,4.2,.8);
 billboard(b,'b122BillA',127.5,158,7.6,8,2.8,-.12);
 obox(b,144.5,246,13,20,0,29.5,0,{front:['c123YellowMain',13/12,29.5/12],left:['c123YellowSide',20/12,29.5/12,.88],right:['c123YellowSide',20/12,29.5/12,.8,0,29.5,.5]});
 obox(b,154,247,6,18,0,24,0,{front:['c123YellowWing',6/9,24/14]},{});
 b.box('b122Stone',144.5,29.9,Z(246),13.3,.8,20.3,0,.82);hvac(b,142.5,250,30.3,3,2,1.5);
 {const gx0=123.5,gx1=146.5,gv0=300,gv1=324,gh=32;
  obox(b,(gx0+gx1)/2,(gv0+gv1)/2,gx1-gx0,gv1-gv0-.6,0,gh*.62,0,{left:['c123GothicSide',(gv1-gv0)/24,1,.9],right:['b122Brick',8,6,.7],back:['b122Brick',8,6,.7]});
  wall(b,'b122Gothic',gx0,Z(gv0),gx1,Z(gv0),0,gh); // cut-out front incl. roofline, gables and turret, square to the avenue view
  vbox(b,'b122Roof',gx0+.3,gx1-.3,gv0+.6,gv1-.6,gh*.62,gh*.65,.8);}
 // chain-link fence + parked car in front of the yellow tower (block 2,1 corner lot)
 for(let x=126;x<152;x+=2.5){b.cylinder('photoSteel',x,.9,Z(220),.03,.03,1.8,5);}b.box('photoSteel',139,1.78,Z(220),26,.04,.04);b.plane('photoShade',139,.9,Z(220),26,1.7,0,0,.35);
 car122(b,'suv',134,Z(215),Math.PI/2+.2,{tone:.85});
 // ---- people-mover guideway the photo camera stands on, square to the photo (it crosses the grid at the photo's angle)
 {b.push(CX,0,Z(0),CYAW);
  const deck=EYE-1.75;b.box('b122Concrete',0,deck-.55,.6,120,1.1,3.8);b.box('b122Concrete',0,deck-1.5,.6,120,.8,2.2,0,.85);
  for(const x of[-48,-22,30])b.cylinder('b122Concrete',x,(deck-1.1)/2,.6,.55,.6,deck-1.1,10);
  b.box('b122Concrete',0,deck+.45,-1.25,120,.9,.18,0,.9); // far parapet
  b.cylinder('c123Navy',0,deck+1.38,-1.5,.12,.12,120,14,0,Math.PI/2); // the photo's foreground navy railing pipe (in front of the camera)
  for(let x=-58;x<=58;x+=4){b.box('c123Navy',x,deck+.68,-1.5,.06,1.36,.06);}
  b.rod('c123Navy',[-.55,deck+1.45,-1.62],[-.55,deck+1.6,-1.62],.012);b.sphere('c123Navy',-.55,deck+1.64,-1.62,.075,.055,.075);b.cylinder('c123Navy',-.55,deck+1.61,-1.62,.07,.07,.03,12);
  b.pop();}
 b.pop();b.pop();
 return{object:b.finish('L11 block 122 / Nick\'s Gaslight (ref image-48)'),colliders:b.colliders,walks:b.walks};
}
// F2 photo camera on the guideway, framing image-48 (V123 photogrammetric solve).
export function block122Waypoint(){const p=cityToWorld(BX+CX,BZ+112);return{...p,label:'图三 · 酒店与 Nick\'s Gaslight',yaw:CITY_ANGLE+CYAW,pitch:.091,eye:EYE,floorY:EYE-1.75,fov:36,referenceAspect:1024/698,range:560,urbanPhoto:true};}
