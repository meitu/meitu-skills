#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const SEMVER_PATTERN = /\b(\d+)\.(\d+)\.(\d+)\b/;
const DEFAULT_UPDATE_TTL_HOURS = 24;
const DEFAULT_UPDATE_CHANNEL = "latest";
const DEFAULT_UPDATE_PACKAGE = "meitu-ai";
const DEFAULT_TASK_WAIT_TIMEOUT_MS = 900000;
const DEFAULT_VIDEO_TASK_WAIT_TIMEOUT_MS = 600000;
const VIDEO_COMMANDS = new Set(["image-to-video", "video-motion-transfer"]);
const ORDER_ERROR_CODES = new Set([80001, 80002]);
const AUTH_ERROR_CODES = new Set([90002, 90003, 90005]);
const PARAM_ERROR_CODES = new Set([10000, 90000, 90001, 21101, 21102, 21103, 21104, 21105]);
const IMAGE_URL_ERROR_CODES = new Set([10003, 21201, 21202, 21203, 21204, 21205]);
const TEMP_ERROR_CODES = new Set([415, 500, 502, 503, 504, 599, 10002, 10015, 29904, 29905, 90009, 90020, 90021, 90022, 90023, 90099]);

const COMMAND_SPECS = {
  "video-motion-transfer": {
    requiredKeys: ["image_url", "video_url", "prompt"],
    optionalKeys: [],
    arrayKeys: [],
  },
  "image-edit": {
    requiredKeys: ["image", "prompt"],
    optionalKeys: ["size", "output_format", "ratio"],
    arrayKeys: ["image"],
  },
  "image-generate": {
    requiredKeys: ["prompt"],
    optionalKeys: ["image", "size"],
    arrayKeys: ["image"],
  },
  "image-upscale": {
    requiredKeys: ["image"],
    optionalKeys: ["model_type"],
    arrayKeys: [],
  },
  "image-virtual-tryon": {
    requiredKeys: ["clothes_image_url", "person_image_url"],
    optionalKeys: ["replace", "need_sd"],
    arrayKeys: [],
  },
  "image-to-video": {
    requiredKeys: ["image", "prompt"],
    optionalKeys: ["video_duration", "ratio"],
    arrayKeys: ["image"],
  },
  "image-face-swap": {
    requiredKeys: ["head_image_url", "sence_image_url", "prompt"],
    optionalKeys: [],
    arrayKeys: [],
  },
  "image-cutout": {
    requiredKeys: ["image"],
    optionalKeys: ["model_type"],
    arrayKeys: [],
  },
  "image-beauty-enhance": {
    requiredKeys: ["image"],
    optionalKeys: ["beatify_type"],
    arrayKeys: [],
  },
};

const COMMAND_ALIASES = {
  "动作迁移": "video-motion-transfer",
  "图片编辑": "image-edit",
  "图片生成": "image-generate",
  "图片超清": "image-upscale",
  "试衣": "image-virtual-tryon",
  "图生视频": "image-to-video",
  "换头像": "image-face-swap",
  "抠图": "image-cutout",
  "美颜增强": "image-beauty-enhance",
  edit: "image-edit",
  generate: "image-generate",
  upscale: "image-upscale",
  "virtual-tryon": "image-virtual-tryon",
  "face-swap": "image-face-swap",
  cutout: "image-cutout",
  "motion-transfer": "video-motion-transfer",
  "beauty-enhance": "image-beauty-enhance",
  beauty: "image-beauty-enhance",
};

