import {warmBath73} from './bath-warmup-v73.js';
import {initializeReceptionTextures73} from './reception-materials-v73.js';
import {createBathLoading,nextPaint} from './bath-loading-v72.js';
import {initializeChangingTextures} from './changing-materials-v72.js';
import {atBathExit,inChanging} from './bathhouse-plan-v72.js';
import {LookInput} from './look-input-v69.js';
import {initializeCornerTextures} from './backcourt-materials-v71.js';
import {initializeVendingTextures} from './vending-materials-v70.js';
import {vendingDrinkName} from './vending-drinks-v70.js';
import {SHOWER_HEADS} from './bathhouse-layout.js?v=73';
import {initializeSpaTextures} from './spa-materials-v66.js';
import {inSpaWater} from './spa-layout-v66.js';
import {createShowerAudio} from './bath-v62-audio.js?v=62';
import {initializeCanTextures} from './canned-food.js?v=60';
import {initializeSpringTextures} from './level27-materials.js?v=63';
import {createLevel27} from './level27-scene.js?v=69';
import {initializeSpringNPCs} from './level27-npcs-v69.js';
import {SpringSession,springFloor,resolveSpring,springCanExit,inPool} from './level27-layout.js?v=68';
import {nearBathEntrance} from './level27-entry.js?v=61';
import {initializeBathTextures} from './bath-textures.js?v=62';
import {prepareBathhouse} from './bathhouse-scene.js?v=73';
import {BATH_ARRIVAL,bathFloor,resolveBath,bathShowerAt,bathUnderShower} from './bathhouse-layout.js?v=73';
import {initializeAdvertising} from './advertising-assets.js?v=60';
import {initializeDistrictTextures} from './clinic-district-materials.js?v=60';
import {exitForField,exitTeleport,exitPoint,transitionProgress,ease} from './exit-route.js?v=60';
import {initializeExitTextures} from './exit-textures.js?v=60';
import {initializeReferenceTextures} from './reference-materials.js?v=60';
import {initializeUrbanAssets} from './urban-assets.js?v=60';
import {referenceEnvironment} from './reference-scenes.js?v=60';
import {createExitScene} from './exit-scene.js?v=71';
import {ExitAudio} from './exit-audio.js?v=60';
import {initializeAlmondTextures,hydrateAlmondPickups,releaseAlmondBottle,almondVariant} from './almond-water-assets.js?v=60';
import {createRuralPowerNetwork} from './rural-power-render.js?v=60';
import {initializePowerTextures} from './rural-power-materials.js?v=60';
import {initializeVergeTextures} from './verge-cards.js?v=60';
import {createSceneBatches} from './scene-batches.js?v=60';
import {updateCropGroundTime} from './ground.js?v=60';
import {bindTroughWater} from './trough-water.js?v=60';
import {createWaterPipeline} from './water-pipeline.js?v=70';
import {WaterState} from './water-state.js?v=60';
import {WaterContactEffects} from './water-contact-effects.js?v=60';
import {createWaterBubbles} from './water-bubbles.js?v=60';
import {HandheldCameraRig,angleDelta} from './handheld-camera.js?v=60';
import {WeatherDirector,WEATHER_LABELS} from './weather-state.js?v=60';
import {createRainRenderer} from './rain-render.js?v=60';
import {weatherSurface} from './weather-surfaces.js?v=60';
import {createWetGround} from './wet-ground.js?v=60';
import {createWeatherFlare} from './weather-flare.js?v=60';
import {initializeWeatherTextures} from './weather-textures.js?v=60';
import {createWaterImpact} from './water-impact.js?v=60';
import {createWaterRipples} from './water-ripples.js?v=60';
import {createLensWater} from './lens-water.js?v=63';
import {barnTarget,barnFootprintDistance,REFERENCE_BARN} from './reference-barn-layout.js?v=60';
import {updateBarnDoors} from './reference-barn.js?v=60';
import {initializeLandmarkTextures} from './landmark-textures.js?v=60';
import {loadInstrumentParts} from './retro-instruments.js?v=60';
import {createUIRaster} from './ui-raster.js?v=60';
import {survivalMarkup,createSurvivalDisplay} from './survival-hud.js?v=60';
import {createUIThemes} from './ui-themes.js?v=60';
import {createMaterialFinish} from './material-finish.js?v=71';
import {createRuralShadows} from './rural-shadows.js?v=60';
import {createIrradianceField} from './irradiance-field.js?v=60';
import {createDisplayFilter,displaySize,displayFrame,FILTERS} from './display-filter.js?v=63';
import {farmViewTarget,photoCorridorTiles} from './photo-view.js?v=60';
import {createPerformanceMeter} from './performance-meter.js?v=60';
import {createChunkStream} from './world-stream.js?v=60';
import * as T from './vendor/three.module.min.js';
import {compoundAt,CHUNK,field,cropSample,height,surfaceHeight,buildingSize,buildingLocal,BUILDING_NAMES,pondDistance,pondShoreDistance,roadDistance,vegetationDrag,resolveSolid,rebase,stringSeed} from './world.js?v=60';
import {createChunkTask,disposeChunk,wind,waterTime} from './models.js?v=60';
import {createWheatDetailLayer,initializeCerealTextures,releaseCerealGPU,resumeCerealGPU} from './dense-wheat.js?v=60';
import {createAtmosphere} from './atmosphere.js?v=60';
import {findNearestLandmark,findSafeLanding,applyTeleport,createMapTarget} from './developer-tools.js?v=60';
import {initializeRuralTextures} from './rural-textures.js?v=60';
import {createNavigationMap} from './map-ui.js?v=66';

const $=s=>document.querySelector(s),game=$('#game');
game.innerHTML=`
<main class="screen" id="menu">
 <header class="topline"><span>THE BACKROOMS</span><span class="tape-mode">FIELD RECORD / <span data-ui-copy="number">010</span></span></header>
 <div class="hero" data-ui-part="menu"><div class="title-window"><p class="eyebrow" id="eyebrow">EXPLORATION</p><h1 class="level" data-ui-copy="code">LEVEL 10</h1><h2 class="cn-title" data-ui-copy="name">丰裕</h2><div class="subtitle" data-ui-copy="subtitle">ABUNDANCE</div></div>
 <nav class="menu" aria-label="主菜单"><button class="menu-button primary selected" id="start" disabled><span>正在进入麦田</span><small>…</small></button><button class="menu-button" id="open-settings"><span>游戏设置</span></button><button class="menu-button" id="open-journal"><span>层级档案</span></button><button class="menu-button" id="open-controls"><span>操作说明</span></button><button class="menu-button" id="open-developer"><span>开发者模式</span></button></nav></div>

 <div class="loading" id="loading">LOADING <span id="load-number">0%</span><div class="loading-track"><i id="load-bar"></i></div></div>
 <footer class="bottomline"><span class="desktop-hint"><kbd class="key">↑ ↓</kbd>选择　 <kbd class="key">ENTER</kbd>确定</span><span class="mobile-hint">轻触选项进入</span><span><kbd class="key">ESC</kbd>返回</span></footer>
</main>
<div class="hud" id="hud" data-ui-part="hud" hidden><div class="hud-top"><div class="hud-actions"><button id="pause-button" aria-label="暂停游戏">ESC 暂停</button><button id="developer-button" class="developer-hud" hidden>F2 开发者</button><span id="fps" class="fps" hidden></span></div><span id="location" class="location-text" hidden></span><span id="weather-label" hidden></span><b id="bearing" hidden>N 000°</b></div>
 <div class="crosshair"></div><div class="interact" id="interact" hidden></div><div class="toast" id="toast" role="status"></div>
 <div class="hud-bottom">${survivalMarkup()}<div class="key-hints"><span><kbd class="key">E</kbd>拾取</span><span><kbd class="key">Q</kbd>饮用</span><span><kbd class="key">F</kbd>地图</span><span><kbd class="key">Z</kbd>变焦</span><span><kbd class="key">J</kbd>档案</span></div></div></div>
<div class="touch-ui" id="touch" data-ui-part="touch" hidden><div class="joystick" id="joystick"><div class="stick" id="stick"></div></div><div class="touch-actions"><button id="touch-zoom" aria-label="切换镜头变焦">1×</button><button id="touch-run" aria-label="奔跑">跑</button><button id="touch-jump" aria-label="跳跃">跃</button><button id="touch-use" aria-label="拾取">E</button><button id="touch-drink" aria-label="饮水">Q</button></div></div>
<div class="modal" id="settings" data-ui-part="settings" role="dialog" aria-modal="true" aria-labelledby="settings-title" hidden><div class="panel"><div class="panel-header"><h2 id="settings-title">画面与声音</h2><button class="close" data-close aria-label="关闭">×</button></div>
 <label class="setting"><span>画面质量<small>控制麦田细节与远景密度</small></span><select id="quality"><option value="high">精细</option><option value="balanced">均衡 · 推荐</option><option value="low">流畅</option></select></label>
 <label class="setting"><span>画面滤镜<small>720p 内部渲染 · 1080p 输出</small></span><select id="filter"><option value="vhs">VHS · 1080P（默认）</option><option value="pixel">像素锯齿 · 原版</option><option value="ps1">PS1 · 320P</option><option value="native">清晰 · 无滤镜</option></select></label>
 <label class="setting"><span>视野 <b id="fov-value">72°</b></span><input id="fov" type="range" min="55" max="95" step="1" value="72"></label>
 <label class="setting"><span>鼠标灵敏度</span><input id="sensitivity" type="range" min="20" max="180" value="75"></label>
 <label class="setting"><span>环境音量</span><input id="volume" type="range" min="0" max="100" value="65"></label>
 <label class="setting"><span>手持摄像机运动</span><input id="bob" type="checkbox" checked></label>
 <label class="setting"><span>显示帧率</span><input id="showfps" type="checkbox"></label>
 <label class="setting"><span>开发者模式<small>F2 打开天气、传送与坐标</small></span><input id="devMode" type="checkbox"></label>
 <div class="panel-note">VHS 以 720 行处理并放大输出为 1080p、4:3 录像画面；PS1 为 320 行复古色阶。设置自动保存在当前浏览器。</div>
</div></div>
<div class="modal" id="journal" data-ui-part="journal" role="dialog" aria-modal="true" aria-labelledby="journal-title" hidden><div class="panel"><div class="panel-header"><h2 id="journal-title">层级档案 / <span data-ui-copy="number">010</span></h2><button class="close" data-close aria-label="关闭">×</button></div><div class="journal-meta">M.E.G. FIELD NOTES · <span data-ui-copy="name">丰裕</span></div><div class="journal-body"><p><strong>你正站在一片没有尽头的麦田。</strong><br>树木与高度近似的灌木将麦田分割成小块。天空始终阴沉，偶有短暂细雨与雾气，白昼从未结束。</p><p>沿着两条轮胎碾痕前行。中间的草仍在生长，但车辙里的种子永远不会发芽。这里没有被发现过的车辆。</p><p>低地的湖水清澈，带有泥土的气味。靠近湖岸时，可按 <strong>E</strong> 饮水。</p><p>谷仓、马厩和木棚大多空无一人。里面偶尔能找到木料、钉子和遗落的杏仁水。每次拾取会把容器移到眼前检视。移动鼠标或滑动旋转，按 <strong>E</strong> 收起，按 <strong>Q</strong> 饮用，按 <strong>R</strong> 再次检视。</p><p>麦丛会拖慢脚步。回到小径可以更快前进。没有任务期限，沿着风走下去。</p><p>出生点东北侧有一处固定农场。按 <strong>F2</strong> 可前往两处照片机位；移动或环顾即可恢复探索镜头。</p><p class="reference-credit">农场影像参考：Edmund Garman，<a href="https://www.flickr.com/photos/3cl/3718833796" target="_blank" rel="noopener noreferrer">Kephart Farm</a> / <a href="https://www.flickr.com/photos/3cl/3719218226" target="_blank" rel="noopener noreferrer">Kephart Farm 2</a>，2009，<a href="https://creativecommons.org/licenses/by/2.0/" target="_blank" rel="noopener noreferrer">CC BY 2.0</a>。场景为依据照片重新制作的三维重建。</p><p class="reference-credit">杏仁水设定：<a href="https://backrooms-wiki.wikidot.com/object-1" target="_blank" rel="noopener noreferrer">Object 1 — Almond Water</a>，The Backrooms Wikidot，原作 1000dumplings、修订 Natedagreat563 与 Poliacci，<a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 3.0</a>。金属保温瓶依据文献重建；复古饮料瓶、弹珠瓶、收腰汽水瓶与深色试剂瓶为本场景的美术变体，标签均标注 ALMOND WATER。标签与材质为新制作。</p></div><div class="panel-note" id="expedition">尚未开始探索。</div></div></div>
<div class="modal" id="controls" data-ui-part="controls" role="dialog" aria-modal="true" aria-labelledby="controls-title" hidden><div class="panel"><div class="panel-header"><h2 id="controls-title">操作指南</h2><button class="close" data-close aria-label="关闭">×</button></div><div class="controls-list"><div><span class="key">W A S D</span>移动</div><div><span class="key">鼠标</span>环顾四周</div><div><span class="key">Z / 右键</span>按住拉近镜头</div><div><span class="key">滚轮</span>调节变焦倍率 · 1–4.5×</div><div><span class="key">SHIFT</span>按住奔跑</div><div><span class="key">SPACE</span>跳跃</div><div><span class="key">C</span>按住蹲下</div><div><span class="key">E</span>拾取 / 淋浴调温与闭眼 / 泉中坐下</div><div><span class="key">Q</span>饮用饮料</div><div><span class="key">R</span>检视背包中的饮料</div><div><span class="key">J</span>层级档案</div><div><span class="key">ESC</span>暂停 / 释放鼠标</div><div><span class="key">F</span>地图 / 点击传送</div><div><span class="key">F10</span>切换全屏</div><div><span class="key">F2</span>开发者天气 / 传送</div></div><div class="panel-note">点击「进入麦田」后即可用鼠标观察。若浏览器不允许锁定鼠标，按住鼠标拖动也可以环顾。触屏设备使用左侧摇杆移动、右侧滑动观察。</div></div></div>`;

