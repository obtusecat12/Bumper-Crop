/* V75: metre-scale, +Z-facing, nineteen-bone PS1/early-PS2 cast.
 * No renderer, frame scheduler, network request or global event listener lives here.
 * Supplied textures remain caller-owned. Body and eye animation sample at 24 Hz (plaid: 30 Hz).
 */

export const RETRO_ROLES75 = Object.freeze(['homeless','wallman','reader','plaid','receptionist','poolman']);
export const RETRO_POSE_HZ75 = 24;

const PROFILES = {
 homeless:{height:1.00,shoulder:.96,waist:.94,limb:.95,head:[.98,1,.98],jaw:.99,nose:.85,hair:0x514536,trousers:0x465054,shoe:0x37342e,duration:12},
 wallman:{height:1.015,shoulder:1.07,waist:1.10,limb:1.06,head:[1.04,.98,1.04],jaw:1.09,nose:.85,hair:0x856f4d,trousers:0x374452,shoe:0x342f29,duration:10},
 reader:{height:1.015,shoulder:1.01,waist:.99,limb:.99,head:[.98,1.01,1],jaw:1.04,nose:.95,hair:0x1b1817,trousers:0x303337,shoe:0x222221,duration:12},
 plaid:{height:.998,shoulder:1.07,waist:1.18,limb:1.09,head:[1.07,.99,1.03],jaw:1.04,nose:.80,hair:0x42342a,trousers:0x425367,shoe:0x43372d,duration:8},
 receptionist:{height:.963,shoulder:.95,waist:1.06,limb:.94,head:[1.00,.98,1],jaw:1.03,nose:.75,hair:0xbab7ad,trousers:0x363941,shoe:0x322f2b,duration:10},
 poolman:{height:1.025,shoulder:1.05,waist:1.00,limb:1.04,head:[1.05,.99,1.01],jaw:1.10,nose:.75,hair:0x231f1b,trousers:0x5c4149,shoe:0x6b4b39,duration:10}
};

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t;
const hash=n=>{let x=(n|0)^0x9e3779b9;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return((x^(x>>>15))>>>0)/4294967296;};
const roleSeed=s=>{let n=175;for(let i=0;i<s.length;i++)n=Math.imul(n^s.charCodeAt(i),16777619);return n>>>0;};

/**
 * @param {object} T The host's existing THREE namespace (r180 compatible).
 * @param {string} role One of RETRO_ROLES75.
 * @param {object} textures {face, faceBlink, body, newspaper?}; each supplied image is 128².
 * @param {object} opts {seatHeight, seed, scale, skinUV, hairUV, castShadow, phase}.
 * @returns {{group,update,dispose,diagnostics,bones,sockets,forceBlink,samplePose,mixer,mesh}}
 */
