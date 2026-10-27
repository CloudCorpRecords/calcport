import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { add, calculate, divide, multiply, subtract } from "../src/calc.js";

describe("calculate", () => {
  it("evaluates basic operators with precedence", () => {
    assert.equal(calculate("2+3").result, 5);
    assert.equal(calculate("2+3*4").result, 14);
    assert.equal(calculate("(2+3)*4").result, 20);
    assert.equal(calculate("10/4").result, 2.5);
    assert.equal(calculate("10%3").result, 1);
  });

  it("handles powers as right-associative and unary minus", () => {
    assert.equal(calculate("2^10").result, 1024);
    assert.equal(calculate("2^3^2").result, 512);
    assert.equal(calculate("-3+5").result, 2);
    assert.equal(calculate("2^-2").result, 0.25);
    assert.equal(calculate("-(3+1)").result, -4);
  });

  it("supports functions and constants", () => {
    assert.equal(calculate("sqrt(16)").result, 4);
    assert.equal(calculate("abs(-7)").result, 7);
    assert.equal(calculate("floor(2.9)").result, 2);
    assert.equal(calculate("ceil(2.1)").result, 3);
    assert.equal(calculate("round(2.5)").result, 3);
    assert.equal(calculate("pi").result, Math.PI);
    assert.equal(calculate("e").result, Math.E);
    assert.equal(calculate("sqrt(3^2+4^2)").result, 5);
  });

  it("echoes the trimmed expression", () => {
    assert.deepEqual(calculate("  1 + 2 "), { expression: "1 + 2", result: 3 });
  });

  it("rejects division and modulo by zero", () => {
    assert.throws(() => calculate("1/0"), /Division by zero/);
    assert.throws(() => calculate("1%0"), /Modulo by zero/);
  });

  it("rejects malformed or unsafe input without evaluating it", () => {
    for (const bad of ["", "1+", "(1+2", "1 2", "foo(1)", "process.exit(1)", "1;2", "sqrt(-1)", "2**3"]) {
      assert.throws(() => calculate(bad), Error, bad);
    }
  });
});

describe("binary operations", () => {
  it("add, subtract, multiply", () => {
    assert.deepEqual(add(2, 3), { a: 2, b: 3, result: 5 });
    assert.deepEqual(subtract(2, 3), { a: 2, b: 3, result: -1 });
    assert.deepEqual(multiply(2.5, 4), { a: 2.5, b: 4, result: 10 });
  });

  it("divide, including the zero-divisor error", () => {
    assert.deepEqual(divide(7, 2), { a: 7, b: 2, result: 3.5 });
    assert.throws(() => divide(1, 0), /Division by zero/);
  });

  it("rejects non-finite operands", () => {
    assert.throws(() => add(Number.NaN, 1), /finite number/);
    assert.throws(() => multiply(1, Number.POSITIVE_INFINITY), /finite number/);
  });
});
