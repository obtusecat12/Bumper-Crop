import * as C from './vendor/cannon-es.min.js';

// Metres, kilograms, seconds. +Z is the machine front. All bodies live in a
// small machine-local world, independent of the game's BigInt origin rebases.
export const DEFAULT_VENDING_LAYOUT=Object.freeze({
  groundY:0, width:.64, depth:.25, centerZ:.04, floorY:.48,
  floorThickness:.024, slope:2.5*Math.PI/180, sideThickness:.035,
  sideHeight:.15, backHeight:.17, lipHeight:.014, lipThickness:.016,
  spawn:[0,.77,-.04], maxSpawnY:1.42, maxBodies:32, maxCpuMs:3, maxSolverSteps:8
});
export const DEFAULT_DRINK_PROFILES=Object.freeze({
  pet:{height:.218,radius:.032,mass:.52,friction:.31,restitution:.06,
    centerOfMass:[0,.092,0],segments:[
      {y0:0,y1:.018,r0:.026,r1:.032},{y0:.018,y1:.161,r0:.032,r1:.032},
      {y0:.161,y1:.188,r0:.032,r1:.014},{y0:.188,y1:.218,r0:.014,r1:.014}]},
  can:{height:.115,radius:.033,mass:.348,friction:.25,restitution:.09,
    centerOfMass:[0,.0575,0],segments:[{y0:0,y1:.115,r0:.033,r1:.033}]},
  soy:{height:.225,radius:.037,mass:.54,friction:.35,restitution:.055,
    centerOfMass:[0,.095,0],segments:[
      {y0:0,y1:.018,r0:.030,r1:.037},{y0:.018,y1:.165,r0:.037,r1:.037},
      {y0:.165,y1:.197,r0:.037,r1:.018},{y0:.197,y1:.225,r0:.018,r1:.018}]}
});

