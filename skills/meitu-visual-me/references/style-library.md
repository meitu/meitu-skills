# Style Quick Reference Library

Provides style keywords and constraints only; prompts are assembled live by the AI based on user memories, daily state, and personal profile.

**Do not copy templates verbatim.** Every generation should be unique.

---

## Assembly Rules

1. **Start from user context, not from style.** First think "what happened to this person today," then think "what style can express that."
2. **Use only 1-2 style keywords.** The keywords in the table below are style anchors, not the entire prompt.
3. **Narrative > keywords.** Describe the scene in complete sentences and weave style keywords naturally into the narrative, rather than stacking them at the end.
4. **Include user-specific details.** Extract concrete events, objects, and scenes from memory/profile to make the image belong to this person alone.
5. **Change the angle every time.** For the same style, composition, scene, mood, and lighting should be different each time.
6. **Use positive descriptions instead of negation.** Don't use `no cars`, use `empty street`; don't use `no clutter`, use `clean background`.
7. **Be specific about lens and lighting.** Use `85mm f/1.4` instead of `portrait lens`; use `single key light 45° from left` instead of `good lighting`.

**Bad example (forbidden):**
> ~~woman, dress, red background, fashion, 8K, masterpiece, best quality~~ ← keyword stacking, no personality

**Good example:**
> A toy box sitting on a convenience store shelf, inside is a tiny figure of a mass communication graduate holding a coffee and three phones, the box label reads "CHAOS MANAGER — batteries not included", warm fluorescent store lighting spilling through the plastic window

---

## Prompt 7 Elements

When writing a prompt, think in this order (not all are required; select based on the scenario):

| Element | Purpose | Example |
|------|------|---------|
| Subject | Who/what | `a young man in an oversized denim jacket` |
| Scene | Where | `on a rooftop garden overlooking the city at dusk` |
| Lens | Visual feel | `shot at 35mm, wide composition with foreground depth` |
| Lighting | Atmosphere | `golden backlight filtering through leaves, soft fill from below` |
| Material | Texture | `matte ceramic`, `worn leather`, `frosted glass` |
| Color tone | Mood | `desaturated earth tones with a single pop of amber` |
| User details | Personalization | `[items/events extracted from memory/今日.md]` |

---

## Style Keyword Table

### Realistic & Photography

| Style | Trigger words | Keywords (pick 1-2 to embed in narrative) |
|------|--------|--------------------------|
| Magazine cover | 杂志封面、时尚大片 | `editorial stance against a muted backdrop`, `typography-ready negative space at top third`, `medium-format shallow focus rendering skin and fabric in parallel sharpness` |
| Movie poster | 电影海报、海报风 | `wide anamorphic framing with atmospheric haze between subject and background`, `teal-and-amber split-tone grading`, `metallic display type anchored to the lower edge` |
| Vintage polaroid | 拍立得、宝丽来 | `slightly tilted instant-camera crop with a creamy white border`, `sun-bleached color shift leaning warm`, `a handwritten date scratched into the margin` |
| Retro yearbook photo | 年鉴照、复古证件照 | `head-and-shoulders framing against a gradient laser backdrop`, `diffused on-camera flash flattening the shadows`, `early-90s school portrait color science` |
| Street candid | 街拍、抓拍感 | `slightly off-center composition as if caught mid-stride`, `ambient city light mixing warm tungsten and cool LED`, `a hint of motion blur on the periphery` |
| Product photography | 商品照、产品图 | `centered on an infinite white sweep`, `three-axis softbox setup erasing hard shadows`, `every surface reflection and material grain rendered at macro clarity` |
| Film-style life | 胶片、日系 | `35mm warm-tone film color palette with lifted shadows and muted highlights`, `naturalistic available-light exposure`, `grain that sits in the midtones like fine sand` |
| Documentary portrait | 纪实、故事感 | `environmental portrait with the subject's workspace filling the background`, `single overhead practical lamp as key light`, `weathered textures on both the person and their surroundings` |

