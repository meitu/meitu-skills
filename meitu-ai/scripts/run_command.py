import argparse
import json
import os
import re
import shlex
import shutil
import subprocess
from pathlib import Path


def _normalize_lookup_key(value: str) -> str:
    return str(value or "").strip().lower()


COMMAND_SPECS = {
    "video-motion-transfer": {
        "required_keys": ["image_url", "video_url", "prompt"],
        "optional_keys": [],
        "array_keys": [],
    },
    "image-edit": {
        "required_keys": ["image", "prompt"],
        "optional_keys": ["size", "output_format", "ratio"],
        "array_keys": ["image"],
    },
    "image-generate": {
        "required_keys": ["prompt"],
        "optional_keys": ["image", "size"],
        "array_keys": ["image"],
    },
    "image-upscale": {
        "required_keys": ["image"],
        "optional_keys": ["model_type"],
        "array_keys": [],
    },
    "image-virtual-tryon": {
        "required_keys": ["clothes_image_url", "person_image_url"],
        "optional_keys": ["replace", "need_sd"],
        "array_keys": [],
    },
    "image-to-video": {
        "required_keys": ["image", "prompt"],
        "optional_keys": ["video_duration", "ratio"],
        "array_keys": ["image"],
    },
    "image-face-swap": {
        "required_keys": ["head_image_url", "sence_image_url", "prompt"],
        "optional_keys": [],
        "array_keys": [],
    },
    "image-cutout": {
        "required_keys": ["image"],
        "optional_keys": ["model_type"],
        "array_keys": [],
    },
}

COMMAND_ALIASES = {
    # Chinese trigger names
    "动作迁移": "video-motion-transfer",
    "图片编辑": "image-edit",
    "图片生成": "image-generate",
    "图片超清": "image-upscale",
    "试衣": "image-virtual-tryon",
    "图生视频": "image-to-video",
    "换头像": "image-face-swap",
    "抠图": "image-cutout",
    # Extra short aliases
    "edit": "image-edit",
    "generate": "image-generate",
    "upscale": "image-upscale",
    "virtual-tryon": "image-virtual-tryon",
    "face-swap": "image-face-swap",
    "cutout": "image-cutout",
    "motion-transfer": "video-motion-transfer",
}

INPUT_KEY_ALIASES = {
    "video-motion-transfer": {
        "image": "image_url",
        "图片": "image_url",
        "图片url": "image_url",
        "图片链接": "image_url",
        "video": "video_url",
        "视频": "video_url",
        "视频url": "video_url",
        "视频链接": "video_url",
        "提示词": "prompt",
        "描述": "prompt",
    },
    "image-edit": {
        "image_url": "image",
        "image_list": "image",
        "图片": "image",
        "图片url": "image",
        "图片链接": "image",
        "提示词": "prompt",
        "描述": "prompt",
        "尺寸": "size",
        "分辨率": "size",
        "格式": "output_format",
        "输出格式": "output_format",
        "比例": "ratio",
        "画幅": "ratio",
    },
    "image-generate": {
        "image_url": "image",
        "image_list": "image",
        "参考图": "image",
        "参考图片": "image",
        "提示词": "prompt",
        "描述": "prompt",
        "尺寸": "size",
        "分辨率": "size",
    },
    "image-upscale": {
        "image_url": "image",
        "图片": "image",
        "图片url": "image",
        "图片链接": "image",
        "模型": "model_type",
    },
    "image-virtual-tryon": {
        "clothes_url": "clothes_image_url",
        "clothes": "clothes_image_url",
        "衣服图": "clothes_image_url",
        "衣服图片": "clothes_image_url",
        "衣服图片url": "clothes_image_url",
        "person_url": "person_image_url",
        "person": "person_image_url",
        "人物图": "person_image_url",
        "人物图片": "person_image_url",
        "人像图": "person_image_url",
    },
    "image-to-video": {
        "image_url": "image",
        "图片": "image",
        "图片url": "image",
        "图片链接": "image",
        "提示词": "prompt",
        "描述": "prompt",
        "时长": "video_duration",
        "比例": "ratio",
        "画幅": "ratio",
    },
    "image-face-swap": {
        "head_url": "head_image_url",
        "头像图": "head_image_url",
        "头图": "head_image_url",
        "源脸图": "head_image_url",
        "scene_image_url": "sence_image_url",
        "目标图": "sence_image_url",
        "场景图": "sence_image_url",
        "底图": "sence_image_url",
        "提示词": "prompt",
        "描述": "prompt",
    },
    "image-cutout": {
        "image_url": "image",
        "图片": "image",
        "图片url": "image",
        "图片链接": "image",
        "模型": "model_type",
    },
}

