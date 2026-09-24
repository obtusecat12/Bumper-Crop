import fs from 'node:fs';import {spawnSync} from 'node:child_process';import * as T from '../../dist/vendor/three.module.min.js';
const dir='/tmp/level10-v31';for(const path of ['tests/water-v29/export-fixtures.mjs','tests/water-v31/export-optics.mjs']){const p=spawnSync(process.execPath,[path],{env:{...process.env,V28_FIXTURE_DIR:dir},stdio:'inherit'});if(p.status)process.exit(p.status);}
const f=JSON.parse(fs.readFileSync(dir+'/lake-fixture.json'));
for(const [label,h,pitch] of [['splash-first-person-above',.10,-.12],['splash-first-person-below',-.16,.40]]){
 const c=new T.PerspectiveCamera(72,4/3,.01,480);c.position.set(-103,f.level+h,32);c.rotation.set(pitch,0,0,'YXZ');c.updateMatrixWorld();f.cameras.push({label,eye:c.position.toArray(),projection:c.projectionMatrix.elements,view:c.matrixWorldInverse.elements,world:c.matrixWorld.elements,inverseProjection:c.projectionMatrixInverse.elements});
}
fs.writeFileSync(dir+'/lake-fixture.json',JSON.stringify(f));
