---
name: meitu-video-dance
description: "将参考视频中的动作（舞蹈、手势、运动）迁移到目标人物或角色图片上，生成动作视频。当用户提到动作迁移、舞蹈视频、让照片跳舞、让人物动起来、dance transfer、motion transfer、视频动作复刻时触发。"
version: "1.1.0"
metadata: {"openclaw":{"requires":{"bins":["meitu"],"env":["MEITU_OPENAPI_ACCESS_KEY","MEITU_OPENAPI_SECRET_KEY"],"paths":{"read":["~/.meitu/credentials.json","~/.openclaw/workspace/visual/"],"write":["~/.openclaw/workspace/visual/"]}},"primaryEnv":"MEITU_OPENAPI_ACCESS_KEY"}}
requirements:
  credentials:
    - name: MEITU_OPENAPI_ACCESS_KEY
      source: env | ~/.meitu/credentials.json
    - name: MEITU_OPENAPI_SECRET_KEY
      source: env | ~/.meitu/credentials.json
  permissions:
    - type: file_read
      paths:
        - ~/.meitu/credentials.json
        - ~/.openclaw/workspace/visual/
    - type: file_write
      paths:
        - ~/.openclaw/workspace/visual/
    - type: exec
      commands:
        - meitu
---

## Overview

从一段参考视频中提取动作轨迹，迁移到用户提供的目标人物/角色图片上，生成该角色执行相同动作的视频。核心工具为 `meitu video-motion-transfer`（异步任务）。

## Dependencies

- **meitu-cli**: `npm install -g meitu-cli`
  - 凭证配置: `meitu config set-ak --value "..."` + `meitu config set-sk --value "..."`
  - 验证: `meitu auth verify --json`

> **路径别名：** 下文中 `$VISUAL` = `{OPENCLAW_HOME}/workspace/visual/`

---

## Core Workflow

```
Preflight → [Context] → Execute → Refine → Deliver → [Record]
```

### Preflight

1. `meitu --version` → 未安装则提示 `npm install -g meitu-cli`
2. `meitu auth verify --json` → 凭证无效则引导配置
3. Detect mode: cwd has `openclaw.yaml` → project mode; else → one-off
   检查 `$VISUAL` 目录 → 确定 capabilities
   can_record = cwd 有 openclaw.yaml AND `$VISUAL` 存在（两者缺一即 false）
4. output_dir 解析（Preflight 内 MUST 完成）：
   Resolve output_dir: openclaw.yaml → `./output/` | else → `$VISUAL/output/meitu-video-dance/`
   `mkdir -p {output_dir}`

### Context（项目模式时执行，一次性模式跳过）

mode = one-off → 跳过此步，直接到 Execute。

逐步读取：
  1. 读 DESIGN.md → 提取 Context References（quality, preferences, brand_refs）
  2. 尝试读全局资产：quality.yaml → global.md → scenes/{type}.md（scene 文件来源：从 openclaw.yaml 的 `project.types`（数组优先）或 `project.type` 读取类型）
  3. 读不到用内联兜底值（均 skip if missing）
→ quality forbidden list 过滤 prompt 元素，preferences 增强创意方向

### Execute

**这是 skill 的核心。** 动作迁移的质量 80% 取决于输入素材，15% 取决于 prompt，5% 取决于参数。

**1. 收集与验证输入**

用户必须提供两项输入：

| 输入 | 说明 | 接受格式 |
|------|------|----------|
| **目标人物图片** (image_url) | 要"动起来"的角色 | URL 或本地路径 (.jpg/.jpeg/.png) |
| **参考动作视频** (video_url) | 动作来源 | URL 或本地路径 (.mp4/.mov) |

**输入质量预检** — 在调用 API 前主动评估，避免浪费额度：

对目标图片检查：
- 全身可见（至少到膝盖，舞蹈类必须含脚部）→ 不满足则提醒用户换图
- 人物轮廓清晰，不与背景融合 → 背景杂乱建议先用 `meitu image-cutout` 抠图换干净背景
- 手部可见且未遮挡面部 → 手遮脸会导致严重伪影
- 正面或微侧角度（非纯侧面/背面）→ 极端角度生成质量差
- 分辨率短边 ≥ 300px → 太小则建议先用 `meitu image-upscale` 放大
- 紧身衣物优于宽松衣物 → 宽松衣物（长裙、大衣）模糊关节导致畸变

对参考视频检查：
- 时长 3-10 秒为最佳 → 过长则建议截取核心片段
- 单人画面 → 多人画面会导致动作混淆
- 镜头稳定（固定机位）→ 手持晃动/快速变焦会引入噪声
- 全身在画面内 → 人物出画会导致动作丢失
- 动作速度适中 → 极快动作（如breaking）容易产生肢体重影
- 背景简洁 → 复杂背景干扰姿态估计

> **详细评估标准:** 当需要更细致的输入评估时，读取 [references/input-quality-guide.md](references/input-quality-guide.md)

如果输入质量问题严重（如半身图 + 全身舞蹈视频），**直接告知用户问题并建议更换素材**，不要勉强调用 API。

**2. 构建 Prompt**

**关键原则：prompt 描述角色外观和场景，不描述动作。** 动作来自参考视频，prompt 中写动作描述会与视频信号冲突。

**Prompt 构建策略：**

```
{角色外观描述}, {场景/背景描述}, {画面质量修饰}
```

