# Level 0 出生点 · Cycles

依据用户提供的 `image(20261025-021528).png` 重建。右墙复用项目已有的经典墙纸；参考照片没有用作背景或投影贴图。

`level0-spawn.blend` 包含可编辑墙体、天花、地毯、踢脚线、灯具、相机、材质、表面 UV 和独立烘焙 UV。几何来自游戏的 `level0-spawn117.js`，材质与灯光参数来自 `level0-spawn-look.js`。贴图相对路径指向仓库 `dist/assets`，请在完整工程中打开。

```sh
node scripts/export-spawn-cycles.mjs
blender -b -t 8 --python scripts/bake-spawn-cycles.py
python scripts/pack-spawn-cycles.py
```

使用 Blender 4.3.2、Cycles CPU、64 samples、六次漫反射反弹；压缩脚本需要 NumPy、Pillow、SciPy。运行时使用一张 1024² WebP 光照图，平方解码到线性空间，颜色与法线保持独立。每个接收面单独滤波和扩边，游戏直接在原材质上采样；替代出生点原来的乘色覆盖面，其他区域沿用现有光场。

只有七盏固定荧光灯参与烘焙。玩家已有的实时手电筒保留其光束、cookie 和材质响应，绝不参与 Blender 烘焙。电闸继续控制本区静态光照。

固定参考视角在 Blender 和游戏中使用同一组透视、倾角和移轴。Blender 合成器使用 Three.js 的 ACES 曲线及 0.91 exposure。实机截图来自本地 Chrome / SwiftShader 的原生 Level 0 场景；它们不能证明硬件帧率或与照片逐像素完全相同。

本次只修改 Level 0 出生点，在独立分支保存，不发布网站、不改 Maltose 市集与帐篷。
