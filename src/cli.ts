#!/usr/bin/env node
/**
 * calcport CLI.
 *
 *   calcport calculate "<expression>" [--json]
 *   calcport add <a> <b> [--json]
 *   calcport subtract <a> <b> [--json]
 *   calcport multiply <a> <b> [--json]
 *   calcport divide <a> <b> [--json]
 *   calcport mcp
 *
 * Exit codes: 0 success, 1 calculation error, 2 usage error.
 */
import { add, calculate, divide, multiply, subtract, VERSION } from "./calc.js";
import type { BinaryResult, CalculateResult } from "./types.js";

function usage(): never {
  console.error(`Usage:
  calcport calculate "<expression>" [--json]
  calcport add <a> <b> [--json]
  calcport subtract <a> <b> [--json]
  calcport multiply <a> <b> [--json]
  calcport divide <a> <b> [--json]
  calcport mcp
  calcport --version`);
  process.exit(2);
}

function numberArg(raw: string | undefined): number {
  if (raw === undefined) usage();
  const value = Number(raw);
  if (!Number.isFinite(value)) usage();
  return value;
}

async function main(): Promise<void> {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === "--version" || cmd === "-v") {
    console.log(VERSION);
    return;
  }
  if (cmd === "mcp") {
    await import("./mcp.js");
    return;
  }
  if (!cmd) usage();
  const asJson = rest.includes("--json");
  const args = rest.filter((a) => a !== "--json");
  try {
    if (cmd === "calculate") {
      const expression = args.join(" ");
      if (!expression) usage();
      const result: CalculateResult = calculate(expression);
      if (asJson) console.log(JSON.stringify(result, null, 2));
      else console.log(String(result.result));
    } else if (cmd === "add" || cmd === "subtract" || cmd === "multiply" || cmd === "divide") {
      const a = numberArg(args[0]);
      const b = numberArg(args[1]);
      const fn = { add, subtract, multiply, divide }[cmd];
      const result: BinaryResult = fn(a, b);
      if (asJson) console.log(JSON.stringify(result, null, 2));
      else console.log(String(result.result));
    } else {
      usage();
    }
  } catch (err) {
    console.error(`error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

void main();
