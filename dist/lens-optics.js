// Millimetres at the CCD/lens; metres in the world. 1/3-inch, 4:3 active area.
export const CCD_HEIGHT_MM=3.6,CCD_WIDTH_MM=4.8,F_NUMBER=2.8,COC_LIMIT_MM=.005;
export const MAX_COC_RADIUS=12;
export const focalLengthForFov=fov=>CCD_HEIGHT_MM/(2*Math.tan(fov*Math.PI/360));
export const hyperfocal=f=>f*f/(F_NUMBER*COC_LIMIT_MM)/1000+f/1000;
export function circleOfConfusion(z,s,f,height=720){
 const radius=(z-s)/Math.max(z,.001)*f*f/(F_NUMBER*Math.max(s*1000-f,.001))*height/CCD_HEIGHT_MM*.5;
 return Math.max(-MAX_COC_RADIUS,Math.min(MAX_COC_RADIUS,radius));
}
