import * as T from './vendor/three.module.min.js';
import {TikiKit} from './tiki-geometry-v76.js';
import {material80,texture80} from './tiki-additions-materials-v80.js';
import {TIKI_FACADE as F,tikiPoint} from './tiki-plan-v76.js';
export const TERRACE80={x:-1.8,z:1.39,chairs:[{x:-2.70,z:1.53,yaw:.70},{x:-.90,z:1.53,yaw:-.70}],plants:[{x:-3.68,z:.95,h:1.90,kind:'areca'},{x:.22,z:.99,h:1.48,kind:'bird-of-paradise'},{x:-9.65,z:.90,h:1.58,kind:'monstera'},{x:7.09,z:.85,h:1.95,kind:'areca'},{x:11.64,z:.87,h:1.36,kind:'fern'}]};
function insert(k,part,x,y,z,yaw=0){const matrix=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(0,yaw,0)),new T.Vector3(1,1,1));for(const [key,gs]of part.groups)for(const g of gs)k.add(g.applyMatrix4(matrix),key);part.groups.clear();}
function chair(k,x,z,yaw){const c=new TikiKit(k.m);
 // Curved cane back, four splayed feet, seat rails and two complete curved arms.
 for(const side of[-1,1]){
  c.tube('rattan',[[side*.27,.025,.25],[side*.265,.40,.22],[side*.29,.67,.20],[side*.29,.69,-.09],[side*.27,.66,-.245]],.025,23);
  c.tube('rattan',[[side*.29,.023,-.31],[side*.245,.42,-.245],[side*.30,.71,-.28],[side*.26,.99,-.32],[side*.16,1.06,-.345],[0,1.085,-.35]],.027,29);
  c.beam('rattan',[side*.27,.44,.25],[side*.25,.44,-.28],.023,8);
  c.tube('rattan',[[side*.26,.20,.22],[side*.24,.15,-.02],[side*.26,.20,-.27]],.022,18);
  for(const zz of[-.16,.04,.20])c.beam('rattan',[side*.273,.455,zz],[side*.284,.645,zz],.010,6);
 }
 for(const y of[.205,.415]){c.beam('rattan',[-.27,y,.23],[.27,y,.23],.022,8);c.beam('rattan',[-.27,y,-.265],[.27,y,-.265],.022,8);}
 for(let i=-3;i<=3;i++){const x=i*.075;c.beam('rattan',[x,.45,-.275],[x,.95+(.20-Math.abs(x))*.22,-.329],.009,6);}
 c.box('fabric',0,.493,-.004,.51,.108,.52,.05);
 // Back cushion leans with the cane frame, not through it.
 const back=new TikiKit(k.m);back.box('fabric',0,0,0,.48,.465,.10,.044);const rot=new T.Matrix4().makeRotationX(-.105);for(const [key,gs]of back.groups)for(const g of gs)c.add(g.applyMatrix4(rot),key,0,.779,-.258);
 // Cord piping follows each cushion edge, with visible rounded corners.
 c.tube('seam',[[-.225,.548,.21],[.225,.548,.21],[.245,.548,.19],[.245,.548,-.22],[.225,.548,-.244],[-.225,.548,-.244],[-.245,.548,-.22],[-.245,.548,.19],[-.225,.548,.21]],.006,42);
 for(const side of[-1,1])for(const y of[.438,.653])for(let i=0;i<4;i++){const a=y+i*.005;c.add(new T.TorusGeometry(.027,.003,4,8),'binding',side*.273,a,.20,[Math.PI/2,0,0]);}
 insert(k,c,x,0,z,yaw);
}
function mask(k,x,y,z,index){
 const w=.29,h=1.10,n=26,m=62,p=[],uv=[],e=index?.365:.345,nose=index?.527:.493,mouth=index?.683:.631;
 const point=(i,j)=>{const u=i/n,v=j/m,xx=u*2-1,edge=Math.pow(Math.max(.002,Math.sin(Math.PI*v)),.25),gx=xx*w*.5*(.65+.35*edge);let depth=.055*Math.sqrt(Math.max(0,1-xx*xx));
  const gauss=(xc,yc,sx,sy)=>Math.exp(-(((xx-xc)/sx)**2)-(((v-yc)/sy)**2));
  depth+=.084*gauss(0,nose,.22,.075)+.041*gauss(0,e-.066,.80,.031)-.032*(gauss(-.42,e,.20,.035)+gauss(.42,e,.20,.035))-.04*gauss(0,mouth,.50,.045)+.028*gauss(0,mouth+.065,.65,.021);
  return[gx,(.5-v)*h,.022+depth];};
 const tri=(ids)=>{for(const [i,j]of ids){p.push(...point(i,j));uv.push(i/n,1-j/m);}};
 for(let j=0;j<m;j++)for(let i=0;i<n;i++){tri([[i,j],[i,j+1],[i+1,j]]);tri([[i+1,j],[i,j+1],[i+1,j+1]]);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();k.add(g,index?'maskRight':'maskLeft',x,y,z);
 k.box('wood',x,y,z+.012,w*.83,h*.93,.035,.023);
 for(const yy of[y-.40,y+.40])k.box('black',x,yy,z-.04,.055,.045,.12,.006);
}
function planter(k,p){const {x,z,h,kind}=p,py=.36;
 k.add(new T.LatheGeometry([[0,0],[.23,0],[.235,.035],[.285,.34],[.30,.35],[.30,.39],[.269,.39],[.256,.34],[.202,.04],[0,.04]].map(a=>new T.Vector2(...a)),16),'pot',x,0,z);
 k.cyl('soil',x,.335,z,.25,.25,.03,16);
 for(let j=0;j<3;j++){const a=j*Math.PI/3+.17;const ww=h*.85,hh=h-py; k.plane(kind,x,py+hh*.5,z,ww,hh,[0,a,0]);}
 // A lower independent fern fills the bare planter rim, stems stay rooted.
 if(kind!=='fern')for(let j=0;j<2;j++)k.plane('fern',x,.62,z,.76,.58,[0,j*Math.PI/2+.44,0]);
}
export function createTerrace80(){
 const m={wood:material80('lounge','walnut',{roughness:.61}),rattan:material80('lounge','rattan',{roughness:.56}),bamboo:material80('lounge','bamboo',{roughness:.62}),fabric:material80('lounge','fabric',{roughness:.96,normalScale:new T.Vector2(.36,.36)}),maskLeft:material80('lounge','mask-left',{roughness:.54}),maskRight:material80('lounge','mask-right',{roughness:.54})};
 m.black=m.wood.clone();m.black.color.setHex(0x242625);m.black.roughness=.44;m.seam=m.fabric.clone();m.seam.color.setHex(0x585e42);m.binding=m.rattan.clone();m.binding.color.setHex(0x887348);m.pot=m.wood.clone();m.pot.color.setHex(0x4b4b37);m.pot.roughness=.9;m.soil=m.maskLeft.clone();m.soil.color.setHex(0x4b3d2c);m.soil.roughness=1;
 m.frame=m.rattan.clone();m.frame.color.setHex(0xc6ac84);m.mat=new T.MeshStandardMaterial({color:0xf3efdf,roughness:.91,normalMap:texture80('jukebox/brushed-chrome-normal',true),normalScale:new T.Vector2(.014,.014)});
 m.painting=new T.MeshStandardMaterial({map:texture80('lounge/painting-albedo'),roughness:.68});
 m.redGlass=new T.MeshPhysicalMaterial({map:texture80('jukebox/red-vinyl-albedo'),color:0x692a29,roughness:.16,metalness:.05,transparent:true,opacity:.73,depthWrite:false,clearcoat:.8});m.wax=m.mat.clone();m.wax.color.setHex(0xb2a883);m.flame=new T.MeshBasicMaterial({color:0xffbf6b,toneMapped:false});
 for(const kind of['areca','monstera','fern','bird-of-paradise'])m[kind]=new T.MeshStandardMaterial({name:'V80 cutout '+kind,map:texture80('exterior/'+kind+'-albedo-512'),roughness:.87,side:T.DoubleSide,alphaTest:.42,normalMap:texture80('lounge/fabric-normal',true),normalScale:new T.Vector2(.026,.026)});
 const k=new TikiKit(m),x=TERRACE80.x;
 // Added fixed bamboo/dado backing; old facade and window assembly stay intact behind it.
 k.box('wood',x,1.32,.658,3.42,2.59,.11,.025);
 for(let i=0;i<35;i++){const xx=x-1.655+i*.0973;k.cyl('bamboo',xx,1.83,.754,.042,.047,1.50,8);for(const yy of[1.25,1.78,2.39])k.cyl('binding',xx,yy,.754,.048,.049,.016,8);}
 for(let i=0;i<19;i++)k.box('wood',x-1.615+i*.179,.527,.73,.165,.99,.046,.007);
 for(const yy of[.055,1.025,2.637])k.box('wood',x,yy,.785,3.48,.07,.112,.014);
 // White mat and pale frame are dimensional, with the oil painting recessed.
 k.box('frame',x,1.875,.806,.99,1.22,.074,.015);k.box('mat',x,1.875,.848,.900,1.128,.017,.004);k.box('wood',x,1.875,.86,.665,.888,.012,.003);k.plane('painting',x,1.875,.868,.645,.86);
 mask(k,x-1.07,1.91,.805,0);mask(k,x+1.07,1.91,.805,1);
 // Round black pedestal, heavy weighted foot, slim edge and red glass votive.
 k.cyl('black',x,.027,1.46,.325,.34,.054,32);k.cyl('black',x,.370,1.46,.046,.075,.70,16);k.cyl('wood',x,.748,1.46,.475,.475,.058,48);k.add(new T.TorusGeometry(.47,.012,6,48),'wood',x,.750,1.46,[Math.PI/2,0,0]);
 k.add(new T.LatheGeometry([[0,0],[.055,0],[.059,.017],[.048,.102],[.046,.11],[.039,.11],[.044,.019],[0,.019]].map(a=>new T.Vector2(...a)),20),'redGlass',x,.780,1.46);
 k.cyl('wax',x,.806,1.46,.032,.034,.017,16);k.sphere('flame',x,.841,1.46,.007,.020,.007);
 for(const p of TERRACE80.chairs)chair(k,p.x,p.z,p.yaw);
 for(const p of TERRACE80.plants)planter(k,p);
 const root=k.finish('V80 / bamboo rattan terrace and tropical planting');root.position.set(F.origin.x,F.y,F.origin.z);root.rotation.y=F.angle;
 root.traverse(o=>{if(o.isMesh&&o.material.alphaTest>0)o.castShadow=false;});
 const candle=new T.PointLight(0xffb46b,.20,1.0,2);candle.position.set(x,.90,1.46);root.add(candle);
 const colliders=[...TERRACE80.plants.map(p=>({...p,r:.29})),...TERRACE80.chairs.map(p=>({...p,r:.39})),{x,z:1.46,r:.47}].map(q=>({kind:'circle',...tikiPoint(q.x,q.z),r:q.r}));
 return{object:root,colliders,mats:m,dispose(){root.traverse(o=>o.geometry?.dispose());for(const mat of Object.values(m))mat.dispose();root.removeFromParent();}};
}
