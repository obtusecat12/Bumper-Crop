// Pure V37 rural placement grammar. Plan-local metres; +Z faces the source road.
// Each site grows from a recognisable old building, not a cleared plot rectangle.
const PI=Math.PI, HALF=PI/2;
const SIZES=[[7,9,3],[2.8,3.2,2.7],[12,17,4.9],[13,19,5.1],[11,15,4.3],[13,9,3.7],[13,18,3.8],[8,11,3.2]];
const ROLES=['workshop','privy','wagon-barn','dairy-barn','masonry-store','implement-shelter','stable','field-store'];
const FINISHES=['gray','red','ochre','whitewash','olive','darkwood'];
const SINGLE_VARIANTS=[0,0,0,7,7,7,2,2,3,3,4,4,5,5,6,6,1];
const FARM_GRAMMARS=['linear','oblique','staggered','side-wing','open-l','partial-yard','crop-islands','expanded-holding','tandem','parallel','fan','dogleg'];
const PAIR_GRAMMARS=['loose-neighbours','tandem','side-wing','staggered','oblique','back-to-back','smallholding','field-satellites'];
const HAMLET_GRAMMARS=['facing-barns','broken-court','working-lane','grown-row'];

export function hash(value){let h=2166136261;for(const c of String(value))h=Math.imul(h^c.charCodeAt(0),16777619);h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;return h>>>0;}
const unit=(seed,key)=>hash(`${seed}:${key}`)/4294967296;
const between=(seed,key,a,b)=>a+(b-a)*unit(seed,key);
const choose=(seed,key,list)=>list[Math.floor(unit(seed,key)*list.length)];
const angleTo=(from,to)=>Math.atan2(to.x-from.x,to.z-from.z);
const point=(p,x,z)=>{const c=Math.cos(p.angle||0),s=Math.sin(p.angle||0);return{x:p.x+c*x+s*z,z:p.z-s*x+c*z};};
const isBuilding=p=>p.variant!==undefined&&(p.kind==='barn'||p.kind==='shed'||p.kind==='outhouse');
function seededVariant(plan,key,pool){return choose(plan.seed??0,key,pool);}
function mainVariant(plan,pool=SINGLE_VARIANTS){const v=plan.variant??plan.barnVariant;return Number.isInteger(v)?((v%8)+8)%8:seededVariant(plan,'main-variant',pool);}
function grammarFor(plan){
 const names=plan.kind==='hamlet'?HAMLET_GRAMMARS:plan.kind==='farm'?FARM_GRAMMARS:PAIR_GRAMMARS;
 return names.includes(plan.grammar)?plan.grammar:choose(plan.seed??0,`${plan.kind}-grammar`,names);
}

// Separating-axis test uses the same clockwise yaw convention as Three's X/Z
// transform. Footprints reserve existing porches, roof overhangs and side bays.
function overlaps(a,b,gap=.5){
 const ca=Math.cos(a.angle||0),sa=Math.sin(a.angle||0),cb=Math.cos(b.angle||0),sb=Math.sin(b.angle||0);
 const A=[[ca,-sa],[sa,ca]],B=[[cb,-sb],[sb,cb]];
 const ah=[a.r??a.hx,a.r??a.hz],bh=[b.r??b.hx,b.r??b.hz],dx=b.x-a.x,dz=b.z-a.z;
 for(const [x,z]of [...A,...B]){
  const ar=ah[0]*Math.abs(x*A[0][0]+z*A[0][1])+ah[1]*Math.abs(x*A[1][0]+z*A[1][1]);
  const br=bh[0]*Math.abs(x*B[0][0]+z*B[0][1])+bh[1]*Math.abs(x*B[1][0]+z*B[1][1]);
  if(Math.abs(dx*x+dz*z)>=ar+br+gap)return false;
 }
 return true;
}

