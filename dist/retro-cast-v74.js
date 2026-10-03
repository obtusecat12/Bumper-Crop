/* V74: metre-scale, +Z-facing, nineteen-bone PS1/early-PS2 cast.
 * No renderer, frame scheduler, network request or global event listener lives here.
 * Supplied textures remain caller-owned. Body and eye animation sample at 15 Hz.
 */

export const RETRO_ROLES74 = Object.freeze(['homeless','wallman','reader','plaid','receptionist','poolman']);
export const RETRO_POSE_HZ74 = 15;

const PROFILES = {
  homeless:     { height:.96, shoulder:.88, waist:.86, limb:.82, head:[.94,1.03,1.00], jaw:.78, nose:1.20, hair:0x777363, trousers:0x292d27, shoe:0x39352c, duration:12 },
  wallman:      { height:1.00, shoulder:1.04, waist:1.06, limb:1.01, head:[1.07,.99,1.04], jaw:1.15, nose:.96, hair:0x51423a, trousers:0x252723, shoe:0x29251f, duration:10 },
  reader:       { height:1.01, shoulder:.94, waist:.90, limb:.89, head:[.91,1.05,.97], jaw:.90, nose:1.09, hair:0x28241f, trousers:0x41434a, shoe:0x191a1a, duration:12 },
  plaid:        { height:.98, shoulder:1.14, waist:1.25, limb:1.14, head:[1.11,.97,1.05], jaw:1.08, nose:1.02, hair:0x625d50, trousers:0x45423a, shoe:0x312b25, duration:8 },
  receptionist: { height:.93, shoulder:.91, waist:1.04, limb:.91, head:[.98,.98,.96], jaw:.85, nose:1.00, hair:0xc2bcb1, trousers:0x302f36, shoe:0x252325, duration:10 },
  poolman:      { height:1.02, shoulder:1.10, waist:1.00, limb:1.07, head:[1.00,1.01,1.07], jaw:1.13, nose:1.02, hair:0x201c19, trousers:0x16253f, shoe:0x6c5141, duration:10 }
};

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t;
const hash=n=>{let x=(n|0)^0x9e3779b9;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return((x^(x>>>15))>>>0)/4294967296;};
const roleSeed=s=>{let n=174;for(let i=0;i<s.length;i++)n=Math.imul(n^s.charCodeAt(i),16777619);return n>>>0;};

/**
 * @param {object} T The host's existing THREE namespace (r180 compatible).
 * @param {string} role One of RETRO_ROLES74.
 * @param {object} textures {face, faceBlink, body, newspaper?}; each supplied image is 128².
 * @param {object} opts {seatHeight, seed, scale, skinUV, hairUV, castShadow, phase}.
 * @returns {{group,update,dispose,diagnostics,bones,sockets,forceBlink,samplePose,mixer,mesh}}
 */
