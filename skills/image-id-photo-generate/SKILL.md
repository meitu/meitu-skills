---
name: image-id-photo-generate
description: "基于用户正面人像和明确证件规格生成标准证件照，自动换装、换背景和合规调整。仅在用户明确要求证件照、一寸/二寸、护照/签证/身份证/驾照等规格化证件照，并已提供人像照片时触发；泛化的商务照、形象照或写真需求不单独触发。"
version: "1.0.0"
metadata: {"openclaw":{"requires":{"bins":["meitu"],"env":["MEITU_OPENAPI_ACCESS_KEY","MEITU_OPENAPI_SECRET_KEY","MEITU_OPENAPI_TOOL_TASK_MODE"],"paths":{"read":["~/.meitu/credentials.json","~/.meitu/tool-registry.json","~/.openclaw/workspace/visual/","./openclaw.yaml"],"write":["~/.openclaw/workspace/visual/","./output/"]}},"primaryEnv":"MEITU_OPENAPI_ACCESS_KEY"}}
security:
  credential_use: "Uses Meitu OpenAPI credentials from env or ~/.meitu/credentials.json for CLI calls; credentials must not be echoed, logged, or embedded in prompts."
  remote_processing: "User-provided portrait photos, spec parameters, and generated prompts are sent to Meitu OpenAPI for processing."
  biometric_notice: "Portrait photos and face-description anchors are sensitive biometric-like personal data. Confirm the depicted person has agreed to this processing before running the workflow."
  persistence: "Generated ID photos are written to the resolved local output directory."
requirements:
  credentials:
    - name: MEITU_OPENAPI_ACCESS_KEY
      source: env | ~/.meitu/credentials.json
    - name: MEITU_OPENAPI_SECRET_KEY
      source: env | ~/.meitu/credentials.json
  env:
    MEITU_OPENAPI_TOOL_TASK_MODE: command
  permissions:
    - type: file_read
      paths:
        - ~/.meitu/credentials.json
        - ~/.meitu/tool-registry.json
        - ~/.openclaw/workspace/visual/
        - ./openclaw.yaml
    - type: file_write
      paths:
        - ~/.openclaw/workspace/visual/
        - ./output/
    - type: exec
      commands:
        - meitu
---

# 证件照生成（image-id-photo-generate）

## Overview

基于用户照片 + 证件规格一键生成标准证件照。自动换装（默认黑西装+白衬衫）+ 换背景 + 合规调整（露耳/露额/底色/着装/尺寸）+ face_desc 面部特征锚定，避免通用编辑链路对五官做过度美化。覆盖一寸/二寸/护照/签证/身份证/驾照/入学/毕业/职业/商务/结婚证/工牌等多规格。

执行前应让用户清楚知道：本 Skill 会读取 Meitu 凭证、调用本地 `meitu` CLI、将用户提供的人像图片与规格参数发送到 Meitu OpenAPI 处理，并把结果写入 `./output/` 或 `$VISUAL/output/image-id-photo-generate/`。证件照涉及敏感的人脸与身份相关图像数据，应确认对照片中人物具备合法授权。

## API Mapping

- 证件照生成：`image_id_photo_generate`（实际执行 image-edit 的证件照专用路径，通过 prompt 模板 + 规格映射驱动）

## Dependencies

- **meitu-cli**: `>=2.0.6`（`npm install -g meitu-cli@latest`）
- **凭证**：CONFIG AKSK → `meitu tools update`；EXEC AKSK → 实际执行（见根 `CONFIG.md`）
- **环境变量**：`MEITU_OPENAPI_TOOL_TASK_MODE=command`

> 路径别名：`$VISUAL` = `{OPENCLAW_HOME}/workspace/visual/`

## Core Workflow

```
Preflight → Execute → Deliver
```

### Preflight

1. `meitu --version` ≥ 2.0.6（否则 `npm install -g meitu-cli@latest`）
2. 确认已跑过 `meitu tools update`（用 CONFIG AKSK）
3. 当前 AKSK = EXEC，且 `MEITU_OPENAPI_TOOL_TASK_MODE=command`
4. 解析 output_dir：openclaw.yaml → `./output/` ｜else → `$VISUAL/output/image-id-photo-generate/`；`mkdir -p`

### Execute

**触发信号 / 路由规则**

核心判断维度：**证件用途判定 + spec_type 齐全 + 参数齐全**。

决策顺序：
1. `image_url` 缺失 → 追问；`spec_type` 缺失 → 展示规格选择模板
2. 着装冲突检查：身份证规格 + 白衣无外套 → 强制改为黑西装
3. 观察原图填写 face_desc 13 项（禁止凭印象或默认值）
4. 构造 prompt（face_desc + attire_desc + bg_desc + 合规指令 + 负面约束）→ 调用 `image_id_photo_generate`

**优先级规则**：明确证件照用途 > 通用写真；需完整证件照（换装+换背景+合规） > 单纯换背景。失败精简 prompt 重试，最多 3 轮。

**参数定义**

| 参数 | 类型 | 必填 | 范围 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| `image_url` | STRING | 是 | -- | -- | 用户正面人像照片。缺失 → 提示补图 |
| `spec_type` | STRING | 是 | 一寸/二寸/护照/身份证/签证/驾照/入园/结婚证/职业/商务 | -- | 证件规格。缺失 → 展示询问模板 |
| `bg_color` | STRING | 否 | 白/蓝/红/灰白渐变/灰渐变 | 按规格自动适配 | 背景色 |
| `attire` | STRING | 否 | 见服装预设表 | 黑西装+白衬衫 | 着装，≤15 字描述 |

**spec_type → 内部参数映射**：