game.insertAdjacentHTML('beforeend',`<div class="modal" id="developer" data-ui-part="developer" role="dialog" aria-modal="true" aria-labelledby="developer-title" hidden><div class="panel developer-panel" tabindex="-1"><div class="panel-header"><h2 id="developer-title">开发者模式 / F2</h2><button class="close" data-close aria-label="关闭">×</button></div><p class="developer-caption">地标传送</p><div class="developer-actions"><button data-teleport="pond">最近的湖泊</button><button data-teleport="building">最近的建筑</button><button data-teleport="grove">最近的树林</button><button data-teleport="farm-a">农场 · 照片一机位</button><button data-teleport="farm-b">农场 · 照片二机位</button><button data-teleport="barn">砖砌谷仓</button><button data-teleport="barn-photo">谷仓 · 照片机位</button><button data-teleport="city-exit">Level 11 出口小径 · 约 503 m</button><button data-teleport="photo-hope">图一 · Hope St 照片机位</button><button data-teleport="photo-clinic">图二 · 诊所与糕点房机位</button><button data-teleport="city-edge">Level 11 · 商业边缘区</button><button data-teleport="city-core">Level 11 · 金融街峡谷</button><button data-teleport="city-plaza">Level 11 · 棕榈喷泉广场</button><button data-teleport="city-vending">Level 11 · 瀑布售货机与候座</button><button data-teleport="city-bath">Level 27 入口 · 热水浴室</button><button data-teleport="city-ad">Level 11 · ECHO 服装广告</button><button data-teleport="start">返回初始小径</button></div><div class="developer-status" id="developer-status" role="status" aria-live="polite">选择目的地，抵达后自动继续探索。</div><dl class="developer-coordinates"><div><dt>区块</dt><dd id="developer-cell">0 / 0</dd></div><div><dt>位置</dt><dd id="developer-position">—</dd></div></dl><p class="developer-caption">本机性能 / V43</p><div class="developer-status" id="developer-performance">正在采样…</div><div class="panel-note">传送会落在湖岸或建筑外侧。F2 再次打开此面板；移动端也可从暂停菜单进入。</div></div></div>`);

$('#developer .developer-caption').insertAdjacentHTML('beforebegin',`<p class="developer-caption">天气与异常</p><div class="developer-actions"><button data-weather="rain">触发下雨</button><button data-weather="fog">触发浓雾</button><button data-weather="blackout">天空断电</button><button data-weather="wallpaper">重复蓝天</button><button data-weather="sunbreak">晴空转黄昏</button><button data-weather="normal">恢复正常天气</button></div><div class="developer-status" id="weather-status">阴天 · 概率按每轮天气判定</div>`);
const instrumentParts=await loadInstrumentParts();
const survivalDisplay=createSurvivalDisplay(game,instrumentParts);survivalDisplay.update(100,100,0);
const touchDevice=matchMedia('(pointer:coarse)').matches,reduceCameraMotion=matchMedia('(prefers-reduced-motion:reduce)');
document.body.classList.toggle('touch-mode',touchDevice);
let settings={quality:touchDevice?'low':'balanced',filter:'vhs',fov:72,sensitivity:75,volume:65,bob:!matchMedia('(prefers-reduced-motion:reduce)').matches,showfps:false,devMode:false};
try{const saved=JSON.parse(localStorage.getItem('level10.preferences.v1')||'null');if(saved&&typeof saved==='object')settings={...settings,...saved}}catch{}
settings.devMode=settings.devMode===true;
if(!FILTERS.includes(settings.filter))settings.filter='vhs';
delete settings.retro;
if(!['high','balanced','low'].includes(settings.quality))settings.quality='balanced';
let renderer;
try{renderer=new T.WebGLRenderer({antialias:false,powerPreference:'high-performance',alpha:false});renderer.setPixelRatio(1);renderer.domElement.className='scene';renderer.domElement.setAttribute('aria-label','Level 10 三维麦田');game.prepend(renderer.domElement)}catch(e){e.userTitle='无法启动 3D 画面';e.userMessage='当前浏览器无法创建 3D 画面。请确认已启用硬件加速，并使用支持 WebGL 2 的浏览器。';throw e}
$('#loading').firstChild.textContent='正在载入地面与植被材质 ';
try{await Promise.all([initializeCornerTextures(),initializeVendingTextures(),initializeCanTextures(),initializeSpringTextures(),initializeSpringNPCs(),initializeBathTextures(),initializeSpaTextures(),initializeAlmondTextures(),initializeExitTextures(),initializeReferenceTextures(),initializeDistrictTextures(),initializeUrbanAssets(),initializeAdvertising(),initializePowerTextures(),initializeRuralTextures(),initializeLandmarkTextures(),initializeWeatherTextures(),initializeCerealTextures(),initializeVergeTextures()])}catch(error){error.userTitle='地面与植被材质未能加载';error.userMessage='请检查网络连接后重新加载，游戏不会以缺失材质的画面启动。';throw error}
$('#loading').firstChild.textContent='LOADING ';
const performanceMeter=createPerformanceMeter(renderer);
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.23;
const displayFilter=createDisplayFilter(renderer,{onError:()=>{settings.filter='pixel';$('#filter').value='pixel';resize();savePreferences();toast('VHS 滤镜未能运行，已切换为像素画面；可在设置中重试。')}});
const scene=new T.Scene();scene.matrixAutoUpdate=false;scene.background=new T.Color('#acb6b1');scene.fog=new T.Fog('#acb6b1',60,225);
const skyFill=new T.HemisphereLight('#c9d2d4','#6b6042',1.4);scene.add(skyFill);
// A stable local light avoids shader recompilation as the shelter streams.
const shelterLamp=new T.PointLight('#ffce90',0,8,2);scene.add(shelterLamp);
const atmosphere=createAtmosphere({scene,renderer,quality:settings.quality});scene.add(atmosphere.sky);
const materialFinish=createMaterialFinish(),wetGround=createWetGround();
let lightingReady=false;
let wheatDetail=createWheatDetailLayer(wind,{onMesh:mesh=>{atmosphere.attachFog(mesh);if(lightingReady){materialFinish.attach(mesh);naturalShadows.attach(mesh);irradiance.attach(mesh)}}});scene.add(wheatDetail.object);atmosphere.attachFog(wheatDetail.object);
const camera=new T.PerspectiveCamera(settings.fov,innerWidth/innerHeight,.08,480);camera.rotation.order='YXZ';
const cameraRig=new HandheldCameraRig(camera),mapView={cx:0n,cz:0n,x:0,z:0,yaw:0};
function mapPose(){mapView.cx=state.cx;mapView.cz=state.cz;mapView.x=state.x;mapView.z=state.z;mapView.yaw=camera.rotation.y;return mapView;}
const naturalShadows=createRuralShadows({renderer,scene,camera,quality:settings.quality});let irradiance=createIrradianceField();
lightingReady=true;materialFinish.attach(wheatDetail.object);naturalShadows.attach(wheatDetail.object);irradiance.attach(wheatDetail.object);
const sceneBatches=createSceneBatches({onMesh:m=>{atmosphere.attachFog(m);materialFinish.attach(m);naturalShadows.attach(m);irradiance.attach(m);},onRemove:m=>naturalShadows.detach(m)});scene.add(sceneBatches.object);
let powerNetwork=createRuralPowerNetwork(wind,{onMesh:m=>{atmosphere.attachFog(m);materialFinish.attach(m);naturalShadows.attach(m);irradiance.attach(m);},onRemove:m=>naturalShadows.detach(m)});scene.add(powerNetwork.object);const extraBudgetRoots=[wheatDetail.object,powerNetwork.object];
function releaseChunk(chunk){powerNetwork.remove(chunk);sceneBatches.remove(chunk);waterPipeline.detach(chunk);for(const p of chunk.pickups)releaseAlmondBottle(p.mesh);naturalShadows.detach(chunk.group);irradiance.remove(chunk);disposeChunk(chunk);}
const state={level:10,cx:0n,cz:0n,x:.6,z:52,y:0,yaw:-.37,pitch:-.025,velocity:new T.Vector3(),jump:0,vy:0,grounded:true,stamina:100,hydration:100,health:100,sanity:100,bottles:0,distance:0,elapsed:0};
const seed=stringSeed('CHLORINE / ABUNDANCE / 10'),chunks=new Map(),collected=new Set(),waterInventory=[];
const wheatView={value:new T.Vector3()};let chunkStream=createChunkStream({wind,viewUniform:wheatView});
let queue=[],activeBuild=null,playing=false,started=false,ready=false,lastFrame=performance.now(),time=0,uiTick=0,step=0,toastTimer,activeModal=null,lastFocus=null,hadMovement=false,lastWeather='',qualityTimer=0,frameCount=0,frameTime=0,fps=60,autoScale=1,contextLost=false,streamFailed=false;
let developerSearch=null,teleportJob=null,coverageRadius=0,referenceView=null,mapWasPlaying=false;
const lookInput=new LookInput(performance.now());
let joyPointer=null,lookPointer=null;
let interaction=null;const keys=new Set(),joy={x:0,z:0};let touchRun=false,mouseDragging=false,zoomHeld=false,zoomSetting=1;
const navigationMap=createNavigationMap({host:game,parts:instrumentParts,seed,onOpen:toggleMap,onClose:()=>closeModal(),onTeleport:teleportFromMap});
const uiThemes=createUIThemes();
document.documentElement.addEventListener('ui-themechange',event=>{navigationMap.setUITheme(event.detail.tokens);survivalDisplay.setUITheme(event.detail.tokens)});
uiThemes.registerLevel('11',{code:'LEVEL 11',name:'无垠城市',subtitle:'THE ENDLESS CITY',number:'011'});uiThemes.registerLevel('27',{code:'LEVEL 27',name:'岩体泉',subtitle:'THE ROCK SPRINGS',number:'027'});uiThemes.applyLevel('10');window.levelUI=uiThemes;
const waterRipples=createWaterRipples(renderer);
const waterImpact=createWaterImpact(scene,{onRipple:waterRipples.emit,onLensImpact:power=>lensWater.impact(power)});atmosphere.attachFog(waterImpact.group);
const rainEffects=createRainRenderer(scene,{onRipple:waterRipples.emit});atmosphere.attachFog(rainEffects.rain);atmosphere.attachFog(rainEffects.rings);
const rainWind=new T.Vector3(.85,0,.30),weatherLight=new T.Vector3(-.45,.84,-.30),duskLight=new T.Vector3(-.86,.065,-.45),wetCameraVelocity=new T.Vector3();let wetPoseFresh=true;
const weatherFlare=createWeatherFlare(renderer);
const lensWater=createLensWater(renderer),waterState=new WaterState(),bodyWater=new WaterContactEffects(waterImpact),waterBubbles=createWaterBubbles(scene);
const waterPipeline=createWaterPipeline(renderer,{ripples:waterRipples,lens:lensWater,waterState,flare:weatherFlare,sky:atmosphere.sky,fog:atmosphere.volume});displayFilter.setScenePipeline(waterPipeline);
const waterInspection=waterPipeline.inspection,pickupWorldPosition=new T.Vector3();
try{await Promise.all([waterPipeline.surface.ready,waterInspection.warmup(renderer)]);}catch(error){error.userTitle="水体材质未能加载";error.userMessage="请检查连接后重新加载。";throw error;}
const wetInput={},rigInput={},moveNext={x:0,z:0},moveLocal={x:0,z:0},impactLighting={sunDirection:weatherLight,color:scene.fog.color,intensity:1,ambientIntensity:1},rippleInput={state,chunks,active:false,lightDirection:weatherLight};
let barnDoorAngle=0,barnDoorGoal=0,wetLastYaw=0,wetLastVx=0,wetLastVz=0;
const uiRaster=createUIRaster(game,{survival:survivalDisplay,navigation:navigationMap});displayFilter.setCompositor(uiRaster);
const exitScene=createExitScene({onAdd:root=>{atmosphere.attachFog(root);materialFinish.attach(root);naturalShadows.attach(root);naturalShadows.invalidate();},onRemove:root=>naturalShadows.detach(root)}),exitAudio=new ExitAudio();scene.add(exitScene.object);atmosphere.attachFog(exitScene.object);materialFinish.attach(exitScene.object);naturalShadows.attach(exitScene.object);extraBudgetRoots.push(exitScene.object);navigationMap.setUrbanReferenceShapes([...exitScene.references.colliders,...exitScene.district.colliders,...exitScene.fabric.colliders,...exitScene.bath.colliders,...exitScene.backcourt.colliders,...exitScene.residue.colliders]);
let bathhouse={active:false,presets:[0,0,0,0],dispose(){}},bathLoading=false;const bathTransition=createBathLoading();let bathOrigin=null,bathTime=0,bathWetAge=0,bathStepTravel=0,bathShadowType=T.PCFShadowMap;
const spring=createLevel27(),springSession=new SpringSession();let springOpen=0,springTime=0,springSteps=0;
const eyelids=document.createElement('div');eyelids.setAttribute('aria-hidden','true');eyelids.style.cssText='position:fixed;inset:0;background:#020303;opacity:0;pointer-events:none;z-index:99999';document.body.append(eyelids);
const routeState={active:false,progress:0,influence:0,distance:1e8,s:-1e8};
let exitArmed=false,exitLastS=0,ruralActive=true,pendingCompiles=0,retiring=[],retiredStream=null,retiredGI=null;
function retireOldFields(all=false){
 const start=performance.now();do{const ch=retiring.pop();if(!ch)break;releaseChunk(ch);}while(retiring.length&&(all||performance.now()-start<1.5));
 if(!retiring.length&&!pendingCompiles&&retiredStream){retiredStream.dispose();retiredStream=null;retiredGI?.dispose();retiredGI=null;}
}
function enterCity(){
 if(state.level===27)leaveSpring(false);
 if(bathhouse.active)leaveBath(false);
 if(state.level===11)return;state.level=11;exitArmed=false;transitionProgress.value=1;
 // Cancel production immediately. Already-built chunks retire outside the draw
 // tree over subsequent frames; there is no renderer/camera/context reload.
 queue.length=0;if(activeBuild){const b=activeBuild;b.cancelled=true;b.task?.return();if(b.job)chunkStream.cancel(b.job);if(b.chunk&&!b.compiling)releaseChunk(b.chunk);activeBuild=null;}
 chunkStream.stop();retiredStream=chunkStream;retiredGI=irradiance;irradiance.pause();irradiance.uniforms.uProbeReady.value=0;
 for(const ch of chunks.values()){ch.group.visible=false;ch.group.removeFromParent();retiring.push(ch);}chunks.clear();
 naturalShadows.detach(wheatDetail.object);wheatDetail.object.removeFromParent();wheatDetail.dispose();releaseCerealGPU();Object.assign(wheatDetail.object.userData.wheat,{activeStems:0,triangles:0,draws:0});powerNetwork.object.removeFromParent();powerNetwork.dispose();Object.assign(powerNetwork.stats,{poles:0,cables:0,draws:0,triangles:0});ruralActive=false;Object.assign(irradiance.values,{status:'城市柔阴影',rays:0,reused:0});
 exitScene.setCity(true);navigationMap.setLevel(11);uiThemes.applyLevel('11');
 weatherDirector.automatic=false;weatherDirector.start('normal',{manual:true});weatherState=weatherDirector.update(0);rainAmount=0;rainEffects.clear();waterImpact.clear();waterRipples.reset();lensWater.reset();waterBubbles.clear();
 renderer.domElement.setAttribute('aria-label','Level 11 城市入口');interaction=null;$('#interact').hidden=true;
 $('#journal .journal-body').innerHTML=cityJournal;$('#start').innerHTML='<span>继续探索</span><small>ENTER ↵</small>';
 scene.fog.near=55;scene.fog.far=260;naturalShadows.invalidate();
}
function restoreRural(){
 if(state.level===27)leaveSpring(false);
 if(bathhouse.active)leaveBath(false);
 if(ruralActive)return;retireOldFields(true);state.level=10;weatherDirector.automatic=true;
 resumeCerealGPU();irradiance=createIrradianceField();chunkStream=createChunkStream({wind,viewUniform:wheatView});
 wheatDetail=createWheatDetailLayer(wind,{onMesh:m=>{atmosphere.attachFog(m);materialFinish.attach(m);naturalShadows.attach(m);irradiance.attach(m);}});scene.add(wheatDetail.object);
 powerNetwork=createRuralPowerNetwork(wind,{onMesh:m=>{atmosphere.attachFog(m);materialFinish.attach(m);naturalShadows.attach(m);irradiance.attach(m);},onRemove:m=>naturalShadows.detach(m)});scene.add(powerNetwork.object);
 extraBudgetRoots[0]=wheatDetail.object;extraBudgetRoots[1]=powerNetwork.object;ruralActive=true;
 exitScene.setCity(false);navigationMap.setLevel(10);uiThemes.applyLevel('10');renderer.domElement.setAttribute('aria-label','Level 10 三维麦田');$('#journal .journal-body').innerHTML=fieldJournal;
}
const fieldJournal=$('#journal .journal-body').innerHTML;
const cityJournal='<p><strong>Level 11 · 无垠城市</strong></p><p>道路延伸进楼宇之间。回望时，小麦与泥土已经不见了。</p><p>沿 Hope St 前行，低层商业街逐渐进入高楼之间。街道向四周延伸；可以进入骑楼、停车楼入口和公共广场。棕榈广场对面的 BAÑOS 热水浴室可进入岩体泉：推开巷内玻璃门，经过前厅与假风景空池，从左侧通道进入淋浴间。开启任一花洒，调至最高预设，在花洒下按 E 闭眼。特殊建筑靠近棕榈广场的背面有瀑布画售货机与候座区。按 E 会随机送出饮料；低头查看取货口或滚落的瓶罐，按 E 拿起检视，E 收起、Q 饮用、R 再检视。F2 可前往售货机、浴室入口、商业边缘区、金融街与广场，也可返回麦田。</p><p class="reference-credit">设定参考：<a href="https://backrooms-wiki-cn.wikidot.com/level-11" target="_blank" rel="noopener noreferrer">Level 11 — 无垠城市</a>，Backrooms Wikidot，原作者 Nerdykiddo4884，重写 Stretchsterz，中文翻译 Kelf，CC BY-SA 3.0。1970—1990 年代北美与拉美建筑街景为本场景的美术演绎。</p>';

