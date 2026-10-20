# V136-atm-lobby light rig for bake134.py: sunset glazing (east area lights + emissive sky backdrop), atrium skylight,
# warm downlights (points) and cove strips (emissive). Lights come pre-placed from atm136-geo.js buildLobby136().lights.
BOUNCES=4;CLAMP_INDIRECT=8.0;WORLD=(0.02,0.018,0.016);SMOOTH=1
K=1.0;SKY=2.2;COVE=6.0;LAMP=14.0;SKYLIGHT=3.0
def emit(m):
    e=m['emit'];k=m['key']
    s={'sky':SKY,'cove':COVE,'lamp':LAMP,'skylight':SKYLIGHT,'street':1.6}.get(k,1)
    return [x*s for x in e]
def skip_occ(m):return False
def clear_occ(m):return m['key'] in('glass','door')
def lights(L):
    out=[]
    for l in L:
        q=dict(l);q['power']=l['power']*K
        out.append(q)
    return out
