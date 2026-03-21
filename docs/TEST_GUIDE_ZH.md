# 龙虾测试说明（给测试同学）

## 0. 测试版本前置条件

本说明默认基于以下版本执行：
- Skill：使用最新 `meitu-skills` 仓库代码安装的 Skill
- CLI：使用 `meitu-ai 0.1.6`

若 Skill 不是最新版本，或 CLI 不是 `0.1.6`，测试结果可能与本文档不一致。

## 1. 安装全部 Skill（仓库版）

请安装最新的 `meitu-skills`：

```bash
npx -y skills add https://github.com/meitu/meitu-skills --yes
```

## 2. 安装运行时 CLI（Node 版）

请固定安装 `meitu-ai 0.1.6`：

```bash
npm install -g meitu-ai@0.1.6
meitu --version
```

期望版本输出：

```bash
0.1.6
```

本文档测试口径以 `0.1.6` 为准（需包含全部内置命令，并与当前技能命令名保持一致）。

如果安装时提示 `EEXIST`（本机已有同名 `meitu`），可执行：

```bash
npm install -g meitu-ai@0.1.6 --force
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

## 5. 本地 CLI 全量冒烟（覆盖 13 个命令，共 15 条执行用例）

```bash
RUNNER="$HOME/.openclaw/skills/meitu-tools/scripts/run_command.js"
[ -f "$RUNNER" ] || RUNNER="$HOME/.openclaw/skills/meitu-skills/meitu-tools/scripts/run_command.js"
[ -f "$RUNNER" ] || RUNNER="$HOME/.agents/skills/meitu-tools/scripts/run_command.js"

node "$RUNNER" --help

# 1) 图片超清
node "$RUNNER" --command image-upscale --input-json '{"image":"https://obs.mtlab.meitu.com/public/resources/aigensource.png"}'

# 2) 图片编辑 - praline
node "$RUNNER" --command image-edit --input-json '{"image":["https://obs.mtlab.meitu.com/public/resources/aigensource.png"],"prompt":"把背景改成雪山，人物保持不变，写实风格","model":"praline","ratio":"auto"}'

# 3) 图片编辑 - nougat
node "$RUNNER" --command image-edit --input-json '{"image":["https://obs.mtlab.meitu.com/public/resources/aigensource.png"],"prompt":"改成日系插画风格，保留人物主体和姿态","model":"nougat","ratio":"1:1"}'

# 4) 图片编辑 - gummy
node "$RUNNER" --command image-edit --input-json '{"image":["https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/aipaintingtext1.jpg"],"prompt":"优化人像面部与发丝细节，背景改为摄影棚，保持人物身份一致","model":"gummy","ratio":"9:16"}'

# 5) 图片生成
node "$RUNNER" --command image-generate --input-json '{"prompt":"同样人物，背景改成海边日落，写实风格","image":["https://obs.mtlab.meitu.com/public/resources/aigensource.png"],"size":"2K","ratio":"3:4"}'

# 6) 海报生成
node "$RUNNER" --command image-poster-generate --input-json '{"prompt":"春季上新海报，主标题 SPRING SALE，副标题 精选单品 50% OFF，简洁电商海报风格","image_list":["https://obs.mtlab.meitu.com/public/resources/aigensource.png"],"model":"Praline_2","size":"1K","ratio":"3:4","output_format":"png"}'

# 7) 试衣
node "$RUNNER" --command image-try-on --input-json '{"clothes_image_url":"https://obs.mtlab.meitu.com/public/resources/aigensource.png","person_image_url":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/aipaintingtext1.jpg","replace":"full","need_sd":"1"}'

# 8) 换头像
node "$RUNNER" --command image-face-swap --input-json '{"head_image_url":"https://obs.mtlab.meitu.com/public/resources/aigensource.png","sence_image_url":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/aipaintingtext1.jpg","prompt":"把第一张图的人脸自然替换到第二张图的人物上，保持光线一致"}'

