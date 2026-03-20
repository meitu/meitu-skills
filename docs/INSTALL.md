# INSTALL

## 1) Install skills

```bash
npx -y skills add https://github.com/tangyang/skills --yes
```

## 2) Install runtime

```bash
npm install -g meitu-ai
```

## 3) Configure credentials

Preferred:

```bash
export OPENAPI_ACCESS_KEY="..."
export OPENAPI_SECRET_KEY="..."
```

Fallback:
- `~/.meitu/credentials.json` (via `meitu config set-ak` and `meitu config set-sk`).
- legacy fallback also supported: `~/.openapi/credentials.json`.

## 4) Verify

```bash
node meitu-tools/scripts/run_command.js \
  --command image-upscale \
  --input-json '{"image":"https://obs.mtlab.meitu.com/public/resources/aigensource.png"}'
```

## 5) Lazy runtime update (default on)

- `MEITU_AUTO_UPDATE=1` (default)
- `MEITU_UPDATE_CHECK_TTL_HOURS=24` (default)
- `MEITU_UPDATE_CHANNEL=latest` (default)
