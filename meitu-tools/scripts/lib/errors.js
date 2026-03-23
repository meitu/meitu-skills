"use strict";

/**
 * Error classification, hint generation, and URL getters for user-facing error messages.
 */

const ORDER_ERROR_CODES = new Set([80001, 80002]);
const AUTH_ERROR_CODES = new Set([90002, 90003, 90005]);
const PARAM_ERROR_CODES = new Set([10000, 90000, 90001, 21101, 21102, 21103, 21104, 21105]);
const INPUT_RESOURCES_ERROR_CODES = new Set([10025]);
const OUTPUT_RESOURCES_ERROR_CODES = new Set([10026]);
const TEXT_RESOURCES_ERROR_CODES = new Set([10027]);
const ROUTE_ERROR_CODES = new Set([90025]);
const IMAGE_URL_ERROR_CODES = new Set([10003, 21201, 21202, 21203, 21204, 21205]);
const CONTENT_REQUIREMENTS_ERROR_CODES = new Set([98501]);
const TEMP_ERROR_CODES = new Set([415, 500, 502, 503, 504, 599, 10002, 10015, 29904, 29905, 90009, 90020, 90021, 90022, 90023, 90099]);
const STATIC_PRICING_URL = "https://www.miraclevision.com/open-claw/pricing";

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
  return String(
    process.env.MEITU_ORDER_URL ||
      process.env.OPENAPI_ORDER_URL ||
      "https://www.miraclevision.com/open-claw/pricing"
  ).trim();
}

