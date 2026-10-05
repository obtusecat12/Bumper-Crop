import {subtractRectangle} from './manila-plan.js';
// Metres. The entire structure extends BELOW the original Level 0 walking plane.
export const ATRIUM96={x:302,z:70,w:22.8,d:28.8,halfX:6,halfZ:10,tiers:22};
export const ATRIUM_RECT96={id:'atrium96',type:'atrium',x0:290.6,x1:313.4,z0:55.6,z1:84.4};
export const inAtrium96=(x,z,p=0)=>Math.abs(x-302)<11.4+p&&Math.abs(z-70)<14.4+p;
export const atriumPit96=(x,z)=>Math.abs(x-302)<6-.035&&Math.abs(z-70)<10-.035;
export const subtractAtrium96=f=>subtractRectangle(f,290.6,313.4,55.6,84.4);
export const ATRIUM_VIEWS96=[
 {name:'无底天井 · 房间剖面',x:295.51,z:78.3,yaw:-.73,pitch:-.64},
 {name:'无底天井 · 对岸与夹层',x:308.74,z:76.8,yaw:.56,pitch:-.73},
 {name:'无底天井 · 纵深',x:301.6,z:80.66,yaw:0,pitch:-1.03}
];
export const topWalls96=[
 // Narrow west rim with one real door reveal; east wall stays farther behind the chair.
 {x:-6.96,z:-5.0,w:.20,d:18.8},{x:-6.96,z:9.86,w:.20,d:9.08},
 {x:9.0,z:-3.5,w:.20,d:21.8},{x:9.0,z:12.3,w:.20,d:4.2},
 {x:2.5,z:-12.15,w:12.8,d:.20},{x:-1.6,z:-11.18,w:.18,d:1.94}
];
export function atriumBlocked96(x,z,r=.25){
 const xx=x-302,zz=z-70;
 for(const q of topWalls96)if(Math.abs(xx-q.x)<q.w/2+r&&Math.abs(zz-q.z)<q.d/2+r)return true;
 // Closed upper door and the solitary opposite chair have the same footprint as their models.
 if(Math.abs(xx+6.96)<.12+r&&Math.abs(zz-4.86)<.48+r)return true;
 if(Math.abs(xx-6.74)<.26+r&&Math.abs(zz+3.2)<.27+r)return true;
 return false;
}
export function atriumLevelY96(n){let y=0;for(let i=0;i<n;i++)y-=2.72+(i%2===0?.48:.80);return y;}
