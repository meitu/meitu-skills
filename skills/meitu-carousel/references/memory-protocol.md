# Memory Protocol — Observation Lifecycle

Record 段的补充参考。

---

## Observation 写入操作

当用户给出风格认可反馈时：

1. 读 `$VISUAL/memory/observations/observations.yaml`（不存在则创建文件 + 目录）
2. Agent 语义判断是否有相似 key；有则复用 key，无则用用户语言组织新 key
3. 写入 observations.yaml：similar key → merge（append project, update last-seen）；new key → create entry

   Observation entry schema:
   ```yaml
   - key: "偏好描述"
     scope-hint: meitu-carousel   # from project.type; null if cross-scene
     projects: [project-name]
     first-seen: 2026-03-22
     last-seen: 2026-03-22
   ```

**去重原则：prefer merging over creating duplicates.** 错误合并在 promotion 时可由用户修正（成本低）；漏合并导致 entry 永远达不到 promotion 阈值（永久损失）。倾向合并。

**Error handling:** 任何步骤失败 → skip，不影响主任务。最坏情况：一个遗漏的 observation 或一个重复项。

---

## Promotion 流程

当 Agent 刚更新 observation 且 `len(projects) >= 2` 时：

1. **非阻塞**提及，在回复末尾：
   > "顺便说一下，你在 N 个项目中都偏好 X。要保存吗？
   >   → 保存到 {scope-hint} 场景 [默认]
   >   → 保存到全局偏好
   >   → 不保存"
2. User confirms → write distilled preference to target file, then delete the observation entry from `observations.yaml`
3. User ignores → do nothing

**Target 路由：**
- `scope-hint` 非 null → `$VISUAL/memory/scenes/{scope-hint}.md`（不存在则创建，含 frontmatter）
- `scope-hint` 为 null 或跨 2+ 场景确认 → `$VISUAL/memory/global.md`

**Scene file frontmatter（创建时）：**
```yaml
---
_schema: openclaw/scene-memory/v1
scene: meitu-carousel
description: "轮播套组审美偏好和方法经验"
tags: [carousel, poster, meitu]
updated_at: 2026-03-22
---
```

**When NOT to check promotion:** 本次任务用户无任何反馈 → 不读 observations.yaml，零开销。

---

## Size Control

| File | Max | Exceeded → |
|------|-----|-----------|
| `memory/global.md` | ~50 entries | oldest → `global-archive.md` |
| `memory/scenes/*.md` | ~30 entries | oldest → `{scene}-archive.md` |

"Entry" = a section heading + its content. Limit is guideline, not hard cutoff.

`observations.yaml` 无硬性限制。merge-first 策略下重复应很少。若仍增长过大，Agent MAY 向用户提议清理。

---

## Rejection vs Observation

| 用户行为 | 走向 | 写 observations.yaml? |
|---------|------|---------------------|
| 认可风格 | Observation pipeline → promotion | Yes |
| 拒绝 "不要 XX" | Rejection routing → DESIGN.md or quality.yaml | No, skip observations |
| 无反馈 | Nothing | No |

Rejection 完全绕过 observation，直接按 Record 段中的 routing 处理。
