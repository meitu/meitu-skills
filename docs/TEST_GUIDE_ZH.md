# 龙虾测试说明（给测试同学）

本文档用于让测试同学以最简单方式安装并验证 `meitu-ai-skillpack`（安装仓库下全部 skill）。

## 1. 一次性安装全部 Skill（推荐）

```bash
npx -y skills add https://github.com/tangyang/skills --yes
```

说明：
- 这条命令会安装仓库下全部 skill（含 `meitu-ai` 基础 skill 和所有场景 skill）。
- 不需要先手动 `git clone`。

可选检查（看是否安装成功）：

```bash
find ~/.openclaw/skills ~/.agents/skills -maxdepth 2 -name SKILL.md 2>/dev/null | sort
```

## 2. 安装运行时 CLI（meitu-ai）

```bash
pipx install --force meitu-ai
```

检查命令是否可用：

```bash
meitu --help
```

## 3. 配置凭证

二选一即可。

方式 A：环境变量（推荐）

```bash
export OPENAPI_ACCESS_KEY="你的AK"
export OPENAPI_SECRET_KEY="你的SK"
```

方式 B：文件

创建 `~/.openapi/credentials.json`：

```json
{
  "accessKey": "你的AK",
  "secretKey": "你的SK"
}
```

## 4. CLI 冒烟验证（不经过龙虾）

```bash
RUNNER="$HOME/.openclaw/skills/meitu-ai/scripts/run_command.py"
[ -f "$RUNNER" ] || RUNNER="$HOME/.agents/skills/meitu-ai/scripts/run_command.py"

python3 "$RUNNER" \
  --command image-upscale \
  --input-json '{"image":"https://obs.mtlab.meitu.com/public/resources/aigensource.png"}'
```

通过标准：
- 返回 JSON 中包含 `ok: true`
- 包含 `task_id`
- `media_urls` 中有可访问的结果链接

## 5. 在龙虾里测试（腾讯文档粘贴友好）

以下内容可直接复制到龙虾输入框。

1. 基础能力识别（工具 skill）
/skill meitu-ai
请列出你支持的 meitu-ai 图像能力，并说明每个能力最小必填参数。

2. 图片超清
/skill meitu-image-upscale input={"image":"https://obs.mtlab.meitu.com/public/resources/aigensource.png"}

3. 图片编辑
/skill meitu-image-edit input={"image":["https://obs.mtlab.meitu.com/public/resources/aigensource.png"],"prompt":"把背景改成雪山，人物保持不变，写实风格","size":"2K","output_format":"jpeg","ratio":"auto"}

4. 图片生成
/skill meitu-image-generate input={"prompt":"一位站在雪山前的亚洲女性，写实摄影风格，电影级光影，细节清晰","size":"2K"}

5. 抠图
/skill meitu-image-cutout input={"image":"https://obs.mtlab.meitu.com/public/resources/aigensource.png"}

6. 换头像
/skill meitu-image-face-swap input={"head_image_url":"https://obs.mtlab.meitu.com/public/resources/aigensource.png","sence_image_url":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/aipaintingtext1.jpg","prompt":"自然融合，保持肤色一致，写实风格"}

7. 试衣（请准备两张可访问图片）
/skill meitu-image-virtual-tryon input={"clothes_image_url":"<衣服图片URL>","person_image_url":"<人物图片URL>"}

8. 文章转海报
/skill article-to-cover
请把下面这段内容做成一张中文海报封面，风格偏科技感，主标题醒目，适合公众号头图：
“AI 图像能力平台上线，支持图片编辑、超清、换头像、试衣、图生视频等功能，面向开发者开放测试。”

## 6. 验收标准

每条测试建议记录：
- 触发时间
- 使用的 skill 名称
- 输入参数（或 prompt）
- 返回的 `task_id`
- 最终结果 URL
- 是否成功（成功/失败）

建议最少通过：
- `meitu-ai`（能力清单可正确回复）
- `meitu-image-upscale`
- `meitu-image-edit`
- `meitu-image-generate`
- `article-to-cover`

## 7. 常见问题

1. `meitu: command not found`
- 执行 `pipx ensurepath` 后重新打开终端。

2. 凭证错误/鉴权失败
- 检查 AK/SK 是否生效，或 `~/.openapi/credentials.json` 字段名是否为 `accessKey`、`secretKey`。

3. 找不到 runner 脚本
- 先执行第 1 步安装 skill；再执行第 4 步中的自动探测脚本。

4. 龙虾未触发到指定 skill
- 优先使用 `/skill <skill-name> input=...` 强触发格式。
