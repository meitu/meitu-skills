---
name: video-stitch
description: "使用 meitu-cli 做多段视频顺序拼接，支持纯拼接保留原声或拼接+配乐（自动检索/自定义音乐 URL）。当用户说拼接视频、合并视频、视频合集、拼接加音乐时触发。"
version: "1.0.0"
metadata: {"openclaw":{"requires":{"bins":["meitu"],"env":["MEITU_OPENAPI_ACCESS_KEY","MEITU_OPENAPI_SECRET_KEY","MEITU_OPENAPI_TOOL_TASK_MODE"],"paths":{"read":["~/.meitu/credentials.json","~/.meitu/tool-registry.json","~/.openclaw/workspace/visual/","./openclaw.yaml"],"write":["~/.openclaw/workspace/visual/","./output/"]}},"primaryEnv":"MEITU_OPENAPI_ACCESS_KEY"}}
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

# Video Stitch

## Overview

调用 `meitu video-stitch` 对多段视频（≥2 段）做顺序拼接合并，覆盖 2 类：

1. **纯拼接（保留原声）**：`video_stitching`，`video_volume` 控制原声音量
2. **拼接 + 配乐**：`video_splicing_music`，按 `prompt` 自动检索音乐；提供 `music_url` 时跳过检索直接使用自定义音乐

不支持自定义转场。不处理：单视频裁剪/调速、旁白配音、GIF 转换、视频风格变换。

## API Mapping

| 场景 | 后端 API |
|---|---|
| 纯拼接保留原声 | `video_stitching` |
| 拼接 + 配乐（自动检索 / 自定义 music_url） | `video_splicing_music` |

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
3. output_dir 解析：openclaw.yaml → `./output/` | else → `$VISUAL/output/video-stitch/`；`mkdir -p {output_dir}`

### Execute

**触发信号/路由**

命中信号词：
- `video_stitching`（纯拼接）：拼接、合并、拼在一起、不需要音乐、保留原声
- `video_splicing_music`（拼接+配乐）：拼接并配乐、合并加音乐、拼接+自定义音乐 URL

决策顺序：
1. `video_list` 数量 <2 → 提示"拼接需要至少 2 段视频"
2. Agent 识别视频素材生成 `prompt` 辅助路由
3. 按配乐需求分支：
   - 不需要音乐 / 有原声 → `video_stitching`（默认）
   - 需要配乐（无 `music_url`）→ `video_splicing_music` + `prompt` 自动检索
   - 需要配乐（有 `music_url`）→ `video_splicing_music` + `music_url` 跳过检索

意图模糊（"拼接处理一下"）→ 默认走 `video_stitching`。

**参数定义**

通用：

| 参数 | 类型 | 必填 | 范围 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `video_list` | ARRAY[STRING] | 是 | ≥2 个 | -- | 视频地址列表 |
| `prompt` | STRING | 是 | -- | "music" | 音乐检索关键词 / 素材描述 |
| `video_volume` | NUMBER | 否 | 0–2.0 | 1 | 视频原声音量 |

`video_splicing_music` 额外：

| 参数 | 类型 | 必填 | 范围 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `music_url` | STRING | 否 | -- | -- | 自定义音乐 URL；存在时跳过 `prompt` 自动检索 |
| `canvas_flag` | NUMBER | 否 | 0 / 1 | 0 | 0=竖屏(9:16)，1=横屏(16:9) |

**API 参数映射**

`video_stitching`：`video_list` → `video_list`；`video_volume` → `video_volume`（直传）

`video_splicing_music`：`video_list` → `video_urls`；`prompt` → `content`；`video_volume`、`music_url`、`canvas_flag` 直传

**工具调用**

纯拼接：
```bash
meitu video-stitch \
  --skill_name skill_video-stitch \
  --video_list '["{url1}","{url2}"]' \
  --prompt "通用视频素材" \
  --video_volume 1 \
  --json --download-dir {output_dir}
```

拼接 + 自动配乐：
```bash
meitu video-stitch \
  --skill_name skill_video-stitch \
  --video_list '["{url1}","{url2}"]' \
  --prompt "轻快的旅拍背景音乐" \
  --json --download-dir {output_dir}
```

拼接 + 自定义音乐：
```bash
meitu video-stitch \
  --skill_name skill_video-stitch \
  --video_list '["{url1}","{url2}"]' \
  --music_url "{music_url}" \
  --canvas_flag 0 \
  --json --download-dir {output_dir}
```

**错误降级**

| 场景 | 处理 |
|---|---|
| `video_list` 缺失 | 提示"请提供视频链接" |
| 视频数量 <2 | 提示"拼接需要至少 2 段视频" |
| 部分链接不可访问 | 过滤无效链接，用剩余视频执行 |
| 全部不可访问 | 提示"请提供有效视频链接" |
| `music_url` 不可访问 | 回退至 `prompt` 自动检索 |
| `video_volume` 超 0–2.0 | 钳位到合法范围 |
| `canvas_flag` 非 0/1 | 回退至默认 0（竖屏） |
| 用户要求"加转场效果" | 告知不支持自定义转场，使用默认硬切拼接 |
| `video_stitching` 调用失败 | 重试 1 次，仍失败返回错误 |
| `video_splicing_music` 调用失败 | 重试 1 次，仍失败返回错误 |
| 内容合规拦截 | 直接返回合规提示，不重试 |
| 同时提供 `music_url` + 风格 prompt | 优先用 `music_url`，prompt 仅辅助 |

### Deliver

解析 `--json` → `downloaded_files[0].saved_path` 或 `media_urls[0]`。

`mv {file} {output_dir}/{YYYY-MM-DD}_{name}_stitch.mp4`

## Output

- **格式**：MP4（默认竖屏 9:16，可切横屏 16:9）
- **命名**：`{YYYY-MM-DD}_{descriptive-name}_stitch.mp4`
- **位置**：项目 → `./output/`；一次性 → `$VISUAL/output/video-stitch/`

## 基线 Task ID

```
t_mt1a3i5n7bc437c380-3bce-4dd3-9b62-67226da73d91
```

