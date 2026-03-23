# Setup — Progressive Onboarding Guide

No need to configure everything at once. Start playing first, add more as needed.

---

## Phase 1: Zero Config, Just Play (2 minutes)

Just install the meitu CLI and set up credentials to start generating.

### Install meitu CLI

```bash
npm install -g meitu-cli
# Verify installation
meitu --version
```

> Lazy update: Enabled by default; auto-checks for new versions after 24 hours. Disable with `MEITU_AUTO_UPDATE=0`.

### Configure meitu API Credentials

```bash
meitu config set-ak --value yourAccessKey
meitu config set-sk --value yourSecretKey
```

### Verify

```bash
meitu auth verify --json
```

Successful output with `"ok": true` → credentials are valid, ready to play.

### What You Can Do at This Phase

| Activity | Result |
|------|------|
| "帮我画一个微缩场景" | Text-to-image, generic style |
| Send a photo + "换成赛博背景" | Background swap, instant |
| "头像系列" | Multi-style avatars (text-to-image mode) |

---

## Phase 2: Send a Reference Photo to Unlock Personalization (optional)

Send a profile photo/headshot to OpenClaw. It will automatically:
- Save it as `./visual/assets/references/user.jpg`
- Maintain your character traits in all subsequent person-related generations
- Significantly improve results for group photos, ID cards, and avatar series

**No manual steps needed — just send the photo.**

### What This Phase Unlocks

| Capability | Before | After |
|------|------|------|
| Avatar series | Text description only, random face | Based on your actual face |
| Group photo | Generic character | You + OpenClaw |
| ID card | Cartoon character | Your 3D likeness |
| Background swap | Must send photo each time | Automatically uses profile photo |

---

## Phase 3: Style Preferences Auto-Accumulate (no action needed)

As you use it, Meitu Visual Me automatically learns from your feedback:

- You say "好" → records your preferred style
- You say "太写实" → records your disliked style
- 2 similar feedbacks accumulated across different projects → non-blocking proposal to save as preference

**No forms to fill out.** If you want to speed things up, you can proactively say:
- "我喜欢极简风格"
- "别用太饱和的颜色"
- "以后默认出竖图"

These are immediately written to the corresponding `./visual/` files (facts go to `rules/`, preferences go to `memory/`).

---

## Phase 4: Complete Profile (advanced users, optional)

For a one-time full setup, manually create these files:

**`./visual/rules/quality.yaml`** (explicit taboos):
```yaml
dislike: [styles you don't want]
```

**`./visual/PROFILE.md`** (visual identity):
```markdown
# Visual Profile
## Character
- Gender: [as told by user]
- Name: [as told by user]
- Key features: [2-4 items]
- Reference: assets/references/user.jpg
```

---

## Dependencies

- Node.js (for npx/npm to install meitu-cli)
- meitu-cli (`npm install -g meitu-cli`)
- meitu API credentials (accessKey + secretKey)
