# 消歧矩阵（自动生成，勿手动编辑）
# 从 tools.yaml 的 prefer_over / not_for 字段提取
# 工具总数：13

## 工具优先级关系

| 当前工具 | 优先于 | 选择条件 |
|---|---|---|
| 视频动作迁移(video-motion-transfer) | 图生视频(image-to-video) | 核心需求是复刻特定动作，而非从图片生成视频或对口型 |
| 图生视频(image-to-video) | 文生视频(text-to-video) | 用户提供了首帧图片，或核心需求是对口型/语音表演 |
| 图生视频(image-to-video) | 视频动作迁移(video-motion-transfer) | 不需要复刻特定参考动作，而是从图片自由生成视频 |
| 文生视频(text-to-video) | 图生视频(image-to-video) | 用户未提供首帧图片，且不需要对口型/语音同步 |
| 图片生成(image-generate) | 图片编辑(image-edit) | 核心意图是生成新图，而非修改现有图片 |
| 图片生成(image-generate) | 海报生成(image-poster-generate) | 目标不是海报/宣传物料 |
| 海报生成(image-poster-generate) | 图片生成(image-generate) | 输出物明确是海报/宣传物料，需文字排版和版式 |
| 海报生成(image-poster-generate) | 图片编辑(image-edit) | 目标是完整海报设计或系列延展，非单纯局部修改 |
| 图片编辑(image-edit) | 图片生成(image-generate) | 用户有明确底图要编辑，非从零生图 |
| 图片编辑(image-edit) | 海报生成(image-poster-generate) | 编辑目标不是海报，或仅需局部微调 |
| 图片美容(image-beauty-enhance) | 图片编辑(image-edit) | 需求仅限美颜美肤，不涉及内容修改 |
| 图片美容(image-beauty-enhance) | 图片超清(image-upscale) | 目标是面部美化而非纯画质提升 |
| AI换头(image-face-swap) | 图片编辑(image-edit) | 需求明确是人脸替换，非通用编辑 |
| AI换头(image-face-swap) | AI换装(image-try-on) | 目标是换脸而非换装 |
| AI换装(image-try-on) | AI换头(image-face-swap) | 目标是换装而非换脸 |
| AI换装(image-try-on) | 图片编辑(image-edit) | 需求明确是虚拟试衣，非通用编辑 |
| 宫格拆分(image-grid-split) | 图片编辑(image-edit) | 按宫格等分拆图，非任意裁切 |
| 宫格拆分(image-grid-split) | 抠图(image-cutout) | 网格切割整张图，非分离前景主体 |

## 不适用场景转向表

| 工具 | 不适用场景 | 转向 |
|---|---|---|
| 视频动作迁移(video-motion-transfer) | 人物说话/对口型 | image-to-video |
| 视频动作迁移(video-motion-transfer) | 纯文字生成视频 | text-to-video |
| 图生视频(image-to-video) | 无首帧图片 | text-to-video |
| 图生视频(image-to-video) | 仅需复刻特定参考动作 | video-motion-transfer |
| 图生视频(image-to-video) | 仅需轻微动效且无音画同步需求 | — |
| 文生视频(text-to-video) | 用户已提供首帧图片 | image-to-video |
| 文生视频(text-to-video) | 需对白口播准确 | image-to-video |
| 文生视频(text-to-video) | 需所有元素逐条落地或完整广告成片 | — |
| 视频转GIF(video-to-gif) | 图片序列合成GIF | — |
| 视频转GIF(video-to-gif) | 视频格式转换（非GIF目标） | — |
| 图片生成(image-generate) | 对已有图片局部修改 | image-edit |
| 图片生成(image-generate) | 海报设计（含排版） | image-poster-generate |
| 图片生成(image-generate) | 换脸 | image-face-swap |
| 海报生成(image-poster-generate) | 通用图片生成（非海报） | image-generate |
| 海报生成(image-poster-generate) | 非海报图片编辑 | image-edit |
| 图片编辑(image-edit) | 无底图纯文字生图 | image-generate |
| 图片编辑(image-edit) | 完整海报设计 | image-poster-generate |
| 图片编辑(image-edit) | 仅超清 | image-upscale |
| 图片编辑(image-edit) | 仅美容 | image-beauty-enhance |
| 图片超清(image-upscale) | 修改图片内容 | image-edit |
| 图片超清(image-upscale) | 美颜修饰 | image-beauty-enhance |
| 图片美容(image-beauty-enhance) | 多人合照美颜（不支持） | — |
| 图片美容(image-beauty-enhance) | 修改图片内容 | image-edit |
| 图片美容(image-beauty-enhance) | 纯画质提升 | image-upscale |
| 图片美容(image-beauty-enhance) | 换脸 | image-face-swap |
| AI换头(image-face-swap) | 替换背景 | image-edit |
| AI换头(image-face-swap) | 仅换发型不换脸 | image-edit |
| AI换头(image-face-swap) | 虚拟试衣 | image-try-on |
| AI换装(image-try-on) | 换脸 | image-face-swap |
| AI换装(image-try-on) | 仅抠出服装 | image-cutout |
| 抠图(image-cutout) | 抠图后换背景 | 先 image-cutout 再 image-edit |
| 抠图(image-cutout) | 宫格拆分 | image-grid-split |
| 宫格拆分(image-grid-split) | 任意比例裁切 | image-edit |
| 宫格拆分(image-grid-split) | 提取前景主体 | image-cutout |

## 常见调用链

- 抠图后换背景 → 先 image-cutout 再 image-edit
