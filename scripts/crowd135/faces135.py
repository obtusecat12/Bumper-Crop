# V135 ④-1/④-2: crop the generated 1024² face photos (art-v135crowd) to cheek-to-cheek / hair-to-chin boxes (no ears), downscale to 128², quantize.
from PIL import Image
import json,sys
C={'c1':(44,8,211,222),'c2':(51,20,205,218),'f1':(56,20,200,205),'f2':(62,20,194,210),'f3':(54,15,202,205),'m1':(54,10,202,215),'m2':(46,8,210,230),'m3':(52,5,204,215)}
import os
# ④-2 (16 more faces, mixed sizes): boxes in source pixels = haar face box x+.08w..x+.92w, hair top (first non-background row) .. y+w
# (opencv haarcascade_frontalface_default, calibrated on the ④-1 hand crops; /workspace/work/v135y/det.py)
C2={'m4': (415, 46, 787, 623), 'm5': (533, 46, 875, 551), 'm6': (204, 28, 708, 819), 'm7': (214, 126, 692, 859), 'm8': (509, 21, 901, 613), 'm9': (217, 30, 719, 823), 'f4': (536, 0, 867, 593), 'f5': (212, 115, 677, 842), 'f6': (225, 150, 676, 822), 'f7': (239, 113, 660, 771), 'f8': (234, 94, 700, 818), 'f9': (213, 57, 723, 840), 'c3': (215, 107, 694, 875), 'c4': (197, 88, 696, 930), 'c5': (234, 60, 666, 778), 'c6': (221, 73, 689, 855)}
R=os.path.dirname(os.path.abspath(__file__))+'/../../..'
D=R+'/art-v135crowd/';O=R+'/bc/dist/assets/crowd135/';os.makedirs(O,exist_ok=True)
sheet=Image.new('RGB',(192*24,192))
# the new crops start at the first hair row: move the top 6 % down so the crop's top rows are hair (the runtime samples
# the hair colour there and the head cap maps to the top row)
C2={k:(x0,round(y0+.06*(y1-y0)),x1,y1) for k,(x0,y0,x1,y1) in C2.items()}
ALL=[(k,tuple(v*4 for v in b)) for k,b in C.items()]+list(C2.items())
for i,(k,b) in enumerate(ALL):
  im=Image.open(D+'face_'+k+'.png').convert('RGB').crop(b)
  sm=im.resize((256,256),Image.LANCZOS).resize((128,128),Image.LANCZOS)
  sm=sm.quantize(colors=96,dither=Image.Dither.NONE).convert('RGB')
  sm.save(O+'face_'+k+'.png')
  sheet.paste(sm.resize((192,192),Image.NEAREST),(192*i,0))
sheet.save('/tmp/crowd135_faces.png')

