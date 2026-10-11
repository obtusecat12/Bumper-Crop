// Each linked material stays far below 16 samplers; circuits use uniform vectors.
import {L0_FIELD_GLSL} from './level0-lightfield.js?v=104';
export function createL0Materials(T,renderer,fieldUniforms={}){
 const pending=[],loader=new T.TextureLoader(),cache=new Map();
 const uniforms={time:{value:0},darkness:{value:0},brightness:{value:1},cutCount:{value:0},cuts:{value:Array.from({length:12},()=>new T.Vector4(0,0,0,0))},
  // V103 light-field response (global tuning; per-fragment values come from the field texture).
  l0Direct:{value:1.12},l0Bounce:{value:.22},l0Floor:{value:.06},l0HemiDark:{value:.26},l0LightColor:{value:new T.Color(1,.98,.84)},...fieldUniforms};
 const tex=(file,color=false,old=false)=>{const url='./assets/'+((file.startsWith('manila/')||file.startsWith('level0-k92/')||file.startsWith('level0-furniture93/')||file.startsWith('level0-v94/')||file.startsWith('level0-v95/')||file.startsWith('level0-v117/'))?'':old?'level0/':'level0-v2/')+file;if(cache.has(url))return cache.get(url);let resolve,reject;pending.push(new Promise((a,b)=>{resolve=a;reject=b;}));const t=loader.load(url,resolve,undefined,reject);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());cache.set(url,t);return t;};
 const plain=(color,roughness=.9)=>new T.MeshStandardMaterial({color,roughness});
 const standard=(name,color=0xffffff,scale=null,roughness=.94)=>{const m=new T.MeshStandardMaterial({map:tex(name+'.webp',true),normalMap:tex(name+'-normal.webp'),normalScale:new T.Vector2(.25,.25),color,roughness});m.userData.worldScale=scale;return m;};
 const wall=[standard('wallpaper-chevron',0xf8f6e9,1.02),standard('wallpaper-dots',0xf7f4e6,1.12),plain(0xd3cfb8)];wall[0].userData.albedoRemap='wall';wall[1].userData.albedoRemap='wall';
 // V117 spawn replica papers (art-l0spawn/): 3 = arrow-chevron (8 columns per 1.03 m), 4 = pin-dot (40 per 1.9 m)
 wall.push(standard('level0-v117/spawn-chevron',0xffffff,1.03,.9),standard('level0-v117/spawn-dots',0xffffff,1.9,.9));
 const spawnCarpet=standard('level0-v117/spawn-carpet',0xffffff,1.6,1);spawnCarpet.normalScale.set(.35,.35);
 const carpet=standard('level0-v94/berber',0xffffff,.30,.99);carpet.normalScale.set(.22,.22);carpet.userData.albedoRemap='berber94';
 const ceiling=standard('level0-v94/ceiling',0xfff6da,.72,.97);ceiling.normalScale.set(.17,.17);ceiling.emissive=new T.Color(0xd2c58c);ceiling.emissiveIntensity=.035;
 const insulation=new T.MeshStandardMaterial({map:tex('insulation-fiberglass-albedo.jpg',true,true),normalMap:tex('insulation-fiberglass-albedo-normal.png',false,true),normalScale:new T.Vector2(.6,.6),color:0xe3dabe,roughness:1,side:T.DoubleSide});insulation.userData.worldScale=.45;insulation.userData.albedoRemap='insulation';
 const mats={wall,spawnCarpet,carpet,ceiling,insulation,pink:insulation.clone(),wood:standard('furniture-oak',0xbdbbad,null),walnut:standard('furniture-walnut',0xffffff,null),metal:standard('duct-galvanized',0xd3d2c9,null,.78),grid:plain(0xc5c3b6),dark:plain(0x1c1c19),copper:plain(0x965830,.6),orange:plain(0xb96727,.7),pale:plain(0xc9c7b2),trim:plain(0xb8af88),red:standard('wallpaper-chevron',0x813f35,1.02),redFloor:standard('carpet-reference',0x9a6558,2,.98),void:new T.MeshBasicMaterial({color:0x090908}),fabric:plain(0xbfbba3),socketIvory:plain(0xc3b996,.74),socketBrown:plain(0x4d3323,.63),socketWhite:plain(0xd7d8cf,.68),steel:plain(0x828984,.68),blackPlastic:plain(0x292e2a,.76),screen:new T.MeshStandardMaterial({color:0x18272b,roughness:.30,metalness:.25}),bin:standard('bucket-burgundy',0xffffff,null,.82),pail:standard('bucket-pail',0xffffff,null,.68)};
 // V104 recessed troffer: opal diffuser with two tube bands, aluminium flange, lit reflector well,
 // and an additive halo on the surrounding tiles (also reads as soft bloom from far away).
 const canvasTex=(w,h,fn)=>{const c=typeof document!=='undefined'?document.createElement('canvas'):new OffscreenCanvas(w,h);c.width=w;c.height=h;const g=c.getContext('2d'),img=g.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const [r,gg,b,a]=fn((x+.5)/w,(y+.5)/h),i=(y*w+x)*4;img.data[i]=r;img.data[i+1]=gg;img.data[i+2]=b;img.data[i+3]=a;}g.putImageData(img,0,0);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;return t;};
 const diffuserTex=canvasTex(128,48,(u,v)=>{const band=Math.exp(-(((v-.31)/.105)**2))+Math.exp(-(((v-.69)/.105)**2));const edge=Math.min(1,Math.min(u,1-u)/.035)*Math.min(1,Math.min(v,1-v)/.09);const end=.9+.1*Math.min(1,Math.min(u,1-u)/.12);const k=(.80+.20*band)*end*(.72+.28*edge);return[Math.round(255*k),Math.round(251*k),Math.round(236*k),255];});
 const glowTex=canvasTex(128,80,(u,v)=>{const x=Math.abs(u-.5)*3.2,z=Math.abs(v-.5)*2.0,dx=Math.max(0,x-.53),dz=Math.max(0,z-.23),d=Math.hypot(dx,dz);const g=Math.exp(-d/.16)*.75+Math.exp(-d/.55)*.25;const fall=Math.min(1,Math.min(Math.min(u,1-u)/.08,Math.min(v,1-v)/.1));const k=Math.round(255*g*fall);return[k,k,k,255];});
 mats.lamp=new T.MeshBasicMaterial({map:diffuserTex,color:0xffffff,toneMapped:false});
 mats.lampSide=new T.MeshBasicMaterial({color:0xd8d3bd,toneMapped:false});
 mats.lampOff=new T.MeshStandardMaterial({map:diffuserTex,color:0x8e8c80,roughness:.55});
 mats.lampFrame=new T.MeshStandardMaterial({color:0xd6d4ca,roughness:.42,metalness:.35});
 mats.lampGlow=new T.MeshBasicMaterial({map:glowTex,color:0xfff0c8,transparent:true,opacity:.42,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false,fog:false});
 mats.columnWall=standard('wallpaper-chevron',0xffffed,.74);mats.columnWall.userData.albedoRemap='wall';
 mats.pink.color.set(0xffffff);mats.pink.userData.albedoRemap="pink";mats.pale.normalMap=wall[0].normalMap;mats.pale.normalScale=new T.Vector2(.05,.05);mats.metal.metalness=.20;
 mats.panels=Array.from({length:10},(_,i)=>{const m=standard('panel-'+String(i+1).padStart(2,'0'));m.normalScale.set(.36,.36);return m;});
 mats.outlets=Array.from({length:5},(_,i)=>new T.MeshStandardMaterial({map:tex('outlet-'+String(i+1).padStart(2,'0')+'.webp',true),roughness:.83}));
 mats.enamel=new T.MeshStandardMaterial({map:tex('manila/breaker-enamel.webp',true),normalMap:tex('manila/breaker-enamel-normal.webp'),roughnessMap:tex('manila/breaker-enamel-roughness.webp'),normalScale:new T.Vector2(.08,.08),roughness:1});
 mats.breaker=new T.MeshStandardMaterial({map:tex('breaker-panel.webp',true),roughness:.78});
 mats.mold=new T.MeshStandardMaterial({map:tex('mold-patch.webp',true),transparent:true,alphaTest:.025,depthWrite:false,roughness:1,polygonOffset:true,polygonOffsetFactor:-2});

 const kSurface=(file,rough=.88)=>{const m=standard('level0-k92/'+file,0xffffff,null,rough);m.roughnessMap=tex('level0-k92/'+file+'-roughness.webp');m.normalScale.set(.12,.12);return m;};
 mats.kBlue=kSurface('chair-plastic',.68);mats.kGrille=kSurface('speaker-cloth',1);
 mats.kSteel=new T.MeshStandardMaterial({color:0x9ba099,metalness:.75,roughness:.33});mats.kSpeakerCase=plain(0x202321,.86);mats.kCRTCase=plain(0x364456,.7);mats.kBookRed=plain(0x75483e);mats.kBookGreen=plain(0x646a50);mats.kBookBlue=plain(0x566570);mats.blueKnob=plain(0x688fb0);mats.ivory=plain(0xcdc7b8);mats.paper=plain(0xcac4ad);

 // Generated furniture finishes: matching micro-normal and independent roughness. Tuft AO is vertex color.
 const furnitureFinish=(file,options={})=>new T.MeshPhysicalMaterial({map:tex('level0-furniture93/'+file+'.webp',true),normalMap:tex('level0-furniture93/'+file+'-normal.webp'),roughnessMap:tex('level0-furniture93/'+file+'-roughness.webp'),normalScale:new T.Vector2(.40,.40),roughness:1,vertexColors:true,...options});
 mats.fMahogany=furnitureFinish('mahogany',{clearcoat:.17,clearcoatRoughness:.39});
 mats.fWalnut=furnitureFinish('walnut',{clearcoat:.12,clearcoatRoughness:.45});
 mats.fEbony=furnitureFinish('ebony',{clearcoat:.19,clearcoatRoughness:.37});
 mats.fCarve=furnitureFinish('carved');mats.fCarve.normalScale.set(.85,.85);
 mats.fBrass=furnitureFinish('brass',{metalness:.72});
 mats.fOxblood=furnitureFinish('oxblood',{color:new T.Color().setRGB(1.48,1.42,1.38),clearcoat:.20,clearcoatRoughness:.42});
 mats.fTobacco=furnitureFinish('tobacco',{clearcoat:.15,clearcoatRoughness:.46});
 mats.fDamask=furnitureFinish('damask',{sheen:.55,sheenRoughness:.85,sheenColor:new T.Color(0xb0a37c)});
 mats.fLeatherEdge=furnitureFinish('oxblood',{color:0x927468,clearcoat:.14});
 mats.fShadow=plain(0x1c1814,.94);mats.fShadow.vertexColors=true;
 const finish94=(file,roughness=.9)=>{const m=standard('level0-v94/'+file,0xffffff,null,roughness);m.vertexColors=true;m.normalScale.set(.35,.35);m.roughnessMap=tex('level0-v94/'+file+'-roughness.webp');return m;};
 mats.fLinen=finish94('linen');mats.fVelvet=finish94('velvet');mats.fVelvet.color.setRGB(1.18,1.18,1.19);mats.fVelvet.userData.albedoRemap='velvet94';mats.fMaple=finish94('maple',1);mats.fGreenSeat=finish94('green-seat',1);
 const finish95=(file,roughness=.8)=>{const m=standard('level0-v95/'+file,0xffffff,null,roughness);m.vertexColors=true;m.roughnessMap=tex('level0-v95/'+file+'-roughness.webp');m.normalScale.set(.25,.25);return m;};
 mats.insulation95=finish95('insulation',1);mats.insulation95.normalScale.set(.68,.68);mats.insulation95.userData.worldScale=.45;mats.insulation95.side=T.DoubleSide;
 mats.duct95=finish95('duct',1);mats.duct95.metalness=.42;mats.duct95.side=T.DoubleSide;
 mats.crtPlastic95=new T.MeshStandardMaterial({map:tex('level0-v95/plastic.webp',true),roughness:.66,vertexColors:true});
 mats.crtVent95=finish95('crt-vents');mats.crtScreen95=finish95('screen',1);mats.crtScreen95.metalness=.28;mats.crtScreen95.normalScale.set(.012,.012);
 mats.stripe95=finish95('stripe',1);mats.stripe95.normalScale.set(.40,.40);mats.burl95=finish95('burl',1);
 mats.mirror95=finish95('mirror',1);mats.mirror95.metalness=.45;mats.mirror95.normalScale.set(.01,.01);
 mats.coolerArt95=finish95('cooler',1);mats.coolerArt95.normalScale.set(.08,.08);mats.coolerWhite95=new T.MeshStandardMaterial({map:tex('level0-v95/cooler-white.webp',true),color:0xffffff,roughness:.72,vertexColors:true});
 mats.cabinetGlass95=new T.MeshPhysicalMaterial({color:0x9ca38b,roughness:.18,metalness:.16,transparent:true,opacity:.20,depthWrite:false,side:T.DoubleSide});
 mats.jug95=new T.MeshPhysicalMaterial({color:0x78979b,roughness:.23,metalness:.1,transparent:true,opacity:.56,depthWrite:false,side:T.DoubleSide});
 mats.cable95=plain(0x161715,.82);mats.greenLed95=plain(0x48633c,.4);mats.redTap95=plain(0x89483d,.7);mats.tubeGlass95=plain(0xc2c5b4,.28);
 mats.railWood=mats.fMahogany.clone();mats.railWood.userData.worldScale=.80;mats.spawnRail=mats.wood.clone();mats.spawnRail.color.set(0xe6cc94);wall[5]=mats.spawnRail;
 const cutGLSL='uniform int cutCount;uniform vec4 cuts[12];float circuitAt(vec3 p){float a=1.;for(int i=0;i<12;i++){if(i>=cutCount)break;float d=distance(p.xz,cuts[i].xy);a*=mix(1.,.038,(1.-smoothstep(cuts[i].z*.82,cuts[i].z,d))*cuts[i].w);}return a;}';
 function decorate(m){const scale=m.userData.worldScale,remap=m.userData.albedoRemap,basic=!!m.isMeshBasicMaterial,emis=!basic&&!!m.emissive&&m.emissive.getHex()!==0;const grade=remap==='velvet94'?'sampledDiffuseColor.rgb=mix(sampledDiffuseColor.rgb,vec3(.42,.425,.36),.78);':remap==='berber94'?'sampledDiffuseColor.rgb=mix(sampledDiffuseColor.rgb,vec3(.47,.37,.16),.66);':remap==='carpet'?'sampledDiffuseColor.rgb=mix(sampledDiffuseColor.rgb,vec3(.47,.43,.34),.68);':remap==='insulation'?'sampledDiffuseColor.rgb=mix(sampledDiffuseColor.rgb,vec3(.66,.47,.18),.62);':remap==='pink'?'sampledDiffuseColor.rgb=mix(sampledDiffuseColor.rgb,vec3(.63,.40,.39),.65);':remap==='ceiling'?'sampledDiffuseColor.rgb=mix(sampledDiffuseColor.rgb,vec3(.53,.52,.46),.55);':remap==='wall'?'sampledDiffuseColor.rgb=mix(sampledDiffuseColor.rgb,vec3(.80,.78,.46),.34);':'';m.onBeforeCompile=s=>{for(const k of['cutCount','cuts','l0FieldA','l0FieldB','l0FieldMix','l0FieldRect','l0Direct','l0Bounce','l0Floor','l0HemiDark','l0LightColor'])s.uniforms[k]=uniforms[k];s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 l0World;varying vec3 l0Normal;');s.vertexShader=s.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>\nvec4 l0p=vec4(transformed,1.);vec3 l0n=normal;\n#ifdef USE_INSTANCING\nl0p=instanceMatrix*l0p;l0n=mat3(instanceMatrix)*l0n;\n#endif\nl0World=(modelMatrix*l0p).xyz;l0Normal=normalize(mat3(modelMatrix)*l0n);`);s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 l0World;varying vec3 l0Normal;uniform float l0Direct,l0Bounce,l0Floor,l0HemiDark;uniform vec3 l0LightColor;float l0LitG=1.;\n'+cutGLSL+'\n'+L0_FIELD_GLSL);
  if(!scale&&grade)s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',T.ShaderChunk.map_fragment.replace('diffuseColor *= sampledDiffuseColor;',grade+'diffuseColor *= sampledDiffuseColor;'));
  if(scale){const uv=`(abs(l0Normal.y)>.5?l0World.xz:(abs(l0Normal.x)>.5?l0World.zy:l0World.xy))/${Number(scale).toFixed(4)}`;s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP\nvec4 sampledDiffuseColor=texture2D(map,${uv});${grade}diffuseColor*=sampledDiffuseColor;\n#endif`);s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#ifdef USE_NORMALMAP_TANGENTSPACE\nvec3 mapN=texture2D(normalMap,${uv}).xyz*2.-1.;mapN.xy*=normalScale;normal=normalize(tbn*mapN);\n#endif`);}
  // Ceiling glow follows the field: tiles glow around lit fixtures, not in dead rooms.
  if(emis)s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n{vec3 l0e=l0FieldAt(l0World.xz);totalEmissiveRadiance*=clamp(l0e.r*l0e.r*.30+l0e.r*.25+.05,0.,1.8);}');
  // Continuous fluorescent field: replaces per-player light pools. Sampled on the surface's own side
  // (offset along the normal) so each wall face takes the light of the room it faces.
  if(!basic)s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
 {vec4 l0f4=l0Field4(l0World.xz+l0Normal.xz*.42);vec3 l0f=l0f4.rgb;float l0Up=l0Normal.y;float l0DirW=l0Up>=0.?mix(.58,1.,l0Up):mix(.58,.10,-l0Up);
  float l0Wall=1.-abs(l0Up),l0H=clamp(l0World.y/2.72,0.,1.);
  // Walls: the fluorescent pool washes the upper wall and falls off softly toward the skirting.
  float l0WallGrad=mix(1.,.50+.72*l0H*l0H*(3.-2.*l0H),l0Wall);
  // Occupancy AO: contact shadow at wall feet / under furniture, darker inside corners, mild cove at the ceiling.
  float l0Ao=l0f4.a,l0Foot=1.-smoothstep(.0,.85,l0World.y),l0Cove=smoothstep(2.25,2.72,l0World.y);
  float l0Occ=1.-l0Ao*(l0Up>.5?.62*l0Foot:l0Wall*(.55*l0Foot+.22*l0Cove)+(l0Up<-.5?.18:0.));
  float l0Lum=(l0f.r*l0DirW*l0Direct*l0WallGrad+l0f.g*l0Bounce*mix(1.,.82+.3*l0H,l0Wall))*l0Occ;
  float l0Lit=clamp((l0f.r*.75+l0f.g*.55)/1.05,0.,1.);l0Lit=mix(l0Lit,1.,l0f.b);l0LitG=l0Lit;
  reflectedLight.indirectDiffuse*=mix(l0HemiDark,1.,l0Lit)*mix(1.,l0Occ,.85-.85*l0f.b);reflectedLight.directDiffuse*=mix(.12,1.,l0Lit)*mix(1.,l0Occ,.6-.6*l0f.b);reflectedLight.directSpecular*=mix(.12,1.,l0Lit);
  reflectedLight.indirectDiffuse+=BRDF_Lambert(diffuseColor.rgb)*l0LightColor*(l0Lum*(1.-l0f.b)+l0Floor*l0Occ);}`);
  // Dark grade: unlit surfaces drift toward the grey-beige of a switched-off office; fixtures fade with their circuit.
  const darkGrade=basic?'outgoingLight*=circuitAt(l0World);':`{float l0Dk=1.-smoothstep(.05,.55,l0LitG);vec3 l0Gray=vec3(dot(outgoingLight,vec3(.2126,.7152,.0722)));outgoingLight=mix(outgoingLight,mix(l0Gray*vec3(1.02,1.,.93),outgoingLight,${remap==='wall'?'.42':'.62'}),l0Dk*.8);}`;
  s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',darkGrade+'\n#include <opaque_fragment>');};m.customProgramCacheKey=()=>`l0-v4-field-${scale||'uv'}-${remap||'raw'}-${basic?'b':'l'}${emis?'e':''}`;}
 for(const m of Object.values(mats).flat())decorate(m);
 mats.outlets.forEach((m,i)=>mats["outlet"+i]=m);
 mats.ao=new T.ShaderMaterial({transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;void main(){float d=1.-max(abs(vUv.x-.5),abs(vUv.y-.5))*2.;gl_FragColor=vec4(.11,.095,.065,smoothstep(0.,.65,d)*.25);\n#include <colorspace_fragment>\n}',side:T.DoubleSide});
 uniforms.puddle={value:tex('carpet-puddle-albedo.jpg',true,true)};
 mats.water=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms,vertexShader:'varying vec2 vUv;varying vec3 vWorld;void main(){vUv=uv;vec4 wp=modelMatrix*instanceMatrix*vec4(position,1.);vWorld=wp.xyz;gl_Position=projectionMatrix*viewMatrix*wp;}',fragmentShader:`uniform float time;uniform float brightness;uniform sampler2D puddle;varying vec2 vUv;varying vec3 vWorld;${cutGLSL}
${L0_FIELD_GLSL}
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.54);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
 void main(){vec2 p=(vUv-.5)*2.;float edge=1.-smoothstep(.66,.96,length(p)+(noise(p*3.+vWorld.xz*.07)-.5)*.27);if(edge<.015)discard;vec3 eye=normalize(cameraPosition-vWorld);float f=pow(1.-max(eye.y,0.),4.);vec2 rp=vWorld.xz+(eye.xz/max(eye.y,.1))*2.72+sin(length(p)*82.-time*2.)*.002;vec2 grid=abs(mod(rp+1.8,3.6)-1.8);float reflection=(1.-smoothstep(.43,.56,grid.x))*(1.-smoothstep(.12,.23,grid.y));vec3 c=mix(vec3(.13,.11,.075),vec3(.40,.39,.31),f);c+=vec3(.78,.77,.66)*reflection*(.14+.5*f);vec3 wf=l0FieldAt(vWorld.xz);float wl=mix(clamp((wf.r*.75+wf.g*.55)/1.05,0.,1.),1.,wf.b);c=mix(texture2D(puddle,vUv).rgb*.44,c,.75)*brightness*mix(.10,1.,wl);gl_FragColor=vec4(c,edge*(.48+.27*f));\n#include <colorspace_fragment>\n}`});
 mats.pitWall=new T.ShaderMaterial({vertexShader:'varying float y;void main(){vec4 p=modelMatrix*instanceMatrix*vec4(position,1.);y=p.y;gl_Position=projectionMatrix*viewMatrix*p;}',fragmentShader:'varying float y;void main(){float a=exp(min(0.,y)*1.7);gl_FragColor=vec4(vec3(.11,.089,.043)*a,1.);\n#include <colorspace_fragment>\n}'});
 return{mats,uniforms,ready:Promise.all(pending)};
}
