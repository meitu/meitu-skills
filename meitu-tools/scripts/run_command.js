#!/usr/bin/env node
"use strict";

const { resolveCommandAlias } = require("./lib/commands");
const { buildErrorHint, hintFromCliPayload, inferErrorCodeFromText } = require("./lib/errors");
const { normalizeInputAliases, validateInput, buildEnv } = require("./lib/input");
const {
  VIDEO_COMMANDS,
  envInt,
  runMeitu,
  buildCliArgs,
  extractMediaUrls,
  extractTaskId,
  parseTaskWaitTimeout,
} = require("./lib/executor");
const {
  DEFAULT_TASK_WAIT_TIMEOUT_MS,
  DEFAULT_VIDEO_TASK_WAIT_TIMEOUT_MS,
  maybeLazyUpdate,
  mergeUpdateReports,
  looksLikeRuntimeMismatch,
} = require("./lib/updater");

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
