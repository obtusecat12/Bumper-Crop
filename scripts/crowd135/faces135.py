# V135 ④-1: crop the generated 1024² face photos (art-v135crowd) to cheek-to-cheek / hair-to-chin boxes (no ears), downscale to 128², quantize.
from PIL import Image
import json,sys
C={'c1':(44,8,211,222),'c2':(51,20,205,218),'f1':(56,20,200,205),'f2':(62,20,194,210),'f3':(54,15,202,205),'m1':(54,10,202,215),'m2':(46,8,210,230),'m3':(52,5,204,215)}
import os
R=os.path.dirname(os.path.abspath(__file__))+'/../../..'
D=R+'/art-v135crowd/';O=R+'/bc/dist/assets/crowd135/';os.makedirs(O,exist_ok=True)
sheet=Image.new('RGB',(192*8,192))
for i,(k,b) in enumerate(C.items()):
  im=Image.open(D+'face_'+k+'.png').convert('RGB').crop(tuple(v*4 for v in b))
  sm=im.resize((256,256),Image.LANCZOS).resize((128,128),Image.LANCZOS)
  sm=sm.quantize(colors=96,dither=Image.Dither.NONE).convert('RGB')
  sm.save(O+'face_'+k+'.png')
  sheet.paste(sm.resize((192,192),Image.NEAREST),(192*i,0))
sheet.save('/tmp/crowd135_faces.png')