export function compoundComponents(plan={}){
 const seed=plan.seed??0,kind=plan.kind||'single',handed=plan.handed<0?-1:1,parts=[];
 const rand=(key,a,b)=>between(seed,key,a,b),pick=(key,list)=>choose(seed,key,list);
 const grammar=kind==='single'?'single':grammarFor(plan);
 function put(p,gap=.75){
  const target={x:p.x,z:p.z};
  if(parts.some(q=>overlaps(p,q,gap))){
   // Bounded local correction preserves the authored relationship and its yaw;
   // it does not turn all grammars into a common snapped grid.
   const phase=rand(`${p.id}:placement-phase`,0,PI*2);let placed=false;
   for(let ring=1;ring<=16&&!placed;ring++)for(let k=0;k<12;k++){
    const a=phase+k*PI/6;p.x=target.x+Math.cos(a)*ring*1.25;p.z=target.z+Math.sin(a)*ring*1.25;
    if(!parts.some(q=>overlaps(p,q,gap))){placed=true;break;}
   }
   if(!placed){ // Rare, deterministic bounded fallback beyond existing roofs.
    p.x=Math.max(...parts.map(q=>componentBounds(q)[1]))+(p.r??Math.hypot(p.hx,p.hz))+gap+1;
    p.z=target.z;
   }
  }
  parts.push(p);return p;
 }
 function building(id,variant,x,z,angle=0,main=false,options={}){
  const d=SIZES[variant],wide=rand(`${id}:width`,.94,1.075),deep=rand(`${id}:depth`,.94,1.075);
  // Hard-coded old doorway/window dimensions require small form-specific ranges.
  const largeBarn=main&&(kind==='farm'||kind==='hamlet')&&(variant===2||variant===3)&&(plan.largeBarn===true||unit(seed,'large-main-barn')<(kind==='hamlet'?.32:.24));
  const width=largeBarn?rand(`${id}:large-width`,14.6,15.8):d[0]*wide;
  const depth=largeBarn?rand(`${id}:large-depth`,23.5,25.8):d[1]*deep;
  const height=largeBarn?rand(`${id}:large-height`,5.25,5.8):d[2]*rand(`${id}:height`,variant===7?1:.965,1.065);
  const roofOverhang=.65,hx=width/2+(variant===7?2.22:roofOverhang),hz=depth/2+(variant===0?2.05:variant===2?1.5:roofOverhang);
  const finish=main&&FINISHES.includes(plan.finish)?plan.finish:pick(`${id}:finish`,variant===4?['gray','ochre','whitewash','red']:FINISHES);
  const p={id,kind:variant===1?'outhouse':[0,5,7].includes(variant)?'shed':'barn',x,z,width,depth,height,angle,variant,main,
   role:ROLES[variant],grammar,finish,roofOverhang,hx,hz,ground:true,...(largeBarn?{largeBarn:true}:{}),
   yardDensity:rand(`${id}:yard-density`,main?.42:.12,main?.88:.48),...options};
  if(unit(seed,`${id}:roof-controlled`)<.68)p.roofFinish=pick(`${id}:roof`,['tin','iron','rust']);
  return put(p,options.attachment?.35:.85);
 }
 function helper(id,pool,x,z,angle=0,options={}){return building(id,pick(`${id}:variant`,pool),x,z,angle,false,options);}
 function circle(id,kind,x,z,r,height,options={}){return put({id,kind,x,z,r,height,angle:rand(`${id}:yaw`,-.6,.6),ground:true,grammar,...options},1.3);}
 let main;
 if(kind==='single'){
  // Prop-only singles are explicit rare subtypes; the ordinary single always
  // contains exactly one of the eight original building forms.
  if(plan.subtype==='silo')main=circle('main','silo',0,0,rand('solo-radius',2.2,2.9),rand('solo-height',8.5,12.5),{main:true});
  else if(plan.subtype==='windpump'||plan.subtype==='windmill')main=circle('main','windmill',0,0,4.3,rand('solo-height',8.2,11.8),{main:true});
  else main=building('main',mainVariant(plan),0,0,rand('main:yaw',-.20,.20),true);
 }else if(kind==='pair'){
  const small=grammar==='smallholding',v=mainVariant(plan,small?[0,7,0,5]:SINGLE_VARIANTS.filter(n=>n!==1));
  main=building('main',v,0,0,rand('main:yaw',-.16,.16),true);
  if(grammar==='loose-neighbours')helper('neighbour',[0,5,7],rand('x',17,24),rand('z',-7,7),rand('yaw',-.23,.26));
  else if(grammar==='tandem')helper('rear-store',[0,1,7],rand('x',-4,5),-main.hz-rand('z',11,17),rand('yaw',-.17,.20));
  else if(grammar==='side-wing'){
   const wing=helper('later-wing',[5,7],20,-3,main.angle,{attachment:true});
   // Return it to a roof-safe side attachment, in the main building's frame.
   const pos=point(main,main.hx+wing.hx+.4,-main.depth*.18);wing.x=pos.x;wing.z=pos.z;
  }else if(grammar==='staggered')helper('forward-store',[0,1,7],rand('x',12,18),main.hz+rand('z',5,12),rand('yaw',-.23,.22));
  else if(grammar==='oblique')helper('oblique-shed',[0,5,7],rand('x',17,24),rand('z',-14,-6),rand('yaw',-.80,-.32));
  else if(grammar==='back-to-back')helper('rear-hut',[0,7],rand('x',4,10),-main.hz-rand('z',10,15),PI+rand('yaw',-.22,.22));
  else if(grammar==='smallholding')helper('privy',[1,1,7],rand('x',11,17),rand('z',-13,-6),rand('yaw',-.40,.18));
  else helper('field-store',[0,7,5],rand('x',23,29),rand('z',-18,-9),rand('yaw',.22,.65));
 }else if(kind==='farm'){
  const old=grammar==='expanded-holding',v=mainVariant(plan,old?[0,7]:[2,3,4,6,2,3,5]);
  if(grammar==='linear'){
   main=building('main',v,-13,-6,rand('main:yaw',-.12,.12),true);
   helper('row-shed',[0,5,7],10,-7,rand('shed:yaw',-.12,.12));
   if(unit(seed,'third')<.69)helper('row-end',[0,1,7],28,-11,rand('end:yaw',-.25,.12));
  }else if(grammar==='oblique'){
   main=building('main',v,0,0,rand('main:yaw',-.12,.12),true);
   helper('oblique-store',[0,7,5],21,8,rand('shed:yaw',-.78,-.32));
   if(unit(seed,'third')<.55)helper('rear-hut',[0,1,7],-13,-21,rand('hut:yaw',.20,.48));
  }else if(grammar==='staggered'){
   main=building('main',v,0,-14,rand('main:yaw',-.10,.15),true);
   helper('left-store',[0,5,7],-21,1,rand('shed:yaw',-.25,-.05));
   helper('front-workshop',[0,7],13,16,rand('hut:yaw',-.18,.26));
  }else if(grammar==='side-wing'){
   main=building('main',v,0,-3,rand('main:yaw',-.12,.12),true);
   const wing=helper('later-wing',[5,7],20,-6,main.angle,{attachment:true});
   const p=point(main,main.hx+wing.hx+.4,-main.depth*.18);wing.x=p.x;wing.z=p.z;
   if(unit(seed,'third')<.73)helper('back-hut',[0,1,7],-12,-21,rand('hut:yaw',-.24,.24));
  }else if(grammar==='open-l'){
   main=building('main',v,-10,-9,rand('main:yaw',-.11,.11),true);
   helper('cross-shelter',[5,7],13,4,-HALF+rand('shed:yaw',-.10,.10));
   if(unit(seed,'third')<.67)helper('loose-hut',[0,1],-22,15,rand('hut:yaw',-.35,.08));
  }else if(grammar==='partial-yard'){
   main=building('main',v,-14,-3,rand('main:yaw',.03,.22),true);
   helper('angle-barn',[4,5,7],13,-12,rand('shed:yaw',-.95,-.55));
   helper('edge-workshop',[0,7],20,15,-HALF+rand('hut:yaw',-.20,.13));
  }else if(grammar==='crop-islands'){
   main=building('main',v,0,-2,rand('main:yaw',-.20,.20),true);
   helper('field-shed',[5,7],27,-17,rand('shed:yaw',-.50,-.14));
   helper('distant-workshop',[0,7],-24,18,rand('hut:yaw',.13,.43));
  }else if(grammar==='expanded-holding'){
   main=building('main',v,-14,14,rand('main:yaw',-.25,.05),true);
   helper('new-barn',[2,3,4,6],3,-12,rand('barn:yaw',-.04,.16));
   helper('implement-shed',[5,7],23,10,rand('shed:yaw',-.56,-.20));
  }else if(grammar==='tandem'){
   main=building('main',v,0,9,rand('main:yaw',-.12,.12),true);
   helper('rear-store',[0,5,7],4,-19,rand('shed:yaw',-.16,.14));
   if(unit(seed,'third')<.62)helper('side-hut',[0,1],-15,-8,rand('hut:yaw',.23,.65));
  }else if(grammar==='parallel'){
   main=building('main',v,11,-6,rand('main:yaw',.08,.23),true);
   helper('parallel-store',[0,5,7],-12,-1,main.angle+rand('shed:yaw',-.05,.05));
   if(unit(seed,'third')<.50)helper('back-privy',[1],-17,-20,rand('hut:yaw',-.20,.20));
  }else if(grammar==='fan'){
   main=building('main',v,-11,-11,rand('main:yaw',.14,.33),true);
   helper('turned-shelter',[5,7],16,-10,rand('shed:yaw',-.64,-.35));
   helper('front-hut',[0,7],4,19,rand('hut:yaw',-1.25,-.90));
  }else{
   main=building('main',v,-13,5,rand('main:yaw',-.15,.03),true);
   helper('middle-store',[0,7],7,-10,rand('shed:yaw',-.75,-.43));
   helper('end-shelter',[5,7],26,11,rand('hut:yaw',-.28,-.09));
  }
  // A later privy or tiny workshop changes the count only on some holdings.
  // Never clone a complete four-sided yard and its perimeter furniture.
  if(unit(seed,'extra-building')<.28)helper('later-privy',[1],rand('extra:x',-24,21),rand('extra:z',-27,-17),rand('extra:yaw',-.6,.6));
  if(parts.filter(isBuilding).length<5&&unit(seed,'fifth-building')<.095)helper('older-store',[0,7],rand('last:x',-28,-19),rand('last:z',-12,17),rand('last:yaw',-.40,.45));
 }else if(kind==='hamlet'){
  if(grammar==='facing-barns'){
   main=building('main',mainVariant(plan,[2,3]),-18,-9,HALF,true);
   helper('facing-barn',[2,3,4,6],19,-5,-HALF+rand('facing:yaw',-.06,.06));
   helper('rear-workshop',[0,7],-6,-29,rand('rear:yaw',-.18,.18));
   helper('front-shelter',[5,7],21,20,rand('front:yaw',-.28,.08));
  }else if(grammar==='broken-court'){
   main=building('main',mainVariant(plan,[2,3,4,6]),-15,-13,rand('main:yaw',.24,.42),true);
   helper('second-barn',[2,3,4,6],19,-10,rand('second:yaw',-.78,-.52));
   helper('forward-workshop',[0,7],-23,18,rand('front:yaw',-.1,.20));
   helper('outer-shelter',[5,7],21,20,rand('outer:yaw',-1.42,-1.10));
  }else if(grammar==='working-lane'){
   main=building('main',mainVariant(plan,[2,3]),-17,-15,HALF+rand('main:yaw',-.08,.08),true);
   helper('opposite-barn',[4,6,3],18,6,-HALF+rand('other:yaw',-.13,.13));
   helper('lane-store',[0,7],-17,16,HALF+rand('store:yaw',-.08,.12));
   helper('rear-shelter',[5,7],17,-26,-HALF+rand('rear:yaw',-.08,.12));
  }else{
   main=building('main',mainVariant(plan,[2,3,4]),-15,-6,rand('main:yaw',-.09,.09),true);
   helper('old-workshop',[0,7],-34,4,rand('old:yaw',-.3,-.1));
   helper('next-barn',[2,4,6],10,-9,rand('next:yaw',.03,.19));
   helper('end-shelter',[5,7],33,4,rand('end:yaw',-.20,.02));
  }
  if(unit(seed,'fifth')<.58)helper('separate-privy',[1,0],rand('fifth:x',-26,27),-36,rand('fifth:yaw',-.5,.5));
  if(unit(seed,'sixth')<.19)helper('field-store',[7,0],-31,30,rand('sixth:yaw',-.38,.14));
 }else{
  main=building('main',mainVariant(plan),0,0,rand('main:yaw',-.20,.20),true);
 }

 // Working objects belong to individual structures and have separate odds.
 // Most singles/pairs have none; farms are not guaranteed a silo or windpump.
 if((kind==='farm'||kind==='hamlet')&&unit(seed,'silo-chance')<(kind==='hamlet'?.47:.28)){
  const b=parts.find(p=>p.variant===2||p.variant===3)||main;
  const pos=point(b,-b.hx-rand('silo-gap',3.3,5.6),-b.depth*.21);
  circle('grain-silo','silo',pos.x,pos.z,rand('silo-radius',2.25,2.85),rand('silo-height',9.0,12.5));
 }
 if((kind==='farm'||kind==='hamlet')&&unit(seed,'pump-chance')<.115)circle('windpump','windmill',rand('pump:x',-22,25),rand('pump:z',13,25),4.3,rand('pump:height',8.5,11.3));
 if((kind==='farm'||kind==='hamlet')&&unit(seed,'trough-chance')<.16){
  const p=point(main,main.hx+3,main.hz+2);
  put({id:'trough',kind:'trough',x:p.x,z:p.z,width:3.4,depth:1.25,height:.68,hx:1.85,hz:.8,angle:main.angle,ground:true,grammar},1);
 }
 // Broken fence lengths suggest an older boundary; they do not outline sites.
 const fenceChance=kind==='single'?.085:kind==='pair'?.14:kind==='farm'?.27:.42;
 if(unit(seed,'fence-chance')<fenceChance){
  const n=kind==='single'?1:unit(seed,'second-fence')<.22?2:1;
  for(let i=0;i<n;i++){
   const p=point(main,(i?-1:1)*(main.hx+rand(`fence${i}:offset`,4,7)),-main.hz-rand(`fence${i}:back`,2,6));
   const width=rand(`fence${i}:width`,4.5,10.5),angle=main.angle+rand(`fence${i}:yaw`,-.55,.55);
   put({id:`fence-${i}`,kind:'fence',x:p.x,z:p.z,width,depth:.16,height:1.15,angle,hx:width/2,hz:.18,grammar},1.4);
  }
 }
 const treeChance=kind==='single'?.19:kind==='pair'?.24:kind==='farm'?.36:.52;
 if(unit(seed,'tree-chance')<treeChance){
  const n=kind==='single'?1:unit(seed,'two-trees')<.31?2:1;
  for(let i=0;i<n;i++){
   const side=unit(seed,`tree${i}:side`)<.5?-1:1;
   circle(`tree-${i}`,'tree',main.x+side*(main.hx+rand(`tree${i}:x`,7,15)),main.z-main.hz-rand(`tree${i}:z`,2,11),rand(`tree${i}:r`,2.2,3.1),rand(`tree${i}:height`,7.1,10.7),{variant:pick(`tree${i}:variant`,[0,1,2]),crownWidth:rand(`tree${i}:crown`,4.4,6.2),ground:false});
  }
 }
 return parts.map(p=>({...p,x:p.x*handed,angle:(p.angle||0)*handed,seed:hash(`${seed}:${p.id}`)}));
}