### Toy & 3D

| Style | Trigger words | Keywords (pick 1-2 to embed in narrative) |
|------|--------|--------------------------|
| Boxed figure | 手办盒、盒装手办 | `a sealed retail blister pack with a transparent window`, `the figure inside posed against a printed cardboard insert`, `overhead store lighting catching the plastic film` |
| Chibi figure | Q版、大头娃娃 | `a squat figure with a head-to-body ratio of three-to-one`, `standing on a tiny diorama pedestal`, `candy-colored matte vinyl finish` |
| Designer toy | 公仔、盲盒人偶 | `smooth glossy ABS shell with rounded seams`, `stitched-dot eyes and a minimal expression`, `sitting on a clear acrylic riser under warm display lighting` |
| Building blocks | 积木、拼搭风 | `a blocky toy figure built from colorful interlocking plastic bricks`, `the entire scene constructed from snap-together building blocks`, `slightly scuffed plastic texture from play wear` |
| Plush doll | 毛绒、绒毛风 | `a plush doll with an oversized head and stubby velour limbs`, `embroidered dot eyes and a stitched smile`, `neutral linen backdrop with soft even lighting from above` |
| Clay animation | 黏土、定格动画 | `the subject sculpted in soft clay with visible fingerprint texture on the surface`, `stop-motion animation aesthetic with slightly imperfect edges`, `warm studio lighting revealing the handmade plasticine details` |

### Illustration & Art

| Style | Trigger words | Keywords (pick 1-2 to embed in narrative) |
|------|--------|--------------------------|
| Pop art | 波普、丝网印刷风 | `four-panel grid each in a different saturated hue`, `heavy black outlines and halftone dot shading`, `screen-print registration marks slightly offset` |
| Anime portrait | 动漫、二次元 | `clean cel-shaded lines with luminous highlight spots on the hair`, `oversized eyes reflecting a window-shaped catchlight`, `a pastel gradient sky bleeding into the background` |
| Caricature | 漫画、夸张画 | `exaggerated proportions blowing up the subject's most recognizable feature`, `loose ink-wash strokes`, `surrounded by floating objects from their daily life` |
| Ink wash animation | 水墨、国风、水墨动画 | `Chinese ink-wash animation style with flowing ink gradations from heavy black to translucent gray`, `bright ambient lighting with realistic fur and fabric textures rendered in ink`, `narrative composition implying a story unfolding, generous white space balancing the scene` |
| Flat illustration | 扁平、手账风 | `geometric flat-fill shapes with no outlines`, `a limited five-color palette drawn from the scene itself`, `hand-lettered captions tucked into corners` |
| Pastoral watercolor animation | 田园动画、手绘水彩动画 | `hand-painted watercolor animation aesthetic with soft luminous skies and layered clouds`, `delicate linework and warm pastoral color palette`, `a gentle breeze implied through flowing hair and swaying grass` |

### Scene & Atmosphere

| Style | Trigger words | Keywords (pick 1-2 to embed in narrative) |
|------|--------|--------------------------|
| Neon rain night | 霓虹雨、赛博雨夜 | `a slick wet alley reflecting a spectrum of signage`, `volumetric mist catching neon spill at knee height`, `shallow focus keeping only the subject sharp against blurred streaks` |
| Miniature world | 微缩、小人国 | `a tilt-shift perspective compressing depth into a toy-like band of focus`, `the subject miniaturized among oversized everyday objects`, `warm incandescent desktop lamp as the sun` |
| Dreamscape | 梦幻、超现实 | `gravity-defiant objects drifting around the subject`, `a soft chromatic halo bleeding at the edges`, `contradictory scale — enormous flowers beside tiny buildings` |
| Starscape | 星空、宇宙 | `the subject silhouetted against a deep-field starscape`, `nebula colors tinting the rim light on hair and shoulders`, `a sense of vast quiet distance` |
| Cyberpunk | 赛博、未来城市 | `dense vertical cityscape with holographic billboard overlays`, `a teal-and-magenta color split dividing the frame`, `rain-slicked chrome surfaces doubling every light source` |

