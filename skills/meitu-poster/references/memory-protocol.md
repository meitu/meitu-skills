# Memory Protocol for meitu-poster

Read/write protocol for user data integration. All paths relative to `{OPENCLAW_HOME}/workspace/visual/`（下文简称 `$VISUAL`）.

## Contents
- [Path Resolution](#path-resolution)
- [Read Protocol](#read-protocol)
- [Write Protocol](#write-protocol)
- [Observation Lifecycle](#observation-lifecycle)
- [Recording Behavior](#recording-behavior)
- [Classification Principles](#classification-principles)
- [Memory Content Format](#memory-content-format)
- [Size Control](#size-control)
- [DESIGN.md Structure](#designmd-structure)
- [Growth Path](#growth-path)
- [Cross-Agent Setup](#cross-agent-setup)

---

## Path Resolution

Memory files live at `{OPENCLAW_HOME}/workspace/visual/`（即 `$VISUAL`）.

Path resolution: `$OPENCLAW_HOME` env var if set; else `~/.openclaw` (macOS/Linux), `%LOCALAPPDATA%\openclaw` (Windows).

```
{OPENCLAW_HOME}/
└── workspace/
    └── visual/                 # domain
        ├── assets/
        │   ├── brands/{name}/  # Brand assets (logo, color system, tone)
        │   ├── styles/         # Saved style presets
        │   ├── palettes/       # Color palette definitions
        │   ├── presets/        # Generation presets
        │   └── references/     # Reference images, mood boards
        ├── rules/
        │   ├── quality.yaml    # Forbidden elements
        │   ├── platforms/      # Platform-specific rules (size, safe zones)
        │   └── clients/        # Client-specific rules
        ├── memory/
        │   ├── global.md       # Promoted preferences (confirmed)
        │   ├── scenes/         # Promoted scene preferences (confirmed)
        │   └── observations/   # Observation staging area (Agent workspace)
        │       └── observations.yaml
        └── projects/           # Project instances (default location)
            └── {project-name}/
                ├── openclaw.yaml
                ├── DESIGN.md
                ├── context/    # Business requirements, briefs
                ├── inputs/     # User-provided reference images
                ├── output/     # Final deliverables ({date}_{effect-name}.{ext})
                └── drafts/     # Work-in-progress files
```

Before reading or writing, resolve `{OPENCLAW_HOME}` (`$OPENCLAW_HOME` if set; else `~/.openclaw`) and check if the directory exists. If not, skip memory operations — the skill works without it.

---

## Read Protocol

**Principle: Execute first, memory enhances.** Memory is optional — the skill's primary job is completing the user's request. Memory improves results but is NEVER a prerequisite.

### When to read memory

| Task type | Memory needed? | What to read |
|-----------|---------------|-------------|
| Creative (generate, poster design) | Optional | quality.yaml (avoid forbidden), global.md (apply preferences) |
| Project with brand/platform target | Optional | brand assets, platform rules (if specified) |

### How to read

If project has `openclaw.yaml` AND `{OPENCLAW_HOME}/workspace/visual/` exists AND the task involves creative decisions:
1. Read `{OPENCLAW_HOME}/workspace/visual/rules/quality.yaml` → avoid forbidden elements (if file exists)
2. Read `{OPENCLAW_HOME}/workspace/visual/memory/global.md` (file should stay under ~50 entries; if exceeded, archive oldest to `global-archive.md`) → apply known preferences (if file exists)
3. Read `project.type` from `openclaw.yaml` → look for `memory/scenes/{project.type}.md` → if found, read it
4. If brand specified → read `{OPENCLAW_HOME}/workspace/visual/assets/brands/{name}/`
5. If target platform known → read `{OPENCLAW_HOME}/workspace/visual/rules/platforms/{platform}.yaml`

If no `openclaw.yaml` (one-off task) → skip all memory reads, zero overhead.
If `{OPENCLAW_HOME}/workspace/visual/` does not exist → skip all memory reads, work with defaults. Do NOT ask user to set up memory before executing.

**Token discipline:** Never read all memory files at once. Read only what the current task needs.

---

## Write Protocol

**Principle: Record only on user feedback, via observation pipeline.** Do NOT write anything proactively. Only write when the user explicitly approves or rejects something.

**Prerequisites:** project has `openclaw.yaml` AND `{OPENCLAW_HOME}/workspace/visual/` exists. If either is missing, skip recording entirely — all feedback applies to current task only.

| User action | What to write | Where | User confirmation? |
|-------------|--------------|-------|--------------------|
| Approves a style ("好", "这个风格不错") | Observation entry | `memory/observations/observations.yaml` | **No** (Agent workspace) |
| Rejects something ("不要 XX", "太花了") | Depends on context | See rejection routing below | Depends |
| Says nothing about preferences | Nothing | — | — |

Style approvals write to `observations.yaml` first (no user confirmation needed — it's the Agent's scratch pad). Promotion to `global.md` or `scenes/` happens later when evidence accumulates (see Observation Lifecycle below).

### Rejection Routing

When user rejects something ("不要 XX"), the routing depends on whether the project has `openclaw.yaml`:

| Context | Action |
|---------|--------|
| **Has `openclaw.yaml`** (project context) | Ask: "仅这个项目不用 XX，还是以后所有项目都不要 XX？" |
| → "仅这个项目" | Append to `./DESIGN.md` Constraints section |
| → "以后都不要" | Append to `rules/quality.yaml` forbidden list (**Yes**, needs user confirmation) |
| **No `openclaw.yaml`** (one-off task) | Rejection applies to current task only. Don't ask, don't write anything. |

Rationale: Not all rejections are universal. "不要复古风" might be project-specific — the user may want vintage elsewhere. Only rejections the user explicitly marks as universal go to `quality.yaml`.

If `{OPENCLAW_HOME}/workspace/visual/` does not exist → do not create it automatically. Tell user to run `mkdir -p "${OPENCLAW_HOME:-$HOME/.openclaw}/workspace/visual"` if they want to start recording preferences.

---

## Observation Lifecycle

### Overview

Observations are the staging area between "raw user feedback" and "confirmed memory". They solve two problems:
1. **Learning friction** — no "learn mode" needed, observations accumulate automatically
2. **Minimum Evidence Rule enforcement** — `len(projects)` replaces Agent memory for tracking cross-project patterns

### File format

```yaml
# {OPENCLAW_HOME}/workspace/visual/memory/observations/observations.yaml
_schema: openclaw/observations/v1
entries:
  - key: "偏好极简布局，不喜欢装饰性元素"
    scope-hint: poster-design
    projects: [acme-mid-autumn, brava-spring, cafe-poster]
    first-seen: 2026-03-01
    last-seen: 2026-03-15

  - key: "3D 渲染优于扁平插画"
    scope-hint: null
    projects: [acme-mid-autumn, brand-x-launch]
    first-seen: 2026-03-08
    last-seen: 2026-03-20
```

Fields:
- `key`: Natural language description of the observation (user's language). NOT kebab-case.
- `scope-hint`: Agent's guess of which scene this belongs to. `null` if likely global.
- `projects`: Flat list of project names where this was observed. `len(projects)` = recurrence.
- `first-seen` / `last-seen`: ISO dates.

`observations.yaml` is a pure pending queue — everything in it is actionable. When an observation is promoted, its entry is deleted from the file (see Promotion below).

### Agent write operation

When user gives style approval feedback:

1. Read `observations.yaml` (create file + directory if not exists)
2. Scan existing entries for content-similar key
3. Found → append project name to `projects`, update `last-seen`
4. Not found → append new entry
5. Write back file

**Deduplication principle: prefer creating duplicates over wrong merges.** "偏好极简布局" and "喜欢简洁设计" might be the same preference or not — when uncertain, create a new entry. Deduplication is deferred to the promotion step where a human is involved.

**Error handling:** If any step fails → skip, do not affect the main task. Worst case: one missed observation or one duplicate.

### Promotion

When the Agent just updated an observation and `len(projects) >= 2`:

1. Mention **non-blocking** at end of reply:
   > "顺便说一下，你在 N 个项目中都偏好 X。要保存到 [target] 吗？"
2. User confirms → write distilled preference to target file, then **delete** the observation entry from `observations.yaml`
3. User ignores → do nothing

Promotion targets:
- `scope-hint` is non-null → `scenes/{scope-hint}.md` (create if not exists)
- `scope-hint` is null or confirmed across 2+ scenes → `global.md`

**When NOT to check promotion:** If user gave no feedback this task, do NOT read `observations.yaml` at all. Zero overhead for no-feedback tasks.

### Observations vs rejections

Rejections ("不要 XX") skip observations entirely. Their routing depends on context:
- **Has `openclaw.yaml`**: Ask user for scope → project-only goes to `./DESIGN.md` Constraints, universal goes to `quality.yaml` (with confirmation).
- **No `openclaw.yaml`**: One-off task — rejection applies to current task only, write nothing.

---

## Recording Behavior

Recording is reactive, via observation pipeline:
- The skill does NOT ask "要不要开启记录?" at task start
- The skill records ONLY when user gives explicit feedback during or after the task
- Style approvals → `observations.yaml` (auto, no confirmation)
- Rejections → routing depends on context:
  - Has `openclaw.yaml` → ask scope: project-only → `./DESIGN.md` Constraints; universal → `quality.yaml` (needs confirmation)
  - No `openclaw.yaml` → current task only, write nothing
- No feedback → nothing written, `observations.yaml` not even read (zero overhead)

---

## Classification Principles

### Minimum Evidence Rule

**Do NOT extract permanent preferences from a single project.** One project's design choices are project-level context (stays in `./DESIGN.md`), not long-term preferences. The observation pipeline automates this:

```
User approves style in project A → observation created (projects: [A])
                                     ↓ same preference observed in project B
                                   → observation updated (projects: [A, B])
                                   → Agent proposes promotion (non-blocking)
                                     ↓ user confirms
                                   → written to scenes/{scene}.md or global.md
                                   → observation entry deleted from observations.yaml
```

The `len(projects)` count replaces manual tracking of "has this appeared in 2+ projects". The Agent no longer needs to remember across sessions — the observations.yaml file persists the evidence.

### Where Does Each Type of Content Belong?

| Content | Belongs in | NOT in | Why |
|---------|-----------|--------|-----|
| "Use aviation blue + gold for this poster" | `./DESIGN.md` | global.md or scenes/ | Project-specific color choice |
| "I prefer Swiss grid layouts for posters" | `scenes/poster-design.md` | global.md | Scene-specific, may not apply to stickers |
| "I value visual clarity over decoration" | `global.md` | scenes/ | True across all creative work |
| "Never use sticker/emoji elements" | `rules/quality.yaml` | global.md | Hard rule, not fuzzy preference |
| "Don't use vintage style" (project scope) | `./DESIGN.md` Constraints | quality.yaml | Project preference, user may want vintage elsewhere |
| "Don't use vintage style" (universal scope) | `rules/quality.yaml` | ./DESIGN.md | User explicitly said "以后都不要" |
| "Don't use vintage style" (no openclaw.yaml) | Nowhere — current task only | quality.yaml or DESIGN.md | One-off task, no project context to persist |

### Good vs Bad Classification Examples

**Bad — over-extracting from one project:**
```markdown
# global.md (WRONG)
## Color Preferences
- Deep aviation blue tones
- Gold accents for authority
## Applied Scenes
- Government announcements
- Aviation/safety themes
```
Why wrong: "aviation blue" and "government announcements" are THIS project's characteristics, not universal preferences. Next project might be a food brand with warm colors.

**Good — properly abstracted:**
```markdown
# global.md (CORRECT)
## General Preferences
- Values professional, authoritative aesthetics
- Prefers clarity and visual hierarchy over decoration
- 3D rendering preferred over flat illustration when appropriate
```
Why correct: These hold true regardless of the project's specific color scheme or subject matter.

**Bad — scene file without frontmatter:**
```markdown
# poster.md (WRONG)
# Poster Design Preferences
## Cross-Scene Universal Preferences
...
```
Why wrong: No `_schema` frontmatter → no skill can match this file. Header says "Cross-Scene Universal" but it's in a scene file.

**Good — scene file with proper frontmatter:**
```yaml
---
_schema: openclaw/scene-memory/v1
scene: poster-design
description: "海报设计场景的审美偏好和方法经验"
tags: [poster, cover, banner]
updated_at: 2026-03-20
---
```
```markdown
## Layout Preferences
Prefers Swiss International Style grid layouts.
Text hierarchy should not exceed 3 levels.
Large primary visual, compact text area at bottom.

## Method Experience
Establish main visual first, then arrange typography.
```

**Bad — quality.yaml with project preferences:**
```yaml
# quality.yaml (WRONG)
forbidden_styles:
  - vintage
  - classic
  - retro
```
Why wrong: "vintage" is a style the user might want in another project. quality.yaml is for ALWAYS-forbidden elements.

**Good — quality.yaml with universal prohibitions:**

Agent **MAY** add new `forbidden_*` keys as needed (e.g., `forbidden_fonts`, `forbidden_elements`). Keep keys kebab-case.

```yaml
# quality.yaml (CORRECT)
forbidden_elements:
  - sticker
  - clip-art
  - cartoon-emoji
  - template-border
  - generic-gradient
```
Why correct: These are elements the user genuinely never wants in any professional output.

### Scene Classification

When an observation is promoted, classify by its `scope-hint` and cross-scene evidence:

1. Is this a choice specific to THIS project (color, subject, layout for this brief)? → Stays in `./DESIGN.md`, do NOT write observation
2. Is this a preference the user expressed as general for this TYPE of work? → observation `scope-hint: {scene}` → promoted to `scenes/{scene}.md`
3. Has this preference been confirmed across 2+ different scenes in observations? → May be promoted to `global.md`
4. Is this a hard rule (never do X)? → Check `openclaw.yaml` presence first: if present, ask scope (project → `./DESIGN.md` Constraints, universal → `rules/quality.yaml`); if absent, current task only
5. Uncertain? → Write observation with `scope-hint: null` — let evidence accumulate
6. Before creating a new scene file → list existing `scenes/` to avoid duplicates
7. Scene files MUST have frontmatter with `_schema: openclaw/scene-memory/v1`
8. Scene file name MUST equal its frontmatter `scene` value (matching is via `project.type` lookup, not skills list)

---

## Memory Content Format

Use **natural language Markdown**, not structured log entries. Preferences and experiences are fuzzy, contextual, and need human-readable expression.

Good:
```markdown
## Style Preferences
偏好极简主义，受 Swiss Design 影响。
文字层级不超过三级效果最佳。
黑/白/金配色适合科技类高端海报。
```

Bad (do NOT use):
```markdown
## [VIS-20260320-001] poster / style
**Priority**: high
**Status**: active
偏好极简主义。
```

### Scene File Frontmatter

Scene files MUST have frontmatter with `_schema`. `description` follows user language; all other values (`_schema`, `scene`, `tags`) MUST be English. Scene file name MUST equal its frontmatter `scene` value (used for `project.type` lookup):

```yaml
---
_schema: openclaw/scene-memory/v1
scene: poster-design
description: "海报设计场景的审美偏好和方法经验"
tags: [poster, cover, banner]
updated_at: 2026-03-20
---
```

Global memory (`global.md`) does NOT need frontmatter — identified by its fixed path.

---

## Size Control

| File | Max active content | Action when exceeded |
|------|-------------------|---------------------|
| `memory/global.md` | ~50 preference entries | Move oldest to `global-archive.md` |
| Each `memory/scenes/*.md` | ~30 preference entries | Move oldest to `{scene}-archive.md` |

"Entry" is loosely defined — a section heading + its content. The limit is a guideline, not a hard cutoff. When a file feels too long to read effectively, it's time to archive.

`observations.yaml` has no hard size limit, but may accumulate semantic duplicates over time (by design — "prefer duplicates over wrong merges"). If the file grows large, Agent **MAY** propose a cleanup to the user: show potentially similar entries and let the user merge or dismiss them.

---

## DESIGN.md Structure

Project-level design document using the **reference+decisions model**. Stores pointers to external assets (Context References) and project-specific decisions — NOT a full snapshot of global assets. Created on first task if it doesn't exist:

```markdown
# Design System: {项目名}
**Updated:** {日期}

## Context References
<!-- Pointers to external assets. Agent resolves these from {OPENCLAW_HOME}/workspace/visual/ -->
brand: {brand-name}
palette: {palette-name or "inline" if no external source}
platform: {platform-name}

## Project Decisions
<!-- Key design decisions for this project: chosen style direction, visual atmosphere, rationale -->
- [风格方向、视觉氛围、配色策略、字体策略、构图逻辑等决策记录]

## Iteration Log
<!-- Most recent 5 entries. When exceeding 5, compact: drop oldest entries. -->
- [{date}] {task description} → {outcome summary}

## Constraints
<!-- Project-specific constraints: things NOT to do in this project -->
- [不能做的事]
```

**Context References resolution:** When reading DESIGN.md, for each reference (e.g., `brand: cafe-travel`): try to read the corresponding file from `{OPENCLAW_HOME}/workspace/visual/assets/` or `rules/`. Found → use latest version. Not found → fall back to inline values in Project Decisions.

**Iteration Log compaction:** If Iteration Log has more than 5 entries, compact: keep most recent 5, drop older entries.

---

## Project Structure

### Default Location

Projects are created under `{OPENCLAW_HOME}/workspace/visual/projects/{project-name}/`. If `{OPENCLAW_HOME}` cannot be resolved, fall back to current directory.

### Scaffolding

Use shared scaffold script to create a new project:

```bash
node {OPENCLAW_HOME}/workspace/scripts/scaffold.mjs project \
  --name "cafe-mid-autumn" \
  --brand "cafe-travel" \
  --type "poster-design" 2>/dev/null
```

If scaffold.mjs is not available, manually create the directory structure and files (see openclaw.yaml Schema and DESIGN.md Structure sections below).

This creates:
```
cafe-mid-autumn/
├── openclaw.yaml    # Project manifest
├── DESIGN.md        # Reference+decisions (from template above)
├── context/         # Business requirements, briefs
├── inputs/          # User-provided reference images
├── output/          # Final deliverables ({date}_{effect-name}.{ext})
└── drafts/          # Work-in-progress files
```

### openclaw.yaml Schema

```yaml
_schema: "openclaw/project/v1"

project:
  name: "漫旅咖啡中秋推广"           # Human-readable display name
  type: "poster-design"              # → scenes/{type}.md scene memory lookup
  created: "2026-03-15"
  status: "active"                   # active | completed | archived

brand: "cafe-travel"                 # → assets/brands/{brand}/ lookup
palette: null                        # → assets/palettes/{palette}/ lookup, or null

overrides: {}                        # Project-level overrides for rules
deliverables: []                     # Tracking list of deliverables
```

Key fields for this skill:
- `project.type` — Used for deterministic scene memory matching (`scenes/{type}.md`)
- `brand` — Used for brand asset resolution (`assets/brands/{brand}/`)
- `palette` — Used for palette resolution (`assets/palettes/{palette}/`)

---

## Growth Path

1. Day 1: No `{OPENCLAW_HOME}/workspace/visual/memory/` at all — Skill works with defaults
2. Day 5: Only global.md — all preferences in one place; observations.yaml accumulates approval patterns
3. Day 15: Agent detects conflicting preferences (poster wants minimalist, sticker wants colorful)
   → Proposes split via observation promotion: poster preferences → scenes/poster-design.md, sticker → scenes/sticker-design.md
   → global.md keeps only cross-scene content
   → User confirms before execution

---

## Cross-Agent Setup

`{OPENCLAW_HOME}/workspace/visual/` uses an absolute path, so it works regardless of cwd. Any agent (OpenClaw, Claude Code, Codex) can read/write to it.

First-time setup:
```bash
mkdir -p "${OPENCLAW_HOME:-$HOME/.openclaw}/workspace/visual" && echo "OK"
```
