import * as T from './vendor/three.module.min.js';
import {polePoint,phasePoint,secondaryPoint,telcoPoint,makeCable} from './rural-power-layout.js?v=60';
const up=new T.Vector3(0,1,0),dummy=new T.Object3D(),color=new T.Color();
// Matrix + shape/taper/atlas/year + linear RGB. Authored once inside world worker.
export const POWER_STRIDE=23;
export function bakePowerPole(p){const groups=[[],[],[]],cables=[],co=Math.cos(p.angle),si=Math.sin(p.angle),k=Math.tan(p.lean||0);
 const root=new T.Matrix4().set(co,Math.sin(p.leanAngle)*k,si,p.x,0,1,0,p.y,-si,Math.cos(p.leanAngle)*k,co,p.z,0,0,0,1);
 const woodTile=p.year<1980?0:1,metal=p.year<1980?2:3,steel='#a3a89d',brown='#625044',copper='#77513a';
 function part(group,shape,tile,x,y,z,sx,sy,sz,hex='#ffffff',taper=1,rotation=null){dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.quaternion.identity();if(rotation)dummy.quaternion.copy(rotation);dummy.updateMatrix();dummy.matrix.premultiply(root);color.set(hex);groups[group].push(...dummy.matrix.elements,shape,taper,tile,p.year%100,color.r,color.g,color.b);}
 const box=(g,t,x,y,z,sx,sy,sz,c)=>part(g,1,t,x,y,z,sx,sy,sz,c);
 const cyl=(g,t,x,y,z,r,h,c,top=1)=>part(g,0,t,x,y,z,r*2,h,r*2,c,top);
 function beam(g,t,a,b,w,d=w,c=steel){const va=new T.Vector3(...a),vb=new T.Vector3(...b),q=new T.Quaternion().setFromUnitVectors(up,vb.clone().sub(va).normalize()),m=va.clone().add(vb).multiplyScalar(.5);part(g,1,t,m.x,m.y,m.z,w,va.distanceTo(vb),d,c,1,q);}
 const wire=(name,a,b,sag,kind=0)=>cables.push(makeCable(p.id+':'+name,polePoint(p,...a),polePoint(p,...b),sag,kind));
 const insulator=(x,y,z,type=p.insulator)=>{const glass=type==='glass',g=glass?2:1,c=glass?(p.seed%2?'#638d84':'#9c8754'):type==='polymer'?'#a7aaa0':'#4c3024',n=type==='polymer'?4:2,h=type==='polymer'?.30:.25;
  cyl(1,-1,x,y-.07,z,.025,.2,steel);cyl(g,-1,x,y+h/2,z,.062,h,c);
  for(let j=0;j<n;j++)cyl(g,-1,x,y+.035+j*(h-.04)/n,z,glass?.126:.112,.040,c,.66);
  return [x,y+h,z];
 };
 const h=p.h,top=h-.46;
 cyl(0,woodTile,0,h/2-.12,0,.185,h+.24,'#ffffff',.59);
 cyl(0,0,0,.32,0,.187,.82,'#6f6656',.97);
 // Stamped aluminium date nail plate at eye level, not floating text.
 part(1,2,-1,0,1.73,.181,.104,.133,.015,'#afa38a');
 for(const y of [1.68,1.78])cyl(1,-1,0,y,.195,.012,.016,steel);
 beam(1,-1,[.17,.10,0],[.112,h-.72,0],.010,.012,copper);
 box(0,woodTile,.186,1.22,0,.056,2.4,.045,'#8f5f4e');
 if(p.kind==='service'){
  box(1,2,0,h-.48,0,.66,.09,.08,steel);insulator(.25,h-.48,0,'porcelain');
  cyl(1,metal,.21,1.7,0,.13,.34,steel);box(1,2,.22,1.44,0,.22,.22,.17,steel);
 }else if(p.kind==='vertical'){
  for(let i=0;i<3;i++){const x=i%2?-.42:.42,y=h-.70-i*.52;beam(1,2,[0,y-.16,0],[x,y,0],.058,.045);insulator(x,y,0);}
 }else{
  const offset=p.kind==='alley'?p.side*.92:0,zs=p.kind==='double'?[-.22,.22]:[0];
  for(const z of zs){box(0,woodTile,offset,top,z,2.95,.18,.15);
   for(const sg of [-1,1])beam(1,2,[0,top-1.08,z],[offset+sg*1.05,top-.10,z],.045,.026);
   for(let i=0;i<3;i++)insulator(offset+(i-1)*1.08,top+.02,z);
  }
  if(p.kind==='double')for(let i=0;i<3;i++)wire('jumper-'+i,[(i-1)*1.08,h-.18,-.22],[(i-1)*1.08,h-.18,.22],.49,0);
  for(const y of [top,top-.73])beam(1,2,[0,y,-.33],[0,y,.33],.045,.045);
 }
 if(p.kind!=='service'){
  beam(1,2,[0,h-2.05,0],[.25,h-1.99,0],.06);insulator(.25,h-2.0,0,'porcelain');
  beam(1,2,[0,h-3.25,0],[-.23,h-3.25,0],.05);box(1,-1,-.23,h-3.25,0,.09,.09,.09,'#302e29');
  if(p.seed%3===0){const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2);part(1,0,-1,-.23,h-3.45,.44,.17,.72,.17,'#282a27',1,q);for(const z of [.15,.7])box(1,2,-.23,h-3.37,z,.035,.16,.035);}
 }
 if(p.transformer){const cy=h-2.30,cx=-.49;
  for(const y of [cy-.3,cy+.26])box(1,2,-.20,y,0,.52,.08,.11);
  cyl(1,metal,cx,cy,0,.30,.89,'#dadccc');cyl(1,metal,cx,cy+.46,0,.33,.07);cyl(1,2,cx,cy-.46,0,.305,.045);
  for(let j=0;j<5;j++)box(1,metal,cx-.29,cy,(j-2)*.095,.085,.58,.035);
  const bushing=insulator(cx,cy+.50,0,'porcelain');box(1,2,cx-.303,cy-.21,0,.015,.13,.2,'#a0a797');
  beam(1,-1,[cx,cy-.37,.28],[.17,cy-.37,0],.016,.016,copper);
  // Arrester and fuse cutout on a common bracket; 5% abandoned open fuse tubes.
  const by=h-1.03;box(1,2,-.48,by-.18,.18,.82,.065,.065);insulator(-.66,by-.13,.18,'porcelain');insulator(-.31,by-.13,.18,'polymer');
  const open=p.seed%20===0,lower=[-.68,by-.34,.27],upper=open?[-.72,by-.75,.31]:[-.99,by+.03,.34];beam(1,-1,lower,upper,.058,.058,'#b7ac8c');
  cables.push(makeCable(p.id+':cutout-feed',phasePoint(p,0),polePoint(p,-.99,by+.03,.34),.11));
  wire('transformer-feed',lower,bushing,.17);wire('arrester-ground',[-.31,by+.17,.18],[.17,by-.37,0],.11);
  wire('secondary-output',[cx+.17,cy+.28,.21],[.25,h-1.75,0],.17,1);
 }
 for(let i=0;i<p.guys.length;i++){const g=p.guys[i],a=polePoint(p,0,h-1.45,0),id=p.id+':guy:'+i;cables.push(makeCable(id,a,g,.035,3));
  const worldPart=(a,b,w,hex)=>{const v=new T.Vector3(b.x-a.x,b.y-a.y,b.z-a.z),len=v.length(),m=new T.Matrix4().compose(new T.Vector3((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2),new T.Quaternion().setFromUnitVectors(up,v.normalize()),new T.Vector3(w,len,w));color.set(hex);groups[1].push(...m.elements,0,1,-1,0,color.r,color.g,color.b);};
  const lerp=t=>({x:g.x+(a.x-g.x)*t,y:g.y+(a.y-g.y)*t,z:g.z+(a.z-g.z)*t});worldPart(lerp(.025),lerp(2.35/Math.hypot(a.x-g.x,a.y-g.y,a.z-g.z)),.07,p.seed%3?'#c1ab35':'#c3bd9d');worldPart(lerp(.48),lerp(.50),.11,brown);worldPart({x:g.x,y:g.y-.16,z:g.z},lerp(.022),.09,steel);
 }
 if(p.eave){const start=secondaryPoint(p),end={...p.eave,y:p.eave.y+.7};for(let i=0;i<3;i++)cables.push(makeCable(p.id+':drop:'+i,start,end,.85,1,i? .024:0,i*Math.PI));
  // Service mast, weatherhead and wall meter are attached to the actual eave.
  const dx=p.eave.x-p.x,dz=p.eave.z-p.z,x=co*dx-si*dz,z=si*dx+co*dz,y=p.eave.y-p.y;
  beam(1,2,[x,y-2.2,z],[x,y+.70,z],.07,.07);box(1,2,x,y+.72,z,.16,.12,.15);box(1,metal,x,y-2,z,.31,.38,.16);
 }
 return{groups:groups.map(a=>new Float32Array(a)),cables};
}
export function powerSpanCables(s){const out=[],r=(s.a.seed^s.b.seed)>>>0;
 if(s.kind==='service'){for(let i=0;i<3;i++)out.push(makeCable(s.id+':triplex:'+i,secondaryPoint(s.a),secondaryPoint(s.b),.8+(r%101)/200,1,i?.024:0,i*Math.PI));}
 else{for(let i=0;i<3;i++)out.push(makeCable(s.id+':phase:'+i,phasePoint(s.a,i,s.b),phasePoint(s.b,i,s.a),.35+(r%101)/100*.3,0));out.push(makeCable(s.id+':neutral',secondaryPoint(s.a),secondaryPoint(s.b),.8+(r%101)/200,1),makeCable(s.id+':telco',telcoPoint(s.a),telcoPoint(s.b),1.45+(r%101)/180,2));}
 return out;
}
