# Shared production fog pass setup for native GLES scene and analytic tests.
fogWidth,fogHeight=W//3,H//3
fogHalf=target();fogHDR=target()
Bind(0x0DE1,fogHalf[1]);Tex(0x0DE1,0,0x881A,fogWidth,fogHeight,0,0x1908,0x140B,None)
Bind(0x0DE1,fogHalf[2]);Tex(0x0DE1,0,0x81A6,fogWidth,fogHeight,0,0x1902,0x1405,None)
def drawFog(p,rt,full=False):
 BindFBO(0x8D40,rt[0]);Viewport(0,0,W if full else fogWidth,H if full else fogHeight);Use(p);Disable(0x0B71)
 if 'clearattrs' in globals():clearattrs()
 attrs(p,quad,[('position',3,0)],12);Draw(4,0,3)
Bind(0x0DE1,fogHDR[1]);Tex(0x0DE1,0,0x881A,W,H,0,0x1908,0x140B,None)
# The depth-aware four-tap resolve fetches explicit centres (nearest field data).
Bind(0x0DE1,fogHalf[1]);Param(0x0DE1,0x2800,0x2600);Param(0x0DE1,0x2801,0x2600)
def fogUniforms(p,cam,age,depthTexture):
 Use(p);bindtex(p,'sceneDepth',depthTexture,0);Active(0x84C1);Bind(0x806F,skyNoise);U1i(Loc(p,b'fogNoise'),1)
 matrix(p,'inverseProjection',np.linalg.inv(np.array(cam['projection']).reshape(4,4).T).T.flatten());matrix(p,'cameraWorld',np.linalg.inv(np.array(cam['view']).reshape(4,4).T).T.flatten())
 for k,v in [('u_fogProgress',age/90),('fogAmount',1),('fogTime',age),('maxDist',640),('fogFar',480),('groundCorrection',0),('fogWaterActive',0),('fogWaterLevel',0)]:scalar(p,k,v)
 vec(p,'fogOffset',(-16,-68));vec(p,'terrainOrigin',(0,0));vec(p,'fogSize',(fogWidth,fogHeight));vec(p,'fogColor',tuple(((np.array([.72,.75,.76])+.055)/1.055)**2.4))
def renderFog(cam,age):
 if age==0:return opaque[1]
 p=post['fogIntegrate'];fogUniforms(p,cam,age,opaque[2]);drawFog(p,fogHalf)
 p=post['fogComposite'];fogUniforms(p,cam,age,opaque[2]);bindtex(p,'picture',opaque[1],2);bindtex(p,'fogField',fogHalf[1],3);drawFog(p,fogHDR,True)
 return fogHDR[1]
