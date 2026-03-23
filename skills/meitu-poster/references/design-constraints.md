# Design Constraints

Hard rules that apply to ALL poster generation. Load unconditionally at start of every task.

## Contents
- [Restoration Consistency Checklist](#restoration-consistency-checklist)
- [Logo Rules](#logo-rules-hard-constraints-for-brand-state)
- [Human Diversity Constraints](#human-diversity-constraints)
- [Medium-Type Determination](#medium-type-determination)
- [Negative Lexicon](#negative-lexicon-mandatory-prohibitions)

---

## Restoration Consistency Checklist

In any generation, replication, replacement, or multi-image fusion task:

1. **Lock core subject type** — Immediately select ONE from: Person / Object / Logo / Animal. Switching or mixing after lock is prohibited.
2. **Subdivide and quantify** — Record all identifiable design details item by item:
   - Overall aspect ratio, key structural points, corner shapes, symmetry
   - Material types, thickness, transparency, reflectivity, surface treatment
   - Primary/secondary colors and tones, patterns
   - Textual content, font structures, stroke thickness, spacing ratios
3. **Compile 100% restoration checklist** — This is an immutable hard constraint.
4. **Parse user text (UTOL)** — Extract all explicit requirements (subject type, perspective, proportions, colors, actions, background, deformation).
5. **Priority order**: UTOL > 100% Restoration Checklist > Model Inference. UTOL wins unconditionally on conflict.
6. **Prohibitions once locked**:
   - No adjusting proportions, structural points, or local compositions
   - No switching material types or physical properties
   - No automatic optimization based on aesthetics, plausibility, or brand tone
   - No adding unrecorded elements, deleting locked elements, inferring invisible structures
   - No automatic beautification, alignment, or cross-version fusion
7. **Required output**: Core subject lock result + UTOL (if present) + 100% Restoration Checklist + Consistency confirmation. If any condition cannot be met → terminate generation and explain. Self-completion or assumptions prohibited.

---

## Logo Rules (Hard Constraints for Brand State)

Applies when user requirement includes "hasLogo":

**Layout:**
- Default placement: top-left. May adjust to top-right / top-center / bottom-center if needed.
- Occupies 2–3% of canvas. Must not overlap text information.
- Only the first user-uploaded logo may be used.
- Brand logo must appear. Adding, deleting, deforming, or modifying logo form is prohibited.
- Logo must integrate naturally with poster and maintain sufficient background contrast.

**Color:**
- Logo must never be recolored or have effects added (no shadows, strokes, gradients).
- Only proportional scaling and safe margins allowed.
- If contrast insufficient → switch to neutral background or add protective frame. Do not modify logo.
- Brand primary/secondary colors take priority over reference/source images.
- Style adjusts proportion and usage, not the colors themselves:
  - Minimal/high-end → low proportion, large white space
  - Retro/warm → higher proportion, allows texture
  - Youthful/energetic → high-saturation blocks, dynamic elements
- When event colors conflict with brand hues → event colors take priority, brand colors become accent, logo unchanged.

---

## Human Diversity Constraints

When human scenes appear in the poster:

- Inclusive representation of ethnic diversity
- Balanced ethnic diversity without stereotypes
- Multicultural but neutral representation
- Avoid caricature or exaggerated ethnic features
- Natural everyday look for all ethnicities
- Integrity of human figures: prohibited from incomplete bodies (headless, deformed, missing limbs, etc.)
- No more than 3 people in multi-person scenes

---

## Medium-Type Determination

### Illustration Trigger Conditions (Strict)

Illustration is allowed ONLY when:
1. User explicitly inputs "插画 / illustration / hand-drawn / cartoon / comic"
2. Provided reference images are identified as illustrations (non-photographic, obvious brush strokes, hand-drawn characteristics)
3. User specifies illustration style keywords

### Decision Tree

```
IF illustration trigger = TRUE:
    → Illustration styles allowed (Cartoon Pop Art / Naïve Illustration / Handcrafted Textured Illustration)
    → Watercolor/line-based media allowed
ELSE:
    → Must use one of:
        - Photography (product / scene / portrait)
        - Vector Graphic (vector / geometric / flat design)
        - 3D Rendering (3D render / modeling)
    → BANNED terms: see Negative Lexicon below
```

Record medium type internally for quality checks. Do NOT show medium type to user in final output.

---

## Negative Lexicon (Mandatory Prohibitions)

### Prohibited Medium Terms (when illustration NOT triggered)

- watercolor, watercolour, water color, 水彩, 水粉, 粉彩
- line art, outline, stroke-only, 线稿, 描边, 轮廓
- etching, 蚀刻, 版画
- hand-drawn illustration, 手绘插画 (as visual medium)
- brush stroke, painterly, gouache

### Low-Quality Element Prohibitions (always)

- sticker, 贴纸, 表情包
- clip art, 剪贴画
- generic gradient, 通用渐变
- noise filter, 噪点滤镜
- template border, 模板边框
- cartoon emoji, 卡通表情

### Outdated-Feel Prohibitions (always)

> **注意区分：** 以下词汇禁止在 prompt 中用于传达"旧感/老旧"；复合风格流派名（如 "New American Retro"）中的 Retro 作为特定美学流派标识，不受此限。

- vintage, classic, 复古, 怀旧, 老式, 旧式, 传统, 古早, 年代感
