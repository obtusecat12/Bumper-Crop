from pathlib import Path
import json
import shutil
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, distance_transform_edt

ROOT = Path(__file__).resolve().parent
ASSETS = {
    'tiki_bar': {'source': 'tiki_bar_front-native.png', 'landmark_y_native': {'brow': 263, 'eyes': 388, 'nose_tip': 507, 'mouth_center': 680, 'hands_center': 1040}, 'regions_y_native': {'crown': [9,190], 'brows': [185,322], 'eyes': [320,478], 'nose': [330,552], 'mouth': [540,810], 'hands': [955,1120], 'feet': [1255,1370], 'base': [1360,1525]}},
    'tiki_mural': {'source': 'tiki_mural_front-native.png', 'landmark_y_native': {'brow': 242, 'eyes': 299, 'nose_tip': 369, 'mouth_center': 505, 'hands_center': 1140}, 'regions_y_native': {'crown': [13,210], 'brows': [197,282], 'eyes': [261,333], 'nose': [264,407], 'mouth': [404,622], 'hands': [1070,1202], 'feet': [1364,1436], 'base': [1434,1514]}}
}

def numerical_maps(im, prefix, aspect):
    sample = im.resize((512,512), Image.Resampling.LANCZOS).convert('RGBA')
    rgba = np.asarray(sample).astype(np.float32) / 255.0
    alpha = rgba[:,:,3]
    lum = rgba[:,:,0] * 0.2126 + rgba[:,:,1] * 0.7152 + rgba[:,:,2] * 0.0722
    mask = alpha > 0.5
    if not mask.all():
        indices = distance_transform_edt(~mask, return_distances=False, return_indices=True)
        lum = lum[tuple(indices)]
    low, high = np.percentile(lum[mask], [3,97])
    height = np.clip((lum-low) / max(high-low,0.05),0,1)
    height = gaussian_filter(height, sigma=1.15)
    gy, gx = np.gradient(gaussian_filter(height,sigma=1.05))
    # OpenGL tangent normal: +green points upward in the surface/image.
    nx = -gx * 5.0 / max(aspect,0.3)
    ny = gy * 5.0
    nz = np.ones_like(nx)
    normal = np.stack([nx,ny,nz],axis=-1)
    normal /= np.linalg.norm(normal,axis=-1,keepdims=True)
    normal = np.uint8(np.clip((normal*0.5+0.5)*255.0,0,255))
    a = np.uint8(alpha*255.0)
    normal[~mask] = [128,128,255]
    Image.fromarray(np.dstack([normal,a]),'RGBA').save(ROOT/f'{prefix}_normal512.png')
    rough = np.uint8(np.clip((0.82 + 0.13*(1-height))*255.0,0,255))
    rough[~mask] = 235
    Image.fromarray(np.dstack([rough,rough,rough,a]),'RGBA').save(ROOT/f'{prefix}_roughness512.png')
    height8 = np.uint8(np.clip(height*255.0,0,255))
    height8[~mask] = 128
    Image.fromarray(np.dstack([height8,height8,height8,a]),'RGBA').save(ROOT/f'{prefix}_height512.png')
    return {'size': [512,512], 'height_method': 'Diffuse luminance percentile-normalized 3–97%, Gaussian smoothed; dark carved depressions low, pale worn ridges high. Estimated detail only; no claim of measured geometry.', 'normal_convention': 'OpenGL tangent space (+Y green), derived from smoothed estimated height.', 'roughness_range': [0.82,0.95], 'alpha_preserved': True}

metadata = {}
for name, spec in ASSETS.items():
    im = Image.open(ROOT/spec['source']).convert('RGBA')
    a = np.asarray(im.getchannel('A'))
    yy, xx = np.where(a > 16)
    box = [int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)]
    x0,y0,x1,y1 = box
    bw,bh = x1-x0,y1-y0
    px,py = max(1,round(bw*0.02)),max(1,round(bh*0.02))
    cropped = Image.new('RGBA',(bw+px*2,bh+py*2),(0,0,0,0))
    cropped.paste(im.crop(tuple(box)),(px,py))
    scale = 1024/max(cropped.size)
    runtime_size = (round(cropped.width*scale),round(cropped.height*scale))
    runtime = cropped.resize(runtime_size,Image.Resampling.LANCZOS)
    runtime.save(ROOT/f'{name}_front1024.png')
    cw,ch = cropped.size
    details = {
        'native_file': spec['source'], 'native_size': list(im.size),
        'body_bbox_native_pixels_xyxy': box,
        'body_bbox_native_normalized_xyxy': [x0/im.width,y0/im.height,x1/im.width,y1/im.height],
        'bbox_alpha_threshold': 16,
        'crop_padding_pixels_xy': [px,py], 'padded_crop_size': list(cropped.size),
        'runtime_file': f'{name}_front1024.png', 'runtime_size': list(runtime_size),
        'body_bbox_runtime_normalized_xyxy': [px/cw,py/ch,(px+bw)/cw,(py+bh)/ch],
        'body_aspect_width_over_height': bw/bh,
        'landmark_y_native_pixels': spec['landmark_y_native'],
        'landmark_y_native_normalized': {k:v/im.height for k,v in spec['landmark_y_native'].items()},
        'landmark_y_body_normalized': {k:(v-y0)/bh for k,v in spec['landmark_y_native'].items()},
        'landmark_y_runtime_normalized': {k:(v-y0+py)/ch for k,v in spec['landmark_y_native'].items()},
        'regions_y_runtime_normalized': {k:[(v[0]-y0+py)/ch,(v[1]-y0+py)/ch] for k,v in spec['regions_y_native'].items()},
        'coordinates': 'Image y increases downward. Mesh y normalized upward is 1 minus these values. Landmarks estimated visually from native generated front.',
    }
    details['derived_maps'] = numerical_maps(cropped,name,bw/bh)
    metadata[name]=details

wood = Image.open(ROOT/'carved_weathered_wood-native.png').convert('RGB')
wood.resize((1024,1024),Image.Resampling.LANCZOS).save(ROOT/'carved_weathered_wood1024.png')
wood_rgba=wood.convert('RGBA')
metadata['carved_weathered_wood']={'native_size':list(wood.size),'runtime_size':[1024,1024],'runtime_file':'carved_weathered_wood1024.png','derived_maps':numerical_maps(wood_rgba,'carved_weathered_wood',1.0)}
arr=np.asarray(wood).astype(np.float32)
metadata['carved_weathered_wood']['edge_mean_rgb_difference']={'left_right':float(np.abs(arr[:,0]-arr[:,-1]).mean()),'top_bottom':float(np.abs(arr[0]-arr[-1]).mean())}
(ROOT/'sculpture_asset_metadata.json').write_text(json.dumps(metadata,indent=2)+'\n')
print(json.dumps({k:{'runtime_size':v['runtime_size'],'body_bbox':v.get('body_bbox_native_normalized_xyxy'),'landmarks_runtime':v.get('landmark_y_runtime_normalized'),'wood_edge_difference':v.get('edge_mean_rgb_difference')} for k,v in metadata.items()},indent=2))
