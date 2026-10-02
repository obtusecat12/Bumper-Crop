# V70 背面公共停留点：只读空间调查

## 位置与空间意图

图二目标是 `clinic-district.js` 的白灰色新 infill 背面，**不是** Level 27、浴室右侧 spa、图一 Hope St 正面或远处东侧拱廊。所有坐标来自 `clinicToWorld`，不应用原拍摄地标的 `photoHandedness` / `.64` 缩放。该 infill 中心 `(33.75, 3.26, 11.97)`，尺寸 `16.3 × 6.52 × 12.74 m`，后墙 `z=18.34`、`x=25.6..41.9`，屋顶到 `y=7.22`。在这里把日常公共设施聚在边缘，保留背面广场大部分空地。表达无人的运作中商业公用空间，而不是废墟或恐怖道具堆。

对应物件核对：图中照片亭是 `(32.2,30.75)`；蓝报箱 `(42.6,20.5)`；弯杆路灯 `(29,25)`；自行车架 `(28.1,24)`；近景黑黄柱 `(44,27.3)`；左棕榈 `(31.5,34)`。新机必须与这些保留物形成同一米制空间。

地面世界高度 `EXIT_CITY_Y + .02 = .30 m`，机器、候座、体重秤底面在 `.30 m`，不能当作广场铺砖 `.40 m` 高度安放。机前地垫厚 16 mm，底面直接贴 `.30 m` 地面。将墙背面的立面新物体挂在 `z>18.34`，有实际背板/螺栓/支承，正面朝 local +z。

## 推荐的六个物件组合

| 物件 | local 中心 x,z | 尺寸 w,h,d | 精细建模与独立生成贴图 |
|---|---|---|---|
| 瀑布售货机（核心） | 34.5,19.04 | 1.02,1.89,.90 m | 弧面瀑布透光门真实厚度；中央原图重生成画、左细窄区、右选择条分别生成；按钮透明帽/背板/付款读屏/硬币返回/锁/门铰链/冷凝器栅/橡胶底脚/出口舱/电线。光只微自发光，不加新阴影灯。机背留约 .25 m 到墙供通风。 |
| 三位联排候座 | 38.0,19.08 | 2.15,.90,.64 m | 米灰塑料/墨蓝旧乙烯基弧形座背、连续钢梁、两个铸铝 T 脚、每座固定件、坐垫边缘倒角。旧塑料/乙烯基纹理独立生成，正常粗糙与法线细节；无 USB/触屏元素。 |
| 乳白色投币体重秤 | 31.4,19.12 | .65,1.92,.80 m | 圆形真实表盘玻璃、刻度生成纹理、单独针轴/针、投币缝、铬边、非对称厚立柱、黑橡胶踏板斜边。用温和公众健康服务感，不用金色维多利亚装饰。文字 YOUR WEIGHT / 25¢，英制与公制可双标。 |
| 玻璃公告框 | 38.0,18.395 | 1.62,.88,.075 m，中心 y1.95 | 壁挂铝框/锁孔/玻璃薄层、软黄纸 A4 公告、旧照片、被日晒的 2005 年导览图分别生成。英文字 PALM COURT / PUBLIC CONCOURSE / REFRESHMENTS / WEST PASSAGE，内容应对应真正通路，不造不存在的出口。 |
| 环孔橡胶垫 | 34.5,20.02 | 1.42,.016,.68 m | 八角环与排水孔有几何厚度，边缘楔形倒角。生成橡胶颗粒/少量粉尘/局部擦亮纹理及法线/粗糙度；不能是另一个飘浮大地面贴片。机器前方收取饮料区要给掉落物真实刚体接触。 |
| 乳白椭圆防水壁灯 | 34.5,18.48 | .42,.23,.18 m，中心 y2.58 | 传统 E27 opal bulkhead 轮廓，真实保护圈/塑料灯罩条纹/壁脚/两颗螺栓/金属导管到售货机服务插座。微暖低照度稳定亮光，固定自发光即可，别加每帧阴影/闪烁。 |

可选交换项：如果体重秤过于年代久远，可换成窄蓝回收桶 `x40.5,z19.0,w.62,d.51,h.94`，要有瓶罐圆开口、厚卷边、落地底脚和新生图 BOTTLES & CANS 标签。但已有蓝报箱与多个公共垃圾桶，这个交换项的视觉收益低于体重秤。

## 查阅到的实际设计资料（全部只作形态/构造学习）