**角色外观** — 从目标图片中提取或由用户补充：
- 性别、年龄范围、体型
- 服装描述（颜色、款式、材质）
- 发型、发色
- 显著特征（饰品、纹身等）

**场景/背景** — 默认与目标图片一致，用户可指定：
- "white studio background"（干净万能背景）
- "city street at sunset"（场景化）
- 保持简洁，不超过一句

**画面质量** — 固定后缀：
- `high quality, detailed, natural proportions, realistic hands`

**Prompt 示例：**

| 场景 | Prompt |
|------|--------|
| 女生跳舞 | `a young woman in a white crop top and jeans, long black hair, white studio background, high quality, detailed, natural proportions` |
| 动漫角色 | `anime character with blue hair and school uniform, rooftop scene, vibrant colors, high quality, consistent style` |
| 商务人物 | `a man in a dark blue suit, short hair, modern office background, high quality, professional lighting` |

**禁忌：**
- 不描述具体动作（"hip-hop dance"、"waving hands"）→ 动作由视频决定
- 不用平台特定语法（`--no`、`(keyword:1.5)`、`<lora:xxx>`）
- 不用否定描述 → 正面表达（"clean background" 而非 "no clutter"）

**3. 调用 meitu-cli**

```bash
meitu video-motion-transfer \
  --image_url "{image_url}" \
  --video_url "{video_url}" \
  --prompt "{composed_prompt}" \
  --download-dir "{output_dir}"
```

**异步任务说明：**
- 该命令为异步任务，CLI 会自动轮询直到完成（内部调用 `meitu task wait`）
- 生成时间通常 30s-120s，取决于视频时长和服务器负载
- 返回 JSON：`ok: true` → 结果在 `downloaded_files[0].saved_path`（因使用了 `--download-dir`）；`ok: false` → 检查 `error_type`

**4. 质量判断与错误降级**

**成功时检查生成质量：**
- 角色身份一致性 — 面部、服装、发型是否与原图匹配
- 动作完整性 — 是否完整复现了参考视频的动作
- 肢体自然度 — 有无多余肢体、关节扭曲、手指异常
- 时间连贯性 — 帧间是否流畅，有无闪烁/跳变

**失败时错误降级策略：**

| 级别 | 操作 | 说明 |
|------|------|------|
| L1 | 精简 prompt | 移除装饰性修饰词，保留核心外观 + quality 后缀 |
| L2 | 检查输入匹配度 | 确认图片体型与视频人物体型是否匹配，不匹配则建议换图 |
| L3 | 缩短参考视频 | 截取动作最清晰的 3-5 秒片段重试 |
| L4 | 简化目标图片 | 用 `meitu image-cutout` 去除复杂背景后重试 |
| L5 | 停止并报错 | 连续 2 次失败 → 报告 code 和 hint，不再重试 |

**常见错误码处理：**
- `ORDER_REQUIRED` → 余额不足，告知用户充值，提供 action_url
- `CREDENTIALS_MISSING` → AK/SK 未配置，引导 `meitu config set-ak/set-sk`
- 超时 → 视频过长或服务器繁忙，建议缩短视频或稍后重试

### Refine

**呈现结果：** 向用户展示生成的视频，说明：
- "动作来源于您提供的参考视频"
- 指出可能的质量问题（如手部细节、面部一致性）
- 如有明显瑕疵，主动提出修复建议

**反馈分类与对应调整：**

| 反馈类型 | 调整方式 |
|----------|----------|
| "动作不对/不像" | 检查参考视频质量，建议换更清晰的视频片段 |
| "人物不像原图" | 增强 prompt 中的外观描述，添加更多细节 |
| "背景不对" | 调整 prompt 中的场景描述 |
| "画面质量差" | 检查输入图片分辨率，必要时先 upscale |
| "手/脸有问题" | 这是当前技术的常见局限，建议用后期工具修复；或尝试不同角度的参考图 |
| "想换个动作" | 需要用户提供新的参考视频 |

**迭代节奏：** 建议最多 3 轮。超过后主动建议：
- 更换输入素材（换图或换视频）
- 将需求拆分（如先生成满意的角色图，再做动作迁移）
- 降低期望并说明当前技术局限

### Deliver

直接使用 Preflight 解析的 output_dir。

`mv {file} {output_dir}/{date}_{name}.mp4`

**命名规范：** `{date}_{描述性名称}.mp4`，如 `2026-03-23_girl-hip-hop-dance.mp4`

### Record（项目模式 MUST / 一次性模式跳过）

can_record = false → 跳过。一次性模式下反馈仅当前对话有效。
> can_record 定义：`can_record = cwd 有 openclaw.yaml AND $VISUAL 存在`（两者缺一即 false）

User approved style →
  read `$VISUAL/memory/observations/observations.yaml` → scan similar key → merge or append → write back.
  `len(projects) >= 2` → propose promotion (non-blocking).
  提议晋升（非阻塞：在回复末尾提及，不打断主流程） → confirmed → write target + delete observation entry

User rejected ("不要 XX") →
  has openclaw.yaml → ask scope → project: DESIGN.md Constraints / universal: quality.yaml
  no openclaw.yaml → current task only

No feedback → skip entirely.

---

## Output

| 属性 | 值 |
|------|-----|
| 格式 | MP4 视频 |
| 命名 | `{date}_{effect-name}.mp4` |
| 时长 | 与参考视频一致（通常 3-10 秒） |
| 路径 | 由 Deliver 步骤确定 |
