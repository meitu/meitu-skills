---
name: article-to-cover
description: "Generates structured poster design specs and AI-ready prompts from long-form text, conversations, or design briefs. Supports two modes: creative planning from scratch (no reference image) and reference-based washing/mimicry reconstruction."
---

# article-to-cover

## Overview

Art-director-level poster design skill. Analyzes text input, anchors style direction, plans visual hierarchy, and outputs structured AI generation instructions. Two modes: creative direction from scratch (no reference image), or reference-image-based reconstruction/mimicry.

## Dependencies

- engine: meitu-tools
- user data: ~/.openclaw/visual/

## Core Workflow

### Step 1: Load Context

1. **Analyze user input** — Read the provided text (article, chat transcript, or design brief). Synthesize core message into headline + subtitle candidates.
2. **User preferences** — If `~/.openclaw/visual/memory/global.md` exists, read for style preferences. If `contexts/poster.md` exists, read for poster-specific preferences.
3. **Experience log** — If `~/.openclaw/visual/journal/knowledge.yaml` exists, scan for entries related to this industry or similar tasks.
4. **Brand assets** — If user specifies a brand, read `~/.openclaw/visual/assets/brands/{brand}/`:
   - Brand tone, personality, market positioning
   - Color system (primary 60–70%, secondary 20–30%, accent 5–10%)
   - Logo file and usage specs
   - Derivative graphics if available

### Step 2: Route — Determine Scenario

- **User provides reference image** → go to **Step 3B: Poster Analyse**
- **No reference image** (text/brief only) → go to **Step 3A: Creative Direction**

---

### Step 3A: Creative Direction (No Reference Image)

Read [references/design-constraints.md](references/design-constraints.md) for hard rules (logo, human diversity, negative lexicon, medium-type). These apply to all output.

#### 3A.1: Classify Brand Information Level

| Level | User provides | Action |
|-------|--------------|--------|
| B1 | Brand tone + color system | Anchor on tone and colors |
| B2 | Tone + colors + logo | Additionally analyze logo for visual linkage opportunities |
| Basic | No brand assets | Extract temperament from text, use industry mapping for color |
| Franchise | References a well-known IP (Harry Potter, Marvel, etc.) | Lock franchise visual DNA as style anchor, skip industry mapping |

#### 3A.2: Identify Industry + Market

**Industry identification** — Read [references/industry-styles.md](references/industry-styles.md) for the mapping table:
1. Match industry keywords from text content (food, fitness, finance, etc.)
2. Validate via semantic analysis: core nouns, core verbs, usage scenarios
3. If brand info exists, infer industry from brand attributes
4. Output: primary industry + core semantic features (B2B/B2C, audience, emotional tone, scenario)
5. If industry not in library → follow Unknown Industry Handling in same file

**Market identification** — Based on input language, cultural cues (currency, date format, festivals), brand origin:
- Output: target market (North America / Europe / Latin America / Asia Pacific) + cultural sensitivity requirements

#### 3A.3: Determine Medium Type

Follow illustration trigger rules strictly from [references/design-constraints.md](references/design-constraints.md):
- **Illustration allowed ONLY if**: user explicitly requests it, reference images are illustration-style, or user specifies illustration keywords
- **Otherwise**: must use Photography / Vector Graphic / 3D Rendering
- Apply negative lexicon: ban watercolor, line art, etching, hand-drawn terms
- Record medium type internally (do not show user)

#### 3A.4: Anchor Style

1. User provided brand logo → anchor on logo temperament, explore adjacent aesthetics within same visual school
2. User specified style keywords → anchor on that style, explore adjacent range
3. No style guidance → use industry auto-mapping from [references/industry-styles.md](references/industry-styles.md), select highest-matching style
4. For the 6 special industries (primary school, university, medical, nonprofit, finance, rental) → apply mandatory layout rules from industry-styles.md