function consoleUrl() {
  return String(
    process.env.MEITU_CONSOLE_URL ||
      process.env.OPENAPI_CONSOLE_URL ||
      "https://www.miraclevision.com/open-claw/pricing"
  ).trim();
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

function payloadActionUrl(payload) {
  const direct = String(payload?.action_url || "").trim();
  if (direct) {
    return direct;
  }
  return String(payload?.action?.url || "").trim();
}

function defaultActionLabel(errorType) {
  const normalizedType = String(errorType || "").trim();
  if (!normalizedType) {
    return "";
  }
  if (normalizedType === "ORDER_REQUIRED") {
    return "充值入口";
  }
  if (normalizedType === "QPS_LIMIT") {
    return "扩容入口";
  }
  if (normalizedType === "ACCOUNT_SUSPENDED") {
    return "申诉入口";
  }
  if (normalizedType === "AUTH_ERROR" || normalizedType === "CREDENTIALS_MISSING") {
    return "前往官网";
  }
  return "处理入口";
}

function buildActionFields(actionUrl, errorType, actionLabel = "") {
  const normalizedUrl = String(actionUrl || "").trim();
  if (!normalizedUrl) {
    return {};
  }
  const label = String(actionLabel || defaultActionLabel(errorType) || "查看详情").trim();
  return {
    action_url: normalizedUrl,
    action_label: label,
    action_link: `[${label}](${STATIC_PRICING_URL})`,
  };
}

function buildErrorHint({ errorCode = null, errorName = "", httpStatus = null, message = "" } = {}) {
  const normalizedName = String(errorName || "").trim();
  const normalizedMessage = String(message || "").trim();
  const text = `${normalizedName} ${normalizedMessage}`.toLowerCase();
  const downloadLikeText = includesAny(text, [
    "download",
    "image_download_failed",
    "invalid_url_error",
    "下载图片失败",
    "无效链接",
  ]);
  const contentViolationText = includesAny(text, [
    "涉黄",
    "色情",
    "porn",
    "nsfw",
    "adult content",
    "unsafe content",
    "内容违规",
    "内容不合规",
    "policy violation",
  ]);

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
      next_action: "请先前往官网获取并配置 AK/SK，或写入本地凭证文件后重试。",
      action_url: consoleUrl(),
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
    ROUTE_ERROR_CODES.has(errorCode) ||
    includesAny(text, ["gateway_route_data_not_found", "route data not found", "路由数据不存在", "路由缺失"])
  ) {
    hint = {
      error_type: "ROUTE_DATA_NOT_FOUND",
      user_hint: "网关路由数据不存在或未生效，当前能力可能尚未正确发布。",
      next_action: "请检查路由配置与生效状态，并确认当前账号已开通该能力后重试。",
    };
  } else if (
    AUTH_ERROR_CODES.has(errorCode) ||
    [401, 403].includes(httpStatus) ||
    includesAny(text, ["authorized", "unauthorized", "invalid token", "鉴权", "无效的令牌"])
  ) {
    hint = {
      error_type: "AUTH_ERROR",
      user_hint: "鉴权失败，AK/SK 或授权状态异常。",
      next_action: "请前往官网检查 AK/SK、应用状态和授权配置后重试。",
      action_url: consoleUrl(),
    };
  } else if (
    (INPUT_RESOURCES_ERROR_CODES.has(errorCode) && contentViolationText) ||
    includesAny(text, ["content_error", "内容违规", "内容不合规", "unsafe content", "policy violation"])
  ) {
    hint = {
      error_type: "CONTENT_ERROR",
      user_hint: "输入内容审核失败，不符合接口要求。",
      next_action: "请更换符合接口要求的图片/视频/文本内容后重试。",
    };
  } else if (
    INPUT_RESOURCES_ERROR_CODES.has(errorCode) ||
    includesAny(text, ["invalid input resources", "非法资源，输入"])
  ) {
    hint = {
      error_type: "INVALID_INPUT_RESOURCES",
      user_hint: "输入资源审核失败，不符合接口要求。",
      next_action: "请检查输入图片/视频/文本的格式、大小、可访问性及内容是否符合接口要求。",
    };
  } else if (
    OUTPUT_RESOURCES_ERROR_CODES.has(errorCode) ||
    includesAny(text, ["invalid output resources", "非法资源，输出"])
  ) {
    hint = {
      error_type: "INVALID_OUTPUT_RESOURCES",
      user_hint: "输出资源不符合接口要求。",
      next_action: "请检查输出格式、保存约束和目标资源配置后重试。",
    };
  } else if (
    TEXT_RESOURCES_ERROR_CODES.has(errorCode) ||
    includesAny(text, ["invalid text resources", "非法资源，文本"])
  ) {
    hint = {
      error_type: "INVALID_TEXT_RESOURCES",
      user_hint: "文本资源不符合接口要求。",
      next_action: "请检查文本长度、格式和内容要求后重试。",
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
    (CONTENT_REQUIREMENTS_ERROR_CODES.has(errorCode) && !downloadLikeText) ||
    includesAny(text, [
      "content_requirements_unmet",
      "内容主体不符合要求",
      "content subject does not meet requirements",
    ])
  ) {
    hint = {
      error_type: "CONTENT_REQUIREMENTS_UNMET",
      user_hint: "98501:内容主体不符合要求",
      next_action: "请更换符合当前能力要求的图片主体后重试；如使用 image-beauty-enhance，请提供清晰的单人人像图。",
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

  const output = removeEmptyFields({
    ...hint,
    error_code: errorCode,
    error_name: normalizedName,
  });
  return removeEmptyFields({
    ...output,
    ...buildActionFields(output.action_url, output.error_type),
  });
}

function hintFromCliPayload(payload, stderr = "") {
  const cliActionUrl = payloadActionUrl(payload);
  const directHint = removeEmptyFields({
    error_type: payload?.error_type,
    error_code: parseNumberCode(payload?.error_code),
    error_name: payload?.error_name,
    user_hint: payload?.user_hint,
    next_action: payload?.next_action,
    ...buildActionFields(cliActionUrl, payload?.error_type, payload?.action_label),
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
  const builtHint = buildErrorHint({
    errorCode: codeFromPayload !== null ? codeFromPayload : inferErrorCodeFromText(stderr),
    errorName: nameFromPayload,
    httpStatus,
    message: `${messageFromPayload}\n${stderr}`.trim(),
  });
  // CLI 有 action_url 直接用，否则用 runner 静态兜底 URL
  const { action_url: hintUrl, ...builtHintWithoutUrl } = builtHint;
  const resolvedUrl = cliActionUrl || hintUrl || STATIC_PRICING_URL;
  return removeEmptyFields({
    ...builtHintWithoutUrl,
    ...buildActionFields(resolvedUrl, builtHint.error_type, payload?.action_label),
  });
}

module.exports = {
  buildErrorHint,
  hintFromCliPayload,
  inferErrorCodeFromText,
};
