// V132-bake L0: spawn-room lightmap overlay. tools/bake132_l0.mjs bakes soft troffer shadows + 2 bounces + AO into
// 12 cm/texel atlases (level0-bake132-data.js) as a modulation factor; each baked face gets a quad 4 mm proud of the
// surface that multiplies what is already rendered (2x multiply: byte 128 = neutral), so the live light field,
// flicker, flashlight and breakers keep working. Off with ?bake=0.
import {BAKE132_L0} from './level0-bake132-data.js?v=132';
export const BAKE132_L0_ON=(()=>{try{return new URLSearchParams(location.search).get('bake')!=='0';}catch{return true;}})();
export function createSpawnBake132(T){
 const group=new T.Group();group.name='V132 L0 spawn lightmap';if(!BAKE132_L0_ON){group.visible=false;return group;}
 const mats=BAKE132_L0.atlases.map(a=>{const b=atob(a.rgb),n=a.w*a.h,px=new Uint8Array(n*4);for(let i=0;i<n;i++){px[i*4]=b.charCodeAt(i*3);px[i*4+1]=b.charCodeAt(i*3+1);px[i*4+2]=b.charCodeAt(i*3+2);px[i*4+3]=255;}
  const t=new T.DataTexture(px,a.w,a.h,T.RGBAFormat);t.magFilter=T.LinearFilter;t.minFilter=T.LinearFilter;t.generateMipmaps=false;t.colorSpace=T.NoColorSpace;t.flipY=false;t.needsUpdate=true;
  return new T.ShaderMaterial({name:'L0 bake132 lightmap',uniforms:{map:{value:t}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'uniform sampler2D map;varying vec2 vUv;void main(){gl_FragColor=vec4(texture2D(map,vUv).rgb,1.);}',
   transparent:true,depthWrite:false,blending:T.CustomBlending,blendEquation:T.AddEquation,blendSrc:T.DstColorFactor,blendDst:T.SrcColorFactor,
   polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4,toneMapped:false,fog:false});});
 const per=mats.map(()=>({p:[],u:[]}));
 for(const q of BAKE132_L0.quads){const P=per[q.t],c=(s,t)=>[0,1,2].map(k=>q.o[k]+q.a[k]*s+q.b[k]*t),[u0,v0,u1,v1]=q.uv,A=c(0,0),B=c(1,0),C=c(1,1),D=c(0,1);
  P.p.push(...A,...B,...C,...A,...C,...D);P.u.push(u0,v0,u1,v0,u1,v1,u0,v0,u1,v1,u0,v1);}
 per.forEach((P,i)=>{if(!P.p.length)return;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P.p,3));g.setAttribute('uv',new T.Float32BufferAttribute(P.u,2));g.computeBoundingSphere();
  const m=new T.Mesh(g,mats[i]);m.material.side=T.DoubleSide;m.renderOrder=2;m.name='L0 bake132 atlas '+i;group.add(m);});
 globalThis.__bcBake132L0=group;return group;
}