Validate: visual clarity, emotional resonance, brand fit, execution feasibility, style–visual binding.

#### 3A.5: Creative Ideation + Deepening

Read [references/creative-framework.md](references/creative-framework.md) for the full creative methodology. Execute in order:

1. **Deconstruct brief** — Identify core assets and constraints (text, brand, imagery, layout)
2. **Style + element matching** — Combine industry core subjects (coffee → machine/cup; beauty → products/brushes) with style signature elements to build visual scene
3. **Concept expansion** — Avoid clichés; seek metaphorical visual expressions; balance metaphor with clarity; apply contrast, white space, rhythm, hierarchy, visual metaphor
4. **World-building** — Typography as design protagonist or deep graphic interaction; scene construction from classic style scenarios
5. **If Franchise** — Lock franchise visual DNA, label directions as "IP Name + Core Style – Variant", include franchise signature elements in core visual
6. **Deepen** — If logo exists → deep graphic analysis (shape derivation: literalization / negative space / repetitive composition). Elaborate visual intention (composition + color + lighting → narrative + emotion). Apply Swiss International Style for layout system.
7. **Translate to AI instructions** — Convert all artistic concepts to production instructions with style catalysts (era / medium texture / emotional aesthetics keywords)

#### 3A.6: Output

Generate structured output following Scenario 1 format in [references/output-formats.md](references/output-formats.md):
- Design Direction with style name
- Core Visual (must include: style signature elements + industry core subject + stylized scene)
- Visual Elements (subject & environment, lighting & atmosphere, color language, composition & camera)
- Layout & Typography (typography concept, layout strategy with information hierarchy, text–image relationship)
- Overview (style + one-sentence summary of strongest visual scene)
- AI Production Instructions (JSON with project_manifest, visual_style_system, scene_elements, typography_layout, ai_generation_prompts)

**Quality check before output:**
- Output language matches user input language
- Strong binding between style name and all visual/layout/typography modules
- Core visual contains all three required elements
- Total colors ≤ 3 (excluding grayscale), body text contrast ≥ 4.5:1

---

### Step 3B: Poster Analyse (With Reference Image)

Read [references/design-constraints.md](references/design-constraints.md) for hard rules. Read [references/poster-analyse.md](references/poster-analyse.md) for the full analysis methodology.

#### 3B.1: Intent Routing (Priority 1 > 2 > 3)

1. **Explicit commands** — "like this image" / "keep layout" / "series" → **Mimicry**; "redesign" / "refer to vibe" / "optimize" → **Washing**
2. **Implicit scenarios** — Content swap only ("replace person with cat", "change title") → **Mimicry**; Extract attribute for new carrier ("use this color scheme for something else") → **Washing**
3. **Ambiguity default** — Reference image + simple keywords only → **Washing** (provide upgraded scheme, not copy-paste)

#### 3B.2: Reverse-Engineer Reference Image

Extract comprehensive visual DNA:
- **Style/medium** — Physical texture only (e.g., "3D render", "Risograph"). Strictly forbidden to describe specific objects.
- **Layout** — Grid structure, composition logic, reading path
- **Font form** — Case (ALL CAPS / Title Case / lowercase), arrangement (stacked / curved / scattered)
- **Brush stroke** — Precise medium description (chalk texture, gouache dry brush, vector gradient), never generic "illustration"
- **Detail insight** — If no facial features → add "faceless character, blank face" to prompt and "eyes, nose, mouth" to negative
- **Vector/stroke** — Distinguish "flat vector, lineless, clean edges" vs "outlined, ink stroke"; if no strokes → emphasize "no outlines"

#### 3B.3: Extract Soul Anchor (Washing mode only)

Identify the single most irreplaceable, highest-design-value element:

