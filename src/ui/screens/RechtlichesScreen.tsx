// Routes /impressum and /datenschutz: static text for adults, linked from the map and /eltern. Unlike a
// task, the page may scroll; no Vorlesen (task 10). "Zurück" goes back in the history, or to the
// map when the page was opened directly.

import { useLocation, useNavigate } from 'react-router';
import { QUIET_ACTION_CLASS } from '../components/quiet';
import { DATENSCHUTZ, IMPRESSUM, LEGAL_BACK, type LegalPage } from '../text/rechtliches';

const PAGES = { impressum: IMPRESSUM, datenschutz: DATENSCHUTZ } as const;

export function RechtlichesScreen({ page }: { page: keyof typeof PAGES }) {
  return <Rechtliches page={PAGES[page]} />;
}

function Rechtliches({ page }: { page: LegalPage }) {
  const navigate = useNavigate();
  // React Router names the first entry of this tab "default": nothing to go back to.
  const opened = useLocation().key === 'default';
  return (
    <main className="mx-auto grid max-w-reading gap-lg px-lg pt-sm pb-2xl">
      <header className="flex min-h-touch items-center">
        <button
          type="button"
          className={QUIET_ACTION_CLASS}
          onClick={() => void (opened ? navigate('/') : navigate(-1))}
        >
          {LEGAL_BACK}
        </button>
      </header>
      <h1 className="text-heading font-bold">{page.title}</h1>
      {page.sections.map((section) => (
        <section key={section.heading} className="grid gap-xs">
          <h2 className="text-option font-bold">{section.heading}</h2>
          {section.paragraphs.map((text) => (
            <p key={text} className="whitespace-pre-line">
              {text}
            </p>
          ))}
        </section>
      ))}
    </main>
  );
}
