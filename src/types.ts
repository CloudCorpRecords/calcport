/**
 * calcport types.
 *
 * Every operation returns the operands it was given alongside the
 * computed value, so a caller can check what was actually evaluated
 * without re-parsing its own request.
 */

export interface CalculateResult {
  expression: string;
  result: number;
}

export interface BinaryResult {
  a: number;
  b: number;
  result: number;
}
