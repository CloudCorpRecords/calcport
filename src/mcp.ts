/**
 * calcport MCP server. Tools: calculate, add, subtract, multiply, divide.
 *
 * Why the low-level Server instead of McpServer: the high-level helper
 * converts zod schemas to JSON Schema and injects two keys that are not
 * in this tool's public spec ("$schema" and "additionalProperties"),
 * which breaks exact tool-list/schema parity with the spec. This file
 * therefore serves tools/list with the spec's exact input schemas,
 * while zod still validates every tools/call argument set. Tool names,
 * parameters, and parameter descriptions are taken from the public spec.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { add, calculate, divide, multiply, subtract, VERSION } from "./calc.js";

const CalculateArgs = z.object({
  expression: z.string().describe("Arithmetic expression to evaluate"),
});

const BinaryArgs = z.object({
  a: z.number(),
  b: z.number(),
});

const TOOLS = [
  {
    name: "calculate",
    description: "Evaluate an arithmetic expression and return its numeric result.",
    inputSchema: {
      type: "object" as const,
      properties: {
        expression: { type: "string", description: "Arithmetic expression to evaluate" },
      },
      required: ["expression"],
    },
  },
  {
    name: "add",
    description: "Add two numbers and return their sum.",
    inputSchema: {
      type: "object" as const,
      properties: {
        a: { type: "number", description: "First addend" },
        b: { type: "number", description: "Second addend" },
      },
      required: ["a", "b"],
    },
  },
  {
    name: "subtract",
    description: "Subtract the second number from the first and return the difference.",
    inputSchema: {
      type: "object" as const,
      properties: {
        a: { type: "number", description: "Number to subtract from" },
        b: { type: "number", description: "Number to subtract" },
      },
      required: ["a", "b"],
    },
  },
  {
    name: "multiply",
    description: "Multiply two numbers and return their product.",
    inputSchema: {
      type: "object" as const,
      properties: {
        a: { type: "number", description: "First factor" },
        b: { type: "number", description: "Second factor" },
      },
      required: ["a", "b"],
    },
  },
  {
    name: "divide",
    description: "Divide the first number by the second and return the quotient.",
    inputSchema: {
      type: "object" as const,
      properties: {
        a: { type: "number", description: "Dividend" },
        b: { type: "number", description: "Divisor" },
      },
      required: ["a", "b"],
    },
  },
];

function textResult(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

function errorResult(err: unknown) {
  return {
    content: [
      { type: "text" as const, text: err instanceof Error ? err.message : String(err) },
    ],
    isError: true,
  };
}

const server = new Server(
  { name: "calcport", version: VERSION },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    if (name === "calculate") {
      const parsed = CalculateArgs.parse(args ?? {});
      return textResult(calculate(parsed.expression));
    }
    if (name === "add") {
      const parsed = BinaryArgs.parse(args ?? {});
      return textResult(add(parsed.a, parsed.b));
    }
    if (name === "subtract") {
      const parsed = BinaryArgs.parse(args ?? {});
      return textResult(subtract(parsed.a, parsed.b));
    }
    if (name === "multiply") {
      const parsed = BinaryArgs.parse(args ?? {});
      return textResult(multiply(parsed.a, parsed.b));
    }
    if (name === "divide") {
      const parsed = BinaryArgs.parse(args ?? {});
      return textResult(divide(parsed.a, parsed.b));
    }
  } catch (err) {
    return errorResult(err);
  }
  throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
});

async function main(): Promise<void> {
  await server.connect(new StdioServerTransport());
}

void main();
