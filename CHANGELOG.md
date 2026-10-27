# Changelog

## 0.1.0 (2026-10-26)

- Initial release.
- CLI: `calcport calculate "<expression>"` evaluates an arithmetic
  expression; `calcport add|subtract|multiply|divide <a> <b>` run a
  single operation. Both forms accept `--json`.
- MCP server (`calcport mcp`, stdio) with five tools: `calculate`,
  `add`, `subtract`, `multiply`, and `divide`.
- The expression evaluator is a hand-written recursive-descent parser —
  no `eval`, no `Function` constructor. It supports `+ - * / % ^`,
  parentheses, unary minus, the functions `sqrt`, `abs`, `floor`,
  `ceil`, `round`, and the constants `pi` and `e`. Division and modulo
  by zero are errors.