# 9) 抠图
node "$RUNNER" --command image-cutout --input-json '{"image":"https://obs.mtlab.meitu.com/public/resources/aigensource.png"}'

# 10) 美颜增强
node "$RUNNER" --command image-beauty-enhance --input-json '{"image":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/aipaintingtext1.jpg","beatify_type":1}'

# 11) 宫格拆分
node "$RUNNER" --command image-grid-split --input-json '{"image":"<请替换为标准四宫格拼接图 URL 或本地文件路径>"}'

# 12) 图生视频（耗时较长）
MEITU_TASK_WAIT_TIMEOUT_MS=600000 node "$RUNNER" --command image-to-video --input-json '{"image":["https://obs.mtlab.meitu.com/public/resources/aigensource.png"],"prompt":"让人物微笑并轻微摆头","video_duration":"5","ratio":"9:16"}'

# 13) 动作迁移（耗时较长）
MEITU_TASK_WAIT_TIMEOUT_MS=600000 node "$RUNNER" --command video-motion-transfer --input-json '{"image_url":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/aipaintingtext1.jpg","video_url":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/1080-5s.mp4","prompt":"使用图片中的人物，按照视频中的动作生成新视频，保持人物身份与风格一致，写实风格"}'

# 14) 文生视频（耗时较长）
MEITU_TASK_WAIT_TIMEOUT_MS=600000 node "$RUNNER" --command text-to-video --input-json '{"prompt":"一个年轻人站在海边微笑并轻微摆头，写实风格","video_duration":5,"sound":"off"}'

