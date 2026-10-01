import pathlib,sys,json,time
asset_root=pathlib.Path(sys.argv[1])
native_path=pathlib.Path(__file__).resolve().parent/'native-render.py'
__file__=str(native_path)
scene_source=native_path.read_text()
# Keep the exact renderer setup, materials, geometry, point shadows and draw
# function; append volume before the final scene draw and display conversion.
exec(scene_source[:scene_source.index("cam=fixture['cameras'][0]")])
post=json.load(open(asset_root/'post.json'));volume_fixture=post['volume']
volume_programs={k:program('#version 300 es\n'+post['volumeShaders']['vertex'],'#version 300 es\n'+post['volumeShaders'][k]) for k in ['advection','lightCache','raymarch','composite']}
print('linked 4 production volume shaders',flush=True)
def volume_tex(w,h):
 t=tex(None,w,h);Bind(0x0DE1,t);Tex(0x0DE1,0,0x881A,w,h,0,0x1908,0x140B,None);return t
def volume_target(w,h):
 t=volume_tex(w,h);f=U();GenFBO(1,C.byref(f));BindFBO(0x8D40,f);FBOTexture(0x8D40,0x8CE0,0x0DE1,t,0);assert CheckFBO(0x8D40)==0x8CD5;return f.value,t,w,h
def volume_draw(pr,target):
 BindFBO(0x8D40,target[0]);Viewport(0,0,target[2],target[3]);Disable(0x0B71);Disable(0x0BE2);clearattrs();attrs(pr,quad,[('position',3,0)],12);Draw(4,0,3)
def volume_read(target):
 BindFBO(0x8D40,target[0]);pixels=np.empty((target[3],target[2],4),np.float32);Read(0,0,target[2],target[3],0x1908,0x1406,pixels.ctypes.data);return pixels
noise=np.fromfile(asset_root/'steam-noise.bin',np.uint8);noise_id=U();Gen(1,C.byref(noise_id));Bind(0x806F,noise_id);Tex3D(0x806F,0,0x822B,64,64,64,0,0x8227,0x1401,noise.ctypes.data)
for a in[0x2802,0x2803,0x8072]:Param(0x806F,a,0x2901)
for a in[0x2800,0x2801]:Param(0x806F,a,0x2601)
mask_data=np.fromfile(asset_root/'steam-mask.bin',np.uint8).reshape(128,128);mask_tex=tex(np.repeat(mask_data[:,:,None],4,axis=2))
def volume_common(pr,t):
 Use(pr);scalar(pr,'time',t);scalar(pr,'waterY',volume_fixture['waterY']);vec(pr,'boundsMin',volume_fixture['boundsMin']);vec(pr,'boundsMax',volume_fixture['boundsMax']);bindtex(pr,'poolMask',mask_tex,1);Active(0x84C0+2);Bind(0x806F,noise_id);U1i(Loc(pr,b'noiseVolume'),2)
def volume_lights(pr):
 scalar(pr,'extinction',volume_fixture['extinction']);scalar(pr,'densityGain',volume_fixture['densityGain']);U1i(Loc(pr,b'lampCount'),4)
 for i in range(4):
  U4f(Loc(pr,f'lampPositionPower[{i}]'.encode()),*volume_fixture['lights'][i]);U4f(Loc(pr,f'lampColorRange[{i}]'.encode()),*volume_fixture['colors'][i])
field_a=volume_target(256,128);field_b=volume_target(256,128);light_field=volume_target(256,128)
for frame in range(84):
 pr=volume_programs['advection'];volume_common(pr,frame/20);bindtex(pr,'densityField',field_a[1],0);scalar(pr,'initialize',int(frame==0));scalar(pr,'dt',1/20);volume_draw(pr,field_b);field_a,field_b=field_b,field_a
