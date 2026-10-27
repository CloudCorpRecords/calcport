# calcport — Build Report

MCP Rebuild 100, Tier A. Clean-room rebuild of the "calculator" MCP
server, built from the docs-derived tool spec in
`harness/fixtures/calculator-tools-original.json` only (fixture `_source`
states docs-derived, not hand-probed). Local build only — nothing
pushed or published.

Identity: repo `calcport`, npm `@reneturcios/calcport`,
MCP name `io.github.CloudCorpRecords/calcport`, version `0.1.0`.

## Files created (19/19 per TEMPLATE.md checklist)

- `package.json` — bin `calcport: dist/cli.js`, `mcpName` set,
  scripts build=`tsc` / dev=`tsx src/cli.ts` / test=`tsx --test test/*.test.ts`
- `server.json` — description "Safe arithmetic: evaluate expressions and
  add, subtract, multiply, divide." = **74 chars** (≤100 ✓); npm entry
  carries `version: 0.1.0`; OCI entry
  `ghcr.io/cloudcorprecords/calcport:0.1.0` carries **no** `version`
  field (verified programmatically)
- `Dockerfile` — node:20-alpine two-stage, ENTRYPOINT
  `node /app/dist/cli.js`, CMD `mcp`, label
  `io.modelcontextprotocol.server.name="io.github.CloudCorpRecords/calcport"`
- `tsconfig.json` (identical to clockport's), `.gitignore`,
  `LICENSE` (MIT, Copyright (c) 2026 Rene Turcios), `README.md` (fresh
  text), `CHANGELOG.md` (single 0.1.0 entry, 2026-10-26)
- `src/index.ts`, `src/cli.ts` (`mcp`, `calculate "<expr>"`,
  `add|subtract|multiply|divide <a> <b>`, `--version`; exit 2 usage /
  1 calculation error), `src/mcp.ts`, `src/types.ts`, `src/calc.ts`
  (core logic, `VERSION = "0.1.0"`)
- `test/calc.test.ts`
- `.github/workflows/{ci,publish,publish-container,registry-publish}.yml`
  (copied from clockport; image name and smoke-test server name changed)

## Implementation notes

- The expression evaluator is a hand-written recursive-descent parser —
  no `eval`, no `Function` constructor. Grammar covers numbers
  (including exponent form), `+ - * / % ^` (`^` right-associative),
  parentheses, unary minus/plus, the functions `sqrt`, `abs`, `floor`,
  `ceil`, `round`, and the constants `pi` and `e`. Division and modulo
  by zero are errors; unknown names and trailing characters are errors
  naming the position.
- `src/mcp.ts` uses the SDK's low-level `Server` following clockport's
  verified pattern (still `@modelcontextprotocol/sdk`, zod still
  validates every `tools/call`): `McpServer`'s zod-to-JSON-Schema
  conversion injects `$schema` / `additionalProperties` keys absent
  from the spec, which caps parity below 100. The low-level server
  serves `tools/list` with the spec's exact input schemas.

## Verification (exact outputs)

### 1. Build
```
$ ./node_modules/.bin/tsc ; echo exit=$?
calcport tsc exit=0
```
`dist/` produced (cli.js, calc.js, mcp.js, index.js, types.js, plus
.d.ts/.js.map); `dist/cli.js` exists.

### 2. Tests
```
$ ./node_modules/.bin/tsx --test test/*.test.ts
ℹ tests 9
ℹ pass 9
ℹ fail 0
```
Covers: operator precedence, right-associative powers, unary minus,
functions and constants, trimmed-expression echo, division/modulo by
zero, malformed and code-like input rejection, the four binary
operations, and non-finite operand rejection.

### 3. CLI + MCP smoke
`calculate "sqrt(3^2+4^2)"` -> `5`; `add 2 3` -> `5`;
`divide 7 2` -> `3.5`; `--version` -> `0.1.0`; `divide 1 0` exits 1
with "Division by zero"; unknown command exits 2 with Usage. MCP
tools/list and tools/call were exercised live by the parity harness
(stdio, below).

### 4. Parity (harness, from ~/workspace/mcp-rebuild-100/harness/)
```
$ python3 parity.py --original fixtures/calculator-tools-original.json \
    --rebuild "stdio:node /home/hatch/workspace/mcp-rebuild-100/builds/calcport/dist/cli.js mcp" \
    --out /home/hatch/workspace/mcp-rebuild-100/builds/calcport/parity-out
verdict=PASS parity_pct=100.0 original_tools=5 rebuild_tools=5 missing=[] extra=[] schema_diffs=[]
(exit 0)
```

## Lockfile status

**Clean lockfile regen required before publish.** `package-lock.json`
was copied from clockport's and edited with the file edit tool only:
top-level `name`, root package `name`, and root package `bin` key
changed clockport -> calcport (dependency ranges are identical, so
the tree is unchanged). Per the fleet lesson in TEMPLATE.md §2 item 6,
a lockfile must be generated clean (no `node_modules` present) before
first publish — do not publish from this lockfile as-is.
`node_modules` in this build dir is a `cp -a` copy of clockport's
(local build only, gitignored).

## Blockers

None for the local build. Notes for the publish wave:
- Regenerate `package-lock.json` clean before first publish (above).
- Container build not exercised locally; the publish-container
  workflow smoke-tests the image at publish time.
