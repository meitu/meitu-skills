#!/usr/bin/env node
"use strict";

/**
 * Unified generator — reads tools-ssot/tools.yaml (the single source of truth)
 * and produces all downstream artifacts.
 *
 * Usage: node scripts/generate.js  (or: npm run generate)
 *
 * Outputs:
 *   meitu-tools/scripts/lib/commands-data.json  — CLI registry data
 *   meitu-tools/generated/manifest.json         — capability manifest
 *   meitu-tools/SKILL.md                        — capability catalog segment
 *   SKILL.md                                    — tool capability map segment
 *   tools-ssot/agent-descriptions.yaml          — agent-consumable descriptions
 *   tools-ssot/tools-overview.csv               — CSV overview
 *   tools-ssot/disambiguation-matrix.md         — disambiguation matrix
 */

const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

const ROOT = path.resolve(__dirname, "..");
const TOOLS_YAML = path.join(ROOT, "tools-ssot", "tools.yaml");

// ────────────────────────────────────────
// Load
// ────────────────────────────────────────

function loadToolsYaml() {
  const raw = fs.readFileSync(TOOLS_YAML, "utf8");
  const data = yaml.load(raw);
  return data.tools;
}

// ────────────────────────────────────────
// CLI pipeline (only tools with cli field)
// ────────────────────────────────────────

function getCliTools(tools) {
  return tools.filter((t) => t.cli);
}

function cliRegistryKey(tool) {
  return tool.cli.command || tool.id;
}

function generateCommandsData(cliTools) {
  const registry = {};
  for (const tool of cliTools) {
    const key = cliRegistryKey(tool);
    const cli = tool.cli;
    registry[key] = {
      requiredKeys: cli.requiredKeys || [],
      optionalKeys: cli.optionalKeys || [],
      arrayKeys: cli.arrayKeys || [],
      commandAliases: cli.commandAliases || [],
      inputAliases: cli.inputAliases || {},
    };
  }
  const outPath = path.join(
    ROOT,
    "meitu-tools",
    "scripts",
    "lib",
    "commands-data.json",
  );
  fs.writeFileSync(outPath, JSON.stringify(registry, null, 2) + "\n", "utf8");
  console.log(`wrote ${outPath} (${Object.keys(registry).length} commands)`);
}