const springJournal='<p><strong>Level 27 · 岩体泉</strong></p><p>泉池水域约 18.58 平方米，岸边岩洞石滩向岩壁内部延伸。洞壁为沉积石灰岩，水线可见深色矿物膜。泉水平均 32.2°C，富含矿物质，可饮用。两股微型瀑布不断注入新水；角落的小渠将水排走，不要尝试爬入。</p><p>在池中按 <strong>E</strong> 坐下或起身，<strong>Q</strong> 饮泉水。水边静坐，或缓步探索岩壁。泡浴超过一小时后，精力与心情会逐渐恢复；不建议超过两小时。</p><p><strong>返回：</strong>走上瀑布旁 贴着洞壁蜿蜒上升的风化原石踏步，沿溪流旁的干燥路面向隧道深处前行，即会回到进入时的位置。入口保持稳定。</p><p>请尊重其他使用泉水的人。超过三十人时不建议进入；泡浴结束后及时腾出空间。</p><p class="reference-credit">层级设定改编自 <a href="https://backrooms-wiki-cn.wikidot.com/level-27" target="_blank" rel="noopener noreferrer">Level 27 — 岩体泉</a>，原作 Kitty Rika，中文翻译 XD42，<a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 3.0</a>。洞穴视觉参考 <a href="https://www.flickr.com/photos/50711561@N00/14440932785" target="_blank" rel="noopener noreferrer">Cave Lake (Cooler)</a>，Jacob Norlund，CC BY 2.0。洞穴几何与 PS2 风格石灰岩、沉积层和泉水材质为本场景新制作。动态波纹和菲涅耳计算改编自 <a href="https://github.com/Aureliengmz/clearwater" target="_blank" rel="noopener noreferrer">Clearwater</a>，© 2026 Lumaris，<a href="./licenses/clearwater-MIT.txt" target="_blank">MIT</a>。</p>';
function updateSpringEntry(dt){
 exitScene.bath.update(time,springSession.preset);
 if(!springSession.closing){if(springOpen>0){springOpen=Math.max(0,springOpen-dt*.72);eyelids.style.opacity=String(springOpen);}return;}
 if(!playing)return;
 const under=bathhouse.active&&bathUnderShower(state.x,state.z);
 const done=springSession.tickClose(dt,under);eyelids.style.opacity=String(Math.min(1,springSession.closing/1.45));
 if(done)enterSpring();
}
function enterSpring(){
 waterPipeline.setBathSteam(0);
 const pose=springSession.enter(state);state.level=27;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.type=T.PCFSoftShadowMap;navigationMap.setLevel(27);state.cx=state.cz=0n;Object.assign(state,pose);state.velocity.set(0,0,0);state.jump=state.vy=0;state.grounded=true;referenceView=null;interaction=null;springOpen=1;keys.clear();joy.x=joy.z=0;
 waterInspection.clear();lensWater.reset();waterState.reset();bodyWater.reset();waterBubbles.clear();rainEffects.clear();waterImpact.clear();waterRipples.reset();weatherFlare.reset();exitAudio.update(0,false,time);
 showerAudio.mute();bathhouse.spa?.muteAudio();bathhouse.changing?.mute();waterPipeline.focus.setSceneQuery(spring.focusDistance);uiThemes.applyLevel('27');$('#journal .journal-body').innerHTML=springJournal;$('#interact').hidden=true;renderer.domElement.setAttribute('aria-label','Level 27 岩体泉 · 洞穴温泉');renderer.shadowMap.needsUpdate=true;camera.far=40;camera.updateProjectionMatrix();resetCameraRig();waterPipeline.reset(camera);resize();toast('Level 27 · 岩体泉。沿溪流向前，楼梯通往温泉。');
}
function leaveSpring(announce=true){
 const origin=springSession.leave();if(!origin)return;Object.assign(state,origin);renderer.shadowMap.autoUpdate=!bathhouse.active;renderer.shadowMap.type=bathhouse.active?T.PCFSoftShadowMap:T.PCFShadowMap;navigationMap.setLevel(state.level);state.velocity.set(0,0,0);state.jump=state.vy=0;state.grounded=true;interaction=null;springSession.closing=0;springOpen=announce?1:0;eyelids.style.opacity=String(springOpen);spring.audio(audio.ctx,audio.master,false);keys.clear();joy.x=joy.z=0;
 waterPipeline.focus.setSceneQuery(bathhouse.active?bathhouse.focusDistance:null);uiThemes.applyLevel(String(state.level));$('#journal .journal-body').innerHTML=state.level===11?cityJournal:fieldJournal;renderer.domElement.setAttribute('aria-label','Level 11 无垠城市');renderer.shadowMap.needsUpdate=true;camera.far=bathhouse.active?32:480;camera.updateProjectionMatrix();if(!bathhouse.active)exitScene.update(state);naturalShadows.invalidate();resetCameraRig();waterPipeline.reset(camera);resize();if(announce)toast('你回到了进入时的热水淋浴间。');
}
function animateSpring(now,dt,rawDt){
 navigationMap.update(mapPose(),now,playing,false);
 if(springOpen>0){springOpen=Math.max(0,springOpen-dt*.68);eyelids.style.opacity=String(springOpen);}
 let moved=0,dx=0,dz=0,wet=inPool(state.x,state.z);const crouch=keys.has('KeyC');
 if(playing){springTime+=dt;state.elapsed+=dt;let sx=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))+joy.x,sz=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'))+joy.z;
  if(waterInspection.active)sx=sz=0;const l=Math.hypot(sx,sz);if(l>1){sx/=l;sz/=l;}if(l>.1)springSession.sitting=false;const speed=wet?.92:1.65;
  const vx=(Math.cos(state.yaw)*sx+Math.sin(state.yaw)*sz)*speed,vz=(-Math.sin(state.yaw)*sx+Math.cos(state.yaw)*sz)*speed;
  state.velocity.x=T.MathUtils.lerp(state.velocity.x,vx,1-Math.exp(-dt*9));state.velocity.z=T.MathUtils.lerp(state.velocity.z,vz,1-Math.exp(-dt*9));
  const old={x:state.x,z:state.z},q=resolveSpring(old,{x:state.x+state.velocity.x*dt,z:state.z+state.velocity.z*dt});dx=q.x-state.x;dz=q.z-state.z;moved=Math.hypot(dx,dz);state.x=q.x;state.z=q.z;state.distance+=moved;wet=inPool(state.x,state.z);
  if(wet){springSession.bathSeconds+=dt;state.stamina=Math.min(100,state.stamina+dt*1.4);if(springSession.bathSeconds>3600){state.sanity=Math.min(100,state.sanity+dt*.03);state.health=Math.min(100,state.health+dt*.008);}if(springSession.bathSeconds>7200&&springSession.bathSeconds-dt<=7200)toast('已泡浴两小时，建议沿楼梯返回休息。');}
  if(springCanExit(state.x,state.z)){leaveSpring();performanceMeter.end();return;}
 }
 const eyeY=springFloor(state.x,state.z)+(springSession.sitting&&wet?.99:crouch?1.06:1.77);
 const rig=cameraRig.update(dt,{x:state.x,z:state.z,yaw:state.yaw,pitch:state.pitch,eyeY,jump:0,moved,dx,dz,grounded:true,running:false,crouch:crouch||springSession.sitting,stamina:state.stamina,landingSpeed:0,enabled:settings.bob&&!reduceCameraMotion.matches,locked:false});state.y=rig.eyeHeight;step=rig.phase;
 if(playing){springSteps+=moved;if(springSteps>.62){springSteps=0;audio.footstep(false,wet);}survivalDisplay.animate(dt,state,step);}
 if(audio.ctx){audio.motion.gain.setTargetAtTime(0,audio.ctx.currentTime,.2);audio.rain.gain.setTargetAtTime(0,audio.ctx.currentTime,.2);spring.audio(audio.ctx,audio.master,playing,state,state.yaw);}exitAudio.update(0,false,time);
 spring.update(springTime,{x:state.x,z:state.z,moved,wet});waterPipeline.focus.setZoom(playing&&(keys.has('KeyZ')||zoomHeld)?Math.max(3,zoomSetting):zoomSetting);waterPipeline.focus.setMist(0);waterPipeline.update(playing?dt:0,camera,state,playing,false,spring.scene.background,new T.Vector3(0,1,0),0,0);
 renderer.toneMappingExposure=T.MathUtils.lerp(renderer.toneMappingExposure,1.08,1-Math.exp(-dt*1.4));
 uiTick+=dt;if(uiTick>.12){uiTick=0;updateHUD();$('#weather-label').textContent='岩体泉 · 32.2°C';const p=$('#interact');p.classList.remove('inspection');$('.crosshair').hidden=false;p.hidden=!playing;p.textContent=waterInspection.active?'鼠标 / 滑动旋转 · E 收起 · Q 饮用':wet?(springSession.sitting?'E 起身 · Q 饮泉水':'E 坐入泉水 · Q 饮泉水'):state.z<-2?'沿溪流前方下楼梯 · 身后隧道返回入口':'原石踏步 → 沿溪流返回';}
 performanceMeter.markSimulation();displayFilter.render(spring.scene,camera,now,()=>{performanceMeter.beforeRender();spring.capture(renderer,camera);});performanceMeter.end();document.documentElement.dataset.bootState='ready';frameCount++;frameTime+=rawDt;if(frameTime>=1.5){fps=frameCount/frameTime;frameCount=0;frameTime=0;}
}

async function enterBath(){
 if(bathLoading||bathhouse.active)return;bathLoading=true;keys.clear();joy.x=joy.z=0;lookInput.reset(performance.now());
 try{
  await bathTransition.show();bathTransition.progress(3,'正在读取浴室材质');
  if(!bathhouse.scene){const loaded=[0,0],progress=(i,v)=>{loaded[i]=v;bathTransition.progress(3+(loaded[0]+loaded[1])*12.5,'正在读取浴室材质');};await Promise.all([initializeChangingTextures(null,p=>progress(0,p)),initializeReceptionTextures73(null,p=>progress(1,p))]);await nextPaint();bathhouse=await prepareBathhouse((p,text)=>bathTransition.progress(28+p*39,text));}
  bathOrigin={level:state.level,cx:state.cx,cz:state.cz,x:state.x,z:state.z,yaw:state.yaw,pitch:state.pitch};bathhouse.active=true;bathShadowType=renderer.shadowMap.type;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.type=T.PCFSoftShadowMap;state.cx=state.cz=0n;Object.assign(state,BATH_ARRIVAL);state.velocity.set(0,0,0);state.jump=state.vy=0;state.grounded=true;referenceView=null;interaction=null;springOpen=0;eyelids.style.opacity='0';
  lensWater.reset();waterState.reset();bodyWater.reset();rainEffects.clear();waterImpact.clear();waterRipples.reset();weatherFlare.reset();exitAudio.update(0,false,time);waterPipeline.focus.setSceneQuery(bathhouse.focusDistance);camera.far=32;camera.updateProjectionMatrix();resetCameraRig();waterPipeline.reset(camera);bathhouse.update(bathTime,state);
  bathTransition.progress(70,'正在准备室内灯光');await nextPaint();await renderer.compileAsync(bathhouse.scene,camera);
  bathTransition.progress(83,'正在准备玻璃与倒影');await nextPaint();renderer.shadowMap.needsUpdate=true;bathhouse.beforeRender(renderer,camera);await renderer.compileAsync(bathhouse.scene,camera);await warmBath73(bathhouse,renderer,camera,(p,text)=>bathTransition.progress(83+p*11,text));
  bathTransition.progress(95,'正在打开前厅');await nextPaint();waterPipeline.setBathSteam(0);waterPipeline.update(0,camera,state,false,false,bathhouse.scene.background,new T.Vector3(0,1,0),0,-10);displayFilter.render(bathhouse.scene,camera,performance.now());await nextPaint();
  renderer.domElement.setAttribute('aria-label','Baños 浴室 · 前厅、更衣室、空浴池与淋浴间');keys.clear();joy.x=joy.z=0;lookInput.reset(performance.now(),{locked:document.pointerLockElement===renderer.domElement});await bathTransition.finish();bathLoading=false;lastFrame=performance.now();toast('前厅左侧进入更衣室，向前走后从右侧门进入空浴池。');
 }catch(error){console.error('Bath entry failed',error);if(bathhouse.active)leaveBath(false);bathTransition.fail(()=>{bathLoading=false;keys.clear();lookInput.reset(performance.now());lastFrame=performance.now();});}
}

