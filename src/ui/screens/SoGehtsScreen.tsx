// Route /so-gehts: how Pfadfinder works, for parents (Markus, 2026-10-22). Linked as "So geht’s"
// from the top line of the other pages for adults (from the map: Eltern or Impressum → So geht’s),
// as "So funktioniert Pfadfinder" from the text of /eltern. Static text in a narrow column (at most
// 70 characters per line, --container-measure); the top line of the pages for adults
// (ErwachsenenKopf, task N) stays, only the text scrolls. No Vorlesen, no lists: headings,
// paragraphs and, near the end, "Für Eltern" (/eltern).

import { Link } from 'react-router';
import { EmailText } from '../components/EmailText';
import { ErwachsenenKopf } from '../components/ErwachsenenKopf';
import { SO_GEHTS, SO_GEHTS_TITLE } from '../text/so-gehts';

export function SoGehtsScreen() {
  return (
    <main className="screen-fit mx-auto grid max-w-page grid-rows-[auto_minmax(0,1fr)] gap-sm px-lg py-sm">
      <ErwachsenenKopf page="/so-gehts" />
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
              {section.link && (
                <p>
                  <Link
                    to={section.link.to}
                    className="inline-flex min-h-touch items-center rounded-control underline underline-offset-4"
                  >
                    {section.link.text}
                  </Link>
                </p>
              )}
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}
