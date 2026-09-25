// Shared deterministic physical cross-section. d is distance from road centre.
export function wheelProfile(d,t,out={}){
 const a=Math.abs(d)-.9,edge=Math.abs(a),u=Math.max(0,Math.min(1,(edge-.125)/.075)),rut=1-u*u*(3-2*u);
 const depth=.10+.010*Math.sin(t*Math.PI/16)+.006*Math.sin(t*Math.PI/6.4);
 const b=(edge-.215)/.065,berm=.040*Math.exp(-b*b*2);
 out.rut=rut;out.cut=rut*depth;out.berm=berm;out.relief=berm-rut*depth;return out;
}
export function roadGrassNoise(x,z){
 return simplex2(x*1.7,z*1.7)*.7+simplex2(x*5.1+19,z*5.1+19)*.3;
}
const mod289=x=>((x%289)+289)%289,perm=x=>mod289((34*mod289(x)+1)*mod289(x));
export function simplex2(x,y){
 const F=.366025403784,G=.211324865405,s=(x+y)*F,i=Math.floor(x+s),j=Math.floor(y+s),t=(i+j)*G,a=x-i+t,b=y-j+t,ix=a>b?1:0,iy=1-ix;
 const corner=(dx,dy,u,v)=>{let r=.5-u*u-v*v;if(r<=0)return 0;const h=perm(perm(j+dy)+i+dx)%8,gx=h<2?(h===0?1:-1):h<4?0:(h%2===0?.70710678:-.70710678),gy=h<2?0:h<4?(h===2?1:-1):(h<6?.70710678:-.70710678);return r*r*r*r*(gx*u+gy*v);};
 return Math.max(0,Math.min(1,.5+35*(corner(0,0,a,b)+corner(ix,iy,a-ix+G,b-iy+G)+corner(1,1,a-1+2*G,b-1+2*G))));
}
export const ROAD_NOISE_GLSL=`
float roadPerm(float x){x=mod(x,289.);return mod((34.*x+1.)*x,289.);}
float roadCorner(vec2 cell,vec2 v){float r=max(0.,.5-dot(v,v)),h=mod(roadPerm(roadPerm(cell.y)+cell.x),8.);vec2 g= h<2.?vec2(h<1.?1.:-1.,0.):h<4.?vec2(0.,h<3.?1.:-1.):vec2(mod(h,2.)<1.?.70710678:-.70710678,h<6.?.70710678:-.70710678);return r*r*r*r*dot(g,v);}
float roadSimplex(vec2 p){float F=.366025403784,G=.211324865405;vec2 cell=floor(p+(p.x+p.y)*F),a=p-cell+(cell.x+cell.y)*G,ij=a.x>a.y?vec2(1.,0.):vec2(0.,1.);return clamp(.5+35.*(roadCorner(cell,a)+roadCorner(cell+ij,a-ij+G)+roadCorner(cell+1.,a-1.+2.*G)),0.,1.);}
float roadVoronoi(vec2 p){vec2 i=floor(p),f=fract(p);float distance2=2.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 b=vec2(float(x),float(y)),c=i+b;vec2 jitter=vec2(roadPerm(roadPerm(c.y)+c.x),roadPerm(roadPerm(c.x)+c.y+37.))/289.;vec2 d=b+jitter-f;distance2=min(distance2,dot(d,d));}return sqrt(distance2);}
`;
