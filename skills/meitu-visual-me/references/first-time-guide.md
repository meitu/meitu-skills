# First-Time User Onboarding

Triggered when the `./visual/` directory does not exist. Three steps:

## Step 1: Introduce Capabilities + Collect Basic Info

Show what Meitu Visual Me can do, then collect info along the way:

```
"Meitu Visual Me is ready 🎨

It can help you:
🃏 ID Card — Exclusive collectible card, four trendy styles
🌆 Background Swap — Send a photo, describe the background, instant swap
🪆 Miniature Scene — Turn you into a tiny figure in a toy world
🪞 Avatar Series — One face, multiple style avatars
🎞️ Memory Collage — Vertical visual diary
🎨 One-Click Style Remix — One image, multiple style variants
🎬 Image to Video — Bring images to life
👗 Virtual Try-On — Send a clothing image to try it on

Let's start by making your exclusive ID card!
Send a front-facing photo and tell me your gender and name 👇
(No photo? No problem, just tell me and we'll work with text)"
```

**Write immediately after info collection:**
- Photo → save as `./visual/assets/references/user.jpg`
- Gender, name → write to `./visual/PROFILE.md`
- User skips photo → don't block; fall back to text-to-image mode

## Step 2: Generate ID Card (user card + OpenClaw card)

After collecting info, let user choose a style:

```
"Pick an ID card style:

A. 🔥 Street Grunge — Weathered texture, hardcore industrial
B. 💜 Soft Glow — Cream base, gentle and artsy
C. 🌙 Cyber Neon — Dark base, neon glow outlines
D. 📸 Retro Yearbook — 90s ID photo, nostalgic laser backdrop

Pick a letter, or say 'all of them' to get all four 👇"
```

**After user chooses → enter ID card workflow (see workflows.md) to generate user card.**
**User says "all of them" → generate one in each of the 4 styles.**

Once satisfied → extract key features from the result and add to `./visual/PROFILE.md`.

**After user card is generated, proactively suggest an OpenClaw card:**
> "Want to make one for me (OpenClaw) too? Then we can take a group photo later 🤝"

User agrees → read IDENTITY.md for OpenClaw's character profile + `./visual/assets/references/openclaw.jpg` (if available), generate OpenClaw's ID card in the same style.

## Step 3: Guide Next Steps

Recommend different types of activities based on the user's recent choice:
- Just made an ID card → "Want to try a background swap or avatar series?"
- Just swapped a background → "Want to adapt it for Xiaohongshu ratio?"
- Just made avatars → "Pick one as your avatar? I can generate more in a style you like"
- User sent a selfie → "Want to try beauty enhance, or take a group photo with OpenClaw?"

If the user doesn't respond or choose → don't follow up; wait for the user to initiate.
