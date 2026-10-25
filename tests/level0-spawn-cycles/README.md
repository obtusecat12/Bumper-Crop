# 出生点实机对照

`final.png` 是本地 Chrome / SwiftShader 渲染的原生 Level 0 场景，使用游戏材质、HDR 深度目标、原有 Level 0 合成器及 ACES / 0.91 exposure。固定机位为 640 × 480；不是用照片充当背景，也不是 Blender 图片冒充实机截图。

`player-light.png` 使用游戏原有 `flashlight117.js`，实际启用其光束与 cookie（intensity 46）。该光源没有参与 Cycles 烘焙。截图中的手电光可随玩家移动。

`final.json` 记录该次浏览器与着色器错误；`reference-colour.json` 记录同一组参考图与实机取样区域，供后续调整，不能代替整幅画面的视觉判断。

验证范围是出生点场景、材质、烘焙接入和现有手电照明；未运行无关的全项目测试，也未据软件渲染推断硬件帧率。单张照片重建及现有墙纸纹样仍有差异，不宣称逐像素完全一致。

重拍：先在项目根目录运行 `node tests/level0-spawn-cycles/capture.mjs final`。需要 Playwright Core 与 Chrome；可用 `CHROME_PATH` 指定本机浏览器。示例脚本的 Playwright 导入位置对应本次开发环境。
