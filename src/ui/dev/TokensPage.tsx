// Developer overview of the design tokens (dev build only, see src/app/router.tsx).
// Shows every token in use so palette decisions can be judged on the iPad.

import { useState, type ReactNode } from 'react';

const COLORS = [
  ['paper', 'Grund'],
  ['surface', 'Aufgabenfläche'],
  ['ink', 'Tinte (Text)'],
  ['ink-muted', 'Nebentext'],
  ['line', 'Linie (Deko)'],
  ['line-strong', 'Rand Bedienelemente'],
  ['signal', 'Signal: nur Prüfen/Weiter'],
  ['signal-edge', 'Signal-Rand'],
  ['signal-soft', 'Gewählt / markiert'],
  ['touch-soft', 'Gerade bewegt'],
  ['correct', 'Richtig'],
  ['correct-surface', 'Richtig: Fläche'],
  ['notyet', 'Noch nicht ganz'],
  ['notyet-surface', 'Noch nicht ganz: Fläche'],
] as const;

// Full class names so Tailwind can find them in the source.
const TEXT_SIZES = [
  ['text-display', '40', 'Deine Expedition'],
  ['text-heading', '32', 'Zahlen und Rechnen'],
  ['text-prompt', '28', 'Welche Ziffer steht an der Tausenderstelle?'],
  ['text-option', '22', '358 214'],
  ['text-body', '18', 'Zähle die Stellen von rechts.'],
] as const;

const SPACING = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const;

/** Reads the resolved token value; the stylesheet is loaded before the app renders. */
function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-md">
      <h2 className="text-heading font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Swatch({ token, label }: { token: string; label: string }) {
  const value = cssVar(`--color-${token}`);
  return (
    <div className="flex items-center gap-sm">
      <span
        className="block size-2xl shrink-0 rounded-sheet border border-line-strong"
        style={{ background: `var(--color-${token})` }}
      />
      <span className="grid">
        <span>{label}</span>
        <span className="text-ink-muted">
          {token} · {value}
        </span>
      </span>
    </div>
  );
}

function Space({ token }: { token: string }) {
  const value = cssVar(`--spacing-${token}`);
  return (
    <div className="flex items-center gap-sm">
      <span className="w-xl text-ink-muted">{token}</span>
      <span className="block h-sm bg-ink" style={{ width: `var(--spacing-${token})` }} />
      <span className="text-ink-muted">{value}</span>
    </div>
  );
}

export function TokensPage() {
  const [selected, setSelected] = useState('b');

  return (
    <main className="mx-auto grid max-w-page gap-2xl px-lg py-xl">
      <h1 className="text-display font-bold">Token-Übersicht (Entwicklung)</h1>

      <Section title="Farben">
        <div className="grid gap-md sm:grid-cols-2">
          {COLORS.map(([token, label]) => (
            <Swatch key={token} token={token} label={label} />
          ))}
        </div>
      </Section>

      <Section title="Schrift: Andika">
        <div className="grid gap-md rounded-sheet border border-line bg-surface p-lg">
          {TEXT_SIZES.map(([className, size, sample]) => (
            <p key={className} className={`grid ${className}`}>
              <span className="font-bold">{sample}</span>
              <span className="text-body text-ink-muted">
                {className} · {size} px
              </span>
            </p>
          ))}
        </div>
      </Section>

      <Section title="Abstände">
        <div className="grid gap-xs">
          {SPACING.map((token) => (
            <Space key={token} token={token} />
          ))}
        </div>
      </Section>

      <Section title="Bedienelemente">
        <div className="grid gap-lg rounded-sheet border border-line bg-surface p-lg">
          <div className="grid grid-cols-2 gap-md" role="group" aria-label="Antworten">
            {[
              ['a', '3'],
              ['b', '8'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={selected === id}
                onClick={() => setSelected(id as string)}
                className="min-h-2xl rounded-control border-2 border-line-strong bg-surface text-option aria-pressed:border-3 aria-pressed:border-signal-edge aria-pressed:bg-signal-soft"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-md">
            <button
              type="button"
              aria-label="Vorlesen"
              className="grid size-primary place-items-center rounded-round border-2 border-line-strong bg-surface"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-xl"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M4 9h3l5-4v14l-5-4H4z" fill="currentColor" stroke="none" />
                <path d="M16 8.5a5 5 0 0 1 0 7" />
                <path d="M18.5 6a8.5 8.5 0 0 1 0 12" />
              </svg>
            </button>
            <button
              type="button"
              disabled
              className="min-h-primary rounded-control border-2 border-line-strong bg-surface px-xl text-option font-bold text-ink-muted"
            >
              Prüfen
            </button>
            <button
              type="button"
              className="min-h-primary rounded-control border-2 border-signal-edge bg-signal px-xl text-option font-bold"
            >
              Prüfen
            </button>
          </div>
        </div>
      </Section>

      <Section title="Rückmeldung">
        <div className="grid gap-md">
          <div className="grid gap-xs rounded-sheet bg-correct-surface px-lg py-md">
            <strong className="text-option text-correct">Richtig</strong>
            <p>Genau. Von rechts: Einer 4, Zehner 1, Hunderter 2, Tausender 8.</p>
          </div>
          <div className="grid gap-xs rounded-sheet bg-notyet-surface px-lg py-md">
            <strong className="text-option text-notyet">Noch nicht ganz</strong>
            <p>Zähle die Stellen von rechts: Einer, Zehner, Hunderter, Tausender.</p>
          </div>
        </div>
      </Section>

      <Section title="Radien">
        <div className="flex flex-wrap gap-lg">
          <div className="rounded-sheet border-2 border-line-strong px-lg py-xl">sheet</div>
          <div className="rounded-control border-2 border-line-strong px-lg py-xl">control</div>
          <div className="rounded-round border-2 border-line-strong px-lg py-xl">round</div>
        </div>
      </Section>
    </main>
  );
}
