# Level 11 后场墙角：模型、贴图与 Three.js 实现

本次在原有售货机、候座、投币秤、通知栏、灯、地垫及插座电线周围添加环境细节。现有模型和饮料物理互动保留。新模块为 `dist/backcourt-residue-v71.js`，使用原场景的米制坐标、地面高度与旋转框架。

## 空间与模型构建

墙边保留大片空白，细节集中在公共设施的接触处。饮水机与湿痕相连，遗落 PDA 位于售货机取货区侧边，穿墙显示器呼应候座区。半埋物件保持日常物品的完整轮廓；异常来自实际地面/墙壁遮挡，而不是画上的断面或悬浮摆件。这是本场景的美术推演。

| 物件 | Clinic 局部 X / Z（米） | 局部高度/方向 | 结构 |
| --- | --- | --- | --- |
| PDA | 35.25 / 20.30 | 背面贴地，偏转 −0.38 rad | 75×135×21 mm 厚机身；48×64 mm 屏幕；26 字母键、导航键、轨迹球、听筒、侧键、真实 USB 凹槽、触笔槽、后盖、镜头及螺丝 |
| 充电器 | 35.43 / 20.32 | 地面支承，偏转 0.32 rad | 壳体、折叠插脚、USB 端口、应力保护套、插头和落地弯曲线缆 |
| 饮水机 | 30.20 / 19.10 | 完整高度 0.90 m，埋入 0.45 m，偏转 −0.12 rad | 有内外壁的凹盆、翻边、排水孔和格栅、弯管喷嘴、按钮、检修盖与螺栓 |
| CRT 显示器 | 40.20 / 18.40 | 底部 1.06 m，偏转 −0.15 rad | 380 mm 宽厚壳体，后壳进入既有墙体；凹入屏幕、前框、按钮、灯、通风孔与电线 |
| 塑料椅 | 28.60 / 19.45 | 埋入 0.35 m，偏转 0.21 rad | 有厚度的弧形靠背/座面、弯曲椅腿、筋条与脚部 |
| 墙脚过渡 | X 25.64–41.86，Z 18.34 | 45 mm 半径 | 连续四分之一圆弧凹脚线，与地面有水平切线，避免墙脚硬折线 |

饮水机、椅子和 CRT 的穿模是明确的设计效果；其余接头、线缆和落地位置按实际几何支承。它们的可见占地有碰撞体；PDA 和触笔不阻断行走。

## 生成贴图

使用内置 ImageGen，11 份独立生成源图，另做 1 次 CRT 标志移除编辑。材质源为 3×2 六通道图集，各通道直接生成；裁切与编码不会补画图案。36 张 WebP 运行贴图约 9.52 MB，原图、每次调用的提示词、所读提示技能和来源均保存在此目录。所有新增不透明结构都有贴图和法线；屏幕、透光罩使用相应独立材质。

| 材质/内容 | 运行尺寸 | 覆盖与参数 |
| --- | --- | --- |
| 石砖、PDA 黑塑料、氧化钢、米色 ABS、橡胶 | 各通道 512² | BaseColor / Normal / Roughness / Metallic / AO / Height，每组 6 张 |
| PDA 屏幕、实体键盘图集 | 768×1024 | 独立生成 RGB；屏幕兼作 emissiveMap；键盘采用经过逐格校正的 UV 裁切 |
| CRT 桌面 | 1024×768 | 蓝绿拟物桌面与静止连接窗口，独立 emissiveMap |
| 墙脚污垢 | 1024×512 RGBA | 原始生成透明遮罩，局部墙面 decal，opacity 0.32 |
| 墙角积尘 | 512×1024 RGBA | 黄尘、暗污、向边缘衰减，贴在真实墙面 |
| 水迹 | 512² RGBA | 地面材质内湿润遮罩，无独立水面/铺地 Mesh |

