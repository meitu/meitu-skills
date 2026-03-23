# Troubleshooting

---

## meitu CLI Installation

| Symptom | Cause | Solution |
|------|------|------|
| `meitu: command not found` | CLI not installed or not in PATH | `npm install -g meitu-cli` |
| `npm: command not found` | Node.js not installed | Install Node.js (https://nodejs.org/) |
| Installed but version is outdated | Needs upgrade | `npm update -g meitu-cli` |

## Credentials

| Symptom | Cause | Solution |
|------|------|------|
| Authentication failed / 401 | Credentials not configured or expired | Reconfigure with `meitu config set-ak <AK>` and `meitu config set-sk <SK>` |

## Generation

| Symptom | Cause | Solution |
|------|------|------|
| `ok: false`, generation failed | Prompt triggered safety filter or parameter error | Adjust prompt content, check parameter format |
| Generation timeout | Server queue busy or request too large | Reduce resolution (`3k`→`2k` for image-generate; `2K`→`1K` for image-poster-generate) or simplify request |
| Generation succeeded but quality is poor | Resolution too low or prompt not specific enough | Increase `size` parameter, enrich prompt description |
| Generation succeeded but person doesn't look right | Reference image not passed correctly | Confirm `image_url` parameter is not empty |
| `media_urls` is empty | Result retrieval failed | Query task status using `result_id` |

## Effect Mode

| Symptom | Cause | Solution |
|------|------|------|
| `unsupported command` | Command name misspelled | Check that the command name is among the 13 supported commands (see models.md) |
| `input-json must be valid json object` | Invalid JSON format | Check quotes, commas, and other JSON syntax |
| `xxx is required` | Required parameter missing | Cross-reference the parameter table in `models.md` |
| `task wait timeout` | Async task timeout | Image-to-video / motion transfer take longer; use `meitu task wait <task_id>` to continue waiting |

## Common Prompt Issues

| Symptom | Cause | Solution |
|------|------|------|
| Garbled/misspelled text in image | Model text rendering is unstable | Wrap important text in quotes; overlay text in post-processing if necessary |
| Wrong gender in output | Gender not specified in prompt | Explicitly state gender in the prompt |
| Generated images all look the same | Prompt is too template-like | Add user-specific details, change composition angles |

## Retry Strategy

Follow the 5-level degradation defined in the main workflow (SKILL.md Execute section):

| Level | Action | Example |
|-------|--------|---------|
| L1 | Remove low-priority modifiers | Drop lighting/material descriptions, keep subject+scene+style |
| L2 | Downgrade enum parameters | `--size 3k` → `--size 2k` (image-generate); `--size 2K` → `--size 1K` (image-poster-generate); `--ratio 9:16` → `--ratio 1:1` |
| L3 | Remove optional inputs | Drop reference image, switch to text-to-image |
| L4 | Minimize to core elements | Keep only subject + style |
| L5 | Stop and report error | Show specific error message, suggest checking credentials or contacting support |

Escalate one level after 2 consecutive failures at the same level.