const INPUT_KEY_ALIASES = {
  "video-motion-transfer": {
    image: "image_url",
    "图片": "image_url",
    "图片url": "image_url",
    "图片链接": "image_url",
    video: "video_url",
    "视频": "video_url",
    "视频url": "video_url",
    "视频链接": "video_url",
    "提示词": "prompt",
    "描述": "prompt",
  },
  "image-edit": {
    image_url: "image",
    image_list: "image",
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
    image_url: "image",
    image_list: "image",
    "参考图": "image",
    "参考图片": "image",
    "提示词": "prompt",
    "描述": "prompt",
    "尺寸": "size",
    "分辨率": "size",
  },
  "image-upscale": {
    image_url: "image",
    "图片": "image",
    "图片url": "image",
    "图片链接": "image",
    "模型": "model_type",
  },
  "image-virtual-tryon": {
    clothes_url: "clothes_image_url",
    clothes: "clothes_image_url",
    "衣服图": "clothes_image_url",
    "衣服图片": "clothes_image_url",
    "衣服图片url": "clothes_image_url",
    person_url: "person_image_url",
    person: "person_image_url",
    "人物图": "person_image_url",
    "人物图片": "person_image_url",
    "人像图": "person_image_url",
  },
  "image-to-video": {
    image_url: "image",
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
    head_url: "head_image_url",
    "头像图": "head_image_url",
    "头图": "head_image_url",
    "源脸图": "head_image_url",
    scene_image_url: "sence_image_url",
    "目标图": "sence_image_url",
    "场景图": "sence_image_url",
    "底图": "sence_image_url",
    "提示词": "prompt",
    "描述": "prompt",
  },
  "image-cutout": {
    image_url: "image",
    "图片": "image",
    "图片url": "image",
    "图片链接": "image",
    "模型": "model_type",
  },
  "image-beauty-enhance": {
    image_url: "image",
    "图片": "image",
    "图片url": "image",
    "图片链接": "image",
    beautify_type: "beatify_type",
    beauty_type: "beatify_type",
    "美颜模式": "beatify_type",
  },
};

function normalizeLookupKey(value) {
  return String(value || "").trim().toLowerCase();
}

function parseNumberCode(value) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return parsed;
}

