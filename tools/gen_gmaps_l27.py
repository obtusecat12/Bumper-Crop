# V127: dist/gmaps-l27.css = dist/gmaps-ui.css with the Level 11 scope swapped to Level 27.
import os
D=os.path.join(os.path.dirname(__file__),'../dist')
s=open(os.path.join(D,'gmaps-ui.css')).read()
out='/* V127 · Level 27 wears the Level 11 2009 web-map HUD. GENERATED from gmaps-ui.css by bc/tools/gen_gmaps_l27.py - do not edit. */\n'+s.replace(':root[data-ui-level="11"]',':root[data-ui-level="27"]').split('\n',2)[2]
out=out.replace('.gm-top,.gm-head,.gm-bar,.gm-side,.gm-ctl,.gm-types,.gm-foot,.gm-copy,.gm-vitals{display:none}\n','')
open(os.path.join(D,'gmaps-l27.css'),'w').write(out)
