---
name: video-to-gif
description: "使用 meitu-cli 把视频转 GIF 动图，支持普通 GIF（长边 ≤480px）和透明底 GIF（240×240px）。当用户说视频转 GIF、做表情包、做动图、透明底贴纸、浮动表情时触发。"
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

# Video To GIF

## Overview

调用 `meitu video-to-gif` 将已有视频转换为 GIF 动图，覆盖 2 类：

1. **普通 GIF**：`api_video_to_gif`，等比例 GIF，长边 ≤480px，适用于微信表情包、社交动图
2. **透明底 GIF**：`api_convert_video_to_gif`，固定 240×240px 透明底，适用于透明贴纸、浮动表情

尺寸不可自定义。不处理：图片转 GIF、GIF 转视频、GIF 编辑、视频拼接、视频配音、视频风格变换。

## API Mapping

| 场景 | 后端 API |
|---|---|
| 普通 GIF | `api_video_to_gif` |
| 透明底 GIF | `api_convert_video_to_gif` |

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
3. output_dir 解析：openclaw.yaml → `./output/` | else → `$VISUAL/output/video-to-gif/`；`mkdir -p {output_dir}`

### Execute

**触发信号/路由**

命中信号词：
- `api_video_to_gif`（普通）：转 GIF、做表情包、动图、GIF 转换（无透明需求）
- `api_convert_video_to_gif`（透明底）：透明底 GIF、透明贴纸、浮动表情、透明背景 GIF

决策顺序：
1. Agent 画面识别视频内容生成 `prompt`（如"人物在纯色背景前做表情""猫咪在户外奔跑"）
2. 按透明底需求分支：
   - 需要透明背景（用户明确要求 + 纯色/绿幕/简单背景）→ `api_convert_video_to_gif`
   - 否 / 通用 → `api_video_to_gif`（默认）

无法判断 → `prompt` 写"通用视频"走默认 `api_video_to_gif`。

**参数定义**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `video_url` | STRING | 是 | 视频地址；缺失 → "请提供视频链接" |
| `prompt` | STRING | 是 | Agent 对视频内容的描述，用于判断 GIF 类型 |

**API 参数映射**

两路 API 均直传 `video_url`：
- `api_video_to_gif` → 输出等比例 GIF，长边 ≤480px
- `api_convert_video_to_gif` → 输出 240×240px 透明底 GIF

**工具调用**

普通 GIF：
```bash
meitu video-to-gif \
  --skill_name skill_video-to-gif \
  --video_url {video_url} \
  --prompt "{content_description}" \
  --json --download-dir {output_dir}
```

透明底 GIF：
```bash
meitu video-to-gif \
  --skill_name skill_video-to-gif \
  --video_url {video_url} \
  --prompt "{content_description}" \
  --transparent true \
  --json --download-dir {output_dir}
```

**错误降级**

| 场景 | 处理 |
|---|---|
| `video_url` 缺失 | 提示"请提供视频链接" |
| `video_url` 不可访问 | 直接返回无效错误，不重试 |
| 用户要透明底但视频无透明通道 | 尝试调用透明 API，效果不佳则提示限制 |
| 用户要 >480px 的 GIF | 告知 `api_video_to_gif` 最大 480px |
| 用户要自定义尺寸透明底 | 告知 `api_convert_video_to_gif` 固定 240×240px |
| 视频时长过长 | 提示裁剪或降低质量重试 |
| `api_convert_video_to_gif` 超时 | 降级为 `api_video_to_gif`（放弃透明底）重试，告知透明底暂不可用 |
| `api_video_to_gif` 调用失败 | 重试 1 次，仍失败返回错误 |
| 内容合规拦截 | 直接返回合规提示，不重试 |
| 图片转 GIF / GIF 转视频 / GIF 编辑 | 拒绝，告知能力范围外 |

### Deliver

解析 `--json` → `downloaded_files[0].saved_path` 或 `media_urls[0]`。

`mv {file} {output_dir}/{YYYY-MM-DD}_{name}_{gif_type}.gif`（`gif_type` = `normal` | `transparent`）

## Output

- **格式**：GIF
  - 普通：等比例，长边 ≤480px
  - 透明底：240×240px 透明背景
- **命名**：`{YYYY-MM-DD}_{descriptive-name}_{normal|transparent}.gif`
- **位置**：项目 → `./output/`；一次性 → `$VISUAL/output/video-to-gif/`

## 基线 Task ID

```
t_mt1a3i5n7b1680836b-8e05-47d2-b6f0-3bd10eb0c5d3
```