function leaveBath(announce=true){
 if(!bathhouse.active||!bathOrigin)return;showerAudio.mute();bathhouse.spa?.muteAudio();bathhouse.changing?.mute();Object.assign(state,bathOrigin);bathOrigin=null;bathhouse.active=false;renderer.shadowMap.type=bathShadowType;renderer.shadowMap.autoUpdate=true;renderer.shadowMap.needsUpdate=true;waterPipeline.setBathSteam(0);state.velocity.set(0,0,0);state.jump=state.vy=0;state.grounded=true;interaction=null;keys.clear();joy.x=joy.z=0;springSession.closing=0;springOpen=announce?1:0;eyelids.style.opacity=String(springOpen);lensWater.reset();waterPipeline.focus.setSceneQuery(null);camera.far=480;camera.updateProjectionMatrix();exitScene.update(state);naturalShadows.invalidate();resetCameraRig();waterPipeline.reset(camera);renderer.domElement.setAttribute('aria-label','Level 11 无垠城市');if(announce)toast('玻璃门在你身后合上。');
}
function animateBath(now,dt,rawDt){
 if(springOpen>0&&!springSession.closing){springOpen=Math.max(0,springOpen-dt*.9);eyelids.style.opacity=String(springOpen);}
 let moved=0,dx=0,dz=0;if(playing){bathTime+=dt;state.elapsed+=dt;let sx=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))+joy.x,sz=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'))+joy.z,l=Math.hypot(sx,sz);if(l>1){sx/=l;sz/=l;}if(waterInspection.active)sx=sz=0;
  const vx=(Math.cos(state.yaw)*sx+Math.sin(state.yaw)*sz)*1.72,vz=(-Math.sin(state.yaw)*sx+Math.cos(state.yaw)*sz)*1.72;state.velocity.x=T.MathUtils.lerp(state.velocity.x,vx,1-Math.exp(-dt*10));state.velocity.z=T.MathUtils.lerp(state.velocity.z,vz,1-Math.exp(-dt*10));const q=resolveBath(state,{x:state.x+state.velocity.x*dt,z:state.z+state.velocity.z*dt});dx=q.x-state.x;dz=q.z-state.z;moved=Math.hypot(dx,dz);state.x=q.x;state.z=q.z;state.distance+=moved;
  if(state.z>13.35&&Math.abs(state.x)<.7){leaveBath();performanceMeter.end();return;}
 }
 const under=bathShowerAt(state.x,state.z,.34),near=bathShowerAt(state.x,state.z,.91),wet=under>=0&&bathhouse.presets[under]>0;springSession.preset=under>=0?bathhouse.presets[under]:near>=0?bathhouse.presets[near]:0;
 if(springSession.closing&&playing){const done=springSession.tickClose(dt,wet&&springSession.preset===2);eyelids.style.opacity=String(Math.min(1,springSession.closing/1.45));if(done){enterSpring();animateSpring(now,dt,rawDt);return;}}
 const crouch=keys.has('KeyC'),rig=cameraRig.update(dt,{x:state.x,z:state.z,yaw:state.yaw,pitch:state.pitch,eyeY:bathFloor(state.x,state.z)+(crouch?1.06:1.77),jump:0,moved,dx,dz,grounded:true,running:false,crouch,stamina:state.stamina,landingSpeed:0,enabled:settings.bob&&!reduceCameraMotion.matches,locked:false});state.y=rig.eyeHeight;step=rig.phase;
 if(playing){bathStepTravel+=moved;if(bathStepTravel>.62){bathStepTravel=0;audio.footstep(false,wet||inSpaWater(state.x,state.z));}survivalDisplay.animate(dt,state,step);}
 if(wet&&playing){bathWetAge+=dt;if(bathWetAge>2.7){lensWater.showerContact();bathWetAge=0;}}else bathWetAge=3.0;
 lensWater.update(playing?dt:0,{enabled:playing,rain:0,humidity:wet?.92:.58,sheltered:true,hasWater:false,cameraHeight:camera.position.y,level:-10,aspect:camera.aspect,pitch:camera.rotation.x,roll:camera.rotation.z,accelX:0,cameraVelocity:cameraRig.velocity,waterCrossing:{submerged:false,crossing:0}});
 bathhouse.update(bathTime,state);bathhouse.beforeRender(renderer,camera);if(audio.ctx){audio.motion.gain.setTargetAtTime(0,audio.ctx.currentTime,.2);audio.rain.gain.setTargetAtTime(0,audio.ctx.currentTime,.2);showerAudio.update(bathhouse.presets,state,state.yaw,playing);bathhouse.spa.audio(audio.ctx,audio.master,state,playing);bathhouse.changing.audio(audio.ctx,audio.master,state,playing);}exitAudio.update(0,false,time);
 waterPipeline.focus.setZoom(playing&&(keys.has('KeyZ')||zoomHeld)?Math.max(3,zoomSetting):zoomSetting);waterPipeline.setBathSteam(bathhouse.presets.reduce((a,b)=>a+(b===2?1:b===1?.4:0),0));waterPipeline.focus.setMist(0);waterPipeline.update(playing?dt:0,camera,state,playing,false,bathhouse.scene.background,new T.Vector3(0,1,0),0,-10);renderer.toneMappingExposure=T.MathUtils.lerp(renderer.toneMappingExposure,1.0,1-Math.exp(-dt*2));
 uiTick+=dt;if(uiTick>.12){uiTick=0;updateHUD();$('#weather-label').textContent='BAÑOS · 热水浴室';const p=$('#interact');p.classList.remove('inspection');$('.crosshair').hidden=false;p.hidden=!playing;p.textContent=springSession.closing?'闭眼中…':near>=0?(springSession.preset===0?'E 打开这只花洒':springSession.preset===1?'E 调到最热预设':wet?'E 闭上眼睛':'E 关闭花洒 · 站到水下可闭眼'):atBathExit(state.x,state.z)?'E 推门返回街道':state.z>6.4?'左侧门 → 更衣室':inChanging(state.x,state.z)?'前方右门 → 空浴池':state.x< -4?'各花洒可独立开关 · 最热预设 + 闭眼':state.x>4.2?'水疗圆池 · 沿镀铬扶手下池': '空池左侧 → 淋浴间 · 右侧 → 水疗圆池';}
 performanceMeter.markSimulation();displayFilter.render(bathhouse.scene,camera,now,()=>performanceMeter.beforeRender());performanceMeter.end();document.documentElement.dataset.bootState='ready';frameCount++;frameTime+=rawDt;if(frameTime>=1.5){fps=frameCount/frameTime;frameCount=0;frameTime=0;}
}

function updateExit(){
 if(state.level===11){transitionProgress.value=1;exitScene.update(state);return;}
 exitForField(state.x,state.z,{x:state.cx,z:state.cz},routeState);
 transitionProgress.value=routeState.progress*routeState.influence;
 if(playing&&!teleportJob){
  if(routeState.s>=-3&&routeState.s<20&&routeState.distance<4.6)exitArmed=true;
  if(!routeState.active||routeState.distance>18)exitArmed=false;
  if(exitArmed&&routeState.s>=360&&exitLastS<360&&routeState.distance<6)enterCity();
 }
 exitLastS=routeState.s;exitScene.update(state);
}
window.levelExit={get state(){return {level:state.level,progress:transitionProgress.value,along:routeState.s,armed:exitArmed,ruralActive,queued:queue.length,chunks:chunks.size,retiring:retiring.length,city:exitScene.stats};}};
const radius=()=>settings.quality==='low'?2:3;
function chunkLevel(dx,dz){const d=Math.max(Math.abs(dx),Math.abs(dz));return d<=1?0:d<=2?1:2}
function updateQueue(){
 if(state.level!==10)return;
 const wanted=new Set(),n=radius(),next=[];
 if(activeBuild){
  const old=activeBuild;old.cancelled=true;old.task?.return();
  if(old.job)chunkStream.cancel(old.job);
  if(old.chunk&&!old.compiling)releaseChunk(old.chunk);
  activeBuild=null;
 }
 for(let dz=-n;dz<=n;dz++)for(let dx=-n;dx<=n;dx++){
  const cx=state.cx+BigInt(dx),cz=state.cz+BigInt(dz),key=`${cx},${cz}`,level=chunkLevel(dx,dz);wanted.add(key);const c=chunks.get(key);
  if(c){c.group.position.set(dx*CHUNK,0,dz*CHUNK);c.group.updateMatrix();if(c.level!==level||c.quality!==settings.quality)next.push({cx,cz,key,level,d:dx*dx+dz*dz+10})}else next.push({cx,cz,key,level,d:dx*dx+dz*dz});
 }
 if(referenceView)for(const item of photoCorridorTiles(state,referenceView)){if(wanted.has(item.key))continue;wanted.add(item.key);const c=chunks.get(item.key);if(c){c.group.position.set(Number(item.cx-state.cx)*64,0,Number(item.cz-state.cz)*64);c.group.updateMatrix();if(c.quality!==settings.quality)next.push(item)}else next.push(item)}
 for(const[k,c]of chunks)if(!wanted.has(k)){scene.remove(c.group);releaseChunk(c);chunks.delete(k)}
 queue=next.sort((a,b)=>a.d-b.d);updateCoverage();
}
function finishChunk(build,c){
 if(build.cancelled){releaseChunk(c);return}
 c.group.position.set(Number(build.item.cx-state.cx)*CHUNK,0,Number(build.item.cz-state.cz)*CHUNK);
 updateBarnDoors(c,barnDoorAngle);
 // An item may have been picked up while this replacement was in the worker.
 for(const p of c.pickups)if(p.mesh&&collected.has(p.id)){c.group.remove(p.mesh);p.mesh=null}
 hydrateAlmondPickups(c);c.group.traverse(o=>{o.updateMatrix();o.matrixAutoUpdate=false});
 sceneBatches.capture(c.group);atmosphere.attachFog(c.group);materialFinish.attach(c.group);naturalShadows.attach(c.group);irradiance.attach(c.group);wetGround.attach(c.group);waterPipeline.attach(c);bindTroughWater(c.group,waterPipeline.surface,wind.time);build.chunk=c;build.compiling=true;pendingCompiles++;
 // KHR_parallel_shader_compile lets the driver prepare a new material before
 // the first visible frame. The target Scene supplies identical lights/fog.
 renderer.compileAsync(c.group,camera,scene).then(()=>{
  build.compiling=false;pendingCompiles--;
  if(build.cancelled){releaseChunk(c);build.chunk=null;return}
  build.prepared=true;
 },error=>{build.compiling=false;pendingCompiles--;if(build.cancelled){releaseChunk(c);build.chunk=null;}else build.error=error});
}
function streamOne(){
 if(state.level!==10)return;
 if(!activeBuild){
  if(chunkStream.starting||chunkStream.busy)return;
  const item=queue.shift();if(!item)return;
  activeBuild={item,quality:settings.quality};
  if(chunkStream.available)activeBuild.job=chunkStream.request({cx:item.cx,cz:item.cz,seed,level:item.level,quality:settings.quality,collected:[...collected]});
  else activeBuild.task=createChunkTask(field(item.cx,item.cz,seed),item.level,settings.quality,collected);
 }
 const build=activeBuild;
 if(build.error)throw build.error;
 if(build.prepared){
  const c=build.chunk,old=chunks.get(build.item.key);activeBuild=null;
  if(old){scene.remove(old.group);releaseChunk(old)}
  updateBarnDoors(c,barnDoorAngle);chunks.set(build.item.key,c);scene.add(c.group);sceneBatches.register(c);powerNetwork.register(c);irradiance.put(c);naturalShadows.invalidate();updateCoverage();return;
 }
 if(build.compiling)return;
 if(build.job){
  if(!build.job.done)return;
  if(build.job.error){build.task=createChunkTask(field(build.item.cx,build.item.cz,seed),build.item.level,build.quality,collected);build.job=null;return}
  const c=build.job.chunk;build.job.chunk=null;build.job=null;if(c)finishChunk(build,c);return;
 }
 const step=build.task.next();if(step.done){build.task=null;finishChunk(build,step.value)}
}

function resize(){
 const photo=referenceView?.urbanPhoto,filter=photo?'native':settings.filter;let frame=displayFrame(filter,innerWidth,innerHeight);if(photo){const aspect=referenceView.referenceAspect,w=Math.min(innerWidth,innerHeight*aspect),h=w/aspect;frame={width:w,height:h,left:(innerWidth-w)/2,top:(innerHeight-h)/2,aspect};}
 document.body.classList.toggle('compact-picture',frame.width<640||frame.height<360);
 for(const key of ['width','height','left','top'])document.documentElement.style.setProperty('--scene-'+key,frame[key]+'px');
 const size=displaySize(filter,settings.quality,frame.width,frame.height,photo?1:autoScale);
 renderer.setSize(size.width,size.height,false);powerNetwork.resize(size.width,size.height);displayFilter.configure(filter,size.width,size.height);
 camera.aspect=frame.aspect;camera.fov=referenceView?2*Math.atan(Math.tan(referenceView.fov*Math.PI/360)*(referenceView.referenceAspect||1.5)/camera.aspect)*180/Math.PI:Number(settings.fov);
 waterPipeline.focus.setBaseFov(camera.fov);camera.far=state.level===27?40:bathhouse.active?32:referenceView?1000:480;atmosphere.sky.scale.setScalar(referenceView?2:1);camera.updateProjectionMatrix();
 document.body.dataset.filter=filter;naturalShadows.resize(settings.quality,referenceView?.range||220);
}
addEventListener('resize',resize);resize();updateQueue();

