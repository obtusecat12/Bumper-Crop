import {mergeGeometries} from './vendor/BufferGeometryUtils.js';

// Metres. The telephone has its front along +Z, length along Y and width along X.
// Its chassis is centred at the origin. The independently placeable charger is Y-up.
// No texture loading or material allocation happens in this module.
export const PDA_KEY_ATLAS = Object.freeze([
 ['Q','W','E','R','T','Y'], ['U','I','O','P','A','S'],
 ['D','F','G','H','J','K'], ['L','Z','X','C','V','B'],
 ['N','M','0','1','2','3'], ['4','5','6','7','8','9'],
 ['up','down','left','right','phone','backspace'], ['enter','shift','space','*','#','@'],
]);

export const PDA_GENERATED_KEY_UVS = Object.freeze({"Q":[0.02762431,0.8570442,0.1786372,0.97030387],"W":[0.18830571,0.8573895,0.3393186,0.97064917],"E":[0.34530387,0.85808011,0.49631676,0.97133978],"R":[0.50506446,0.85808011,0.65607735,0.97133978],"T":[0.66298343,0.85808011,0.81399632,0.97133978],"Y":[0.8218232,0.85808011,0.9728361,0.97133978],"U":[0.02808471,0.73653315,0.17909761,0.84979282],"I":[0.18830571,0.73618785,0.3393186,0.84944751],"O":[0.34576427,0.73653315,0.49677716,0.84979282],"P":[0.50322284,0.73687845,0.65423573,0.85013812],"A":[0.66206262,0.73653315,0.81307551,0.84979282],"S":[0.8213628,0.73653315,0.97237569,0.84979282],"D":[0.02900552,0.61395028,0.18001842,0.72720994],"F":[0.18968692,0.61395028,0.34069982,0.72720994],"G":[0.34576427,0.61429558,0.49677716,0.72755525],"H":[0.50368324,0.61395028,0.65469613,0.72720994],"J":[0.66252302,0.61395028,0.81353591,0.72720994],"K":[0.82642726,0.61395028,0.97744015,0.72720994],"L":[0.02900552,0.49033149,0.18001842,0.60359116],"Z":[0.1878453,0.49033149,0.3388582,0.60359116],"X":[0.34484346,0.49033149,0.49585635,0.60359116],"C":[0.50368324,0.49033149,0.65469613,0.60359116],"V":[0.66298343,0.48998619,0.81399632,0.60324586],"B":[0.82412523,0.49033149,0.97513812,0.60359116],"N":[0.02808471,0.36843923,0.17909761,0.4816989],"M":[0.18830571,0.36878453,0.3393186,0.4820442],"0":[0.34530387,0.36843923,0.49631676,0.4816989],"1":[0.50046041,0.36809392,0.6514733,0.48135359],"2":[0.66298343,0.36912983,0.81399632,0.4823895],"3":[0.82320442,0.36843923,0.97421731,0.4816989],"4":[0.0271639,0.24482044,0.1781768,0.35808011],"5":[0.18830571,0.24516575,0.3393186,0.35842541],"6":[0.34530387,0.24551105,0.49631676,0.35877072],"7":[0.50460405,0.24516575,0.65561694,0.35842541],"8":[0.66390424,0.24516575,0.81491713,0.35842541],"9":[0.82228361,0.24516575,0.9732965,0.35842541],"up":[0.02762431,0.12776243,0.1786372,0.2410221],"down":[0.1878453,0.12361878,0.3388582,0.23687845],"left":[0.34346225,0.125,0.49447514,0.23825967],"right":[0.50322284,0.125,0.65423573,0.23825967],"phone":[0.66390424,0.125,0.81491713,0.23825967],"backspace":[0.8213628,0.12361878,0.97237569,0.23687845],"enter":[0.02486188,0.01519337,0.17587477,0.12845304],"shift":[0.18646409,0.01691989,0.33747698,0.13017956],"space":[0.34668508,0.00794199,0.49769797,0.12120166],"*":[0.50506446,0.01657459,0.65607735,0.12983425],"#":[0.66344383,0.01622928,0.81445672,0.12948895],"@":[0.82596685,0.01553867,0.97697974,0.12879834]});

