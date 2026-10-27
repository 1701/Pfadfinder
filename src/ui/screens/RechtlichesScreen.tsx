// Routes /impressum and /datenschutz: static text for adults, linked from the map, /eltern and
// /eltern/geraet. Unlike a task, the page may scroll; no Vorlesen (task 10). "Zurück" goes back in
// the history, or to the map when the page was opened directly. At the end, quietly, "Für Eltern"
// leads to the page for parents and teachers (/eltern, task L) and "Sicherung und Gerät" to the
// device area (/eltern/geraet): the home-screen app has no address bar, so these are its way there
// (task 11). Beside them "So geht’s" (/so-gehts, 2026-10-22).

import { useLocation, useNavigate } from 'react-router';
import { EmailText } from '../components/EmailText';
import { QuietLinks } from '../components/QuietLinks';
import { QUIET_ACTION_CLASS } from '../components/quiet';
import { ELTERN_LINK, GERAET_LINK, SO_GEHTS_LINK } from '../text/rechtliches-links';
import { DATENSCHUTZ, IMPRESSUM, LEGAL_BACK, type LegalPage } from '../text/rechtliches';

const PAGES = { impressum: IMPRESSUM, datenschutz: DATENSCHUTZ } as const;

// From the map in two taps: Impressum → So geht’s (2026-10-22), → Sicherung und Gerät (task L).
const END_LINKS = [
  { to: '/eltern', text: ELTERN_LINK },
  { to: '/eltern/geraet', text: GERAET_LINK },
  { to: '/so-gehts', text: SO_GEHTS_LINK },
] as const;

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
              <EmailText text={text} />
            </p>
          ))}
        </section>
      ))}
      <footer className="flex">
        <QuietLinks label="Für Eltern" links={END_LINKS} className="flex-wrap" />
      </footer>
    </main>
  );
}
