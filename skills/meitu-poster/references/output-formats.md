# Output Formats

JSON schemas and structured templates for both scenarios.

## Contents
- [Scenario 1: Creative Direction Output](#scenario-1-creative-direction-output)
- [Scenario 2: Poster Analyse Output](#scenario-2-poster-analyse-output)

---

## Scenario 1: Creative Direction Output

### Markdown Structure

```markdown
### Design Direction – "[Style Name]"

**Core Visual:**
*   [Must include: style signature elements + industry core subject + stylized scene, in one precise sentence.]

**Visual Elements:**
*   **Subject and Environment:** [Core subject, its state, and environment.]
*   **Lighting and Atmosphere:** [Lighting style, contrast, light source, overall mood.]
*   **Color Language:** [Primary tones, secondary tones, color relationships, emotional feel.]
*   **Composition and Camera:** [Composition method, subject placement, focal point, reading flow, camera feel.]

**Layout and Typography:**
*   **Typography Concept:** [Font selection logic and style — main font category / weight / interaction with graphics.]
*   **Layout Strategy:** [How headline, subtitle, time/location from user copy are arranged. Information hierarchy. Specific placement: Headline/Subhead/Body/Logo/CTA.]
*   **Text–Image Relationship:** [How text and graphics interact: overlay / separation / interweaving / fusion.]

**Overview**
[Style + one-sentence summary of strongest visual scene. Example: Minimalism — warm milky coffee base paired with soft gold and cocoa-brown typography, rounded sans-serif layout, accented with hand-drawn coffee cups and drifting steam lines, overall light and approachable.]
```

### AI Production Instructions (JSON Schema)

```json
{
  "project_manifest": {
    "project_name": "<PROJECT_NAME>",
    "design_intent": "<CORE_VISUAL_INTENT>",
    "visual_priority": "<PRIMARY_VISUAL_STRATEGY>",
    "dimensions": {
      "width": "<WIDTH>",
      "height": "<HEIGHT>",
      "aspect_ratio": "<ASPECT_RATIO>"
    }
  },
  "visual_style_system": {
    "aesthetic_core": "<OVERALL_AESTHETIC_STYLE>",
    "composition_guide": {
      "layout_mode": "<COMPOSITION_MODE>",
      "focal_point": "<PRIMARY_FOCAL_AREA>",
      "negative_space": "<NEGATIVE_SPACE_STRATEGY>",
      "depth_of_field": "<DEPTH_OF_FIELD_DESCRIPTION>"
    },
    "color_palette": {
      "background_base": "<BACKGROUND_COLOR_OR_TEXTURE>",
      "primary_accents": ["<ACCENT_COLOR_1>", "<ACCENT_COLOR_2>"],
      "text_contrast": "<TEXT_COLOR_STRATEGY>"
    }
  },
  "scene_elements": {
    "protagonist": {
      "item": "<MAIN_SUBJECT>",
      "position": "<SUBJECT_PLACEMENT>",
      "material_or_texture": "<MATERIAL_TEXTURE_DESCRIPTION>"
    },
    "environment": {
      "props": "<SUPPORTING_ELEMENTS>",
      "lighting": "<LIGHTING_STYLE_AND_EFFECT>"
    }
  },
  "typography_layout": {
    "design_concept": "<TYPOGRAPHY_CONCEPT>",
    "elements": [
      {
        "id": "<TEXT_ROLE_ID>",
        "content": "<TEXT_CONTENT>",
        "style": {
          "font": "<FONT_STYLE_OR_CATEGORY>",
          "size": "<FONT_SIZE_DESCRIPTION>",
          "tracking": "<LETTER_SPACING>",
          "weight": "<FONT_WEIGHT>",
          "case": "<TEXT_CASE_RULE>",
          "alignment": "<TEXT_ALIGNMENT>"
        },
        "position": "<TEXT_POSITIONING_RULE>"
      }
    ]
  },
  "ai_generation_prompts": {
    "primary_prompt": "<MAIN_GENERATION_PROMPT>",
    "negative_prompt": "<NEGATIVE_KEYWORDS_FROM_DESIGN_CONSTRAINTS_AND_MEDIUM_TYPE>",
    "secondary_prompt": "<ALTERNATIVE_OR_MODEL_SPECIFIC_PROMPT>",
    "layout_keywords": [
      "<KEYWORD_1>",
      "<KEYWORD_2>",
      "<KEYWORD_3>"
    ]
  }
}
```

---

## Scenario 2: Poster Analyse Output

### When no reference image → use Scenario 1 format above

### When reference image provided → JSON Schema

```json
{
  "mission_logic": {
    "intent_locked": "Washing (Default) OR Mimicry (Triggered)",
    "soul_extraction": {
      "selected_anchor": "Typography Anchor / Layout Anchor / Vibe Anchor",
      "reasoning": "Explain why this is the core essence (e.g., The liquid chrome font is the most striking feature, so I will keep it but change the layout to a swiss grid and color to neon green.)"
    }
  },
  "design_blueprint": {
    "reconstructed_concept": "[Core] One-sentence image description reflecting image-text integration. Format: '[Lens] + [New Subject] + [Text Interaction] + [Background]'.",
    "user_copywriting": "Copy provided by the user",
    "visual_style": "Physical texture (copy from original if Vibe is locked, otherwise Trendy upgrade)",
    "color_palette": "Specific color scheme (copy if Vibe/Mimicry locked, otherwise Hue Cleansing)",
    "layout_structure": "Layout logic (gallery-level reconstruction in Washing, fine-tuning only in Mimicry)",
    "typography_plan": "Font strategy (copy if Typography/Mimicry locked, otherwise Trendy injection)",
    "composition_details": "Image composition details",
    "detected_mode": "Judge reference image edges: 'LINELESS_FLAT' or 'BOLD_OUTLINED'"
  },
  "content_firewall": {
    "ignored_ref_objects": "List discarded objects from reference (e.g., table, cup)",
    "banned_ref_features": "List unlocked original features (e.g., original color, original layout)"
  },
  "prompt": "Final English prompt. Mandatory order: [New Color Palette], [reconstructed_concept], [Selected Anchor Description], [Mutated Elements Description]. Do NOT embed negative keywords here — use negative_prompt field instead.",
  "negative_prompt": "Negative keywords from content_firewall + design constraints (e.g., '[ignored_ref_objects], simple layout, template, stock photo'). Note: meitu-cli has no --negative-prompt param; at Generate time, convert key negatives into positive phrasing and append to prompt."
}
```
