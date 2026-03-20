"use strict";

/**
 * Lazy runtime update: version check, install, state persistence.
 */

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { runProcess, runMeitu, envBool, envInt } = require("./executor");

const SEMVER_PATTERN = /\b(\d+)\.(\d+)\.(\d+)\b/;
const DEFAULT_UPDATE_TTL_HOURS = 24;
const DEFAULT_UPDATE_CHANNEL = "latest";
const DEFAULT_UPDATE_PACKAGE = "meitu-ai";
const DEFAULT_TASK_WAIT_TIMEOUT_MS = 900000;
const DEFAULT_VIDEO_TASK_WAIT_TIMEOUT_MS = 600000;

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

module.exports = {
  DEFAULT_TASK_WAIT_TIMEOUT_MS,
  DEFAULT_VIDEO_TASK_WAIT_TIMEOUT_MS,
  maybeLazyUpdate,
  mergeUpdateReports,
  looksLikeRuntimeMismatch,
};