class Ambience{
 constructor(){this.ctx=null;this.master=null;this.motion=null;this.rain=null;this.last=0}
 start(){try{if(!this.ctx){const A=window.AudioContext||window.webkitAudioContext;this.ctx=new A();this.master=this.ctx.createGain();this.master.connect(this.ctx.destination);const count=this.ctx.sampleRate*4,buffer=this.ctx.createBuffer(1,count,this.ctx.sampleRate),d=buffer.getChannelData(0);let brown=0;for(let i=0;i<count;i++){brown=(brown+(Math.random()*2-1)*.035)/1.015;d[i]=brown*3}const source=this.ctx.createBufferSource();source.buffer=buffer;source.loop=true;const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=900;this.motion=this.ctx.createGain();this.motion.gain.value=.19;source.connect(filter);filter.connect(this.motion);this.motion.connect(this.master);source.start();const hiss=this.ctx.createBuffer(1,count,this.ctx.sampleRate),hd=hiss.getChannelData(0);for(let i=0;i<count;i++)hd[i]=(Math.random()*2-1)*.12;const rainSource=this.ctx.createBufferSource();rainSource.buffer=hiss;rainSource.loop=true;const hp=this.ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=1800;this.rain=this.ctx.createGain();this.rain.gain.value=0;rainSource.connect(hp);hp.connect(this.rain);this.rain.connect(this.master);rainSource.start()}exitAudio.attach(this.ctx,this.master);showerAudio.attach(this.ctx,this.master);this.ctx.resume().catch(()=>{});this.setVolume()}catch{}}
 setVolume(){if(this.master)this.master.gain.setTargetAtTime((Number(settings.volume)/100)*.6,this.ctx.currentTime,.1)}
 update(moving,wheat,rain){if(!this.ctx)return;this.motion.gain.setTargetAtTime((.15+.035*Math.sin(time*.23)+(moving&&wheat?.15:0))*(1-ease(.57,.96,transitionProgress.value)*.82),this.ctx.currentTime,.2);this.rain.gain.setTargetAtTime(rain*.6,this.ctx.currentTime,.3)}
 footstep(wheat,wet){if(!this.ctx||Number(settings.volume)===0)return;if(!wet&&transitionProgress.value>.015&&exitAudio.step())return;const len=.12,buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*len,this.ctx.sampleRate),d=buffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/d.length*5);const src=this.ctx.createBufferSource();src.buffer=buffer;const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=wet?400:wheat?2100:700;const gain=this.ctx.createGain();gain.gain.value=wet?.13:wheat?.09:.15;src.connect(filter);filter.connect(gain);gain.connect(this.master);src.start();src.onended=()=>{src.disconnect();filter.disconnect();gain.disconnect()}}
 powerCue(kind){if(!this.ctx||Number(settings.volume)===0)return;const t=this.ctx.currentTime,on=kind==='power-on',len=.20,buffer=this.ctx.createBuffer(1,Math.floor(this.ctx.sampleRate*len),this.ctx.sampleRate),d=buffer.getChannelData(0);for(let i=0;i<d.length;i++){const q=i/d.length;d[i]=(Math.random()*2-1)*Math.exp(-q*28)+Math.sin(i*.19)*Math.exp(-q*12)*.22;}const src=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),g=this.ctx.createGain();src.buffer=buffer;filter.type='lowpass';filter.frequency.value=on?1800:1100;g.gain.setValueAtTime(.28,t);g.gain.exponentialRampToValueAtTime(.001,t+len);src.connect(filter);filter.connect(g);g.connect(this.master);src.start(t);src.onended=()=>{src.disconnect();filter.disconnect();g.disconnect()};const osc=this.ctx.createOscillator(),hum=this.ctx.createGain();osc.type='triangle';osc.frequency.setValueAtTime(on?38:92,t);osc.frequency.exponentialRampToValueAtTime(on?70:22,t+.28);hum.gain.setValueAtTime(.055,t);hum.gain.exponentialRampToValueAtTime(.001,t+.35);osc.connect(hum);hum.connect(this.master);osc.start(t);osc.stop(t+.36);osc.onended=()=>{osc.disconnect();hum.disconnect()};}
 chime(){if(!this.ctx)return;const osc=this.ctx.createOscillator(),g=this.ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(690,this.ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(980,this.ctx.currentTime+.08);g.gain.setValueAtTime(.07,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+.2);osc.connect(g);g.connect(this.master);osc.start();osc.stop(this.ctx.currentTime+.22);osc.onended=()=>{osc.disconnect();g.disconnect()}}
}
const audio=new Ambience();
const showerAudio=createShowerAudio(SHOWER_HEADS);
const weatherDirector=new WeatherDirector({onCue:kind=>audio.powerCue(kind)});let weatherState=weatherDirector.value,rainAmount=0,pointerLockHeld=false;
for(const button of document.querySelectorAll('[data-weather]'))button.onclick=()=>{if(!ready||teleportJob)return;if(state.level===27||bathhouse.active){$('#weather-status').textContent='洞穴与室外天气隔离。返回街道后可更改天气。';return;}audio.start();const kind=button.dataset.weather;weatherDirector.start(kind,{manual:true});if(kind==='normal'){weatherDirector.wetness=0;rainEffects.clear();lensWater.reset();waterRipples.reset();waterImpact.clear();weatherFlare.reset();}weatherState=weatherDirector.update(0);closeModal(false);start();toast(kind==='sunbreak'?'晴空已触发 · 4 秒后开始转入黄昏':WEATHER_LABELS[kind]+' · 已触发');};

function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3600)}
function setPlay(value){resetLookInput();if(value!==playing){weatherDirector.resetClock();cameraRig.resume();wetPoseFresh=true;lastFrame=performance.now();}survivalDisplay.resetMotion();playing=value;$('#menu').hidden=value;$('#hud').hidden=!value;$('#touch').hidden=!value||!touchDevice;if(value){audio.start();if(!started){started=true;toast('沿着小径前行。地上的瓶子可以按 E 拾取。')}$('#start').innerHTML='<span>继续探索</span><small>ENTER ↵</small>';$('#eyebrow').textContent='PAUSED';}else{springSession.closing=0;springOpen=0;eyelids.style.opacity='0';pointerLockHeld=false;audio.ctx?.suspend().catch(()=>{});keys.clear();joy.x=joy.z=0;touchRun=false;zoomHeld=false;zoomSetting=1;waterPipeline.focus.setZoom(1);$('#touch-zoom').textContent='1×';$('#stick').style.transform='';if(document.pointerLockElement)document.exitPointerLock();}}
function start(){if(!ready||teleportJob||developerSearch)return;setPlay(true);if(!touchDevice){try{const p=renderer.domElement.requestPointerLock?.();if(p&&p.catch)p.catch(()=>toast('按住鼠标拖动环顾，W A S D 移动。'))}catch{toast('按住鼠标拖动环顾，W A S D 移动。')}}}
$('#start').onclick=start;$('#pause-button').onclick=()=>setPlay(false);
document.addEventListener('pointerlockchange',()=>{const held=document.pointerLockElement===renderer.domElement,lost=pointerLockHeld&&!held;pointerLockHeld=held;resetLookInput(held);if(lost&&playing&&!touchDevice&&!activeModal)setPlay(false);});
document.addEventListener('pointerlockerror',()=>{if(playing)toast('按住鼠标拖动环顾，W A S D 移动。')});
function openModal(id){if(navigationMap.isOpen)navigationMap.hide();if(activeModal)activeModal.hidden=true;lastFocus=document.activeElement;if(playing)setPlay(false);activeModal=$('#'+id);activeModal.hidden=false;if(id==='world-map')navigationMap.show(mapPose());if(id==='developer'){settings.devMode=true;$('#devMode').checked=true;$('#developer-button').hidden=false;savePreferences();updateDeveloperCoordinates();}if(id==='journal')$('#expedition').textContent=started?`已探索 ${Math.round(state.distance)} 米 · ${Math.floor(state.elapsed/60)} 分钟 · 杏仁水 ${state.bottles} 瓶`:'尚未开始探索。';activeModal.querySelector('button,select,input')?.focus()}
function closeModal(resume=true){if(!activeModal||teleportJob)return;const wasMap=activeModal.id==='world-map';if(developerSearch){developerSearch.return();developerSearch=null;developerBusy(false);$('#developer-status').textContent='已取消搜索。';}if(wasMap)navigationMap.hide();activeModal.hidden=true;activeModal=null;lastFocus?.focus();if(wasMap&&resume&&mapWasPlaying&&ready)start();}
function toggleMap(){if(bathhouse.active&&state.level!==27){toast('前厅左门进入更衣室；更衣室前方右门通往空浴池。');return;}if(state.level===27){toast('沿原石踏步向上，跟随溪流穿过隧道，即可返回进入时的位置。');return;}if(teleportJob||developerSearch||!ready)return;if(activeModal?.id==='world-map'){closeModal();return;}if(activeModal)return;mapWasPlaying=playing;openModal('world-map');}
function teleportFromMap(point){if(state.level===27){toast('沿溪流旁原石踏步返回入口。');return;}if(state.level===11){toast('沿城市街道步行探索；F2 可前往金融街、广场或返回麦田。');return;}if(teleportJob||developerSearch)return;if(streamFailed){navigationMap.setStatus('场景加载失败，请刷新后重试。');return;}try{const target=createMapTarget(point,seed);if(!target){navigationMap.setStatus('附近没有可用落点，请点击另一处地面。');return;}beginTeleport(target);}catch(error){console.error('Map destination failed',error);navigationMap.setBusy(false,'无法准备此处落点，请选择另一处地面。');}}
$('#open-developer').onclick=()=>openModal('developer');$('#developer-button').onclick=()=>openModal('developer');
$('#open-settings').onclick=()=>openModal('settings');$('#open-journal').onclick=()=>openModal('journal');$('#open-controls').onclick=()=>openModal('controls');document.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)closeModal()}));
for(const key of Object.keys(settings)){const el=$('#'+key);if(!el)continue;if(el.type==='checkbox')el.checked=Boolean(settings[key]);else el.value=settings[key];el.addEventListener('input',()=>{settings[key]=el.type==='checkbox'?el.checked:el.type==='range'?Number(el.value):el.value;try{localStorage.setItem('level10.preferences.v1',JSON.stringify(settings))}catch{}if(key==='quality'){autoScale=1;updateQueue()}if(key==='fov')leaveReferenceView();if(['quality','filter','fov'].includes(key))resize();if(key==='volume')audio.setVolume();if(key==='devMode')$('#developer-button').hidden=!settings.devMode;$('#fov-value').textContent=settings.fov+'°';$('#fps').hidden=!settings.showfps;})}$('#fov-value').textContent=settings.fov+'°';$('#fps').hidden=!settings.showfps;$('#developer-button').hidden=!settings.devMode;

