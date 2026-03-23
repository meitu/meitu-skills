"use strict";

/**
 * Runtime compatibility helpers and task-wait defaults.
 */

const DEFAULT_TASK_WAIT_TIMEOUT_MS = 900000;
const DEFAULT_VIDEO_TASK_WAIT_TIMEOUT_MS = 600000;

function looksLikeRuntimeMismatch(stderr) {
  const text = String(stderr || "").toLowerCase();
  const patterns = [
    "invalid choice",
    "unknown command",
    "command not found",
    "enoent",
    "current meitu runtime does not include built-in commands",
  ];
  return patterns.some((pattern) => text.includes(pattern));
}

module.exports = {
  DEFAULT_TASK_WAIT_TIMEOUT_MS,
  DEFAULT_VIDEO_TASK_WAIT_TIMEOUT_MS,
  looksLikeRuntimeMismatch,
};
