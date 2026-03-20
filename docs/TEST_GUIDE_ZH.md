# 龙虾测试说明（给测试同学）

## 1. 一次性安装全部 Skill（推荐）

```bash
npx -y skills add https://github.com/tangyang/skills --yes
```

## 2. 安装运行时 CLI（meitu-ai）

```bash
npm install -g meitu-ai
```

懒更新（默认已开启）可选配置：

```bash
export MEITU_AUTO_UPDATE=1
export MEITU_UPDATE_CHECK_TTL_HOURS=24
export MEITU_UPDATE_CHANNEL=latest
```

## 3. 配置凭证

二选一：

```bash
export OPENAPI_ACCESS_KEY="你的AK"
export OPENAPI_SECRET_KEY="你的SK"
```

或 `~/.meitu/credentials.json`:

```json
{"accessKey":"你的AK","secretKey":"你的SK"}
```

兼容旧凭证文件：`~/.openapi/credentials.json`（可选）。

## 4. CLI 冒烟验证

```bash
RUNNER="$HOME/.openclaw/skills/meitu-tools/scripts/run_command.js"
[ -f "$RUNNER" ] || RUNNER="$HOME/.agents/skills/meitu-tools/scripts/run_command.js"

node "$RUNNER" --command image-upscale --input-json '{"image":"https://obs.mtlab.meitu.com/public/resources/aigensource.png"}'
```

## 5. 在龙虾里测试（可复制）

1. 工具能力总入口
/skill meitu-tools
请列出你支持的工具能力，并给出每个能力最小必填参数。

2. 图片超清（通过 meitu-tools）
/skill meitu-tools
command=image-upscale
input={"image":"https://obs.mtlab.meitu.com/public/resources/aigensource.png"}

3. 图片编辑（通过 meitu-tools）
/skill meitu-tools
command=image-edit
input={"image":["https://obs.mtlab.meitu.com/public/resources/aigensource.png"],"prompt":"把背景改成雪山，人物保持不变，写实风格","size":"2K","output_format":"jpeg","ratio":"auto"}

4. 图片生成（通过 meitu-tools）
/skill meitu-tools
command=image-generate
input={"prompt":"一位站在雪山前的亚洲女性，写实摄影风格，电影级光影，细节清晰","size":"2K"}

5. 场景能力：文章转海报
/skill article-to-cover
请把下面内容做成中文海报封面，科技感风格，主标题醒目：
“AI 图像能力平台上线，支持图片编辑、超清、换头像、试衣、图生视频等功能，面向开发者开放测试。”

自然语言触发示例：
- 请把这张图做高清修复并提升清晰度：https://obs.mtlab.meitu.com/public/resources/aigensource.png
- 把这张图背景改成雪山，人物保持不变：https://obs.mtlab.meitu.com/public/resources/aigensource.png
- 请把下面内容做成中文海报封面：AI 图像能力平台上线...

## 6. 验收标准

至少通过：
- `meitu-tools`（能力清单可正确返回）
- `meitu-tools + image-upscale`
- `meitu-tools + image-edit`
- `article-to-cover`
