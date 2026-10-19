# V134-blender-water-room: Indoor Tide Garden light rig for bake134.py (ref files/uploads/ref-waterroom-1019.webp)
# Dim room, a few cool-white recessed lights, cyan pool-floor light in the fountain, coloured globes/path lamps as the
# real emitters (emissive meshes, no new lamps), warm entrance kept low.
import math
BOUNCES=4;CLAMP_INDIRECT=6.0;WORLD=(0.0015,0.0018,0.002)
K=4.0          # overall rig gain (three intensity -> Blender W)
CEIL=0.40      # ceiling recessed fixtures (cool white)
CYAN=8.0       # fountain pool-floor light
GLOBE=45.0     # radiance multiplier for the frosted opal globes (emissive mesh lights)
PATH=90.0      # radiance multiplier for the coloured path-lamp domes
FOUNTAIN=(4.75,1.40)
def emit(m):
    e=m['emit'];n=m['mname']
    if 'Frosted opal pathLamp' in n:return [x*PATH for x in e]
    if 'Frosted opal' in n:return [x*GLOBE for x in e]
    if 'amber practical' in n:return [x*3 for x in e]
    return list(e)
CLEAR=('glass','refraction','water','liquid','ice','splash','window','meniscus','cocktail','tumbler','drink','bottle','pond','bubbler','spray','foam','plastic','ssr')
def skip_occ(m):return False
def clear_occ(m):
    s=(m['name']+' '+m['mname']).lower();return m['opacity']<.95 or any(k in s for k in CLEAR)
def near(p,x,z,r=.3):return math.hypot(p[0]-x,p[2]-z)<r
def lights(L):
    out=[];cool=lambda c:[c[0]*.86,c[1]*.95,c[2]*1.06]
    for l in L:
        t=l['type'];p=l.get('p');c=l['c'];I=l['i']
        if t=='RectAreaLight':
            if p[1]>6.5:out.append(dict(kind='AREA',p=p,c=cool(c),power=math.pi*l['w']*l['h']*I*CEIL*K,w=l['w'],h=l['h'],dir=l['n']))
            elif near(p,-5.4,4.65):out.append(dict(kind='AREA',p=p,c=c,power=math.pi*l['w']*l['h']*I*.35*K,w=l['w'],h=l['h'],dir=l['n']))
            # ceiling bounce / pond bounce fakes dropped: Cycles does the real bounce
        elif t=='PointLight':
            if near(p,*FOUNTAIN):
                if p[1]<.3:  # pool-floor light: four soft lamps on the basin bed around the nozzle
                    for a in range(4):
                        q=[FOUNTAIN[0]+.85*math.cos(a*math.pi/2+.4),-.30,FOUNTAIN[1]+.85*math.sin(a*math.pi/2+.4)]
                        out.append(dict(kind='POINT',p=q,c=c,power=4*math.pi*I*CYAN*K/4,radius=.12))
                else:out.append(dict(kind='POINT',p=p,c=c,power=4*math.pi*I*5.0*K,radius=.3))
            elif p[1]<1.0:pass  # globe lights -> the emissive globe meshes carry them
            elif p[1]<2.3 and p[2]<0:out.append(dict(kind='POINT',p=p,c=c,power=4*math.pi*I*.35*K,radius=.1))  # parasol bulbs
            else:out.append(dict(kind='POINT',p=p,c=c,power=4*math.pi*I*.6*K,radius=.08))  # entrance recess/hood
        elif t=='SpotLight':
            dv=[l['t'][k]-p[k] for k in range(3)]
            out.append(dict(kind='SPOT',p=p,c=cool(c),power=4*math.pi*I*.22*K,radius=.1,size=2*l['angle'],blend=l['pen'],dir=dv))
    return out
