# ADD_COMMAND

Add a new built-in command to `meitu-tools`.

## Steps

1. Edit `meitu-tools/scripts/run_command.js`.
2. Add command entry in `COMMAND_SPECS`.
3. Add aliases if needed:
- `COMMAND_ALIASES`
- `INPUT_KEY_ALIASES`
4. If command behavior depends on runtime updates, document env controls in `meitu-tools/SKILL.md` (`MEITU_AUTO_UPDATE`, `MEITU_UPDATE_CHECK_TTL_HOURS`, etc.).
5. Update `meitu-tools/SKILL.md` capability catalog.
6. Refresh manifest:

```bash
python3 scripts/build_aggregate_skill.py
```

7. Validate:

```bash
node meitu-tools/scripts/run_command.js --command <command_name> --input-json '{...}'
```
