// The question in front of the device area (/eltern/geraet, PRODUCT.md §7): a sign "for parents",
// not a lock. Any child in year 4 can add two two-digit numbers; the protection is that no child's
// screen links to it, only /eltern and the legal pages do (ARCHITECTURE.md §7).

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