function doorPoint(p,extra=0){
 if(!isBuilding(p))return point(p,0,(p.r||2.5)+extra);
 return point(p,p.variant===0?-1.15:p.variant===7?-.55:0,p.depth/2+(p.variant===0?2.15:.85)+extra);
}
function clearSegment(a,b,buildings,pad=.3){
 for(const p of buildings){
  if(p.r!==undefined){
   const dx=b.x-a.x,dz=b.z-a.z,den=dx*dx+dz*dz,t=den?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/den)):0;
   if(Math.hypot(a.x+t*dx-p.x,a.z+t*dz-p.z)<p.r+pad)return false;
   continue;
  }
  const c=Math.cos(p.angle||0),s=Math.sin(p.angle||0),ax=c*(a.x-p.x)-s*(a.z-p.z),az=s*(a.x-p.x)+c*(a.z-p.z);
  const dx=c*(b.x-a.x)-s*(b.z-a.z),dz=s*(b.x-a.x)+c*(b.z-a.z),hx=p.hx+pad,hz=p.hz+pad;
  let low=0,high=1;
  for(const [origin,direction,half]of [[ax,dx,hx],[az,dz,hz]]){
   if(Math.abs(direction)<1e-9){if(Math.abs(origin)>=half){low=2;break;}}
   else{const t1=(-half-origin)/direction,t2=(half-origin)/direction;low=Math.max(low,Math.min(t1,t2));high=Math.min(high,Math.max(t1,t2));if(low>high)break;}
  }
  if(low<high&&high>0&&low<1)return false;
 }
 return true;
}

