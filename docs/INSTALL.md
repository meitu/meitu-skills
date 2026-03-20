# INSTALL

## Runtime

Recommended:

```bash
pipx install --force meitu-ai
```

Required runtime:
- `meitu-ai >= 0.1.2`

## Credentials

Preferred:

```bash
export OPENAPI_ACCESS_KEY="..."
export OPENAPI_SECRET_KEY="..."
```

Fallback:
- `~/.openapi/credentials.json` with keys `accessKey` and `secretKey`.

## Verification

```bash
python3 meitu-ai/scripts/run_command.py \
  --command image-upscale \
  --input-json '{"image":"https://obs.mtlab.meitu.com/public/resources/aigensource.png"}'
```
