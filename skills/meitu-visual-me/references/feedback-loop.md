# Feedback Write Rules

When user gives active feedback, write to the corresponding file per the rules below. **Write nothing if the user says nothing.**

For routing logic and observation lifecycle, see [memory-protocol.md](memory-protocol.md). This file only defines the **write formats** for each target file.

---

## Write Targets

| User says/does | Write to | Format |
|---------------|---------|------|
| "我是男的" | `./visual/PROFILE.md` | Update corresponding field |
| "不要写实" (global) | `./visual/rules/quality.yaml` | Append to `dislike` list |
| "不要写实" (project only) | `./DESIGN.md` Constraints section | Append constraint entry |
| Sends new reference photo | `./visual/assets/references/user.jpg` | Overwrite directly |
| "这张很好" / "喜欢这个风格" | `./visual/memory/observations/observations.yaml` | Append or update observation (see memory-protocol.md) |
| "以后默认出竖图" | `./visual/rules/quality.yaml` | Append to corresponding field |
| "换个背景重生" | No write | Re-run current task |

---

## `./visual/rules/quality.yaml` Format

```yaml
dislike:
  - photorealistic    # source: user said "不要写实"
  - oversaturated     # source: user said "颜色太饱和"
constraints:
  - 不要在图上加文字   # source: user said "别加文字"
```

Read existing content before writing; **avoid duplicates**. Do not append entries that already exist.

---

## `./visual/memory/global.md` Format

Write in natural-language Markdown, not structured logs:

```markdown
## Style preferences
- Prefers warm tones, minimalist style
- 3D animation style is the default first choice

## Composition preferences
- Likes compositions with more white space
- Centered subject is preferred over off-center
```

**Write rules:**
- Use descriptive language, not JSON or structured formats
- Group similar preferences under the same `##` subsection
- Read existing content before writing; append similar preferences to the corresponding subsection, don't create new subsections
- If a new preference contradicts an existing one, **replace old with new** (user changed their mind)
- Keep the file under ~50 entries

**Note:** Positive preferences are no longer written directly to global.md. Positive feedback enters observations.yaml first; only after `projects` >= 2 and user confirmation does it get promoted to global.md. See [memory-protocol.md](memory-protocol.md) for details.

---

## `./visual/PROFILE.md` Format

```markdown
# Visual Profile

## Character
- Gender: [as told by user]
- Name: [as told by user]
- Key features: [identified from reference photo or described by user, 2-4 items]
- Reference: assets/references/user.jpg

## Tone
[Extracted from user's positive feedback, e.g., "prefers warm-tone film-style textures"]
```

PROFILE.md only stores **confirmed facts**, not inferences.
