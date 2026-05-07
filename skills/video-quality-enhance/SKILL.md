---
name: video-quality-enhance
description: "使用 meitu-cli 做视频综合画质修复（去模糊/降噪/补帧/暗部提亮），自适配人像/演唱会/动漫/夜景/商品。当用户说画质修复、视频修复、变清晰、老视频翻新、一键增强视频且不涉及分辨率诉求时触发。"
version: "1.0.0"
metadata: {"openclaw":{"requires":{"bins":["meitu"],"env":["MEITU_OPENAPI_ACCESS_KEY","MEITU_OPENAPI_SECRET_KEY","MEITU_OPENAPI_TOOL_TASK_MODE"],"paths":{"read":["~/.meitu/credentials.json","~/.meitu/tool-registry.json","~/.openclaw/workspace/visual/"],"write":["~/.openclaw/workspace/visual/"]}},"primaryEnv":"MEITU_OPENAPI_ACCESS_KEY"}}
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
    - type: file_write
      paths:
        - ~/.openclaw/workspace/visual/
    - type: exec
      commands:
        - meitu
---

# Video Quality Enhance

## Overview

调用 `meitu video-quality-enhance` 做视频综合画质修复：去模糊 + 降噪 + 补帧 + 暗部提亮，自适配人像/演唱会/动漫/夜景/商品全场景。单项画质诉求（降噪/补帧/暗部增强）也由本工具默认承接。

**不接收 `target_resolution`，不处理分辨率/超分/放大相关诉求，不处理图片。**

## API Mapping

| DAG 工具 | 后端 API |
|---|---|
| video-quality-enhance | `video_hd_enhance` |

## Dependencies

- **meitu-cli**: `>=2.0.6`
- **凭证**：CONFIG AKSK → `meitu tools update`；EXEC AKSK → 跑命令
- **环境变量**：`MEITU_OPENAPI_TOOL_TASK_MODE=command`

> 路径别名：`$VISUAL` = `{OPENCLAW_HOME}/workspace/visual/`

## Core Workflow

```
Preflight → Execute → Deliver
```

### Preflight

1. `meitu --version` ≥ 2.0.6；`meitu auth verify --json`
2. 确认已跑过 Config Phase；`MEITU_OPENAPI_TOOL_TASK_MODE=command`
3. output_dir 解析：openclaw.yaml → `./output/` | else → `$VISUAL/output/video-quality-enhance/`；`mkdir -p {output_dir}`

### Execute

**触发信号/路由**

命中信号词："画质修复、视频修复、一键修复、整体修复、综合修复、变清晰、老视频翻新、画质提升、一键增强"。

决策顺序（能力范围判断最高优先级）：
1. 输入是否含分辨率/超分诉求（720P/1080P/2K/4K / 放大 / 超分 / 分辨率）？
   - 是 → **本工具不处理，返回能力范围外**（引导 `video-resolution-upscale`）
   - 否 → 进入下一步
2. Agent 画面识别视频内容类型生成 `prompt`
3. `video_url` / `prompt` 缺失 → 追问
4. 唯一路由 → `video_hd_enhance`

**prompt → 内部场景适配**

| prompt 信号词 | 内部适配 |
|---|---|
| 人像/自拍/人物/面部 | 人像修复 |
| 演唱会/现场/舞台/音乐会 | 演唱会修复 |
| 动漫/动画/二次元/卡通 | 动漫修复 |
| 夜景/暗光/夜拍/低光 | 夜景修复 |
| 商品/产品/展示/电商 | 商品修复 |
| 其他/通用 | 通用修复（默认） |

无法判断 → `prompt` 写"通用视频"走默认修复模式。

**参数定义**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `video_url` | STRING | 是 | 视频地址；缺失 → "请提供视频链接" |
| `prompt` | STRING | 是 | Agent 对视频内容的描述，用于内部多场景适配 |

**不接收 `target_resolution` 参数**——本工具不处理分辨率。

**工具调用**

```bash
meitu video-quality-enhance \
  --video_url {video_url} \
  --prompt "{prompt}" \
  --json --download-dir {output_dir}
```

**错误降级**

| 场景 | 处理 |
|---|---|
| `video_url` 缺失 | 提示"请提供视频链接" |
| `video_url` 不可访问 | 不重试，提示"请提供有效视频链接" |
| `prompt` 为空或无信号词 | Agent 识别后生成；仍无法判断写"通用视频" |
| 调用失败 | 重试 1 次，仍失败返回错误 |
| 超时 | 重试 1 次，仍超时返回错误 |
| 内容合规拦截 | 直接返回合规提示，不重试 |
| 用户中途追加分辨率/超分诉求 | 返回"本工具不处理分辨率相关诉求" |
| 输入为图片 | 拒绝，本工具仅支持视频 |
| "修复成 4K"等同时含修复+分辨率 | 本工具不处理（含分辨率诉求，能力范围外） |

### Deliver

解析 `--json` → `downloaded_files[0].saved_path` 或 `media_urls[0]`。

`mv {file} {output_dir}/{YYYY-MM-DD}_{name}_quality-enhance.mp4`

## Output

- **格式**：MP4
- **命名**：`{YYYY-MM-DD}_{descriptive-name}_quality-enhance.mp4`
- **位置**：项目 → `./output/`；一次性 → `$VISUAL/output/video-quality-enhance/`

## 基线 Task ID

```
t_mt1a3i5n7b4715ca50-43d6-4ace-beec-b2557b9700ed
```