function removeEmptyFields(obj) {
  return Object.fromEntries(
    Object.entries(obj || {}).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function orderUrl() {
  return String(process.env.MEITU_ORDER_URL || process.env.OPENAPI_ORDER_URL || "").trim();
}

function qpsOrderUrl() {
  return String(process.env.MEITU_QPS_ORDER_URL || orderUrl()).trim();
}

function accountAppealUrl() {
  return String(process.env.MEITU_ACCOUNT_APPEAL_URL || "").trim();
}

function inferErrorCodeFromText(text) {
  const match = String(text || "").match(/\b(8\d{4}|9\d{4}|1\d{4,5}|2\d{4,5})\b/);
  if (!match) {
    return null;
  }
  return parseNumberCode(match[1]);
}

function buildErrorHint({ errorCode = null, errorName = "", httpStatus = null, message = "" } = {}) {
  const normalizedName = String(errorName || "").trim();
  const normalizedMessage = String(message || "").trim();
  const text = `${normalizedName} ${normalizedMessage}`.toLowerCase();

  let hint = {
    error_type: "UNKNOWN_ERROR",
    user_hint: "请求失败，请稍后重试；若持续失败请联系平台支持。",
    next_action: "请稍后重试；若持续失败请提供 trace_id 或 request_id 给支持团队。",
  };

  if (errorCode === 91010 || text.includes("suspended")) {
    hint = {
      error_type: "ACCOUNT_SUSPENDED",
      user_hint: "账号当前处于封禁状态，无法继续调用。",
      next_action: "请先前往平台申请解封，解封后重试。",
      action_url: accountAppealUrl(),
    };
  } else if (
    includesAny(text, [
      "access key not found",
      "secret key not found",
      "missing ak",
      "missing sk",
      "ak/sk",
      "credentials",
      "凭证",
      "未配置 ak",
      "未配置 sk",
    ])
  ) {
    hint = {
      error_type: "CREDENTIALS_MISSING",
      user_hint: "未找到可用的 AK/SK 凭证，无法完成请求。",
      next_action: "请先配置 OPENAPI_ACCESS_KEY / OPENAPI_SECRET_KEY 或本地凭证文件后重试。",
    };
  } else if (
    ORDER_ERROR_CODES.has(errorCode) ||
    includesAny(text, [
      "rights_limit_exceeded",
      "order_limit_exceeded",
      "insufficient balance",
      "quota exceeded",
      "余额不足",
      "权益超出",
      "次数超出",
    ])
  ) {
    hint = {
      error_type: "ORDER_REQUIRED",
      user_hint: "当前权益或订单次数不足，暂时无法继续调用。",
      next_action: "请先下单/续费后重试。",
      action_url: orderUrl(),
    };
  } else if (
    errorCode === 90024 ||
    httpStatus === 429 ||
    includesAny(text, ["gateway_qps_limit", "qps", "rate limit", "too many requests", "并发过高"])
  ) {
    hint = {
      error_type: "QPS_LIMIT",
      user_hint: "当前请求频率超过限制。",
      next_action: "请稍后重试；如需更高 QPS，请联系商务购买扩容。",
      action_url: qpsOrderUrl(),
    };
  } else if (
    AUTH_ERROR_CODES.has(errorCode) ||
    [401, 403].includes(httpStatus) ||
    includesAny(text, ["authorized", "unauthorized", "invalid token", "鉴权", "无效的令牌"])
  ) {
    hint = {
      error_type: "AUTH_ERROR",
      user_hint: "鉴权失败，AK/SK 或授权状态异常。",
      next_action: "请检查 AK/SK、应用有效期和网关授权配置后重试。",
    };
  } else if (
    PARAM_ERROR_CODES.has(errorCode) ||
    httpStatus === 400 ||
    includesAny(text, ["invalid_parameter", "parameter_error", "param_error", "参数错误", "参数缺失"])
  ) {
    hint = {
      error_type: "PARAM_ERROR",
      user_hint: "请求参数不符合接口要求。",
      next_action: "请检查必填参数、参数类型和枚举取值后重试。",
    };
  } else if (
    IMAGE_URL_ERROR_CODES.has(errorCode) ||
    httpStatus === 424 ||
    includesAny(text, ["image_download_failed", "invalid_url_error", "下载图片失败", "无效链接"])
  ) {
    hint = {
      error_type: "IMAGE_URL_ERROR",
      user_hint: "输入图片地址不可访问或下载失败。",
      next_action: "请确认图片 URL 可公开访问且文件格式正确后重试。",
    };
  } else if (
    errorCode === 90009 ||
    errorCode === 10002 ||
    httpStatus === 599 ||
    includesAny(text, ["request_timeout", "timeout", "超时"])
  ) {
    hint = {
      error_type: "REQUEST_TIMEOUT",
      user_hint: "请求超时，服务暂时未完成处理。",
      next_action: "请稍后重试；必要时降低并发或缩小输入规模。",
    };
  } else if (
    TEMP_ERROR_CODES.has(errorCode) ||
    [415, 500, 502, 503, 504].includes(httpStatus) ||
    includesAny(text, ["internal", "algorithm_inner_error", "service unavailable", "算法内部异常", "资源不足"])
  ) {
    hint = {
      error_type: "TEMPORARY_UNAVAILABLE",
      user_hint: "服务暂时不可用或资源紧张。",
      next_action: "请稍后重试；若持续失败请联系支持团队。",
    };
  }

  return removeEmptyFields({
    ...hint,
    error_code: errorCode,
    error_name: normalizedName,
  });
}

function hintFromCliPayload(payload, stderr = "") {
  const directHint = removeEmptyFields({
    error_type: payload?.error_type,
    error_code: parseNumberCode(payload?.error_code),
    error_name: payload?.error_name,
    user_hint: payload?.user_hint,
    next_action: payload?.next_action,
    action_url: payload?.action_url,
  });
  if (directHint.error_type) {
    return directHint;
  }

  const codeFromPayload =
    parseNumberCode(payload?.error_code) ??
    parseNumberCode(payload?.code) ??
    inferErrorCodeFromText(payload?.message);
  const nameFromPayload = String(payload?.error_name || payload?.error || payload?.errorName || "").trim();
  const messageFromPayload = String(payload?.message || payload?.error || stderr || "").trim();
  const httpStatus = parseNumberCode(payload?.http_status);
  return buildErrorHint({
    errorCode: codeFromPayload !== null ? codeFromPayload : inferErrorCodeFromText(stderr),
    errorName: nameFromPayload,
    httpStatus,
    message: `${messageFromPayload}\n${stderr}`.trim(),
  });
}

function buildCommandAliasLookup() {
  const lookup = {};
  for (const commandName of Object.keys(COMMAND_SPECS)) {
    const key = normalizeLookupKey(commandName);
    if (key) {
      lookup[key] = commandName;
    }
    const underscore = normalizeLookupKey(commandName.replace(/-/g, "_"));
    if (underscore) {
      lookup[underscore] = commandName;
    }
  }
  for (const [alias, target] of Object.entries(COMMAND_ALIASES)) {
    const key = normalizeLookupKey(alias);
    if (key) {
      lookup[key] = target;
    }
  }
  return lookup;
}

const COMMAND_ALIAS_LOOKUP = buildCommandAliasLookup();

function resolveCommandAlias(command) {
  const key = normalizeLookupKey(command);
  const resolved = COMMAND_ALIAS_LOOKUP[key];
  if (!resolved || !COMMAND_SPECS[resolved]) {
    throw new Error(`unsupported command: ${command}`);
  }
  return resolved;
}

function normalizeInputAliases(command, userInput) {
  const spec = COMMAND_SPECS[command] || {};
  const requiredKeys = spec.requiredKeys || [];
  const optionalKeys = spec.optionalKeys || [];
  const knownKeys = [...requiredKeys, ...optionalKeys];

  const aliasLookup = {};
  for (const key of knownKeys) {
    aliasLookup[normalizeLookupKey(key)] = key;
  }

  const commandAliases = INPUT_KEY_ALIASES[command] || {};
  for (const [alias, canonical] of Object.entries(commandAliases)) {
    if (knownKeys.includes(canonical)) {
      aliasLookup[normalizeLookupKey(alias)] = canonical;
    }
  }

  const mapped = {};
  const source = {};
  for (const [rawKey, value] of Object.entries(userInput || {})) {
    const rawKeyText = String(rawKey);
    const lookupKey = normalizeLookupKey(rawKeyText);
    const canonicalKey = aliasLookup[lookupKey] || rawKeyText;
    if (Object.prototype.hasOwnProperty.call(mapped, canonicalKey)) {
      const prevSource = source[canonicalKey] || canonicalKey;
      throw new Error(`duplicate input key mapped to ${canonicalKey}: ${prevSource}, ${rawKeyText}`);
    }
    mapped[canonicalKey] = value;
    source[canonicalKey] = rawKeyText;
  }

  return mapped;
}

function loadOpenapiCredentialsFromFile() {
  const credPath = path.join(os.homedir(), ".openapi", "credentials.json");
  try {
    const raw = fs.readFileSync(credPath, "utf8");
    const payload = JSON.parse(raw);
    const ak = String(payload.accessKey || "").trim();
    const sk = String(payload.secretKey || "").trim();
    if (!ak || !sk) {
      return {};
    }
    return {
      OPENAPI_ACCESS_KEY: ak,
      OPENAPI_SECRET_KEY: sk,
    };
  } catch {
    return {};
  }
}

function buildEnv() {
  const env = { ...process.env };
  const hasAk = String(env.OPENAPI_ACCESS_KEY || "").trim();
  const hasSk = String(env.OPENAPI_SECRET_KEY || "").trim();
  if (hasAk && hasSk) {
    return env;
  }

  const bridged = loadOpenapiCredentialsFromFile();
  return { ...env, ...bridged };
}

function resolveCliCommandPrefix() {
  const override = String(process.env.MEITU_AI_CMD || "").trim();
  if (override) {
    const parts = override.split(/\s+/).filter(Boolean);
    if (parts.length) {
      return parts;
    }
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
    stderr = [stderr.trim(), String(proc.error.message).trim()].filter(Boolean).join("\n");
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
  const raw = String(process.env[name] || "").trim().toLowerCase();
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

function requireNonEmptyString(value, fieldName) {
  const text = String(value || "").trim();
  if (!text) {
    throw new Error(`${fieldName} is required`);
  }
  return text;
}

function normalizeScalar(value, fieldName) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`${fieldName} must be a finite number`);
    }
    return String(value);
  }
  return requireNonEmptyString(value, fieldName);
}