COMMAND_ALIAS_LOOKUP = {}
for _canonical_command in COMMAND_SPECS.keys():
    _key = _normalize_lookup_key(_canonical_command)
    if _key:
        COMMAND_ALIAS_LOOKUP[_key] = _canonical_command
    _underscore = _normalize_lookup_key(_canonical_command.replace("-", "_"))
    if _underscore:
        COMMAND_ALIAS_LOOKUP[_underscore] = _canonical_command
for _alias, _target in COMMAND_ALIASES.items():
    _key = _normalize_lookup_key(_alias)
    if _key:
        COMMAND_ALIAS_LOOKUP[_key] = _target


def _resolve_command_alias(command: str) -> str:
    key = _normalize_lookup_key(command)
    resolved = COMMAND_ALIAS_LOOKUP.get(key)
    if not resolved or resolved not in COMMAND_SPECS:
        raise RuntimeError(f"unsupported command: {command}")
    return resolved


def _normalize_input_aliases(command: str, user_input: dict) -> dict:
    spec = COMMAND_SPECS.get(command) or {}
    required_keys = list(spec.get("required_keys") or [])
    optional_keys = list(spec.get("optional_keys") or [])
    known_keys = required_keys + optional_keys

    alias_lookup: dict = {}
    for key in known_keys:
        alias_lookup[_normalize_lookup_key(key)] = key

    for alias, canonical in (INPUT_KEY_ALIASES.get(command) or {}).items():
        if canonical in known_keys:
            alias_lookup[_normalize_lookup_key(alias)] = canonical

    mapped: dict = {}
    source: dict = {}
    for raw_key, value in user_input.items():
        raw_key_text = str(raw_key)
        lookup_key = _normalize_lookup_key(raw_key_text)
        canonical_key = alias_lookup.get(lookup_key, raw_key_text)

        if canonical_key in mapped:
            prev_source = source.get(canonical_key, canonical_key)
            raise RuntimeError(f"duplicate input key mapped to {canonical_key}: {prev_source}, {raw_key_text}")

        mapped[canonical_key] = value
        source[canonical_key] = raw_key_text

    return mapped


def _load_openapi_credentials_from_file() -> dict:
    cred_path = Path.home() / ".openapi" / "credentials.json"
    if not cred_path.is_file():
        return {}
    try:
        payload = json.loads(cred_path.read_text(encoding="utf-8"))
    except Exception:
        return {}

    ak = str(payload.get("accessKey") or "").strip()
    sk = str(payload.get("secretKey") or "").strip()
    if not ak or not sk:
        return {}

    return {
        "OPENAPI_ACCESS_KEY": ak,
        "OPENAPI_SECRET_KEY": sk,
    }


def build_env() -> dict:
    env = dict(os.environ)
    has_ak = str(env.get("OPENAPI_ACCESS_KEY") or "").strip()
    has_sk = str(env.get("OPENAPI_SECRET_KEY") or "").strip()
    if has_ak and has_sk:
        return env

    bridged = _load_openapi_credentials_from_file()
    if bridged:
        env.update(bridged)
    return env