pr=volume_programs['lightCache'];volume_common(pr,post['time']);bindtex(pr,'densityField',field_a[1],0);volume_lights(pr);volume_draw(pr,light_field)
volumeStats=[]
def compose_volume(camera,color,depth,label):
 half=volume_target((W+3)//4,(H+3)//4);output=volume_target(W,H)
 pr=volume_programs['raymarch'];volume_common(pr,post['time']);bindtex(pr,'densityField',field_a[1],0);bindtex(pr,'sceneDepth',depth,3);bindtex(pr,'lightField',light_field[1],4)
 projection=np.array(camera['projection'],np.float32).reshape(4,4).T;view=np.array(camera['view'],np.float32).reshape(4,4).T
 inverse_projection=np.linalg.inv(projection).T.flatten();camera_world=np.linalg.inv(view).T.flatten()
 matrix(pr,'inverseProjection',inverse_projection);matrix(pr,'cameraWorld',camera_world);vec(pr,'eye',camera['eye']);vec(pr,'halfSize',[half[2],half[3]]);volume_lights(pr);U1i(Loc(pr,b'raySteps'),20);volume_draw(pr,half)
 raw=volume_read(half);assert np.isfinite(raw).all();volumeStats.append({'view':label,'minTransmission':float(raw[:,:,3].min()),'meanTransmission':float(raw[:,:,3].mean()),'coveredFraction':float((raw[:,:,3]<.99).mean())})
 pr=volume_programs['composite'];Use(pr);bindtex(pr,'sourceColor',color,0);bindtex(pr,'sceneDepth',depth,1);bindtex(pr,'volumeColor',half[1],2);vec(pr,'halfSize',[half[2],half[3]]);vec(pr,'nearFar',[float(projection[2,3]/(projection[2,2]-1)),float(projection[2,3]/(projection[2,2]+1))]);volume_draw(pr,output)
 return output
# Use the production floor-reflection and bloom programs unchanged.
ssr={k:program('#version 300 es\n'+post['ssrShaders']['vertex'],'#version 300 es\n'+post['ssrShaders'][k]) for k in ['ray','composite']}
bloom={k:program('#version 300 es\n'+post['bloomShaders']['vertex'],'#version 300 es\n'+post['bloomShaders'][k]) for k in ['highPass','blur','composite']}
wx,wy=post['wetSize'];wet_data=np.fromfile(asset_root/'floor-wetness.bin',np.uint8).reshape(wy,wx,4);wet_map=tex(np.ascontiguousarray(wet_data[::-1]));Bind(0x0DE1,wet_map)
for axis in[0x2802,0x2803]:Param(0x0DE1,axis,0x2901)
def compose_reflections(camera,color,depth):
 half=volume_target((W+1)//2,(H+1)//2);output=volume_target(W,H)
 pr=ssr['ray'];Use(pr);bindtex(pr,'sceneColor',color,0);bindtex(pr,'sceneDepth',depth,1);bindtex(pr,'wetMap',wet_map,2)
 projection=np.array(camera['projection'],np.float32).reshape(4,4).T;view=np.array(camera['view'],np.float32).reshape(4,4).T
 ip=np.linalg.inv(projection).T.flatten();cw=np.linalg.inv(view).T.flatten()
 matrix(pr,'inverseProjection',ip);matrix(pr,'cameraWorld',cw);matrix(pr,'ssrView',camera['view']);matrix(pr,'ssrProjection',camera['projection']);vec(pr,'resolution',[W,H]);scalar(pr,'time',post['time'])
 for i,m in enumerate(post['marks']):U4f(Loc(pr,f'marks[{i}]'.encode()),*m)
 volume_draw(pr,half);raw=volume_read(half);assert np.isfinite(raw).all();ssrStats={'hitPixelFraction':float((raw[:,:,3]>.002).mean()),'peakBlend':float(raw[:,:,3].max())}
 pr=ssr['composite'];Use(pr);bindtex(pr,'sourceColor',color,0);bindtex(pr,'reflection',half[1],1);bindtex(pr,'sceneDepth',depth,2);matrix(pr,'inverseProjection',ip);matrix(pr,'cameraWorld',cw);volume_draw(pr,output)
 return output,ssrStats

def compose_bloom(color):
 bright=volume_target((W+3)//4,(H+3)//4);pr=bloom['highPass'];Use(pr);bindtex(pr,'sourceColor',color,0);vec(pr,'sourceSize',[W,H]);scalar(pr,'threshold',1.10);scalar(pr,'knee',.18);volume_draw(pr,bright)
 layers=[];input=bright
 for i in range(3):
  w=(W+3)//4//(2**i);h=(H+3)//4//(2**i);a=volume_target(w,h);b=volume_target(w,h)
  pr=bloom['blur'];Use(pr);bindtex(pr,'sourceColor',input[1],0);vec(pr,'texelStep',[1/input[2],0]);scalar(pr,'sigma',1.65+i*.48);volume_draw(pr,a)
  Use(pr);bindtex(pr,'sourceColor',a[1],0);vec(pr,'texelStep',[0,1/a[3]]);volume_draw(pr,b);layers.append(b);input=b
 output=volume_target(W,H);pr=bloom['composite'];Use(pr);bindtex(pr,'sourceColor',color,0)
 for i,rt in enumerate(layers):bindtex(pr,'bloom'+str(i),rt[1],i+1)
 scalar(pr,'strength',.19);scalar(pr,'radius',.36);volume_draw(pr,output);return output

cam=fixture['cameras'][0]
drawscene(cam,opaque[0]);drawscene(cam,msaa,water=True)
BindFBO(0x8CA8,msaa);BindFBO(0x8CA9,finalTarget[0]);Blit(0,0,W,H,0,0,W,H,0x4100,0x2600)
main_volume=compose_volume(cam,finalTarget[1],finalTarget[2],'main')
reflected,ssrStats=compose_reflections(cam,main_volume[1],finalTarget[2]);final=compose_bloom(reflected[1])
BindFBO(0x8D40,0);Viewport(0,0,W,H);Disable(0x0B71);Use(present);bindtex(present,'picture',final[1],0);bindtex(present,'depthPicture',finalTarget[2],1);scalar(present,'exposure',fixture['lighting']['exposure']);vec(present,'sky',fixture['lighting']['sky']);scalar(present,'clinic',0);vec(present,'eye',cam['eye']);matrix(present,'inverseViewProjection',cam['inverseViewProjection']);clearattrs();attrs(present,quad,[('position',3,0)],12);Draw(4,0,3)
out=np.empty((H,W,4),np.uint8);Read(0,0,W,H,0x1908,0x1401,out.ctypes.data);error=GetError();assert error==0,hex(error)
im=Image.fromarray(out[::-1,:,:3]);d=ImageDraw.Draw(im);d.rectangle((0,0,W,27),fill=(12,16,14));d.text((12,8),f"V66 / SOFTWARE GLES / {cam['label']} / production geometry + steam, SSR, bloom",fill='white')
output_path=asset_root/'inspection-post.png';im.save(output_path)
report={'camera':cam['label'],'simulationFrames':84,'densityGain':volume_fixture['densityGain'],'extinction':volume_fixture['extinction'],'volumeViews':volumeStats,'SSR':ssrStats,'glErrors':error,'renderSize':[W,H],'limitations':'Native software GLES diagnostic, standard PBR approximation omits runtime cubemap clearcoat/transmission. No browser, display/lens or measured gameplay FPS.'}
json.dump(report,open(asset_root/'post-check.json','w'),indent=2);print('SAVED',output_path,flush=True);print(json.dumps(report),flush=True)