function validateInput(command, userInput) {
  const spec = COMMAND_SPECS[command];
  if (!spec) {
    throw new Error(`unsupported command: ${command}`);
  }

  const requiredKeys = [...(spec.requiredKeys || [])];
  const optionalKeys = [...(spec.optionalKeys || [])];
  const arrayKeys = new Set(spec.arrayKeys || []);

  const knownKeys = new Set([...requiredKeys, ...optionalKeys]);
  const unknownKeys = Object.keys(userInput).filter((key) => !knownKeys.has(key));
  if (unknownKeys.length) {
    throw new Error(`unsupported input keys: ${JSON.stringify(unknownKeys)}`);
  }

  for (const key of requiredKeys) {
    const value = userInput[key];
    if (value === undefined || value === null || value === "" || (Array.isArray(value) && !value.length)) {
      throw new Error(`${key} is required`);
    }
  }

  const normalized = {};
  for (const key of [...requiredKeys, ...optionalKeys]) {
    if (!Object.prototype.hasOwnProperty.call(userInput, key)) {
      continue;
    }
    const value = userInput[key];
    if (value === null || value === undefined) {
      continue;
    }
    if (arrayKeys.has(key)) {
      if (!Array.isArray(value) || !value.length) {
        throw new Error(`${key} must be a non-empty array`);
      }
      normalized[key] = value.map((item) => requireNonEmptyString(item, key));
    } else {
      normalized[key] = normalizeScalar(value, key);
    }
  }

  return normalized;
}

