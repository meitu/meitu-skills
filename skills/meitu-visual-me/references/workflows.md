# Workflows — 17 Scenarios

Each workflow provides 2-3 style directions. Pick the most suitable one; do not mix.

Each generation workflow has **recommended styles** that correspond to style keywords in `style-library.md`. Style determination priority: user specified one this time → use it directly; user didn't specify but has a memorized preference (`./visual/memory/global.md`) → use memory; neither → based on the day's content, mood, and scenario, pick 4 from the recommended styles and let user choose before generating.

## Universal Data Read Rules

Each workflow lists the data sources it needs to read. Check whether the file exists before reading. **Do not throw errors if a file is missing; use the following fallback:**

| Data source | Fallback when missing |
|--------|-------------------|
| `./visual/PROFILE.md` | Ask user to describe their appearance, or skip character traits |
| `./visual/assets/references/user.jpg` | Use text-to-image only, no reference image |
| `./visual/rules/quality.yaml` | Skip forbidden-style check, use default style |
| `USER.md` | Ask user for basic info like name/city |
| `MEMORY.md` | Don't use long-term memory, use only today's memory |
| `memory/今日.md` | Ask user "what did you do today?" or generate a generic scene |
| `SOUL.md` | Don't use OpenClaw's daily quote |
| `IDENTITY.md` | Use OpenClaw's default appearance |
| Weather API | Skip weather info, or ask user about current weather |

**Principle: Read whatever is available; if missing, ask or skip. Never refuse to generate due to missing data.**

---

## 1. persona-diorama · Personal Miniature Scene

**Trigger:** 微缩场景 (miniature scene)、个人场景 (personal scene)、生成我的形象卡 (generate my character card)
**Reads:** USER.md, MEMORY.md, memory/今日.md
**Ratio:** 1:1 | **Reference image:** Auto-included
**Command:** `meitu image-generate`
**Recommended styles:** 微缩世界、盒装手办、黏土动画、田园水彩动画

Turn this person's current state into a toy scene. Elements must come from the user's profile; no generic content.

- **A. Isometric miniature** — 45° overhead view, exquisite tiny world, 3D animation quality
- **B. Toy box** — Front view, cartoonish and exaggerated, vibrant colors
- **C. Snow globe world** — Circular composition, enclosed in a transparent sphere

---

## 2. daily-card · Daily Info Card

**Trigger:** 今日卡 (daily card)、今日信息卡 (daily info card)、城市打卡 (city check-in)
**Reads:** Weather API, USER.md (city), memory/今日.md
**Ratio:** 1:1 or 9:16 | **Must include:** City name, date, temperature
**Command:** `meitu image-generate`
**Recommended styles:** 信息卡、明信片、扁平插画

Today x this city x this person = what does it feel like?

- **A. Knolling layout** — Top-down view with neatly arranged items, 3D rendering
- **B. City postcard** — Vertical, foreground silhouette + city background
- **C. Data art** — Weather data transformed into abstract color-block geometry

---

## 3. morning-grid · Morning Four-Panel Grid

**Trigger:** 晨间卡 (morning card)、早安 (good morning)、晨间四宫格 (morning four-panel grid)
**Reads:** Weather API, USER.md, memory/今日.md
**Ratio:** 1:1 | **Reference image:** Style A auto-included
**Command:** `meitu image-generate`
**Recommended styles:** 胶片生活、扁平插画、Q版手办

Four panels representing the same morning mood, not four random scenes.

- **A. 3D animation style** — Warm cartoon tones, with character avatar
- **B. Film-style life photography** — 35mm grain, scenes only, no people
- **C. Illustration diary** — Flat illustration, journal/planner style

---

## 4. ootd · Outfit of the Day

**Trigger:** 今天穿什么 (what to wear today)、OOTD、穿搭推荐 (outfit recommendation)
**Reads:** Weather API, ./visual/config/defaults.yaml
**Ratio:** 9:16 | **Required:** Outfit must match today's weather
**Command:** `meitu image-generate`
**Recommended styles:** 街头抓拍、商品摄影、Q版手办

- **A. 3D cartoon character** — Matte texture, with reference image character
- **B. Flat lay outfit** — White background top-down view, brand e-commerce feel
- **C. Street candid** — Lifestyle feel, with a sense of story

---

## 5. data-diorama · Daily Data Scene

