# calcport

calcport does arithmetic safely. Its centrepiece is an expression
evaluator that understands the usual operators, parentheses, a handful
of functions, and the constants `pi` and `e` — and nothing else. The
evaluator is a hand-written parser, so an expression can never turn
into code execution, a shell call, or a property lookup. Around it sit
four single-purpose operations for callers that just need one sum,
difference, product, or quotient.

## Install

```bash
npx @reneturcios/calcport calculate "2+3*4"
```

Or run the container image:

```bash
docker run -i ghcr.io/cloudcorprecords/calcport
```

The container defaults to the MCP server (see below). Pass CLI
arguments to use it as a CLI instead.

## CLI

```bash
# Evaluate an expression
calcport calculate "sqrt(3^2 + 4^2) + pi"
# 8.141592653589793

# Single operations
calcport add 2 3          # 5
calcport subtract 10 4    # 6
calcport multiply 2.5 4   # 10
calcport divide 7 2       # 3.5

# Machine-readable output
calcport calculate "2^10" --json
calcport add 2 3 --json

calcport --version
```

Expressions may use `+ - * / % ^`, parentheses, unary minus, the
functions `sqrt`, `abs`, `floor`, `ceil`, and `round`, and the
constants `pi` and `e`. `^` is right-associative, so `2^3^2` is 512.

Exit codes: `0` on success, `1` when a calculation cannot be done
(division by zero, a malformed expression — the error says why), `2`
for usage errors.

## MCP server

One bin serves both faces. The `mcp` subcommand starts a stdio MCP
server:

```bash
npx -y @reneturcios/calcport mcp
```

MCP client configuration:

```json
{
  "mcpServers": {
    "calcport": {
      "command": "npx",
      "args": ["-y", "@reneturcios/calcport", "mcp"]
    }
  }
}
```

### Tools

| Tool | Input | What it returns |
| --- | --- | --- |
| `calculate` | `expression` (string, required) | The numeric result of the expression, with the expression echoed back. |
| `add` | `a`, `b` (numbers, required) | `a + b`, with both operands. |
| `subtract` | `a`, `b` (numbers, required) | `a - b`, with both operands. |
| `multiply` | `a`, `b` (numbers, required) | `a * b`, with both operands. |
| `divide` | `a`, `b` (numbers, required) | `a / b`, with both operands. Dividing by zero is an error. |

## Development

```bash
npm install
npm run build   # tsc -> dist/
npm test        # node test runner over test/*.test.ts, no network
npm run dev     # run the CLI from source via tsx
```

## License

MIT — see `LICENSE`.
