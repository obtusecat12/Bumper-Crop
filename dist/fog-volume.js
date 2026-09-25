// Dense fog now belongs to advancing-fog.js, after opaque + water and before
// camera optics. Retain the material hook as a compile-time identity so old
// fog/sky integrations have no sampler, dynamic branch or repeated integration.
export const fogVolumePars=`
const float uFogVolumeAmount=0.;
vec4 fogVolumeAt(float distance){return vec4(0.,0.,0.,1.);}
vec3 volumeOverOutput(vec3 background,float distance){return background;}
`;