function buildCliArgs(command, normalizedInput) {
  const spec = COMMAND_SPECS[command];
  const args = [command];
  for (const key of [...(spec.requiredKeys || []), ...(spec.optionalKeys || [])]) {
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

function runtimeStatePath() {
  return path.join(os.homedir(), ".meitu", "runtime-update-state.json");
}

function loadRuntimeState() {
  const filePath = runtimeStatePath();
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const payload = JSON.parse(raw);
    if (!payload || typeof payload !== "object") {
      return {};
    }
    return payload;
  } catch {
    return {};
  }
}

function saveRuntimeState(payload) {
  try {
    const filePath = runtimeStatePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  } catch {
    // ignore state persistence errors
  }
}

function extractVersionFromText(text) {
  const value = String(text || "");
  const match = value.match(SEMVER_PATTERN);
  return match ? match[0] : "";
}

function parseSemverTuple(version) {
  const value = String(version || "").trim();
  if (!value) {
    return null;
  }
  const match = value.match(SEMVER_PATTERN);
  if (!match) {
    return null;
  }
  return [Number.parseInt(match[1], 10), Number.parseInt(match[2], 10), Number.parseInt(match[3], 10)];
}

function isNewerVersion(latest, current) {
  const latestTuple = parseSemverTuple(latest);
  const currentTuple = parseSemverTuple(current);
  if (latestTuple && currentTuple) {
    if (latestTuple[0] !== currentTuple[0]) {
      return latestTuple[0] > currentTuple[0];
    }
    if (latestTuple[1] !== currentTuple[1]) {
      return latestTuple[1] > currentTuple[1];
    }
    return latestTuple[2] > currentTuple[2];
  }

  const latestText = String(latest || "").trim();
  const currentText = String(current || "").trim();
  if (!latestText) {
    return false;
  }
  if (!currentText) {
    return true;
  }
  return latestText !== currentText;
}

function getInstalledVersion(env) {
  const proc = runMeitu(["--version"], env);
  const combinedText = `${proc.stdout || ""}\n${proc.stderr || ""}`;
  const version = extractVersionFromText(combinedText);
  if (version) {
    return { version, error: "" };
  }

  const message = String(proc.stderr || "").trim() || String(proc.error?.message || "").trim();
  return { version: "", error: message || `exit_code=${proc.returncode}` };
}

function fetchLatestVersion(packageName, channel, env) {
  const proc = runProcess(["npm"], ["view", `${packageName}@${channel}`, "version"], env, 30000);
  const combinedText = `${proc.stdout || ""}\n${proc.stderr || ""}`;
  const version = extractVersionFromText(combinedText);
  if (proc.returncode === 0 && version) {
    return { ok: true, version, error: "" };
  }
  const message = String(proc.stderr || "").trim() || String(proc.error?.message || "").trim();
  return { ok: false, version: "", error: message || "failed to query npm version" };
}

function installRuntimePackage(packageName, channel, env) {
  const proc = runProcess(["npm"], ["install", "-g", `${packageName}@${channel}`], env, 300000);
  if (proc.returncode === 0) {
    return { ok: true, error: "" };
  }
  let message = String(proc.stderr || "").trim() || String(proc.error?.message || "").trim();
  if (message.toLowerCase().includes("eexist")) {
    message = `${message}\nhint: existing binary conflict detected; run 'npm install -g ${packageName}@${channel} --force' if you want to override`;
  }
  return { ok: false, error: message || "npm install failed" };
}

function mergeUpdateReports(base, extra) {
  if (!extra) {
    return base;
  }
  if (!base) {
    return extra;
  }
  return {
    enabled: Boolean(base.enabled && extra.enabled),
    checked: Boolean(base.checked || extra.checked),
    updated: Boolean(base.updated || extra.updated),
    package: extra.package || base.package,
    channel: extra.channel || base.channel,
    reason: extra.reason || base.reason,
    from_version: extra.from_version || base.from_version,
    latest_version: extra.latest_version || base.latest_version,
    to_version: extra.to_version || base.to_version,
    error: extra.error || base.error,
  };
}

function maybeLazyUpdate(env, force = false, reason = "startup") {
  const enabled = envBool("MEITU_AUTO_UPDATE", true);
  const ttlHours = envInt("MEITU_UPDATE_CHECK_TTL_HOURS", DEFAULT_UPDATE_TTL_HOURS, 1);
  const channel = String(process.env.MEITU_UPDATE_CHANNEL || DEFAULT_UPDATE_CHANNEL).trim() || DEFAULT_UPDATE_CHANNEL;
  const packageName =
    String(process.env.MEITU_UPDATE_PACKAGE || DEFAULT_UPDATE_PACKAGE).trim() || DEFAULT_UPDATE_PACKAGE;

  const report = {
    enabled,
    checked: false,
    updated: false,
    package: packageName,
    channel,
    reason,
    from_version: "",
    latest_version: "",
    to_version: "",
    error: "",
  };

  if (!enabled) {
    return report;
  }

  const nowTs = Math.floor(Date.now() / 1000);
  const state = loadRuntimeState();
  const current = getInstalledVersion(env);
  report.from_version = current.version;

  const lastCheckTs = Number.parseInt(String(state.last_check_ts || "0"), 10) || 0;
  const ttlSec = ttlHours * 3600;
  const stale = nowTs - lastCheckTs >= ttlSec;
  const channelChanged = String(state.channel || "") !== channel;
  const packageChanged = String(state.package || "") !== packageName;
  const installedChanged = String(state.installed_version || "") !== String(current.version || "");

  const shouldCheck = force || !lastCheckTs || stale || channelChanged || packageChanged || installedChanged;
  if (!shouldCheck) {
    return report;
  }

  report.checked = true;

  const latest = fetchLatestVersion(packageName, channel, env);
  if (!latest.ok) {
    report.error = latest.error;
    saveRuntimeState({
      package: packageName,
      channel,
      installed_version: current.version || "",
      latest_version: String(state.latest_version || ""),
      last_check_ts: nowTs,
      last_error: latest.error,
    });
    return report;
  }

  report.latest_version = latest.version;
  const shouldInstall = force || !current.version || isNewerVersion(latest.version, current.version);

  if (!shouldInstall) {
    saveRuntimeState({
      package: packageName,
      channel,
      installed_version: current.version || "",
      latest_version: latest.version || "",
      last_check_ts: nowTs,
      last_error: "",
    });
    return report;
  }

  const installResult = installRuntimePackage(packageName, channel, env);
  if (!installResult.ok) {
    report.error = installResult.error;
    saveRuntimeState({
      package: packageName,
      channel,
      installed_version: current.version || "",
      latest_version: latest.version || "",
      last_check_ts: nowTs,
      last_error: installResult.error,
    });
    return report;
  }

  const refreshed = getInstalledVersion(env);
  report.updated = true;
  report.to_version = refreshed.version || latest.version;
  saveRuntimeState({
    package: packageName,
    channel,
    installed_version: report.to_version || "",
    latest_version: latest.version || "",
    last_check_ts: nowTs,
    last_error: refreshed.error || "",
  });

  return report;
}

function looksLikeRuntimeMismatch(stderr) {
  const text = String(stderr || "").toLowerCase();
  const patterns = [
    "invalid choice",
    "unknown command",
    "command not found",
    "current meitu runtime does not include built-in commands",
  ];
  return patterns.some((pattern) => text.includes(pattern));
}

function parseArgs(argv) {
  const args = { command: "", inputJson: "", help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "-h" || token === "--help") {
      args.help = true;
      continue;
    }
    if (token === "--command") {
      args.command = String(argv[i + 1] || "");
      i += 1;
      continue;
    }
    if (token === "--input-json") {
      args.inputJson = String(argv[i + 1] || "");
      i += 1;
      continue;
    }
    throw new Error(`unknown arg: ${token}`);
  }
  return args;
}

