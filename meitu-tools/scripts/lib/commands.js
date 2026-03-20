"use strict";

/**
 * Unified command registry — reads generated commands-data.json (from tools-ssot/tools.yaml).
 *
 * Export interface is 100% backward-compatible with the original inline version.
 * Consumers (run_command.js, input.js, executor.js) require zero changes.
 */

const rawData = require("./commands-data.json");

const REGISTRY = Object.freeze(
  Object.fromEntries(
    Object.entries(rawData).map(([k, v]) => [k, Object.freeze(v)])
  )
);

const ALL_COMMAND_NAMES = Object.freeze(Object.keys(REGISTRY));

// Derived views — backward-compatible with the old inline data structures.

const COMMAND_SPECS = Object.freeze(
  Object.fromEntries(
    ALL_COMMAND_NAMES.map((name) => {
      const entry = REGISTRY[name];
      return [
        name,
        {
          requiredKeys: entry.requiredKeys,
          optionalKeys: entry.optionalKeys,
          arrayKeys: entry.arrayKeys,
        },
      ];
    })
  )
);

const COMMAND_ALIASES = Object.freeze(
  Object.fromEntries(
    ALL_COMMAND_NAMES.flatMap((name) => {
      const entry = REGISTRY[name];
      return (entry.commandAliases || []).map((alias) => [alias, name]);
    })
  )
);

const INPUT_KEY_ALIASES = Object.freeze(
  Object.fromEntries(
    ALL_COMMAND_NAMES.filter((name) => {
      const entry = REGISTRY[name];
      return entry.inputAliases && Object.keys(entry.inputAliases).length > 0;
    }).map((name) => [name, REGISTRY[name].inputAliases])
  )
);

function normalizeLookupKey(value) {
  return String(value || "").trim().toLowerCase();
}

function buildCommandAliasLookup() {
  const lookup = {};
  for (const commandName of ALL_COMMAND_NAMES) {
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

module.exports = {
  REGISTRY,
  ALL_COMMAND_NAMES,
  COMMAND_SPECS,
  COMMAND_ALIASES,
  INPUT_KEY_ALIASES,
  normalizeLookupKey,
  resolveCommandAlias,
};
