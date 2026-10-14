// The question in front of the Eltern page (PRODUCT.md §7): no password, just a sum of two
// two-digit numbers that keeps a child from landing there by chance. Not a lock.

export interface GateQuestion {
  a: number;
  b: number;
}

/** Two numbers from 10 to 99; random() returns values in [0, 1) like Math.random. */
export function gateQuestion(random: () => number = Math.random): GateQuestion {
  const twoDigit = () => 10 + Math.floor(random() * 90);
  return { a: twoDigit(), b: twoDigit() };
}

/** null = nothing complete entered yet. */
export function isGateAnswer(question: GateQuestion, value: number | null): boolean {
  return value === question.a + question.b;
}
