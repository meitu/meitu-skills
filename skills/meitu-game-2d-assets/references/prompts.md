# Prompts For `meitu-game-2d-assets`

## Style Prompts

### pixel
pixel art style, crisp pixel edges, limited color palette, retro game asset look, no soft blur, readable at 64x64, strong silhouette

### flat-vector
flat vector mobile game asset, bold outline, clean color blocking, simple shadows, highly readable icon language, polished casual game look

### hand-painted
hand-painted 2d game asset, stylized rendering, rich material cues, clean silhouette, readable proportions, polished concept art finish

### chibi-cartoon
chibi cartoon game asset, cute exaggerated proportions, playful shapes, bright colors, clean contour, mobile game friendly

### retro-rpg
retro fantasy rpg asset, classic adventure game vibe, readable prop design, game-ready silhouette, nostalgic but clean presentation

### custom
{user_style}, 2d game asset, clean silhouette, readable at small size, consistent rendering language

## Asset Templates

### icon
single centered game icon of {subject}, isolated asset, no extra scene objects, simple background, readable at small size

### prop
single 2d game prop of {subject}, isolated on plain background, clear material definition, centered composition

### character
full body 2d game character concept of {subject}, clear costume hierarchy, game-friendly silhouette, front-facing or three-quarter standing pose

### enemy
full body 2d game enemy concept of {subject}, strong silhouette, readable weak-point design, suitable for action or rpg game

### tileset
2d game tileset concept of {subject}, top-down or side-view consistency, modular tiles, evenly spaced grid presentation

### sprite-sheet
2d game sprite sheet of {subject}, fixed camera angle, consistent proportions across frames, each frame shows a distinct action state

## Grid Constraints

use a clean 2x2 or 3x3 grid, every cell fully separated, at least 20 percent whitespace between frames, no overlapping limbs or effects across cells, each frame complete and self-contained, consistent character scale, same camera angle in all cells

## Prompt Assembly Examples

### Example 1
`{pixel} + {icon}`

pixel art style, crisp pixel edges, limited color palette, retro game asset look, no soft blur, readable at 64x64, strong silhouette. single centered game icon of health potion, isolated asset, no extra scene objects, simple background, readable at small size.

### Example 2
`{chibi-cartoon} + {character}`

chibi cartoon game asset, cute exaggerated proportions, playful shapes, bright colors, clean contour, mobile game friendly. full body 2d game character concept of rookie knight, clear costume hierarchy, game-friendly silhouette, front-facing or three-quarter standing pose.

### Example 3
`{retro-rpg} + {sprite-sheet} + {grid constraints}`

retro fantasy rpg asset, classic adventure game vibe, readable prop design, game-ready silhouette, nostalgic but clean presentation. 2d game sprite sheet of slime monster attack cycle, fixed camera angle, consistent proportions across frames, each frame shows a distinct action state. use a clean 2x2 grid, every cell fully separated, at least 20 percent whitespace between frames, no overlapping limbs or effects across cells, each frame complete and self-contained, consistent character scale, same camera angle in all cells.
