// V131-L11-shells (user 2026-10-17 20:51, files/uploads/image-ed75f26edc0e.webp): the Nick's Gaslight block (block122-scene.js)
// had several paper shells - mid-rises A/B with only a front + one side, the yellow tower without a back, the yellow wing as a
// single front plane, and the Gothic hall whose cut-out front stood 12 m above its box as a zero-thickness plane.
// This module closes them (every new face its own generated texture: art-l11v131sh -> tools/shells131_assets.py ->
// assets/l11-v131sh) and turns two of them into real-world fakes:
//  * Gothic hall = facade retention site: the cut-out becomes an extruded 0.6 m solid (front photo / separately generated rear
//    elevation / brick reveals), the avenue side wall is kept as a 0.5 m retained wall with its demolished-interior inner face,
//    the hall behind is gone - red-oxide steel retention frame, walers, ties, raking shores on kentledge blocks, hoarding.
//  * Yellow wing = "fake house" (cf. 145 rue La Fayette, Paris): painted-on windows, a door with no handle, and the roof is an
//    open black ventilation shaft behind a grille.
// All geometry goes through the block's UrbanBatch (merged per material), so the shells add no draw calls beyond their keys.
import * as T from './vendor/three.module.min.js';
import {GOTHIC131_POLY} from './shells131-data.js?v=131';
const A=new URL('./assets/l11-v131sh/',import.meta.url).href;
function tex(name,{srgb=true,repeat=true}={}){const t=new T.TextureLoader().load(A+name+'.webp?v=131');if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;if(repeat)t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
const FACES={s131MidALeft:'mida_left',s131MidABack:'mida_back',s131MidBBack:'midb_back',s131YellowBack:'yellow_back',s131FakeSide:'fake_side',s131FakeBack:'fake_back',
 s131PartyWall:'party_wall',s131HoardA:'hoarding_a',s131HoardB:'hoarding_b',s131GothicBack:'gothic_back'};
export function addShells131Materials(m){
 for(const[key,file]of Object.entries(FACES))m[key]=new T.MeshStandardMaterial({map:tex(file),normalMap:tex(file+'-n',{srgb:false}),normalScale:new T.Vector2(.7,.7),roughness:.86,vertexColors:true});
 m.s131FakeSide.roughness=m.s131FakeBack.roughness=.95; // painted render: no sheen on the painted "glass"
 m.s131GothicFront=new T.MeshStandardMaterial({map:tex('gothic_front',{repeat:false}),roughness:.8,vertexColors:true});
 m.s131Steel=new T.MeshStandardMaterial({color:0x7a3324,roughness:.62,metalness:.25,vertexColors:true});      // red-oxide primer
 m.s131Galv=new T.MeshStandardMaterial({color:0x8d9094,roughness:.5,metalness:.45,vertexColors:true});        // galvanised props/grille
 m.s131Void=new T.MeshBasicMaterial({color:0x020202,vertexColors:false,fog:false});                           // the shaft has no bottom
 return m;
}
// ---------- geometry helpers (block frame: x = block-local x, v = view distance, z = 112 - v)
function geo(pos,uv,nrm){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(nrm,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return g;}
function addGeo(b,key,g,tone=1){b.add(g,key,0,0,0,1,1,1,0,0,0,tone);g.dispose();}
// Gothic facade solid: polygon (0..1 of the cut-out) scaled to w x h at x0, front plane z0, thickness t toward -z
function facadeSolid(b,x0,z0,w,h,t){
 let P=GOTHIC131_POLY.map(([u,v])=>new T.Vector2(u,v));if(T.ShapeUtils.isClockWise(P))P=P.reverse();
 const tris=T.ShapeUtils.triangulateShape(P,[]),X=u=>x0+u*w,Yh=v=>v*h;
 const fp=[],fu=[],fn=[],bp=[],bu=[],bn=[];
 for(const[a,c,d]of tris){for(const i of[a,c,d]){fp.push(X(P[i].x),Yh(P[i].y),z0);fu.push(P[i].x,P[i].y);fn.push(0,0,1);}
  for(const i of[a,d,c]){bp.push(X(P[i].x),Yh(P[i].y),z0-t);bu.push(P[i].x,P[i].y);bn.push(0,0,-1);}}
 addGeo(b,'s131GothicFront',geo(fp,fu,fn));addGeo(b,'s131GothicBack',geo(bp,bu,bn),.92);
 // reveals: one quad per outline edge (CCW -> outward normal (dy,-dx)), brick tiled 3 m
 const sp=[],su=[],sn=[];let run=0;
 for(let i=0;i<P.length;i++){const p=P[i],q=P[(i+1)%P.length],ax=X(p.x),ay=Yh(p.y),bx=X(q.x),by=Yh(q.y),L=Math.hypot(bx-ax,by-ay);if(L<1e-4)continue;
  const nx=(by-ay)/L,ny=-(bx-ax)/L,u0=run/3,u1=(run+L)/3;run+=L;
  sp.push(ax,ay,z0,bx,by,z0-t,bx,by,z0, ax,ay,z0,ax,ay,z0-t,bx,by,z0-t);su.push(u0,0,u1,t/3,u1,0, u0,0,u0,t/3,u1,t/3);for(let k=0;k<6;k++)sn.push(nx,ny,0);}
 addGeo(b,'b122Brick',geo(sp,su,sn),.78);
}
// silhouette height (m) of the Gothic facade at facade-local u (0..1)
function gothicTop(u){let best=0;const P=GOTHIC131_POLY;for(let i=1;i<P.length-1;i++){const p=P[i],q=P[i+1];if((p[0]-u)*(q[0]-u)<=0&&q[0]!==p[0]){best=Math.max(best,p[1]+(q[1]-p[1])*(u-p[0])/(q[0]-p[0]));}}return best;}
function minTop(u0,u1){let m=1;for(let k=0;k<=8;k++)m=Math.min(m,gothicTop(u0+(u1-u0)*k/8));return m;}
// I-section member as two flanges + web (boxes), axis along y
function column(b,x,z,h,y0=0,s=.36){b.box('s131Steel',x,y0+h/2,z,s,h,.05);b.box('s131Steel',x,y0+h/2,z-s/2+.025,s,h,.05,0,.9);b.box('s131Steel',x,y0+h/2,z+s/2-.025,s,h,.05,0,.9);b.box('s131Steel',x,y0+h/2,z,.04,h,s,0,.95);}
function kentledge(b,x,z,n=2){for(let i=0;i<n;i++)for(const dx of[-.8,.8])b.box('b122Concrete',x+dx,.45+i*.92,z,1.5,.9,1.5,0,.82+.06*((i+dx>0)?1:0));b.rod('s131Galv',[x-.3,n*.92,z],[x+.3,n*.92+.25,z],.03);}
function hoarding(b,ax,az,bx,bz,{h=2.4,sign=true}={}){
 // ply box + printed outer face (A = developer banner once, B = posters with hashed offsets), posts every 2.4 m on the inside
 const L=Math.hypot(bx-ax,bz-az),ux=(bx-ax)/L,uz=(bz-az)/L,nx=-uz,nz=ux,ry=Math.atan2(-uz,ux);
 b.box('c123Pole',(ax+bx)/2-nx*.04,h/2,(az+bz)/2-nz*.04,L,h,.06,ry,.9);b.solid((ax+bx)/2,(az+bz)/2,L,.3,ry);
 // B tile = 2.05 m wide x 2.4 m (its source crop is 0.26 of the 2.36:1 hoarding photo -> ~0.86:1)
 const aW=5.7,bW=2.05,segs=[];const fillB=(s0,s1)=>{let s=s0;while(s1-s>.01){const w=Math.min(3.6,s1-s);segs.push([s,w,0]);s+=w;}};
 if(sign&&L>aW+1){const a0=(L-aW)/2;fillB(0,a0);segs.push([a0,aW,1]);fillB(a0+aW,L);}else fillB(0,L);
 segs.forEach(([s,w,isA],k)=>{const key=isA?'s131HoardA':'s131HoardB',off=isA?0:((k*.37)%1),ur=isA?1:w/bW;
  const p0x=ax+ux*s+nx*.012,p0z=az+uz*s+nz*.012,p1x=p0x+ux*w,p1z=p0z+uz*w;
  addGeo(b,key,geo([p0x,0,p0z,p1x,0,p1z,p1x,h,p1z, p0x,0,p0z,p1x,h,p1z,p0x,h,p0z],[off,0,off+ur,0,off+ur,1, off,0,off+ur,1,off,1],[nx,0,nz,nx,0,nz,nx,0,nz,nx,0,nz,nx,0,nz,nx,0,nz]),.95);});
 for(let d=0;d<=L;d+=2.4)b.box('c123Pole',ax+ux*d-nx*.15,h/2+.1,az+uz*d-nz*.15,.1,h+.2,.1,ry,.75);
}
// ---------- roof kits (parapet, plant room, water tank on legs, skylights, vents, HVAC)
export function roofKit131(b,H,cx,cv,w,d,top,{parapet=true,tank=true,room=true,sky=2,hvac=true,seed=1}={}){
 const z=H.Z(cv),pw=.25,ph=1.05;
 if(parapet){
 for(const[x,zz,ww,dd]of[[cx,z+d/2-pw/2,w,pw],[cx,z-d/2+pw/2,w,pw],[cx-w/2+pw/2,z,pw,d],[cx+w/2-pw/2,z,pw,d]])b.box('b122Stone',x,top+ph/2,zz,ww,ph,dd,0,.86);
 for(const[x,zz,ww,dd]of[[cx,z+d/2-pw/2,w+.12,pw+.12],[cx,z-d/2+pw/2,w+.12,pw+.12],[cx-w/2+pw/2,z,pw+.12,d],[cx+w/2-pw/2,z,pw+.12,d]])b.box('b122Concrete',x,top+ph+.04,zz,ww,.08,dd,0,.95);} // coping
 const r=k=>((Math.sin(seed*91.7+k*37.3)*43758.5)%1+1)%1;
 if(room){const rw=Math.min(4.2,w*.4),rd=Math.min(3.4,d*.25),rx=cx-w/2+rw/2+1.2,rz=z-d/2+rd/2+1.4;b.box('b122Concrete',rx,top+1.45,rz,rw,2.9,rd,0,.9);b.box('b122Stone',rx,top+2.95,rz,rw+.2,.12,rd+.2,0,.8);
  b.box('photoSteel',rx+rw*.18,top+1.05,rz+rd/2+.02,.9,2.0,.05,0,.8);b.box('photoSteel',rx-rw*.25,top+2.2,rz+rd/2+.02,.7,.5,.05,0,.6);}
 if(tank){const tx=cx+w/2-2.4,tz=z-d/2+2.6,ty=top+2.2;for(const[dx,dz]of[[-.9,-.9],[.9,-.9],[.9,.9],[-.9,.9]])b.rod('photoSteel',[tx+dx,top,tz+dz],[tx+dx*.8,ty,tz+dz*.8],.06);
  b.box('photoSteel',tx,ty,tz,2.1,.12,2.1,0,.7);b.cylinder('c123Pole',tx,ty+1.4,tz,1.05,1.05,2.6,12,0,0,.82);b.cylinder('photoSteel',tx,ty+2.75,tz,.25,1.12,.4,12,0,0,.7);
  for(const yy of[.5,1.4,2.3])b.cylinder('photoSteel',tx,ty+yy,tz,1.08,1.08,.05,12,0,0,.55);}
 for(let k=0;k<sky;k++){const sx=cx-w*.15+k*w*.22,sz=z+d*.12*(k%2?1:-1);b.box('b122Concrete',sx,top+.25,sz,1.8,.5,1.2,0,.9);b.box('photoGlass',sx,top+.55,sz,1.6,.1,1.0,0,.9);}
 for(let k=0;k<3;k++)b.cylinder('photoSteel',cx-w/2+1.2+r(k)*(w-2.4),top+.45,z-d/2+1+r(k+5)*(d-2),.11,.11,.9,6,0,0,.75);
 if(hvac)H.hvac(b,cx+w*.1,cv+d*.18,top+.02,2.4,1.5,1.2,.0);
}
// ---------- the four shells
export function addShells131(b,H){
 const{Z,wall,quad}=H;
 // mid-rise A (10 x 20 x 29.5, cap top 30.3) and B (23 x 20 x 27.7, cap top 28.5): roofs
 // These three roofs sit on the F2 photo-block122 skyline, so they only get low dressing (skylights, vents, one HVAC) that
 // stays under the existing cap silhouette from the guideway camera; parapets / tanks / plant rooms changed the photo's roofline.
 roofKit131(b,H,51.5,200,10,20,30.3,{parapet:false,tank:false,room:false,sky:1,seed:3});
 roofKit131(b,H,68,200,23,20,28.5,{parapet:false,tank:false,room:false,sky:2,seed:7});
 roofKit131(b,H,144.5,246,13,20,30.3,{parapet:false,tank:false,room:false,sky:1,hvac:false,seed:11});
 fakeHouse(b,H);gothicRetention(b,H);
}
function fakeHouse(b,H){
 // obox(154,247,6,18,0,24) front stays the V123 wing photo; block122 gives it the painted right + back faces. Roof = shaft.
 const{Z}=H,x0=151,x1=157,v0=238,v1=256,top=24,ring=.9;
 // roof ring around a 4.2 x 16.2 opening, with a parapet and a galvanised grille over the void
 for(const[a,c,e,f]of[[x0,x1,v0,v0+ring],[x0,x1,v1-ring,v1],[x0,x0+ring,v0+ring,v1-ring],[x1-ring,x1,v0+ring,v1-ring]])H.vbox(b,'b122Roof',a,c,e,f,top-.25,top,.8);
 for(const[a,c,e,f]of[[x0,x1,v0,v0+.25],[x0,x1,v1-.25,v1],[x0,x0+.25,v0,v1],[x1-.25,x1,v0,v1]])H.vbox(b,'c123YellowWing',a,c,e,f,top,top+.9,.9);
 // the shaft: black void walls down 8 m (no floor drawn - you look into nothing), lip in grey render
 const ix0=x0+ring,ix1=x1-ring,iv0=v0+ring,iv1=v1-ring,d=8;
 H.vbox(b,'s131Void',ix0-.05,ix0,iv0,iv1,top-d,top-.25);H.vbox(b,'s131Void',ix1,ix1+.05,iv0,iv1,top-d,top-.25);H.vbox(b,'s131Void',ix0,ix1,iv0-.05,iv0,top-d,top-.25);H.vbox(b,'s131Void',ix0,ix1,iv1,iv1+.05,top-d,top-.25);
 H.vbox(b,'s131Void',ix0,ix1,iv0,iv1,top-d-.05,top-d);
 for(let v=iv0+.6;v<iv1;v+=.6)b.box('s131Galv',(ix0+ix1)/2,top-.08,Z(v),ix1-ix0,.06,.05);
 for(const x of[ix0+.8,(ix0+ix1)/2,ix1-.8])b.box('s131Galv',x,top-.12,Z((iv0+iv1)/2),.08,.12,iv1-iv0);
 // a lone fan cowl on the ring and a wired-shut access hatch
 b.cylinder('s131Galv',x0+.45,top+.55,Z(v1-.45),.3,.3,1.1,10,0,0,.8);b.box('b122Concrete',x1-.45,top+.15,Z(v0+.45),.7,.3,.7,0,.85);
}
function gothicRetention(b,H){
 const{Z,wall}=H,gx0=123.5,gx1=146.5,gv0=300,gv1=324,gh=32,W=gx1-gx0,t=.6,sideH=gh*.62,zf=Z(gv0);
 // 1) retained front: extruded silhouette solid
 facadeSolid(b,gx0,zf,W,gh,t);b.solid((gx0+gx1)/2,zf-t/2,W,t);
 // 2) retained avenue side wall: outer = V123 c_gothic_side, inner = demolished-interior party wall, coping + end reveal
 const sv0=gv0+t,sv1=gv1,sw=.5;
 wall(b,'c123GothicSide',gx0,Z(sv1),gx0,Z(sv0),0,sideH,[0,0,(sv1-sv0)/24,1],.9);
 wall(b,'s131PartyWall',gx0+sw,Z(sv0),gx0+sw,Z(sv1),0,sideH,[0,0,1,1],.9);
 b.box('b122Stone',gx0+sw/2,sideH+.15,Z((sv0+sv1)/2),sw+.16,.3,sv1-sv0,0,.85);
 wall(b,'b122Brick',gx0+sw,Z(sv1),gx0,Z(sv1),0,sideH,[0,0,sw/3,sideH/3],.75); // broken-off end, faces the rear
 b.box('b122Brick',gx0+sw/2,sideH/2,Z(sv0)-.0,sw,sideH,.02,0,.7);
 b.solid(gx0+sw/2,Z((sv0+sv1)/2),sw,sv1-sv0);
 // 3) site ground (gravel/lot), a puddle and spoil
 H.vbox(b,'c123Lot',gx0+sw,gx1,sv0,sv1,0,.04,.78);b.box('photoShade',137,.045,Z(316),5,.005,3.2,.3,.5);b.sphere('c123Lot',141.5,.1,Z(320),2.4,.9,1.8,.7);
 // 4) steel retention frame 2.6 m behind the front: columns follow the silhouette (stay hidden behind it from the street),
 //    walers every 4 m tied back to the facade, X-bracing, raking shores down onto kentledge blocks
 const fv=gv0+t+2.6,fz=Z(fv),cols=[];for(let k=0;k<6;k++){const x=gx0+1.4+k*(W-2.8)/5,u=(x-gx0)/W,hh=Math.max(8,minTop(Math.max(0,u-.06),Math.min(1,u+.06))*gh-1.8);cols.push([x,hh]);column(b,x,fz,hh);b.solid(x,fz,.5,.5);}
 for(let y=4;y<gh;y+=4){for(let k=0;k<cols.length-1;k++){const[xa,ha]=cols[k],[xb,hb]=cols[k+1];if(y>Math.min(ha,hb)-.3)continue;b.box('s131Steel',(xa+xb)/2,y,fz,xb-xa,.32,.22,0,.92);
   b.rod('s131Steel',[xa,y-4+.3,fz],[xb,y-.3,fz],.06);b.rod('s131Steel',[xb,y-4+.3,fz],[xa,y-.3,fz],.06);}
  for(const[x,hh]of cols)if(y<hh-.3){b.box('s131Steel',x,y,(fz+zf-t)/2,.18,.18,zf-t-fz,0,.85);b.box('s131Galv',x,y,zf-t-.04,.5,.5,.08,0,.8);}}
 for(const[x,hh]of cols){const top=Math.min(hh-1,14),fv2=fv+11;b.rod('s131Steel',[x,top,fz],[x,1.6,Z(fv2)],.13);b.rod('s131Steel',[x,top*.55,fz],[x,1.0,Z(fv2-4)],.09);kentledge(b,x,Z(fv2+.3),2);}
 // side wall frame (behind the retained avenue wall), kept below the wall head so the avenue view is unchanged
 const sx=gx0+sw+2.4;for(let v=sv0+3;v<sv1-1;v+=5){column(b,sx,Z(v),sideH-1.2);b.solid(sx,Z(v),.5,.5);for(let y=4;y<sideH-1;y+=4){b.box('s131Steel',(sx+gx0+sw)/2,y,Z(v),sx-gx0-sw,.18,.18,0,.85);}
  b.rod('s131Steel',[sx,sideH*.55,Z(v)],[sx+8,1.4,Z(v)],.11);kentledge(b,sx+8.3,Z(v),1);}
 for(let y=4;y<sideH-1.5;y+=4)b.box('s131Steel',sx,y,Z((sv0+3+sv1-1)/2),.22,.3,sv1-sv0-3,0,.9);
 // 5) hoarding closes the rear and the east side of the site (the hall itself is gone)
 hoarding(b,gx1,Z(gv0+t),gx1,Z(gv1),{sign:true});hoarding(b,gx1,Z(gv1),gx0+sw,Z(gv1),{sign:false});
 // site gate in the east hoarding, an orange lamp and a notice
 b.box('photoSteel',gx1+.03,1.2,Z(gv0+6),.06,2.3,3.2,0,.7);b.sphere('photoAmber'in b.mats?'photoAmber':'white',gx1+.12,2.55,Z(gv0+4.2),.12,.12,.12);
}
