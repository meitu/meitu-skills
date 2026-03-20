# ADD_COMMAND

Add a new built-in command into the base tool skill (`meitu-ai`).

## Steps

1. Edit `meitu-ai/scripts/run_command.py`.
2. Add or update one command entry in `COMMAND_SPECS`.
3. Define only user input keys:
- `required_keys`
- `optional_keys`
- `array_keys`
4. Update `meitu-ai/SKILL.md` command list.
5. Validate with a minimal run:

```bash
python3 meitu-ai/scripts/run_command.py \
  --command <command_name> \
  --input-json '{...}'
```

## Input principle

- Only expose keys users actually need to fill.
- Do not expose internal routing details in documents.

## Optional: Add a scenario skill

If this command needs business-context packaging, add a scenario skill:
- `<scenario-name>/SKILL.md`
- call `../meitu-ai/scripts/run_command.py` from that scenario.
