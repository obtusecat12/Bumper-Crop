// V133-bake-L0pit: pit-field ("深坑群") lightmap. tools/bake133_l0pit.mjs bakes troffer soft shadows + AO + 2 bounces for the
// pit field twice (with the shafts / with a solid floor); floor pieces, ceiling and edge walls get the ratio as a 2x-multiply
// overlay (byte 128 = neutral, live light field / flicker / flashlight keep working), and every shaft gets its baked
// irradiance drawn over the old unlit pit shader: troffer light pours down the shaft walls and dies out with depth.
// Off with ?bake=0. Debug global __bcBake133Pit.
import {BAKE133_PIT} from './level0-bake133-pit-data.js?v=133';
export const BAKE133_PIT_ON=(()=>{try{return new URLSearchParams(location.search).get('bake')!=='0';}catch{return true;}})();
export function createPitBake133(T){
 const group=new T.Group();group.name='V133 L0 pit-field lightmap';if(!BAKE133_PIT_ON){group.visible=false;return group;}
 const tex=BAKE133_PIT.atlases.map(a=>{const b=atob(a.px),n=a.w*a.h,st=a.mono?1:3,px=new Uint8Array(n*4);for(let i=0;i<n;i++){const r=b.charCodeAt(i*st);px[i*4]=r;px[i*4+1]=a.mono?r:b.charCodeAt(i*3+1);px[i*4+2]=a.mono?r:b.charCodeAt(i*3+2);px[i*4+3]=255;}
  const t=new T.DataTexture(px,a.w,a.h,T.RGBAFormat);t.magFilter=T.LinearFilter;t.minFilter=T.LinearFilter;t.generateMipmaps=false;t.colorSpace=T.NoColorSpace;t.flipY=false;t.needsUpdate=true;return t;});
 const VS='varying vec2 vUv;varying vec3 vP;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vP=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}';
 const mod=t=>new T.ShaderMaterial({name:'L0 bake133 pit modulation',uniforms:{map:{value:t}},vertexShader:VS,
  fragmentShader:'uniform sampler2D map;varying vec2 vUv;void main(){gl_FragColor=vec4(texture2D(map,vUv).rgb,1.);}',
  transparent:true,depthWrite:false,blending:T.CustomBlending,blendEquation:T.AddEquation,blendSrc:T.DstColorFactor,blendDst:T.SrcColorFactor,
  polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4,toneMapped:false,fog:false,side:T.DoubleSide});
 // shaft walls: yellowed plaster lining, slab band at the lip (carpet + subfloor cut), grime streaks running down; colour = albedo x baked light
 const shaft=t=>new T.ShaderMaterial({name:'L0 bake133 pit shaft',uniforms:{map:{value:t},gain:{value:.3}},vertexShader:VS,
  fragmentShader:`uniform sampler2D map;uniform float gain;varying vec2 vUv;varying vec3 vP;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
  void main(){float b=texture2D(map,vUv).r,E=b*b*2.*gain;float s=vP.x+vP.z,y=vP.y;
   vec3 alb=vec3(.52,.42,.22);
   float streak=n(vec2(s*9.,y*.35))*.6+n(vec2(s*31.,y*1.3))*.4;alb*=.78+.3*streak;   // vertical water/grime streaks
   alb*=.9+.2*n(vec2(s*3.,y*3.));alb=mix(alb,vec3(.30,.27,.20),smoothstep(-1.2,-3.5,y)*.6); // darker, damper lower down
   if(y>-.07)alb=vec3(.30,.25,.16)*(.8+.4*n(vec2(s*60.,y*80.)));             // carpet pile cut edge
   else if(y>-.22)alb=vec3(.30,.29,.27)*(.82+.3*n(vec2(s*14.,y*14.)));        // concrete subfloor slab
   else if(y>-.25)alb*=.35;                                                    // shadow joint under the slab
   vec3 c=alb*E*exp(min(0.,y+.3)*.32);c=floor(c*48.+.5*h(gl_FragCoord.xy))/48.;                       // PS1-ish banding/dither
   gl_FragColor=vec4(c,1.);
   #include <colorspace_fragment>
  }`,fog:false,toneMapped:false,side:T.DoubleSide});
 const mats=BAKE133_PIT.atlases.map((a,i)=>a.mono?shaft(tex[i]):mod(tex[i]));
 const per=mats.map(()=>({p:[],u:[]}));
 for(const q of [...BAKE133_PIT.quads,...BAKE133_PIT.shaftQuads]){const P=per[q.t],c=(s,t)=>[0,1,2].map(k=>q.o[k]+q.a[k]*s+q.b[k]*t),[u0,v0,u1,v1]=q.uv,A=c(0,0),B=c(1,0),C=c(1,1),D=c(0,1);
  P.p.push(...A,...B,...C,...A,...C,...D);P.u.push(u0,v0,u1,v0,u1,v1,u0,v0,u1,v1,u0,v1);}
 per.forEach((P,i)=>{if(!P.p.length)return;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P.p,3));g.setAttribute('uv',new T.Float32BufferAttribute(P.u,2));g.computeBoundingSphere();
  const m=new T.Mesh(g,mats[i]);m.renderOrder=BAKE133_PIT.atlases[i].mono?0:2;m.name='L0 bake133 pit '+i;group.add(m);});
 globalThis.__bcBake133Pit=group;return group;
}
