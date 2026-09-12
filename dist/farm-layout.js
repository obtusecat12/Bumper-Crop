// One fixed photographic landmark. BigInt guards keep the infinite world exact.
export const FARM={x:160,z:96,y:.40,minX:-138,maxX:480,minZ:-62,maxZ:360};
export const FARM_PLACEMENTS={barn:{x:0,z:0,angle:0,scaleX:.86,scaleZ:.86},annex:{x:-17,z:28,angle:-Math.PI/2},cottage:{x:-29.484,z:-4.395,angle:0,scaleX:22/24.4,scaleY:1.1778},shed:{x:20.867,z:-19.860,angle:Math.PI/2,scaleX:.725,scaleZ:.725}};
export const FARM_TREES=[
 {kind:'broad',x:-1.594,z:24.873,height:11.637,crownWidth:11.8,seed:3101},
 {kind:'broad',x:-50.332,z:73.082,height:12,crownWidth:9,seed:3215},
 {kind:'orchard',x:-41,z:3,height:5.992,crownWidth:16,seed:3172},
 {kind:'burgundy',x:-30.6,z:2.3,height:9.032,crownWidth:11,seed:3103},
 {kind:'burgundy',x:-15,z:0,height:9.356,crownWidth:10,seed:3194},
 {kind:'weeping',x:-15,z:7,height:11.1,crownWidth:5.8,seed:3155},
 {kind:'broad',x:9,z:7,height:8.2,crownWidth:7.9,seed:3166},
 {kind:'broad',x:18.867,z:-12.86,height:10.8,crownWidth:11,seed:3187},
 ...[[-2.214,-44.198,10.557,3.4],[.194,-45.067,6.160,2.6],[2.412,-45.591,5.516,2.4],[-5.107,-42.493,6.187,2.5]].map(([x,z,height,crownWidth],i)=>({kind:'evergreen',x,z,height,crownWidth,seed:3200+i})),
 {kind:'evergreen',x:14.866,z:-148.192,height:3,crownWidth:1.5,seed:3261},
 {kind:'evergreen',x:18.206,z:-146.616,height:4,crownWidth:2,seed:3262}
];
// Source-model dimensions are kept in one table so clearing and collision agree.
export const FARM_FOOTPRINTS=Object.entries({barn:[[0,0,7,11.5]],annex:[[0,0,4,6.7],[4.97,-4.2,1.05,2.45]],cottage:[[0,0,12.2,3.8],[0,4.75,4,1.05]],shed:[[0,0,4.5,8]]}).flatMap(([name,rects])=>{
 const p=FARM_PLACEMENTS[name],sx=p.scaleX||1,sz=p.scaleZ||1,c=Math.cos(p.angle),s=Math.sin(p.angle);
 return rects.map(([x,z,hx,hz])=>({x:p.x+c*x*sx+s*z*sz,z:p.z-s*x*sx+c*z*sz,hx:hx*sx,hz:hz*sz,angle:p.angle}));
});
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
export function farmContext(cx,cz){
 if(cx<0n||cx>9n||cz< -2n||cz>7n)return null;
 return {x:Number(cx)*64-FARM.x,z:Number(cz)*64-FARM.z};
}
// Keep the authored farm grounds and the two photo sightlines clear. The broad
// FARM bounds identify eligible tiles; they must not erase whole nearby fields.
const FARM_MASK_GROUNDS=[-72,55,-64,104],FARM_MASK_BACKGROUND=[-10,42,-170,-45];
const FARM_MASK_FEATHER=18,FARM_SIGHTLINE_PADDING=24;
const farmRectangleDepth=(x,z,b)=>Math.min(x-b[0],b[1]-x,z-b[2],b[3]-z);
export function farmMask(x,z){
 const original=smooth(0,FARM_MASK_FEATHER,Math.max(Math.min(x-FARM.minX,FARM.maxX-x,z-FARM.minZ,FARM.maxZ-z),farmRectangleDepth(x,z,FARM_MASK_BACKGROUND)));
 if(original===0)return 0;
 const grounds=farmRectangleDepth(x,z,FARM_MASK_GROUNDS);
 const background=farmRectangleDepth(x,z,FARM_MASK_BACKGROUND);
 let protectedDepth=Math.max(grounds,background);
 if(protectedDepth>=FARM_MASK_FEATHER)return original;
 for(const view of FARM_SIGHTLINES){
  const px=x-view.x,pz=z-view.z,along=px*view.dx+pz*view.dz,across=Math.abs(px*view.dz-pz*view.dx);
  // The reference camera uses a 3:2 source frame; retain a 24 m envelope so
  // mature crowns just outside either frame cannot enter the photographed view.
  const halfWidth=Math.max(0,along)*view.spread;
  const sightline=Math.min(along+FARM_MASK_FEATHER,view.range+FARM_SIGHTLINE_PADDING-along,halfWidth+FARM_SIGHTLINE_PADDING-across);
  protectedDepth=Math.max(protectedDepth,sightline);
 }
 // Intersect the old mask: never suppress existing content outside it.
 return Math.min(original,smooth(0,FARM_MASK_FEATHER,protectedDepth));
}
export function farmRoadWeight(x,z,f){return f?.farm?1-farmMask(x+f.farm.x,z+f.farm.z):1}
export function farmFootprintDistance(x,z,f){
 if(!f?.farm)return 1e4;x+=f.farm.x;z+=f.farm.z;let result=1e4;
 for(const p of FARM_FOOTPRINTS){const dx=x-p.x,dz=z-p.z,c=Math.cos(p.angle),s=Math.sin(p.angle),a=Math.abs(c*dx-s*dz)-p.hx,b=Math.abs(s*dx+c*dz)-p.hz;result=Math.min(result,Math.hypot(Math.max(a,0),Math.max(b,0))+Math.min(Math.max(a,b),0))}return result;
}
export function farmGroundHeight(x,z,f,y){const d=farmFootprintDistance(x,z,f);return y+(FARM.y-.04-y)*(1-smooth(.1,3.3,d))}
export function farmClearing(x,z,f){
 if(!f?.farm)return false;
 if(farmFootprintDistance(x,z,f)<2.6)return true;
 const px=x+f.farm.x,pz=z+f.farm.z;
 return FARM_TREES.some(t=>(px-t.x)**2+(pz-t.z)**2<(.60+t.crownWidth*.08)**2);
}
export const FARM_VIEWS={
 'farm-a':{label:'Kephart 农场 · 照片一',x:-120,z:142,eye:2.05,focusX:-25,focusZ:4,focusY:4.2,fov:16.1,range:365},
 'farm-b':{label:'Kephart 农场 · 照片二',x:362,z:248,eye:2,focusX:-3,focusZ:0,focusY:4,fov:7.3,range:620}
};
export function farmViewTarget(name,field,seed){
 const v=FARM_VIEWS[name];if(!v)return null;
 const wx=FARM.x+v.x,wz=FARM.z+v.z,cx=BigInt(Math.floor(wx/64)),cz=BigInt(Math.floor(wz/64));
 return {...v,kind:'photo',cx,cz,x:wx-Number(cx)*64,z:wz-Number(cz)*64,focusX:FARM.x+v.focusX-Number(cx)*64,focusZ:FARM.z+v.focusZ-Number(cz)*64,field:field(cx,cz,seed)};
}


