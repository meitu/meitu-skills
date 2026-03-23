# Product Multi-Angle View Prompt Templates

Each section is a prompt template for a specific viewing angle.
Agent selects the matching section by `## {angle}-view`, fills `{variables}`, and passes to `meitu image-edit --prompt`.

**Variables:**
- `{product_description}` — Agent 从用户上传图 + 用户文字分析得出（如 "a white leather sneaker with blue sole"）
- `{background}` — 从下方 Background Suffixes 选取
- `{scene_description}` — 仅场景模式使用，用户选择或 Agent 推荐

---

## front-view

A clean, highly detailed front view of {product_description}. The product faces directly forward, symmetrical, standing straight. Clear silhouette, balanced proportions. Proportions and details consistent with the uploaded photo. {background}. Professional product photography, soft studio lighting with subtle reflections.

## right-side-view

A clean, highly detailed right side view of {product_description}. The product is shown from a 90-degree right profile. Clear outline of the product shape, depth, and right-side details. Proportions and details consistent with the uploaded photo. {background}. Professional product photography, even studio lighting.

## left-side-view

A clean, highly detailed left side view of {product_description}. The product is shown from a 90-degree left profile. Clear outline of the product shape, depth, and left-side details. Proportions and details consistent with the uploaded photo. {background}. Professional product photography, even studio lighting.

## back-view

A clean, highly detailed back view of {product_description}. The product faces away from the camera, showing all rear details, labels, and features. Proportions and details consistent with the uploaded photo. {background}. Professional product photography, soft studio lighting.

## front-right-quarter-view

A clean, highly detailed three-quarter view of {product_description} from the front-right at a 45-degree angle. The product is angled to show both the front face and the right side simultaneously. Proportions and details consistent with the uploaded photo. {background}. Professional product photography, studio lighting.

## front-left-quarter-view

A clean, highly detailed three-quarter view of {product_description} from the front-left at a 315-degree angle. The product is angled to show both the front face and the left side simultaneously. Proportions and details consistent with the uploaded photo. {background}. Professional product photography, studio lighting.

## back-right-quarter-view

A clean, highly detailed rear three-quarter view of {product_description} from the back-right at a 135-degree angle. The product is angled to show both the back and the right side. Proportions and details consistent with the uploaded photo. {background}. Professional product photography, studio lighting.

## back-left-quarter-view

A clean, highly detailed rear three-quarter view of {product_description} from the back-left at a 225-degree angle. The product is angled to show both the back and the left side. Proportions and details consistent with the uploaded photo. {background}. Professional product photography, studio lighting.

## overhead-view

A clean, highly detailed top-down view of {product_description} shot from directly above at approximately 60-degree elevation. The product is centered in frame, showing the top surface and upper contours. Proportions and details consistent with the uploaded photo. {background}. Professional product photography, soft even overhead lighting, minimal shadow.

## elevated-view

A clean, highly detailed elevated view of {product_description} shot from a 30-degree elevated angle. Shows both the top surface and the front of the product. Proportions and details consistent with the uploaded photo. {background}. Professional product photography, studio lighting.

## low-angle-view

A clean, highly detailed low-angle view of {product_description} shot from below at approximately 30 degrees upward. Shows the product from a dramatic upward perspective, emphasizing height and presence. Proportions and details consistent with the uploaded photo. {background}. Professional product photography, upward studio lighting.

## close-up-view

A clean, highly detailed close-up macro view of {product_description}. Focus on texture, material quality, craftsmanship, and fine surface details. Shallow depth of field with the product's most distinctive feature in sharp focus. Proportions and details consistent with the uploaded photo. {background}. Professional product photography, focused directional studio lighting.

## combo-three-view

Clean, highly detailed (from left to right) front view, side view and back view of {product_description} arranged in a row. Each view equally sized, clear separation between views. {background}. Do not change the appearance of the product. Professional product photography, consistent studio lighting across all three views.

---

## Background Suffixes

Replace `{background}` in the angle templates above with one of these:

### white-bg

Clean pure white background. No shadows on background surface. Even, bright white (#FFFFFF) everywhere around the product.

### scene-bg

The product is naturally placed in {scene_description}. Realistic integration with the environment, natural shadows and reflections consistent with the scene lighting.

### original-bg

> Do NOT include any background instruction in the prompt.
> For original background mode, use the Chinese prompts defined in SKILL.md Step 5 instead.

### transparent-bg

> Use `white-bg` suffix for generation, then post-process with `meitu image-cutout`.