**Trigger:** 今日数据 (today's data)、数据场景 (data scene)、生成今天的数据场景 (generate today's data scene)
**Reads:** memory/今日.md, Weather API, MEMORY.md
**Ratio:** 1:1 | **Reference image:** Sometimes auto-included
**Command:** `meitu image-generate`
**Recommended styles:** 微缩世界、信息卡、扁平插画

Express today's "energy level" through a miniature scene; don't list numbers.

- **A. Energy barometer** — Lighting and tone reflect today's state: productive = warm gold, low = cool gray
- **B. Data overlay** — Semi-transparent data bubbles floating above objects
- **C. Miniature newspaper** — Styled as a front page with miniature scene, vintage feel

---

## 6. emotion-grid · Emotion Nine-Panel Grid

**Trigger:** 情绪九宫格 (emotion nine-grid)、多面体 (polyhedron)、九宫格 (nine-grid)
**Reads:** USER.md, MEMORY.md, SOUL.md
**Ratio:** 1:1 | **Required:** Nine labels derived from user profile, username at bottom
**Command:** `meitu image-generate`
**Recommended styles:** 动漫肖像、纪实人像、波普艺术

- **A. Black & white cinematic** — High contrast, like nine movie stills
- **B. Colorful cartoon emotion chart** — Same character in nine states, animation model sheet style
- **C. Minimal color blocks** — No people, expressing emotions through color and geometry

---

## 7. relationship-board · Relationship Cork Board

**Trigger:** 软木板 (cork board)、关系板 (relationship board)、关系拼贴 (relationship collage)
**Reads:** MEMORY.md, memory/今日.md, SOUL.md
**Ratio:** 1:1 | **Required:** Each item must correspond to a real event; bottom reads: username x OpenClaw · date
**Command:** `meitu image-generate`
**Recommended styles:** 复古拍立得、胶片生活、纪实人像

- **A. Detective board** — Red strings connecting polaroid photos, handwritten notes, tension feel
- **B. Travel memory board** — Warm and messy, photos + ticket stubs, nostalgic
- **C. Creative studio board** — Concept diagrams + sketches, mix of rational and emotional

---

## 8. memory-collage · Memory Collage

