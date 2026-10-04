import {posePlan79} from './tiki-garden-pose-v85.js';
/* V79: metre-scale, +Z-facing, nineteen-bone Tiki cast; generated UV surfaces and discrete held poses.
 * No renderer, frame scheduler, network request or global event listener lives here.
 * Supplied textures remain caller-owned. Body and independent eyelids sample at 30 Hz; camera rendering remains uncapped.
 */


export const TIKI_POSE_HZ79 = 30;

const PROFILES={footbath:{height:1.02,shoulder:1.02,waist:.96,limb:.98,head:[.98,1.03,1],jaw:1.02,nose:.56,shoe:0x5a4d36,duration:12},botanist:{height:1.00,shoulder:1.07,waist:1.11,limb:1.05,head:[1.05,.99,1.04],jaw:1.1,nose:.59,shoe:0x513725,duration:16}};

export const TIKI_ROLES79=Object.freeze(Object.keys(PROFILES));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t;
const hash=n=>{let x=(n|0)^0x9e3779b9;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return((x^(x>>>15))>>>0)/4294967296;};
const roleSeed=s=>{let n=175;for(let i=0;i<s.length;i++)n=Math.imul(n^s.charCodeAt(i),16777619);return n>>>0;};

/**
 * @param {object} T The host's existing THREE namespace (r180 compatible).
 * @param {string} role One of TIKI_ROLES79.
 * @param {object} textures {face, faceBlink, body, newspaper?}; each supplied image is 128².
 * @param {object} opts {seatHeight, seed, scale, skinUV, hairUV, castShadow, phase}.
 * @returns {{group,update,dispose,diagnostics,bones,sockets,forceBlink,samplePose,mixer,mesh}}
 */
