// Probetest time (PRODUCT.md §5.4, decision 2026-10-15). Time runs by the wall clock from
// startedAt, not by app run time: a reload or a night in the background does not stop it.
// The run ends with a result only when time is up while the child is using the app; if it ran
// out while the app was away, the run is aborted without one.

/** A deadline timer that fires later than this, or while the page is hidden, was not seen. */
export const FOREGROUND_GRACE_MS = 60_000;
/** From here on the header says "Noch 5 Minuten" … "Noch 1 Minute" instead of the minutes. */
export const FINAL_MINUTES = 5;

const MINUTE_MS = 60_000;

/** Epoch milliseconds at which the run ends. */
export function deadlineOf(run: { startedAt: string }, durationMinutes: number): number {
  return Date.parse(run.startedAt) + durationMinutes * MINUTE_MS;
}

/** Whole minutes left, rounded up: 44:01 left shows 45, 0:30 shows 1, time up shows 0. */
export function remainingMinutes(now: string, deadline: number): number {
  return Math.max(0, Math.ceil((deadline - Date.parse(now)) / MINUTE_MS));
}

export function isFinalMinutes(now: string, deadline: number): boolean {
  const minutes = remainingMinutes(now, deadline);
  return minutes > 0 && minutes <= FINAL_MINUTES;
}

/** On opening (reload, return from the background) a running run. */
export function onOpen(now: string, deadline: number): 'resume' | 'expire' {
  return Date.parse(now) < deadline ? 'resume' : 'expire';
}

/**
 * When the deadline timer fires. Hidden pages may still run throttled timers, and a sleeping
 * laptop fires them late: in both cases the child did not see the time end.
 */
export function onDeadline(input: {
  deadline: number;
  firedAt: string;
  visible: boolean;
}): 'submit' | 'expire' | 'wait' {
  const late = Date.parse(input.firedAt) - input.deadline;
  if (late < 0) return 'wait';
  return input.visible && late <= FOREGROUND_GRACE_MS ? 'submit' : 'expire';
}
