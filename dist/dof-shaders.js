// CoC values are radii in FULL-resolution pixels, not dimensionless blur knobs.
// Foreground and background stay separate through reduction and disc gathering.
export const lensGLSL=`
uniform float focalMM,fNumber,sensorHeight,focusDist,nearPlane,farPlane,dofEnabled;
uniform vec2 resolution;
float linearZ(float d){return nearPlane*farPlane/(farPlane-d*(farPlane-nearPlane));}
float signedCoC(float z){return clamp((z-focusDist)/max(z,.001)*focalMM*focalMM/
 (fNumber*max(focusDist*1000.-focalMM,.001))*resolution.y/sensorHeight*.5,-12.,12.)*dofEnabled;}
`;
export const cocFragment=`precision highp float;precision highp sampler2D;
uniform sampler2D depth;in vec2 uv;out vec4 outColor;
${lensGLSL}
void main(){float n=0.,f=0.;
 for(int y=0;y<2;y++)for(int x=0;x<2;x++){
  float c=signedCoC(linearZ(texture(depth,uv+(vec2(x,y)-.5)/resolution).r));
  n=max(n,-c);f=max(f,c);
 }
 outColor=vec4(n/12.,f/12.,texture(depth,uv).r,1.);
}`;
export const dilateFragment=`precision highp float;precision highp sampler2D;
uniform sampler2D coc;uniform vec2 direction,resolution;in vec2 uv;out vec4 outColor;
void main(){vec4 c=texture(coc,uv);float radius=c.r*12.;
 // Only foreground support expands. Far CoC and centre depth are untouched.
 for(int i=-6;i<=6;i++){float d=float(i)*2.;float r=texture(coc,uv+direction*d/resolution).r*12.;
  if(r>=abs(d))radius=max(radius,r);
 }
 outColor=vec4(radius/12.,c.gba);
}`;
export const discGLSL=`
const vec2 poisson[16]=vec2[16](vec2(-.942,-.399),vec2(.946,-.769),vec2(-.094,-.929),vec2(.345,.294),
 vec2(-.916,.458),vec2(-.815,-.879),vec2(-.383,.277),vec2(.974,.756),
 vec2(.443,-.975),vec2(.537,-.474),vec2(-.265,-.419),vec2(.792,.191),
 vec2(-.242,.997),vec2(-.814,.914),vec2(.200,.786),vec2(.143,-.141));
// Disc coordinates bounded to a circle. Fixed pattern: no temporal grain.
vec2 disc(int i){return poisson[i]/max(1.,length(poisson[i]));}
`;
