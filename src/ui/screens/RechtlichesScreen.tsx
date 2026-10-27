// Routes /impressum and /datenschutz: static text for adults, linked from the map and from the top
// line of the other pages for adults; no Vorlesen (task 10). Since task N they are built like
// /so-gehts: the top line of the pages for adults (ErwachsenenKopf) stays, below it only the text
// scrolls. "Zurück" there leads to the map, never back in the history. Its links ("Eltern", "So
// geht’s", the other legal page, "Sicherung und Gerät") are the installed app's way to /eltern and
// the device area: it has no address bar (task 11).

import { EmailText } from '../components/EmailText';
import { ErwachsenenKopf } from '../components/ErwachsenenKopf';
import { DATENSCHUTZ, IMPRESSUM, type LegalPage } from '../text/rechtliches';

const PAGES = { impressum: IMPRESSUM, datenschutz: DATENSCHUTZ } as const;

export function RechtlichesScreen({ page }: { page: keyof typeof PAGES }) {
  return <Rechtliches path={`/${page}`} page={PAGES[page]} />;
}

function Rechtliches({ path, page }: { path: '/impressum' | '/datenschutz'; page: LegalPage }) {
  return (
    <main className="screen-fit mx-auto grid max-w-page grid-rows-[auto_minmax(0,1fr)] gap-sm px-lg py-sm">
      <ErwachsenenKopf page={path} />
      {/* Room for the focus ring inside the scroll box. */}
      <div className="-mx-xs min-h-0 overflow-y-auto px-xs">
        <article className="mx-auto grid max-w-reading gap-lg pt-sm pb-lg">
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
        </article>
      </div>
    </main>
  );
}
