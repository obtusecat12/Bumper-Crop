import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
// Separate aperture, tile state, retained grid and contents. All choices are seed-stable.
export function ceilingPlan95({ox,oz,K,details,lights,walls,hash,forbidden}){
 const tiles=[],modules=[],breaks=[],used=new Set();
 const key=(x,z)=>Math.round(x*10)+','+Math.round(z*10);
 function group(x,z,seed,hero=false){
  const rand=s=>hash(seed,s,9508),shape=hero?3:Math.floor(rand(1)*4),cells=shape===0?[[0,0]]:shape===1?[[0,0],[1,0]]:shape===2?[[0,0],[0,1],[1,1]]:[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[1,2]];
  for(let i=0;i<cells.length;i++){
   const [a,b]=cells[i],xx=x+a*1.2,zz=z+b*.6,k=key(xx,zz);if(used.has(k)||xx<ox+.59||xx>ox+K-.59||zz<oz+.29||zz>oz+K-.29||forbidden(xx,zz))continue;
   if(lights.some(p=>Math.abs(p.x-xx)<.62&&Math.abs(p.z-zz)<.32)||walls.some(w=>Math.abs(w.x-xx)<w.w/2+.60&&Math.abs(w.z-zz)<w.d/2+.30))continue;
   used.add(k);const r=rand(10+i),state=r<.52?'missing':r<.83?'fractured':'hinged',variant=Math.floor(rand(40+i)*3);tiles.push({x:xx,z:zz,w:1.2,d:.6,state,variant});
   // Every revealed cavity has material depth and a minimum one independent content module.
   const cotton=(i===0||rand(60+i)<.30),hanging=i===0||i===5&&rand(61)<.15;if(cotton)modules.push({kind:'batt'+(hanging?1:variant),x:xx+(rand(80+i)-.5)*.24,z:zz,y:hanging?.015:.23,rot:rand(90+i)>.5?0:Math.PI,sx:.78+rand(100+i)*.25,sy:hanging?.85+rand(110+i)*.16:.40,sz:.8+rand(120+i)*.24});
   if(!cotton||rand(130+i)<.45)modules.push({kind:'wire'+i%3,x:xx-.31,z:zz+.13,rot:rand(140+i)*6.28});
   if(i===0||rand(150+i)<.22)modules.push({kind:'duct'+i%2,x:xx,z:zz-.06,rot:rand(160+i)>.5?0:Math.PI});
   if(cells.length>2&&i===1&&rand(170)<.7){breaks.push({x:xx-.6,z:zz,w:.09,d:.60});modules.push({kind:'bentRail',x:xx-.6,z:zz,rot:0});}
  }
 }
 for(const d of details.filter(d=>d.kind===4))group(d.x,d.z,Math.round(d.x*97+d.z*117));
 for(const [x,z,seed]of[[216.6,.3,195],[219,6.3,295],[210.6,9.3,395]])if(x>=ox&&x<ox+K&&z>=oz&&z<oz+K)group(x,z,seed,true);
 return{tiles,modules,breaks};
}
export function createCeiling95(T){
 const V=(...p)=>new T.Vector3(...p),result={};
 const model=fn=>{const pools={};function put(mat,g,x=0,y=0,z=0,rx=0,ry=0,rz=0){g.rotateX(rx);g.rotateY(ry);g.rotateZ(rz);g.translate(x,y,z);if(g.index)g=g.toNonIndexed();if(!g.attributes.color){const color=new Float32Array(g.attributes.position.count*3);color.fill(1);g.setAttribute('color',new T.BufferAttribute(color,3));}(pools[mat]??=[]).push(g);}const box=(m,x,y,z,w,h,d,rx=0,ry=0,rz=0)=>put(m,new T.BoxGeometry(w,h,d),x,y,z,rx,ry,rz);const tube=(m,pts,r,n=14)=>put(m,new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p=>V(...p))),n,r,5,false));fn({put,box,tube});return Object.entries(pools).map(([material,gs])=>{const geometry=mergeGeometries(gs,false);gs.forEach(g=>g.dispose());return{material,geometry,matrix:new T.Matrix4(),castShadow:false};});};
 for(let variant=0;variant<3;variant++){
  result['batt'+variant]=model(({put,tube})=>{
   // A thick fibrous blanket with a hanging tongue: coherent skin, torn irregular perimeter.
   const g=new T.BoxGeometry(.92,.15,.49,18,3,12),p=g.attributes.position,uv=g.attributes.uv,col=[];
   for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),u=Math.max(0,Math.min(1,(x+.46)/.92)),v=Math.max(0,Math.min(1,(z+.245)/.49));
    const flutter=Math.sin(x*53+z*37+variant*3)*.012+Math.sin(x*101-z*81)*.006;
    const sag=variant===0?-.31*Math.sin(u*Math.PI)**1.4:variant===1?-.51*Math.max(0,v)**2*Math.sin(u*Math.PI)**.7:-.35*Math.sin((u*.8+.1)*Math.PI)**2*(.4+v*.6);
    p.setXYZ(i,x+Math.sin(z*75+variant)*.012,.13+y+sag+flutter,z+Math.sin(x*63)*.014);uv.setXY(i,u,v);
    const shade=y<0?.74+.18*Math.abs(Math.sin(x*28+z*19)):.65;col.push(shade,shade,shade);
   }g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.computeVertexNormals();put('insulation95',g);
   // Fibers and small irregular wisps attach to the same blanket edge, not isolated blobs.
   for(let j=0;j<29;j++){const x=((j+.37*Math.sin(j*17.7))/29-.5)*.85,u=(x+.46)/.92,v=1,z=.24+Math.sin(j*19)*.013,sag=variant===0?-.31*Math.sin(u*Math.PI)**1.4:variant===1?-.51*Math.sin(u*Math.PI)**.7:-.35*Math.sin((u*.8+.1)*Math.PI)**2;
    const y=.06+sag;tube('insulation95',[[x,y,z],[x+.017,y-.015,z+.026],[x-.014,y-.022-(j%7)*.009,z+.033]],.0010+(j%3)*.0003,3);
   }
  });
  result['wire'+variant]=model(({tube,put})=>{for(let j=0;j<2+variant;j++){const x=j*.029,drop=.45+variant*.19+j*.045;tube('cable95',[[x,.39,0],[x+.13,.17,.01],[x+.11,-drop*.46,.12],[x+.03,-drop,.08]],.0065,16);put('copper',new T.CylinderGeometry(.003,.003,.024,5),x+.03,-drop-.01,.08);}});
  result['fractured'+variant]=model(({put})=>{
   const shapes=variant===0?[[[-.59,-.29],[-.08,-.29],[.12,-.11],[-.09,.02],[.10,.17],[-.13,.29],[-.59,.29]],[[.59,-.29],[.38,-.29],[.17,-.06],[.33,.12],[.20,.29],[.59,.29]]]:[[[-.59,-.29],[.59,-.29],[.59,-.14],[.28,-.04],[.07,-.14],[-.25,.09],[-.59,.13]],[[.59,.29],[.34,.29],[.25,.13],[.52,.04],[.59,.07]]];
   for(let j=0;j<shapes.length;j++){const s=new T.Shape();shapes[j].forEach(([x,z],i)=>i?s.lineTo(x,z):s.moveTo(x,z));s.closePath();const g=new T.ExtrudeGeometry(s,{depth:.031,bevelEnabled:false});g.rotateX(Math.PI/2);g.translate(0,-.01,0);put('ceiling',g,0,-j*.11,0,j?-.29:.015,0,j?.12:0);}
  });
  result['hinged'+variant]=model(({box,tube})=>{box('ceiling',0,-.13,.13,1.17,.031,.57,.38+variant*.16,0,variant===1?.12:0);tube('cable95',[[-.50,.02,-.22],[-.50,-.04,-.15],[-.50,-.23,.31]],.002,4);});
 }
 for(let i=0;i<2;i++)result['duct'+i]=model(({box,tube})=>{
  // Open rectangular sheet-metal carcass; the black interior is behind actual wall thickness.
  box('duct95',0,.37,0,.78,.012,.25);for(const z of[-.13,.13])box('duct95',0,.245,z,.78,.25,.012);
  box('duct95',-.14,.113,0,.48,.012,.26);box('duct95',.27,.088,.018,.21,.012,.26,0,0,-.22-i*.12);
  box('dark',-.386,.244,0,.012,.24,.25);for(const x of[-.33,.21]){box('duct95',x,.375,0,.031,.025,.30);box('duct95',x,.24,-.14,.031,.28,.025);box('duct95',x,.24,.14,.031,.28,.025);}
  if(i)tube('cable95',[[-.22,.53,0],[-.22,.34,.02],[.18,.05,.07],[.38,-.12,.11]],.008,10);
 });
 result.bentRail=model(({box})=>{box('grid',0,-.10,0,.021,.035,.58,.37);box('grid',0,-.08,0,.009,.072,.58,.37);});
 return result;
}
