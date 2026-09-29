import * as T from './vendor/three.module.min.js';
import {UrbanBatch} from './urban-batch.js?v=58';
import {CITY_ORIGIN,CITY_ANGLE} from './urban-layout.js?v=58';
import {EXIT_CITY_Y} from './exit-route.js?v=58';
import {APPROACH_GROUND_QUADS,TRANSITION_TERRAIN_QUADS,CLINIC_GROUND_POLYGON,DISTRICT_GROUND_POLYGONS,subtractConvex,FABRIC_GROUND_POLYGON} from './urban-ground-ownership.js?v=58';
// Permanent ground exists during the walking transition as well as after Level 11.
// Procedural blocks and the rural terrain both surrender this exact ownership polygon.
export function createLandmarkGround(mats){const b=new UrbanBatch(mats);b.push(CITY_ORIGIN.x,EXIT_CITY_Y,CITY_ORIGIN.z,CITY_ANGLE);let pieces=[FABRIC_GROUND_POLYGON.map(([x,z])=>[x,0,z])];for(const shape of[...TRANSITION_TERRAIN_QUADS,...APPROACH_GROUND_QUADS,CLINIC_GROUND_POLYGON,...DISTRICT_GROUND_POLYGONS])pieces=pieces.flatMap(p=>subtractConvex(p,shape));for(const p of pieces){const pos=[];for(let k=1;k<p.length-1;k++)pos.push(...p[0],...p[k],...p[k+1]);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.computeVertexNormals();b.add(g,'asphalt',0,0,0);g.dispose();}b.pop();return{object:b.finish('Landmark ground / permanent clipped street owner'),walks:[],colliders:[]};}