function generateManifest(cliTools) {
  const capabilities = cliTools.map((t) => cliRegistryKey(t));
  const manifest = {
    generated: true,
    aggregated_skill: "meitu-tools",
    capabilities,
  };
  const outPath = path.join(ROOT, "meitu-tools", "generated", "manifest.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`wrote ${outPath} (${capabilities.length} commands)`);
}

// ────────────────────────────────────────
// SKILL.md segments
// ────────────────────────────────────────

const BEGIN_TAG = "<!-- BEGIN CAPABILITY_CATALOG -->";
const END_TAG = "<!-- END CAPABILITY_CATALOG -->";

function buildCapabilityCatalog(cliTools) {
  const lines = [];
  cliTools.forEach((tool, index) => {
    const key = cliRegistryKey(tool);
    const cli = tool.cli;
    const required = (cli.requiredKeys || []).map((k) => `\`${k}\``).join(", ");
    const optional = (cli.optionalKeys || []).length
      ? cli.optionalKeys.map((k) => `\`${k}\``).join(", ")
      : "none";
    lines.push(`${index + 1}. \`${key}\``);
    lines.push(`- required: ${required}`);
    lines.push(`- optional: ${optional}`);
    lines.push("");
  });
  return lines.join("\n").trimEnd();
}

const INTENT_MAP = {
  "video-motion-transfer": "Motion transfer",
  "image-edit": "Image edit",
  "image-generate": "Image generate",
  "image-upscale": "Image upscale",
  "image-try-on": "Virtual try-on",
  "image-to-video": "Image to video",
  "image-face-swap": "Face swap",
  "image-cutout": "Image cutout",
  "image-beauty-enhance": "Beauty enhancement",
  "text-to-video": "Text to video",
  "video-to-gif": "Video to GIF",
  "image-poster-generate": "Poster generate",
  "image-grid-split": "Grid split",
};

function buildToolCapabilityMap(cliTools) {
  return cliTools
    .map((tool) => {
      const key = cliRegistryKey(tool);
      const intent = INTENT_MAP[key] || key;
      return `- ${intent} -> \`${key}\``;
    })
    .join("\n");
}

function replaceSegment(filePath, beginTag, endTag, content) {
  if (!fs.existsSync(filePath)) {
    console.warn(`skip: ${filePath} not found`);
    return false;
  }
  const original = fs.readFileSync(filePath, "utf8");
  const startIdx = original.indexOf(beginTag);
  const endIdx = original.indexOf(endTag);
  if (startIdx === -1 || endIdx === -1) {
    console.warn(`skip: ${filePath} missing ${beginTag} / ${endTag} markers`);
    return false;
  }
  const before = original.substring(0, startIdx + beginTag.length);
  const after = original.substring(endIdx);
  const updated = `${before}\n${content}\n${after}`;
  if (updated === original) {
    console.log(`no change: ${filePath}`);
    return false;
  }
  fs.writeFileSync(filePath, updated, "utf8");
  console.log(`updated: ${filePath}`);
  return true;
}

function updateMeituToolsSkill(cliTools) {
  const filePath = path.join(ROOT, "meitu-tools", "SKILL.md");
  replaceSegment(
    filePath,
    BEGIN_TAG,
    END_TAG,
    buildCapabilityCatalog(cliTools),
  );
}

function updateRootSkill(cliTools) {
  const filePath = path.join(ROOT, "SKILL.md");
  replaceSegment(
    filePath,
    BEGIN_TAG,
    END_TAG,
    buildToolCapabilityMap(cliTools),
  );
}

// ────────────────────────────────────────
// Agent description pipeline (all tools)
// ────────────────────────────────────────

function buildAgentDescription(tool) {
  const parts = [];

  // summary
  parts.push(`<summary>${tool.summary}</summary>`);

  // input
  const inputStrs = [];
  for (const inp of tool.input) {
    let s = inp.type;
    if (inp.count) {
      s += ` ${inp.count}` + (inp.type.includes("image") ? "张" : "个");
    }
    if (inp.note) {
      s += `(${inp.note})`;
    }
    inputStrs.push(s);
  }
  parts.push(`<input>${inputStrs.join(" + ")}</input>`);

  // output
  const o = tool.output;
  let oStr = o.type;
  if (o.note) {
    oStr += `（${o.note}）`;
  }
  parts.push(`<o>${oStr}</o>`);

  // triggers — only for high-confusion tools with prefer_over
  if (tool.prefer_over && tool.triggers) {
    parts.push(`<triggers>${tool.triggers.join("；")}</triggers>`);
  }

  // params
  if (tool.params) {
    for (const p of tool.params) {
      const valuesStr = p.values.join("/");
      const rule = (p.selection_rule || "").trim();
      parts.push(
        `<param name="${p.name}" values="${valuesStr}" default="${p.default}">\n${rule}\n</param>`,
      );
    }
  }

  // constraints
  if (tool.constraints) {
    parts.push(`<constraints>${tool.constraints.join("；")}</constraints>`);
  }

  // prefer_over
  for (const po of tool.prefer_over || []) {
    parts.push(`<prefer_over tool="${po.tool}">${po.when}</prefer_over>`);
  }

  // not_for
  if (tool.not_for) {
    parts.push(`<not_for>${tool.not_for.join("；")}</not_for>`);
  }

  return parts.join("\n");
}

function generateAgentDescriptions(tools) {
  const blocks = [];
  for (const tool of tools) {
    const desc = buildAgentDescription(tool);
    const indented = desc
      .split("\n")
      .map((line) => `    ${line}`)
      .join("\n");
    blocks.push(
      `- tool: ${tool.id}\n` +
        `  name: ${tool.name}\n` +
        `  description: |\n` +
        indented,
    );
  }
  const content = blocks.join("\n\n\n");
  const outPath = path.join(ROOT, "tools-ssot", "agent-descriptions.yaml");
  fs.writeFileSync(outPath, content, "utf8");
  console.log(`wrote ${outPath} (${tools.length} tools)`);
}

// ────────────────────────────────────────
// CSV pipeline (all tools)
// ────────────────────────────────────────

function escapeCsvField(value) {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsvDescription(tool) {
  const parts = [tool.summary];

  // input
  const inputStrs = [];
  for (const inp of tool.input) {
    let s = inp.type;
    if (inp.count) {
      s += ` ${inp.count}`;
    }
    if (inp.note) {
      s += `(${inp.note})`;
    }
    inputStrs.push(s);
  }
  parts.push(`输入：${inputStrs.join(" + ")}`);

  // output
  const o = tool.output;
  let oStr = o.type;
  if (o.note) {
    oStr += `（${o.note}）`;
  }
  parts.push(`输出：${oStr}`);

  // params
  if (tool.params) {
    for (const p of tool.params) {
      const rule = (p.selection_rule || "").trim().replace(/\n/g, " ");
      parts.push(
        `${p.name}参数[${p.values.join("/")}，默认${p.default}]：${rule}`,
      );
    }
  }

  // constraints
  if (tool.constraints) {
    parts.push(`约束：${tool.constraints.join("；")}`);
  }

  // prefer_over
  for (const po of tool.prefer_over || []) {
    parts.push(`优先于${po.tool}的条件：${po.when}`);
  }

  // not_for
  if (tool.not_for) {
    parts.push(`不适用：${tool.not_for.join("；")}`);
  }

  return parts.join("。") + "。";
}

function generateCsv(tools) {
  const rows = [
    [
      escapeCsvField("功能名称"),
      escapeCsvField("命令名"),
      escapeCsvField("描述"),
    ].join(","),
  ];
  for (const tool of tools) {
    rows.push(
      [
        escapeCsvField(tool.name),
        escapeCsvField(tool.id),
        escapeCsvField(buildCsvDescription(tool)),
      ].join(","),
    );
  }
  const content = rows.join("\n") + "\n";
  const outPath = path.join(ROOT, "tools-ssot", "tools-overview.csv");
  fs.writeFileSync(outPath, content, "utf8");
  console.log(`wrote ${outPath} (${tools.length} rows)`);
}

// ────────────────────────────────────────
// Disambiguation matrix (all tools)
// ────────────────────────────────────────

function generateDisambiguationMatrix(tools) {
  const toolMap = {};
  for (const t of tools) {
    toolMap[t.id] = t.name;
  }

  const lines = [
    "# 消歧矩阵（自动生成，勿手动编辑）",
    `# 从 tools.yaml 的 prefer_over / not_for 字段提取`,
    `# 工具总数：${tools.length}`,
    "",
  ];

  // Part 1: prefer_over
  lines.push("## 工具优先级关系");
  lines.push("");
  lines.push("| 当前工具 | 优先于 | 选择条件 |");
  lines.push("|---|---|---|");
  for (const tool of tools) {
    for (const po of tool.prefer_over || []) {
      const current = `${tool.name}(${tool.id})`;
      const otherName = toolMap[po.tool] || po.tool;
      const other = `${otherName}(${po.tool})`;
      lines.push(`| ${current} | ${other} | ${po.when} |`);
    }
  }
  lines.push("");

  // Part 2: not_for
  lines.push("## 不适用场景转向表");
  lines.push("");
  lines.push("| 工具 | 不适用场景 | 转向 |");
  lines.push("|---|---|---|");
  for (const tool of tools) {
    for (const nf of tool.not_for || []) {
      const current = `${tool.name}(${tool.id})`;
      if (nf.includes("→")) {
        const [scenario, redirect] = nf.split("→", 2);
        lines.push(`| ${current} | ${scenario.trim()} | ${redirect.trim()} |`);
      } else {
        lines.push(`| ${current} | ${nf.trim()} | — |`);
      }
    }
  }
  lines.push("");

  // Part 3: call chains
  const chains = [];
  for (const tool of tools) {
    for (const nf of tool.not_for || []) {
      if (nf.includes("先") && nf.includes("再")) {
        chains.push(nf);
      }
    }
  }
  if (chains.length) {
    lines.push("## 常见调用链");
    lines.push("");
    for (const c of chains) {
      lines.push(`- ${c}`);
    }
    lines.push("");
  }

  const content = lines.join("\n");
  const outPath = path.join(ROOT, "tools-ssot", "disambiguation-matrix.md");
  fs.writeFileSync(outPath, content, "utf8");
  console.log(`wrote ${outPath}`);
}

// ────────────────────────────────────────
// Main
// ────────────────────────────────────────

const tools = loadToolsYaml();
const cliTools = getCliTools(tools);

// CLI pipeline
generateCommandsData(cliTools);
generateManifest(cliTools);
updateMeituToolsSkill(cliTools);
updateRootSkill(cliTools);

// Agent description pipeline
generateAgentDescriptions(tools);
generateCsv(tools);
generateDisambiguationMatrix(tools);

console.log("done.");