function savePreferences(){try{localStorage.setItem('level10.preferences.v1',JSON.stringify(settings))}catch{}}
function performanceText(){const v=performanceMeter.values,f=displayFilter.values,gi=irradiance.values,ms=n=>n===null?'—':n.toFixed(1)+' ms';return `CPU ${ms(v.cpu)} · GPU ${v.supported===false?'浏览器未提供计时':ms(v.gpu)} · ${v.calls} 批次 · ${Math.round(v.triangles/1000)}k 三角形\n逻辑 ${ms(v.simulation)} · 提交 ${ms(v.submission)} · 麦丛 ${wheatDetail.object.userData.wheat.activeStems} / ${wheatDetail.object.userData.wheat.triangles} 面\n电网 ${powerNetwork.stats.poles} 杆 · ${powerNetwork.stats.draws} 批次 · ${Math.round(powerNetwork.stats.triangles/1000)}k 面\n光照 ${gi.status} · ${Math.round(gi.rays/1000)}k 射线 · 复用 ${gi.reused} 探针\n天气通道：雾 ${atmosphere.volume.stats.active?'1/3 尺寸积分 + 深度合成':'跳过'} · 水面 ${waterPipeline.stats.waterVisible?'可见':'跳过'}${settings.filter==='vhs'?`\nVHS ${f.fps.toFixed(1)} FPS · 后台 ${ms(f.ms)} · 处理延迟 ${ms(f.latency)}`:''}`;}
function updateDeveloperCoordinates(){
 $('#developer-performance').textContent=performanceText();
 $('#developer-cell').textContent=`${state.cx} / ${state.cz}`;
 $('#developer-position').textContent=`${state.x.toFixed(1)} / ${state.z.toFixed(1)} m`;
 if(teleportJob){const total=(radius()*2+1)**2;$('#developer-status').textContent=`正在准备${teleportJob.target.label} · ${Math.min(100,Math.round(chunks.size/total*100))}%`;}
}
function developerBusy(value){
 navigationMap.setBusy(value,value?'正在准备目的地，抵达后继续探索。':undefined);
 document.querySelectorAll('[data-teleport]').forEach(button=>button.disabled=value);
 $('#developer').setAttribute('aria-busy',String(value));
 $('#developer [data-close]').disabled=!!teleportJob;if(teleportJob)$('#developer .panel').focus();
}
function neighbourhoodReady(){
 for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)if(!chunks.has(`${state.cx+BigInt(dx)},${state.cz+BigInt(dz)}`))return false;
 return true;
}
function updateCoverage(){
 coverageRadius=0;
 for(let ring=1;ring<=radius();ring++){
  for(let z=-ring;z<=ring;z++)for(let x=-ring;x<=ring;x++)if(Math.max(Math.abs(x),Math.abs(z))===ring&&!chunks.has(`${state.cx+BigInt(x)},${state.cz+BigInt(z)}`))return;
  coverageRadius=ring;
 }
}
function leaveReferenceView(){
 if(!referenceView)return;referenceView=null;resize();if(state.level===11){scene.fog.near=160;scene.fog.far=400;return;}scene.fog.near=60;scene.fog.far=Math.min(225,Math.max(.2,coverageRadius*64+Math.min(state.x,state.z,64-state.x,64-state.z)-8));updateQueue();
}
function beginTeleport(target){
 restoreRural();exitArmed=false;exitLastS=-1;transitionProgress.value=0;
 lensWater.reset();waterState.reset();bodyWater.reset();waterBubbles.clear();waterPipeline.reset(camera);waterImpact.clear();waterRipples.reset();rainEffects.clear();weatherFlare.reset();wetPoseFresh=true;
 if(streamFailed){developerBusy(false);$('#developer-status').textContent='场景加载失败，请刷新页面重试。';return;}
 const previous={};for(const key of ['cx','cz','x','z','y','yaw','pitch'])previous[key]=state[key];
 const previousReference=referenceView;referenceView=target.kind==='photo'?target:null;resize();
 teleportJob={target,previous,previousReference};developerBusy(true);setPlay(false);interaction=null;$('#interact').hidden=true;
 applyTeleport(state,{cx:target.cx,cz:target.cz,x:target.x,z:target.z,y:surfaceHeight(target.x,target.z,target.field)+1.77,yaw:target.yaw??state.yaw,pitch:-.045});resetCameraRig();
 ready=false;$('#start').disabled=true;$('#loading').hidden=false;$('#load-number').textContent='0%';$('#load-bar').style.width='0%';
 updateQueue();updateDeveloperCoordinates();
}
function advanceDeveloperSearch(){
 if(!developerSearch)return;
 if(streamFailed){developerSearch.return();developerSearch=null;developerBusy(false);$('#developer-status').textContent='场景加载失败，请刷新页面重试。';return;}
 try{const result=developerSearch.next();
  if(!result.done){$('#developer-status').textContent=`正在寻找最近的地标 · 已检查 ${result.value.examined} 个区块`;return;}
  developerSearch=null;
  if(result.value)beginTeleport(result.value);
  else{developerBusy(false);$('#developer-status').textContent='附近两公里内未找到可确认的最近地标。请换一个目标，或继续探索后重试。';}
 }catch(error){console.error('Landmark search failed',error);developerSearch=null;developerBusy(false);$('#developer-status').textContent='搜索未完成，请重试。';}
}
function completeTeleport(){
 if(!teleportJob||queue.length||activeBuild||!neighbourhoodReady())return;
 const job=teleportJob,landing=job.restoring?job.previous:findSafeLanding(job.target,teleportColliders());
 if(!landing){
  referenceView=job.previousReference;resize();applyTeleport(state,job.previous);resetCameraRig();job.restoring=true;job.target={...job.target,label:'原位置'};updateQueue();return;
 }
 applyTeleport(state,landing);resetCameraRig();teleportJob=null;developerBusy(false);ready=true;$('#start').disabled=false;$('#loading').hidden=true;
 $('#developer-status').textContent=job.restoring?'目的地没有安全落点，已返回原位置。':`已抵达${job.target.label}。`;
 $('#start').innerHTML='<span>继续探索</span><small>ENTER ↵</small>';
 if(!document.hasFocus()||document.hidden)return;
 closeModal(false);setPlay(true);
 toast(job.restoring?'未找到安全落点，已回到原位置。':(job.target.kind==='photo'?`已抵达${job.target.label}。移动或转动视角恢复常规镜头。`:`已抵达${job.target.label}。点击画面继续环顾；F 打开地图。`));
}
function teleportColliders(){const solids=[];for(const ch of chunks.values()){const dx=Number(ch.field.x-state.cx)*CHUNK,dz=Number(ch.field.z-state.cz)*CHUNK;if(Math.abs(dx)>CHUNK||Math.abs(dz)>CHUNK)continue;for(const c of ch.colliders)solids.push(c.kind==='box'?{...c,x1:c.x1+dx,x2:c.x2+dx,z1:c.z1+dz,z2:c.z2+dz}:{...c,x:c.x+dx,z:c.z+dz});}return solids;}
document.querySelectorAll('[data-teleport]').forEach(button=>button.addEventListener('click',async()=>{
 if(developerSearch||teleportJob||streamFailed)return;
 audio.start();if(state.level===27)leaveSpring(false);if(bathhouse.active)leaveBath(false);developerBusy(true);const kind=button.dataset.teleport;
 if(kind==='city-exit'){beginTeleport(exitTeleport(field,seed));}
 else if(['city-edge','city-core','city-plaza','city-vending','city-ad','city-bath','photo-hope','photo-clinic'].includes(kind)){const p=exitScene.waypoint(kind);referenceView=p.urbanPhoto?p:null;resize();enterCity();state.cx=BigInt(Math.floor(p.x/64));state.cz=BigInt(Math.floor(p.z/64));state.x=p.x-Number(state.cx)*64;state.z=p.z-Number(state.cz)*64;state.yaw=p.yaw;state.pitch=p.pitch??-.025;state.velocity.set(0,0,0);state.jump=state.vy=0;$('#developer-status').textContent='正在进入'+p.label+'…';await exitScene.prepareAt(p.x,p.z);exitScene.update(state);resetCameraRig();developerBusy(false);ready=true;closeModal(false);setPlay(true);toast('已抵达'+p.label+(p.urbanPhoto?'。当前为清晰对照机位，移动或环顾恢复探索。':'。'));}
 else if(kind.startsWith('farm-'))beginTeleport(farmViewTarget(kind,field,seed));
 else if(kind==='barn'||kind==='barn-photo')beginTeleport(barnTarget(field,seed,kind==='barn-photo',surfaceHeight));
 else if(kind==='start'){const f=field(0n,0n,seed);beginTeleport({field:f,cx:0n,cz:0n,x:.6,z:52,kind:'start',label:'初始小径'});}
 else{developerSearch=findNearestLandmark({...state},seed,kind);$('#developer-status').textContent='正在寻找最近的地标…';}
}));

function drink(){if(state.level===27&&inPool(state.x,state.z)&&!waterInspection.active){state.hydration=100;state.stamina=Math.min(100,state.stamina+8);toast('泉水温暖，带着淡淡的矿物质味道。');updateHUD();return;}if(state.bottles<1){toast('没有饮料。可以在路边、建筑内或售货机寻找。');return}const consumed=waterInventory.pop();state.bottles=waterInventory.length;waterInspection.clear();state.hydration=Math.min(100,state.hydration+45);state.stamina=Math.min(100,state.stamina+35);state.sanity=Math.min(100,state.sanity+20);audio.chime();toast(consumed?.kind==='vending'?'饮用了 '+vendingDrinkName(consumed.type)+'。':'饮用了杏仁水。杏仁的气味让人安心。');updateHUD()}
function use(){
 if(bathLoading)return;
 if(waterInspection.active){waterInspection.stow();return;}
 if(state.level===27){if(inPool(state.x,state.z)){springSession.sitting=!springSession.sitting;toast(springSession.sitting?'坐入温暖的泉水。E 起身 · Q 饮泉水':'沿瀑布旁的楼梯可以返回入口。');}return;}
 if(bathhouse.active){const i=bathShowerAt(state.x,state.z,.91);if(atBathExit(state.x,state.z)){leaveBath();return;}if(i<0||springSession.closing)return;let preset=bathhouse.presets[i];if(preset<2){preset++;bathhouse.presets[i]=preset;springSession.preset=preset;toast(preset===1?'淋浴已开启。E 调到最热预设。':'最高水温。站到花洒正下方，按 E 闭眼。');}else if(bathUnderShower(state.x,state.z)){springSession.preset=2;springSession.beginClose(true);toast('你闭上眼睛，热水从镜头上流下。');}else{bathhouse.presets[i]=0;springSession.preset=0;toast('已关闭这只花洒。');}return;}
 if(interaction?.kind==='bath-door'){enterBath();return;}

 if(!interaction)return;
 if(interaction.kind==='vending-machine'){const result=exitScene.backcourt.dispense();if(result.ok){audio.chime();naturalShadows.invalidate();toast(result.name+' 已送入取货口。');}else toast(result.reason==='cooldown'||result.reason==='busy'?'机器正在送出上一瓶，请稍等。':result.reason==='full'||result.reason==='capacity'?'取货口已经挤满，先取走一些饮料。':result.reason||'机器暂时没有回应。');interaction=null;return;}
 if(interaction.kind==='vending-drink'){const pickup=exitScene.backcourt.pickup(interaction.id,camera);interaction=null;if(!pickup)return;waterInventory.push(pickup.variant);state.bottles=waterInventory.length;waterInspection.begin(pickup.variant,pickup.worldPosition,camera);naturalShadows.invalidate();audio.chime();toast('已拾取 '+vendingDrinkName(pickup.variant.type));updateHUD();return;}
 if(interaction.kind==='barn-door'){const f=currentChunk()?.field;const x=state.x+(f?.barn?.x||0)-REFERENCE_BARN.doorX,z=state.z+(f?.barn?.z||0)-REFERENCE_BARN.depth/2;if(barnDoorGoal>0&&Math.abs(x)<2.4&&z>-.35&&z<2.5){toast('请先离开门扇的转动范围。');return;}barnDoorGoal=barnDoorGoal>0?0:1.47;interaction=null;return;}if(interaction.kind==='bottle'){const {p,chunk}=interaction;if(collected.has(p.id))return;const variant=p.almondVariant||almondVariant(p.id);p.mesh.getWorldPosition(pickupWorldPosition);waterInspection.begin(variant,pickupWorldPosition,camera);waterInventory.push(variant);collected.add(p.id);state.bottles=waterInventory.length;waterPipeline.removeBottle(p.mesh);releaseAlmondBottle(p.mesh);p.mesh=null;sceneBatches.refresh(chunk);audio.chime();toast('已拾取杏仁水');interaction=null}else{state.hydration=100;toast('喝了一口清水。有一点泥土的味道。');audio.footstep(false,true)}updateHUD()}
function jump(){if(state.level===27||bathhouse.active)return;if(state.grounded&&state.stamina>5){leaveReferenceView();state.vy=4.8;state.grounded=false;state.stamina-=4}}
async function fullscreen(){try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch{toast('此浏览器暂不支持全屏。')}}
document.addEventListener('keydown',e=>{if(bathLoading){e.preventDefault();return;}if(e.code==='KeyF'){e.preventDefault();if(!e.repeat)toggleMap();return;}if(e.code==='F2'){e.preventDefault();if(e.repeat)return;if(activeModal?.id==='developer')closeModal();else if(!teleportJob)openModal('developer');return}if(activeModal){if(e.code==='Escape'){e.preventDefault();closeModal()}if(e.code==='Tab'){const items=[...activeModal.querySelectorAll('button,input,select,[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');if(!items.length){e.preventDefault();return}if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items.at(-1).focus()}else if(!e.shiftKey&&document.activeElement===items.at(-1)){e.preventDefault();items[0].focus()}}return}if(!playing){
 const buttons=[...document.querySelectorAll('.menu-button')].filter(button=>!button.disabled);
 if(e.code==='ArrowDown'||e.code==='ArrowUp'){
  e.preventDefault();
  let index=buttons.indexOf(document.activeElement);
  index=(index+(e.code==='ArrowDown'?1:-1)+buttons.length)%buttons.length;
  if(buttons[index]){document.querySelectorAll('.menu-button').forEach(button=>button.classList.remove('selected'));buttons[index].classList.add('selected');buttons[index].focus();}
 }else if(e.code==='Enter'){
  e.preventDefault();
  const selected=buttons.includes(document.activeElement)?document.activeElement:$('#start');
  if(selected&&!selected.disabled)selected.click();
 }
 return;
} if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;if(e.code==='Escape')setPlay(false);if(e.code==='KeyE')use();if(e.code==='KeyQ')drink();if(e.code==='KeyR'&&waterInventory.length&&!waterInspection.active)waterInspection.begin(waterInventory.at(-1),null,camera);if(e.code==='Space')jump();if(e.code==='KeyJ')openModal('journal');if(e.code==='F10'){e.preventDefault();fullscreen();}});
document.addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>{keys.clear();resetLookInput();if(playing)setPlay(false)});
document.addEventListener('visibilitychange',()=>{irradiance.pause(document.hidden||state.level===11);weatherDirector.resetClock();if(document.hidden&&playing)setPlay(false)});
function resetLookInput(locked=document.pointerLockElement===renderer.domElement){
 lookInput.reset(performance.now(),{locked});mouseDragging=false;
 for(const [element,id] of [[renderer.domElement,lookPointer],[$('#joystick'),joyPointer]])if(id!==null&&element.hasPointerCapture?.(id))element.releasePointerCapture(id);
 lookPointer=joyPointer=null;joy.x=joy.z=0;touchRun=false;$('#stick').style.transform='';
}
function lookOptions(e,touch=false){const inspect=waterInspection.active;return{now:performance.now(),stamp:e.timeStamp,origin:performance.timeOrigin,locked:!touch&&document.pointerLockElement===renderer.domElement,mode:inspect?'inspection':'camera',scale:inspect?(touch?1.5:1):(touch?.004:Number(settings.sensitivity)*.000025)/Math.max(1,waterPipeline.focus.result.zoom)};}
document.addEventListener('mousemove',e=>{
 if(!playing||touchDevice)return;const locked=document.pointerLockElement===renderer.domElement;
 if(!locked&&!mouseDragging)return;const options=lookOptions(e);
 if(locked)lookInput.push(e.movementX,e.movementY,options);else lookInput.drag(e.clientX,e.clientY,options);
});
renderer.domElement.addEventListener('mousedown',e=>{if(playing){if(e.button===2){zoomHeld=true;leaveReferenceView();}mouseDragging=true;if(document.pointerLockElement!==renderer.domElement){lookInput.beginDrag(e.clientX,e.clientY);if(!touchDevice){try{renderer.domElement.requestPointerLock?.()?.catch?.(()=>{});}catch{}}}}});
addEventListener('mouseup',e=>{mouseDragging=false;lookInput.endDrag();if(e.button===2)zoomHeld=false;});renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
renderer.domElement.addEventListener('wheel',e=>{if(!playing||activeModal)return;e.preventDefault();if(waterInspection.active){waterInspection.zoom(e.deltaY);return;}leaveReferenceView();zoomSetting=T.MathUtils.clamp(zoomSetting*Math.exp(-e.deltaY*.0015),1,4.5);},{passive:false});
$('#touch-zoom').onclick=()=>{leaveReferenceView();zoomSetting=zoomSetting<1.5?2:zoomSetting<3?4.5:1;$('#touch-zoom').textContent=zoomSetting+'×';};
$('#joystick').addEventListener('pointerdown',e=>{joyPointer=e.pointerId;$('#joystick').setPointerCapture(e.pointerId);moveJoy(e)});
function moveJoy(e){if(e.pointerId!==joyPointer)return;const r=$('#joystick').getBoundingClientRect();let x=(e.clientX-r.left-r.width/2)/40,z=(e.clientY-r.top-r.height/2)/40,l=Math.hypot(x,z);if(l>1){x/=l;z/=l}joy.x=x;joy.z=z;$('#stick').style.transform=`translate(${x*33}px,${z*33}px)`}
$('#joystick').addEventListener('pointermove',moveJoy);for(const event of['pointerup','pointercancel'])$('#joystick').addEventListener(event,()=>{joyPointer=null;joy.x=joy.z=0;$('#stick').style.transform=''})
renderer.domElement.addEventListener('pointerdown',e=>{if(!playing||e.pointerType==='mouse')return;lookPointer=e.pointerId;lookInput.beginDrag(e.clientX,e.clientY);renderer.domElement.setPointerCapture(e.pointerId)});
renderer.domElement.addEventListener('pointermove',e=>{if(e.pointerId!==lookPointer||!playing)return;lookInput.drag(e.clientX,e.clientY,lookOptions(e,true));});
for(const event of['pointerup','pointercancel','lostpointercapture'])renderer.domElement.addEventListener(event,e=>{if(e.pointerId===lookPointer){lookPointer=null;lookInput.endDrag();if(event==='pointercancel')lookInput.reset(performance.now());}});
$('#touch-run').addEventListener('pointerdown',e=>{touchRun=true;e.currentTarget.setPointerCapture(e.pointerId)});for(const event of['pointerup','pointercancel'])$('#touch-run').addEventListener(event,()=>touchRun=false);$('#touch-use').onclick=use;$('#touch-drink').onclick=drink;$('#touch-jump').onclick=jump;

