// Reads the task aloud with the browser's own speech (SpeechSynthesis, de-DE): no network.
// Hidden where the browser cannot speak. A second tap stops. No voice is chosen, only the
// language: iOS then uses the voice set under Bedienungshilfen (parents can load a better one
// there), where picking the first German voice of the list overrode it (decision 2026-10-16).
// Never on paper (print:hidden, 2026-10-22).

import { useEffect, useState } from 'react';
import { SpeakerGlyph, StopGlyph } from './glyphs';

function speech(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis
    : null;
}

export function VorlesenButton({ text }: { text: string }) {
  const synth = speech();
  const [speaking, setSpeaking] = useState(false);

  // Leaving the screen or a new text stops reading (give the button a key per task).
  useEffect(() => () => synth?.cancel(), [synth, text]);

  if (!synth) return null;

  const toggle = () => {
    synth.cancel();
    if (speaking) return setSpeaking(false);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.9;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    synth.speak(utterance);
    setSpeaking(true);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={speaking}
      className="group flex shrink-0 flex-col items-center gap-2xs rounded-control text-ink-muted print:hidden"
    >
      <span className="grid size-primary place-items-center rounded-round border-2 border-line-strong bg-surface text-ink group-aria-pressed:border-ink">
        {speaking ? <StopGlyph className="size-lg" /> : <SpeakerGlyph className="size-xl" />}
      </span>
      <span>{speaking ? 'Stopp' : 'Vorlesen'}</span>
    </button>
  );
}
