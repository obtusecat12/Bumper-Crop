"""Mechanical UV registration only; retain generated painted artwork and colors.

The face's generated eyelid line is at source V=.434. Register the face's
painted feature rows to the existing head mesh UV contract without repainting.
All sampling and final resizing use nearest-neighbor interpolation.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
im = Image.open(ROOT / 'originals/face-a.png').convert('RGB')
src = np.asarray(im)
destination_v = np.array([0.0, .16, .33, .39, .55, .70, .88, 1.0])
source_v = np.array([0.0, .16, .353, .436, .586, .690, .88, 1.0])
v = (np.arange(256) + .5) / 256
u = (np.arange(256) + .5) / 256
y = np.clip((np.interp(v, destination_v, source_v) * im.height).astype(int), 0, im.height-1)
x = np.clip((u * im.width).astype(int), 0, im.width-1)
registered = src[y[:,None], x[None,:]]
Image.fromarray(registered).save(ROOT / 'runtime256/face-a.png')
body = Image.open(ROOT / 'originals/body-a.png').convert('RGB')
body_runtime = body.resize((256,256), Image.Resampling.NEAREST)
body_runtime.save(ROOT / 'runtime256/body-a.png')
body_arr = np.asarray(body_runtime)

def patch_rgb(box):
    x0, y0, x1, y1 = box
    a = registered[y0:y1, x0:x1].reshape(-1,3)
    return np.median(a, axis=0).astype(int).tolist()

manifest = {
  'generation_tool': 'built-in image_gen.imagegen',
  'face_original_size': list(im.size),
  'face_runtime_size': [256,256],
  'body_original_size': list(body.size),
  'body_runtime_size': [256,256],
  'resampling': 'nearest neighbor only; piecewise-linear UV row registration; no recoloring or paint added',
  'uv_origin': 'top-left image, U rightward, V downward',
  'head_seam': 'U=0/1 wrapping back of head',
  'landmarks': {
    'left_closed_eyelid': {'u':.370,'v':.390},
    'right_closed_eyelid': {'u':.625,'v':.390},
    'eyebrows': {'v':.330,'color':'white'},
    'nose_tip': {'u':.5,'v':.550},
    'mouth_center': {'u':.5,'v':.700},
    'chin': {'u':.5,'v':.880},
    'lower_white_beard': {'u_range':[.23,.78],'v_range':[.77,.97]},
    'side_white_beard': {'u_ranges':[[.15,.32],[.69,.85]],'v_range':[.56,.90]},
    'white_moustache': {'u_range':[.31,.68],'v_range':[.60,.69]},
    'white_side_hair': {'u_ranges':[[0,.26],[.73,1]],'v_range':[.07,.4]},
    'forehead_skin_sample': {'u_range':[.44,.56],'v_range':[.16,.22]}
  },
  'median_palette_rgb': {
    'forehead_skin':patch_rgb([110,40,145,57]),
    'nose_skin':patch_rgb([118,125,135,140]),
    'white_beard':patch_rgb([109,209,147,232]),
    'white_side_hair':patch_rgb([15,38,40,85])
  },
  'registration_knots': {'destination_v':destination_v.tolist(),'source_v':source_v.tolist()},
  'body_generation_status':'first request blocked by service at output moderation; parent-authorized safer skin-material-only retry succeeded',
  'body_atlas_rectangles': {'front':[0,0,128,160],'back':[128,0,256,160],'arm':[0,160,64,256],'leg':[64,160,128,256],'neck_hands':[128,160,256,256]},
  'body_palette_rgb': {'neck_hands_median':np.median(body_arr[164:248,132:248].reshape(-1,3),axis=0).astype(int).tolist()},
  'prompt_skill_source':'https://github.com/UzenUPozitiv4ik/gpt-image-2-skill/blob/main/gpt_image_2_prompt_skill.md',
  'prompt_skill_copy':'provenance/gpt_image_2_prompt_skill.md',
  'prompts':['prompts/face-a.prompt.txt','prompts/body-a.prompt.txt','prompts/body-a-safe-retry.prompt.txt'],
  'generation_requests':{'face-a':1,'body-a':2},
  'successful_assets':{'face-a':1,'body-a':1},
  'retry_authorization':'Root authorized one safer retry after output moderation failure, retaining exact initial failure record. Retry depicts only skin-material color swatches and gradients, with no anatomical drawing.'
}
(ROOT/'provenance/manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest['median_palette_rgb']))
