// Metres, shared by meshes and walking; the original empty basin is untouched.
export const SPA={x0:4.10,x1:12.25,z0:-7.95,z1:.65,ceiling:3.20,cx:8.9,cz:-2.65,radius:2.32,waterY:-.14,bottomY:-.99};
export const SPA_PORTAL={x:4.18,z0:-2.60,z1:-.70,top:2.28};
export const SPA_ENTRY={angle:.72,width:.94,start:2.32,tread:.22,count:6,rise:.165};
export function spaStepLocal(x,z){const dx=x-SPA.cx,dz=z-SPA.cz,c=Math.cos(SPA_ENTRY.angle),s=Math.sin(SPA_ENTRY.angle);return {along:dx*c+dz*s,across:-dx*s+dz*c};}
export function inSpa(x,z){return x>4.28&&x<12.01&&z>-7.68&&z<SPA.z1-.24;}
export function inSpaPortal(x,z){return x>3.34&&x<4.65&&z>SPA_PORTAL.z0+.20&&z<SPA_PORTAL.z1-.20;}
export function spaFloor(x,z){const r=Math.hypot(x-SPA.cx,z-SPA.cz),q=spaStepLocal(x,z);if(r>=SPA.radius)return 0;if(Math.abs(q.across)<SPA_ENTRY.width/2&&q.along>SPA_ENTRY.start-SPA_ENTRY.count*SPA_ENTRY.tread&&q.along<SPA_ENTRY.start)return -Math.min(6,Math.ceil((SPA_ENTRY.start-q.along)/SPA_ENTRY.tread))*.165;return SPA.bottomY;}
export function spaAllowed(x,z){if(!inSpa(x,z))return false;if(z<-4.90&&x<7.95)return false;if(z<-6.35)return false;return true;}
export function inSpaWater(x,z){return inSpa(x,z)&&Math.hypot(x-SPA.cx,z-SPA.cz)<SPA.radius&&spaFloor(x,z)<SPA.waterY;}