export function createTikiActor79(T, role, textures, opts={}) {
  if(!PROFILES[role]) throw new Error('Unknown V79 NPC role: '+role);
  if(!textures?.face || !textures?.body) throw new Error('V79 NPC requires preloaded face and body textures.');
  const profile=PROFILES[role], seed=opts.seed??roleSeed(role), isPool=role==='footbath';
  const isSeated=role==='footbath';
  const requestedSeatHeight=opts.seatHeight??(['sleeper','barwoman'].includes(role)?.82:.545);
  const poseHz=30;
  const group=new T.Group();group.name='V79 / '+role;group.userData.retroRole=role;
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
  const bins=Array.from({length:9},()=>({p:[],uv:[],c:[],si:[],sw:[]}));
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
    if(uvStyle==='skin'&&['palms','fingers','shapedTrousers'].includes(part))mat=8;
    // Cross-sections must run bottom to top so sleeve/leg faces point outward too.
    if(rings[rings.length-1].p[1]<rings[0].p[1])rings=rings.slice().reverse();
    const points=rings.map(r=>Array.from({length:n},(_,j)=>{
      const a=2*Math.PI*j/n, front=Math.cos(a)>=0;
      return[r.p[0]+Math.sin(a)*r.rx,r.p[1],r.p[2]+Math.cos(a)*(front?(r.rzFront??r.rz):(r.rzBack??r.rz))];
    }));
    const uv=(i,j,front=false)=>{
      if(uvStyle==='skin'&&mat===8)return[.53+.43*j/n,.275+.20*i/(rings.length-1)];
      if(uvStyle==='skin')return patchUV(skinUV[0]+Math.sin(j)*.004,skinUV[1]+i*.003);
      if(uvStyle==='hair')return patchUV(hairUV[0],hairUV[1],.003);
      const vv=i/(rings.length-1);
      if(uvStyle==='pants')return[.015+.47*j/n,.016+.467*vv];
      if(uvStyle==='sleeve'||uvStyle==='body')return[.02+.44*j/n,.59+.30*vv];
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
      const uv=(r,c)=>i<2?[.035+.41*c/6,.59+.30*(1-r/(rings.length-1))]:[.53+.43*c/6,.275+.20*(1-r/(rings.length-1))];
      const ps=vs.map(v=>v.p),us=[uv(i,j),uv(i,k),uv(i+1,k),uv(i+1,j)],ws=vs.map(v=>v.w);
      if(sign===-1)quad(i<2?0:8,...ps,us,white,ws);else quad(i<2?0:8,...ps.reverse(),us.reverse(),white,ws.reverse());
    }
    // Flattened palm with separate finger silhouettes, rather than a block mitten.
    part='palms';tube([[.894,.041,.022],[.840,.044,.018],[.810,.037,.016]].map(([y,rx,rz])=>({p:[x,y,.010],rx,rz,w:W(hand)})),6,2,white,'skin');
    part='fingers';
    for(let f=0;f<4;f++){
      const fx=x+(f-1.5)*.019,tip=.735+([.021,0,.008,.027][f]);
      tube([{p:[fx,.819,.011],rx:.010,rz:.012,w:W(hand)},{p:[fx,.779,.019],rx:.009,rz:.011,w:W(hand)},{p:[fx,(['bartender','elder','waiter'].includes(role)||(role==='orderer'&&side==='R'&&f!==1))?.801:tip,(['bartender','elder','waiter'].includes(role)||(role==='orderer'&&side==='R'&&f!==1))?.069:.009],rx:.008,rz:.010,w:W(hand)}],4,2,white,'skin');
    }
    part='thumb';poly(new T.OctahedronGeometry(1,0),2,white,W(hand),transform([x-sign*.046,.823,.036],[.019,.042,.021],[.12,0,sign*.48]),skinUV);
    const hip='thigh'+side,knee='shin'+side,foot='foot'+side;
    const rows=[[.958,.081,.108,hip],[.838,.103,.114,hip],[.660,.099,.104,hip],[.506,.075,.082,knee],[.350,.080,.076,knee],[.082,.059,.055,knee]];
    part='shapedTrousers';
    if(!isPool)tube(rows.map(([y,rx,rz,b],i)=>({p:[sign*.108,y,i===3?.008:0],rx:rx*profile.limb,rz:rz*profile.limb,w:i===0?W('hips',.45,hip):i===3?W(hip,.4,knee):W(b)})),8,0,white,'pants');
    else{
      tube(rows.slice(3).map(([y,rx,rz,b],i)=>({p:[sign*.108,y,0],rx:rx*.80,rz:rz*.78,w:i===0?W(hip,.4,knee):W(b)})),8,2,white,'skin');
      tube(rows.slice(0,4).map(([y,rx,rz,b],i)=>({p:[sign*.108,y,i===3?.008:0],rx:rx*profile.limb,rz:rz*profile.limb,w:i===0?W('hips',.45,hip):i===3?W(hip,.4,knee):W(b)})),8,0,white,'pants');
      part='rolledCuffs';tube([[.486,.086,.088],[.503,.088,.090],[.548,.081,.085]].map(([y,rx,rz])=>({p:[sign*.108,y,.008],rx,rz,w:W(hip,.4,knee)})),8,0,white,'pants');
    }
    part='feet';const center=[sign*.108,.045,.054],fc=isPool?white:color(profile.shoe),fm=isPool?8:3;
    const ps=[[-.048,-.045,-.087],[.048,-.045,-.087],[.054,-.045,.147],[-.054,-.045,.147],[-.045,.033,-.077],[.045,.033,-.077],[.052,-.009,.154],[-.052,-.009,.154]].map(p=>p.map((v,i)=>v+center[i]));
    for(const q of[[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]])quad(fm,...q.map(i=>ps[i]),(isPool?[[.61,.31],[.83,.31],[.83,.42],[.61,.42]]:[skinUV,skinUV,skinUV,skinUV]),fc,[W(foot),W(foot),W(foot),W(foot)]);
  }
  // Tailored collar / lapels have thickness in silhouette, with atlas-matched UVs.
  {
    part='collar';
    for(const sign of[-1,1]){
      const ps=[[sign*.062,1.526,.062],[sign*.117,1.486,.091],[sign*.068,1.425,.126],[sign*.032,1.496,.089]];
      quad(0,...(sign===1?ps:ps.slice().reverse()),(sign===1?ps:ps.slice().reverse()).map(p=>clothUV(p,true)),white,[W('chest'),W('chest'),W('chest'),W('neck')]);
    }
  }

  // Semantic facial rings, not an ellipsoid plus a detached nose. Nose relief
  // shares the facial surface. Eyes, nose, mouth UV rows follow image landmarks.
  const headY=1.552,hW=profile.head[0],hH=profile.head[1],hD=profile.head[2];
  const faceRows=[ [0,.047,.072,.96],[.025,.065,.089,.84],[.049,.075,.094,.76],[.084,.083,.091,.61],[.127,.086,.082,.36],[.150,.085,.090,.25],[.190,.080,.079,.07],[.220,.062,.059,0] ];
  const landmarks=opts.landmarks??[.37,.625,.76,.97,.32,.68];
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
    const f=Math.cos(a);if(f>.45)return role==='botanist'?.196+.012*Math.abs(Math.sin(a*2)):.180+.007*Math.sin(a);
    return role==='barwoman'?.015:.091+(f<-.4?-.01:0);
  };
  const hairR=[0,1,2,3].map(r=>Array.from({length:hN},(_,j)=>{
    const a=j*Math.PI*2/hN,b=hairBottom(a),y=[b,Math.max(b+.018,.197),.232,.251][r];
    const width=[.088,.087,.064,.030][r]+(role==='barwoman'&&r<2?.019:0),depth=[.099,.104,.080,.039][r];
    const sweep=role==='sleeper'?.005*Math.sin(j*7):.008;
    return[Math.sin(a)*width*hW+sweep*(r/3),headY+y*hH,Math.cos(a)*depth*hD-.010];
  }));
  part='texturedHair';
  for(let r=0;r<3;r++)for(let j=0;j<hN;j++){const k=(j+1)%hN;quad(role==='sleeper'&&r>0?2:6,hairR[r][j],hairR[r][k],hairR[r+1][k],hairR[r+1][j],role==='sleeper'&&r>0?[skinUV,skinUV,skinUV,skinUV]:[[j/hN,r/3],[(j+1)/hN,r/3],[(j+1)/hN,(r+1)/3],[j/hN,(r+1)/3]],white,[W('head'),W('head'),W('head'),W('head')]);}
  for(let j=0;j<hN;j++)tri(role==='sleeper'?2:6,[.008,headY+.256*hH,-.008],hairR[3][j],hairR[3][(j+1)%hN],role==='sleeper'?skinUV:[.5,1],role==='sleeper'?skinUV:[j/hN,.86],role==='sleeper'?skinUV:[(j+1)/hN,.86],white,W('head'));
  if(role==='elder'){
    part='glasses';const fc=color(0x2d2823),z=.103*hD,yy=headY+.127*hH;
    for(const s of[-1,1]){
      for(const y of[-.017,.017])box([s*.040,yy+y,z],[.065,.004,.004],3,fc,W('head'));
      for(const x of[-.030,.030])box([s*.040+x,yy,z],[.004,.034,.004],3,fc,W('head'));
      box([s*.040,yy,z-.002],[.054,.027,.002],5,white,W('head'));
      box([s*.077,yy,-.003],[.006,.007,.210],3,fc,W('head'));
    }
    box([0,yy,z],[.016,.006,.005],3,fc,W('head'));
  }

  // Hair mass is independent of the landmark face; geometric ponytail / beard silhouettes.
  if(role==='asianwoman'){
    part='ponytail';tube([{p:[0,headY+.19,-.082],rx:.039,rz:.034,w:W('head')},{p:[.014,headY+.10,-.136],rx:.049,rz:.039,w:W('head')},{p:[.025,headY-.006,-.127],rx:.024,rz:.030,w:W('head')}],6,6,white,'body');
  }
  if(role==='elder'){
    part='longBeard';
    const rows=[[headY+.074,.078,.036,.065],[headY-.014,.070,.042,.094],[headY-.095,.045,.027,.127],[headY-.171,.018,.019,.143]],n=8;
    for(let r=0;r<3;r++)for(let c=0;c<n;c++){
      const point=(i,j)=>{const [y,rx,rz,z]=rows[i],a=j/n*Math.PI*2;return[Math.sin(a)*rx,y+(i===3?.006*Math.cos(j*2.1):0),z+Math.cos(a)*rz];};
      quad(7,point(r,c),point(r,c+1),point(r+1,c+1),point(r+1,c),[[c/n,1-r/3],[(c+1)/n,1-r/3],[(c+1)/n,1-(r+1)/3],[c/n,1-(r+1)/3]],white,[W('head'),W('head'),W('head'),W('head')]);
    }
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
    resetPose();
    const p=posePlan79(role,t,{seatHeight,groundHeight}),a=t*2*Math.PI/profile.duration;
    bones.hips.position.fromArray(p.hips);bones.hips.rotation.z=p.pelvis??0;
    bones.spine.rotation.x=p.lean*.58;bones.chest.rotation.x=p.lean*.42;
    bones.chest.scale.set(1,1+Math.sin(a)*.0018,1+Math.sin(a)*.0032);
    bones.clavicleL.rotation.z=Math.sin(a)*.004;bones.clavicleR.rotation.z=-Math.sin(a)*.004;
    bones.head.rotation.fromArray([...p.head,'XYZ']);
    group.updateMatrixWorld(true);
    for(const side of ['L','R']) {leg(side,p.feet[side],[side==='L'?.13:-.13,0,1]);levelFoot(side,isPool?-.16:0);}
    group.updateMatrixWorld(true);
    for(const side of ['L','R']) {arm(side,p.hands[side],p.elbows?.[side]??[side==='L'?1:-1,-.35,-.1]);orientHand(side,p.orient[side]);}
    group.updateMatrixWorld(true);
  }
  resetPose();group.updateMatrixWorld(true);

  const texturesUsed=new Set([textures.face,textures.faceBlink??textures.face,textures.body,textures.hair,textures.beard,textures.newspaper].filter(Boolean));
  for(const texture of texturesUsed) {
    const im=texture.image??texture.source?.data;
    if(im?.width&&im?.height&&(im.width!==128||im.height!==128))throw new Error(`V79 ${role} texture must be 128×128; got ${im.width}×${im.height}.`);
    texture.minFilter=T.NearestFilter;texture.magFilter=T.NearestFilter;texture.generateMipmaps=false;texture.anisotropy=1;texture.colorSpace=T.SRGBColorSpace;
    // Upload flags are changed only at creation, never on an animation tick.
    texture.needsUpdate=true;
  }
  const makeMat=(name,map,extra={})=>{const m=new T.MeshLambertMaterial({map:map??null,flatShading:true,vertexColors:true,...extra});if(map){m.emissive.setHex(0xffffff);m.emissiveMap=map;m.emissiveIntensity=name==='front face'?.22:.10;}m.name=`V79 ${role} / ${name}`;return m;};
  const faceMaterial=makeMat('front face',role==='sleeper'?(textures.faceBlink??textures.face):textures.face);
  const materials=[makeMat('body',textures.body),faceMaterial,makeMat('skin and hair patches',textures.face),makeMat('solid prop'),makeMat('newspaper',textures.newspaper??null,{side:T.DoubleSide}),makeMat('transparent reading glass',null,{color:0xb9cfc7,transparent:true,opacity:.13,depthWrite:false}),makeMat('independent textured hair',textures.hair??textures.face),makeMat('independent textured beard',textures.beard??textures.hair??textures.face,{side:T.DoubleSide}),makeMat('baked skin atlas / limbs',textures.body)];
  const geometry=new T.BufferGeometry(),joined={p:[],uv:[],c:[],si:[],sw:[]};let start=0;
  for(let i=0;i<bins.length;i++)if(bins[i].p.length){const b=bins[i];geometry.addGroup(start,b.p.length/3,i);for(const k of Object.keys(joined))joined[k].push(...b[k]);start+=b.p.length/3;}
  geometry.setAttribute('position',new T.Float32BufferAttribute(joined.p,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(joined.uv,2));geometry.setAttribute('color',new T.Float32BufferAttribute(joined.c,3));geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(joined.si,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(joined.sw,4));geometry.computeVertexNormals();
  const fingerTargets=['L','R'].map(side=>{const a=geometry.attributes.position.array.slice(),si=geometry.attributes.skinIndex.array;for(let i=0;i<a.length/3;i++){if(si[i*4]!==index('hand'+side))continue;const y=a[i*3+1],bend=clamp((.815-y)/.095,0,1);a[i*3+2]+=.018*bend*bend;a[i*3+1]+=.006*bend*bend;}return new T.Float32BufferAttribute(a,3);});
  geometry.morphAttributes.position=fingerTargets;
  const mesh=new T.SkinnedMesh(geometry,materials);mesh.name=`V79 ${role} / unified skinned actor`;mesh.castShadow=opts.castShadow??false;mesh.receiveShadow=true;mesh.frustumCulled=false;
  group.add(mesh);const skeleton=new T.Skeleton(boneList);mesh.bind(skeleton);mesh.normalizeSkinWeights();

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
  const phase=opts.phase??0,blinkPeriod=3.0+hash(seed+17)*2.7,blinkPhase=hash(seed+29)*blinkPeriod;
  let lastTick=-Infinity,disposed=false,forcedEye=null,eyeClosed=false,reactionStart=-Infinity;
  const diagnostics={role,seed,rigType:'THREE.SkinnedMesh',bones:19,triangles:geometry.getAttribute('position').count/3,drawCalls:geometry.groups.length,materials:geometry.groups.map(g=>materials[g.materialIndex].name),partTriangles,poseHz,mainFrameCap:false,interpolation:'THREE.InterpolateDiscrete',clip:clip.name,clipDuration:clip.duration,sourceTexturesCallerOwned:true,faceUV:'landmark-aligned facial grid, continuous nose/cheeks/jaw; separate hair UV surface',blinkMode:role==='sleeper'?'always closed':'independent preloaded image swap',blinkPeriod,blinkPhase,updates:0,eyeChanges:0,eyeClosed,dimensions:{scale,seatHeight:isSeated?requestedSeatHeight:null},bounds:null};
  if(diagnostics.triangles<500||diagnostics.triangles>1500)throw new Error(`V79 ${role}: ${diagnostics.triangles} triangles, outside total 500–1500 budget.`);
  const setEye=closed=>{closed=role==='sleeper'||closed;if(eyeClosed!==closed){eyeClosed=closed;faceMaterial.map=closed?(textures.faceBlink??textures.face):textures.face;faceMaterial.emissiveMap=faceMaterial.map;diagnostics.eyeChanges++;}diagnostics.eyeClosed=eyeClosed;};
  function update(t,dt=0) {
    if(disposed)return;if(!Number.isFinite(t))return;
    const tick=Math.floor((Math.max(0,t)+phase)*poseHz+1e-6);
    if(tick===lastTick)return;lastTick=tick;const age=t-reactionStart;const clock=role==='botanist'&&age>=0&&age<3.95?12+Math.floor(age*poseHz)/poseHz:(tick/poseHz)%12;mixer.setTime(clock+1e-4);group.updateMatrixWorld(true);skeleton.update();mesh.morphTargetInfluences[0]=role==='sleeper'?0:.28+.22*Math.sin(t*.62+seed);mesh.morphTargetInfluences[1]=role==='sleeper'?0:.26+.20*Math.sin(t*.57+seed+1.2);diagnostics.updates++;
    const bt=tick/poseHz+blinkPhase, cycle=Math.floor(bt/blinkPeriod),p=bt-cycle*blinkPeriod;
    const closed=p>blinkPeriod-.21&&p<blinkPeriod-.045||(hash(seed+cycle*73)>.78&&p>.12&&p<.255);
    setEye(forcedEye??closed);
  }
  function forceBlink(state='auto') {forcedEye=state==='auto'||state===null?null:state===true||state==='closed';setEye(forcedEye??false);return diagnostics.eyeClosed;}
  function samplePose(t=0) {
    mixer.setTime(Math.floor(t*poseHz+1e-6)/poseHz+1e-4);group.updateMatrixWorld(true);skeleton.update();
    const data={time:Math.floor(t*poseHz+1e-6)/poseHz,bones:{}};
    for(const b of boneList)data.bones[b.name]={position:b.getWorldPosition(new T.Vector3()).toArray(),quaternion:b.quaternion.toArray(),scale:b.scale.toArray()};
    mesh.computeBoundingBox();data.bounds={min:mesh.boundingBox.min.clone().multiply(group.scale).toArray(),max:mesh.boundingBox.max.clone().multiply(group.scale).toArray()};lastTick=-Infinity;return data;
  }
  function dispose(){if(disposed)return;disposed=true;mixer.stopAllAction();mixer.uncacheRoot(group);geometry.dispose();for(const m of materials)m.dispose();skeleton.dispose();group.removeFromParent();}
  group.scale.setScalar(scale);update(0);mesh.computeBoundingBox();diagnostics.bounds={min:mesh.boundingBox.min.clone().multiply(group.scale).toArray(),max:mesh.boundingBox.max.clone().multiply(group.scale).toArray()};
  sockets.leftHand=bones.handL;sockets.rightHand=bones.handR;sockets.head=bones.head;sockets.leftFoot=bones.footL;sockets.rightFoot=bones.footR;
  group.userData.diagnostics=diagnostics;
  return{react(t){reactionStart=t;lastTick=-Infinity;},group,update,dispose,diagnostics,bones,sockets,forceBlink,samplePose,mixer,mesh,clip,materials};
}
