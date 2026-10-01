// Metres. Architecture, furniture clearances, pool and walking share this plan.
export const SPA={x0:4.10,x1:12.98,z0:-5.68,z1:4.88,ceiling:3.20,cx:8.9,cz:-2.65,radius:2.32,waterY:-.14,bottomY:-.99};
export const SPA_PORTAL={x:4.18,z0:-2.60,z1:-.70,top:2.28};
export const SPA_ENTRY={angle:.72,width:.94,start:2.32,tread:.22,count:6,rise:.165};
export const SPA_NICHES=[-4.05,-1.50,1.05];
export const SPA_SPILL={outlet:[7.57,1.065,-4.21],impact:[7.57,-.14,-4.21],width:1.06};
export function spaStepLocal(x,z){const dx=x-SPA.cx,dz=z-SPA.cz,c=Math.cos(SPA_ENTRY.angle),s=Math.sin(SPA_ENTRY.angle);return{along:dx*c+dz*s,across:-dx*s+dz*c};}
export function inSpa(x,z){return x>4.28&&x<12.72&&z>SPA.z0+.22&&z<SPA.z1-.23;}
export function inSpaPortal(x,z){return x>3.34&&x<4.65&&z>SPA_PORTAL.z0+.20&&z<SPA_PORTAL.z1-.20;}
export function spaFloor(x,z){const r=Math.hypot(x-SPA.cx,z-SPA.cz),q=spaStepLocal(x,z);if(r>=SPA.radius)return 0;if(Math.abs(q.across)<SPA_ENTRY.width/2&&q.along>SPA_ENTRY.start-SPA_ENTRY.count*SPA_ENTRY.tread&&q.along<SPA_ENTRY.start)return-Math.min(6,Math.ceil((SPA_ENTRY.start-q.along)/SPA_ENTRY.tread))*SPA_ENTRY.rise;return SPA.bottomY;}
export function spaAllowed(x,z){
 if(!inSpa(x,z))return false;
 // The portal opens into a short vestibule, then the pool alcove; the western
 // service return and the solid cliff are architecture, never invisible voids.
 if(x<6.25&&z>-.40)return false;
 if(x<6.53&&z<-2.72)return false;
 if(z<-5.03)return false;
 if(x<8.17&&z<-4.58&&Math.hypot(x-SPA.cx,z-SPA.cz)>2.34)return false;
 if(x>11.79&&SPA_NICHES.some(c=>Math.abs(z-c)<.94))return false;
 if(x>12.02)return false;
 // Rounded piers of the low lounge arcade.
 if(Math.hypot(x-6.42,z-.53)<.42||Math.hypot(x-12.12,z-.53)<.43)return false;
 for(const cx of[7.25,9.02])if(Math.abs(x-cx)<.55&&z>.90&&z<3.34)return false;
 for(const [px,pz,r]of[[11.62,.95,.52],[6.75,3.72,.48]])if(Math.hypot(x-px,z-pz)<r)return false;
 // Glass block room turns left through a real .95 m clear doorway.
 if(z>3.10&&z<3.68&&x>10.86)return false;
 if(z>3.94&&x<9.76)return false;
 if(z>3.52&&x<9.79)return false;
 if(z>4.00&&x>10.26)return false;
 return true;
}
export function inSpaWater(x,z){return inSpa(x,z)&&Math.hypot(x-SPA.cx,z-SPA.cz)<SPA.radius&&spaFloor(x,z)<SPA.waterY;}