// Driveways end at a real doorway approach or an open gap between farm roofs.
// Coordinates returned here are already handed, like compoundComponents.
export function compoundEntrance(plan={},localComponents=compoundComponents(plan)){
 const main=localComponents.find(p=>p.main)||localComponents.find(isBuilding)||localComponents[0];
 if(!main)return{x:0,z:0};
 const buildings=localComponents.filter(p=>isBuilding(p)||p.kind==='silo'||p.kind==='windmill');
 const door=doorPoint(main,1.25);
 if(plan.kind==='single')return door;
 // Choose the shortest roadward escape from the main's actual front. Facing
 // barns naturally select their centre lane; tandem holdings select a side.
 const candidates=[door];
 for(const dx of[0,5,-5,10,-10,16,-16])for(const dz of[5,10,17])candidates.push({x:door.x+dx,z:door.z+dz});
 const roadZ=Math.max(...buildings.map(p=>componentBounds(p)[3]))+8;
 const safe=candidates.filter(p=>!buildings.some(q=>componentDistance(p.x,p.z,q)<1)&&clearSegment(door,p,buildings,.20)&&clearSegment(p,{x:p.x,z:roadZ},buildings,.65));
 if(safe.length)return safe.sort((a,b)=>(Math.hypot(a.x-door.x,a.z-door.z)+Math.abs(a.x)*.07)-(Math.hypot(b.x-door.x,b.z-door.z)+Math.abs(b.x)*.07))[0];
 // Guaranteed outside-front fallback: the yard router connects around roofs.
 return{x:door.x,z:roadZ};
}