export function createPdaRelics(T, {materials, atlas = PDA_KEY_ATLAS, legendUVs = PDA_GENERATED_KEY_UVS} = {}) {
 const required=['pdaBlack','rubber','steel','dark','screen','glass','keyboard'];
 for(const key of required)if(!materials?.[key])throw new Error('PDA relic material missing: '+key);
 const object=new T.Group();object.name='2009 PDA / rounded thick QWERTY handset';
 const charger=new T.Group();charger.name='Dislodged compact PDA mains charger and grounded USB lead';
 const banks={pda:new Map(),charger:new Map()},partCounts={pda:0,charger:0};
 const pose=new T.Object3D(),up=new T.Vector3(0,1,0);
 const craft=[],keyRecord=[],slots=[],cables=[];

 function surfaceUV(g,scale=.075){
  const p=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(p.count*2);
  for(let i=0;i<p.count;i++){
   const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));
   uv[i*2]=(ax>ay&&ax>az?p.getZ(i):p.getX(i))/scale+.5;
   uv[i*2+1]=(ay>ax&&ay>az?p.getZ(i):p.getY(i))/scale+.5;
  }
  g.setAttribute('uv',new T.BufferAttribute(uv,2));return g;
 }
 function add(target,g,key,x=0,y=0,z=0,rx=0,ry=0,rz=0){
  const copy=g.index?g.toNonIndexed():g.clone();
  if(!copy.attributes.normal)copy.computeVertexNormals();
  if(!copy.attributes.uv)surfaceUV(copy);
  pose.position.set(x,y,z);pose.rotation.set(rx,ry,rz);pose.scale.set(1,1,1);pose.updateMatrix();copy.applyMatrix4(pose.matrix);
  if(!banks[target].has(key))banks[target].set(key,[]);banks[target].get(key).push(copy);partCounts[target]++;g.dispose();
 }
 function roundedShape(w,h,r){
  r=Math.min(r,w*.499,h*.499);const x=-w/2,y=-h/2,s=new T.Shape();
  s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
  s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
  s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
 }
 function roundBox(w,h,d,r=.002,bevel=.00035,segments=2){
  bevel=Math.min(bevel,d*.48,r*.45);const g=new T.ExtrudeGeometry(roundedShape(w-2*bevel,h-2*bevel,r-bevel),
   {depth:d-2*bevel,bevelEnabled:bevel>0,bevelSegments:1,bevelSize:bevel,bevelThickness:bevel,steps:1,curveSegments:segments});
  g.translate(0,0,-d/2+bevel);g.computeVertexNormals();return surfaceUV(g);
 }
 function bx(target,key,x,y,z,w,h,d,r=.002,bevel=.00035,rx=0,ry=0,rz=0){
  // Tiny socket contacts, hatch ribs and seam strips are below the bevel's visual
  // scale. Keep those real solids, while spending corner geometry on keycaps.
  const g=Math.min(w,h)<.004?surfaceUV(new T.BoxGeometry(w,h,d)):roundBox(w,h,d,r,bevel);
  add(target,g,key,x,y,z,rx,ry,rz);
 }
 function cylinder(target,key,x,y,z,r,h,rx=0,rz=0,n=10,r2=r){add(target,surfaceUV(new T.CylinderGeometry(r2,r,h,n,1)),key,x,y,z,rx,0,rz);}
 function rod(target,key,a,b,r=.0013,n=8,r2=r){
  const va=new T.Vector3(...a),vb=new T.Vector3(...b),v=vb.clone().sub(va),g=surfaceUV(new T.CylinderGeometry(r2,r,v.length(),n,1));
  g.applyQuaternion(new T.Quaternion().setFromUnitVectors(up,v.normalize()));const mid=va.add(vb).multiplyScalar(.5);add(target,g,key,mid.x,mid.y,mid.z);
 }
 function plane(target,key,x,y,z,w,h,rx=0,ry=0,rz=0,uv=[0,0,1,1]){
  const g=new T.PlaneGeometry(w,h),u=g.attributes.uv;
  for(let i=0;i<u.count;i++)u.setXY(i,uv[0]+u.getX(i)*(uv[2]-uv[0]),uv[1]+u.getY(i)*(uv[3]-uv[1]));
  add(target,g,key,x,y,z,rx,ry,rz);
 }
 function glyph(symbol,x,y,z,w=.0043,h=.0035){
  let row=-1,col=-1;for(let i=0;i<atlas.length;i++){const j=atlas[i].indexOf(symbol);if(j>=0){row=i;col=j;break;}}
  if(row<0)return;
  // Trim to the centre 80% of a cell, keeping the generated gutter off adjacent keys.
  const pad=.08,cols=6,rows=8,u0=(col+pad)/cols,u1=(col+1-pad)/cols,v0=1-(row+1-pad)/rows,v1=1-(row+pad)/rows;
  plane('pda',materials.keyLegends?'keyLegends':'keyboard',x,y,z,w,h,0,0,0,legendUVs[symbol] || [u0,v0,u1,v1]);
 }
 function key(symbol,x,y,w=.0059,h=.0064){
  const depth=.00225,z=.0120;
  bx('pda','pdaBlack',x,y,z,w,h,depth,.00105,.00032);
  glyph(symbol,x,y+.00008,z+depth/2+.00003,Math.min(w*.79,.0043),h*.58);
  keyRecord.push({symbol,x,y,width:w,height:h,frontZ:z+depth/2});
 }

 // A rounded skin with actual openings in the left mini-USB wall and right stylus
 // channel. The crown, shoulders and rear chamfer share one continuous outline.
 function shellOutline(w,h,r){
  const out=[],corners=[[w/2-r,-h/2+r,-Math.PI/2], [w/2-r,h/2-r,0],[-w/2+r,h/2-r,Math.PI/2],[-w/2+r,-h/2+r,Math.PI]];
  for(let c=0;c<4;c++){
   const [cx,cy,a]=corners[c];
   for(let j=0;j<=5;j++){const angle=a+j*Math.PI/10;out.push(new T.Vector2(cx+r*Math.cos(angle),cy+r*Math.sin(angle)));}
   if(c===0){out.push(new T.Vector2(w/2,-.038),new T.Vector2(w/2,.053));}
   if(c===2){out.push(new T.Vector2(-w/2,-.004),new T.Vector2(-w/2,-.012));}
  }return out;
 }
 function chassis(){
  const rings=[[-.0105,.073,.133,.0085],[-.009,.075,.135,.009],[-.0044,.075,.135,.009],[-.001,.075,.135,.009],[.001,.075,.135,.009],[.0044,.075,.135,.009],[.007,.075,.135,.009],[.0105,.073,.133,.0085]];
  const outlines=rings.map(r=>shellOutline(r[1],r[2],r[3])),n=outlines[0].length,pos=[],uv=[],ix=[];
  rings.forEach((r,j)=>outlines[j].forEach(p=>{pos.push(p.x,p.y,r[0]);uv.push(p.x/.075+.5,p.y/.135+.5);}));
  let omitted=0;
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<n;i++){
   const k=(i+1)%n,a=outlines[j][i],b=outlines[j][k];
   const left=a.x<-.03749&&b.x<-.03749,right=a.x>.03749&&b.x>.03749,yLo=Math.min(a.y,b.y),yHi=Math.max(a.y,b.y);
   const usb=left&&yLo>=-.012001&&yHi<=-.003999&&rings[j][0]>=-.004401&&rings[j+1][0]<=.004401;
   const stylus=right&&yLo>=-.038001&&yHi<=.053001&&rings[j][0]>=-.001001&&rings[j+1][0]<=.001001;
   if(usb||stylus){omitted+=2;continue;}
   const A=j*n+i,B=j*n+k,C=(j+1)*n+i,D=(j+1)*n+k;ix.push(A,B,C,B,D,C);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();surfaceUV(g);add('pda',g,'pdaBlack');
  for(const side of[0,1]){
   const points=outlines[side?rings.length-1:0],z=rings[side?rings.length-1:0][0],p=[],index=[];
   for(const v of points)p.push(v.x,v.y,z);
   for(const [a,b,c]of T.ShapeUtils.triangulateShape(points,[]))index.push(...(side?[a,b,c]:[a,c,b]));
   const cap=new T.BufferGeometry();cap.setAttribute('position',new T.Float32BufferAttribute(p,3));cap.setIndex(index);cap.computeVertexNormals();surfaceUV(cap);add('pda',cap,'pdaBlack');
  }
  slots.push({kind:'miniUSB',side:'left',opening:[.008,.0088],inset:.003,omittedTriangles:omitted},{kind:'empty-stylus-channel',side:'right',length:.091,inset:.0025});
 }
 chassis();
 // The two halves meet at a narrow, real raised mid-case joint rather than a painted line.
 bx('pda','dark',0,0,.0069,.07524,.13524,.00065,.0089,.00012);
 bx('pda','pdaBlack',0,.0015,.01065,.0705,.126,.0016,.008,.00025);

 // Earpiece crown: a recessed grille, twelve independent pinholes and a small status lens.
 bx('pda','steel',0,.0572,.01158,.031,.0042,.0008,.0015,.00016);
 for(let i=0;i<12;i++)cylinder('pda','dark',-.0121+i*.0022,.0572,.01205,.00034,.00020,Math.PI/2,0,6);
 cylinder('pda','dark',.0248,.0568,.0117,.0013,.0005,Math.PI/2,0,10);
 cylinder('pda','glass',.0248,.0568,.012,.0008,.00035,Math.PI/2,0,10);

 // Separate frame, display and thin clear cover. Display retains exact 3:4 UVs.
 bx('pda','dark',0,.018,.0119,.056,.068,.0017,.0031,.00025);
 bx('pda','steel',0,.018,.01245,.0505,.0659,.00075,.002,.00014);
 plane('pda','screen',0,.018,.01288,.048,.064);
 bx('pda','glass',0,.018,.01308,.0482,.0642,.00034,.0012,.00010);

 // Mechanical navigation cluster: separate call/menu/back/end keys and a protruding ball.
 bx('pda','dark',0,-.0233,.0115,.062,.0095,.001,.003,.0002);
 const navigation=[['phone',-.0247],['left',-.0121],['backspace',.0121],['phone',.0247]];
 for(const [symbol,x]of navigation){key(symbol,x,-.0233,.0102,.0071);}
 add('pda',surfaceUV(new T.TorusGeometry(.00485,.00060,5,24),.014),'steel',0,-.0233,.0130);
 cylinder('pda','dark',0,-.0233,.0129,.00435,.0025,Math.PI/2,0,18);
 add('pda',surfaceUV(new T.SphereGeometry(.00365,14,8),.014),'steel',0,-.0233,.0141);
 // Raised key islands; the three rows hold every one of the 26 QWERTY letters.
 bx('pda','dark',0,-.0452,.01135,.064,.038,.0012,.005,.00022);
 const rows=[['QWERTYUIOP',-.0340,.00655],['ASDFGHJKL',-.0421,.0068],['ZXCVBNM',-.0502,.00675]];
 for(const [letters,y,pitch]of rows)for(let i=0;i<letters.length;i++){
  const x=(i-(letters.length-1)/2)*pitch;key(letters[i],x,y+.00075*Math.pow(Math.abs(x)/.03,2));
 }
 key('shift',-.0292,-.0501,.0054,.0064);key('enter',.0292,-.0501,.0054,.0064);
 for(const [symbol,x,w]of[['*',-.0275,.0072],['@',-.0178,.0072],['space',0,.0225],['#',.0178,.0072],['backspace',.0275,.0072]])key(symbol,x,-.0590,w,.0061);
 // Spacebar gets a genuine lower edge seam and two mounting feet.
 bx('pda','dark',0,-.0622,.0118,.0228,.00055,.001,.00015,.00008);

 // Left-side mini USB socket walls are behind the missing shell region.
 bx('pda','dark',-.0344,-.008,0,.001,.008,.0088,.0002,.00012);
 for(const y of[-.0122,-.0038])bx('pda','dark',-.036,y,0,.0031,.0006,.0088,.0002,.00010);
 for(const z of[-.0046,.0046])bx('pda','dark',-.036,-.008,z,.0031,.008,.0006,.0002,.00010);
 // Mini-B trapezoid lip and recessed tongue, all visible from the side.
 for(const y of[-.0105,-.0055])bx('pda','steel',-.03685,y,0,.00042,.00048,.0066,.00015,.00007);
 for(const z of[-.0033,.0033])bx('pda','steel',-.03685,-.008,z,.00042,.0049,.00048,.00015,.00007,0,0,z<0?-.09:.09);
 bx('pda','dark',-.03645,-.008,0,.0005,.0021,.0056,.0002,.00008);
 for(let i=0;i<5;i++)bx('pda','steel',-.0368,-.0082,-.002+i*.001,.00024,.0006,.00045,.0001,.00005);
 // Side rocker and upper power switch grow directly out of the casing wall.
 bx('pda','dark',.038,.026,.0062,.0017,.014,.0037,.001,.00017);
 bx('pda','pdaBlack',.0384,.026,.0062,.0015,.0118,.0032,.0007,.00013);
 bx('pda','dark',.022,.06765,0,.010,.0015,.005,.0005,.00016);
 bx('pda','pdaBlack',.022,.06815,0,.0084,.0010,.0039,.0004,.00012);

 // Empty longitudinal stylus channel: side groove, blind interior and entry collar.
 bx('pda','dark',.0351,.0075,0,.001,.091,.002,.0002,.0001);
 for(const z of[-.0012,.0012])bx('pda','dark',.03625,.0075,z,.0025,.091,.0004,.00015,.00008);
 bx('pda','steel',.0369,.0541,0,.0006,.0016,.0036,.00025,.00010);
 cylinder('pda','dark',.033,.0643,-.0042,.0017,.0012,0,0,10);

 // Rear: curved battery hatch, a release notch, camera well, flash and slotted screws.
 bx('pda','dark',0,-.0085,-.01062,.0645,.109,.0011,.008,.0002);
 bx('pda','pdaBlack',0,-.0085,-.01102,.0625,.1065,.00065,.0074,.00013);
 bx('pda','dark',0,-.061,-.0115,.013,.0028,.0006,.001,.00013);
 for(let i=0;i<6;i++)bx('pda','dark',-.013+i*.0052,-.043,-.01145,.0028,.013,.0003,.001,.00007);
 bx('pda','dark',-.0157,.042,-.0114,.020,.014,.0014,.003,.0002);
 cylinder('pda','steel',-.017,.042,-.0122,.0050,.0016,Math.PI/2,0,16);
 cylinder('pda','dark',-.017,.042,-.0131,.0040,.0008,Math.PI/2,0,16);
 cylinder('pda','glass',-.017,.042,-.01355,.0028,.0003,Math.PI/2,0,16);
 bx('pda','steel',.014,.042,-.0117,.0066,.0047,.0009,.001,.00013);
 bx('pda','glass',.014,.042,-.01225,.0048,.0032,.0004,.0007,.00010);
 for(const x of[-.027,.027])for(const y of[-.054,.052]){
  cylinder('pda','dark',x,y,-.01115,.00145,.0005,Math.PI/2,0,10);
  cylinder('pda','steel',x,y,-.01151,.00105,.0003,Math.PI/2,0,10);
  bx('pda','dark',x,y,-.01170,.00145,.00028,.00016,.00010,.00004);
 }
 // Two low moulded pads share the camera's rear plane, supporting a flat lay.
 for(const x of[-.025,.025])bx('pda','pdaBlack',x,-.055,-.01265,.007,.003,.0021,.001,.0002);

 // A dislodged stylus lies beside the handset. Its low face follows the same
 // ground plane as the back of the telephone after the caller lays +Z upward.
 const sa=[.059,-.057,-.0121],sb=[.047,.043,-.0121],tip=[.046,.0508,-.0121];
 rod('pda','steel',sa,sb,.00125,10);
 rod('pda','pdaBlack',[.059,-.057,-.0121],[.0573,-.0428,-.0121],.00157,10);
 rod('pda','dark',sb,tip,.00120,10,.00020);
 rod('pda','steel',[.0596,-.054,-.01065],[.0580,-.040,-.01065],.00035,6);
 rod('pda','steel',[.0596,-.054,-.01065],[.0590,-.055,-.0115],.00035,6);

 // Charger is a separate Y-up ground object; every cord section is clamped above
 // the floor by its radius. The USB tail and two mains blades remain inspectable.
 bx('charger','pdaBlack',0,.0125,0,.055,.025,.035,.0045,.00085);
 bx('charger','dark',0,.013,0,.05535,.001,.0348,.00035,.00012);
 bx('charger','pdaBlack',0,.02535,0,.039,.0008,.024,.003,.00015);
 for(const z of[-.0068,.0068])bx('charger','steel',.0332,.012,z,.0122,.0065,.00165,.00030,.00015);
 // Recessed standard USB output on the opposite face, framed with metal.
 bx('charger','dark',0,.012,.0177,.0142,.0066,.0006,.001,.00012);
 for(const x of[-.0068,.0068])bx('charger','steel',x,.012,.0181,.00065,.0058,.0007,.0002,.00010);
 for(const y of[.0092,.0148])bx('charger','steel',0,y,.0181,.0135,.00065,.0007,.0002,.00010);
 bx('charger','pdaBlack',0,.0117,.0180,.0104,.002,.0006,.0003,.00012);
 for(let i=0;i<4;i++)bx('charger','steel',-.0039+i*.0026,.0122,.01845,.00085,.0006,.00015,.00010,.00004);
 cylinder('charger','dark',-.0281,.0065,-.006,.0027,.007,0,Math.PI/2,10);
 const cablePoints=[[-.0299,.0065,-.006],[-.038,.0020,-.008],[-.061,.0017,-.029],[-.104,.0017,-.025],[-.112,.0017,.020],[-.076,.0017,.045],[-.029,.0017,.044],[.017,.0017,.028],[.045,.0025,.047]];
 const source=new T.CatmullRomCurve3(cablePoints.map(p=>new T.Vector3(...p))),curve=new T.Curve(),radius=.00145;
 curve.getPoint=(t,target=new T.Vector3())=>{source.getPoint(t,target);target.y=Math.max(radius+.0002,target.y);return target;};
 add('charger',surfaceUV(new T.TubeGeometry(curve,40,radius,7,false),.035),'rubber');
 let minimumCableY=Infinity;for(let i=0;i<=160;i++)minimumCableY=Math.min(minimumCableY,curve.getPoint(i/160).y-radius);
 cables.push({radius,points:cablePoints,minimumY:minimumCableY,grounded:true});
 bx('charger','pdaBlack',.045,.0046,.053,.010,.0066,.015,.0016,.00035);
 bx('charger','steel',.045,.0046,.0640,.0072,.0036,.0066,.00055,.00018);
 bx('charger','dark',.045,.0046,.0674,.0057,.0022,.0004,.00025,.00008);
 for(let i=0;i<5;i++)bx('charger','steel',.0428+i*.0011,.0048,.06755,.00045,.00065,.00020,.00008,.00003);
 for(let i=0;i<4;i++)bx('charger','dark',.045,.0046,.0465+i*.0012,.0102,.0068,.00045,.001,.00010);

 const stats={triangles:0,drawCalls:0,parts:0,groups:{},bodySize:[.075,.135,.021],displaySize:[.048,.064],atlasGrid:[6,8]};
 function finish(target,root){
  let triangles=0,draws=0;
  for(const [key,list]of banks[target]){
   const g=mergeGeometries(list,false);if(!g)throw new Error('PDA merge failed: '+target+'/'+key);
   g.computeBoundingBox();g.computeBoundingSphere();
   const mesh=new T.Mesh(g,materials[key]);mesh.name=(target==='pda'?'PDA / ':'Charger / ')+key;mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);
   const count=g.attributes.position.count/3;triangles+=count;draws++;list.forEach(p=>p.dispose());
  }
  stats.groups[target]={triangles,drawCalls:draws,parts:partCounts[target]};stats.triangles+=triangles;stats.drawCalls+=draws;stats.parts+=partCounts[target];
 }
 finish('pda',object);finish('charger',charger);
 object.userData.pdaRelic={frontAxis:'+Z',chassisThickness:.021,layRotationX:-Math.PI/2,minimumBackZ:-.0137,displayAspect:3/4};
 craft.push({kind:'PDA',period:2009,chassis:[.075,.135,.021],display:[.048,.064],frontAxis:'+Z',keyboardLetters:26,physicalKeys:keyRecord.length,keys:keyRecord,slots,trackballRadius:.00365,batteryHatch:true,rearCamera:true,dislodgedStylus:{length:.1086,minimumZ:-.01367}});
 craft.push({kind:'charger',dimensions:[.055,.025,.035],axes:'Y-up',minimumY:0,usbOutput:true,miniUSBPlug:true,mainsBlades:2,cables});
 if(stats.triangles>9000||stats.drawCalls>10)throw new Error('PDA budget exceeded: '+JSON.stringify(stats));
 return {object,charger,craft,stats};
}