def resolve_cli_command_prefix() -> list[str]:
    override = str(os.getenv("MEITU_AI_CMD") or "").strip()
    if override:
        parts = shlex.split(override)
        if parts:
            return parts

    found = shutil.which("meitu")
    if found:
        return [found]

    fallback = Path.home() / "Library" / "Python" / "3.11" / "bin" / "meitu"
    if fallback.is_file():
        return [str(fallback)]

    raise RuntimeError("meitu command not found; install runtime first")


def _run_meitu(command_args: list[str], env: dict) -> subprocess.CompletedProcess:
    cli_prefix = resolve_cli_command_prefix()
    return subprocess.run(cli_prefix + command_args, capture_output=True, text=True, env=env)


def _parse_task_wait_timeout(stderr: str) -> str:
    text = str(stderr or "").strip()
    if not text:
        return ""
    match = re.search(r"task wait timeout:\s*([A-Za-z0-9_-]+)", text)
    if not match:
        return ""
    return str(match.group(1) or "").strip()


def _env_int(name: str, default_value: int, min_value: int = 1) -> int:
    raw = str(os.getenv(name) or "").strip()
    if not raw:
        return default_value
    try:
        parsed = int(raw)
    except Exception:
        return default_value
    return max(parsed, min_value)


def _require_non_empty_string(value, field_name: str) -> str:
    text = str(value or "").strip()
    if not text:
        raise RuntimeError(f"{field_name} is required")
    return text


def _normalize_scalar(value, field_name: str) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    return _require_non_empty_string(value, field_name)


def _validate_input(command: str, user_input: dict) -> dict:
    spec = COMMAND_SPECS.get(command)
    if not spec:
        raise RuntimeError(f"unsupported command: {command}")

    required_keys = list(spec.get("required_keys") or [])
    optional_keys = list(spec.get("optional_keys") or [])
    array_keys = set(spec.get("array_keys") or [])

    known_keys = set(required_keys + optional_keys)
    unknown = [key for key in user_input.keys() if key not in known_keys]
    if unknown:
        raise RuntimeError(f"unsupported input keys: {unknown}")

    for key in required_keys:
        if key not in user_input or user_input.get(key) in (None, "", []):
            raise RuntimeError(f"{key} is required")

    normalized: dict = {}
    for key in required_keys + optional_keys:
        if key not in user_input or user_input.get(key) is None:
            continue
        value = user_input.get(key)
        if key in array_keys:
            if not isinstance(value, list) or not value:
                raise RuntimeError(f"{key} must be a non-empty array")
            normalized[key] = [_require_non_empty_string(item, key) for item in value]
        else:
            normalized[key] = _normalize_scalar(value, key)

    return normalized


def _build_cli_args(command: str, normalized_input: dict) -> list[str]:
    spec = COMMAND_SPECS[command]
    args = [command]
    for key in list(spec.get("required_keys") or []) + list(spec.get("optional_keys") or []):
        if key not in normalized_input:
            continue
        value = normalized_input[key]
        args.append(f"--{key}")
        if isinstance(value, list):
            args.extend(value)
        else:
            args.append(value)
    args.append("--json")
    return args


def _extract_media_urls(payload: dict) -> list[str]:
    urls: list[str] = []
    seen: set[str] = set()

    def add(value) -> None:
        text = str(value or "").strip()
        if not text or text in seen:
            return
        seen.add(text)
        urls.append(text)

    for item in payload.get("media_urls") or []:
        add(item)

    data = payload.get("data") or {}
    result = data.get("result") or {}

    for item in result.get("media_info_list", []):
        if isinstance(item, dict):
            add(item.get("media_data"))

    for item in result.get("urls", []):
        add(item)

    add(result.get("url"))
    add(payload.get("url"))
    return urls