function currentChunk(){return chunks.get(`${state.cx},${state.cz}`)}
function cameraFloor(){if(state.level===27)return springFloor(state.x,state.z);if(bathhouse.active)return bathFloor(state.x,state.z);if(state.level===11)return exitScene.floorAt(Number(state.cx)*64+state.x,Number(state.cz)*64+state.z);const f=currentChunk()?.field;const base=f?surfaceHeight(state.x,state.z,f):height(state.x,state.z,state.cx,state.cz);return transitionProgress.value>.6?Math.max(base,exitScene.floorAt(Number(state.cx)*64+state.x,Number(state.cz)*64+state.z)):base}
function resetCameraRig(){
 resetLookInput();
 const eyeY=cameraFloor()+(referenceView?.eye??1.77);state.y=eyeY;
 cameraRig.reset({x:state.x,z:state.z,yaw:state.yaw,pitch:state.pitch,eyeY,jump:state.jump});wetPoseFresh=true;
}
function contactWheat(chunk,x,z){if(!chunk)return 0;let contact=0,bx=Math.floor(x/2),bz=Math.floor(z/2);for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const stems=chunk.wheatBuckets.get(`${bx+dx},${bz+dz}`);if(!stems)continue;for(const w of stems){const vx=x-w.x,vz=z-w.z,dist=Math.hypot(vx,vz);if(dist<.33)contact+=1-dist/.33;}}return Math.min(1,contact)}
function move(dt){const c=currentChunk(),inWheat=contactWheat(c,state.x,state.z),f=c?.field;let sx=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+joy.x,sz=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)+joy.z;
 const l=Math.hypot(sx,sz);if(l>1){sx/=l;sz/=l}const moving=l>.09,crouch=keys.has('KeyC'),running=(keys.has('ShiftLeft')||keys.has('ShiftRight')||touchRun)&&state.stamina>1&&moving&&!crouch;
 if(referenceView&&(moving||crouch||state.jump>0))leaveReferenceView();
 const water=f?.type==='pond'&&pondDistance(state.x,state.z,f)<1;const brushDrag=vegetationDrag(state,c?.softVolumes);let speed=(crouch?1.35:running?5.4:3.0)*(1-inWheat*.48)*(1-brushDrag)*(water?.55:1)*(state.hydration<10?.8:1);
 const tx=(Math.cos(state.yaw)*sx+Math.sin(state.yaw)*sz)*speed,tz=(-Math.sin(state.yaw)*sx+Math.cos(state.yaw)*sz)*speed,lerp=1-Math.exp(-dt*11);state.velocity.x=T.MathUtils.lerp(state.velocity.x,tx,lerp);state.velocity.z=T.MathUtils.lerp(state.velocity.z,tz,lerp);
 const oldX=state.x,oldZ=state.z;const next=moveNext;next.x=state.x+state.velocity.x*dt;next.z=state.z+state.velocity.z*dt;
 // Solid volumes are resolved locally; flexible stems use small capsules and drag.
 for(const ch of chunks.values()){if(Math.abs(Number(ch.field.x-state.cx))>1||Math.abs(Number(ch.field.z-state.cz))>1)continue;const ox=ch.group.position.x,oz=ch.group.position.z,local=moveLocal;local.x=next.x-ox;local.z=next.z-oz;resolveSolid(local,.26,ch.colliders);next.x=local.x+ox;next.z=local.z+oz;}
 if(c&&state.jump<.85){let bx=Math.floor(next.x/2),bz=Math.floor(next.z/2);for(let iz=-1;iz<=1;iz++)for(let ix=-1;ix<=1;ix++){for(const w of c.wheatBuckets.get(`${bx+ix},${bz+iz}`)||[]){let dx=next.x-w.x,dz=next.z-w.z,d=Math.hypot(dx,dz);if(d<.105&&d>.0001){const push=Math.min(.012,(.105-d)*.25);next.x+=dx/d*push;next.z+=dz/d*push}}}}
 exitScene.resolve(next,state);
 // Never enter an unstreamed field; it will be ready before the next normal step.
 const ncx=state.cx+BigInt(Math.floor(next.x/CHUNK)),ncz=state.cz+BigInt(Math.floor(next.z/CHUNK));if(state.level===11||chunks.has(`${ncx},${ncz}`)){state.x=next.x;state.z=next.z}
 const movedX=state.x-oldX,movedZ=state.z-oldZ,moved=Math.hypot(movedX,movedZ);state.distance+=moved;const shift=rebase(state);if(shift.dx||shift.dz)updateQueue();
 let landingSpeed=0;if(!state.grounded){state.vy-=12.2*dt;state.jump+=state.vy*dt;if(state.jump<=0){landingSpeed=-state.vy;state.jump=0;state.vy=0;state.grounded=true;audio.footstep(!!inWheat,water)}}
 state.stamina=T.MathUtils.clamp(state.stamina+(running?-17:12)*dt,0,100);state.hydration=Math.max(0,state.hydration-dt*(moving?.029:.009));state.elapsed+=dt;
 const eyeY=cameraFloor()+(referenceView?.eye??(crouch?1.06:1.77));
 rigInput.x=state.x;rigInput.z=state.z;rigInput.yaw=state.yaw;rigInput.pitch=state.pitch;rigInput.eyeY=eyeY;rigInput.jump=state.jump;rigInput.moved=moved;rigInput.dx=movedX;rigInput.dz=movedZ;rigInput.grounded=state.grounded;rigInput.running=running;rigInput.crouch=crouch;rigInput.stamina=state.stamina;rigInput.landingSpeed=landingSpeed;rigInput.enabled=settings.bob&&!reduceCameraMotion.matches;rigInput.locked=!!referenceView;
 const rig=cameraRig.update(dt,rigInput);
 state.y=rig.eyeHeight;step=rig.phase;wind.player.value.set(state.x,state.y,state.z);
 for(let i=0;i<rig.contacts;i++)audio.footstep(!!inWheat,water);
 audio.update(moving,inWheat,rainAmount);hadMovement=moving;
}
function scanInteraction(){
 interaction=null;

 const inspectionPrompt=$('#interact'),crosshair=$('.crosshair');
 if(waterInspection.active){inspectionPrompt.hidden=false;if(!inspectionPrompt.classList.contains('inspection'))inspectionPrompt.classList.add('inspection');crosshair.hidden=true;const text=waterInspection.name+'\n'+(touchDevice?'滑动旋转　E 收起　Q 饮用':'鼠标旋转 · 滚轮拉近　E 收起　Q 饮用');if(inspectionPrompt.textContent!==text)inspectionPrompt.textContent=text;return;}
 if(inspectionPrompt.classList.contains('inspection'))inspectionPrompt.classList.remove('inspection');crosshair.hidden=false;
 if(state.level===11&&!bathhouse.active){
  if(nearBathEntrance(Number(state.cx)*64+state.x,Number(state.cz)*64+state.z)){interaction={kind:'bath-door'};inspectionPrompt.hidden=false;inspectionPrompt.textContent='E 推开玻璃门 · 进入浴室';return;}
  const nearby=exitScene.backcourt.query(camera);if(nearby){interaction=nearby;inspectionPrompt.hidden=false;inspectionPrompt.textContent=nearby.kind==='vending-machine'?'E 按售货键 · 随机饮料':'E 拾取 '+nearby.name;return;}
 }
 let nearest=2.25;
 for(const chunk of chunks.values()){
  if(Math.abs(Number(chunk.field.x-state.cx))>1||Math.abs(Number(chunk.field.z-state.cz))>1)continue;
  for(const pickup of chunk.pickups){
   if(!pickup.mesh)continue;
   const dx=pickup.x+chunk.group.position.x-state.x;
   const dz=pickup.z+chunk.group.position.z-state.z;
   const distance=Math.hypot(dx,dz);
   if(distance<nearest){nearest=distance;interaction={kind:'bottle',p:pickup,chunk};}
  }
 }
 if(!interaction){
  const chunk=currentChunk();
  if(chunk?.field.type==='pond'&&pondShoreDistance(state.x,state.z,chunk.field)<1.8){
   interaction={kind:'water'};
  }
 }
 const bf=currentChunk()?.field;if(bf?.barn){const dx=state.x+bf.barn.x-REFERENCE_BARN.doorX,dz=state.z+bf.barn.z-REFERENCE_BARN.depth/2;if(Math.abs(dx)<3.3&&Math.abs(dz)<3.5)interaction={kind:'barn-door'};}
 const prompt=$('#interact');
 prompt.hidden=!interaction;
 if(interaction)prompt.innerHTML=interaction.kind==='barn-door'?`<kbd>E</kbd> ${barnDoorGoal>0?'关闭':'打开'}谷仓双门`:interaction.kind==='bottle'?'<kbd>E</kbd> 拾取杏仁水':'<kbd>E</kbd> 饮用湖水';
}
function updateHUD(){if(activeModal?.id==='developer')updateDeveloperCoordinates();const degrees=((Math.round(-camera.rotation.y*180/Math.PI)%360)+360)%360,dir=['N','NE','E','SE','S','SW','W','NW'][Math.round(degrees/45)%8];$('#bearing').textContent=`${dir}  ${String(degrees).padStart(3,'0')}°`;survivalDisplay.update(state.stamina,state.hydration,state.bottles,state.health,state.sanity);const c=currentChunk();let location=c&&roadDistance(state.x,state.z,c.field)>2.2?'田间草地':'泥土小径';if(c){const f=c.field;if(f.type==='pond'&&pondShoreDistance(state.x,state.z,f)<7)location='湖泊 · 未开垦的低地';else if(f.type==='building'){const[w,d]=buildingSize(f);const bp=buildingLocal(state.x,state.z,f);if(Math.abs(bp.x)<w/2&&Math.abs(bp.z)<d/2)location=BUILDING_NAMES[f.variant];else if(contactWheat(c,state.x,state.z)>.1)location='麦田 · 作物齐腰'}else if(contactWheat(c,state.x,state.z)>.1)location='麦田 · 作物齐腰'}if(c&&roadDistance(state.x,state.z,c.field)>2.5&&location.includes('麦田'))location=['麦田 · 成熟小麦','麦田 · 枯褐大麦','收割后的麦茬地'][cropSample(state.x,state.z,c.field,{}).crop];if(c&&location==='田间草地'&&cropSample(state.x,state.z,c.field,{}).crop===2)location='收割后的麦茬地';if(c&&barnFootprintDistance(state.x,state.z,c.field)<0)location='砖砌谷仓 · 临时栖身处';if(c){const a=compoundAt(state.x,state.z,c.field,{});if(a.footprint<0)location=a.component?.variant!==undefined?BUILDING_NAMES[a.component.variant%8]:a.component?.kind==='silo'?'筒仓':'田间旧建筑';else if(a.yard>.35)location=a.plan?.kind==='hamlet'?'农庄聚落 · 前院':a.plan?.kind==='farm'||a.plan?.kind==='extension'?'农庄 · 作业地':'建筑旁的踩踏地';}if(state.level===27)location='岩体泉 · 32.2°C · 泡浴 '+Math.floor(springSession.bathSeconds/60)+' 分钟';if(state.level===11)location='Level 11 · '+({commercial:'商业边缘区',mixed:'都会过渡区',core:'金融街峡谷',civic:'公共广场区',warehouse:'仓储街区'}[exitScene.stats.district]||'无垠城市');if(bathhouse.active&&state.level!==27)location='BAÑOS · '+(state.x>4.15&&state.z<5?'水疗壁龛':state.z>6.4?'前厅':inChanging(state.x,state.z)?'更衣室':state.x< -4?'淋浴间':'假风景空池');$('#location').textContent=`${location}  /  ${Math.round(state.distance)} m`;$('#fps').textContent=`${Math.round(fps)} FPS${settings.filter==='vhs'?' · VHS '+Math.round(displayFilter.values.fps):''} · ${chunks.size} 区块${settings.devMode?'\n'+performanceText():''}`;}