function printUsage() {
  process.stdout.write(
    [
      "usage: run_command.js --command <command> --input-json '<json object>'",
      "",
      "Run meitu built-in command with validated input JSON (Node.js runtime).",
      "",
      "Env toggles:",
      "  MEITU_AUTO_UPDATE=1|0                   default: 1",
      "  MEITU_UPDATE_CHECK_TTL_HOURS=<hours>    default: 24",
      "  MEITU_UPDATE_CHANNEL=<tag>              default: latest",
      "  MEITU_UPDATE_PACKAGE=<name>             default: meitu-ai",
      "  MEITU_ORDER_URL=<url>                   billing/order page for insufficient balance",
      "  MEITU_TASK_WAIT_TIMEOUT_MS=<ms>         default: 600000 for video, 900000 for others",
      "  MEITU_TASK_WAIT_INTERVAL_MS=<ms>        default: 2000",
    ].join("\n") + "\n"
  );
}

function main() {
  let parsed;
  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stdout.write(JSON.stringify({ ok: false, error: String(error.message || error) }) + "\n");
    return 2;
  }

  if (parsed.help) {
    printUsage();
    return 0;
  }

  const commandRaw = String(parsed.command || "").trim();
  if (!commandRaw) {
    process.stdout.write(JSON.stringify({ ok: false, error: "command is required" }) + "\n");
    return 2;
  }

  let resolvedCommand = commandRaw;
  try {
    resolvedCommand = resolveCommandAlias(commandRaw);
  } catch (error) {
    process.stdout.write(
      JSON.stringify({ ok: false, command: commandRaw, error: String(error.message || error) }, null, 0) + "\n"
    );
    return 2;
  }

  let userInput;
  try {
    userInput = JSON.parse(parsed.inputJson || "");
  } catch {
    process.stdout.write(JSON.stringify({ ok: false, error: "input-json must be valid json object" }) + "\n");
    return 2;
  }

  if (!userInput || typeof userInput !== "object" || Array.isArray(userInput)) {
    process.stdout.write(JSON.stringify({ ok: false, error: "input-json must be json object" }) + "\n");
    return 2;
  }

  try {
    const aliasedInput = normalizeInputAliases(resolvedCommand, userInput);
    const normalizedInput = validateInput(resolvedCommand, aliasedInput);
    const cmdArgs = buildCliArgs(resolvedCommand, normalizedInput);

    const env = buildEnv();
    let updateReport = maybeLazyUpdate(env, false, "startup");

    let result = runMeitu(cmdArgs, env);
    let stdout = String(result.stdout || "").trim();
    let stderr = String(result.stderr || "").trim();

    if (!stdout && looksLikeRuntimeMismatch(stderr)) {
      const forcedUpdate = maybeLazyUpdate(env, true, "compatibility_error");
      updateReport = mergeUpdateReports(updateReport, forcedUpdate);
      if (forcedUpdate.updated) {
        result = runMeitu(cmdArgs, env);
        stdout = String(result.stdout || "").trim();
        stderr = String(result.stderr || "").trim();
      }
    }

    if (!stdout) {
      const timeoutTaskId = parseTaskWaitTimeout(stderr);
      if (timeoutTaskId) {
        const defaultWaitTimeoutMs = VIDEO_COMMANDS.has(resolvedCommand)
          ? DEFAULT_VIDEO_TASK_WAIT_TIMEOUT_MS
          : DEFAULT_TASK_WAIT_TIMEOUT_MS;
        const waitTimeoutMs = envInt("MEITU_TASK_WAIT_TIMEOUT_MS", defaultWaitTimeoutMs, 1);
        const waitIntervalMs = envInt("MEITU_TASK_WAIT_INTERVAL_MS", 2000, 1);
        const waitArgs = [
          "task",
          "wait",
          timeoutTaskId,
          "--interval-ms",
          String(waitIntervalMs),
          "--timeout-ms",
          String(waitTimeoutMs),
          "--json",
        ];
        const waitResult = runMeitu(waitArgs, env);
        const waitStdout = String(waitResult.stdout || "").trim();
        const waitStderr = String(waitResult.stderr || "").trim();
        if (waitStdout) {
          result = waitResult;
          stdout = waitStdout;
          if (waitStderr) {
            stderr = [stderr, waitStderr].filter(Boolean).join("\n").trim();
          }
        }
      }
    }

    if (!stdout) {
      if (String(stderr || "").toLowerCase().includes("invalid choice")) {
        stderr = "current meitu runtime does not include built-in commands; please use meitu-ai >= 0.1.2";
      }
      const errorHint = buildErrorHint({
        errorCode: inferErrorCodeFromText(stderr),
        message: stderr,
      });
      const payload = {
        ok: false,
        command: resolvedCommand,
        error: stderr || "empty cli output",
        exit_code: result.returncode,
        ...errorHint,
      };
      if (updateReport.checked || updateReport.updated || updateReport.error) {
        payload.runtime_update = updateReport;
      }
      process.stdout.write(JSON.stringify(payload) + "\n");
      return 1;
    }

    let payload;
    try {
      payload = JSON.parse(stdout);
    } catch {
      const errorHint = buildErrorHint({
        errorCode: inferErrorCodeFromText(stderr),
        message: stderr || "invalid cli json output",
      });
      process.stdout.write(
        JSON.stringify({
          ok: false,
          command: resolvedCommand,
          error: "invalid cli json output",
          exit_code: result.returncode,
          stdout,
          stderr,
          ...errorHint,
        }) + "\n"
      );
      return 1;
    }

    let ok = Boolean(payload.ok);
    if (!Object.prototype.hasOwnProperty.call(payload, "ok")) {
      ok = result.returncode === 0 && Number(payload.code) === 0;
    }

    const output = {
      ok,
      command: resolvedCommand,
      task_id: extractTaskId(payload),
      media_urls: extractMediaUrls(payload),
      result: payload,
    };

    if (!ok) {
      output.exit_code = result.returncode;
      if (stderr) {
        output.stderr = stderr;
      }
      Object.assign(output, hintFromCliPayload(payload, stderr));
    }

    if (updateReport.checked || updateReport.updated || updateReport.error) {
      output.runtime_update = updateReport;
    }

    process.stdout.write(JSON.stringify(output) + "\n");
    return ok ? 0 : 1;
  } catch (error) {
    const errorHint = buildErrorHint({
      errorCode: inferErrorCodeFromText(error?.message),
      message: String(error?.message || ""),
    });
    process.stdout.write(
      JSON.stringify({
        ok: false,
        command: resolvedCommand,
        error: String(error.message || error),
        ...errorHint,
      }) + "\n"
    );
    return 1;
  }
}

process.exitCode = main();
