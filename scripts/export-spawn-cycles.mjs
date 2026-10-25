import fs from 'node:fs';
import * as layout from '../dist/level0-spawn117.js';
import {SPAWN_LOOK} from '../dist/level0-spawn-look.js';
fs.mkdirSync('art-source/level0-spawn-cycles',{recursive:true});
fs.writeFileSync('art-source/level0-spawn-cycles/layout.json',JSON.stringify({...layout,look:SPAWN_LOOK},null,2));