BaseColor、UI、Emissive 和彩色 decal 使用 `SRGBColorSpace`；Normal、Roughness、Metallic、AO、Height 使用 `NoColorSpace`。Roughness 读取 G，Metallic 读取 B，AO 读取 R。几何保留 UV 与 UV1；材质参数会乘以贴图值，因此表中的标量不等于最终逐像素值。

PDA/ABS 粗糙度标量 0.95，橡胶 0.95，钢材 0.55、金属度 0.88；细塑料法线强度 0.11–0.12。石砖法线强度 0.48，湿痕区域粗糙度向 0.15 混合并略微变暗。石砖非验证无缝源采用镜像重复，地面自定义法线同步翻转切线分量，避免直线接缝。

Height 文件作为资产提供，当前不对既有地面做顶点置换。砖缝与缺损通过生成法线、AO 和颜色体现；不宣称这些贴图是扫描或经过物理测量的高度。各生成通道微观配准是近似的。

## 布局代码和渲染

实际源文件：

- `dist/pda-relics-v71.js`：可复用 PDA/充电器模型工厂，包含生成键盘的准确 UV。
- `dist/clipping-relics-v71.js`：饮水机、CRT、椅子模型工厂。
- `dist/backcourt-residue-v71.js`：布局、碰撞、静态合批与实用光源。
- `dist/backcourt-materials-v71.js`：36 张贴图载入和 PBR 材质。
- `dist/backcourt-ground-v71.js`：对原地面的局部法线/AO/湿痕着色器扩展。

```js
await initializeCornerTextures();
const corner = createCornerResidue();
exitRoot.add(corner.object);
const cornerGround = attachCornerGround(urbanMaterials.photoCobble);
// 每次 64 m 原点重定位，与 exitRoot 的平移同步：
cornerGround.rebase(state.cx, state.cz);
```

沿用游戏的 ACES 色调映射、sRGB 输出、既有天气、阴影和显示滤镜。PDA 与售货机有两盏不投影的小型点光源，衰减指数 2；距离裁剪属于性能/美术约束，不能称为无限范围物理传播。PDA 光源强度 0.017，范围 0.52 m；售货机局部溢光强度 0.65，范围 2.5 m。CRT 有屏幕自发光。没有新增反射捕获、传输二次渲染、全屏噪声通道或动态阴影贴图。

地面扩展只作用于约 X 26–42 / Z 18.25–23 的后场，离开区域跳过额外贴图采样；不存在另一层地板或水洼平面。既有行走高度不变。所有新增静态模型最终按材质合并为 **13 个绘制批次、19,646 三角形**。这种预算检查不是硬件 FPS 测量。

## 参考与验证

年代参考采用 [2009 年 Nokia E72 厂商介绍](https://blogs.windows.com/devices/2009/06/15/nokia-e72-unveiled-pics-and-video/)、[BlackBerry 9700 官方运营商使用指南](https://www.att.com/support_static_files/guides/BlackBerry_Bold_9700_QSG.pdf) 和 [2009 年 Windows Mobile 6.5 图标规范](https://blogs.windows.com/windowsexperience/2009/07/24/creating-custom-icons-for-windows-mobile-6-5/)。圆角框、投影及反射属于当年的官方图标指导；本次蓝绿拟物 UI 是原创生成内容，没有复制品牌桌面素材。

技术依据：[MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html)、[PointLight](https://threejs.org/docs/pages/PointLight.html)。法线改变光照，不改变模型轮廓；轮廓转角、孔槽与实体厚度由几何体提供。

`tests/backcourt-v71/corner-check.mjs` 验证真实贴图尺寸/色彩空间、模型属性、预算、通道碰撞、地面高度与 64 m 重定位。模型原始验证保存在 pda-model 和 clipping-models 子目录。软件 GLES 诊断使用实际 Three.js 着色器，检查局部俯视、墙角和穿模物件；不等于浏览器或线上截图，诊断没有既有环境反射立方体的完整 PBR 反射。浏览器硬件帧率未测量。