const normalFog=new T.Color('#acb6b1'),clearFog=new T.Color('#b4cbd2'),duskFog=new T.Color('#b9a4a0'),duskFill=new T.Color('#8998b2'),normalFill=new T.Color('#c9d2d4');
let activeReferenceEnvironment=null;
function weather(dt,renderDt=dt){
 activeReferenceEnvironment=referenceEnvironment(Number(state.cx)*64+state.x,Number(state.cz)*64+state.z,state.level);
 const profile=activeReferenceEnvironment,referenceBlend=profile?.amount||0;if(referenceBlend)rainAmount*=1-referenceBlend;
 const mist=weatherState.mist*(1-referenceBlend),clear=weatherState.clear,dusk=weatherState.dusk;
 const coverage=state.level===11?(exitScene.stats.coverage||212):Math.max(.2,coverageRadius*CHUNK+Math.min(state.x,state.z,CHUNK-state.x,CHUNK-state.z)-8);
 const approach=ease(.38,.91,transitionProgress.value);const far=state.level===11?Math.min(coverage,settings.quality==='low'?210:280):Math.min(coverage,((settings.quality==='low'?165:225)-rainAmount*40)*(1-approach)+175*approach);
 scene.fog.far=Math.min(coverage,T.MathUtils.lerp(scene.fog.far,far,1-Math.exp(-renderDt*.8)));
 scene.fog.near=Math.min(scene.fog.far*.44,T.MathUtils.lerp(scene.fog.near,(state.level===11?55:60-rainAmount*20-approach*32),1-Math.exp(-renderDt*.55)));
 if(referenceView&&!teleportJob&&!queue.length&&!activeBuild&&mist<.02&&rainAmount<.02){scene.fog.near=referenceView.range*.77;scene.fog.far=referenceView.range;}
 if(profile){const extended=profile.hero||referenceView?.urbanPhoto;scene.fog.near=T.MathUtils.lerp(scene.fog.near,extended?profile.near:Math.min(140,coverage*.6),referenceBlend);scene.fog.far=T.MathUtils.lerp(scene.fog.far,extended?profile.far:Math.min(coverage,280),referenceBlend);}
 const clipFar=Math.max(64,Math.ceil(scene.fog.far/4)*4+4);if(camera.far!==clipFar){camera.far=clipFar;camera.updateProjectionMatrix();}
 atmosphere.fog.uniforms.uLayerFogScale.value=referenceView&&mist<.02&&rainAmount<.02 ? .1 : 1;
 scene.fog.color.copy(normalFog).lerp(clearFog,clear).lerp(duskFog,dusk);if(state.level===11)scene.fog.color.set('#bfc8c7');scene.background.copy(scene.fog.color);
 skyFill.groundColor.set('#6b6042');skyFill.color.copy(normalFill).lerp(duskFill,dusk);skyFill.intensity=1.4*(1-dusk*.42)*(1-rainAmount*.12);if(profile){scene.fog.color.lerp(profile.fog,referenceBlend);scene.background.copy(scene.fog.color);skyFill.color.lerp(profile.fill,referenceBlend);skyFill.groundColor.lerp(profile.ground,referenceBlend);skyFill.intensity=T.MathUtils.lerp(skyFill.intensity,profile.fillPower,referenceBlend);atmosphere.fog.uniforms.uLayerFogScale.value=1-referenceBlend*.97;}
 wind.strength.value=.60+Math.sin(time*.15)*.23+rainAmount*.4;
 atmosphere.update({time:weatherDirector.elapsed,quality:settings.quality,camera,originX:state.cx,originZ:state.cz,groundHeight:cameraFloor(),mist,rain:rainAmount,event:weatherState,reference:profile});
 waterPipeline.focus.setMist(atmosphere.volume.localAmount(camera));
 weatherLight.set(-.45,.84,-.30).lerp(duskLight,dusk).normalize();if(profile)weatherLight.lerp(profile.sun,referenceBlend).normalize();
 rainWind.set(.85+Math.sin(weatherDirector.elapsed*.075)*.26,0,.30+Math.cos(weatherDirector.elapsed*.06)*.18);
 rainEffects.update(dt,{state,camera,chunks,rain:rainAmount,active:playing&&!teleportJob,wind:rainWind,cameraVelocity:wetCameraVelocity,lightDirection:weatherLight,submerged:waterState.wet});
 wetGround.update({rain:rainAmount,wetness:weatherDirector.wetness,time:weatherDirector.elapsed,state,sky:scene.fog.color});
 weatherFlare.update(playing?dt:0,{weather:weatherState,camera,state,chunks});
 const label=WEATHER_LABELS[weatherState.kind];const phase=weatherState.kind==='rain'?` · 雨量 ${Math.round(rainAmount*100)}%`:weatherState.kind==='fog'?` · 雾锋 ${Math.round(weatherState.fogProgress*100)}%`:weatherState.kind==='sunbreak'?(dusk>.1?' · 转入黄昏':' · 天空放晴'):'';
 if(label!==lastWeather){$('#weather-label').textContent=label;lastWeather=label;}
 if(activeModal?.id==='developer'){const status=$('#weather-status'),text=label+phase+(weatherDirector.kind==='normal'?' · 等待下一轮判定':` · ${Math.ceil(Math.max(0,weatherDirector.duration-weatherDirector.age))} 秒`)+' · 自然判定：雨 / 雾各 10%，异常各 1%';if(status.textContent!==text)status.textContent=text;}
}

renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();irradiance.pause();displayFilter.contextLost();waterRipples.contextLost();waterState.reset();bodyWater.reset();waterBubbles.clear();waterImpact.clear();rainEffects.clear();performanceMeter.reset();contextLost=true;if(playing)setPlay(false);$('#start').disabled=true;$('#start').innerHTML='<span>画面正在恢复</span><small>…</small>'});
renderer.domElement.addEventListener('webglcontextrestored',()=>{contextLost=false;if(state.level===27||bathhouse.active)renderer.shadowMap.needsUpdate=true;naturalShadows.invalidate();irradiance.restore();$('#start').disabled=!ready||!!teleportJob;$('#start').innerHTML='<span>继续探索</span><small>ENTER ↵</small>';resize()});
function animate(now){requestAnimationFrame(animate);const rawDt=(now-lastFrame)/1000;lastFrame=now;if(bathLoading){lookInput.reset(now);return;}const look=lookInput.frame(now);if(look.recovered){cameraRig.resume();wetPoseFresh=true;}if(playing&&(look.x||look.y)){if(look.mode==='inspection'){if(waterInspection.active)waterInspection.rotate(look.x,look.y);}else if(!waterInspection.active){leaveReferenceView();state.yaw-=look.x;state.pitch=T.MathUtils.clamp(state.pitch-look.y,-1.4,1.4);}}const dt=Math.min(.035,Math.max(.001,rawDt));if(document.hidden||contextLost)return;performanceMeter.begin(settings.showfps||settings.devMode);time+=dt;if(state.level===27){animateSpring(now,dt,rawDt);return;}if(bathhouse.active){animateBath(now,dt,rawDt);return;}retireOldFields();advanceDeveloperSearch();wind.time.value=time;waterTime.value=time;updateCropGroundTime(time);
 if((queue.length||activeBuild)&&!streamFailed&&(!playing||frameCount%3===0)){try{streamOne()}catch(e){streamFailed=true;console.error('World streaming failed',e);if(developerSearch){developerSearch.return();developerSearch=null;}if(teleportJob)teleportJob=null;developerBusy(false);$('#developer-status').textContent='场景加载失败，请刷新页面重试。';
$('#start').disabled=true;$('#start').innerHTML='<span>场景加载失败 · 请刷新</span><small>↻</small>';return}const total=(radius()*2+1)**2,progress=Math.round(chunks.size/total*100);if(teleportJob&&navigationMap.isOpen)navigationMap.setStatus(`正在准备${teleportJob.target.label} · ${Math.min(100,progress)}%`);$('#load-number').textContent=progress+'%';$('#load-bar').style.width=progress+'%';if(!ready&&!teleportJob&&neighbourhoodReady()){ready=true;$('#start').disabled=false;$('#start').innerHTML='<span>进入麦田</span><small>ENTER ↵</small>'}if(!queue.length&&!activeBuild)$('#loading').hidden=true;}
 completeTeleport();
 weatherState=weatherDirector.tick(now,playing&&state.level!==27&&!bathhouse.active&&!teleportJob&&!navigationMap.isOpen);rainAmount=weatherState.rain;
 if(state.level===27){animateSpring(now,dt,rawDt);return;}
 if(bathhouse.active){animateBath(now,dt,rawDt);return;}
 updateSpringEntry(dt);
 if(state.level===27){animateSpring(now,dt,rawDt);return;}
 // The opaque map covers the scene. Stop 3D rendering/detail updates while
 // reading it; world streaming continues when a map teleport is in progress.
 if(navigationMap.isOpen){navigationMap.update(mapPose(),now,false,!teleportJob);rainEffects.clear();waterImpact.clear();waterRipples.reset();lensWater.update(0,{enabled:false});irradiance.pause();displayFilter.render(scene,camera,now,undefined,true);performanceMeter.end();return;}
 const wetDistance=state.distance,wetFall=state.vy;
 if(playing){move(dt);survivalDisplay.animate(dt,state,step);}else{if(!cameraRig.initialized||(!started&&Math.abs(cameraRig.height.position-cameraFloor()-1.77)>.001))resetCameraRig();wind.player.value.set(10000,0,10000)}
 updateExit();exitAudio.update(transitionProgress.value,state.level===11,time);
 if(state.level===11&&playing&&!teleportJob)exitScene.backcourt.tick(dt,state,true,camera);
 navigationMap.update(mapPose(),now,playing,!teleportJob);
 const wf=currentChunk()?.field,wa=wf?.type==='pond';
 const lampNear=state.cx>=-1n&&state.cx<=3n&&state.cz>=-4n&&state.cz<=0n;shelterLamp.intensity=lampNear?.05:0;if(lampNear)shelterLamp.position.set(Number(1n-state.cx)*64+16.32,1.28,Number(-2n-state.cz)*64+47.91);
 const weatherCover=weatherSurface(state.x,state.z,state,chunks);
 wetCameraVelocity.copy(cameraRig.velocity);if(!playing)wetCameraVelocity.set(0,0,0);wetCameraVelocity.y=T.MathUtils.clamp(wetCameraVelocity.y,-9,9);
 wetInput.rain=rainAmount;wetInput.humidity=T.MathUtils.clamp(.22+rainAmount*.72+atmosphere.volume.localAmount(camera)*.65,0,1);wetInput.sheltered=!!weatherCover&&weatherCover.roof>camera.position.y;wetInput.enabled=playing&&!teleportJob;wetInput.aspect=camera.aspect;wetInput.shore=wa?pondShoreDistance(state.x,state.z,wf):Infinity;wetInput.hasWater=wa;wetInput.cameraHeight=camera.position.y;wetInput.feet=wf?cameraFloor()+state.jump:Infinity;wetInput.level=wa?wf.lakeY:0;wetInput.moved=state.distance-wetDistance;wetInput.speed=(state.distance-wetDistance)/dt;wetInput.grounded=state.grounded;wetInput.fallSpeed=wetFall;wetInput.pitch=camera.rotation.x;wetInput.yaw=camera.rotation.y;wetInput.cameraVelocity=wetCameraVelocity;wetInput.wind=rainWind;wetInput.lightDirection=weatherLight;wetInput.roll=camera.rotation.z;wetInput.accelX=wetPoseFresh?0:((wetCameraVelocity.x-wetLastVx)*Math.cos(camera.rotation.y)-(wetCameraVelocity.z-wetLastVz)*Math.sin(camera.rotation.y))/dt*.025+angleDelta(camera.rotation.y,wetLastYaw)/dt*.055;
 const waterCrossing=playing&&!teleportJob?waterState.update(weatherDirector.delta,wetInput):waterState.result;wetInput.waterCrossing=waterCrossing;
 lensWater.update(weatherDirector.delta,wetInput);
 if(waterCrossing.crossing===1&&playing)waterBubbles.emit(camera,state,wetInput.level);
 if(playing&&!teleportJob)bodyWater.update(weatherDirector.delta,state,wetInput,waterCrossing.crossing);
 wetLastVx=wetCameraVelocity.x;wetLastVz=wetCameraVelocity.z;wetLastYaw=camera.rotation.y;wetPoseFresh=false;
 waterBubbles.update(weatherDirector.delta,camera,state,playing&&!teleportJob);

 impactLighting.intensity=1-rainAmount*.32;impactLighting.ambientIntensity=1-weatherState.dusk*.22;waterImpact.update(weatherDirector.delta,state,camera,playing&&!teleportJob,impactLighting);
 if(playing&&(keys.has('KeyZ')||zoomHeld))leaveReferenceView();
 waterPipeline.focus.setZoom(playing&&(keys.has('KeyZ')||zoomHeld)?Math.max(3,zoomSetting):zoomSetting);
 waterPipeline.update(weatherDirector.delta,camera,state,playing&&!teleportJob,!!referenceView,scene.fog.color,weatherLight,weatherState.mist,wa?wf.lakeY:0);
 if(Math.abs(barnDoorGoal-barnDoorAngle)>.001){barnDoorAngle+=Math.sign(barnDoorGoal-barnDoorAngle)*Math.min(Math.abs(barnDoorGoal-barnDoorAngle),dt*.85);for(const ch of chunks.values())updateBarnDoors(ch,barnDoorAngle);naturalShadows.invalidate();}
 if(ruralActive){powerNetwork.update(state.cx,state.cz);sceneBatches.update(`${state.cx},${state.cz}`);wheatView.value.copy(camera.position);wheatDetail.update(chunks,camera.position,settings.quality,`${state.cx},${state.cz}`);}
 weather(weatherDirector.delta,dt);if(state.level===10)irradiance.update({state,now,rain:rainAmount,clear:weatherState.clear,dusk:weatherState.dusk,enabled:ready&&!teleportJob&&state.level===10});
 const exposure=activeReferenceEnvironment?T.MathUtils.lerp(irradiance.exposure(camera.position),activeReferenceEnvironment.exposure,activeReferenceEnvironment.amount):state.level===11?1.23:irradiance.exposure(camera.position);renderer.toneMappingExposure=T.MathUtils.lerp(renderer.toneMappingExposure,exposure,1-Math.exp(-dt*(exposure<renderer.toneMappingExposure?2.2:.8)));
 uiTick+=dt;if(uiTick>.12){uiTick=0;if(playing)scanInteraction();updateHUD()}
 rippleInput.active=playing&&!teleportJob;waterRipples.update(weatherDirector.delta,rippleInput);
 sceneBatches.updateView(camera);performanceMeter.markSimulation();displayFilter.render(scene,camera,now,()=>{performanceMeter.beforeRender();waterRipples.render();naturalShadows.update({now,originKey:`${state.cx},${state.cz}`,quality:settings.quality,rain:rainAmount,clear:weatherState.clear,dusk:weatherState.dusk,reference:activeReferenceEnvironment});sceneBatches.enforceBudget(camera,naturalShadows.csm.lights,extraBudgetRoots,235000,renderer.shadowMap.needsUpdate);});performanceMeter.end();document.documentElement.dataset.bootState="ready";frameCount++;frameTime+=rawDt;
 if(frameTime>=1.5){fps=frameCount/frameTime;frameCount=0;frameTime=0;if(playing&&!queue.length&&!activeBuild&&['pixel','native'].includes(settings.filter)){qualityTimer+=1.5;if(qualityTimer>4.5){let next=autoScale;if(fps<35)next=Math.max(.6,autoScale-.08);else if(fps>57)next=Math.min(1,autoScale+.025);if(next!==autoScale){autoScale=next;resize()}qualityTimer=0}}}
}
addEventListener('pagehide',event=>{if(!event.persisted){spring.dispose();bathhouse.dispose();bathTransition.dispose();exitScene.dispose();chunkStream.dispose();powerNetwork.dispose();sceneBatches.dispose();wheatDetail.dispose();displayFilter.dispose();waterBubbles.dispose();rainEffects.dispose();weatherFlare.dispose();lensWater.dispose();atmosphere.dispose();waterImpact.dispose();waterRipples.dispose();naturalShadows.dispose();irradiance.dispose()}});
requestAnimationFrame(animate);
