"use strict";

/**
 * CLI invocation, argument building, and result extraction.
 */

const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { COMMAND_SPECS } = require("./commands");

const VIDEO_COMMANDS = new Set([
  "image-to-video",
  "video-motion-transfer",
  "text-to-video",
]);
const ALLOWED_COMMAND_BASENAMES = new Set(["meitu"]);

function envInt(name, defaultValue, minValue = 1) {
  const raw = String(process.env[name] || "").trim();
  if (!raw) {
    return defaultValue;
  }
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    return defaultValue;
  }
  return Math.max(parsed, minValue);
}

function envBool(name, defaultValue) {
  const raw = String(process.env[name] || "")
    .trim()
    .toLowerCase();
  if (!raw) {
    return defaultValue;
  }
  if (["1", "true", "yes", "y", "on"].includes(raw)) {
    return true;
  }
  if (["0", "false", "no", "n", "off"].includes(raw)) {
    return false;
  }
  return defaultValue;
}

function resolveCliCommandPrefix() {
  const override = String(process.env.MEITU_AI_CMD || "").trim();
  if (override) {
    const parts = override.split(/\s+/).filter(Boolean);
    const commandBase = path.basename(parts[0] || "");
    if (parts.length === 1 && ALLOWED_COMMAND_BASENAMES.has(commandBase)) {
      return parts;
    }
    console.warn(`[security] blocked MEITU_AI_CMD override: ${parts[0] || "<empty>"}`);
  }
  return ["meitu"];
}

function runProcess(prefix, args, env, timeoutMs = 0) {
  const proc = spawnSync(prefix[0], [...prefix.slice(1), ...args], {
    encoding: "utf8",
    env,
    timeout: timeoutMs > 0 ? timeoutMs : undefined,
  });

  const stdout = String(proc.stdout || "");
  let stderr = String(proc.stderr || "");
  if (proc.error && proc.error.message) {
    stderr = [stderr.trim(), String(proc.error.message).trim()]
      .filter(Boolean)
      .join("\n");
  }

  return {
    returncode: typeof proc.status === "number" ? proc.status : 1,
    stdout,
    stderr,
    error: proc.error || null,
  };
}

function runMeitu(commandArgs, env) {
  const cliPrefix = resolveCliCommandPrefix();
  return runProcess(cliPrefix, commandArgs, env);
}

function buildCliArgs(command, normalizedInput) {
  const spec = COMMAND_SPECS[command];
  const args = [command];
  for (const key of [
    ...(spec.requiredKeys || []),
    ...(spec.optionalKeys || []),
  ]) {
    if (!Object.prototype.hasOwnProperty.call(normalizedInput, key)) {
      continue;
    }
    args.push(`--${key}`);
    const value = normalizedInput[key];
    if (Array.isArray(value)) {
      args.push(...value);
    } else {
      args.push(value);
    }
  }
  args.push("--json");
  return args;
}

function extractMediaUrls(payload) {
  const urls = [];
  const seen = new Set();
  const add = (value) => {
    const text = String(value || "").trim();
    if (!text || seen.has(text)) {
      return;
    }
    seen.add(text);
    urls.push(text);
  };

  for (const item of payload.media_urls || []) {
    add(item);
  }

  const data = payload.data || {};
  const result = data.result || {};

  for (const item of result.media_info_list || []) {
    if (item && typeof item === "object") {
      add(item.media_data);
    }
  }

  for (const item of result.urls || []) {
    add(item);
  }

  add(result.url);
  add(payload.url);
  return urls;
}

function extractTaskId(payload) {
  const taskId = String(payload.task_id || "").trim();
  if (taskId) {
    return taskId;
  }
  const data = payload.data || {};
  const dataTaskId = String(data.task_id || "").trim();
  if (dataTaskId) {
    return dataTaskId;
  }
  const result = data.result || {};
  return String(result.id || "").trim();
}

function parseTaskWaitTimeout(text) {
  const normalized = String(text || "").trim();
  if (!normalized) {
    return "";
  }
  const match = normalized.match(/task wait timeout:\s*([A-Za-z0-9_-]+)/i);
  if (!match) {
    return "";
  }
  return String(match[1] || "").trim();
}

module.exports = {
  VIDEO_COMMANDS,
  envInt,
  envBool,
  runProcess,
  runMeitu,
  buildCliArgs,
  extractMediaUrls,
  extractTaskId,
  parseTaskWaitTimeout,
};
