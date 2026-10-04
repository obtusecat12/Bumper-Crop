from pathlib import Path
p=Path('dist/tiki-garden-cast-v85.js');s=p.read_text().replace('./tiki-pose-v80.js','./tiki-garden-pose-v85.js')
a=s.index('const PROFILES =');b=s.index('\nexport const TIKI_ROLES79',a)
s=s[:a]+'''const PROFILES={footbath:{height:1.02,shoulder:1.02,waist:.96,limb:.98,head:[.98,1.03,1],jaw:1.02,nose:.56,shoe:0x5a4d36,duration:12},botanist:{height:1.00,shoulder:1.07,waist:1.11,limb:1.05,head:[1.05,.99,1.04],jaw:1.1,nose:.59,shoe:0x513725,duration:16}};
'''+s[b:]
s=s.replace("isPool=false","isPool=role==='footbath'").replace("['sleeper','barwoman','orderer','elder','asianwoman'].includes(role)","role==='footbath'")
s=s.replace("[.515+.47*j/n,.016+.467*vv]","[.015+.47*j/n,.016+.467*vv]").replace("[.018+.465*j/n,.016+.467*vv]","[.02+.44*j/n,.59+.30*vv]")
s=s.replace("const uv=(r,c)=>[.018+.465*c/6,.015+.47*(1-r/(rings.length-1))];","const uv=(r,c)=>i<2?[.035+.41*c/6,.59+.30*(1-r/(rings.length-1))]:skinUV;")
s=s.replace("if(sign===-1)quad(0,...ps,us,white,ws);else quad(0,...ps.reverse(),us.reverse(),white,ws.reverse());","if(sign===-1)quad(i<2?0:2,...ps,us,white,ws);else quad(i<2?0:2,...ps.reverse(),us.reverse(),white,ws.reverse());")
a=s.index('    else{\n      tube(rows.slice(2)');b=s.index("    part='feet'",a)
s=s[:a]+'''    else{
      tube(rows.slice(3).map(([y,rx,rz,b],i)=>({p:[sign*.108,y,0],rx:rx*.80,rz:rz*.78,w:i===0?W(hip,.4,knee):W(b)})),8,2,white,'skin');
      tube(rows.slice(0,4).map(([y,rx,rz,b],i)=>({p:[sign*.108,y,i===3?.008:0],rx:rx*profile.limb,rz:rz*profile.limb,w:i===0?W('hips',.45,hip):i===3?W(hip,.4,knee):W(b)})),8,0,white,'pants');
      part='rolledCuffs';tube([[.486,.086,.088],[.503,.088,.090],[.548,.081,.085]].map(([y,rx,rz])=>({p:[sign*.108,y,.008],rx,rz,w:W(hip,.4,knee)})),8,0,white,'pants');
    }
'''+s[b:]
s=s.replace("if(!isPool){\n    part='collar'","{\n    part='collar'")
s=s.replace("role==='sleeper'?.226:.178+.006*Math.sin(a)","role==='botanist'?.196+.012*Math.abs(Math.sin(a*2)):.180+.007*Math.sin(a)")
s=s.replace("name==='front face'?.40:.20","name==='front face'?.22:.10")
s=s.replace("function makePose(t)","function makePose(t)")
s=s.replace("levelFoot(side);","levelFoot(side,isPool?-.16:0);")
s=s.replace("let lastTick=-Infinity,disposed=false,forcedEye=null,eyeClosed=role==='sleeper';","let lastTick=-Infinity,disposed=false,forcedEye=null,eyeClosed=false,reactionStart=-Infinity;")
s=s.replace("lastTick=tick;mixer.setTime(tick/poseHz+1e-4);","lastTick=tick;const age=t-reactionStart;const clock=role==='botanist'&&age>=0&&age<3.95?12+Math.floor(age*poseHz)/poseHz:(tick/poseHz)%12;mixer.setTime(clock+1e-4);")
s=s.replace("return{group,update,dispose,diagnostics","return{react(t){reactionStart=t;lastTick=-Infinity;},group,update,dispose,diagnostics")
p.write_text(s)
