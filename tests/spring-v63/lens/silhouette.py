"""Measure the broad head's left contour against its exact circular footprint."""
import json,pathlib,sys,tempfile
import numpy as np
D=pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else pathlib.Path(tempfile.gettempdir())/'level10-lens-v63'
result={}
for name,w,h,level in [('before',256,128,.4725),('after',1024,512,.5)]:
    coverage=np.fromfile(D/(name+'.bin'),np.uint8).reshape(h,w,4)[:,:,3]/255
    errors=[]
    for y in np.linspace(.48,.535,100):
        iy=y*h-.5;j=int(np.floor(iy));t=iy-j
        row=coverage[j]*(1-t)+coverage[j+1]*t
        crossings=np.where((row[:-1]<level)&(row[1:]>=level))[0]
        crossings=crossings[(crossings/w>.32)&(crossings/w<.42)]
        assert len(crossings),f'Missing {name} contour at y={y}'
        k=crossings[-1]
        x=(k+.5+(level-row[k])/(row[k+1]-row[k]))/w
        expected=.42-.072/2*np.sqrt(1-((y-.47)/.072)**2)
        errors.append((x-expected)*1440)
    result[name]={'horizontal_silhouette_rms_error_internal_pixels':float(np.sqrt(np.mean(np.array(errors)**2))),
                  'max_absolute_error':float(max(abs(np.array(errors)))),'sample_rows':len(errors)}
assert result['after']['horizontal_silhouette_rms_error_internal_pixels']<.15
assert result['after']['max_absolute_error']<.30
(D/'silhouette-error.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
