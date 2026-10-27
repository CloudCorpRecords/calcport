/**
 * calcport core: safe arithmetic.
 *
 * The expression evaluator is a hand-written recursive-descent parser.
 * It never calls eval or the Function constructor, so an expression can
 * only do arithmetic: numbers, the operators + - * / % ^, parentheses,
 * unary minus (and plus), the functions sqrt, abs, floor, ceil and
 * round, and the constants pi and e. Anything else is an error that
 * names the offending position.
 *
 * Grammar, lowest to highest precedence:
 *   expr    := term (("+" | "-") term)*
 *   term    := unary (("*" | "/" | "%") unary)*
 *   unary   := ("-" | "+") unary | power
 *   power   := primary ("^" unary)?        -- right-associative
 *   primary := number | constant | func "(" expr ")" | "(" expr ")"
 */
import type { BinaryResult, CalculateResult } from "./types.js";

export const VERSION = "0.1.0";

const FUNCTIONS: Record<string, (x: number) => number> = {
  sqrt: (x) => {
    if (x < 0) throw new Error(`sqrt of a negative number (${x})`);
    return Math.sqrt(x);
  },
  abs: Math.abs,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
};

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
};

function checkFinite(value: number, what: string): number {
  if (!Number.isFinite(value)) throw new Error(`Result of ${what} is not a finite number`);
  return value;
}

class Parser {
  private pos = 0;

  constructor(private readonly input: string) {}

  parse(): number {
    const value = this.parseExpr();
    this.skipSpace();
    if (this.pos < this.input.length) {
      throw new Error(
        `Unexpected character '${this.input[this.pos]}' at position ${this.pos} in expression '${this.input}'`,
      );
    }
    return checkFinite(value, `'${this.input}'`);
  }

  private skipSpace(): void {
    while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) this.pos++;
  }

  private peek(): string {
    this.skipSpace();
    return this.pos < this.input.length ? this.input[this.pos] : "";
  }

  private parseExpr(): number {
    let value = this.parseTerm();
    for (;;) {
      const op = this.peek();
      if (op !== "+" && op !== "-") return value;
      this.pos++;
      const rhs = this.parseTerm();
      value = op === "+" ? value + rhs : value - rhs;
    }
  }

  private parseTerm(): number {
    let value = this.parseUnary();
    for (;;) {
      const op = this.peek();
      if (op !== "*" && op !== "/" && op !== "%") return value;
      this.pos++;
      const rhs = this.parseUnary();
      if ((op === "/" || op === "%") && rhs === 0) {
        throw new Error(op === "/" ? "Division by zero" : "Modulo by zero");
      }
      value = op === "*" ? value * rhs : op === "/" ? value / rhs : value % rhs;
    }
  }

  private parseUnary(): number {
    const op = this.peek();
    if (op === "-") {
      this.pos++;
      return -this.parseUnary();
    }
    if (op === "+") {
      this.pos++;
      return this.parseUnary();
    }
    return this.parsePower();
  }

  private parsePower(): number {
    const base = this.parsePrimary();
    if (this.peek() !== "^") return base;
    this.pos++;
    // The exponent is a unary expression, which makes ^ right-associative
    // and allows negative exponents such as 2^-3.
    const exponent = this.parseUnary();
    return checkFinite(Math.pow(base, exponent), `'${base}^${exponent}'`);
  }

  private parsePrimary(): number {
    const ch = this.peek();
    if (ch === "(") {
      this.pos++;
      const value = this.parseExpr();
      if (this.peek() !== ")") {
        throw new Error(`Missing closing parenthesis in expression '${this.input}'`);
      }
      this.pos++;
      return value;
    }
    if (/[0-9.]/.test(ch)) return this.parseNumber();
    if (/[A-Za-z_]/.test(ch)) return this.parseName();
    if (ch === "") throw new Error(`Unexpected end of expression '${this.input}'`);
    throw new Error(
      `Unexpected character '${ch}' at position ${this.pos} in expression '${this.input}'`,
    );
  }

  private parseNumber(): number {
    const start = this.pos;
    let seenDigit = false;
    let seenDot = false;
    while (this.pos < this.input.length) {
      const ch = this.input[this.pos];
      if (/[0-9]/.test(ch)) {
        seenDigit = true;
        this.pos++;
      } else if (ch === "." && !seenDot) {
        seenDot = true;
        this.pos++;
      } else {
        break;
      }
    }
    // Optional exponent part, e.g. 1.5e3. Only consumed when digits follow,
    // so the constant e is never swallowed into a number.
    if (seenDigit && (this.input[this.pos] === "e" || this.input[this.pos] === "E")) {
      let next = this.pos + 1;
      if (this.input[next] === "+" || this.input[next] === "-") next++;
      if (next < this.input.length && /[0-9]/.test(this.input[next])) {
        this.pos = next;
        while (this.pos < this.input.length && /[0-9]/.test(this.input[this.pos])) this.pos++;
      }
    }
    if (!seenDigit) {
      throw new Error(`Invalid number at position ${start} in expression '${this.input}'`);
    }
    return Number(this.input.slice(start, this.pos));
  }

  private parseName(): number {
    const start = this.pos;
    while (this.pos < this.input.length && /[A-Za-z0-9_]/.test(this.input[this.pos])) this.pos++;
    const name = this.input.slice(start, this.pos);
    if (Object.prototype.hasOwnProperty.call(CONSTANTS, name)) return CONSTANTS[name];
    if (Object.prototype.hasOwnProperty.call(FUNCTIONS, name)) {
      if (this.peek() !== "(") {
        throw new Error(`Function '${name}' must be followed by '(...)'`);
      }
      this.pos++;
      const arg = this.parseExpr();
      if (this.peek() !== ")") {
        throw new Error(`Missing closing parenthesis after '${name}(...'`);
      }
      this.pos++;
      return checkFinite(FUNCTIONS[name](arg), `'${name}(...)'`);
    }
    throw new Error(`Unknown name '${name}' in expression '${this.input}'`);
  }
}

export function calculate(expression: string): CalculateResult {
  const expr = typeof expression === "string" ? expression.trim() : "";
  if (!expr) throw new Error("Expression must not be empty");
  return { expression: expr, result: new Parser(expr).parse() };
}

function operand(value: number, name: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Operand ${name} must be a finite number`);
  }
  return value;
}

export function add(a: number, b: number): BinaryResult {
  return { a: operand(a, "a"), b: operand(b, "b"), result: checkFinite(a + b, "addition") };
}

export function subtract(a: number, b: number): BinaryResult {
  return { a: operand(a, "a"), b: operand(b, "b"), result: checkFinite(a - b, "subtraction") };
}

export function multiply(a: number, b: number): BinaryResult {
  return { a: operand(a, "a"), b: operand(b, "b"), result: checkFinite(a * b, "multiplication") };
}

export function divide(a: number, b: number): BinaryResult {
  operand(a, "a");
  operand(b, "b");
  if (b === 0) throw new Error("Division by zero");
  return { a, b, result: checkFinite(a / b, "division") };
}
