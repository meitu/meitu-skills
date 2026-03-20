# meitu-skills

Skill pack for OpenClaw, powered by `meitu-ai` CLI.

## Layout

- Root entry skill: `SKILL.md` (global routing guidance)
- Tool aggregate skill: `meitu-tools/`
- Scene skill: `article-to-cover/`

## Quick Start

1. Install all skills

```bash
npx -y skills add https://github.com/meitu/meitu-skills --yes
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

6. Sensitive data self-check (before commit/push/package)

```bash
rg -n --hidden -S \
  -g '!.git' -g '!node_modules' \
  '(OPENAPI_ACCESS_KEY|OPENAPI_SECRET_KEY|accessKey|secretKey|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{20,}|BEGIN (RSA|EC|OPENSSH) PRIVATE KEY)' .
```

- Run this before `git commit`, `git push`, and any zip/tar delivery.
- No output means no obvious plaintext secret was found by this rule set.

## Directory

```text
meitu-skills/
  package.json                 # devDeps: js-yaml; scripts: generate
  SKILL.md
  README.md
  docs/
  tools-ssot/
    tools.yaml                 # SSOT — sole human-maintained data file
    agent-descriptions.yaml    # auto-generated
    tools-overview.csv         # auto-generated
    disambiguation-matrix.md   # auto-generated
    README.md
  scripts/
    generate.js                # unified generator (reads tools.yaml, writes 7 artifacts)
  meitu-tools/
    SKILL.md
    scripts/
      run_command.js           # entry point
      lib/
        commands.js            # reads commands-data.json, builds registry
        commands-data.json     # auto-generated from tools.yaml
        errors.js              # error classification and hint generation
        input.js               # input alias resolution, validation, credentials
        executor.js            # CLI invocation and result extraction
        updater.js             # lazy runtime update and version management
    generated/
      manifest.json            # auto-generated
  article-to-cover/
    SKILL.md
    references/
```