// Small door pads plus a sparse routed tree of worn tracks. They never form a
// enclosing lawn, and the longer connections deliberately leave crop fingers.
export function compoundYard(plan={},localComponents=compoundComponents(plan)){
 const seed=plan.seed??0,parts=localComponents,buildings=parts.filter(isBuilding),structures=parts.filter(p=>isBuilding(p)||p.kind==='silo'||p.kind==='windmill'),patches=[],lanes=[];
 const main=parts.find(p=>p.main)||buildings[0]||structures[0];
 if(!main)return{patches,lanes};
 const grammar=main.grammar||grammarFor(plan),island=grammar==='crop-islands'||grammar==='field-satellites';
 const doors=[];
 for(const p of structures){
  // Pads sit outside the old porch/hood footprint. The narrow track begins at
  // their centre, leaving enough clearance for its visible worn half-width.
  const door=doorPoint(p,p.variant===2?1.3:.9),v=p.variant,large=[2,3,4,5,6].includes(v);
  const rx=large?Math.min(p.width*.35,4.3):v===1?1.05:p.kind==='windmill'?1.65:p.kind==='silo'?1.4:2.2;
  const rz=large?between(seed,`${p.id}:pad-depth`,2.1,3.25):v===1?1.1:between(seed,`${p.id}:pad-depth`,1.5,2.2);
  patches.push({x:door.x,z:door.z,rx,rz,angle:p.angle||0,intensity:between(seed,`${p.id}:pad-wear`,.72,.94)});
  doors.push({...door,id:p.id,main:!!p.main,large});
  if(large&&unit(seed,`${p.id}:work-pad`)<.35){
   const pos=point(p,(unit(seed,`${p.id}:work-side`)<.5?-1:1)*(p.width/2+1.2),-p.depth*.23);
   if(!structures.some(q=>q!==p&&componentDistance(pos.x,pos.z,q)<2))patches.push({x:pos.x,z:pos.z,rx:between(seed,`${p.id}:side-width`,1.4,2.25),rz:between(seed,`${p.id}:side-depth`,1.6,2.8),angle:p.angle||0,intensity:.55});
  }
 }
 const entrance=compoundEntrance(plan,parts),mainDoor=doors.find(p=>p.main)||doors[0];
 if(!mainDoor)return{patches,lanes};
 // At most a few dozen nodes for the rare hamlet. Visibility graph includes
 // roof corners, so a connector never crosses a shed to reach its neighbour.
 const corners=[];
 for(const p of structures){
  const hx=(p.r??p.hx)+1.35,hz=(p.r??p.hz)+1.35;
  for(const x of[-hx,hx])for(const z of[-hz,hz])corners.push(point(p,x,z));
 }
 function route(a,b,width,intensity){
  if(Math.hypot(a.x-b.x,a.z-b.z)<.20)return;
  if(clearSegment(a,b,structures,.38)){lanes.push({x1:a.x,z1:a.z,x2:b.x,z2:b.z,width,intensity});return;}
  const nodes=[a,b,...corners.filter(p=>!structures.some(q=>componentDistance(p.x,p.z,q)<.6))],dist=nodes.map(()=>Infinity),prev=nodes.map(()=>-1),seen=new Set();dist[0]=0;
  for(let step=0;step<nodes.length;step++){
   let u=-1;for(let i=0;i<nodes.length;i++)if(!seen.has(i)&&(u<0||dist[i]<dist[u]))u=i;
   if(u<0||!Number.isFinite(dist[u])||u===1)break;seen.add(u);
   for(let v=0;v<nodes.length;v++)if(!seen.has(v)&&v!==u){
    const d=dist[u]+Math.hypot(nodes[v].x-nodes[u].x,nodes[v].z-nodes[u].z);
    if(d<dist[v]&&clearSegment(nodes[u],nodes[v],structures,.38)){dist[v]=d;prev[v]=u;}
   }
  }
  if(prev[1]<0)return;const chain=[];for(let i=1;i>=0;i=prev[i]){chain.push(nodes[i]);if(i===0)break;}chain.reverse();
  for(let i=1;i<chain.length;i++)lanes.push({x1:chain[i-1].x,z1:chain[i-1].z,x2:chain[i].x,z2:chain[i].z,width,intensity});
 }
 route(entrance,mainDoor,mainDoor.large?1.65:1.05,.72);
 const reached=[mainDoor],remaining=doors.filter(p=>p!==mainDoor);
 while(remaining.length){
  let best=null;for(let i=0;i<remaining.length;i++)for(const from of reached){const to=remaining[i],d=Math.hypot(to.x-from.x,to.z-from.z);if(!best||d<best.d)best={i,from,to,d};}
  const width=best.to.large&&!island?between(seed,`${best.to.id}:lane-width`,1.2,1.65):between(seed,`${best.to.id}:lane-width`,.68,1.08);
  route(best.from,best.to,width,island?.46:best.to.large?.68:.53);reached.push(best.to);remaining.splice(best.i,1);
 }
 return{patches,lanes};
}

export function componentDistance(x,z,p){
 const dx=x-p.x,dz=z-p.z;if(p.r!==undefined)return Math.hypot(dx,dz)-p.r;
 const c=Math.cos(p.angle||0),s=Math.sin(p.angle||0),a=Math.abs(c*dx-s*dz)-(p.hx??p.width/2),b=Math.abs(s*dx+c*dz)-(p.hz??p.depth/2);
 return Math.hypot(Math.max(a,0),Math.max(b,0))+Math.min(Math.max(a,b),0);
}
export function componentBounds(p,pad=0){
 const c=Math.abs(Math.cos(p.angle||0)),s=Math.abs(Math.sin(p.angle||0)),px=p.hx??p.width/2,pz=p.hz??p.depth/2;
 const hx=p.r??(c*px+s*pz),hz=p.r??(s*px+c*pz);return[p.x-hx-pad,p.x+hx+pad,p.z-hz-pad,p.z+hz+pad];
}
