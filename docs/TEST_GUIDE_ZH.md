# 龙虾测试说明（给测试同学）

## 1. 安装全部 Skill（仓库版）

```bash
npx -y skills add https://github.com/meitu/meitu-skills --yes
```

## 2. 安装运行时 CLI（Node 版）

```bash
npm install -g meitu-ai
meitu --version
```

建议确认版本 `>= 0.1.6`（需包含全部内置命令，并与当前技能命令名保持一致）。

如果安装时提示 `EEXIST`（本机已有同名 `meitu`），可执行：

```bash
npm install -g meitu-ai@latest --force
```

## 3. 配置凭证

方式 A（推荐）：

```bash
export MEITU_OPENAPI_ACCESS_KEY="你的AK"
export MEITU_OPENAPI_SECRET_KEY="你的SK"
```

方式 B：

`~/.meitu/credentials.json`

```json
{"accessKey":"你的AK","secretKey":"你的SK"}
```

兼容旧文件（可选）：`~/.openapi/credentials.json`

## 3.1 敏感信息自检（建议）

在 `git commit`、`git push`、打包 zip/tar 给他人前，执行：

```bash
rg -n --hidden -S \
  -g '!.git' -g '!node_modules' \
  '(MEITU_OPENAPI_ACCESS_KEY|MEITU_OPENAPI_SECRET_KEY|accessKey|secretKey|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{20,}|BEGIN (RSA|EC|OPENSSH) PRIVATE KEY)' .
```

判定：
- 无输出：未发现明显明文敏感信息。
- 有输出：逐条确认是否为占位符；若是真实凭证，需立即删除并轮换。

## 4. 运行时懒更新（默认开启）

可选环境变量：

```bash
export MEITU_AUTO_UPDATE=1
export MEITU_UPDATE_CHECK_TTL_HOURS=24
export MEITU_UPDATE_CHANNEL=latest
export MEITU_TASK_WAIT_TIMEOUT_MS=600000
```

说明：
- 默认是“懒更新”，不会每次都更新。
- 仅在超过 TTL 或检测到版本变化时才检查并按需更新。

## 5. 本地 CLI 全量冒烟（9 项工具）

```bash
RUNNER="$HOME/.openclaw/skills/meitu-tools/scripts/run_command.js"
[ -f "$RUNNER" ] || RUNNER="$HOME/.openclaw/skills/meitu-skills/meitu-tools/scripts/run_command.js"
[ -f "$RUNNER" ] || RUNNER="$HOME/.agents/skills/meitu-tools/scripts/run_command.js"

node "$RUNNER" --help

# 1) 图片超清
node "$RUNNER" --command image-upscale --input-json '{"image":"https://obs.mtlab.meitu.com/public/resources/aigensource.png"}'

# 2) 图片编辑
node "$RUNNER" --command image-edit --input-json '{"image":["https://obs.mtlab.meitu.com/public/resources/aigensource.png"],"prompt":"把背景改成雪山，人物保持不变，写实风格","model":"praline","ratio":"auto"}'

# 3) 图片生成
node "$RUNNER" --command image-generate --input-json '{"prompt":"同样人物，背景改成海边日落，写实风格","image":["https://obs.mtlab.meitu.com/public/resources/aigensource.png"],"size":"2K"}'

# 4) 试衣
node "$RUNNER" --command image-try-on --input-json '{"clothes_image_url":"https://obs.mtlab.meitu.com/public/resources/aigensource.png","person_image_url":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/aipaintingtext1.jpg","replace":"full","need_sd":"1"}'

# 5) 换头像
node "$RUNNER" --command image-face-swap --input-json '{"head_image_url":"https://obs.mtlab.meitu.com/public/resources/aigensource.png","sence_image_url":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/aipaintingtext1.jpg","prompt":"把第一张图的人脸自然替换到第二张图的人物上，保持光线一致"}'

# 6) 抠图
node "$RUNNER" --command image-cutout --input-json '{"image":"https://obs.mtlab.meitu.com/public/resources/aigensource.png"}'

# 7) 美颜增强
node "$RUNNER" --command image-beauty-enhance --input-json '{"image":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/aipaintingtext1.jpg","beatify_type":1}'

# 8) 图生视频（耗时较长）
MEITU_TASK_WAIT_TIMEOUT_MS=600000 node "$RUNNER" --command image-to-video --input-json '{"image":["https://obs.mtlab.meitu.com/public/resources/aigensource.png"],"prompt":"让人物微笑并轻微摆头","video_duration":"5","ratio":"9:16"}'

# 9) 动作迁移（耗时较长）
MEITU_TASK_WAIT_TIMEOUT_MS=600000 node "$RUNNER" --command video-motion-transfer --input-json '{"image_url":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/aipaintingtext1.jpg","video_url":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/1080-5s.mp4","prompt":"使用图片中的人物，按照视频中的动作生成新视频，保持人物身份与风格一致，写实风格"}'
```

