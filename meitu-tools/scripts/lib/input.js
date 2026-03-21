"use strict";

/**
 * Input normalization, alias resolution, validation, and credential loading.
 */

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { COMMAND_SPECS, INPUT_KEY_ALIASES, normalizeLookupKey } = require("./commands");

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

function loadOpenapiCredentialsFromFile() {
  const paths = [
    path.join(os.homedir(), ".meitu", "credentials.json"),
    path.join(os.homedir(), ".openapi", "credentials.json"),
  ];
  for (const credPath of paths) {
    try {
      const raw = fs.readFileSync(credPath, "utf8");
      const payload = JSON.parse(raw);
      const ak = String(payload.accessKey || "").trim();
      const sk = String(payload.secretKey || "").trim();
      if (ak && sk) {
        return { MEITU_OPENAPI_ACCESS_KEY: ak, MEITU_OPENAPI_SECRET_KEY: sk };
      }
    } catch {
      // continue to next path
    }
  }
  return {};
}

function buildEnv() {
  const env = { ...process.env };
  const hasAk = String(env.MEITU_OPENAPI_ACCESS_KEY || "").trim();
  const hasSk = String(env.MEITU_OPENAPI_SECRET_KEY || "").trim();
  if (hasAk && hasSk) {
    return env;
  }

  const bridged = loadOpenapiCredentialsFromFile();
  return { ...env, ...bridged };
}

module.exports = {
  normalizeInputAliases,
  validateInput,
  buildEnv,
};