**Trigger:** 记忆拼贴 (memory collage)、把今天拼成一张图 (collage today into one image)、今天拼图 (today's collage)
**Reads:** memory/今日.md, SOUL.md (today's quote), Weather API
**Ratio:** 9:16 | **Required:** OpenClaw's daily quote appears in the image; date stamp at bottom
**Command:** `meitu image-generate`
**Recommended styles:** 胶片生活、复古拍立得、扁平插画

- **A. Creative studio collage** — Photos, sticky notes, tape marks, coffee stains
- **B. Artist's journal page** — Color gradients, brushstrokes, text fragments
- **C. Film strip splice** — Film format, like movie editing material strips

---

## 9. real-toon · Group Photo

**Trigger:** 合影 (group photo)、我和 OpenClaw (me and OpenClaw)、合个影 (take a photo together)
**Reads:** USER.md, SOUL.md, memory/今日.md
**Ratio:** 1:1 or 9:16 | **Reference image:** Both included (user + OpenClaw)
**Command:** `meitu image-generate`
**Recommended styles:** 动漫肖像、赛博朋克、微缩世界

The emotional tone between the two is determined by today's state. Use `eye level` to describe height differences, not `smaller`.

- **A. Tiny person on fingertip** — User is realistic, OpenClaw is a 3D cartoon figure on the fingertip
- **B. Pastoral watercolor together** — Both in hand-painted watercolor animation style, warm and cozy daily scene
- **C. Cyber partners** — Dark background, neon outlines, game/anime partner intro card

---

## 10. id-card · ID Card

**Trigger:** ID 卡 (ID card)、身份卡 (identity card)、帮我做一张卡 (make me a card)、收藏卡 (collectible card)
**Ratio:** 9:16
**Command:** `meitu image-generate` (works with or without reference image)

**Determining who the card is for:**
- Explicit subject → generate directly ("帮我生" = user card / "生你的" = OpenClaw card)
- No subject → default to user card; after generation, ask: "Want me to make one for myself too?"

### Guided Flow

Do not infer and generate directly; **guide the user through choices first**:

1. **Collect identity info** (read PROFILE.md + USER.md; ask for anything missing):
   - Name → `{name}`
   - Title/role → `{role}`
   - Organization (optional) → `{org}`
   - City → `{location}`
   - Birth year (optional) → `{est_year}`
   - One-line tag or alias (optional) → `{alias}`

2. **Let user choose a style** (show 4 options; do not default-select for the user):
   ```
   Pick a style:
   A. Street Grunge — Weathered texture, hardcore industrial
   B. Soft Glow — Cream base, gentle and artsy
   C. Cyber Neon — Dark base, neon glow outlines
   D. Retro Yearbook — 90s ID photo, nostalgic laser backdrop
   Or say "all of them" to get all four at once
   ```

3. **Check for reference image** `./visual/assets/references/user.jpg`
   - Found → pass reference image + facial precision instructions
   - Not found → text-to-image only, use text feature descriptions from PROFILE.md

4. **Assemble prompt based on chosen style** (see template below) → generate

5. **Post-delivery prompt:** "Which one do you like? Want to try a different style?"

6. On first use, extract features from the satisfactory result and write to `./visual/PROFILE.md`

### OpenClaw ID Card

**Reads:** IDENTITY.md (OpenClaw's character profile) + `./visual/assets/references/openclaw.jpg`

**Flow:**
1. Check if `./visual/assets/references/openclaw.jpg` exists
   - Found → `meitu image-generate` + reference image
   - Not found → text-to-image only (use generic description: `a friendly AI assistant character in tech-wear style`)
2. Read IDENTITY.md for character name, role, visual features; if missing, use defaults: OpenClaw, Creative AI
3. Let user choose a style (same 4 options as above)
4. Generate → deliver

**Reference image mode key requirement:** Must explicitly list key features in the prompt (hairstyle, accessories, clothing, signature details); don't just write "the character from the reference image" — the model needs text anchors.

### Prompt Skeleton

```
[With reference image] FACE LIKENESS IS THE #1 PRIORITY. Preserve exact facial structure.
{key_features}
Apply 3D collectible figure rendering LIGHTLY — keep proportions close to real.

[Without reference image] Describe the character's appearance in text (gender, hairstyle, key features).

Generate a vertical ID CARD in {style_name} style:
- Card surface and texture: {style_mood}
- 3D headshot portrait with background that matches the style
- Info area with: {name} / {role} / {org} / {location} — EST. {est_year}
- Side strip with {alias}
- Bottom strip with a milestone or tagline
Slight tilt, studio-lit product shot feel.
```

Style presets provide only **tonal anchors**; let AI freely generate specific details:

### Four Style Presets

| Style | Tone | Color direction | Texture keywords |
|------|------|---------|-----------|
| A. Street Grunge | Hardcore, weathered, industrial | Dark brown + terracotta + bone white | weathered leather, distressed edges, industrial sans-serif |
| B. Soft Glow | Gentle, artsy, handcrafted | Cream white + light purple + warm brown | unbleached cotton, soft rounded corners, casual hand-drawn accents |
| C. Cyber Neon | Tech, cool, glowing | Dark gray + cyan + magenta | brushed carbon fiber, neon glow border, monospaced terminal font |
| D. Retro Yearbook | Nostalgic, campus, 90s | Warm brown + navy blue + burgundy | yellowed paper, gradient laser backdrop, diffused flash, serif italic |

**Usage:** Embed the three-column keywords from the style row into the `{style_mood}` position in the prompt skeleton. Decorative details (divider patterns, punch holes, lanyards, stickers, icons) are freely combined by the AI based on **style tone + user identity** — developers can use code elements, musicians can use musical notes, photographers can use lens apertures. Every generation should be unique; do not apply a fixed template.

### Card Info Area Must Include

```
{name}
{role}
{org} (if applicable)
{location} — EST. {est_year}
```

`{alias}` appears on the side strip. `{org}` is optional; omit if the user didn't provide it.

---

## 11. swap-bg · One-Sentence Background Swap

**Trigger:** 换背景 (swap background)、改背景 (change background)、换个背景 (change the background)、把背景换成 (change background to)
**Reads:** User's photo (required)
**Ratio:** Keep original aspect ratio | **Reference image:** User's photo passed as reference
**Command:** `meitu image-edit`
**Recommended styles:** 霓虹雨夜、星空、梦境

**Zero-config entry point:** This is the simplest way to get started — user sends a photo + one sentence describing the desired background, instant result.

**Flow:**
1. User sends photo + describes target background (e.g., "change to cyberpunk city")
2. Use `image-edit` directly, passing the original image + prompt describing the background swap:
   ```bash
   meitu image-edit --image [user photo] --prompt "Keep the person exactly the same, change only the background to [user's described background]" --json
   ```
3. Prompt key requirement: **must explicitly say "keep the person exactly the same"**, otherwise the person will also be modified

**Style directions:**
- **A. Scene replacement** — Real locations (Paris streets, Tokyo Shibuya, Iceland aurora)
- **B. Stylized** — Artistic styles (cyberpunk, pastoral watercolor animation, ink wash animation)
- **C. Concept scene** — Surreal scenes (space station, underwater, miniature world)

**When user doesn't specify a background:** Read memory and infer an interesting scene. For example, if user was chatting about a Japan trip today → "Tokyo streets".

---

## 12. style-remix · One-Click Style Remix

**Trigger:** 一键换风格 (one-click style remix)、换风格 (change style)、风格万花筒 (style kaleidoscope)、一图多风格 (one image multiple styles)
**Reads:** User's photo or the last generated image
**Ratio:** Keep original aspect ratio | **Reference:** `references/style-library.md`

**Core value:** One photo, see N possibilities of yourself.

**Flow:**
1. Confirm source image (user's or the last generated one)
2. Let user choose style combinations, or use the default set:
   ```
   Default: 4 styles (maximum diversity):
   盒装手办 + 动漫肖像 + 水墨动画 + 赛博朋克
   ```
3. User can also specify: "give me 盒装手办 + 田园水彩动画 + 黏土动画"
4. Generate one image for each style
5. Label each image with its style name when delivering

**Command selection:**
- Stylization (cartoon/figure/anime/art) → `meitu image-edit --model nougat --image [source] --prompt "..."`
- Scene replacement (cyberpunk/neon rain/starscape etc.) → `meitu image-generate --image [source] --prompt "..."`

**Prompt assembly:** Get the corresponding style keywords from `references/style-library.md` (pick 1-2), embed into narrative:
```
[subject/person description from source image], [style keywords], [lighting/texture supplement]
```

**Default style combination (4 styles, maximum diversity):**

| # | Style | Category | Command |
|------|------|------|------|
| 1 | 盒装手办 | Toy/collectible | `image-edit --model nougat` |
| 2 | 动漫肖像 | Illustration | `image-edit --model nougat` |
| 3 | 水墨动画 | Art | `image-edit --model nougat` |
| 4 | 赛博朋克 | Scene | `image-generate` |

Users can choose any combination from the 20+ styles in style-library.md.

**Post-delivery prompt:**
> "Which style do you like? You can use that style for more — avatars, miniature scenes, ID cards, all possible."

---

## 13. avatar-series · Avatar Series

**Trigger:** 头像系列 (avatar series)、换头像 (change avatar)、帮我换个头像 (help me change avatar)、做一套头像 (make a set of avatars)
**Reads:** ./visual/assets/references/user.jpg (if exists), ./visual/config/defaults.yaml
**Ratio:** 1:1 | **Reference image:** Include if available; text-to-image if not
**Command:** `meitu image-generate` + `meitu image-face-swap`
**Recommended styles:** 潮玩公仔、动漫肖像、杂志封面、田园水彩动画、黏土动画

**Core value:** One face, N styles — user picks one as their avatar.

**Flow:**
1. With reference image: generate multi-style versions based on the real photo
2. Without reference image: generate based on `key_features` text description
3. Default: 4 styles; user can request more

**Default 4 styles:**

| Style | Method | Description |
|------|------|------|
| Trendy blind box | `image-generate` | 3D trendy character, IP feel |
| Anime avatar | `image-generate` + `image-face-swap --head_image_url [user's real face photo] --sence_image_url [generated styled avatar] --prompt "description" --json` | Japanese anime style, preserving facial features |
| Magazine portrait | `image-generate` | Realistic texture, magazine cover lighting |
| Pastoral watercolor animation | `image-generate` | Hand-painted watercolor animation, warm tones, fresh and natural |
| Clay animation | `image-generate` | Stop-motion clay texture, fingerprint details, handcrafted warmth |

**Prompt template with reference image:**
```
Using reference image, [style description]. Portrait composition, 1:1 square format, centered face, [gender] with [key_features].
```

**Without reference image:** Build character description using `key_features`, go with text-to-image.

**Post-delivery prompt:**
> "Pick one as your avatar? If you like a style, I can generate more in that style."

---

## 14. to-video · Image to Video

**Trigger:** 动起来 (bring to life)、做成视频 (make into video)、图生视频 (image to video)、让它动 (make it move)、生成视频 (generate video)
**Command:** `meitu image-to-video`
**Input:** User's photo or the last generated image

**Note:** Async task; generates a 2-12 second short video; requires waiting.

**Flow:**
1. Confirm source image (user's or the last generated one)
2. Inform user: "Generating video, this may take 30-60 seconds..."
3. Assemble prompt (describe desired motion effects):
   ```
   Use narrative English to describe motion:
   - People: "The person slowly turns their head to the right and smiles, hair gently swaying in a light breeze"
   - Scenes: "Camera slowly pushes in, leaves drift across the frame, soft ambient light shifts"
   - Mood: "A gentle zoom out revealing the full scene, warm light gradually intensifies"
   ```
   **The prompt focuses on motion and changes; no need to re-describe the image content (the image already has it).**
4. Execute `meitu image-to-video --image [image path] --prompt "motion description" --video_duration [seconds] --json`
   - `--prompt`: Describe desired motion effects (required)
   - `--video_duration`: Video duration, 2-12 seconds (optional, default 5)
   - `--ratio`: Video aspect ratio (optional)
5. Poll and wait for task completion
6. Deliver video file

**Images suitable for video generation:** Those with character actions, natural scenes, or implied motion. Static text/infographics are not suitable.

**Post-delivery prompt:**
> "Video is ready. Want to try with a different image, or adjust the effect?"

---

## 15. motion-transfer · Motion Transfer

**Trigger:** 做这个动作 (do this motion)、动作迁移 (motion transfer)、让我跳这个舞 (make me do this dance)、模仿动作 (mimic motion)
**Command:** `meitu video-motion-transfer`
**Input:** Source video (motion source) + target image (person to perform the motion)

**Note:** Async task; requires waiting.

**Flow:**
1. User provides source video (containing the motion to transfer)
2. Confirm target image (user's photo or `./visual/assets/references/user.jpg`)
3. Inform user: "Generating, this may take 1-2 minutes..."
4. Execute `meitu video-motion-transfer --image_url [target image] --video_url [source video] --prompt "description" --json`
5. Poll and wait for task completion
6. Deliver video

**When user sends only a video without specifying whose face:** Automatically use `./visual/assets/references/user.jpg`; if unavailable, ask user to send a photo.

---

## 16. virtual-tryon · Virtual Try-On

**Trigger:** 试穿 (try on)、试衣 (try clothes)、穿上这件 (put this on)、这件衣服穿上什么样 (what would this look like on me)
**Command:** `meitu image-try-on`
**Input:** Person photo + clothing photo

**Flow:**
1. Confirm person photo (user's or `./visual/assets/references/user.jpg`)
2. Confirm clothing photo (user must provide)
3. Execute `meitu image-try-on --clothes_image_url [clothing image] --person_image_url [person image] --replace [body part] --json`
   - `--replace` options: `upper` (top) / `lower` (bottom) / `dress` (dress) / `coat` (coat) / `jumpsuit` (jumpsuit) / `full` (full body) / `unknown` (auto-detect)
4. Deliver try-on result image

**When user sends only a clothing image:** Automatically use `./visual/assets/references/user.jpg` as the person image; if unavailable, ask user to send a full-body photo.

**Post-delivery prompt:**
> "Try-on result is ready. Want to try a different angle, or try another piece?"

---

## 17. beauty · Portrait Beauty Enhance

**Trigger:** 美颜 (beauty enhance)、磨皮 (skin smoothing)、帮我修一下 (touch me up)、皮肤好一点 (better skin)
**Reads:** None (zero read)
**Command:** `meitu image-beauty-enhance`
**Input:** User's photo (required, single person only)

**Zero-barrier entry point:** Send a selfie + "touch up my photo", instant result.

**Flow:**
1. Confirm source image (user's; must be a single-person photo)
2. Determine beauty intensity:
   - User says "keep it natural" / "light" → `--beatify_type 0` (natural, default)
   - User says "go heavy" / "max it out" → `--beatify_type 1` (heavy)
   - User says nothing → default to natural (0)
3. Execute `meitu image-beauty-enhance --image [image path] --beatify_type [0/1] --json`
4. Deliver the enhanced photo

**Note:** Single-person photos only. Multi-person group photos will fail; prompt user to send a single-person photo.

**Post-delivery prompt:**
> "Beauty enhancement complete. Want to try a different style?"

**Common combinations:**
- Beauty enhance → `image-edit --model nougat` → stylize after enhancing
