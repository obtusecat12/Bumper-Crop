// Fixed authored furnishing district. These anomalies are intentional; all other rooms are untouched.
export const KANE_REGION={id:'kane92',type:'classic',x0:146,x1:180,z0:-18,z1:16};
export const KANE_LANDMARKS=[{name:'K 版陈设 · 家具山',x:163.45,z:9.25,yaw:.194,pitch:-.068},{name:'K 版陈设 · 音箱与蓝椅',x:154.8,z:-5.3,yaw:.305,pitch:-.083},{name:'K 版陈设 · 平行柜列',x:161.8,z:-4.5,yaw:-.675,pitch:-.063}];
export const KANE_WALLS=[
 {x:146,z:-1,w:.18,d:34},{x:180,z:-1,w:.18,d:34},{x:155,z:-18,w:18,d:.18},{x:173.5,z:-18,w:13,d:.18},
 {x:151,z:16,w:10,d:.18},{x:171.5,z:16,w:17,d:.18},
 {x:150,z:-2.5,w:8,d:.18},{x:157.6,z:-2.5,w:2.8,d:.18},{x:165.6,z:-2.5,w:9.8,d:.18},{x:176.5,z:-2.5,w:7,d:.18},
 {x:160,z:-11.5,w:.18,d:13},{x:174.8,z:5.8,w:.18,d:8.6},
 {x:169,z:1.8,w:4.0,d:.18}
].map((p,i)=>({...p,h:2.72,y:1.36,mat:i<6?0:2,id:'kane-wall-'+i}));
const dims={kCabinet:[1.16,1.12,.80],kWalnutLow:[1.16,1.12,.80],kSupportBoard:[2.40,.046,.85],kMahoganyTall:[.9,1.88,.5],kEbonyTall:[.9,1.88,.5],kBookcase:[.78,1.60,.34],kTallCabinet:[.9,1.88,.5],kBlueChair:[.50,.86,.54],kWoodChair:[.50,.98,.54],kSofa:[1.74,.94,.94],kArmchair:[.96,.94,.94],kSpeaker:[.44,.73,.38],kSpeakerStand:[.73,1.86,.75],kDesk:[1.05,.79,.54],kConsole:[.70,.15,.35],kCRT:[.64,.54,.56],kTorchiere:[.43,1.91,.43],kSideTable:[.66,.61,.50],kBooks:[.50,.17,.36]};
const things=[];
function put(kind,x,z,y=0,rotation=0,pitch=0,roll=0,scale=[1,1,1],note=''){const[w,h,d]=dims[kind],c=Math.cos(rotation),s=Math.sin(rotation),cp=Math.cos(pitch),sp=Math.sin(pitch),cr=Math.cos(roll),sr=Math.sin(roll);let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity,minY=Infinity,maxY=-Infinity;for(const a of[-w/2,w/2])for(const b of[0,h])for(const e of[-d/2,d/2]){const u=a*scale[0],v=b*scale[1],t=e*scale[2],rx=cr*u-sr*v,ry=sr*u+cr*v,py=cp*ry-sp*t,pz=sp*ry+cp*t,px=c*rx+s*pz,qz=-s*rx+c*pz;minX=Math.min(minX,px);maxX=Math.max(maxX,px);minY=Math.min(minY,py+y);maxY=Math.max(maxY,py+y);minZ=Math.min(minZ,qz);maxZ=Math.max(maxZ,qz);}things.push({kind,x,z,y,rotation,pitch,roll,scale,w,d,note,collider:maxY>.24&&minY<1.72?{x:x+(minX+maxX)/2,z:z+(minZ+maxZ)/2,w:maxX-minX,d:maxZ-minZ}:null,mapFootprint:{x:x+(minX+maxX)/2,z:z+(minZ+maxZ)/2,w:maxX-minX,d:maxZ-minZ}});}
// Stored furniture has actual load paths: sofa feet -> board -> two equal-height cabinets.
put('kCabinet',161.72,4.20);put('kWalnutLow',162.90,4.20);
put('kSupportBoard',162.31,4.20,1.12);
put('kSofa',162.31,4.20,1.166,0);
put('kBookcase',163.80,3.45,0,-.065);
put('kSideTable',160.54,4.12,0,.06);put('kCRT',160.54,4.12,.61,.06);
put('kBooks',162.10,3.70,0,.15);
put('kTorchiere',160.88,3.35,0);
put('kArmchair',164.16,5.14,0,-.24);
// A chair lies on its side: both leg ends and a back stile meet the carpet.
put('kWoodChair',160.25,5.45,0,-.24);
put('kWoodChair',163.50,5.88,.24,-.24,0,Math.PI/2);
// Loose chair trail stays grounded; a pair are carefully nested seat to seat in the recess.
put('kWoodChair',156.6,8.6,0,.26);put('kWoodChair',156.2,5.3,0,-.17);put('kWoodChair',156.8,2.1,0,.38);
put('kWoodChair',151.3,1.4,0,-.18);put('kWoodChair',152.02,1.40,0,.10);
put('kWoodChair',151.3,1.40,.990,Math.PI-.18,0,Math.PI);
// Series-inspired speaker gallery and blue school chairs. All circulation is outside the chair ring.
for(const[x,z,rot]of[[147.6,-13.8,.25],[150.0,-16.7,0],[157.5,-15.9,-.18],[158.5,-10.7,-Math.PI/2],[147.2,-8.8,Math.PI/2]])put('kSpeakerStand',x,z,0,rot);
put('kSpeaker',155.6,-16.9);put('kSpeaker',155.6,-16.9,.73,0);put('kSpeaker',156.2,-16.85,0,.12);
for(let i=0;i<7;i++){const a=i/7*Math.PI*2;put('kBlueChair',152.9+Math.sin(a)*2.02,-11.7+Math.cos(a)*2.02,0,a+Math.PI);}
put('kDesk',147.6,-15.6,0,Math.PI/2);put('kConsole',147.6,-15.6,.79,Math.PI/2);put('kBooks',147.7,-15.1,.79,Math.PI/2);
// Parallel duplicates are the user's requested extrapolation; terminal copies penetrate a wall.
for(let row=0;row<3;row++)for(let i=0;i<5;i++)put(['kMahoganyTall','kTallCabinet','kEbonyTall'][row],164.5+row*3.5,-14.8+i*1.95,0,-Math.PI/2,0,0,[1,1,1],row===2&&i===4?'terminal duplicate intersects partition':'parallel duplicate');
put('kTallCabinet',174.77,-5.55,0,Math.PI/2);put('kTallCabinet',175.15,-5.55,0,Math.PI/2);
// Explicitly abnormal scale/embedding. They keep the generator and all other furniture intact.
put('kBlueChair',170.7,8.9,0,-.35,0,0,[2.4,2.25,.72],'oversized width/height, compressed depth');
put('kBlueChair',168.9,7.1,0,.4,0,0,[.50,.50,.50],'miniature');put('kBlueChair',149.2,9.7,-.29,.2,0,0,[1,1,1],'floor-clipped like Pitfalls');put('kBlueChair',150.2,9.8,0,-.25);
put('kSofa',175.13,6.9,0,-Math.PI/2,0,0,[1,1,1],'wall-embedded');put('kSideTable',175.0,3.2,0,-Math.PI/2,0,0,[1,1,1],'wall-embedded');
put('kWoodChair',176.9,10.6,0,Math.PI*.75,0,0,[.9,1.9,.9],'stretched back and legs');put('kDesk',177.5,12.7,0,0,0,0,[1.95,.52,.75],'wide low desk');
for(let i=0;i<9;i++){const a=i/9*Math.PI*2;put('kBooks',153.1+Math.cos(a)*1.05,-6.15+Math.sin(a)*1.05,0,a,0,0,[.52,.48,.52]);}
export const KANE_THINGS=things;
export const inKane=(x,z,p=0)=>x>KANE_REGION.x0-p&&x<KANE_REGION.x1+p&&z>KANE_REGION.z0-p&&z<KANE_REGION.z1+p;