# 15) 视频转 GIF（耗时较长）
MEITU_TASK_WAIT_TIMEOUT_MS=600000 node "$RUNNER" --command video-to-gif --input-json '{"image":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/1080-5s.mp4","wechat_gif":true}'
```

说明：
- `image-to-video`、`video-motion-transfer`、`text-to-video`、`video-to-gif` 会明显更慢，建议预留 3-10 分钟。
- 若仅验证视频类命令已正常发起任务，可记录非空 `task_id` 即视为该项通过；若要等最终产物，再继续等待 `media_urls` 返回。
- `image-grid-split` 需要标准四宫格(2x2)拼接图；普通单图不适合用于该项测试。
- `image-edit` 必须分别验证 `praline`、`nougat`、`gummy` 三个模型。
- 若提示命令不存在，先执行第 2 节强制升级命令后重试。
- `video-motion-transfer` 参数语义：
  - `image_url`：目标人物来源图（最终视频里的人物）
  - `video_url`：动作参考视频（动作与镜头参考）
  - `prompt`：生成约束（风格/一致性要求）

## 6. 在龙虾里测试（微信文档粘贴版）

6.0 工具能力总入口

/skill meitu-tools
请列出你支持的工具能力，并给出每个能力最小必填参数。

6.1 十三个命令逐项测试（共 15 条执行用例）

1) 图片超清
/skill meitu-tools
command=image-upscale
input={"image":"https://obs.mtlab.meitu.com/public/resources/aigensource.png"}

2) 图片编辑 - praline
/skill meitu-tools
command=image-edit
input={"image":["https://obs.mtlab.meitu.com/public/resources/aigensource.png"],"prompt":"把背景改成雪山，人物保持不变，写实风格","model":"praline","ratio":"auto"}

3) 图片编辑 - nougat
/skill meitu-tools
command=image-edit
input={"image":["https://obs.mtlab.meitu.com/public/resources/aigensource.png"],"prompt":"改成日系插画风格，保留人物主体和姿态","model":"nougat","ratio":"1:1"}

4) 图片编辑 - gummy
/skill meitu-tools
command=image-edit
input={"image":["https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/aipaintingtext1.jpg"],"prompt":"优化人像面部与发丝细节，背景改为摄影棚，保持人物身份一致","model":"gummy","ratio":"9:16"}

5) 图片生成
/skill meitu-tools
command=image-generate
input={"prompt":"同样人物，背景改成海边日落，写实风格","image":["https://obs.mtlab.meitu.com/public/resources/aigensource.png"],"size":"2K","ratio":"3:4"}

6) 海报生成
/skill meitu-tools
command=image-poster-generate
input={"prompt":"春季上新海报，主标题 SPRING SALE，副标题 精选单品 50% OFF，简洁电商海报风格","image_list":["https://obs.mtlab.meitu.com/public/resources/aigensource.png"],"model":"Praline_2","size":"1K","ratio":"3:4","output_format":"png"}

7) 试衣
/skill meitu-tools
command=image-try-on
input={"clothes_image_url":"https://obs.mtlab.meitu.com/public/resources/aigensource.png","person_image_url":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/aipaintingtext1.jpg","replace":"full","need_sd":"1"}

8) 换头像
/skill meitu-tools
command=image-face-swap
input={"head_image_url":"https://obs.mtlab.meitu.com/public/resources/aigensource.png","sence_image_url":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/aipaintingtext1.jpg","prompt":"把第一张图的人脸自然替换到第二张图的人物上，保持光线一致"}

9) 抠图
/skill meitu-tools
command=image-cutout
input={"image":"https://obs.mtlab.meitu.com/public/resources/aigensource.png"}

10) 美颜增强
/skill meitu-tools
command=image-beauty-enhance
input={"image":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/aipaintingtext1.jpg","beatify_type":1}

11) 宫格拆分
/skill meitu-tools
command=image-grid-split
input={"image":"<请替换为标准四宫格拼接图 URL>"}

12) 图生视频
/skill meitu-tools
command=image-to-video
input={"image":["https://obs.mtlab.meitu.com/public/resources/aigensource.png"],"prompt":"让人物微笑并轻微摆头","video_duration":"5","ratio":"9:16"}

13) 动作迁移
/skill meitu-tools
command=video-motion-transfer
input={"image_url":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/aipaintingtext1.jpg","video_url":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/1080-5s.mp4","prompt":"使用图片中的人物，按照视频中的动作生成新视频，保持人物身份与风格一致，写实风格"}

14) 文生视频
/skill meitu-tools
command=text-to-video
input={"prompt":"一个年轻人站在海边微笑并轻微摆头，写实风格","video_duration":5,"sound":"off"}

15) 视频转 GIF
/skill meitu-tools
command=video-to-gif
input={"image":"https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/1080-5s.mp4","wechat_gif":true}

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
请根据这段文案生成一张 3:4 电商促销海报，主标题 SPRING SALE，副标题 精选单品 50% OFF
请把这张标准四宫格拼接图拆成 4 张单图
请把这张图生成 5 秒短视频：https://obs.mtlab.meitu.com/public/resources/aigensource.png
请用这张图片中的人物，按照这个参考视频的动作生成新视频
请生成一段 5 秒的写实风格海边人物短视频
请把这个视频转成微信表情包 GIF：https://meitu-commons-test.obs.cn-north-4.myhuaweicloud.com/autotest/1080-5s.mp4

## 7. 验收标准（必须全部通过）

必须同时满足：
- 13 个命令全部至少执行 1 次。
- `image-edit` 需分别验证 `praline`、`nougat`、`gummy` 三个模型。
- 共 15 条执行用例全部通过。
- 每条执行用例都要返回非空 `task_id`。
- 图片类命令需返回 `ok=true`，且 `media_urls` 非空。
- 视频类命令至少需成功创建任务；若返回非空 `task_id` 即可判定“已正常发起”。如等待到完成态，则 `media_urls` 也应非空。

13 个必测命令清单：
- `video-motion-transfer`
- `image-edit`
- `image-generate`
- `image-poster-generate`
- `image-upscale`
- `image-try-on`
- `image-to-video`
- `text-to-video`
- `video-to-gif`
- `image-face-swap`
- `image-cutout`
- `image-beauty-enhance`
- `image-grid-split`
