# Poster Analyse (Scenario 2)

Detailed methodology for reference-image-based poster reconstruction (Washing) or stylistic mimicry (Mimicry).

Supreme principle: No matter how reconstruction is carried out, the final output must possess Art Director-level sophistication and order. Strictly forbidden to produce low-quality images with messy composition and cluttered elements.

## Contents
- [Step 0: Intent Routing](#step-0-intent-routing-intent-logic-gate)
- [Step 1: Reverse-Engineer Reference Image](#step-1-reverse-engineer-reference-image)
- [Step 2: Soul Anchor Extraction](#step-2-soul-anchor-extraction-washing-mode-only)
- [Step 3: Deep Thinking](#step-3-deep-thinking)
- [Step 4: Reconstruction](#step-4-reconstruction)
- [Step 5: Self-Correction Protocol](#step-5-self-correction-protocol)

---

## Step 0: Intent Routing (Intent Logic Gate)

Analyze the user's subtext — do not focus only on superficial keywords. Analyze the relationship between reference image and new requirements. Execute in priority order:

### Judgment 1: Explicit Command Lock

| Mode | Trigger words | Examples |
|------|--------------|---------|
| **Mimicry** | replicate, like this, keep layout, only modify text, series, keep original appearance | "Do not change the layout", "Make a series" |
| **Washing** | redesign, change layout, refer to vibe, optimize, inspire | "Redesign this", "I like this feel, make something new" |

If hit → lock directly. If not → proceed to Judgment 2.

### Judgment 2: Implicit Scenario Deduction

**Scenario A: Content Swap → Mimicry**
- User only proposes content/subject change without mentioning structural or stylistic changes
- Examples: "Replace the person with a cat", "Make identical but for selling shoes", "Change title to Happy New Year"
- Logic: User wants to retain original design framework

**Scenario B: Vibe Reference → Washing**
- User extracts a certain attribute (color/style) but applies to completely new carrier or size
- Examples: "Create new poster with this color scheme", "I like this tech feel, design something else", "Use this style for a horizontal version"

### Judgment 3: Ambiguity Default → Washing

- When: Only reference image + simple keywords (e.g., "coffee", "Mid-Autumn Festival")
- Reason: As senior designer, when demand is ambiguous, provide trendy upgraded scheme based on reference style instead of simple copy-paste

---

## Step 1: Reverse-Engineer Reference Image

Extract the following JSON structure from the reference image:

```json
{
  "reverse_engineering": {
    "style_medium": "Physical texture only (e.g., '3D render, metallic brushed surface'). Describe visual feeling, NOT specific objects.",
    "layout": {
      "grid": "Grid structure (e.g., '3-column asymmetric', 'centered single-subject')",
      "composition": "Composition logic (e.g., 'diagonal dynamic', 'symmetrical')",
      "reading_path": "Reading flow direction (e.g., 'top-left → center → bottom-right')"
    },
    "typography": {
      "case": "ALL CAPS | Title Case | lowercase | N/A (no text)",
      "arrangement": "stacked | curved | scattered | N/A"
    },
    "brush_stroke": "Precise medium description (e.g., 'chalk texture', 'gouache dry brush', 'vector gradient'). NEVER use generic 'illustration'.",
    "detail_insights": [
      "List all notable visual details.",
      "If no facial features → note 'faceless character' for prompt injection."
    ],
    "vector_stroke": "LINELESS_FLAT | BOLD_OUTLINED | N/A (non-vector)"
  }
}
```

### Field guidelines

- **style_medium** — Physical texture only (e.g., 3D render, Risograph, Matte Paper). Strictly forbidden to describe specific objects — only describe "visual feeling."
- **brush_stroke** — Precisely describe medium (chalk texture, gouache dry brush, vector gradient) instead of generic "illustration."
- **detail_insights** — If no facial features → add "faceless character, blank face" to prompt; add "eyes, nose, mouth, facial features" to negative prompt. Precisely capture all visual details.
- **vector_stroke** — Strictly distinguish between `flat vector illustration, lineless, clean edges` and `outlined illustration, ink stroke`. If no strokes in original → emphasize "no outlines" in prompt.

---

## Step 2: Soul Anchor Extraction (Washing mode only)

Identify the single "most irreplaceable and highest design value" advantage in the reference image. Define it as the Soul Anchor. This is compulsorily retained during Washing.

| Anchor | When to select | Lock | Reconstruct |
|--------|---------------|------|-------------|
| **Typography** | Font is highly distinctive (liquid chrome, 3D inflated, custom lettering) | Font style | Layout + color scheme |
| **Layout** | Grid is highly distinctive (deconstructionism, special segmentation, unique reading path) | Layout framework | Font + color scheme |
| **Vibe** | Light/shadow or medium is highly distinctive (film grain, acid light and shadow, unique physical texture) | Physical texture | Layout + font |

---

## Step 3: Deep Thinking

### Image-Text Layout
Brainstorm 6 ways of image-text layout. Select 1 that is distinctly different from the reference image.

### Main Visual
- If user requirements describe main visual content → use directly
- If not → deduce according to theme

### Text Information
- If user requirements contain copy → use directly (modification strictly forbidden)
- If not → deduce according to theme

### Color Scheme
**Mimicry mode**: Follow reference colors directly.

**Washing mode** — Execute Hue Cleansing:
- Strictly forbidden to follow main color of reference image
- Retain the "color relationship" (high contrast, analogous, macaron system) but replace the "hue"
- Examples:
  - Black & Gold → White & Chrome or Navy & Copper
  - High-sat red & blue → High-sat purple & green or acid yellow & black
- Purpose: New image must be completely different from original in color at thumbnail scale

---

## Step 4: Reconstruction

### Mimicry Mode

- Style is 100% locked. Composition is redrawn according to new content.
- Applicable when changing subject/scene (e.g., "Thanksgiving dinner table" → "Easter meadow")
- For text changes: identify main title A of reference, confirm user's new copy B. Output instruction: `change text '[A]' to text '[B]'`
- Proceed directly to output format.

### Washing Mode

**A. Coordinate Reset — Break layout similarity**

Detect reference composition logic and select opposing logic:

| Reference is | New design must be |
|-------------|-------------------|
| Centrally symmetrical | Negative space / diagonal division / scattered |
| Flat / front view | Top-down / bottom-up / 3D perspective / fisheye |
| Real-scene photography | Macro close-up / partial cropping / out-of-focus atmosphere |

Instruction: Abandon the reference grid completely. Build a new reading path from scratch based on user copy information hierarchy.

**Thinking path:**
1. What are the hierarchies of user's new copy? (e.g., 1 oversized title + 3 selling point icons)
2. Based on reference style, what is the best arrangement?
3. Build new reading path from copy hierarchy, not from reference layout.

**B. Hue Cleansing — Break color similarity**

Unless user specifies brand color, strictly forbidden to use reference main hue.

- Retain "color relationship" but replace "hue"
- New and old colors must differ by at least 90° on color wheel
- Purpose: Completely different color in thumbnail mode

---

## Step 5: Self-Correction Protocol

Execute before outputting JSON. If verification fails → roll back and re-plan.

### Color Check
- Does new `color_palette` overlap with reference main hue?
- If overlap exists AND user did not specify brand color → enforce color inversion or complementary color operation
- Ensure new/old colors differ ≥ 90° on color wheel

### Layout Check (Washing only)
- Has image layout been re-planned?
- If not → re-plan layout (e.g., centered → arc layout)