export function createRetroActor74(T, role, textures, opts={}) {
  if(!PROFILES[role]) throw new Error('Unknown V74 NPC role: '+role);
  if(!textures?.face || !textures?.body) throw new Error('V74 NPC requires preloaded face and body textures.');
  const profile=PROFILES[role], seed=opts.seed??roleSeed(role), isPool=role==='poolman';
  const isSeated=role==='reader'||role==='plaid';
  const requestedSeatHeight=opts.seatHeight??(role==='plaid'?.47:.56);
  const group=new T.Group();group.name='V74 / '+role;group.userData.retroRole=role;
  const bones={}, boneList=[], bindPositions={}, sockets={};
  const scale=profile.height*(opts.scale??1);
  const seatHeight=requestedSeatHeight/scale;
  const groundHeight=(opts.groundHeight??0)/scale;
  const color=hex=>{const c=new T.Color(hex);return[c.r,c.g,c.b];};
  const white=[1,1,1], skinColor=white;
  const skinUV=opts.skinUV??[.20,.46], hairUV=opts.hairUV??[.5,.955];

  function bone(name,parent,xyz) {
    const b=new T.Bone();b.name=name;b.position.set(...xyz);b.userData.index=boneList.length;
    (parent?bones[parent]:group).add(b);bones[name]=b;boneList.push(b);bindPositions[name]=xyz.slice();return b;
  }
  bone('hips',null,[0,.88,0]);bone('spine','hips',[0,.15,0]);bone('chest','spine',[0,.18,0]);
  bone('neck','chest',[0,.205,0]);bone('head','neck',[0,.020,0]);
  for(const [side,sign] of [['L',1],['R',-1]]) {
    bone('clavicle'+side,'chest',[sign*.12*profile.shoulder,.115,0]);
    bone('upperArm'+side,'clavicle'+side,[sign*.12*profile.shoulder,0,0]);
    bone('foreArm'+side,'upperArm'+side,[0,-.28,0]);bone('hand'+side,'foreArm'+side,[0,-.245,0]);
    bone('thigh'+side,'hips',[sign*.105,-.035,0]);bone('shin'+side,'thigh'+side,[0,-.40,0]);bone('foot'+side,'shin'+side,[0,-.37,0]);
  }
  group.updateMatrixWorld(true);
  const bindWorld=Object.fromEntries(boneList.map(b=>[b.name,b.matrixWorld.clone()]));
  const index=name=>bones[name].userData.index;
  const W=(name,w=1,other=null)=>other?[[index(name),w],[index(other),1-w]]:[[index(name),w]];
  const bins=Array.from({length:6},()=>({p:[],uv:[],c:[],si:[],sw:[]}));
  const partTriangles={};let part='body';
  function vertex(bin,p,uv,col,w) {
    bin.p.push(...p);bin.uv.push(...uv);bin.c.push(...col);
    for(let k=0;k<4;k++){bin.si.push(w[k]?.[0]??0);bin.sw.push(w[k]?.[1]??0);}
  }
  function tri(mat,a,b,c,uva,uvb,uvc,col,wa,wb=wa,wc=wa) {
    const bin=bins[mat];vertex(bin,a,uva,col,wa);vertex(bin,b,uvb,col,wb);vertex(bin,c,uvc,col,wc);
    partTriangles[part]=(partTriangles[part]||0)+1;
  }
  function quad(mat,a,b,c,d,uvs,col,ws) {
    tri(mat,a,b,d,uvs[0],uvs[1],uvs[3],col,ws[0],ws[1],ws[3]);
    tri(mat,b,c,d,uvs[1],uvs[2],uvs[3],col,ws[1],ws[2],ws[3]);
  }
  function patchUV(u,v,span=.012){return[u+span,v+span];}
  function tube(rings,n,mat,col,uvStyle='body',caps=true) {
    // Cross-sections must run bottom to top so sleeve/leg faces point outward too.
    if(rings[rings.length-1].p[1]<rings[0].p[1])rings=rings.slice().reverse();
    const points=rings.map(r=>Array.from({length:n},(_,j)=>{
      const a=2*Math.PI*j/n, front=Math.cos(a)>=0;
      return[r.p[0]+Math.sin(a)*r.rx,r.p[1],r.p[2]+Math.cos(a)*(front?(r.rzFront??r.rz):(r.rzBack??r.rz))];
    }));
    const uv=(i,j,front=false)=>{
      if(uvStyle==='skin')return patchUV(skinUV[0]+Math.sin(j)*.004,skinUV[1]+i*.003);
      if(uvStyle==='hair')return patchUV(hairUV[0],hairUV[1],.003);
      if(uvStyle==='bodyFront'&&front)return[(Math.sin(2*Math.PI*j/n)+1)*.5,i/(rings.length-1)];
      // Sleeves, backs and trousers sample ordinary cloth, never shirt buttons or lapels.
      return[.035+.20*j/n,.08+.84*i/(rings.length-1)];
    };
    for(let i=0;i<rings.length-1;i++)for(let j=0;j<n;j++) {
      const k=(j+1)%n;
      const front=Math.cos(2*Math.PI*(j+.5)/n)>0;
      quad(mat,points[i][j],points[i][k],points[i+1][k],points[i+1][j],[uv(i,j,front),uv(i,j+1,front),uv(i+1,j+1,front),uv(i+1,j,front)],col,[rings[i].w,rings[i].w,rings[i+1].w,rings[i+1].w]);
    }
    if(caps)for(const i of [0,rings.length-1])for(let j=0;j<n;j++) {
      const k=(j+1)%n,order=i===0?[j,k]:[k,j];
      tri(mat,rings[i].p,points[i][order[0]],points[i][order[1]],uv(i,0),uv(i,order[0]),uv(i,order[1]),col,rings[i].w);
    }
  }
  function box(center,size,mat,col,w,transform=null) {
    const [x,y,z]=center,[a,b,c]=size.map(v=>v*.5);
    const ps=[[-a,-b,-c],[a,-b,-c],[a,b,-c],[-a,b,-c],[-a,-b,c],[a,-b,c],[a,b,c],[-a,b,c]].map(p=>{
      const v=new T.Vector3(p[0]+x,p[1]+y,p[2]+z);if(transform)v.applyMatrix4(transform);return v.toArray();
    });
    for(const q of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]])quad(mat,...q.map(i=>ps[i]),[[0,0],[1,0],[1,1],[0,1]],col,[w,w,w,w]);
  }
  function poly(geo,mat,col,w,matrix,uv=[.5,.5]) {
    const g=geo.index?geo.toNonIndexed():geo,p=g.getAttribute('position');
    for(let i=0;i<p.count;i+=3) {
      const ps=[];for(let j=0;j<3;j++)ps.push(new T.Vector3().fromBufferAttribute(p,i+j).applyMatrix4(matrix).toArray());
      tri(mat,...ps,uv,uv,uv,col,w);
    }
    if(g!==geo)g.dispose();geo.dispose();
  }
  const transform=(p,s=[1,1,1],e=[0,0,0])=>new T.Matrix4().compose(new T.Vector3(...p),new T.Quaternion().setFromEuler(new T.Euler(...e)),new T.Vector3(...s));

  // One anatomical torso surface: pelvis, waist, rib cage, shoulder slope and trapezius.
  const torso=[
    [.760,.143,.095,'hips'],[.835,.170,.107,'hips'],[.950,.153,.112,'spine'],
    [1.045,.160,.117,'spine'],[1.145,.198,.132,'chest'],[1.255,.224,.132,'chest'],
    [1.325,.225,.108,'chest'],[1.375,.095,.072,'neck']
  ];
  part='torso';tube(torso.map(([y,w,d,b])=>({p:[0,y,0],rx:w*(y<1.15?profile.waist:profile.shoulder),rz:d*(y<1.15?profile.waist:1),rzFront:d*1.06,rzBack:d*.84,w:W(b)})),10,0,white,'bodyFront');
  // Compact exposed neck sits down inside the sloping shoulder opening.
  part='neck';tube([1.35,1.40,1.48].map((y,i)=>({p:[0,y,0],rx:[.074,.066,.067][i],rz:[.068,.060,.065][i],w:W(i===0?'chest':i===1?'neck':'head')})),8,2,skinColor,'skin');

  for(const [side,sign] of [['L',1],['R',-1]]) {
    const x=sign*.24*profile.shoulder, upper='upperArm'+side, lower='foreArm'+side, hand='hand'+side;
    // Upper arm and forearm share an elbow ring; no disconnected ball joints.
    const armRows=[[1.342,.081,upper],[1.270,.083,upper],[1.125,.065,upper],[1.045,.059,lower],[.915,.057,lower],[.800,.044,lower]];
    part='arms';tube(armRows.map(([y,r,b],i)=>({p:[i===0?x*.92:x,y,0],rx:r*profile.limb,rz:r*.90*profile.limb,w:i===0?W('clavicle'+side):i===1?W(upper,.8,'clavicle'+side):i===3?W(upper,.35,lower):W(b)})),8,0,white);
    part='hands';tube([[.815,.043,.040],[.774,.051,.029],[.707,.042,.025],[.684,.030,.021]].map(([y,rx,rz])=>({p:[x,y,.014],rx:rx*profile.limb,rz:rz*profile.limb,w:W(hand)})),6,2,skinColor,'skin');
    // A joined thumb wedge, with the same wrist bone as the mitten palm.
    const thumbMat=transform([x-sign*.038,.747,.034],[.024,.045,.026],[0,0,sign*.4]);
    part='thumbs';poly(new T.OctahedronGeometry(1,0),2,skinColor,W(hand),thumbMat,skinUV);
    const hip='thigh'+side,knee='shin'+side,foot='foot'+side;
    const legRows=[[.864,.107,hip],[.790,.109,hip],[.620,.091,hip],[.445,.076,knee],[.280,.071,knee],[.075,.052,knee]];
    part='legs';tube(legRows.map(([y,r,b],i)=>({p:[sign*.105,y,0],rx:r*profile.limb,rz:r*1.02*profile.limb,w:i===0?W('hips'):i===1?W(hip,.75,'hips'):i===3?W(hip,.30,knee):W(b)})),8,0,isPool?white:color(profile.trousers));
    if(isPool){
      // Separate six-sided shorts hems preserve a legible navy garment boundary.
      part='shorts';tube([[.861,.115],[.72,.116],[.650,.106]].map(([y,r])=>({p:[sign*.105,y,0],rx:r*profile.limb,rz:r*profile.limb,w:W(hip)})),6,3,color(profile.trousers),'body',false);
    }
    part='feet';
    const shoeCenter=[sign*.105,.048,.068],footCol=isPool?skinColor:color(profile.shoe),footMat=isPool?2:0;
    // Six-sided instep and broad toe create a recognisable, grounded shoe/foot.
    const fp=[[-.055,-.048,-.09],[.055,-.048,-.09],[.062,-.048,.10],[-.062,-.048,.10],[-.048,.040,-.074],[.048,.040,-.074],[.060,.006,.12],[-.060,.006,.12]].map(p=>p.map((v,i)=>v+shoeCenter[i]));
    for(const q of [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]])quad(footMat,...q.map(i=>fp[i]),isPool?[skinUV,skinUV,skinUV,skinUV]:[[0,0],[1,0],[1,1],[0,1]],footCol,[W(foot),W(foot),W(foot),W(foot)]);
  }

  // The complete image appears only over the front arc; the skull never repeats a face.
  part='head';
  const headY=1.435, hW=profile.head[0], hH=profile.head[1], hD=profile.head[2];
  const headRows=[[-.025,.061,.066],[.012,.080,.082],[.068,.103,.104],[.125,.119,.109],[.198,.119,.110],[.263,.103,.093],[.300,.060,.059]];
  const angles=[-180,-150,-120,-90,-60,-30,0,30,60,90,120,150];
  const hp=headRows.map(([y,w,d],i)=>angles.map(a=>{
    const r=a*Math.PI/180, jaw=i<2?profile.jaw:1;
    return[Math.sin(r)*w*hW*jaw,headY+y*hH,Math.cos(r)*d*hD];
  }));
  for(let i=0;i<headRows.length-1;i++)for(let j=0;j<12;j++){
    const k=(j+1)%12,front=j>=4&&j<=7, mat=front?1:2;
    const uv=(r,c)=>front?[(Math.sin(angles[c]*Math.PI/180)/Math.sin(Math.PI/3)+1)*.5,r/(headRows.length-1)]:[skinUV[0]+.012*Math.sin(c),skinUV[1]+r*.004];
    quad(mat,hp[i][j],hp[i][k],hp[i+1][k],hp[i+1][j],[uv(i,j),uv(i,k),uv(i+1,k),uv(i+1,j)],white,[W('head'),W('head'),W('head'),W('head')]);
  }
  for(const row of [0,headRows.length-1])for(let j=0;j<12;j++) {
    const k=(j+1)%12,ij=row===0?[j,k]:[k,j];
    tri(2,[0,headY+headRows[row][0]*hH,0],hp[row][ij[0]],hp[row][ij[1]],skinUV,skinUV,skinUV,white,W('head'));
  }
  // The nose uses the corresponding central image region, on real bridge/tip planes.
  part='nose';
  const nose=[[-.028,headY+.184*hH,.106*hD],[.028,headY+.184*hH,.106*hD],[-.037,headY+.111*hH,.100*hD],[.037,headY+.111*hH,.100*hD],[0,headY+.121*hH,.154*hD*profile.nose],[0,headY+.170*hH,.128*hD*profile.nose]];
  const nu=[[.39,.63],[.61,.63],[.35,.42],[.65,.42],[.5,.45],[.5,.59]];
  for(const f of [[0,1,5],[0,5,4],[0,4,2],[5,1,4],[1,3,4],[2,4,3]])tri(1,...f.map(i=>nose[i]),...f.map(i=>nu[i]),white,W('head'));
  part='ears';for(const s of [-1,1])poly(new T.OctahedronGeometry(1,0),2,white,W('head'),transform([s*.115*hW,headY+.124*hH,-.007],[.026,.043,.023]),skinUV);

  // A faceted hair shell follows distinct hairlines instead of using detached cubes.
  part='hair';
  const hairCol=color(profile.hair), hairN=12,hairMaterial=role==='receptionist'?3:2;
  const hairBottom=a=>{
    const front=Math.cos(a), side=Math.abs(Math.sin(a));
    if(role==='wallman')return front>.35?.277:(.137+.025*side);
    if(role==='receptionist')return front>.35?.227:.080;
    if(role==='reader')return front>.45?(.251+.023*Math.sin(a)):.111;
    if(role==='homeless')return front>.45?.263:.122;
    return front>.40?.242:.112;
  };
  function skullRadius(y,axis){
    for(let i=0;i<headRows.length-1;i++)if(y<=headRows[i+1][0])return mix(headRows[i][axis],headRows[i+1][axis],clamp((y-headRows[i][0])/(headRows[i+1][0]-headRows[i][0]),0,1));
    return headRows[headRows.length-1][axis]*Math.max(.14,1-(y-.300)/.030);
  }
  const hairRings=[0,1,2,3].map((row)=>Array.from({length:hairN},(_,j)=>{
    const a=2*Math.PI*j/hairN, bottom=hairBottom(a),y=[bottom,(bottom+.282)/2,.282,.325][row];
    return[Math.sin(a)*(skullRadius(y,1)+.009)*hW,headY+y*hH,Math.cos(a)*(skullRadius(y,2)+.009)*hD-.005];
  }));
  const huv=[hairUV[0],hairUV[1]];
  for(let i=0;i<3;i++)for(let j=0;j<hairN;j++){
    const k=(j+1)%hairN;quad(hairMaterial,hairRings[i][j],hairRings[i][k],hairRings[i+1][k],hairRings[i+1][j],[huv,huv,huv,huv],hairCol,[W('head'),W('head'),W('head'),W('head')]);
  }
  for(let j=0;j<hairN;j++)tri(hairMaterial,[0,headY+.329*hH,-.006],hairRings[3][(j+1)%hairN],hairRings[3][j],huv,huv,huv,hairCol,W('head'));
  if(role==='receptionist')for(let j=0;j<6;j++){
    const a=j/6*Math.PI*2;poly(new T.IcosahedronGeometry(1,0),3,hairCol,W('head'),transform([Math.sin(a)*.095,headY+.257,Math.cos(a)*.080-.012],[.063,.050,.061],[0,a,0]),huv);
  }
  if(role==='receptionist')for(const s of [-1,1])poly(new T.IcosahedronGeometry(1,0),3,hairCol,W('head'),transform([s*.045,headY+.305,-.010],[.062,.047,.064]),huv);
  if(role==='homeless'){
    // Hood is cloth relief around the back of the neck, leaving the face exposed.
    part='hood';tube([{p:[0,1.35,-.027],rx:.103,rz:.091,w:W('chest')},{p:[0,1.43,-.045],rx:.113,rz:.099,w:W('neck')},{p:[0,1.46,-.055],rx:.105,rz:.088,w:W('neck')}],8,0,[.81,.82,.75]);
  }
  if(role==='receptionist'){
    part='glasses';const frameCol=color(0x292823), z=.121*hD, yy=headY+.184*hH;
    for(const s of [-1,1]){
      for(const y of [-.024,.024])box([s*.054,yy+y,z],[.084,.006,.006],3,frameCol,W('head'));
      for(const x of [-.039,.039])box([s*.054+x,yy,z],[.006,.048,.006],3,frameCol,W('head'));
      part='readingGlass';box([s*.054,yy,z-.001],[.064,.034,.002],5,white,W('head'));part='glasses';
    }
    box([0,yy,z],[.029,.009,.010],3,frameCol,W('head'));
    for(const s of [-1,1])box([s*.101,yy,-.001],[.010,.012,.245],3,frameCol,W('head'));
  }

  // Pose construction is used once to author discrete tracks. Runtime only samples them.
  const vA=new T.Vector3(),vB=new T.Vector3(),vC=new T.Vector3(),vD=new T.Vector3(),qA=new T.Quaternion(),qB=new T.Quaternion();
  const down=new T.Vector3(0,-1,0);
  function aim(b,dir){b.parent.getWorldQuaternion(qA);qB.setFromUnitVectors(down,dir);b.quaternion.copy(qA.invert().multiply(qB));b.updateMatrixWorld(true);}
  function ik(upper,lower,target,bend,l1,l2) {
    const u=bones[upper],lo=bones[lower];u.getWorldPosition(vA);vB.set(...target).sub(vA);
    const d=clamp(vB.length(),.02,l1+l2-.0005);vB.normalize();
    vC.set(...bend).addScaledVector(vB,-vC.dot(vB)).normalize();
    if(vC.lengthSq()<.001)vC.set(0,0,1);
    const along=(l1*l1-l2*l2+d*d)/(2*d),high=Math.sqrt(Math.max(0,l1*l1-along*along));
    vD.copy(vA).addScaledVector(vB,along).addScaledVector(vC,high);
    const elbow=vD.clone(),start=vA.clone();aim(u,vD.sub(start).normalize());
    aim(lo,new T.Vector3(...target).sub(elbow).normalize());
  }
  function arm(side,target,bend=[side==='L'?1:-1,-.35,-.1]) {ik('upperArm'+side,'foreArm'+side,target,bend,.28,.245);}
  function leg(side,target,bend=[0,0,1]) {ik('thigh'+side,'shin'+side,target,bend,.4,.37);}
  function levelFoot(side,rx=0) {
    bones['foot'+side].parent.getWorldQuaternion(qA);bones['foot'+side].quaternion.copy(qA.invert()).multiply(new T.Quaternion().setFromEuler(new T.Euler(rx,0,0)));
  }
  function orientHand(side,euler) {
    const hand=bones['hand'+side];hand.parent.getWorldQuaternion(qA);
    hand.quaternion.copy(qA.invert()).multiply(new T.Quaternion().setFromEuler(new T.Euler(...euler)));
  }
  function resetPose(){for(const b of boneList){b.position.set(...bindPositions[b.name]);b.quaternion.identity();b.scale.set(1,1,1);}}
  function makePose(t) {
    resetPose();const a=2*Math.PI*t/profile.duration;
    if(role==='homeless'){
      bones.hips.position.set(0,.274,0);bones.hips.rotation.z=Math.PI/2;
      bones.chest.scale.set(1,1+Math.sin(a)*.003,1+Math.sin(a)*.006);
      bones.head.rotation.set(.03,-.035,-.04);
      bones.thighL.rotation.x=-1.03;bones.shinL.rotation.x=1.89;bones.footL.rotation.x=-.32;
      bones.thighR.rotation.x=-.91;bones.shinR.rotation.x=1.80;bones.footR.rotation.x=-.28;
      group.updateMatrixWorld(true);arm('R',[-.61,.113,.082],[0,.12,1]);arm('L',[-.19,.387,.24],[0,1,.4]);
      orientHand('R',[Math.PI/2,0,-Math.PI/2]);orientHand('L',[0,0,Math.PI/2]);
    } else {
      bones.hips.position.x=Math.sin(a)*((role==='wallman'||isPool)?.005:.002);
      bones.chest.scale.set(1,1+Math.sin(a)*.002,1+Math.sin(a)*.0035);
      if(isSeated){
        bones.hips.position.y=seatHeight+.12;bones.spine.rotation.x=.04;bones.chest.rotation.x=.035;
        bones.head.rotation.set(role==='reader'?.17+.018*Math.sin(t*Math.PI*2/4.5):.05,Math.sin(a)*.022,0);
        group.updateMatrixWorld(true);
        leg('R',[-.115,.075+groundHeight,.435]);levelFoot('R');
        if(role==='plaid') {leg('L',[-.105,.340,.505],[.65,0,1]);levelFoot('L',Math.sin(t*Math.PI*2*1.125)*.07);}
        else {leg('L',[.115,.075+groundHeight,.435]);levelFoot('L');}
        group.updateMatrixWorld(true);
        if(role==='reader'){
          const pagePhase=t%6,jerk=pagePhase>=4.6&&pagePhase<4.6+2/15?1:pagePhase>=4.6+2/15&&pagePhase<4.8?-.35:0;
          arm('L',[.208,seatHeight+.290+jerk*.018,.405+jerk*.012]);arm('R',[-.208,seatHeight+.290+jerk*.018,.405+jerk*.012]);
          orientHand('L',[0,0,-Math.PI/2]);orientHand('R',[0,0,Math.PI/2]);
        } else {
          arm('L',[.22,seatHeight+.17,.32]);
          const p=t%8;let reach=0;if(p>=6.1&&p<6.7)reach=(p-6.1)/.6;else if(p>=6.7&&p<7.3)reach=1;else if(p>=7.3&&p<7.9)reach=1-(p-7.3)/.6;
          arm('R',[mix(-.22,-.145,reach),mix(seatHeight+.17,seatHeight+.91,reach),mix(.31,.10,reach)]);
        }
      } else {
        bones.hips.position.z=role==='wallman'?-.009:isPool?Math.sin(a)*.006:0;
        if(role==='wallman'){bones.spine.rotation.x=.045;bones.chest.rotation.x=.065;bones.head.rotation.x=.035;}
        if(isPool){bones.head.rotation.y=Math.sin(a)*.035;bones.spine.rotation.x=Math.sin(a)*.006;}
        if(role==='receptionist'){
          const p=t%10,look=(p>2&&p<4)?Math.sin((p-2)/2*Math.PI):0;
          bones.head.rotation.set(.24-look*.23,Math.sin(a)*.017,0);bones.chest.rotation.x=.035;
        }
        group.updateMatrixWorld(true);leg('L',[.115,.075,0]);levelFoot('L');leg('R',[-.115,.075,.008]);levelFoot('R');group.updateMatrixWorld(true);
        if(role==='wallman'){arm('R',[-.247,1.232,.401],[-1,0,-.4]);arm('L',[.228,.795,.025]);orientHand('R',[Math.PI,0,0]);}
        if(isPool){arm('L',[.337,.985,.05]);arm('R',[-.337,.985,.05]);orientHand('L',[Math.PI/2,0,0]);orientHand('R',[Math.PI/2,0,0]);}
        if(role==='receptionist'){
          arm('L',[.205,.777,.094]);const p=t%10;let r=0,push=0;
          if(p>=5.6&&p<6)r=(p-5.6)/.4;else if(p>=6&&p<6+2/15){r=1;push=p>=6+1/15?1:0;}else if(p>=6+2/15&&p<6.55)r=1-(p-(6+2/15))/(6.55-(6+2/15));
          // Aim the mitten fingertip at the posed frame, not the forehead.
          // This is baked into the discrete clip; no IK runs in the game loop.
          const frameContact=new T.Vector3(-.099,headY+.184*hH,.121*hD+.013-push*.009)
            .applyMatrix4(bindWorld.head.clone().invert()).applyMatrix4(bones.head.matrixWorld);
          arm('R',[mix(-.23,frameContact.x,r),mix(.79,frameContact.y-.111,r),mix(.07,frameContact.z+.014,r)]);
          orientHand('R',[Math.PI*r,0,0]);
        }
      }
    }
    group.updateMatrixWorld(true);
  }

  // Props are authored in the base posed coordinates, then unposed into their owner bone.
  makePose(0);
  function intoBind(name){return bindWorld[name].clone().multiply(bones[name].matrixWorld.clone().invert());}
  if(role==='reader') {
    part='newspaper';const m=intoBind('handL'),y=seatHeight+.445;
    const ps=[[-.226,y-.15,.412],[0,y-.15,.435],[.226,y-.15,.412],[-.226,y+.15,.333],[0,y+.15,.351],[.226,y+.15,.333]].map(p=>new T.Vector3(...p).applyMatrix4(m).toArray());
    const w=W('handL');
    for(const f of [[0,1,4,3],[1,2,5,4]]){
      const u0=f[0]===0?0:.5,u1=f[0]===0?.5:1;
      quad(4,...f.map(i=>ps[i]),[[u0,0],[u1,0],[u1,1],[u0,1]],white,[w,w,w,w]);
      quad(4,...f.slice().reverse().map(i=>ps[i]),[[u0,1],[u1,1],[u1,0],[u0,0]],white,[w,w,w,w]);
    }
    sockets.newspaper=bones.handL;
  }
  if(isPool) {
    part='duckRing';const y=.88;
    poly(new T.TorusGeometry(.303,.090,6,12),3,color(0xf1c938),W('hips'),transform([0,y,.015],[1,1,1],[Math.PI/2,0,0]));
    poly(new T.CylinderGeometry(.054,.067,.135,6,1),3,color(0xf1c938),W('hips'),transform([0,y+.090,.315],[1,1,1],[.38,0,0]));
    poly(new T.OctahedronGeometry(1,0),3,color(0xf6d34c),W('hips'),transform([0,y+.181,.367],[.090,.089,.098]));
    poly(new T.OctahedronGeometry(1,0),3,color(0xe88724),W('hips'),transform([0,y+.168,.453],[.076,.026,.086]));
    for(const s of [-1,1])poly(new T.OctahedronGeometry(1,0),3,color(0x29231c),W('hips'),transform([s*.067,y+.201,.397],[.015,.018,.011]));
    sockets.duckRing=bones.hips;
  }
  resetPose();group.updateMatrixWorld(true);

  const texturesUsed=new Set([textures.face,textures.faceBlink??textures.face,textures.body,textures.newspaper].filter(Boolean));
  for(const texture of texturesUsed) {
    const im=texture.image??texture.source?.data;
    if(im?.width&&im?.height&&(im.width!==128||im.height!==128))throw new Error(`V74 ${role} texture must be 128×128; got ${im.width}×${im.height}.`);
    texture.minFilter=T.NearestFilter;texture.magFilter=T.NearestFilter;texture.generateMipmaps=false;texture.anisotropy=1;texture.colorSpace=T.SRGBColorSpace;
    // Upload flags are changed only at creation, never on an animation tick.
    texture.needsUpdate=true;
  }
  const makeMat=(name,map,extra={})=>{const m=new T.MeshLambertMaterial({map:map??null,flatShading:true,vertexColors:true,...extra});m.name=`V74 ${role} / ${name}`;return m;};
  const faceMaterial=makeMat('front face',role==='homeless'?(textures.faceBlink??textures.face):textures.face);
  const materials=[makeMat('body',textures.body),faceMaterial,makeMat('skin and hair patches',textures.face),makeMat('solid prop'),makeMat('newspaper',textures.newspaper??null,{side:T.DoubleSide}),makeMat('transparent reading glass',null,{color:0xb9cfc7,transparent:true,opacity:.13,depthWrite:false})];
  const geometry=new T.BufferGeometry(),joined={p:[],uv:[],c:[],si:[],sw:[]};let start=0;
  for(let i=0;i<bins.length;i++)if(bins[i].p.length){const b=bins[i];geometry.addGroup(start,b.p.length/3,i);for(const k of Object.keys(joined))joined[k].push(...b[k]);start+=b.p.length/3;}
  geometry.setAttribute('position',new T.Float32BufferAttribute(joined.p,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(joined.uv,2));geometry.setAttribute('color',new T.Float32BufferAttribute(joined.c,3));geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(joined.si,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(joined.sw,4));geometry.computeVertexNormals();
  const mesh=new T.SkinnedMesh(geometry,materials);mesh.name=`V74 ${role} / unified skinned actor`;mesh.castShadow=opts.castShadow??false;mesh.receiveShadow=true;mesh.frustumCulled=false;
  group.add(mesh);const skeleton=new T.Skeleton(boneList);mesh.bind(skeleton);mesh.normalizeSkinWeights();

  const tracks=[],times=[],records=Object.fromEntries(boneList.map(b=>[b.name,{q:[],p:[],s:[]}]));
  for(let frame=0;frame<=profile.duration*RETRO_POSE_HZ74;frame++) {
    const t=frame/RETRO_POSE_HZ74;makePose(t);times.push(t);
    for(const b of boneList){records[b.name].q.push(...b.quaternion.toArray());records[b.name].p.push(...b.position.toArray());records[b.name].s.push(...b.scale.toArray());}
  }
  for(const b of boneList) {
    tracks.push(new T.QuaternionKeyframeTrack(b.name+'.quaternion',times,records[b.name].q,T.InterpolateDiscrete));
    if(b.name==='hips')tracks.push(new T.VectorKeyframeTrack(b.name+'.position',times,records[b.name].p,T.InterpolateDiscrete));
    if(b.name==='chest')tracks.push(new T.VectorKeyframeTrack(b.name+'.scale',times,records[b.name].s,T.InterpolateDiscrete));
  }
  resetPose();
  const clip=new T.AnimationClip(role+' / held 15 Hz idle',profile.duration,tracks),mixer=new T.AnimationMixer(group);
  mixer.clipAction(clip).setLoop(T.LoopRepeat,Infinity).play();
  const phase=opts.phase??hash(seed+1)*profile.duration,blinkPeriod=3.0+hash(seed+17)*2.7,blinkPhase=hash(seed+29)*blinkPeriod;
  let lastTick=-Infinity,disposed=false,forcedEye=null,eyeClosed=role==='homeless';
  const diagnostics={role,seed,rigType:'THREE.SkinnedMesh',bones:19,triangles:geometry.getAttribute('position').count/3,drawCalls:geometry.groups.length,materials:geometry.groups.map(g=>materials[g.materialIndex].name),partTriangles,poseHz:15,mainFrameCap:false,interpolation:'THREE.InterpolateDiscrete',clip:clip.name,clipDuration:clip.duration,sourceTexturesCallerOwned:true,faceUV:'full image on front arc only; sampled patches on sides/back',blinkMode:role==='homeless'?'always closed':'independent preloaded image swap',blinkPeriod,blinkPhase,updates:0,eyeChanges:0,eyeClosed,dimensions:{scale,seatHeight:isSeated?requestedSeatHeight:null},bounds:null};
  if(diagnostics.triangles<500||diagnostics.triangles>1500)throw new Error(`V74 ${role}: ${diagnostics.triangles} triangles, outside total 500–1500 budget.`);
  const setEye=closed=>{closed=role==='homeless'||closed;if(eyeClosed!==closed){eyeClosed=closed;faceMaterial.map=closed?(textures.faceBlink??textures.face):textures.face;diagnostics.eyeChanges++;}diagnostics.eyeClosed=eyeClosed;};
  function update(t,dt=0) {
    if(disposed)return;if(!Number.isFinite(t))return;
    const tick=Math.floor((Math.max(0,t)+phase)*RETRO_POSE_HZ74+1e-6);
    if(tick===lastTick)return;lastTick=tick;mixer.setTime(tick/RETRO_POSE_HZ74);group.updateMatrixWorld(true);skeleton.update();diagnostics.updates++;
    const bt=tick/RETRO_POSE_HZ74+blinkPhase, cycle=Math.floor(bt/blinkPeriod),p=bt-cycle*blinkPeriod;
    const closed=p>blinkPeriod-.21&&p<blinkPeriod-.045||(hash(seed+cycle*73)>.78&&p>.12&&p<.255);
    setEye(forcedEye??closed);
  }
  function forceBlink(state='auto') {forcedEye=state==='auto'||state===null?null:state===true||state==='closed';setEye(forcedEye??false);return diagnostics.eyeClosed;}
  function samplePose(t=0) {
    mixer.setTime(Math.floor(t*15+1e-6)/15);group.updateMatrixWorld(true);skeleton.update();
    const data={time:Math.floor(t*15+1e-6)/15,bones:{}};
    for(const b of boneList)data.bones[b.name]={position:b.getWorldPosition(new T.Vector3()).toArray(),quaternion:b.quaternion.toArray(),scale:b.scale.toArray()};
    mesh.computeBoundingBox();data.bounds={min:mesh.boundingBox.min.clone().multiply(group.scale).toArray(),max:mesh.boundingBox.max.clone().multiply(group.scale).toArray()};lastTick=-Infinity;return data;
  }
  function dispose(){if(disposed)return;disposed=true;mixer.stopAllAction();mixer.uncacheRoot(group);geometry.dispose();for(const m of materials)m.dispose();skeleton.dispose();group.removeFromParent();}
  group.scale.setScalar(scale);update(0);mesh.computeBoundingBox();diagnostics.bounds={min:mesh.boundingBox.min.clone().multiply(group.scale).toArray(),max:mesh.boundingBox.max.clone().multiply(group.scale).toArray()};
  sockets.leftHand=bones.handL;sockets.rightHand=bones.handR;sockets.head=bones.head;sockets.leftFoot=bones.footL;sockets.rightFoot=bones.footR;
  group.userData.diagnostics=diagnostics;
  return{group,update,dispose,diagnostics,bones,sockets,forceBlink,samplePose,mixer,mesh,clip,materials};
}