说明：
- `image-to-video`、`video-motion-transfer` 会明显更慢，建议预留 3-10 分钟。
- 若提示命令不存在，先执行第 2 节强制升级命令后重试。
- `video-motion-transfer` 参数语义：
  - `image_url`：目标人物来源图（最终视频里的人物）
  - `video_url`：动作参考视频（动作与镜头参考）
  - `prompt`：生成约束（风格/一致性要求）

## 6. 在龙虾里测试（微信文档粘贴版）

6.0 工具能力总入口

/skill meitu-tools
请列出你支持的工具能力，并给出每个能力最小必填参数。

6.1 九个工具逐项测试

1) 图片超清
/skill meitu-tools
command=image-upscale
input={"image":"https://obs.mtlab.meitu.com/public/resources/aigensource.png"}

2) 图片编辑
/skill meitu-tools
command=image-edit
input={"image":["https://obs.mtlab.meitu.com/public/resources/aigensource.png"],"prompt":"把背景改成雪山，人物保持不变，写实风格","model":"praline","ratio":"auto"}

3) 图片生成
/skill meitu-tools
command=image-generate
input={"prompt":"同样人物，背景改成海边日落，写实风格","image":["https://obs.mtlab.meitu.com/public/resources/aigensource.png"],"size":"2K"}

4) 试衣
/skill meitu-tools
command=image-try-on
input={"clothes_image_url":"https://obs.mtlab.meitu.com/public/resources/aigensource.png","person_image_url":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/aipaintingtext1.jpg","replace":"full","need_sd":"1"}

5) 换头像
/skill meitu-tools
command=image-face-swap
input={"head_image_url":"https://obs.mtlab.meitu.com/public/resources/aigensource.png","sence_image_url":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/aipaintingtext1.jpg","prompt":"把第一张图的人脸自然替换到第二张图的人物上，保持光线一致"}

6) 抠图
/skill meitu-tools
command=image-cutout
input={"image":"https://obs.mtlab.meitu.com/public/resources/aigensource.png"}

7) 美颜增强
/skill meitu-tools
command=image-beauty-enhance
input={"image":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/aipaintingtext1.jpg","beatify_type":1}

8) 图生视频
/skill meitu-tools
command=image-to-video
input={"image":["https://obs.mtlab.meitu.com/public/resources/aigensource.png"],"prompt":"让人物微笑并轻微摆头","video_duration":"5","ratio":"9:16"}

9) 动作迁移
/skill meitu-tools
command=video-motion-transfer
input={"image_url":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/aipaintingtext1.jpg","video_url":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/1080-5s.mp4","prompt":"使用图片中的人物，按照视频中的动作生成新视频，保持人物身份与风格一致，写实风格"}

6.2 场景能力（可选）

/skill article-to-cover
请把下面内容做成中文海报封面，科技感风格，主标题醒目：
“AI 图像能力平台上线，支持图片编辑、超清、换头像、试衣、图生视频等功能，面向开发者开放测试。”

6.3 自然语言触发示例

请把这张图做高清修复并提升清晰度：https://obs.mtlab.meitu.com/public/resources/aigensource.png
把这张图背景改成雪山，人物保持不变：https://obs.mtlab.meitu.com/public/resources/aigensource.png
请生成一张写实风格海边日落人像图
请帮我做试衣：衣服图用这个，人物图用这个
请帮我把第一张图的人脸换到第二张图
请帮我抠图并保留主体
请帮我做自然人像美颜增强（高P）：https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/aipaintingtext1.jpg
请把这张图生成 5 秒短视频：https://obs.mtlab.meitu.com/public/resources/aigensource.png
请用这张图片中的人物，按照这个参考视频的动作生成新视频

## 7. 验收标准（必须全部通过）

必须同时满足：
- 9 个工具命令全部执行通过。
- 每条工具命令返回 `ok=true`。
- 每条工具命令返回非空 `task_id`。
- 每条工具命令返回至少 1 个结果 URL（`media_urls` 非空）。

9 个必测工具清单：
- `video-motion-transfer`
- `image-edit`
- `image-generate`
- `image-upscale`
- `image-try-on`
- `image-to-video`
- `image-face-swap`
- `image-cutout`
- `image-beauty-enhance`
