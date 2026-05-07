---
name: image-search
description: "关键词搜图 / 以图搜图，内部图库 + Pinterest 联合检索。当用户提到搜图、找参考图、找素材、搜几张、找类似的图、以图搜图、搜灵感、帮我搜、找图片时触发。"
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

# Image Search

## Overview

关键词搜图 / 以图搜图，内部图库 + Pinterest 联合检索。用于找参考图、找素材、搜灵感、以图找相似图片；支持多关键词拆分提升召回率。

## API Mapping

- 关键词搜图 / 以图搜图：`image_search`

## Dependencies

- **meitu-cli**: `>=2.0.6`
- **凭证**：CONFIG AKSK → `meitu tools update`；EXEC AKSK → 实际执行（见根 `CONFIG.md`）
- **环境变量**：`MEITU_OPENAPI_TOOL_TASK_MODE=command`

> 路径别名：`$VISUAL` = `{OPENCLAW_HOME}/workspace/visual/`

## Core Workflow

```
Preflight → Execute → Deliver
```

### Preflight

1. `meitu --version` ≥ 2.0.6
2. 已用 CONFIG AKSK 跑过 `meitu tools update`
3. 当前 AKSK = EXEC，`MEITU_OPENAPI_TOOL_TASK_MODE=command`
4. output_dir：openclaw.yaml → `./output/` ｜else → `$VISUAL/output/image-search/`

### Execute

**触发信号 / 路由规则**

核心维度：**search vs retrieve 模式 + 参数齐全**。

| 场景 | 判定 | 路由 |
|------|----------|------|
| 关键词搜图 | 搜文字描述的图 | `image_search`，`query_mode=search` |
| 以图搜图 | 给参考图找相似 | `image_search`，`query_mode=retrieve` |
| 关键词 + 参考图 | 同时给关键词和参考图 | `image_search`，`query_mode=search` + 双参数 |

复杂意图拆多个关键词提升召回率（如"北欧极简客厅"→`["北欧客厅","极简风"]`）。

**参数定义**

| 参数 | 类型 | 必填 | 范围 | 默认 | 说明 |
|------|------|------|------|------|------|
| `prompt` | ARRAY | 条件必填 | -- | -- | 搜索词数组。复杂意图拆多个关键词。`search` 模式必填 |
| `image_ids` | ARRAY | 条件必填 | -- | -- | 图片 ID 数组。用户给 URL 时自动提取 ID。`retrieve` 模式必填 |
| `query_mode` | STRING | 是 | search / retrieve | search | search=关键词搜索；retrieve=以图召回 |
| `size` | NUMBER | 是 | 1–20 | 4 | 返回图片数量。"多找几张"可调大到 8–12 |
| `source_type` | STRING | 是 | auto / internal / pinterest | auto | auto=内部优先不足回退外部 |

缺省策略：`prompt` 和 `image_ids` 至少提供一项；都缺失 → 提示"请描述搜索内容或提供参考图"。

**工具调用**

```bash
meitu image-search --prompt "<kw1>,<kw2>" [--query_mode search] [--size 4] [--source_type auto] --json
# 以图搜图
meitu image-search --image_ids <id1>,<id2> --query_mode retrieve --json
```

**错误降级**

| 场景 | 处理方式 |
|------|------|
| `prompt` 和 `image_ids` 都缺失 | 提示"请描述搜索内容或提供参考图" |
| 说"搜这张图类似的"但未提供图片 | 提示"请提供参考图片" |
| 说"多搜点"但 `size` 已为 20 | 告知最多返回 20 张 |
| `source_type=pinterest` 但外部源不可用 | 降级为 `auto` 重试 |
| 返回空结果 | 换同义词重试 1 次，仍空：告知未找到，建议换关键词 |
| 接口超时 | `size` 缩至 2 重试，仍超时：告知服务暂不可用 |
| `image_ids` 全部无效 | 提示"图片 ID 无效" |
| 内容合规拦截 | 直接返回合规提示，不重试 |
| 用户既给关键词又给参考图 | `query_mode=search`，同时传 `prompt + image_ids` |

### Deliver

- 使用 Preflight 解析的 output_dir
- 命名：`{YYYY-MM-DD}_{descriptive}_image-search.{ext}`（检索结果元数据 JSON + 下载图片）

## Output

- **格式**：JSON 检索结果（URL/ID）+ 可选下载图片
- **位置**：项目 → `./output/`，一次性 → `$VISUAL/output/image-search/`

## 基线 Task ID

见 `references/task-id-baseline.md` 中对应行。
