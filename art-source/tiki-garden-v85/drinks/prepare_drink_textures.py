from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np
import json, shutil

OUT=Path(__file__).parent
SRC=OUT.parents[1]/'generated_images'
sources={
    'garnish-atlas':'exec-0efb3588-dbf9-442d-8c91-f8b95b27243f.png',
    'falernum-fizz':'exec-092ea0f5-aca4-49d9-b470-4ddbd09c881a.png',
    'mai-tai-breeze':'exec-a7b34fdf-041e-4546-a64c-4e638b6e6d4d.png',
    'coconut-atlas':'exec-f1fc5d66-4561-46d5-a215-e1f4c2d11bda.png',
    'coast-lightbox':'exec-498ee25b-afdc-413f-be9e-55f74f4dc4d3.png',
}

def runtime(im, name, edge=1024):
    w,h=im.size
    size=(round(w*edge/max(w,h)),round(h*edge/max(w,h)))
    im=im.resize(size,Image.Resampling.LANCZOS)
    im.save(OUT/f'{name}-basecolor.webp',quality=94,method=6,exact=True)
    return im

def derived(im,name,kind):
    w,h=im.size
    small=im.convert('RGB').resize((round(w*512/max(w,h)),round(h*512/max(w,h))),Image.Resampling.LANCZOS)
    rgb=np.asarray(small,dtype=np.float32)/255
    lum=rgb@np.array([.2126,.7152,.0722],dtype=np.float32)
    smooth=np.asarray(small.convert('L').filter(ImageFilter.GaussianBlur(1.0)),dtype=np.float32)/255
    grain=lum-smooth
    if kind=='ceramic':
        # Light cream relief is raised; teal glaze varies in finish against matte terra cotta.
        teal=(rgb[:,:,1]+rgb[:,:,2])*.5-rgb[:,:,0]
        relief=.64*smooth+.36*lum
        rough=np.clip(.85-.16*np.clip(teal*3,0,1)+grain*.32,.60,.95)
        strength=4.0
    elif kind=='paper':
        ink=np.clip((rgb[:,:,1]-rgb[:,:,0])*.9+(1-lum)*.6,0,1)
        relief=ink*.1+grain*.55
        rough=np.clip(.88-ink*.20+grain*.20,.62,.96)
        strength=1.4
    else:
        relief=.3*smooth+.7*lum
        rough=np.clip(.88+grain*.35-.07*lum,.70,.97)
        strength=3.0
    gy,gx=np.gradient(relief)
    vec=np.stack([-gx*strength,gy*strength,np.ones_like(gx)],axis=-1)
    vec/=np.linalg.norm(vec,axis=-1,keepdims=True)
    normal=((vec*.5+.5)*255).round().astype('uint8')
    Image.fromarray(normal,'RGB').save(OUT/f'{name}-normal.webp',quality=96,method=6)
    Image.fromarray((rough*255).round().astype('uint8'),'L').save(OUT/f'{name}-roughness.webp',quality=96,method=6)

manifest={'maps':{},'uvConvention':{'rectPx':'[x0,y0,x1,y1], upper-left image origin, exclusive x1/y1','rectUVTopLeft':'[u0,v0,u1,v1], upper-left image origin','rectUVThree':'[u0,v0,u1,v1], lower-left UV origin (normal THREE.Texture flipY=true)','normalMaps':'tangent-space +Y/OpenGL; no color-space transform','basecolor':'sRGB; true alpha is retained in garnish atlas','derivedMaps':'estimated from photographic basecolor, no generated geometry'},'generation':'five independent built-in image_gen calls; originals and exact prompts preserved'}
images={}
for name,fn in sources.items():
    shutil.copy2(SRC/fn,OUT/f'{name}-original.png')
    original=Image.open(SRC/fn)
    image=runtime(original,name)
    images[name]=original
    manifest['maps'][name]={'original':f'{name}-original.png','basecolor':f'{name}-basecolor.webp','size':list(image.size)}
    if name in ['falernum-fizz','mai-tai-breeze']:
        derived(original,name,'paper' if name=='falernum-fizz' else 'ceramic')
        manifest['maps'][name].update({'normal':f'{name}-normal.webp','roughness':f'{name}-roughness.webp','derivedSize':[512,256]})

garnish_rects={
    'orange_wheel':[0,124,501,625],
    'cherry_strawberry':[485,97,921,626],
    'mint_leaf':[925,98,1254,629],
    'parasol_pink_top':[0,651,459,1118],
    'parasol_lime_top':[452,651,900,1118],
    'citrus_pulp':[898,700,1254,1083],
}

def coordinates(rect,w,h):
    x0,y0,x1,y1=rect
    return {'rectPx':rect,'rectUVTopLeft':[x0/w,y0/h,x1/w,y1/h], 'rectUVThree':[x0/w,1-y1/h,x1/w,1-y0/h]}

manifest['garnishAtlas']={'texture':'garnish-atlas-basecolor.webp','size':[1024,1024],'assets':{}}
for name,rect in garnish_rects.items():
    runtime_rect=[round(c*1024/1254) for c in rect]
    entry=coordinates(runtime_rect,1024,1024)
    entry['sourceRectPx']=rect
    manifest['garnishAtlas']['assets'][name]=entry
    # Individual crops are provided for simple mesh materials with UV range 0..1.
    runtime(images['garnish-atlas'].crop(rect),name)
    entry['individualTexture']=f'{name}-basecolor.webp'

coconut_rects={'coconut_peel':[0,0,945,1024],'coconut_top':[946,181,1536,914]}
manifest['coconutAtlas']={'texture':'coconut-atlas-basecolor.webp','size':[1024,683],'assets':{}}
for name,rect in coconut_rects.items():
    runtime_rect=[round(rect[0]*1024/1536),round(rect[1]*683/1024),round(rect[2]*1024/1536),round(rect[3]*683/1024)]
    manifest['coconutAtlas']['assets'][name]=coordinates(runtime_rect,1024,683)
    manifest['coconutAtlas']['assets'][name]['sourceRectPx']=rect
    crop=images['coconut-atlas'].crop(rect)
    runtime(crop,name)
    derived(crop,name,'fiber')
    manifest['coconutAtlas']['assets'][name].update({'individualTexture':f'{name}-basecolor.webp','normal':f'{name}-normal.webp','roughness':f'{name}-roughness.webp'})

manifest['garnishAtlas']['alphaRange']=list(Image.open(OUT/'garnish-atlas-basecolor.webp').getchannel('A').getextrema())
manifest['garnishAtlas']['notes']='Parasol crops include real radial paper fold ribs and visible central peg. Cherry and strawberry share one cutout region. Use alphaTest about 0.04 for foliage/fruit silhouettes.'
(OUT/'uv-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'directory':str(OUT),'files':len(list(OUT.glob('*'))),'garnishAlpha':manifest['garnishAtlas']['alphaRange'],'garnishRectangles':{name:v['rectPx'] for name,v in manifest['garnishAtlas']['assets'].items()}},indent=2))
