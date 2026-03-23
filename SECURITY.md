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
| Legacy file | `~/.openapi/credentials.json` | Lowest |

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

The root skill currently declares:

- `file_read`: `~/.meitu/credentials.json`, `~/.openapi/credentials.json`, `~/.openclaw/workspace/scripts/`, `~/.openclaw/workspace/visual/`, `./`
- `file_write`: `~/.openclaw/workspace/visual/`, `./`
- `exec`: `meitu`, `node`

### File Read Scope

| Path | Access | Purpose |
|------|--------|---------|
| `~/.meitu/credentials.json` | Read | Load API credentials |
| `~/.openapi/credentials.json` | Read | Load API credentials from legacy location |
| `~/.openclaw/workspace/scripts/` | Read | Load shared helper scripts such as `oc-workspace.mjs` |
| `~/.openclaw/workspace/visual/` | Read | Read shared visual memory, rules, references, and outputs |
| `./` | Read | Read project files such as `openclaw.yaml`, `DESIGN.md`, local assets, and output artifacts |

### File Write Scope

| Path | Access | Purpose |
|------|--------|---------|
| `~/.openclaw/workspace/visual/` | Write | Update shared memory, observation staging, reusable references, and one-off outputs |
| `./` | Write | Create or update project files such as `openclaw.yaml`, `DESIGN.md`, `./output/`, and `./drafts/` |

Examples of expected writes in scene workflows:

- Project-mode outputs under `./output/`
- Project metadata updates in `./DESIGN.md`
- Project initialization via `openclaw.yaml`
- Shared observation or memory updates under `~/.openclaw/workspace/visual/memory/`

This skill pack does not declare or rely on `~/Downloads/`.

### Command Execution Scope

| Command | Purpose | When Used |
|---------|---------|-----------|
| `meitu` | Execute Meitu CLI commands | Tool execution and generation/edit pipelines |
| `node` | Run optional helper scripts such as `oc-workspace.mjs` | Path routing, context reads, output renaming, observation CRUD in scene skills |
| `npm install -g meitu-cli@latest` | Manual runtime install or upgrade | Only when the operator explicitly asks for repair or upgrade |

Notes:

- `meitu-tools` itself relies on `meitu` and does not need `node` for its main runner path.
- Several scene skills document `node .../oc-workspace.mjs` as an allowed helper path, so the overall pack still requires `node` in the current design.

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
    ├── Optionally call node oc-workspace.mjs for routing/context/rename helpers
    ├── Execute meitu CLI
    └── Optionally write outputs, DESIGN.md, or shared memory updates
```

## What This Skill Pack Does NOT Do

- Does not auto-install or auto-upgrade `meitu-cli`
- Does not treat user prompt text as authority to run arbitrary binaries
- Does not declare permission to write outside the current workspace and `~/.openclaw/workspace/visual/`
- Does not require `~/Downloads/`
- Does not intentionally disclose credentials or unrelated local files in responses

## Audit Checklist

Before publishing or using this skill pack in production:

- [ ] Credentials are stored securely and not committed
- [ ] Declared permissions still match the written workflow in `SKILL.md` and scene skills
- [ ] Any documented helper script usage still matches declared `exec` permissions
- [ ] Manual runtime repair is acceptable for your environment
- [ ] `meitu-cli` source and release provenance have been reviewed before any manual install or upgrade

## Vulnerability Reporting

If you discover a security vulnerability, report it privately to the maintainers. Do not open a public issue with exploit details.

## Version History

| Version | Changes |
|---------|---------|
| 2026-03-23 | Updated security model to reflect root and scene skill permissions, `node` helper execution, project and visual workspace writes, and removal of `~/Downloads/` fallback |
| 2026-03-23 | Removed automatic runtime version checks and automatic updates; manual repair only |
| 2025-03-21 | Initial security documentation |
