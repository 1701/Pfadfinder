// The clock of a running Probetest in the UI. The decisions live in src/domain/probetest; this
// hook only looks at the wall clock once a second (throttled while the page is hidden), tells the
// store when the deadline has passed and whether the page was visible then, and tells it when
// the page becomes visible again (return from the background, iOS).

import { useEffect, useEffectEvent, useRef, useState } from 'react';

export function useProbetestClock(
  deadline: number | null,
  onDeadline: (visible: boolean) => void,
  onVisible: () => void,
): number {
  const [now, setNow] = useState(() => Date.now());
  const fired = useRef(false);
  const deadlinePassed = useEffectEvent(onDeadline);
  const becameVisible = useEffectEvent(onVisible);

  useEffect(() => {
    if (deadline === null) return;
    fired.current = false;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (!fired.current && t >= deadline) {
        fired.current = true;
        deadlinePassed(document.visibilityState === 'visible');
      }
    };
    const visible = () => {
      if (document.visibilityState !== 'visible') return;
      setNow(Date.now());
      becameVisible();
    };
    tick();
    const interval = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('pageshow', visible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', visible);
      window.removeEventListener('pageshow', visible);
    };
  }, [deadline]);

  return now;
}