def _extract_task_id(payload: dict) -> str:
    task_id = str(payload.get("task_id") or "").strip()
    if task_id:
        return task_id

    data = payload.get("data") or {}
    task_id = str(data.get("task_id") or "").strip()
    if task_id:
        return task_id

    result = data.get("result") or {}
    return str(result.get("id") or "").strip()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run meitu built-in command with validated input JSON.")
    parser.add_argument("--command", required=True, help="built-in meitu command")
    parser.add_argument("--input-json", required=True, help="input object json")
    return parser


def main() -> int:
    args = build_parser().parse_args()

    command_raw = str(args.command or "").strip()
    if not command_raw:
        print(json.dumps({"ok": False, "error": "command is required"}, ensure_ascii=False))
        return 2

    resolved_command = command_raw

    try:
        resolved_command = _resolve_command_alias(command_raw)
    except Exception as exc:
        print(json.dumps({"ok": False, "command": command_raw, "error": str(exc)}, ensure_ascii=False))
        return 2

    try:
        user_input = json.loads(args.input_json)
    except Exception:
        print(json.dumps({"ok": False, "error": "input-json must be valid json object"}, ensure_ascii=False))
        return 2

    if not isinstance(user_input, dict):
        print(json.dumps({"ok": False, "error": "input-json must be json object"}, ensure_ascii=False))
        return 2

    try:
        user_input = _normalize_input_aliases(resolved_command, user_input)
        normalized_input = _validate_input(resolved_command, user_input)
        cmd_args = _build_cli_args(resolved_command, normalized_input)

        env = build_env()
        res = _run_meitu(cmd_args, env)
        stdout = (res.stdout or "").strip()
        stderr = (res.stderr or "").strip()

        if not stdout:
            timeout_task_id = _parse_task_wait_timeout(stderr)
            if timeout_task_id:
                wait_timeout_ms = _env_int("MEITU_TASK_WAIT_TIMEOUT_MS", 900000)
                wait_interval_ms = _env_int("MEITU_TASK_WAIT_INTERVAL_MS", 2000)
                wait_args = [
                    "task",
                    "wait",
                    timeout_task_id,
                    "--interval-ms",
                    str(wait_interval_ms),
                    "--timeout-ms",
                    str(wait_timeout_ms),
                    "--json",
                ]
                wait_res = _run_meitu(wait_args, env)
                wait_stdout = (wait_res.stdout or "").strip()
                wait_stderr = (wait_res.stderr or "").strip()
                if wait_stdout:
                    res = wait_res
                    stdout = wait_stdout
                    if wait_stderr:
                        stderr = f"{stderr}\\n{wait_stderr}".strip()

        if not stdout:
            if "invalid choice" in stderr:
                stderr = (
                    "current meitu runtime does not include built-in commands; "
                    "please use meitu-ai >= 0.1.2"
                )
            print(
                json.dumps(
                    {
                        "ok": False,
                        "command": resolved_command,
                        "error": stderr or "empty cli output",
                        "exit_code": res.returncode,
                    },
                    ensure_ascii=False,
                )
            )
            return 1

        try:
            payload = json.loads(stdout)
        except Exception:
            print(
                json.dumps(
                    {
                        "ok": False,
                        "command": resolved_command,
                        "error": "invalid cli json output",
                        "exit_code": res.returncode,
                        "stdout": stdout,
                        "stderr": stderr,
                    },
                    ensure_ascii=False,
                )
            )
            return 1

        ok = bool(payload.get("ok", False))
        if "ok" not in payload:
            ok = res.returncode == 0 and payload.get("code") == 0

        output = {
            "ok": ok,
            "command": resolved_command,
            "task_id": _extract_task_id(payload),
            "media_urls": _extract_media_urls(payload),
            "result": payload,
        }
        if not ok:
            output["exit_code"] = res.returncode
            if stderr:
                output["stderr"] = stderr

        print(json.dumps(output, ensure_ascii=False))
        return 0 if ok else 1

    except Exception as exc:
        print(json.dumps({"ok": False, "command": resolved_command, "error": str(exc)}, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
