from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import hashlib, json, shutil
import numpy as np

ROOT=Path(__file__).resolve().parent
(ROOT/'runtime').mkdir(exist_ok=True)
(ROOT/'diagnostics').mkdir(exist_ok=True)
NEAREST=Image.Resampling.NEAREST
SOURCES={
 'face-a':'face-a-final-source.png',
 'face-b':'face-b-final-source.png',
 'body-a':'body-a-initial.png',
 'body-b':'body-b-final-source.png',
 'towel':'towel-initial.png',
}
FACE_Y={
 'face-a': {'source':[0,528.474949/1254,734/1254,870/1254,1075/1254,1], 'runtime':[0,.39,.55,.70,.88,1]},
 'face-b': {'source':[0,521.322915/1254,737/1254,882/1254,1120/1254,1], 'runtime':[0,.39,.55,.70,.88,1]},
}
FACE_EYES={'face-a':[[501/1254,.39],[755/1254,.39]],'face-b':[[484/1254,.39],[773/1254,.39]]}
manifest={
 'description':'Five independently generated diffuse texture assets for two adult male low-poly hot-spring NPCs. No model or animation assets are created by this export.',
 'generator':'Built-in image_gen.imagegen',
 'date':'2026-10-02',
 'normal_generation_resolution':[1254,1254],
 'export_method':'Nearest-neighbor resampling and mechanical atlas packing only; no pixels painted or color-modified.',
 'coordinate_system':'Image coordinates, top-left origin. u=x/width and image_v=y/height.',
 'sampler':{'magFilter':9728,'minFilter':9728,'mipmaps':False,'colorSpace':'sRGB','body_wrap':'ClampToEdge','face_wrap_s':'Repeat','face_wrap_t':'ClampToEdge','towel_wrap':'Repeat'},
 'face_layout':{'front_u':[.25,.75],'front_center_u':.5,'runtime_eyes':FACE_EYES,'runtime_nose_v':.55,'runtime_mouth_v':.70,'runtime_chin_v':.88,'rear_seam_u':[0,1],'note':'Use actual eye u coordinates above for eyelids, or adapt mesh UVs. The runtime x coordinates were not repainted or warped.'},
 'body_layout_pixels':{'front_torso':[0,0,128,160],'back_torso':[128,0,256,160],'arm_strip':[0,160,64,256],'leg_strip':[64,160,128,256],'palm_foot_patches':[128,160,256,256]},
 'body_layout_uv':{'front_torso':[0,0,.5,.625],'back_torso':[.5,0,1,.625],'arm_strip':[0,.625,.25,1],'leg_strip':[.25,.625,.5,1],'palm_foot_patches':[.5,.625,1,1]},
 'notes':['Initial body-b attempt was rejected by output safety; retry explicitly restricted the texture to chest-to-waist and limb surfaces and succeeded.','Body-a imagegen layout correction was rejected by output safety. The accepted independent original is retained and mechanically repacked.','Generated face refinements retained intended character identity but did not precisely match the requested eye row. Runtime vertical landmark resampling is documented.','Generated body islands contain internal limb/hand/foot drawings and dark baked shadows; use interior subregions when mapping simple low-poly limbs.'],
 'assets':{}
}
font_path='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
font=ImageFont.truetype(font_path,15)
small=ImageFont.truetype(font_path,12)