1. Eames Institute 1962 联排座椅原始宣传页：连续钢梁、可变座位数、悬挂软座以及后续塑料壳座。这是很适合旧公共等候点的构造；仍需自己生成材质，不照用版权照片。https://www.eamesinstitute.org/collection/artifacts/eames-tandem-seating-pamphlet/
2. Herman Miller 产品表提供座高约17.75in、座位尺度与铸铝/钢梁结构。其现售版 USB 模块是现代新增，不复制。https://www.hermanmiller.com/content/dam/hermanmiller/documents/product_literature/product_sheets/eames_tandem_sling_seating_product_sheet.pdf
3. Science Museum Group 的公共体重秤档案记录投币公共秤和约2m高/650mm宽/850mm深，帮助避免把秤做成小箱子。1895–1905原件只作机构参照，场景应做简化战后白珐琅/镀铬版，不能照搬金色古董外形。https://collection.sciencemuseumgroup.org.uk/objects/co8906005/henry-pooley-son-limited-platform-weighing-machine
4. 同馆 Berkel model680 和1960年个人秤进一步核对战后体量。https://collection.sciencemuseumgroup.org.uk/objects/co445073/model-680-personal-weighing-machine-by-berkel ; https://collection.sciencemuseumgroup.org.uk/objects/co58113/personal-weighing-machine
5. NPS 的 wayside 规划明确户外导览可立装，图文应服务实际空间。这里已有另一座完整目录牌，不再添独立高牌；把方向/服务时间贴进墙上公告框。https://www.nps.gov/subjects/hfc/wayside-exhibit-planning.htm
6. NoTrax 原厂八角孔自然橡胶垫：开孔排水、约半英寸厚及可接斜边，以可见物理厚度/孔洞和磨损细节还原。https://notrax.justrite.com/692-masterflex-heel-proof-entrance-mat
7. Bticino 防水壁灯目录的传统 oval E27 plastic grille 形态参考（检索摘录可得，open返回403）。https://www.bticino.ph/en/catalog/lighting/wall-lights-and-bulkheads
8. Royal Vendors 原厂售货机官方手册与门/付款件结构、Package Vending Specs 可学习门铰链与实际出口。照片判断像旧 Royal 650/660 的 Chameleon/Waterfall 门，但图片不足以确认具体型号，不能把猜测写成事实。https://www.royalvendors.com/customer-service/technical-info/manuals/manuals-vendors/ ; https://www.royalvendors.com/coca-cola-giii-plus-vendor-chameleon-style/

## 路线、批处理、地图、检查镜头

- `backcourt-plan.json` 保存坐标、保守实体碰撞盒与采样验证。调用现有 `createExitScene` 的主路/服务路、再叠加建议的新机/座/秤碰撞盒，共 **1270 个样本**；均没有碰撞推移。诊所正面到广场 606 samples，后服务路 577，售货机到达 70，候座到达17。最大已有路面阶差 .15m。此结果是只读设计阶段的碰撞推演，还不替代最终视觉/真实物理验证。
- 完整现有主路（local）：`[-6,-8]→[20,-9]→[20,2.1]→[49,2.1]→[49,21]→[48,35]→[58,36]→[58,52]→[57,61]→[43,61]`。
- 完整现有服务路（local）：`[-19,33]→[-19,42.1]→[23,42.1]→[24.1,47.4]→[26.8,47.4]→[26.8,26]→[48,26]→[73,26]→[80,30]→[86.5,30]`。
- 保护 `z≈26` 的贯通通道、`x≈48` 的进入广场坡道和两侧广场进出路线。新物件全留在墙前约1.2m范围；不要把凳子/秤放在图中路灯与照片亭之间阻塞。
- 静态装饰推荐在 `addClinicStreetlife` 下新 `addBackcourtMemory`，通过 `UrbanBatch` 按新生成材质合并，使用该函数的同一 clinic frame。物理掉落及能拾取模型单独放在动态 group，不能静态 merge。
- `createExitScene.resolve` 先后合并各 district / reference / fabric colliders；新主实体 collider 放入 `district.colliders`。小地图 `setUrbanReferenceShapes` 只收 `obb w>4,d>4`，这些道具不该形成建筑块，保留现有建筑边界即可。
- 图二相同检查构图的拟合镜头：local eye `[46.9,2.232,33.586]`（y相对 `EXIT_CITY_Y`）、local yaw `.91847`、pitch `-.04377`、vertical fov `59.1°`、aspect `1925/1173`。world eye `[583.5359,2.512,404.0378]`，world yaw `2.52268`。用灰墙四角、报箱底、柱底、灯杆底、照片亭底8个已知点拟合，重投影 RMS8.6px；是推导机位，非真实保存 pose。最终要实际渲染后微调。

## 生成资产预算建议

售货机水景门 artwork 独立 1024×2048；左右付款/选择区域分别 512×2048 与256×1536；绝不整机一张图片平贴。

新常用表面：旧暖灰喷漆钢（512²，normal/roughness512²）、灰蓝乙烯基（512²＋同尺寸normal/roughness）、乳白塑料（512²＋normal/roughness）、黑环孔橡胶颗粒（512²＋normal/roughness）、拉丝铝（512²＋normal/roughness）。各物体只有少量材质，纹理允许共享，静态物件目标增加约6–9draws。

独立平面印刷：体重表盘768²、秤使用标签512²、PALM COURT公告768×1024、柜门维修卡256×512、灯具服务编号256²。要保存生图来源与派生图 provenance，英文排版应肉眼审阅，不用代码绘制版式冒充生图。

所有表面 soft PS2 photographic finish，禁止像素画、过锐、现代霓虹、过度脏污。建筑原墙不用修改成另一种风格；如果给柜后的补丁区域加normal/grain，应使用正常 metre-scale repeat，而不是整块照片拉伸。
