// Shared CPU / terrain-GLSL shoreline contract. All coordinates are local to
// the current 64 m tile; cx/cz may be outside the tile for a shared large lake.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// Broad lobes, two unequal recessed bays, and a projecting point. This is
// deliberately much stronger than small sine ripples applied to an ellipse.
export function pondRadius(f,a){
 const p=f.shorePhase||0,amp=f.shoreAmplitude??.30;
 const lobes=.64*Math.sin(a+p*.61)+.40*Math.sin(2*a-p*.83)+
   .46*Math.sin(3*a+p)+.23*Math.sin(5*a-p*.7)+.09*Math.sin(9*a+p*1.7);
 const bay=.26*Math.exp((Math.cos(a-p*.79-.34)-1)*6.0)+
   .18*Math.exp((Math.cos(a+p*.37-3.65)-1)*10.0);
 const point=.16*Math.exp((Math.cos(a-p*.43-2.15)-1)*8.0);
 return clamp(1+amp*lobes-bay+point,.46,1.52);
}
export function pondPoint(f,a,scale=1){
 const r=pondRadius(f,a)*scale,u=Math.cos(a)*f.rx*r,v=Math.sin(a)*f.rz*r;
 const c=Math.cos(f.angle||0),s=Math.sin(f.angle||0);
 return {x:f.cx+c*u+s*v,z:f.cz-s*u+c*v};
}
export function pondAngle(x,z,f){
 const c=Math.cos(f.angle||0),s=Math.sin(f.angle||0),dx=x-f.cx,dz=z-f.cz;
 return Math.atan2((s*dx+c*dz)/f.rz,(c*dx-s*dz)/f.rx);
}
export function pondDistance(x,z,f){
 const c=Math.cos(f.angle||0),s=Math.sin(f.angle||0),dx=x-f.cx,dz=z-f.cz;
 const u=(c*dx-s*dz)/f.rx,v=(s*dx+c*dz)/f.rz;
 return Math.hypot(u,v)/pondRadius(f,Math.atan2(v,u));
}
// Width in metres, independent of lake size: broad grass shelves alternate
// with narrow silt edges; large lakes must not acquire a 25 m uniform berm.
export function pondShoreWidth(f,a){
 const p=f.shorePhase||0;
 const broad=.5+.5*Math.sin(2*a+p*.8),fine=.5+.5*Math.sin(5*a-p*1.3);
 return 2.0+4.5*broad*broad+1.2*fine;
}
export function pondShoreDistance(x,z,f){
 const a=pondAngle(x,z,f),r=pondRadius(f,a)*Math.hypot(f.rx*Math.cos(a),f.rz*Math.sin(a));
 return (pondDistance(x,z,f)-1)*r;
}
export function pondBankPoint(f,a,metres=0){
 const r=pondRadius(f,a)*Math.hypot(f.rx*Math.cos(a),f.rz*Math.sin(a));
 return pondPoint(f,a,1+metres/Math.max(.001,r));
}
export function pondMetrics(x,z,f){
 const a=pondAngle(x,z,f),d=pondDistance(x,z,f),width=pondShoreWidth(f,a);
 const metres=(d-1)*pondRadius(f,a)*Math.hypot(f.rx*Math.cos(a),f.rz*Math.sin(a));
 return {angle:a,distance:d,metres,width,bank:metres/width};
}

// Import this string into ground.js; uniforms preserve the old uPond/uShore
// layout, so terrain and the water boundary use bit-for-bit-equivalent maths.
export const pondShapeGLSL=`
float pondRadiusV6(float a,float ph,float amp){
 float lobes=.64*sin(a+ph*.61)+.40*sin(2.*a-ph*.83)+.46*sin(3.*a+ph)+.23*sin(5.*a-ph*.7)+.09*sin(9.*a+ph*1.7);
 float bay=.26*exp((cos(a-ph*.79-.34)-1.)*6.)+.18*exp((cos(a+ph*.37-3.65)-1.)*10.);
 float point=.16*exp((cos(a-ph*.43-2.15)-1.)*8.);
 return clamp(1.+amp*lobes-bay+point,.46,1.52);
}
float pondShoreWidthV6(float a,float ph){
 float broad=.5+.5*sin(2.*a+ph*.8),fine=.5+.5*sin(5.*a-ph*1.3);
 return 2.+4.5*broad*broad+1.2*fine;
}
vec4 pondMetricsV6(vec2 p,vec4 pond,vec4 shore){
 vec2 v=p-pond.xy;float c=cos(shore.x),s=sin(shore.x);
 vec2 uv=vec2(c*v.x-s*v.y,s*v.x+c*v.y)/pond.zw;
 float a=atan(uv.y,uv.x),r=pondRadiusV6(a,shore.y,shore.z),d=length(uv)/r;
 float metres=(d-1.)*r*length(pond.zw*vec2(cos(a),sin(a)));
 float width=pondShoreWidthV6(a,shore.y);
 return vec4(d,metres,width,metres/width);
}
`;
