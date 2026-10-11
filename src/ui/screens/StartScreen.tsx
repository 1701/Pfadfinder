// Start page until the map exists (task 5): a plain list of the Bereiche that can be practised.

import { Link, useLoaderData } from 'react-router';
import { FAECHER, fachOfBereich, type Bereich } from '../../domain/content';
import { BEREICH_NAME, FACH_NAME } from '../text/bereiche';

export function StartScreen() {
  const bereiche = useLoaderData() as Bereich[];

  return (
    <main className="mx-auto grid max-w-page content-start gap-xl px-lg py-2xl">
      <h1 className="text-display font-bold">Wohin geht's heute?</h1>
      {bereiche.length === 0 && <p className="text-option">Hier gibt es bald Aufgaben.</p>}
      {FAECHER.map((fach) => {
        const ofFach = bereiche.filter((b) => fachOfBereich(b) === fach);
        if (ofFach.length === 0) return null;
        return (
          <section key={fach} className="grid gap-sm">
            <h2 className="text-heading font-bold">{FACH_NAME[fach]}</h2>
            <ul className="grid gap-sm">
              {ofFach.map((bereich) => (
                <li key={bereich}>
                  <Link
                    to={`/ueben/${fach}/${bereich}`}
                    className="flex min-h-primary items-center rounded-control border-2 border-line-strong bg-surface px-lg text-option"
                  >
                    {BEREICH_NAME[bereich]}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
