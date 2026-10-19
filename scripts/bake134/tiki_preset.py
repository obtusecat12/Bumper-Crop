import math
BOUNCES=4;CLAMP_INDIRECT=4.0;WORLD=(0.004,0.0035,0.003)
GAIN=5.6  # 亮一点: ~4x the V133 rig strength lands at mean luma ~1.1-1.3x the old exposure
BULB=3.0
def emit(m):
    e=m['emit']
    return [x*BULB for x in e] if max(e)>.15 else [x for x in e]
CLEAR=('glass','refraction','water','liquid','ice','splash','window','meniscus','cocktail','tumbler','drink','bottle','pond')
def skip_occ(m):return False
def clear_occ(m):
    s=(m['name']+' '+m['mname']).lower();return m['opacity']<.95 or any(k in s for k in CLEAR)
def lights(L):
    out=[]
    for l in L:
        c=l['c']
        if l['type']=='PointLight':out.append(dict(kind='POINT',p=l['p'],c=c,power=4*math.pi*l['i']*GAIN,radius=.06))
        elif l['type']=='SpotLight':
            dv=[l['t'][k]-l['p'][k] for k in range(3)]
            out.append(dict(kind='SPOT',p=l['p'],c=c,power=4*math.pi*l['i']*GAIN,radius=.08,size=2*l['angle'],blend=l['pen'],dir=dv))
        elif l['type']=='RectAreaLight':
            out.append(dict(kind='AREA',p=l['p'],c=c,power=math.pi*l['w']*l['h']*l['i']*0.45*GAIN,w=l['w'],h=l['h'],dir=l['n']))
    return out
