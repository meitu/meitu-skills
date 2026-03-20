# meitu-skills

Skill pack for OpenClaw, powered by `meitu-ai` CLI.

## Layout

- Root entry skill: `SKILL.md` (global routing guidance)
- Tool aggregate skill: `meitu-tools/`
- Scene skill: `article-to-cover/`

## Quick Start

1. Install all skills

```bash
npx -y skills add https://github.com/meitu/meitu-skills
```

2. Install runtime CLI

```bash
npm install -g meitu-ai
```

3. Configure credentials

- `OPENAPI_ACCESS_KEY` + `OPENAPI_SECRET_KEY`, or
- `~/.meitu/credentials.json` (via `meitu config set-ak` / `meitu config set-sk`)
- legacy fallback also supported: `~/.openapi/credentials.json`

4. Smoke test

```bash
node meitu-tools/scripts/run_command.js \
  --command image-upscale \
  --input-json '{"image":"https://obs.mtlab.meitu.com/public/resources/aigensource.png"}'
```

5. Runtime auto-update (lazy mode, default enabled)

- `MEITU_AUTO_UPDATE=1` (default): check npm version lazily and update only when stale/outdated
- `MEITU_UPDATE_CHECK_TTL_HOURS=24` (default)
- `MEITU_UPDATE_CHANNEL=latest` (default)

## Directory

```text
meitu-skills/
  SKILL.md
  README.md
  docs/
  scripts/
    build_aggregate_skill.py
  meitu-tools/
    SKILL.md
    scripts/run_command.js
    generated/manifest.json
  article-to-cover/
    SKILL.md
    references/
```