### Typography-Oriented

The following styles require rendering text in the image; wrap the text to display in double quotes within the prompt:

| Style | Trigger words | Keywords |
|------|--------|--------|
| Info card | 今日卡、数据卡 | `clean infographic layout with large display numerals`, `a data-viz accent strip along one edge`, `city name set in a geometric sans-serif` |
| ID collectible card | ID 卡、身份卡 | `a portrait inset occupying the upper two-thirds`, `monospaced metadata fields at the bottom`, `a holographic foil accent strip across the card edge` |
| Postcard | 明信片、旅行卡 | `a stamp-sized inset photo in one corner`, `a handwritten-style message area`, `torn-edge paper texture on the border` |

---

## Style Matching Guide

When the user hasn't specified a style, **automatically match the most suitable style based on the user's daily content, mood, and scenario**; do not pick randomly or default to the first one.

| User content/mood | Recommended style | Why |
|-------------|---------|--------|
| Healing, nature, slow life, warm memories, quiet day | 田园水彩动画 | Watercolor texture is a natural fit for gentle storytelling |
| Funny, crafty, creative, childlike, relaxed daily life | 黏土动画 | Handcrafted feel and imperfect edges carry inherent humor |
| Busy, multitasking, work scene, complicated day | 微缩世界 | Overhead tiny world implies a sense of "seeing the full picture" |
| Sense of achievement, milestone, self-expression, cool things | 盒装手办 | Display case = worthy of being collected |
| Tech, overtime, nighttime, futuristic, high-intensity | 赛博朋克 | Neon + dark tones match high-energy nighttime scenarios |
| Contemplation, solitude, literary, poetic, Eastern aesthetics | 水墨动画 | White space and narrative flow suit introspective moments |
| Loneliness, city wandering, late night, emotional | 霓虹雨夜 | Wet reflections of light = emotions externalized |
| Passionate, excited, social, anime-related | 动漫肖像 | Big-eye highlights = energy |
| Nostalgia, old friends, old photos, a specific moment | 复古拍立得 | Instant snapshot = time capsule |
| Dreams, fantasy, unrealistic wishes | 梦境 | Surrealism = unbound by reality |
| Trendy, street culture, outfits, attitude | 潮玩公仔 | ABS shell + minimal expression = cool |
| Sarcasm, roast, absurdist, dark humor | 波普艺术 | Repetition + high saturation = consumerism deconstruction |
| Childlike play, assembly, DIY, pixelated, toy feel | 积木拼搭 | Block structure = the joy of hands-on creation |

**Matching principles:**
1. Start from what the user said and what they did today; find emotional keywords
2. If multiple styles fit, choose the one the user **hasn't used recently** (avoid repetition)
3. If truly indeterminate, fall back to the first style in that workflow's recommended list

---

## Text Rendering Notes

- Wrap text to display in **double quotes**: `a card with the title "你好世界"`
- **In-image text language follows the user's conversation language**: user speaks Chinese → image text in Chinese; user speaks English → in English. Do not generate English image text during Chinese conversations
- Keep Chinese text within **8 characters**; longer text is error-prone
- Specify font style: `bold geometric sans-serif`, `hand-brushed script`, `monospaced terminal font`
- Specify text position: `anchored to the top center`, `running along the bottom edge`

---

## Avoiding Common Image Issues (Positive Phrasing)

| Want to avoid | Positive phrasing |
|--------|---------|
| Blurry | `tack-sharp across the focal plane` |
| Extra limbs | `anatomically correct natural proportions` |
| Distorted hands | `relaxed hands with clearly separated fingers` |
| Cluttered background | `clean single-tone backdrop` |
| Over-saturated | `restrained natural color palette` |
| Not sharp enough | `fine surface detail visible at full resolution` |
