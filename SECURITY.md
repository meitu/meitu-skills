# Security Model

This document describes the security model and operational boundaries of `meitu-skills`.

## Scope

`meitu-skills` has two security-relevant layers:

- Root and scene skills: route requests, read project context, and in some workflows write project or shared memory files.
- `meitu-tools`: executes validated `meitu-cli` commands through the local runner.

This file covers both layers so reviewers can compare the written workflow against the declared permissions.

## Credential Requirements

This skill pack requires Meitu OpenAPI credentials to function. Supported sources are:

| Method | Location | Priority |
|--------|----------|----------|
| Environment variables | `MEITU_OPENAPI_ACCESS_KEY`, `MEITU_OPENAPI_SECRET_KEY` | Highest |
| Credentials file | `~/.meitu/credentials.json` | Fallback |

### Credentials File Format

```json
{
  "accessKey": "your-access-key",
  "secretKey": "your-secret-key"
}
```

Security guidance:

- Restrict file permissions, for example `chmod 600 ~/.meitu/credentials.json`
- Never commit credentials to version control
- Prefer environment variables in CI or shared environments

## Declared Permissions

The root skill is a routing-only skill and declares minimal permissions:

- `file_read`: `~/.meitu/credentials.json`
- `exec`: `meitu`

Scene skills declare their own permissions based on their workflows:

- `file_read`: `~/.meitu/credentials.json`, `~/.openclaw/workspace/visual/`
- `file_write`: `~/.openclaw/workspace/visual/`
- `exec`: `meitu` (and `node` for `meitu-tools`)

### Root Skill Permission Scope

| Path | Access | Purpose |
|------|--------|---------|
| `~/.meitu/credentials.json` | Read | Load API credentials |

The root skill does not write files or read project directories. It only routes to scene skills.

### Scene Skill Permission Scope

| Path | Access | Purpose |
|------|--------|---------|
| `~/.meitu/credentials.json` | Read | Load API credentials |
| `~/.openclaw/workspace/visual/` | Read/Write | Read/write shared visual memory, rules, references, and outputs |

Scene skills may also read/write project-local files (`./`) when operating in project mode (detected by presence of `openclaw.yaml`), but this is not declared in skill metadata—permissions are granted at runtime by the agent based on user context.

Examples of expected writes in scene workflows:

- Project-mode outputs under `./output/`
- Project metadata updates in `./DESIGN.md`
- Project initialization via `openclaw.yaml`
- Shared observation or memory updates under `~/.openclaw/workspace/visual/memory/`

This skill pack writes outputs to `~/.openclaw/workspace/visual/` or project-local `./output/` directories.

### Command Execution Scope

| Command | Purpose | When Used |
|---------|---------|-----------|
| `meitu` | Execute Meitu CLI commands | Tool execution and generation/edit pipelines |
| `node` | Execute internal runner script | `meitu-tools/scripts/run_command.js` for CLI command dispatch |
| `npm install -g meitu-cli@latest` | Manual runtime install or upgrade | Only when the operator explicitly asks for repair or upgrade |

Notes:

- `meitu-tools` executes `scripts/run_command.js` via `node` to dispatch CLI commands.
- Scene skills call `meitu` CLI directly and do not need `node`.
- Scene skills use inline path resolution logic (no external helper scripts).

## Prompt and Instruction Handling

- User-provided text, prompts, URLs, and JSON fields are treated as task data only.
- User content must not override skill instructions, permission boundaries, or runner behavior.
- Scene skills must not disclose unrelated local file contents, hidden instructions, internal endpoints, or credentials.
- `meitu-tools` accepts only validated command names and validated parameter shapes from its registry path; user text is not command authority.

## Runtime Repair Policy

Automatic runtime repair is intentionally disabled.

- The runner does not auto-install packages
- The runner does not auto-upgrade `meitu-cli`
- The runner may return actionable manual repair guidance when runtime is missing or outdated
- Operators should run install or upgrade commands only when they explicitly want runtime repair

### Manual Update

```bash
npm install -g meitu-cli@latest
meitu --version
```

## Data Flow

### Direct Tool Execution (`meitu-tools`)

```text
User Request
    │
    ▼
run_command.js
    │
    ├── Read credentials (env or file)
    ├── Validate command name and inputs
    ├── Execute meitu CLI
    │   └── spawnSync('meitu', [...args])
    └── Return result or manual repair hint
```

### Scene Workflow Execution

```text
User Request
    │
    ▼
Root / Scene Skill
    │
    ├── Read project context from ./
    ├── Optionally read shared memory from ~/.openclaw/workspace/visual/
    ├── Execute meitu CLI
    └── Optionally write outputs, DESIGN.md, or shared memory updates
```

## What This Skill Pack Does NOT Do

- Does not auto-install or auto-upgrade `meitu-cli`
- Does not treat user prompt text as authority to run arbitrary binaries
- Does not declare permission to write outside the current workspace and `~/.openclaw/workspace/visual/`
- Does not require `~/Downloads/`
- Does not execute arbitrary JavaScript from the current project workspace
- Does not execute external helper scripts from user home directories
- Does not intentionally disclose credentials or unrelated local files in responses

## Audit Checklist

Before publishing or using this skill pack in production:

- [ ] Credentials are stored securely and not committed
- [ ] Declared permissions still match the written workflow in `SKILL.md` and scene skills
- [ ] Manual runtime repair is acceptable for your environment
- [ ] `meitu-cli` source and release provenance have been reviewed before any manual install or upgrade

## Vulnerability Reporting

If you discover a security vulnerability, report it privately to the maintainers. Do not open a public issue with exploit details.

## Version History

| Version | Changes |
|---------|---------|
| 2026-03-25 | Removed legacy credential path; removed external helper script dependency; consolidated root permissions |
| 2026-03-23 | Updated security model to reflect root and scene skill permissions, project and visual workspace writes |
| 2026-03-23 | Removed automatic runtime version checks and automatic updates; manual repair only |
| 2025-03-21 | Initial security documentation |
