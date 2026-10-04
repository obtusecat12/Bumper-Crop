/* Camp infrastructure. Coordinates in metres; all returned roots rest at local y = 0.
 * Shared PBR materials are supplied by the scene; no external dependencies.
 */
export function createCampUtilities(THREE, mats) {
  const {Group,Mesh,Vector2,Vector3,BoxGeometry,CylinderGeometry,SphereGeometry,TorusGeometry,
    TubeGeometry,CatmullRomCurve3,LatheGeometry,Shape,ShapeGeometry,MeshStandardMaterial,
    ShaderMaterial,DoubleSide,Color,BufferGeometry,Float32BufferAttribute}=THREE;
  const water=new Group(),pump=new Group(),generator=new Group(),tower=new Group(),laundry=new Group();
  const dynamicRoots=[];
  water.name='Rainwater station';pump.name='Lakeside centrifugal pump';generator.name='Diesel generator';
  tower.name='Timber watchtower';laundry.name='Camp laundry';
  const gray = mats.metal || new MeshStandardMaterial({color:0x65635b,roughness:.84});
  const material = key => mats[key] || gray;
  const localMats=[];
  function shade(key,color,roughness) {const m=material(key).clone();m.color.multiply(new Color(color));if(roughness!=null)m.roughness=roughness;localMats.push(m);return m;}
  const darkMetal=shade('metal',0xa6a9a2,.77), mutedBlue=shade('blue',0xb8c5cf,.58), darkWood=shade('wood',0x888074),
    palePvc=shade('pvc',0xe3dac5,.8), rusty=material('rust'), brass=material('brass'), rubber=material('rubber');
  const reusable=new Map();
  function geometry(key,fn){if(!reusable.has(key))reusable.set(key,fn());return reusable.get(key);}
  function add(group,geo,mat,x=0,y=0,z=0){const m=new Mesh(geo,typeof mat==='string'?material(mat):mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
  function box(group,w,h,d,mat,x=0,y=0,z=0){
    const key=`b/${w}/${h}/${d}`;
    const g=geometry(key,()=>{const g=new BoxGeometry(w,h,d);const uv=g.attributes.uv,n=g.attributes.normal;for(let i=0;i<uv.count;i++){const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i));uv.setXY(i,uv.getX(i)*(nx>.5?d:w),uv.getY(i)*(ny>.5?d:h));}return g;});
    return add(group,g,mat,x,y,z);
  }
  function cyl(group,r1,r2,h,mat,x=0,y=0,z=0,n=12){return add(group,geometry(`c/${r1}/${r2}/${h}/${n}`,()=>new CylinderGeometry(r1,r2,h,n,1,false)),mat,x,y,z);}
  function sphere(group,r,mat,x=0,y=0,z=0,scale){const m=add(group,geometry(`s/${r}`,()=>new SphereGeometry(r,12,8)),mat,x,y,z);if(scale)m.scale.set(...scale);return m;}
  function rod(group,a,b,r,mat,n=8,r2=r){const p=new Vector3(...a),q=new Vector3(...b),v=q.clone().sub(p);const m=cyl(group,r,r2,v.length(),mat,...p.clone().add(q).multiplyScalar(.5).toArray(),n);m.quaternion.setFromUnitVectors(new Vector3(0,1,0),v.normalize());return m;}
  function tube(group,pts,r,mat,segments=20,radial=6){return add(group,new TubeGeometry(new CatmullRomCurve3(pts.map(p=>new Vector3(...p))),segments,r,radial,false),mat);}
  function ring(group,r,t,mat,x,y,z,rotationX=Math.PI/2){const m=add(group,geometry(`t/${r}/${t}`,()=>new TorusGeometry(r,t,5,24)),mat,x,y,z);m.rotation.x=rotationX;return m;}
  function bolt(group,x,y,z,mat=darkMetal){return cyl(group,.036,.036,.03,mat,x,y,z,6);}
  function lash(group,x,y,z,axis='y',radius=.16){for(let i=0;i<4;i++){const r=ring(group,radius,.015,material('fabric'),x,y+i*.027,z);if(axis==='x')r.rotation.set(0,Math.PI/2,0);}}

  // Moulded polyethylene tank: domed shoulders, seam ribs, fill neck, drain boss.
  const tank=new Group();tank.position.set(2.5,0,0);water.add(tank);tank.name='Blue polyethylene storage tank';
  const tankProfile=[[0,.22],[1.16,.22],[1.34,.29],[1.47,.47],[1.49,.67],[1.49,2.83],[1.46,3.01],[1.31,3.24],[.99,3.43],[.54,3.55],[.25,3.57],[0,3.57]];
  add(tank,new LatheGeometry(tankProfile.map(p=>new Vector2(...p)),32),mutedBlue);
  for(const y of [.48,.69,1.21,1.76,2.3,2.84])ring(tank,1.487,.042,mutedBlue,0,y,0);
  for(const x of [-.96,.96])for(const z of [-.72,.72])box(tank,.4,.28,.56,darkMetal,x,.14,z);
  cyl(tank,.28,.28,.17,darkMetal,0,3.64,0,16);cyl(tank,.32,.32,.06,rubber,0,3.755,0,16);
  for(let i=0;i<8;i++){let a=i*Math.PI/4;box(tank,.055,.055,.11,darkMetal,Math.cos(a)*.27,3.79,Math.sin(a)*.27).rotation.y=-a;}
  // Tank-side level tube and its attachment clamps.
  tube(tank,[[1.19,.44,-.83],[1.35,.44,-.92],[1.35,3.1,-.92],[1.22,3.15,-.83]],.023,palePvc,12);
  for(const y of [.5,1.9,3.0])box(tank,.14,.07,.09,darkMetal,1.3,y,-.89);
  rod(tank,[-1.2,.55,0],[-1.72,.55,0],.12,brass,12);ring(tank,.14,.035,brass,-1.62,.55,0,0).rotation.y=Math.PI/2;
  // Supply: bottom tank outlet, upright and horizontal four-tap manifold.
  tube(water,[[.82,.55,0],[.58,.55,0],[.47,.67,0],[.47,1.89,0],[.31,2.03,0],[-5.64,2.03,0]],.064,palePvc,24,8);
  for(const x of [.45,-.5,-2.4,-4.3,-5.57]){
    const collar=cyl(water,.09,.09,.095,palePvc,x,2.03,0,10);collar.rotation.z=Math.PI/2;
  }
  for(const x of [-5.5,-3.1,-.66]){rod(water,[x,.04,-.08],[x,2.29,-.08],.075,'wood');rod(water,[x,2.03,-.08],[x,2.03,.01],.11,darkMetal);}
  const troughX=-3.05,troughY=.83,troughZ=.74,tw=5.35,td=1.1;
  // Five separate slabs form a genuinely hollow tile basin, with drain and raised grout edges.
  box(water,tw,.11,td,'tile',troughX,troughY,troughZ);
  box(water,tw,.39,.13,'tile',troughX,1.07,troughZ-td/2+.06);
  box(water,tw,.25,.14,'tile',troughX,.99,troughZ+td/2-.06);
  for(const sign of [-1,1])box(water,.13,.39,td,'tile',troughX+sign*(tw/2-.06),1.07,troughZ);
  for(const x of [-5.25,-3.1,-.9]){box(water,.26,.79,.77,'wood',x,.395,troughZ);rod(water,[x,.08,.3],[x,.78,1.13],.045,darkMetal);}
  rod(water,[-5.58,.61,.74],[-.55,.61,.74],.057,palePvc,10);
  tube(water,[[-.68,.83,.9],[-.68,.49,.9],[-.42,.26,1.06],[-.22,.03,1.74]],.06,palePvc,12,8);
  cyl(water,.075,.075,.012,darkMetal,-.68,.895,.9,12);
  for(let i=0;i<5;i++)box(water,.011,.007,.115,gray,-.72+i*.022,.905,.9);
  const waterUniforms={uTime:{value:0}};
  const streamMat=new ShaderMaterial({uniforms:waterUniforms,transparent:true,depthWrite:false,side:DoubleSide,
    vertexShader:'varying vec2 vUv; varying vec3 vNormal; void main(){vUv=uv;vNormal=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'varying vec2 vUv;varying vec3 vNormal;uniform float uTime;void main(){vec2 flowingUV=vec2(vUv.x,vUv.y+uTime*2.7);float streak=sin(flowingUV.y*42.0+sin(flowingUV.x*31.4)*2.3)*.5+.5;float edge=pow(abs(vNormal.z),3.);gl_FragColor=vec4(mix(vec3(.29,.45,.48),vec3(.84,.92,.88),streak*.46+edge*.4),.36+streak*.28);}'
  });
  const taps=[],streams=[];
  for(let i=0;i<4;i++){
    const x=-5.06+i*1.33;
    rod(water,[x,2.03,0],[x,2.03,.28],.054,brass,10);
    const body=sphere(water,.09,brass,x,2.03,.28,[1,1,1.3]);body.name=`Tap ${i+1}`;body.userData.tapIndex=i;body.userData.interactable='tap';dynamicRoots.push(body);
    tube(water,[[x,2.01,.29],[x,1.99,.48],[x,1.91,.61],[x,1.79,.61]],.04,brass,12,8);
    cyl(water,.052,.052,.075,brass,x,1.775,.61,10);
    rod(water,[x,2.03,.26],[x,2.21,.26],.028,brass,8);
    const handle=new Group();handle.position.set(x,2.23,.26);water.add(handle);
    rod(handle,[-.13,0,0],[.13,0,0],.022,brass,8);rod(handle,[0,0,-.13],[0,0,.13],.022,brass,8);
    for(const [ax,az] of [[-.13,0],[.13,0],[0,-.13],[0,.13]])sphere(handle,.029,brass,ax,0,az);
    handle.userData.tapIndex=i;handle.userData.interactable='tap';
    handle.traverse(o=>{if(o.isMesh){o.userData.tapIndex=i;o.userData.interactable='tap';}});
    const stream=cyl(water,.014,.031,.835,streamMat,x,1.33,.61,7);stream.castShadow=false;stream.visible=i===0||i===2;
    const splash=ring(water,.12,.012,streamMat,x,.905,.61);splash.visible=stream.visible;splash.castShadow=false;
    streams.push({stream,splash});taps.push({handle,on:stream.visible});dynamicRoots.push(handle,stream,splash);
  }
  // Muddy wash accessories: freestanding ridged washboard, asymmetric basins and soap.
  const washboard=new Group();water.add(washboard);washboard.position.set(-4.23,1.0,1.0);washboard.rotation.set(-.53,.12,.08);
  for(const x of [-.235,.235])box(washboard,.055,.78,.07,'wood',x,.39,0);
  for(const y of [.11,.61,.75])box(washboard,.48,.07,.07,'wood',0,y,0);
  box(washboard,.42,.48,.035,darkMetal,0,.365,0);
  for(let i=0;i<13;i++)rod(washboard,[-.21,.145+i*.035,.025],[.21,.145+i*.035,.025],.012,gray,6);
  function basin(x,y,z,r,color){const m=shade('blue',color,.73);const profile=[[0,0],[r*.72,0],[r,.23],[r,.26],[r-.033,.26],[r-.055,.224],[r*.69,.035],[0,.035]];
    const g=add(water,new LatheGeometry(profile.map(p=>new Vector2(...p)),20),m,x,y,z);g.rotation.y=.2;ring(water,r,.023,m,x,y+.258,z);return g;}
  basin(-1.71,.895,.76,.32,0xd3b390);basin(-5.18,.895,.93,.29,0x86a796);basin(-3.2,.03,1.76,.43,0x859fbd);
  const soap=box(water,.145,.054,.086,'ceramic',-2.14,1.14,1.21);soap.rotation.y=.5;soap.scale.x=.66;
  box(water,.24,.025,.13,darkMetal,-2.14,1.115,1.21);
  // Intake fill neck sits high enough for a hose from the external pump.
  tube(tank,[[0,3.29,1.27],[0,3.41,1.49],[0,3.15,1.64]],.079,palePvc,10,8);

  // Pump skid, centrifugal snail housing, exposed flywheel, belt and drive motor.
  for(const z of [-.37,.37])box(pump,1.64,.14,.14,darkWood,0,.08,z);
  for(const x of [-.57,.57])box(pump,.14,.1,.89,darkMetal,x,.19,0);
  box(pump,.62,.12,.5,rusty,-.46,.31,0);
  const pumpHousing=cyl(pump,.37,.36,.28,rusty,-.5,.68,0,18);pumpHousing.rotation.x=Math.PI/2;
  ring(pump,.3,.04,darkMetal,-.5,.68,.155,0);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;const b=bolt(pump,-.5+Math.cos(a)*.285,.68+Math.sin(a)*.285,.181);b.rotation.x=Math.PI/2;}
  rod(pump,[-.5,.68,.1],[-.5,.68,.49],.11,darkMetal,12);
  ring(pump,.14,.039,rusty,-.5,.68,.49,0);
  tube(pump,[[-.52,.86,0],[-.45,1.09,0],[-.24,1.12,0]],.1,rusty,12,8);
  const drive=cyl(pump,.225,.225,.55,darkMetal,.4,.62,0,14);drive.rotation.z=Math.PI/2;
  for(let i=0;i<10;i++){const a=i*Math.PI/5;rod(pump,[.13,.62+Math.cos(a)*.215,Math.sin(a)*.215],[.67,.62+Math.cos(a)*.215,Math.sin(a)*.215],.012,gray,5);}
  for(const x of [.17,.61])box(pump,.13,.23,.36,rusty,x,.37,0);
  const fan=cyl(pump,.245,.245,.065,gray,.72,.62,0,14);fan.rotation.z=Math.PI/2;
  for(let i=-3;i<=3;i++){const zz=i*.055;rod(pump,[.76,.44,zz],[.76,.8,zz],.008,darkMetal,5);}
  const wheel=ring(pump,.27,.027,rusty,-.47,.68,-.27,0);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;rod(pump,[-.47,.68,-.27],[-.47+Math.cos(a)*.25,.68+Math.sin(a)*.25,-.27],.026,rusty,6);}
  ring(pump,.105,.021,darkMetal,.42,.62,-.27,0);
  tube(pump,[[-.48,.95,-.27],[.42,.724,-.27],[.53,.62,-.27],[.42,.516,-.27],[-.48,.41,-.27],[-.75,.67,-.27],[-.48,.95,-.27]],.016,rubber,24,5);
  box(pump,.19,.12,.2,darkMetal,.37,.87,.01);rod(pump,[.37,.85,.1],[.37,.35,.34],.012,rubber);

  // Old diesel generator: steel skid, engine block, radiator, alternator, fuel reservoir.
  for(const z of [-.63,.63]){box(generator,2.87,.16,.15,darkMetal,0,.12,z);box(generator,.14,.33,.83,darkMetal,-1.36,.245,0);}
  for(const x of [-1.18,1.18])box(generator,.16,.13,1.39,rusty,x,.21,0);
  for(const x of [-.86,.75])for(const z of [-.42,.42]){cyl(generator,.105,.12,.15,rubber,x,.32,z);bolt(generator,x,.411,z);}
  box(generator,1.1,.64,.75,shade('olive',0x676b54),-.31,.72,0);
  box(generator,1.17,.13,.86,darkMetal,-.31,1.1,0);
  for(let i=0;i<4;i++){const x=-.72+i*.29;box(generator,.21,.17,.65,gray,x,1.23,0);tube(generator,[[x,1.25,-.1],[x,1.45,-.21],[x,1.17,-.48],[x,.75,-.48]],.019,brass,9,6);bolt(generator,x,1.338,.21);}
  const alt=cyl(generator,.39,.4,.71,shade('olive',0x858874),.72,.8,0,16);alt.rotation.z=Math.PI/2;
  const rear=cyl(generator,.41,.41,.075,darkMetal,1.13,.8,0,16);rear.rotation.z=Math.PI/2;
  for(let i=0;i<12;i++){const a=i*Math.PI/6;rod(generator,[.42,.8+Math.cos(a)*.39,Math.sin(a)*.39],[1.07,.8+Math.cos(a)*.39,Math.sin(a)*.39],.018,gray,6);}
  const fly=cyl(generator,.32,.32,.09,rusty,-.99,.73,0,16);fly.rotation.z=Math.PI/2;
  box(generator,.2,1.03,1.06,darkMetal,-1.22,.905,0);
  for(let i=0;i<17;i++)box(generator,.027,.018,.9,gray,-1.335,.445+i*.056,0);
  for(const z of [-.51,.51])box(generator,.035,1.02,.037,rusty,-1.35,.905,z);
  cyl(generator,.07,.07,.06,brass,-1.23,1.47,0,8);
  // Rectangular welded fuel tank with softened rounded edges represented by seam rails.
  box(generator,1.33,.34,.71,rusty,-.2,1.6,0);
  for(const z of [-.355,.355])rod(generator,[-.865,1.61,z],[.465,1.61,z],.029,darkMetal,8);
  for(const x of [-.65,.26])box(generator,.055,.37,.76,darkMetal,x,1.6,0);
  cyl(generator,.085,.085,.067,darkMetal,-.49,1.805,.04,10);
  tube(generator,[[.16,1.45,-.21],[.16,1.03,-.42],[-.5,.74,-.43]],.018,rubber,12);
  // Ceramic-insulated panel ports and an actual gauge face with pointer.
  const panel=box(generator,.58,.48,.115,darkMetal,.74,1.32,.43);panel.rotation.x=-.11;
  const dial=cyl(generator,.105,.105,.028,'ceramic',.59,1.41,.51,20);dial.rotation.x=Math.PI/2;
  ring(generator,.108,.009,gray,.59,1.41,.53,0);
  rod(generator,[.59,1.41,.545],[.64,1.47,.545],.006,darkMetal,5);
  for(const x of [.87,1.01]){cyl(generator,.032,.032,.025,rubber,x,1.41,.525,8).rotation.x=Math.PI/2;box(generator,.039,.08,.027,gray,x,1.27,.51);}
  for(const x of [.56,.72,.88]){cyl(generator,.032,.032,.026,'ceramic',x,1.15,.52,8).rotation.x=Math.PI/2;rod(generator,[x,1.15,.54],[x,1.02,.68],.011,rubber,6);}
  tube(generator,[[-.56,1.23,-.26],[-.61,1.39,-.55],[-.67,1.66,-.57],[-.67,2.34,-.57]],.055,rusty,16,8);
  cyl(generator,.12,.12,.56,darkMetal,-.67,1.83,-.57,12);
  const exhaustCap=cyl(generator,.075,.075,.018,rusty,-.64,2.35,-.57,10);exhaustCap.rotation.z=-.34;
  box(generator,.3,.45,.2,darkMetal,1.36,1.01,.4);rod(generator,[1.36,1.12,.49],[1.36,1.23,.57],.025,rubber);

  // Watchtower: splayed roundwood legs, structural cross braces, plank deck and lean roof.
  const legPos=[[-1.8,-1.8],[1.8,-1.8],[1.8,1.8],[-1.8,1.8]];
  for(const [x,z] of legPos){
    rod(tower,[x,.02,z],[x*.86,7.36,z*.86],.14,'wood',9,.21);
    cyl(tower,.29,.33,.24,'mud',x,.1,z,8);
    for(const y of [.52,2.45,5.54,6.58])lash(tower,x*(1-y*.019),y,z*(1-y*.019),'y',.168);
  }
  for(let i=0;i<4;i++){
    const a=legPos[i],b=legPos[(i+1)%4];
    rod(tower,[a[0]*.98,.67,a[1]*.98],[b[0]*.9,4.85,b[1]*.9],.084,'wood',8);
    rod(tower,[b[0]*.98,.67,b[1]*.98],[a[0]*.9,4.85,a[1]*.9],.075,darkWood,8);
    rod(tower,[a[0]*.94,2.45,a[1]*.94],[b[0]*.94,2.45,b[1]*.94],.086,'wood',8);
    rod(tower,[a[0]*.87,5.42,a[1]*.87],[b[0]*.87,5.42,b[1]*.87],.14,'wood',8);
    if(i!==2)rod(tower,[a[0]*.85,6.57,a[1]*.85],[b[0]*.85,6.57,b[1]*.85],.064,'wood',8);
    // Chest boards have visible gaps and do not disguise the load-bearing members.
    if(i!==2){for(let j=0;j<9;j++){const t=(j+.5)/9;const x=(a[0]+(b[0]-a[0])*t)*.85,z=(a[1]+(b[1]-a[1])*t)*.85;
      const p=box(tower,.3,.63,.055,j%3===0?darkWood:material('wood'),x,5.99,z);p.rotation.y=i%2===1?Math.PI/2:0;p.rotation.z=(j%3-1)*.025;}}
  }
  for(let i=0;i<14;i++)box(tower,.23,.105,3.69,i%4===0?darkWood:material('wood'),-1.615+i*.248,5.58,0);
  for(const z of [-1.61,0,1.61])rod(tower,[-1.85,5.43,z],[1.85,5.43,z],.12,'wood',8);
  // Low-pitch corrugated roof, ridge and rafters with honest overhang.
  for(const side of [-1,1]){
    const roof=box(tower,2.19,.055,4.27,rusty,side*1.04,7.71,0);roof.rotation.z=-side*.215;
    for(let j=0;j<23;j++)rod(tower,[side*.025,7.942,-2.08+j*.183],[side*2.1,7.488,-2.08+j*.183],.029,rusty,5);
    for(const z of [-1.69,0,1.69])rod(tower,[0,7.93,z],[side*2.14,7.46,z],.072,'wood',7);
  }
  rod(tower,[0,7.96,-2.18],[0,7.96,2.18],.083,rusty,7);
  for(const z of [-1.55,1.55])rod(tower,[-1.65,7.42,z],[1.65,7.42,z],.09,'wood',8);
  // Access ladder meets the deck and leaves a person-sized gap in the front parapet.
  for(const x of [-.42,.42])rod(tower,[x,.1,2.83],[x,5.86,1.58],.047,'wood',8);
  for(let i=0;i<19;i++){const t=i/18;rod(tower,[-.43,.3+t*5.37,2.79-t*1.17],[.43,.3+t*5.37,2.79-t*1.17],.039,'wood',7);}
  for(const side of [-1,1]){
    rod(tower,[side*.58,5.59,1.57],[side*.58,6.55,1.57],.061,'wood',7);
    rod(tower,[side*.59,6.55,1.57],[side*1.55,6.55,1.57],.055,'wood',7);
  }
  // Field binoculars on a plank ledge, a coiled rope and a plain radio housing.
  box(tower,.72,.065,.3,'wood',.78,6.43,-1.58);
  for(const x of [.64,.83])rod(tower,[x,6.55,-1.45],[x,6.55,-1.77],.057,darkMetal,10);
  box(tower,.2,.06,.13,darkMetal,.735,6.55,-1.59);
  for(let i=0;i<5;i++)ring(tower,.2+i*.022,.019,'fabric',-1.12,5.65,-1.03);

  // Clothesline: actual sagging ropes, sewn garment silhouettes, independent pin anchors.
  const clothUniforms={uCampWindTime:{value:0}};
  function clothMat(key,tint){const m=shade(key,tint,.98);m.side=DoubleSide;m.userData.campVertexWind=true;const original=m.onBeforeCompile;m.onBeforeCompile=shader=>{
      if(original)original(shader);shader.uniforms.uCampWindTime=clothUniforms.uCampWindTime;
      shader.vertexShader='uniform float uCampWindTime;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        float campDrop = clamp(-position.y / 1.2, 0.0, 1.0);
        transformed.z += (sin(uCampWindTime*1.32 + position.x*3.1 + position.y*2.8)*.10 + sin(uCampWindTime*2.05+position.y*7.)*.028)*campDrop;
        transformed.x += sin(uCampWindTime*.91+position.y*3.2)*.026*campDrop;`);
    };m.customProgramCacheKey=()=>`camp-laundry-${key}`;return m;}
  const clothMats=[clothMat('fabric',0xb7b1a4),clothMat('olive',0x8b9581),clothMat('fabric',0x858f9b),clothMat('fabric',0xaaa49a),clothMat('olive',0x666e5d),clothMat('fabric',0xb69e7c)];
  for(const x of [-3.8,3.8]){
    rod(laundry,[x,0,0],[x,2.63,0],.095,'wood',9,.13);
    rod(laundry,[x,2.42,-.66],[x,2.42,.66],.055,'wood',7);
    for(const side of [-1,1]){rod(laundry,[x,.05,side*.68],[x,1.36,0],.047,'wood',7);rod(laundry,[x,2.5,0],[x+side*.87,.05,side*.58],.014,'fabric',5);}
  }
  function ropeY(x){return 2.43-.22*(1-Math.pow(x/3.8,2));}
  for(const z of [-.49,.49])tube(laundry,[[-3.8,2.43,z],[-1.9,2.263,z],[0,2.21,z],[1.9,2.263,z],[3.8,2.43,z]],.014,'fabric',22,5);
  function garmentGeometry(kind){
    // Filled subdivided grid clipped against a tailored polygon; suitable for vertex bending.
    const polygon=kind==='trousers'?[[-.34,0],[.34,0],[.31,-1.2],[.06,-1.2],[0,-.45],[-.07,-1.2],[-.33,-1.2]]:
      kind==='towel'?[[-.35,0],[.35,0],[.35,-.94],[-.35,-.94]]:
      [[-.21,0],[.21,0],[.42,-.1],[.66,-.4],[.46,-.53],[.28,-.34],[.28,-.93],[-.28,-.93],[-.28,-.34],[-.46,-.53],[-.66,-.4],[-.42,-.1]];
    function inside(x,y){let c=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
    const sh=new Shape();polygon.forEach((p,i)=>i===0?sh.moveTo(...p):sh.lineTo(...p));sh.closePath();
    const base=new ShapeGeometry(sh,1); // Subdivide each outline triangle twice to retain the exact silhouette.
    let pos=Array.from(base.index?base.toNonIndexed().attributes.position.array:base.attributes.position.array);
    for(let k=0;k<3;k++){const next=[];for(let i=0;i<pos.length;i+=9){const a=pos.slice(i,i+3),b=pos.slice(i+3,i+6),c=pos.slice(i+6,i+9),ab=a.map((v,j)=>(v+b[j])*.5),bc=b.map((v,j)=>(v+c[j])*.5),ca=c.map((v,j)=>(v+a[j])*.5);next.push(...a,...ab,...ca,...ab,...b,...bc,...ca,...bc,...c,...ab,...bc,...ca);}pos=next;}
    const uvs=[];for(let i=0;i<pos.length;i+=3){const x=pos[i],y=pos[i+1];pos[i+2]=Math.sin(x*23+y*4)*.018*Math.min(1,-y*4);uvs.push(x+.7,-y);}
    const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(pos,3));g.setAttribute('uv',new Float32BufferAttribute(uvs,2));g.computeVertexNormals();base.dispose();return g;
  }
  for(let i=0;i<8;i++){
    const x=-2.96+(i%4)*1.92,z=i<4?-.49:.49,kind=i%3===0?'trousers':i%3===1?'shirt':'towel';
    const cloth=add(laundry,garmentGeometry(kind),clothMats[i%6],x,ropeY(x),z);cloth.rotation.y=(i%3-1)*.04;cloth.castShadow=false;dynamicRoots.push(cloth);
    for(const sign of [-1,1]){const clip=box(laundry,.035,.1,.043,'wood',x+sign*.2,ropeY(x)+.02,z);clip.rotation.z=sign*.06;}
    // Small collar seam or trouser waist sewn on as geometry, sharing the pinned top edge.
    if(kind==='shirt')tube(laundry,[[x-.12,ropeY(x),z-.009],[x,ropeY(x)-.055,z-.016],[x+.12,ropeY(x),z-.009]],.01,clothMats[i%6],10,5);
  }

  const anchors={
    tankInlet:new Vector3(2.5,3.15,1.64),
    pumpIntake:new Vector3(-.5,.68,.49),pumpOutlet:new Vector3(-.24,1.12,0),
    powerOut:new Vector3(1.36,1.23,.57),exhaust:new Vector3(-.67,2.37,-.57),
    towerBulb:new Vector3(.55,7.22,0),towerEntry:new Vector3(0,0,2.83),
    washLight:new Vector3(-3.1,2.42,-.08),troughDrain:new Vector3(-.22,.03,1.74)
  };
  water.userData.tapTargets=taps.map(t=>t.handle);generator.userData.powerOut=anchors.powerOut;generator.userData.exhaust=anchors.exhaust;
  pump.userData.hosePorts={intake:anchors.pumpIntake,outlet:anchors.pumpOutlet};
  function toggleTap(index){const t=taps[index];if(!t)return false;t.on=!t.on;t.handle.rotation.y=t.on?Math.PI*.5:0;streams[index].stream.visible=t.on;streams[index].splash.visible=t.on;return t.on;}
  taps.forEach(t=>{t.handle.rotation.y=t.on?Math.PI*.5:0;});
  function update(time,dt){waterUniforms.uTime.value=time;clothUniforms.uCampWindTime.value=time;for(let i=0;i<streams.length;i++){if(taps[i].on){const s=streams[i].splash;s.scale.setScalar(.78+Math.sin(time*12+i)*.18);}}}
  dynamicRoots.forEach(root=>{root.userData.campDynamic=true;});
  return {water,pump,generator,tower,laundry,tank,anchors,hosePorts:pump.userData.hosePorts,taps,dynamicRoots,materialClones:localMats,update,toggleTap};
}
