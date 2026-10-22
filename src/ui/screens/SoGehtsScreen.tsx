// Route /so-gehts: how Pfadfinder works, for parents (Markus, 2026-10-22). Linked as "So geht’s"
// from /eltern and from the end of Impressum and Datenschutz (from the map: Impressum → So geht’s). Static text in a narrow column (at most 70
// characters per line, --container-measure); only the text scrolls, "Zurück" to the map stays in
// the band. No Vorlesen, no lists: headings and paragraphs only.

import { Link } from 'react-router';
import { EmailText } from '../components/EmailText';
import { QUIET_ACTION_CLASS } from '../components/quiet';
import { SO_GEHTS, SO_GEHTS_BACK, SO_GEHTS_TITLE } from '../text/so-gehts';

export function SoGehtsScreen() {
  return (
    <main className="screen-fit mx-auto grid max-w-page grid-rows-[minmax(0,1fr)_auto] gap-sm px-lg py-sm">
      {/* Room for the focus ring inside the scroll box. */}
      <div className="-mx-xs min-h-0 overflow-y-auto px-xs">
        <article className="mx-auto grid max-w-measure gap-lg pt-sm pb-lg">
          <h1 className="text-heading font-bold">{SO_GEHTS_TITLE}</h1>
          {SO_GEHTS.map((section, i) => (
            <section key={i} className="grid gap-xs">
              {section.heading && <h2 className="text-option font-bold">{section.heading}</h2>}
              {section.paragraphs.map((text) => (
                <p key={text}>
                  <EmailText text={text} />
                </p>
              ))}
            </section>
          ))}
        </article>
      </div>
      <div data-region="band" className="flex items-end justify-between gap-md">
        <Link to="/" className={QUIET_ACTION_CLASS}>
          {SO_GEHTS_BACK}
        </Link>
      </div>
    </main>
  );
}
