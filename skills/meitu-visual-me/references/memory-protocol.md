# Memory Protocol — Observation Lifecycle

User feedback recording follows the observation pipeline: observe first, then decide whether to persist.

---

## Prerequisites

Recording is only enabled when **both** of the following conditions are met:

1. The project has `openclaw.yaml`
2. The `./visual/` directory exists

If either is not met → skip all recording; all feedback applies only to the current task.

---

## Observation Pipeline

```
User feedback
├─ Positive ("好"/"喜欢这个风格") → Write to observations.yaml (auto)
│   └─ projects >= 2 → Non-blocking promotion proposal
│       ├─ User confirms → Write to global.md or scenes/{scene}.md, delete observation
│       └─ User ignores → Do nothing
├─ Negative ("不要 XX") → Route depends on context
│   ├─ Has openclaw.yaml → Ask scope
│   │   ├─ "Project only" → ./DESIGN.md Constraints
│   │   └─ "All future projects" → quality.yaml (requires user confirmation)
│   └─ No openclaw.yaml → Current task only, no write
├─ Identity fact ("我是男的") → PROFILE.md
├─ New reference photo → assets/references/user.jpg
└─ No feedback → Write nothing, don't read observations.yaml
```

---

## observations.yaml Format

Path: `./visual/memory/observations/observations.yaml`

```yaml
observations:
  - key: "偏好暖色调"
    scope-hint: "poster-design"    # from project.type; null if cross-scene
    first-seen: "2026-03-15"
    last-seen: "2026-03-20"
    projects:
      - "poster-cafe"
      - "daily-card-march"
  - key: "喜欢极简构图"
    scope-hint: null
    first-seen: "2026-03-20"
    last-seen: "2026-03-20"
    projects:
      - "id-card-v2"
```

**Field descriptions:**

| Field | Description |
|------|------|
| `key` | Observed preference pattern (natural language description) |
| `scope-hint` | From `openclaw.yaml`'s `project.type`; set to null for cross-scene preferences |
| `first-seen` | Date first observed |
| `last-seen` | Date most recently observed |
| `projects` | List of projects where this preference appeared |

---

## Promotion Rules

When an observation's `projects` list has >= 2 entries:

1. **Non-blockingly** mention at end of reply:
   > "你在 N 个项目中都偏好 X。要保存吗？
   >   → 保存到 {scope_hint} 场景 [默认]
   >   → 保存到全局偏好
   >   → 不保存"
2. **Default routing based on scope-hint:**
   - `scope-hint` is non-null → default target `$VISUAL/memory/scenes/{scope-hint}.md`
   - `scope-hint` is null → default target `$VISUAL/memory/global.md`
3. User confirms → write to target, delete observation entry
4. User ignores → do nothing; observation is preserved

---

## Rejection Routing

When user says "不要 XX":

| Context | Action |
|--------|------|
| Has `openclaw.yaml` | Ask: "Skip XX only for this project, or never use XX for all future projects?" |
| ↳ "Project only" | Append to `./DESIGN.md` Constraints section |
| ↳ "All future projects" | Append to `./visual/rules/quality.yaml` forbidden list (requires user confirmation) |
| No `openclaw.yaml` (one-off) | Current task only, no file writes |

---

## Classification Principles

| Feedback type | Classification | Write target |
|---------|------|---------|
| Style preference ("喜欢 XX") | Inference | observations.yaml → promotion → global.md |
| Style taboo ("不要 XX") | Fact | quality.yaml (global) or DESIGN.md (project) |
| Identity info ("我是男的") | Fact | PROFILE.md |
| Reference photo update | Fact | assets/references/user.jpg |
| Composition/ratio preference | Inference | observations.yaml → promotion → global.md |
| Platform preference ("默认出竖图") | Fact | quality.yaml |