// A bounded 120 Hz timeline, temporarily split to 240 Hz during fast impacts.
// Slow settling and sleeping props do not pay the fast-impact cost.
const FIXED=1/120,MAX_SUBSTEPS=8,MAX_FRAME=FIXED*MAX_SUBSTEPS;
const finite=(v,fallback)=>Number.isFinite(v)?v:fallback;
function rng(seed){let x=(seed>>>0)||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};}
function profileFor(type,profiles){
  const p=profiles[type]||DEFAULT_DRINK_PROFILES[type];
  if(!p)throw new TypeError('Unknown vending drink type: '+type);
  if(!(p.mass>0&&p.height>0&&p.radius>0))throw new TypeError('Invalid drink physical profile: '+type);
  return p;
}
export function createVendingPhysics({THREE,geometry={},layout=geometry,profiles={},seed=0x1070,onImpact=null,diagnostics=false}={}){
  const plan={...DEFAULT_VENDING_LAYOUT,...layout};
  plan.spawn=[...(layout.spawn||DEFAULT_VENDING_LAYOUT.spawn)];
  const front=plan.centerZ+plan.depth*.5,back=plan.centerZ-plan.depth*.5;
  const random=rng(seed),world=new C.World({gravity:new C.Vec3(0,-9.81,0),allowSleep:true});
  world.broadphase=new C.SAPBroadphase(world);world.solver.iterations=9;world.solver.tolerance=1e-7;
  const metal=new C.Material('rounded steel retrieval tray'),ground=new C.Material('courtyard paving');
  const materials={},shapeCache=new Map(),records=new Map(),bodyRecords=new Map(),staticBodies=[];
  const stats={steps:0,acceptedTime:0,simulatedTime:0,droppedTime:0,budgetDroppedTime:0,budgetOverruns:0,spawned:0,removed:0,groundImpacts:0,trayImpacts:0,dynamicImpacts:0,maxPenetration:0,maxPenetrationAfterBirthStep:0,lastContactPenetration:0,maxSpawnRaise:0};
  // Contact points refer to the PRE-integration pose. Reading them after
  // rotation would invent centimetres of penetration that never existed.
  world.addEventListener('preStep',()=>{
    for(const r of records.values())r.contactDepth=0;
    if(diagnostics)stats.lastContactPenetration=0;for(const c of world.contacts){
      const d=(c.bi.position.x+c.ri.x-c.bj.position.x-c.rj.x)*c.ni.x+(c.bi.position.y+c.ri.y-c.bj.position.y-c.rj.y)*c.ni.y+(c.bi.position.z+c.ri.z-c.bj.position.z-c.rj.z)*c.ni.z;
      const a=bodyRecords.get(c.bi),b=bodyRecords.get(c.bj);
      if(a)a.contactDepth=Math.max(a.contactDepth,d);if(b)b.contactDepth=Math.max(b.contactDepth,d);
      if(diagnostics){stats.maxPenetration=Math.max(stats.maxPenetration,d);stats.lastContactPenetration=Math.max(stats.lastContactPenetration,d);
        if(!(a&&stats.steps-a.birthStep<=1)&&!(b&&stats.steps-b.birthStep<=1))stats.maxPenetrationAfterBirthStep=Math.max(stats.maxPenetrationAfterBirthStep,d);}
    }
  });
  let accumulator=0,paused=false,nextId=1;
  const v=new C.Vec3(),offset=new C.Vec3(),renderQ=new C.Quaternion(),renderP=new C.Vec3();
  function statBox(name,center,half,rotation=0,material=metal){
    const body=new C.Body({mass:0,material,position:new C.Vec3(...center)});
    body.name=name;body.addShape(new C.Box(new C.Vec3(...half)));body.quaternion.setFromEuler(rotation,0,0);
    staticBodies.push(body);world.addBody(body);return body;
  }
  const floor=statBox('tray floor',[0,plan.floorY-plan.floorThickness*.5,plan.centerZ],
    [plan.width*.5,plan.floorThickness*.5,plan.depth*.5],plan.slope);
  // Physically modeled shallow stop. The opening above it is unblocked, so a
  // body can roll over under the pressure of a newly falling drink.
  const slopeDrop=(front-plan.centerZ)*Math.tan(plan.slope),lipY=plan.floorY-slopeDrop;
  const lip=new C.Body({mass:0,material:metal,position:new C.Vec3(0,lipY+plan.lipHeight*.5,front-plan.lipThickness*.5)});
  lip.name='rounded front stop lip';lip.addShape(new C.Cylinder(plan.lipHeight*.5,plan.lipHeight*.5,plan.width,12));
  lip.quaternion.setFromEuler(0,0,Math.PI*.5);staticBodies.push(lip);world.addBody(lip);
  for(const side of [-1,1])statBox('tray side wall',
    [side*(plan.width+plan.sideThickness)*.5,plan.floorY+plan.sideHeight*.5,plan.centerZ],
    [plan.sideThickness*.5,plan.sideHeight*.5,plan.depth*.5+plan.sideThickness*.5]);
  statBox('tray back wall',[0,plan.floorY+plan.backHeight*.5,back-plan.sideThickness*.5],
    [(plan.width+plan.sideThickness*2)*.5,plan.backHeight*.5,plan.sideThickness*.5]);
  const groundBody=new C.Body({mass:0,material:ground,position:new C.Vec3(0,plan.groundY,0)});
  groundBody.name='ground';groundBody.addShape(new C.Plane());groundBody.quaternion.setFromEuler(-Math.PI*.5,0,0);
  staticBodies.push(groundBody);world.addBody(groundBody);
  const PUSH_DURATION=1.02,pusherWidth=Math.min(.38,plan.width-.055),hingeBack=back-.027,hingeFront=front-.040;
  let pusher=null,pushAge=Infinity;
  const pusherTransform={position:new Float32Array(3),quaternion:new Float32Array([0,0,0,1]),
    size:[pusherWidth,.07,.010],active:false,enabled:!!layout.deliveryPusher};
  if(layout.deliveryPusher){
    pusher=new C.Body({mass:0,type:C.Body.KINEMATIC,material:metal,allowSleep:false,
      position:new C.Vec3(0,plan.floorY+.041,hingeBack)});
    pusher.name='internal delivery paddle';pusher.addShape(new C.Box(new C.Vec3(pusherWidth*.5,.035,.005)));
    staticBodies.push(pusher);world.addBody(pusher);
  }
  function drivePusher(h){
    if(!pusher)return;if(pushAge>=PUSH_DURATION){pusher.velocity.set(0,0,0);pusher.angularVelocity.set(0,0,0);return;}
    pushAge=Math.min(PUSH_DURATION,pushAge+h);let hingeZ,angle;
    if(pushAge<.42){hingeZ=hingeBack+(hingeFront-hingeBack)*pushAge/.42;angle=0;}
    else if(pushAge<.58){hingeZ=hingeFront;angle=Math.PI*.5*(pushAge-.42)/.16;}
    else if(pushAge<.88){hingeZ=hingeFront+(hingeBack-hingeFront)*(pushAge-.58)/.30;angle=Math.PI*.5;}
    else{hingeZ=hingeBack;angle=Math.PI*.5*(1-(pushAge-.88)/.14);}
    const hingeY=plan.floorY+.006-(hingeZ-plan.centerZ)*Math.tan(plan.slope);
    const targetY=hingeY+.035*Math.cos(angle),targetZ=hingeZ+.035*Math.sin(angle);
    const currentAngle=2*Math.atan2(pusher.quaternion.x,pusher.quaternion.w);
    pusher.velocity.set(0,(targetY-pusher.position.y)/h,(targetZ-pusher.position.z)/h);
    pusher.angularVelocity.set((angle-currentAngle)/h,0,0);
  }
  const groundSurfaces=new Set([groundBody]),patchMaterials=[];
  const patches=layout.groundPatches||(layout.groundPatch?[layout.groundPatch]:[]);
  for(const patch of patches){
    const mat=new C.Material('rubber floor mat'),center=patch.center||[0,.006,.62],size=patch.size||[1.18,.012,.78];
    const body=statBox('ground mat',center,size.map(n=>n*.5),0,mat);
    groundSurfaces.add(body);patchMaterials.push({mat,friction:patch.friction??.66,restitution:patch.restitution??.035});
  }
  world.defaultContactMaterial.friction=.30;world.defaultContactMaterial.restitution=.06;
  world.defaultContactMaterial.contactEquationStiffness=5e7;world.defaultContactMaterial.contactEquationRelaxation=4;
  function drinkMaterial(type,p){
    if(materials[type])return materials[type];
    const m=materials[type]=new C.Material(type);
    for(const surface of [metal,ground])world.addContactMaterial(new C.ContactMaterial(m,surface,
      {friction:finite(p.friction,.3),restitution:finite(p.restitution,.06),
      contactEquationStiffness:5e7,contactEquationRelaxation:4}));
    for(const patch of patchMaterials)world.addContactMaterial(new C.ContactMaterial(m,patch.mat,
      {friction:patch.friction,restitution:patch.restitution,contactEquationStiffness:5e7,contactEquationRelaxation:4}));
    for(const [other,mat]of Object.entries(materials))world.addContactMaterial(new C.ContactMaterial(m,mat,
      {friction:.24,restitution:.045,contactEquationStiffness:5e7,contactEquationRelaxation:4}));
    return m;
  }
  function shapesFor(type,p){
    let shapes=shapeCache.get(type);if(shapes)return shapes;
    const com=p.centerOfMass?.[1]??p.height*.5;
    let segments=p.colliderSegments||p.compoundSegments||p.segments||[{y0:0,y1:p.height,r0:p.radius,r1:p.radius}];
    // Rounded heels and mold bands are visual geometry. A collision hull only
    // needs the continuous body, shoulder and neck; do not solve dozens of
    // coincident caps where profile rows meet.
    if(segments.length>2){
      const shoulder=segments.find(s=>s.r0>=p.radius*.90&&s.r1<=p.radius*.75);
      if(shoulder)segments=[{y0:0,y1:shoulder.y0,r0:p.radius,r1:p.radius},
        {y0:shoulder.y0,y1:p.height,r0:shoulder.r0,r1:shoulder.r1}];
    }
    shapes=segments.filter(s=>s.y1-s.y0>.0005).map(s=>({
      shape:new C.Cylinder(Math.max(.001,s.r1),Math.max(.001,s.r0),s.y1-s.y0,12),offset:new C.Vec3(0,(s.y0+s.y1)*.5-com,0)}));
    shapeCache.set(type,shapes);return shapes;
  }
  function sync(record,interpolate=false){
    const b=record.body,alpha=accumulator/FIXED;
    if(interpolate&&b.sleepState!==C.Body.SLEEPING){record.previousPosition.lerp(b.position,alpha,renderP);record.previousQuaternion.slerp(b.quaternion,alpha,renderQ);}
    else{renderP.copy(b.position);renderQ.copy(b.quaternion);}
    offset.set(0,-record.comY,0);renderQ.vmult(offset,v);renderP.vadd(v,v);
    record.position[0]=v.x;record.position[1]=v.y;record.position[2]=v.z;
    record.quaternion[0]=renderQ.x;record.quaternion[1]=renderQ.y;record.quaternion[2]=renderQ.z;record.quaternion[3]=renderQ.w;
    record.sleeping=b.sleepState===C.Body.SLEEPING;
    record.grounded=b.aabb.lowerBound.y<plan.groundY+.03&&b.position.y<plan.floorY-.10;
    record.inTray=b.position.z<front+.015&&b.position.y>plan.floorY-.045;
  }
  function spawn(type,options={}){
    if(records.size>=plan.maxBodies)return null;
    if(options.id&&records.has(options.id))return null;
    let trayCount=0;for(const r of records.values())if(r.inTray)trayCount++;
    const p=profileFor(type,profiles),comY=p.centerOfMass?.[1]??p.height*.5;
    const body=new C.Body({mass:p.mass,material:drinkMaterial(type,p),allowSleep:true,
      sleepSpeedLimit:.20,sleepTimeLimit:.9,linearDamping:.07,angularDamping:.22});
    body.name=type;for(const s of shapesFor(type,p))body.addShape(s.shape,s.offset);
    const position=options.position||[plan.spawn[0]+(random()-.5)*.085,plan.spawn[1],plan.spawn[2]+(random()-.5)*.02];
    body.position.set(...position);
    if(options.quaternion)body.quaternion.set(...options.quaternion);
    else body.quaternion.setFromEuler((random()-.5)*.30,(random()-.5)*.24,Math.PI*.5+(random()-.5)*.17);
    if(!options.position){
      body.updateAABB();const radiusBelowCOM=body.position.y-body.aabb.lowerBound.y;let safeY=body.position.y;
      for(const r of records.values()){
        r.body.updateAABB();const a=r.body.aabb,b=body.aabb;
        if(a.lowerBound.x<b.upperBound.x+.004&&a.upperBound.x>b.lowerBound.x-.004&&a.lowerBound.z<b.upperBound.z+.004&&a.upperBound.z>b.lowerBound.z-.004)
          safeY=Math.max(safeY,a.upperBound.y+radiusBelowCOM+.005);
      }
      if(safeY>plan.maxSpawnY)return null;
      stats.maxSpawnRaise=Math.max(stats.maxSpawnRaise,safeY-body.position.y);body.position.y=safeY;
    }
    body.velocity.set(...(options.velocity||[(random()-.5)*.09,-.18,.36+random()*.10]));
    body.angularVelocity.set(...(options.angularVelocity||[2.2+random()*.55,(random()-.5)*.70,(random()-.5)*1.2]));
    body.previousPosition.copy(body.position);body.previousQuaternion.copy(body.quaternion);
    body.updateAABB();world.addBody(body);body.wakeUp();
    const id=options.id||'vend-'+nextId++,record={id,type,body,profile:p,comY,
      birthStep:stats.steps,supported:false,supportGrace:0,quietTime:0,contactDepth:0,
      previousPosition:body.position.clone(),previousQuaternion:body.quaternion.clone(),
      position:new Float32Array(3),quaternion:new Float32Array(4),sleeping:false,grounded:false,inTray:false};
    records.set(id,record);bodyRecords.set(body,record);stats.spawned++;if(pusher&&trayCount>=2&&pushAge>=PUSH_DURATION)pushAge=0;
    body.addEventListener('collide',e=>{
      const other=e.body;if(groundSurfaces.has(other))stats.groundImpacts++;
      else if(other.mass===0)stats.trayImpacts++;else stats.dynamicImpacts++;
      if(onImpact){const speed=Math.abs(e.contact.getImpactVelocityAlongNormal());if(speed>.12)onImpact({id,type,other:other.name,speed,position:record.position});}
    });
    sync(record);return record;
  }
  function step(dt,{active=true,interpolate=true}={}){
    if(paused||!active||!Number.isFinite(dt)||dt<=0){accumulator=0;return 0;}
    const accepted=Math.min(dt,MAX_FRAME);stats.droppedTime+=Math.max(0,dt-accepted);stats.acceptedTime+=accepted;
    accumulator=Math.min(accumulator+accepted,MAX_FRAME);let steps=0,solverCalls=0;
    const clock=globalThis.performance?.now?()=>performance.now():()=>Date.now(),started=clock();
    physicsTicks:while(accumulator+1e-12>=FIXED&&steps<MAX_SUBSTEPS){
      // Sleeping scenes cost no narrowphase/solver work. Contacts automatically
      // wake old drinks when a newly inserted one reaches them.
      let awake=!!pusher&&pushAge<PUSH_DURATION,maxEdgeSpeed=0;for(const r of records.values())if(r.body.sleepState!==C.Body.SLEEPING){awake=true;
        maxEdgeSpeed=Math.max(maxEdgeSpeed,r.body.velocity.length()+r.body.angularVelocity.length()*r.body.boundingRadius);}
      if(awake){
        for(const r of records.values()){r.previousPosition.copy(r.body.position);r.previousQuaternion.copy(r.body.quaternion);}
        const divisions=maxEdgeSpeed>2.2?3:maxEdgeSpeed>.70?2:1;
        for(let part=0;part<divisions;part++){
          const h=FIXED/divisions;drivePusher(h);
          // Coulomb rolling resistance is a small physical torque, rather than
          // an animation or a positional nudge. Cannon's default contact
          // friction only handles sliding; real bottles also lose rolling
          // energy to the steel tray, rubber mat and rough paving.
          for(const r of records.values())if(r.supported&&r.body.sleepState!==C.Body.SLEEPING){
            const b=r.body,omega=b.angularVelocity.length();
            if(omega>.0005){offset.copy(b.angularVelocity);offset.scale(1/omega,offset);b.invInertiaWorld.vmult(offset,v);
              const inverseInertia=offset.dot(v),coefficient=r.profile.rollingFriction??.010;
              const torque=Math.min(coefficient*b.mass*9.81*r.profile.radius,omega/(h*Math.max(1e-8,inverseInertia)));
              b.torque.x-=offset.x*torque;b.torque.y-=offset.y*torque;b.torque.z-=offset.z*torque;
            }
          }
          world.step(h);stats.steps++;stats.simulatedTime+=h;solverCalls++;
          if(pusher&&pushAge>=PUSH_DURATION){pusher.velocity.set(0,0,0);pusher.angularVelocity.set(0,0,0);}
          for(const r of records.values())r.supported=false;
          for(const c of world.contacts){const r=bodyRecords.get(c.ni.y>.35?c.bj:c.ni.y<-.35?c.bi:null);if(r)r.supported=true;}
          // Sleep threshold uses surface speed in metres/second instead of
          // comparing tiny bottles' radians/second to their linear velocity.
          for(const r of records.values())if(r.body.sleepState!==C.Body.SLEEPING){
            const b=r.body;b.updateAABB();let supportY=plan.groundY;
            for(const patch of patches){const c=patch.center||[0,.006,.62],s=patch.size||[1.18,.012,.78];
              if(Math.abs(b.position.x-c[0])<s[0]*.5&&Math.abs(b.position.z-c[2])<s[2]*.5)supportY=Math.max(supportY,c[1]+s[1]*.5);}
            const groundNear=b.aabb.lowerBound.y<supportY+.004&&b.position.y<plan.floorY-.06;
            const floorAtBody=plan.floorY-(b.position.z-plan.centerZ)*Math.tan(plan.slope);
            const trayNear=Math.abs(b.position.x)<plan.width*.5&&b.position.z>back&&b.position.z<front&&Math.abs(b.aabb.lowerBound.y-floorAtBody)<.008;
            if(r.supported||groundNear||trayNear)r.supportGrace=.045;else r.supportGrace=Math.max(0,r.supportGrace-h);
            const supported=r.supportGrace>0;
            // Tiny discrete-contact gravity taps are under a millimetre of
            // travel, not renewed rolling. Exclude their vertical component
            // only while the body remains beside an actual support surface.
            const vy=supported&&Math.abs(b.velocity.y)<.18?0:b.velocity.y;
            const surfaceSpeed2=b.velocity.x*b.velocity.x+vy*vy+b.velocity.z*b.velocity.z+b.angularVelocity.lengthSquared()*r.profile.radius*r.profile.radius;
            if(supported&&surfaceSpeed2<.000225)r.quietTime+=h;
            else if(surfaceSpeed2<.0025)r.quietTime=Math.max(0,r.quietTime-h*.5);
            else r.quietTime=0;
            if(r.quietTime>.75){
              // Do not freeze a gravity tap's penetrating half of its cycle.
              // A resting face reaches a clean support pose on the next tick.
              if(groundNear&&b.aabb.lowerBound.y<supportY-.001)continue;
              if(r.contactDepth>.0013)continue;
              b.sleep();
            }
          }
          if(solverCalls>=plan.maxSolverSteps||clock()-started>=plan.maxCpuMs){
            // Carry no catch-up debt into the camera's next RAF. Physics may
            // slow during an exceptional tightly packed 32-body pile, while
            // camera input/rendering remains independent and responsive.
            const consumed=(part+1)*h;accumulator=Math.max(0,accumulator-consumed);
            stats.budgetDroppedTime+=accumulator;stats.droppedTime+=accumulator;stats.budgetOverruns++;
            accumulator=0;steps++;break physicsTicks;
          }
        }
      }
      accumulator-=FIXED;steps++;
    }
    for(const r of records.values())sync(r,interpolate);
    if(pusher){pusherTransform.position[0]=pusher.position.x;pusherTransform.position[1]=pusher.position.y;pusherTransform.position[2]=pusher.position.z;pusherTransform.quaternion.set([pusher.quaternion.x,pusher.quaternion.y,pusher.quaternion.z,pusher.quaternion.w]);pusherTransform.active=pushAge<PUSH_DURATION;}
    return steps;
  }
  function remove(id){const record=records.get(id);if(!record)return null;world.removeBody(record.body);records.delete(id);bodyRecords.delete(record.body);stats.removed++;return record;}
  function take(id){const r=records.get(id);if(!r)return null;const state={id:r.id,type:r.type,
    position:[r.body.position.x,r.body.position.y,r.body.position.z],
    quaternion:[r.body.quaternion.x,r.body.quaternion.y,r.body.quaternion.z,r.body.quaternion.w],
    velocity:[r.body.velocity.x,r.body.velocity.y,r.body.velocity.z],
    angularVelocity:[r.body.angularVelocity.x,r.body.angularVelocity.y,r.body.angularVelocity.z]};remove(id);return state;}
  function restore(state,{velocity=[0,0,0],angularVelocity=[0,0,0]}={}){
    return spawn(state.type,{...state,velocity,angularVelocity});
  }
  function reset(){for(const id of [...records.keys()])remove(id);accumulator=0;}
  if(pusher){pusherTransform.position.set([pusher.position.x,pusher.position.y,pusher.position.z]);}
  return {world,layout:plan,staticBodies,records,stats,pusherTransform,spawn,step,remove,take,restore,reset,
    get:id=>records.get(id),get bodyTransforms(){return records.values();},get size(){return records.size;},
    get paused(){return paused;},setPaused(value){paused=!!value;accumulator=0;},
    dispose(){reset();for(const b of staticBodies)world.removeBody(b);shapeCache.clear();},
    fixedTimeStep:FIXED,maxSubsteps:MAX_SUBSTEPS};
}
