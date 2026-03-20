# 工具维护指南

本文档说明如何新增、修改、删除工具，以及日常维护流程。面向所有参与 meitu-skills 维护的同事。

## 核心原则

**只改一个文件：`tools-ssot/tools.yaml`**

所有下游产物由 `npm run generate` 自动生成，禁止手动编辑。

```
tools-ssot/tools.yaml   ← 唯一需要人工编辑的文件
    │
    └── npm run generate
        ├── meitu-tools/scripts/lib/commands-data.json   (CLI 注册表)
        ├── meitu-tools/generated/manifest.json          (能力清单)
        ├── meitu-tools/SKILL.md                         (能力目录段)
        ├── SKILL.md                                     (工具映射段)
        ├── tools-ssot/agent-descriptions.yaml           (Agent 描述)
        ├── tools-ssot/tools-overview.csv                (表格总览)
        └── tools-ssot/disambiguation-matrix.md          (消歧矩阵)
```

## 日常操作流程

```bash
# 1. 编辑 tools.yaml（见下方具体场景）
# 2. 生成
npm run generate
# 3. 验证
node -e "console.log(require('./meitu-tools/scripts/lib/commands').ALL_COMMAND_NAMES)"
node meitu-tools/scripts/run_command.js --command <cmd> --input-json '{...}'
```

---

## 场景一：新增工具（有 CLI 支持）

在 `tools-ssot/tools.yaml` 的对应类别下添加完整条目：

```yaml
- id: new-command
  name: 新命令中文名
  summary: 一句话描述（<=40字）
  triggers:
    - 用户可能的意图描述1
    - 用户可能的意图描述2
  prefer_over:                        # 可选，与哪些工具容易混淆
    - tool: similar-tool-id
      when: 选当前工具而非对方的判断条件
  input:
    - type: image
      count: "1"
      note: 输入说明
    - type: text
      count: "1"
      note: prompt
  output:
    type: image
  constraints:                        # 可选，硬性约束
    - 约束说明
  not_for:
    - 不适用场景1 → 应转向的工具
    - 不适用场景2 → 应转向的工具
  cli:
    requiredKeys: [image, prompt]     # 必填参数
    optionalKeys: [size, ratio]       # 可选参数
    arrayKeys: [image]                # 值为数组的参数
    commandAliases: [alias1, 中文别名] # 命令别名
    inputAliases:                     # 输入键别名（中文/英文缩写 → 标准键名）
      image_url: image
      图片: image
      提示词: prompt
```

### 特殊情况：CLI 命令名与 id 不同

如果 CLI 实际命令名与 `id` 不同，用 `cli.command` 指定：

```yaml
- id: image-try-on
  cli:
    command: image-virtual-tryon      # 实际 CLI 命令名
    commandAliases: [image-try-on, virtual-tryon, 试衣]
    ...
```

### 需要额外检查

- 如果是**视频类命令**，需在 `meitu-tools/scripts/lib/executor.js` 的 `VIDEO_COMMANDS` 中添加（影响超时时长，视频用 600s，其他用 900s）
- 如果新工具与现有工具**容易混淆**，双方都加 `prefer_over`，并在对方的 `not_for` 中补充转向

## 场景二：新增工具（暂无 CLI 支持）

同上，但**不写 `cli` 字段**。该工具只会出现在：
- `agent-descriptions.yaml`
- `tools-overview.csv`
- `disambiguation-matrix.md`

不会进入 CLI 管线。等 `meitu-ai` CLI 发版支持后，再补 `cli` 字段即可。

## 场景三：给现有工具添加新参数

直接在 `tools.yaml` 对应工具的 `cli` 字段中修改：

```yaml
cli:
  requiredKeys: [image, prompt]
  optionalKeys: [size, ratio, model]   # ← 这里加 model
  ...
  inputAliases:
    ...
    模型: model                         # ← 加中文别名
```

## 场景四：修改工具描述/消歧关系

直接改 `tools.yaml` 中对应的 `summary`、`triggers`、`prefer_over`、`not_for` 等字段。

如果改了 `prefer_over` 或 `not_for`，**检查关联工具是否也需要同步调整**（消歧关系通常是双向的）。

## 场景五：删除工具

从 `tools.yaml` 中删除整个工具条目，然后 `npm run generate`。

## 场景六：CLI 需要新版本才支持

tools.yaml 可以提前配好 `cli` 字段。如果当前 `meitu-ai` CLI 版本不支持，在 `docs/CLI_UPGRADE.md` 中记录：
- 新命令的参数规格
- 对应的后端 API name
- 升级后的验证命令

## 字段速查

### 工具描述字段

| 字段 | 必填 | 说明 |
|------|------|------|
| `id` | yes | 工具标识，kebab-case |
| `name` | yes | 中文功能名 |
| `summary` | yes | <=40字一句话描述 |
| `triggers` | yes | 用户意图触发条件列表 |
| `prefer_over` | no | 与哪些工具容易混淆，选当前工具的条件 |
| `input` | yes | 输入规格（type/count/note） |
| `output` | yes | 输出规格 |
| `params` | no | 额外参数，如子模型选择 |
| `constraints` | no | 硬性约束 |
| `not_for` | yes | 不适用场景 + 转向工具 |

### CLI 字段

| 字段 | 必填 | 说明 |
|------|------|------|
| `cli.command` | no | 实际 CLI 命令名（省略则用 id） |
| `cli.requiredKeys` | yes | 必填参数列表 |
| `cli.optionalKeys` | yes | 可选参数列表（可为空数组） |
| `cli.arrayKeys` | yes | 值为数组的参数（可为空数组） |
| `cli.commandAliases` | yes | 命令别名列表 |
| `cli.inputAliases` | yes | 输入键别名映射 |

## 验证检查清单

- [ ] `npm run generate` 运行成功，输出 `done.`
- [ ] `commands-data.json` 中有新工具条目
- [ ] `agent-descriptions.yaml` 中有对应描述
- [ ] `disambiguation-matrix.md` 中有消歧关系
- [ ] 命令别名解析正确：`node -e "console.log(require('./meitu-tools/scripts/lib/commands').resolveCommandAlias('别名'))"`
- [ ] CLI 实际调用测试通过（如当前版本支持）
- [ ] `prefer_over` 双向一致

## 获取后端 API 参数

新工具的参数规格从 MCP 工具配置 API 获取：

```
https://preinternal-aigc.meitu.com/api/v1/mcptool/list_mcp_bygroup.json?group=internal
```

解析 `params` 字段中的 `input_alias`，其中：
- `media_input_alias` → 媒体类输入（图片/视频 URL）
- `parameter_input_alias` → 参数输入（prompt、size、ratio 等）

参见 `docs/CLI_UPGRADE.md` 中已有的映射表。