for name,source_name in SOURCES.items():
 source_path=ROOT/'originals'/source_name
 src=Image.open(source_path).convert('RGB')
 mapping={}
 if name in FACE_Y:
  a=np.asarray(src)
  spec=FACE_Y[name]
  coords=(np.arange(256)+.5)/256
  ys=(np.interp(coords,spec['runtime'],spec['source'])*src.height).astype(int).clip(0,src.height-1)
  xs=(coords*src.width).astype(int).clip(0,src.width-1)
  out=Image.fromarray(a[ys[:,None],xs[None,:]])
  mapping={'type':'vertical piecewise linear UV coordinate resampling, nearest source pixels','source_y_landmarks':spec['source'],'runtime_y_landmarks':spec['runtime'],'x':'identity normalized mapping'}
 elif name.startswith('body'):
  # Atlas exporter repacks accepted generated rows. Body B's towel fringe is omitted
  # because this file supplies skin only; the separate towel texture supplies cloth.
  split=627
  torso_end=627 if name=='body-a' else 539
  out=Image.new('RGB',(256,256))
  out.paste(src.crop((0,0,1254,torso_end)).resize((256,160),NEAREST),(0,0))
  out.paste(src.crop((0,split,1254,1254)).resize((256,96),NEAREST),(0,160))
  mapping={'type':'mechanical atlas row repacking with nearest sampling','source_torso_rect':[0,0,1254,torso_end],'runtime_torso_rect':[0,0,256,160],'source_limb_rect':[0,627,1254,1254],'runtime_limb_rect':[0,160,256,256],'body_b_crop_note':'Source rows 539:627 contain a towel waist fringe; omitted from skin atlas.' if name=='body-b' else None}
 else:
  out=src.resize((128,128),NEAREST)
  mapping={'type':'uniform nearest-neighbor downsample','source_rect':[0,0,1254,1254],'runtime_rect':[0,0,128,128]}
 runtime=ROOT/'runtime'/f'{name}.png'
 out.save(runtime,optimize=True)
 shutil.copy2(runtime,ROOT/f'{name}.png')
 colors=out.quantize(colors=6).convert('RGB').getcolors(100000)
 colors=sorted(colors,reverse=True)[:6]
 palette=['#%02x%02x%02x'%rgb for count,rgb in colors]
 manifest['assets'][name]={'source':str(source_path),'runtime':str(runtime),'root_copy':str(ROOT/f'{name}.png'),'size':list(out.size),'source_sha256':hashlib.sha256(source_path.read_bytes()).hexdigest(),'runtime_sha256':hashlib.sha256(runtime.read_bytes()).hexdigest(),'palette':palette,'mapping':mapping}
 # Diagnostic only: labels and UV guides are never baked into runtime maps.
 preview=out.resize((768,768),NEAREST)
 diag=Image.new('RGB',(768,850),'#172027')
 diag.paste(preview,(0,50))
 draw=ImageDraw.Draw(diag)
 draw.text((12,12),f'{name} | {out.width} x {out.height} runtime | image coordinates',font=font,fill='white')
 if name.startswith('face'):
  for label,y,color in [('eyes',.39,'#64ffff'),('nose',.55,'#6aff9a'),('mouth',.70,'#ffe98b'),('chin',.88,'#ff91eb')]:
   yy=50+round(y*768)
   draw.line((0,yy,767,yy),fill=color,width=1)
   draw.text((8,yy+3),f'{label} v={y:.2f}',font=small,fill=color,stroke_width=1,stroke_fill='#172027')
  for u,v in FACE_EYES[name]:
   x,y=round(u*768),50+round(v*768)
   draw.ellipse((x-7,y-7,x+7,y+7),outline='#64ffff',width=2)
   draw.text((x-30,y+15),f'u={u:.3f}',font=small,fill='#64ffff',stroke_width=1,stroke_fill='#172027')
  for u in [.25,.5,.75]: draw.line((round(u*768),50,round(u*768),817),fill='#92d9ff',width=1)
 elif name.startswith('body'):
  for label,rect in manifest['body_layout_pixels'].items():
   x0,y0,x1,y1=rect
   rr=(x0*3,50+y0*3,x1*3-1,50+y1*3-1)
   draw.rectangle(rr,outline='#69ffff',width=2)
   draw.text((rr[0]+6,rr[1]+7),label.replace('_',' '),font=small,fill='#69ffff',stroke_width=1,stroke_fill='#172027')
   draw.text((rr[0]+6,rr[1]+24),str(rect),font=small,fill='#69ffff',stroke_width=1,stroke_fill='#172027')
 else:
  draw.text((12,822),'Repeat U/V; nearest minification and magnification',font=small,fill='white')
 diag.save(ROOT/'diagnostics'/f'{name}-uv.png')

(ROOT/'provenance.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({n:{'path':v['runtime'],'size':v['size'],'palette':v['palette']} for n,v in manifest['assets'].items()},indent=2))