| Anchor type | Trigger | Action |
|-------------|---------|--------|
| Typography | Font is highly distinctive (liquid, 3D inflated) | Lock font style → reconstruct layout + color |
| Layout | Grid is highly distinctive (deconstructionism, special segmentation) | Lock layout framework → reconstruct font + color |
| Vibe | Light/shadow or medium is highly distinctive (film grain, acid light) | Lock physical texture → reconstruct layout + font |

#### 3B.4: Deep Thinking

1. **Image-text layout** — Brainstorm 6 options, select 1 distinctly different from reference
2. **Main visual** — Use user description if provided; otherwise deduce from theme
3. **Text** — Use user copy verbatim (modification strictly forbidden); if none, deduce from theme
4. **Color**:
   - **Mimicry** → follow reference colors
   - **Washing** → execute Hue Cleansing: forbidden to reuse reference main hue; retain color relationship but replace hue (black+gold → white+chrome; high-sat red+blue → high-sat purple+green)

#### 3B.5: Reconstruct

**Mimicry mode**: Style 100% locked. Redraw composition for new content. For text changes: identify original title A, confirm user's new copy B, output instruction "change text '[A]' to text '[B]'".

**Washing mode**:
- **Coordinate Reset** — Detect reference composition logic, select opposing logic:
  - Symmetrical → negative space / diagonal / scattered
  - Flat/front view → top-down / bottom-up / 3D / fisheye
  - Real-scene photo → macro close-up / partial crop / out-of-focus
- **Hue Cleansing** — New colors must differ ≥ 90° on color wheel from reference
- Abandon reference grid completely. Build new reading path from user copy hierarchy.

#### 3B.6: Self-Correction Protocol

Before outputting, verify:
1. **Color check** — Does new palette overlap reference main hue? If yes + no user brand color specified → enforce color inversion or complementary color
2. **Layout check** (Washing only) — Has layout been re-planned? If not → re-plan
3. If any check fails → roll back and re-plan. Do not output failed result.

#### 3B.7: Output

Generate JSON following Scenario 2 format in [references/output-formats.md](references/output-formats.md):
- `mission_logic` — intent + soul extraction reasoning
- `design_blueprint` — reconstructed concept, style, color, layout, typography, composition, detected mode
- `content_firewall` — discarded reference objects + unlocked features
- `prompt` — Final English prompt: `[New Color]::3 + [concept]::2 + [anchor] + [mutations]. --no [ignored] --iw 0.5`

---

### Step 4: Generate Image via meitu-tools skill

1. Extract prompt from Step 3A JSON (`ai_generation_prompts.primary_prompt`) or Step 3B JSON (`prompt`)
2. Determine dimensions from design spec or user requirements (default: 1080×1350 portrait poster)
3. Run:
   ```bash
   node "{baseDir}/../meitu-tools/scripts/run_command.js" \
     --command "image-generate" \
     --input-json '{"prompt":"{prompt}","size":"{width}x{height}"}'
   ```
4. If generation fails:
   - Retry at most 2 times with adjusted prompt.
   - If still failed, stop retrying and surface structured error fields from meitu-tools (`error_type`, `user_hint`, `next_action`, `action_url`) to user directly.

### Step 5: Compliance Check

1. **Brand** — Logo placement matches rules, colors accurate, tone consistent
2. **Platform** — If target platform specified, read `~/.openclaw/visual/rules/platforms/{platform}.yaml` for size/format requirements
3. **Content safety** — Human diversity rules, no incomplete bodies, max 3 people in scene
4. **Readability** — Body text contrast ≥ 4.5:1, total colors ≤ 3 (excluding grayscale)

### Step 6: Record to Journal

1. Append task entry to `~/.openclaw/visual/journal/entries/` with: date, input summary, style direction chosen, output path, key decisions
2. Ask user: "Do you want to record this design experience into the knowledge base?" If yes → update `~/.openclaw/visual/journal/knowledge.yaml`

## Output

- Structured design specification (markdown + JSON)
- Generated poster image(s) via meitu-tools
- Journal entry (if user opts in)