export function farmExcludesLake(lake){
 if(lake.lakeOwnerX< -4n||lake.lakeOwnerX>14n||lake.lakeOwnerZ< -4n||lake.lakeOwnerZ>12n)return false;
 const x=Number(lake.lakeOwnerX)*64+lake.lakeLocalX-FARM.x,z=Number(lake.lakeOwnerZ)*64+lake.lakeLocalZ-FARM.z,b=lake.bounds;
 return x+b[1]>FARM.minX&&x+b[0]<FARM.maxX&&z+b[3]>FARM.minZ&&z+b[2]<FARM.maxZ;
}

// Precompute the two directions once; farmMask is sampled for every wheat stem.
const FARM_SIGHTLINES=Object.values(FARM_VIEWS).map(view=>{
 const dx=view.focusX-view.x,dz=view.focusZ-view.z,len=Math.hypot(dx,dz);
 return {x:view.x,z:view.z,dx:dx/len,dz:dz/len,spread:Math.tan(view.fov*Math.PI/360)*1.5,range:view.range};
});

// Ground shading and procedural generation share every bound and camera value.
// Emit scalar GLSL once so the per-fragment path never needs an array or loop.
const farmGLSLNumber=n=>Number.isInteger(n)?n+'.0':String(n);
const farmRectangleGLSL=b=>`min(min(q.x-(${farmGLSLNumber(b[0])}),${farmGLSLNumber(b[1])}-q.x),min(q.y-(${farmGLSLNumber(b[2])}),${farmGLSLNumber(b[3])}-q.y))`;
export const FARM_MASK_GLSL=`float farmMaskAt(vec2 q){
 float background=${farmRectangleGLSL(FARM_MASK_BACKGROUND)};
 float original=smoothstep(0.0,${farmGLSLNumber(FARM_MASK_FEATHER)},max(${farmRectangleGLSL([FARM.minX,FARM.maxX,FARM.minZ,FARM.maxZ])},background));
 if(original==0.0)return 0.0;
 float protectedDepth=max(${farmRectangleGLSL(FARM_MASK_GROUNDS)},background);
 ${FARM_SIGHTLINES.map((view,i)=>{
  const n=farmGLSLNumber;
  return `float px${i}=q.x-(${n(view.x)}),pz${i}=q.y-(${n(view.z)});
 float along${i}=px${i}*${n(view.dx)}+pz${i}*${n(view.dz)};
 float across${i}=abs(px${i}*${n(view.dz)}-pz${i}*${n(view.dx)});
 protectedDepth=max(protectedDepth,min(min(along${i}+${n(FARM_MASK_FEATHER)},${n(view.range+FARM_SIGHTLINE_PADDING)}-along${i}),max(0.0,along${i})*${n(view.spread)}+${n(FARM_SIGHTLINE_PADDING)}-across${i}));`;
 }).join('\n ')}
 return min(original,smoothstep(0.0,${farmGLSLNumber(FARM_MASK_FEATHER)},protectedDepth));
}`;