| spec_type | ratio | 背景 | 合规级别 | 合规指令 |
|-----------|-------|------|----------|---------|
| 一寸/考研/考编/教资/简历 | 3:4 | 白/蓝 | 严格 | 双耳露出额头露出双眉可见 |
| 二寸/毕业证 | 3:4 | 蓝 | 中等 | 双耳露出额头露出 |
| 护照/签证 | 3:4 | 白 | 严格 | 双耳露出额头露出双眉可见 |
| 身份证 | 4:5 | 白 | 严格 | 双耳露出额头露出双眉可见 |
| 驾照 | 3:4 | 白 | 严格 | 双耳露出额头露出双眉可见 |
| 入园照/入学照 | 3:4 | 白/蓝 | 中等 | 双耳露出额头露出 |
| 结婚证 | 3:4 | 红 | 宽松 | 不加 |
| 职业证件照/智感证件照 | 3:4 | 灰白渐变 | 宽松 | 不加 |
| 商务/形象照 | 3:4 | 灰渐变 | 无 | 不加 |

**face_desc 13 项**（顺序填空，禁用"适中/中等/微卷"等模糊词）：①脸型 ②脸宽 ③颧骨（突出时写） ④下巴 ⑤鼻子 ⑥眼睛（大小+形状+单双+间距）⑦嘴唇 ⑧肤色 ⑨眼镜（戴则写"戴眼镜"三字）⑩发色 ⑪发质 ⑫发长 ⑬分法。

正确示例：`宽圆脸偏宽，下巴短而圆润，鼻子偏宽鼻头圆，眼睛偏大圆眼内双，嘴唇偏薄，肤色偏黄有黑眼圈，戴眼镜，深棕色直发中长发侧分`

禁用词：适中（鼻子）、中等（眼睛）、微卷（不确定时）、痣/胎记/疤痕、"证件照"（改用"证件构图"）、"不要放大眼睛"（避免被编辑模型反向理解）。

**Prompt 模板（标准版，不戴眼镜）**：

```
严格保持人物面部骨骼结构五官比例与原照片完全一致，面部辨识度为最高优先级，{face_desc}，保持原有发型和表情不变，保持原有瞳色不变，保留皮肤纹理细节。
仅更换服装和背景：{attire_desc}，{bg_desc}。{compliance_desc}模拟85mm镜头柔和自然光皮肤质感通透贴近真实肤色，人物居中正面直视镜头免冠标准{spec_name}证件构图高清锐利。
不要瘦脸不要缩小鼻子不要改变眼睛大小形状不要尖化下巴不要改变五官比例不要改变五官位置不要磨皮美白不要改变脸型不要改变嘴唇厚度不要改变发型不要改变发色不要添加眼镜不要添加任何装饰物不要添加发饰不要生成手持物品不要消除皮肤纹理不要模糊不要滤镜
```

戴眼镜：第 1 行"保持原有发型、眼镜和表情不变"；第 3 行"不要改变眼镜"。另有职业证件照版、婴幼儿保守版。

**bg_desc 速查**：白→`纯白色背景（#FFFFFF）均匀铺满` / 蓝→`纯蓝色背景（#438EDB）均匀铺满` / 红→`纯红色背景（#FF0000）均匀铺满` / 灰白渐变→`淡灰到白色从上到下柔和渐变摄影背景` / 灰渐变→`灰色从上到下渐变背景顶部深灰底部浅灰`。

**compliance_desc**：严格→`双耳露出额头露出双眉可见，` / 中等→`双耳露出额头露出，` / 宽松或无→删掉不留空。

**工具调用**

```bash
meitu image-id-photo-generate \
  --skill_name skill_image-id-photo-generate \
  --image_url <image_url> \
  --spec_type <一寸|二寸|护照|身份证|...> \
  --bg_color <白|蓝|红|灰白渐变|灰渐变> \
  --attire "<黑西装+白衬衫>" \
  --json \
  --download-dir {output_dir}
```

**错误降级**

| 场景 | 处理方式 |
|------|------|
| `spec_type` 缺失 | 展示规格选择模板让用户选 |
| `image_url` 缺失 | 提示"请提供一张正面人像照片" |
| `attire` 缺失 | 默认"黑西装+白衬衫"直接开跑，不额外询问 |
| 着装冲突（身份证 + 白衣无外套） | 强制改为黑西装（白衣与白底冲突） |
| face_desc 写不准 → 美化面部 | 必须仔细观察原图填写锚定五官 |
| `image_id_photo_generate` 调用失败 | 精简 prompt 重试 → 最多 3 轮 → 仍失败建议换照片 |
| 内容合规拦截 | 返回合规提示 |
| 用户反馈不像本人 | 按"反馈修正规则"最小改动重做 |
| 用户要超分 / 精确像素 | 后续走超分/画布适配能力（非默认） |

**反馈修正铁律**：最小改动（只改用户指出的问题） / 禁止盲目猜测 / 第一版基准（后续不如第一版立即回退） / 确认再改 / 重新观察原图 / 正面驱动（改 face_desc 不只改负面约束）。

**精确像素速查**：一寸 295×413 / 二寸 413×579 / 身份证 358×441 / 护照 390×567 / 小一寸 260×378。

### Deliver

- 直接使用 Preflight 解析的 output_dir
- 从 `downloaded_files[0].saved_path` 读取已下载文件路径
- `mv {downloaded_files[0].saved_path} {output_dir}/{YYYY-MM-DD}_{spec_type}_image-id-photo-generate.jpg`

## Output

- **格式**：JPEG（默认）
- **命名**：`{YYYY-MM-DD}_{spec_type}_image-id-photo-generate.jpg`
- **位置**：项目 → `./output/`，一次性 → `$VISUAL/output/image-id-photo-generate/`

## 基线 Task ID

见 `references/task-id-baseline.md` 中对应行。