export function createRetroActor75(T, role, textures, opts={}) {
  if(!PROFILES[role]) throw new Error('Unknown V75 NPC role: '+role);
  if(!textures?.face || !textures?.body) throw new Error('V75 NPC requires preloaded face and body textures.');
  const profile=PROFILES[role], seed=opts.seed??roleSeed(role), isPool=role==='poolman';
  const isSeated=role==='reader'||role==='plaid';
  const requestedSeatHeight=opts.seatHeight??(role==='plaid'?.47:.56);
  const poseHz=role==='plaid'?30:24;
  const group=new T.Group();group.name='V75 / '+role;group.userData.retroRole=role;
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
  bone('hips',null,[0,.96,0]);bone('spine','hips',[0,.17,0]);bone('chest','spine',[0,.185,0]);
  bone('neck','chest',[0,.195,0]);bone('head','neck',[0,.025,0]);
  for(const [side,sign] of [['L',1],['R',-1]]) {
    bone('clavicle'+side,'chest',[sign*.115*profile.shoulder,.135,0]);
    bone('upperArm'+side,'clavicle'+side,[sign*.125*profile.shoulder,0,0]);
    bone('foreArm'+side,'upperArm'+side,[0,-.31,0]);bone('hand'+side,'foreArm'+side,[0,-.27,0]);
    bone('thigh'+side,'hips',[sign*.108,-.030,0]);bone('shin'+side,'thigh'+side,[0,-.425,0]);bone('foot'+side,'shin'+side,[0,-.43,0]);
  }
  group.updateMatrixWorld(true);
  const bindWorld=Object.fromEntries(boneList.map(b=>[b.name,b.matrixWorld.clone()]));
  const index=name=>bones[name].userData.index;
  const W=(name,w=1,other=null)=>other?[[index(name),w],[index(other),1-w]]:[[index(name),w]];
  const bins=Array.from({length:7},()=>({p:[],uv:[],c:[],si:[],sw:[]}));
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
      const vv=i/(rings.length-1);
      if(uvStyle==='pants')return[.515+.47*j/n,.016+.467*vv];
      if(uvStyle==='sleeve'||uvStyle==='body')return[.018+.465*j/n,.016+.467*vv];
      return[(front?0:.5)+.025+.45*(Math.sin(2*Math.PI*j/n)+1)*.5,.52+.46*vv];
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

  // Authored adult proportions: 1.82 m crown, 24 cm head, 47 cm shoulders.
  // Shoulder openings and sleeve roots share both positions and skin weights.
  const torsoRows=[ [.865,.169,.105],[.98,.179,.123],[1.17,.174,.128],[1.36,.229,.132],[1.465,.236,.104],[1.525,.071,.066] ];
  const torsoPts=torsoRows.map(([y,w,d])=>Array.from({length:8},(_,j)=>{
    const a=j*Math.PI/4;return[Math.sin(a)*w*(y<1.25?profile.waist:profile.shoulder),y,Math.cos(a)*d*(Math.cos(a)>0?1.06:.88)];
  }));
  const torsoWeight=(i,j)=>{
    if(i<2)return W('hips');if(i===2)return W('spine',.65,'chest');
    if((i===3||i===4)&&[1,2,3,5,6,7].includes(j))return W(j<4?'upperArmL':'upperArmR',i===4?.48:.18,'chest');
    return i===5?W('neck',.35,'chest'):W('chest');
  };
  const clothUV=(p,front)=>[(front?0:.5)+(.04+.92*(p[0]/(.48*profile.shoulder)+.5))*.5,.515+.47*clamp((p[1]-.865)/.66,0,1)];
  part='continuousTorso';
  for(let i=0;i<5;i++)for(let j=0;j<8;j++){
    const k=(j+1)%8;if(i===3&&[1,2,5,6].includes(j))continue;
    const front=Math.cos((j+.5)*Math.PI/4)>=0,ps=[torsoPts[i][j],torsoPts[i][k],torsoPts[i+1][k],torsoPts[i+1][j]];
    quad(0,...ps,ps.map(p=>clothUV(p,front)),white,[torsoWeight(i,j),torsoWeight(i,k),torsoWeight(i+1,k),torsoWeight(i+1,j)]);
  }
  part='shortNeck';tube([1.475,1.535,1.592].map((y,i)=>({p:[0,y,-.009],rx:[.064,.058,.060][i],rz:[.060,.054,.054][i],w:i===0?W('chest'):i===1?W('neck'):W('head')})),8,2,white,'skin');

  for(const [side,sign]of[['L',1],['R',-1]]){
    const upper='upperArm'+side,lower='foreArm'+side,hand='hand'+side,x=sign*.24*profile.shoulder;
    const ids=sign===1?[1,2,3]:[7,6,5];
    const seam=[...ids.map(j=>({p:torsoPts[4][j],w:torsoWeight(4,j)})),...ids.slice().reverse().map(j=>({p:torsoPts[3][j],w:torsoWeight(3,j)}))];
    const rings=[seam];
    for(const [y,rx,rz,b]of[[1.375,.082,.079,upper],[1.245,.077,.071,upper],[1.145,.064,.061,lower],[1.035,.066,.062,lower],[.89,.045,.040,lower]]){
      rings.push(Array.from({length:6},(_,j)=>{const a=(30+j*60)*Math.PI/180;return{p:[x+sign*Math.sin(a)*rx*profile.limb,y,Math.cos(a)*rz*profile.limb],w:y===1.145?W(upper,.40,lower):W(b)};}));
    }
    part='joinedSleeves';
    for(let i=0;i<rings.length-1;i++)for(let j=0;j<6;j++){
      const k=(j+1)%6,vs=[rings[i][j],rings[i][k],rings[i+1][k],rings[i+1][j]];
      const uv=(r,c)=>[.018+.465*c/6,.015+.47*(1-r/(rings.length-1))];
      const ps=vs.map(v=>v.p),us=[uv(i,j),uv(i,k),uv(i+1,k),uv(i+1,j)],ws=vs.map(v=>v.w);
      if(sign===-1)quad(0,...ps,us,white,ws);else quad(0,...ps.reverse(),us.reverse(),white,ws.reverse());
    }
    // Flattened palm with separate finger silhouettes, rather than a block mitten.
    part='palms';tube([[.894,.042,.028],[.840,.047,.024],[.810,.040,.020]].map(([y,rx,rz])=>({p:[x,y,.010],rx,rz,w:W(hand)})),6,2,white,'skin');
    part='fingers';
    for(let f=0;f<4;f++){
      const fx=x+(f-1.5)*.019,tip=.735+([.021,0,.008,.027][f]);
      tube([{p:[fx,.819,.011],rx:.011,rz:.017,w:W(hand)},{p:[fx,.779,.019],rx:.010,rz:.014,w:W(hand)},{p:[fx,tip,.032],rx:.008,rz:.010,w:W(hand)}],4,2,white,'skin');
    }
    part='thumb';poly(new T.OctahedronGeometry(1,0),2,white,W(hand),transform([x-sign*.046,.823,.036],[.019,.042,.021],[.12,0,sign*.48]),skinUV);
    const hip='thigh'+side,knee='shin'+side,foot='foot'+side;
    const rows=[[.958,.115,.109,hip],[.838,.112,.117,hip],[.660,.099,.104,hip],[.506,.075,.082,knee],[.350,.080,.076,knee],[.082,.059,.055,knee]];
    part='shapedTrousers';
    if(!isPool)tube(rows.map(([y,rx,rz,b],i)=>({p:[sign*.108,y,i===3?.008:0],rx:rx*profile.limb,rz:rz*profile.limb,w:i===0?W('hips',.45,hip):i===3?W(hip,.4,knee):W(b)})),8,0,white,'pants');
    else{
      tube(rows.slice(2).map(([y,rx,rz,b],i)=>({p:[sign*.108,y,0],rx:rx*.84,rz:rz*.82,w:i===1?W(hip,.4,knee):W(b)})),8,2,white,'skin');
      tube([[.958,.117,.118],[.834,.122,.125],[.655,.110,.114]].map(([y,rx,rz],i)=>({p:[sign*.108,y,0],rx,rz,w:i===0?W('hips',.45,hip):W(hip)})),8,0,white,'pants');
    }
    part='feet';const center=[sign*.108,.045,.054],fc=isPool?white:color(profile.shoe),fm=isPool?2:3;
    const ps=[[-.048,-.045,-.087],[.048,-.045,-.087],[.054,-.045,.147],[-.054,-.045,.147],[-.045,.033,-.077],[.045,.033,-.077],[.052,-.009,.154],[-.052,-.009,.154]].map(p=>p.map((v,i)=>v+center[i]));
    for(const q of[[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]])quad(fm,...q.map(i=>ps[i]),[skinUV,skinUV,skinUV,skinUV],fc,[W(foot),W(foot),W(foot),W(foot)]);
  }
  // Tailored collar / lapels have thickness in silhouette, with atlas-matched UVs.
  if(!isPool){
    part='collar';
    for(const sign of[-1,1]){
      const ps=[[sign*.062,1.526,.062],[sign*.117,1.486,.091],[sign*.068,1.425,.126],[sign*.032,1.496,.089]];
      quad(0,...(sign===1?ps:ps.slice().reverse()),(sign===1?ps:ps.slice().reverse()).map(p=>clothUV(p,true)),white,[W('chest'),W('chest'),W('chest'),W('neck')]);
    }
  }
  if(role==='homeless'){
    part='hood';tube([{p:[0,1.438,-.040],rx:.112,rz:.098,w:W('chest')},{p:[0,1.510,-.050],rx:.104,rz:.101,w:W('neck')},{p:[0,1.535,-.052],rx:.084,rz:.082,w:W('neck')}],8,0,[.80,.81,.78],'sleeve');
  }

  // Semantic facial rings, not an ellipsoid plus a detached nose. Nose relief
  // shares the facial surface. Eyes, nose, mouth UV rows follow image landmarks.
  const headY=1.552,hW=profile.head[0],hH=profile.head[1],hD=profile.head[2];
  const faceRows=[ [0,.047,.072,.96],[.025,.065,.089,.84],[.049,.075,.094,.76],[.084,.083,.091,.61],[.127,.086,.082,.36],[.150,.085,.090,.25],[.190,.080,.079,.07],[.220,.062,.059,0] ];
  const landmarks={homeless:[.44,.65,.758,.97,.328,.666],wallman:[.414,.636,.742,.967,.333,.666],reader:[.365,.605,.746,.96,.307,.701],plaid:[.375,.605,.718,.96,.331,.668],receptionist:[.337,.636,.779,.936,.282,.731],poolman:[.353,.634,.750,.935,.313,.683]}[role];
  faceRows[0][3]=landmarks[3];faceRows[1][3]=(landmarks[2]+landmarks[3])*.5;faceRows[2][3]=landmarks[2];faceRows[3][3]=landmarks[1];faceRows[4][3]=landmarks[0];faceRows[5][3]=landmarks[0]-.10;
  const faceX=[-1,-.70,-.32,0,.32,.70,1],faceU=[.018,.12,landmarks[4],.5,landmarks[5],.88,.982];
  const front=faceRows.map(([y,w,z],i)=>faceX.map((s,j)=>{
    let zz=z*(1-.75*Math.pow(Math.abs(s),3));
    if(i===3)zz+=(j===3?.022:j===2||j===4?.011:0)*profile.nose;
    if(i===4&&[2,4].includes(j))zz-=.004;
    return[s*w*hW*(i<2?profile.jaw:1),headY+y*hH,zz*hD];
  }));
  part='facialPlanes';
  for(let i=0;i<7;i++)for(let j=0;j<6;j++){
    const uv=(r,c)=>[faceU[c],1-faceRows[r][3]];
    quad(1,front[i][j],front[i][j+1],front[i+1][j+1],front[i+1][j],[uv(i,j),uv(i,j+1),uv(i+1,j+1),uv(i+1,j)],white,[W('head'),W('head'),W('head'),W('head')]);
  }
  const rear=faceRows.map(([y,w],i)=>Array.from({length:7},(_,j)=>{
    if(j===0)return front[i][0];if(j===6)return front[i][6];
    const a=-Math.PI/2-j*Math.PI/6,depth=[.067,.078,.088,.092,.096,.098,.092,.071][i];
    return[Math.sin(a)*w*hW,headY+y*hH,Math.cos(a)*depth*hD-.010];
  }));
  part='jawTemplesOcciput';
  for(let i=0;i<7;i++)for(let j=0;j<6;j++)quad(2,rear[i][j+1],rear[i][j],rear[i+1][j],rear[i+1][j+1],[skinUV,skinUV,skinUV,skinUV],white,[W('head'),W('head'),W('head'),W('head')]);
  for(const r of[0,7]){
    const ring=[...front[r],...rear[r].slice(1,6).reverse()],center=[0,headY+faceRows[r][0]*hH,-.012];
    for(let j=0;j<ring.length;j++){const k=(j+1)%ring.length;tri(2,center,...(r===0?[ring[k],ring[j]]:[ring[j],ring[k]]),skinUV,skinUV,skinUV,white,W('head'));}
  }
  part='ears';for(const s of[-1,1])poly(new T.OctahedronGeometry(1,0),2,white,W('head'),transform([s*.088*hW,headY+.114*hH,.002],[.015,.030,.018]),skinUV);
  // Separate textured scalp, temples, sideburns and an asymmetric side part.
  const hN=12,hairBottom=a=>{
    const f=Math.cos(a);if(f>.45)return role==='wallman'?.200:.177+.007*Math.sin(a);
    return role==='receptionist'?.050:.091+(f<-.4?-.01:0);
  };
  const hairR=[0,1,2,3].map(r=>Array.from({length:hN},(_,j)=>{
    const a=j*Math.PI*2/hN,b=hairBottom(a),y=[b,Math.max(b+.018,.197),.232,.251][r];
    const width=[.088,.087,.064,.030][r]+(role==='receptionist'&&r<2?.015:0),depth=[.099,.104,.080,.039][r];
    const sweep=role==='homeless'?.005*Math.sin(j*7):role==='receptionist'?.002:.008;
    return[Math.sin(a)*width*hW+sweep*(r/3),headY+y*hH,Math.cos(a)*depth*hD-.010];
  }));
  part='texturedHair';
  for(let r=0;r<3;r++)for(let j=0;j<hN;j++){const k=(j+1)%hN;quad(6,hairR[r][j],hairR[r][k],hairR[r+1][k],hairR[r+1][j],[[j/hN,r/3],[(j+1)/hN,r/3],[(j+1)/hN,(r+1)/3],[j/hN,(r+1)/3]],white,[W('head'),W('head'),W('head'),W('head')]);}
  for(let j=0;j<hN;j++)tri(6,[.008,headY+.256*hH,-.008],hairR[3][j],hairR[3][(j+1)%hN],[.5,1],[j/hN,.86],[(j+1)/hN,.86],white,W('head'));
  if(role==='receptionist'){
    part='glasses';const fc=color(0x2d2823),z=.103*hD,yy=headY+.127*hH;
    for(const s of[-1,1]){
      for(const y of[-.017,.017])box([s*.040,yy+y,z],[.065,.004,.004],3,fc,W('head'));
      for(const x of[-.030,.030])box([s*.040+x,yy,z],[.004,.034,.004],3,fc,W('head'));
      box([s*.040,yy,z-.002],[.054,.027,.002],5,white,W('head'));
      box([s*.077,yy,-.003],[.006,.007,.210],3,fc,W('head'));
    }
    box([0,yy,z],[.016,.006,.005],3,fc,W('head'));
  }

  if(role==='reader'){
    part='cigarette';poly(new T.CylinderGeometry(.0035,.0035,.060,6,1),3,color(0xc5b18c),W('head'),transform([.035,headY+.048,.128],[1,1,1],[Math.PI/2,0,-.14]));
    poly(new T.CylinderGeometry(.0039,.0035,.006,6,1),3,color(0x8f4328),W('head'),transform([.040,headY+.048,.161],[1,1,1],[Math.PI/2,0,0]));
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
  function arm(side,target,bend=[side==='L'?1:-1,-.35,-.1]) {ik('upperArm'+side,'foreArm'+side,target,bend,.31,.27);}
  function leg(side,target,bend=[0,0,1]) {ik('thigh'+side,'shin'+side,target,bend,.425,.43);}
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
      bones.hips.position.set(0,.125,0);bones.spine.rotation.x=-.28;bones.chest.rotation.x=-.14;
      bones.chest.scale.set(1,1+Math.sin(a)*.0025,1+Math.sin(a)*.005);
      bones.head.rotation.set(.30,-.07,.08);
      group.updateMatrixWorld(true);leg('L',[.18,.075,.66],[.1,1,.15]);levelFoot('L');leg('R',[-.18,.075,.54],[-.2,1,.18]);levelFoot('R');
      group.updateMatrixWorld(true);arm('L',[.19,.435,.33],[1,-.2,.2]);arm('R',[-.27,.072,.07],[-1,-.4,.1]);
      orientHand('L',[Math.PI/2,0,0]);orientHand('R',[Math.PI/2,0,0]);
    } else {
      bones.hips.position.x=Math.sin(a)*((role==='wallman'||isPool)?.005:.002);
      bones.chest.scale.set(1,1+Math.sin(a)*.002,1+Math.sin(a)*.0035);bones.clavicleL.rotation.z=Math.sin(a)*.006;bones.clavicleR.rotation.z=-Math.sin(a)*.006;
      if(isSeated){
        bones.hips.position.y=seatHeight+.115;bones.spine.rotation.x=.04;bones.chest.rotation.x=.035;
        bones.head.rotation.set(role==='reader'?.17+.018*Math.sin(t*Math.PI*2/4.5):.05,Math.sin(a)*.022,0);
        group.updateMatrixWorld(true);
        leg('R',[-.115,.075+groundHeight,.495]);levelFoot('R');
        if(role==='plaid') {leg('L',[-.132,.358,.575],[.85,0,1]);levelFoot('L',Math.sin(t*Math.PI*2*1.125)*.07);}
        else {leg('L',[.115,.075+groundHeight,.495]);levelFoot('L');}
        group.updateMatrixWorld(true);
        if(role==='reader'){
          const pagePhase=t%6,jerk=pagePhase>=4.6&&pagePhase<4.6+2/15?1:pagePhase>=4.6+2/15&&pagePhase<4.8?-.35:0;
          arm('L',[.208,seatHeight+.290+jerk*.018,.405+jerk*.012]);arm('R',[-.208,seatHeight+.290+jerk*.018,.405+jerk*.012]);
          orientHand('L',[0,0,-Math.PI/2]);orientHand('R',[0,0,Math.PI/2]);
        } else {
          arm('L',[.22,seatHeight+.17,.32]);
          const p=t%8;let reach=0;if(p>=6.1&&p<6.7)reach=(p-6.1)/.6;else if(p>=6.7&&p<7.3)reach=1;else if(p>=7.3&&p<7.9)reach=1-(p-7.3)/.6;
          const temple=new T.Vector3(-.112,headY+.145,.04).applyMatrix4(bindWorld.head.clone().invert()).applyMatrix4(bones.head.matrixWorld);
          arm('R',[mix(-.22,temple.x,reach),mix(seatHeight+.19,temple.y-.13,reach),mix(.33,temple.z+.014,reach)]);
          orientHand('R',[Math.PI*reach,0,0]);
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
        if(role==='wallman'){arm('R',[-.265,1.40,.535],[-1,0,-.4]);arm('L',[.095,.925,.165]);orientHand('R',[Math.PI,0,0]);}
        if(isPool){arm('L',[.34,.99,.14],[.12,0,.6]);arm('R',[-.34,.99,.14],[-.12,0,.6]);orientHand('L',[Math.PI/2,0,0]);orientHand('R',[Math.PI/2,0,0]);}
        if(role==='receptionist'){
          arm('L',[.205,.89,.12]);const p=t%10;let r=0,push=0;
          if(p>=5.6&&p<6)r=(p-5.6)/.4;else if(p>=6&&p<6+2/15){r=1;push=p>=6+1/15?1:0;}else if(p>=6+2/15&&p<6.55)r=1-(p-(6+2/15))/(6.55-(6+2/15));
          // Aim the mitten fingertip at the posed frame, not the forehead.
          // This is baked into the discrete clip; no IK runs in the game loop.
          const frameContact=new T.Vector3(-.075,headY+.127*hH,.103*hD+.013-push*.009)
            .applyMatrix4(bindWorld.head.clone().invert()).applyMatrix4(bones.head.matrixWorld);
          arm('R',[mix(-.23,frameContact.x,r),mix(.90,frameContact.y-.13,r),mix(.07,frameContact.z+.014,r)]);
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
    part='foldedNewspaper';const m=intoBind('handL'),y=seatHeight+.445;
    const ps=[];for(let r=0;r<3;r++)for(let c=0;c<3;c++){
      const x=(c-1)*.228,yy=y+(r-1)*.15+(r===2&&c===2?.012:0),z=.426-r*.041+(c===1?.100:0)+(r===1?.010:0);
      ps.push(new T.Vector3(x,yy,z).applyMatrix4(m).toArray());
    }
    for(let r=0;r<2;r++)for(let c=0;c<2;c++){
      const ids=[r*3+c,r*3+c+1,(r+1)*3+c+1,(r+1)*3+c],uv=[[c/2,r/2],[(c+1)/2,r/2],[(c+1)/2,(r+1)/2],[c/2,(r+1)/2]],w=W('handL');
      quad(4,...ids.map(i=>ps[i]),uv,white,[w,w,w,w]);quad(4,...ids.slice().reverse().map(i=>ps[i]),uv.slice().reverse(),[.86,.85,.80],[w,w,w,w]);
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

  const texturesUsed=new Set([textures.face,textures.faceBlink??textures.face,textures.body,textures.hair,textures.newspaper].filter(Boolean));
  for(const texture of texturesUsed) {
    const im=texture.image??texture.source?.data;
    if(im?.width&&im?.height&&(im.width!==128||im.height!==128))throw new Error(`V75 ${role} texture must be 128×128; got ${im.width}×${im.height}.`);
    texture.minFilter=T.NearestFilter;texture.magFilter=T.NearestFilter;texture.generateMipmaps=false;texture.anisotropy=1;texture.colorSpace=T.SRGBColorSpace;
    // Upload flags are changed only at creation, never on an animation tick.
    texture.needsUpdate=true;
  }
  const makeMat=(name,map,extra={})=>{const m=new T.MeshLambertMaterial({map:map??null,flatShading:true,vertexColors:true,...extra});if(map){m.emissive.setHex(0xffffff);m.emissiveMap=map;m.emissiveIntensity=isPool?.28:.10;}m.name=`V75 ${role} / ${name}`;return m;};
  const faceMaterial=makeMat('front face',role==='homeless'?(textures.faceBlink??textures.face):textures.face);
  const materials=[makeMat('body',textures.body),faceMaterial,makeMat('skin and hair patches',textures.face),makeMat('solid prop'),makeMat('newspaper',textures.newspaper??null,{side:T.DoubleSide}),makeMat('transparent reading glass',null,{color:0xb9cfc7,transparent:true,opacity:.13,depthWrite:false}),makeMat('independent textured hair',textures.hair??textures.face)];
  const geometry=new T.BufferGeometry(),joined={p:[],uv:[],c:[],si:[],sw:[]};let start=0;
  for(let i=0;i<bins.length;i++)if(bins[i].p.length){const b=bins[i];geometry.addGroup(start,b.p.length/3,i);for(const k of Object.keys(joined))joined[k].push(...b[k]);start+=b.p.length/3;}
  geometry.setAttribute('position',new T.Float32BufferAttribute(joined.p,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(joined.uv,2));geometry.setAttribute('color',new T.Float32BufferAttribute(joined.c,3));geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(joined.si,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(joined.sw,4));geometry.computeVertexNormals();
  const fingerTargets=['L','R'].map(side=>{const a=geometry.attributes.position.array.slice(),si=geometry.attributes.skinIndex.array;for(let i=0;i<a.length/3;i++){if(si[i*4]!==index('hand'+side))continue;const y=a[i*3+1],bend=clamp((.815-y)/.095,0,1);a[i*3+2]+=.018*bend*bend;a[i*3+1]+=.006*bend*bend;}return new T.Float32BufferAttribute(a,3);});
  geometry.morphAttributes.position=fingerTargets;
  const mesh=new T.SkinnedMesh(geometry,materials);mesh.name=`V75 ${role} / unified skinned actor`;mesh.castShadow=opts.castShadow??false;mesh.receiveShadow=true;mesh.frustumCulled=false;
  group.add(mesh);const skeleton=new T.Skeleton(boneList);mesh.bind(skeleton);mesh.normalizeSkinWeights();

  let smoke=null;
  if(role==='reader'){
    const sg=new T.PlaneGeometry(.042,.27,1,8);sg.translate(0,.135,0);
    const sm=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time:{value:0}},vertexShader:'varying vec2 q;uniform float time;void main(){q=uv;vec3 p=position;p.x+=sin(p.y*19.-time*.9)*p.y*.12;p.z+=cos(p.y*15.-time*.7)*p.y*.1;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',fragmentShader:'varying vec2 q;uniform float time;void main(){float n=.58+.24*sin(q.y*41.-time*1.7)+.16*sin(q.y*79.+q.x*13.-time*2.4);float a=pow(max(0.,1.-abs(q.x*2.-1.)),2.)*(1.-q.y)*smoothstep(0.,.13,q.y)*n*.18;gl_FragColor=vec4(.69,.70,.66,a);}' });
    smoke=new T.Mesh(sg,sm);smoke.name='Slow cigarette smoke ribbon';smoke.position.set(.040,headY+.048-1.535,.166);bones.head.add(smoke);
  }
  const tracks=[],times=[],records=Object.fromEntries(boneList.map(b=>[b.name,{q:[],p:[],s:[]}]));
  for(let frame=0;frame<=profile.duration*poseHz;frame++) {
    const t=frame/poseHz;makePose(t);times.push(t);
    for(const b of boneList){records[b.name].q.push(...b.quaternion.toArray());records[b.name].p.push(...b.position.toArray());records[b.name].s.push(...b.scale.toArray());}
  }
  for(const b of boneList) {
    tracks.push(new T.QuaternionKeyframeTrack(b.name+'.quaternion',times,records[b.name].q,T.InterpolateDiscrete));
    if(b.name==='hips')tracks.push(new T.VectorKeyframeTrack(b.name+'.position',times,records[b.name].p,T.InterpolateDiscrete));
    if(b.name==='chest')tracks.push(new T.VectorKeyframeTrack(b.name+'.scale',times,records[b.name].s,T.InterpolateDiscrete));
  }
  resetPose();
  const clip=new T.AnimationClip(role+' / articulated '+poseHz+' Hz idle',profile.duration,tracks),mixer=new T.AnimationMixer(group);
  mixer.clipAction(clip).setLoop(T.LoopRepeat,Infinity).play();
  const phase=opts.phase??hash(seed+1)*profile.duration,blinkPeriod=3.0+hash(seed+17)*2.7,blinkPhase=hash(seed+29)*blinkPeriod;
  let lastTick=-Infinity,disposed=false,forcedEye=null,eyeClosed=role==='homeless';
  const diagnostics={role,seed,rigType:'THREE.SkinnedMesh',bones:19,triangles:geometry.getAttribute('position').count/3+(smoke?16:0),drawCalls:geometry.groups.length+(smoke?1:0),materials:geometry.groups.map(g=>materials[g.materialIndex].name),partTriangles,poseHz,mainFrameCap:false,interpolation:'THREE.InterpolateDiscrete',clip:clip.name,clipDuration:clip.duration,sourceTexturesCallerOwned:true,faceUV:'landmark-aligned facial grid, continuous nose/cheeks/jaw; separate hair UV surface',blinkMode:role==='homeless'?'always closed':'independent preloaded image swap',blinkPeriod,blinkPhase,updates:0,eyeChanges:0,eyeClosed,dimensions:{scale,seatHeight:isSeated?requestedSeatHeight:null},bounds:null};
  if(diagnostics.triangles<500||diagnostics.triangles>1500)throw new Error(`V75 ${role}: ${diagnostics.triangles} triangles, outside total 500–1500 budget.`);
  const setEye=closed=>{closed=role==='homeless'||closed;if(eyeClosed!==closed){eyeClosed=closed;faceMaterial.map=closed?(textures.faceBlink??textures.face):textures.face;faceMaterial.emissiveMap=faceMaterial.map;diagnostics.eyeChanges++;}diagnostics.eyeClosed=eyeClosed;};
  function update(t,dt=0) {
    if(disposed)return;if(!Number.isFinite(t))return;
    const tick=Math.floor((Math.max(0,t)+phase)*poseHz+1e-6);
    if(tick===lastTick)return;lastTick=tick;mixer.setTime(tick/poseHz);group.updateMatrixWorld(true);skeleton.update();if(smoke)smoke.material.uniforms.time.value=t;mesh.morphTargetInfluences[0]=role==='homeless'?0:.28+.22*Math.sin(t*.62+seed);mesh.morphTargetInfluences[1]=role==='homeless'?0:.26+.20*Math.sin(t*.57+seed+1.2);diagnostics.updates++;
    const bt=tick/poseHz+blinkPhase, cycle=Math.floor(bt/blinkPeriod),p=bt-cycle*blinkPeriod;
    const closed=p>blinkPeriod-.21&&p<blinkPeriod-.045||(hash(seed+cycle*73)>.78&&p>.12&&p<.255);
    setEye(forcedEye??closed);
  }
  function forceBlink(state='auto') {forcedEye=state==='auto'||state===null?null:state===true||state==='closed';setEye(forcedEye??false);return diagnostics.eyeClosed;}
  function samplePose(t=0) {
    mixer.setTime(Math.floor(t*poseHz+1e-6)/poseHz);group.updateMatrixWorld(true);skeleton.update();
    const data={time:Math.floor(t*poseHz+1e-6)/poseHz,bones:{}};
    for(const b of boneList)data.bones[b.name]={position:b.getWorldPosition(new T.Vector3()).toArray(),quaternion:b.quaternion.toArray(),scale:b.scale.toArray()};
    mesh.computeBoundingBox();data.bounds={min:mesh.boundingBox.min.clone().multiply(group.scale).toArray(),max:mesh.boundingBox.max.clone().multiply(group.scale).toArray()};lastTick=-Infinity;return data;
  }
  function dispose(){if(disposed)return;disposed=true;mixer.stopAllAction();mixer.uncacheRoot(group);geometry.dispose();for(const m of materials)m.dispose();skeleton.dispose();if(smoke){smoke.geometry.dispose();smoke.material.dispose();}group.removeFromParent();}
  group.scale.setScalar(scale);update(0);mesh.computeBoundingBox();diagnostics.bounds={min:mesh.boundingBox.min.clone().multiply(group.scale).toArray(),max:mesh.boundingBox.max.clone().multiply(group.scale).toArray()};
  sockets.leftHand=bones.handL;sockets.rightHand=bones.handR;sockets.head=bones.head;sockets.leftFoot=bones.footL;sockets.rightFoot=bones.footR;
  group.userData.diagnostics=diagnostics;
  return{group,update,dispose,diagnostics,bones,sockets,forceBlink,samplePose,mixer,mesh,clip,materials};
}
