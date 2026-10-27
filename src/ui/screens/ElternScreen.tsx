// Route /eltern: the page for parents and teachers (task L). Linked as "Für Eltern" from the end of
// Impressum, Datenschutz and /so-gehts. Built like /so-gehts: a narrow column (--container-measure),
// only the text scrolls, "Zurück" to the map stays in the band; no Vorlesen. The overview of the
// Gebiete is static text from the manifest and content/typen.json (passed in, never typed), the two
// mail buttons open a mail to the contact address with a template. The device area
// (/eltern/geraet) is one link further.

import clsx from 'clsx';
import { Link } from 'react-router';
import type { ContentManifest } from '../../domain/content/manifest';
import { BEREICHE_BY_FACH, FAECHER } from '../../domain/content/taxonomy';
import type { AufgabenTypen } from '../../domain/content/typen';
import { buttonClass } from '../components/Button';
import { EmailText } from '../components/EmailText';
import { QuietLinks } from '../components/QuietLinks';
import { QUIET_ACTION_CLASS } from '../components/quiet';
import { BEREICH_NAME, FACH_NAME } from '../text/bereiche';
import {
  BEISPIEL,
  BEISPIEL_TITLE,
  BEREICH_HINWEIS,
  ELTERN_BACK,
  ELTERN_FOOTER,
  ELTERN_SECTIONS,
  ELTERN_TITLE,
  FEHLER_BODY,
  FEHLER_BUTTON,
  FEHLER_SUBJECT,
  VORSCHLAG_BODY,
  VORSCHLAG_BUTTON,
  VORSCHLAG_SUBJECT,
  bereichZeile,
  mailtoHref,
  probetestZeile,
  typenText,
  type ElternParagraph,
} from '../text/eltern';

// Tall enough to tap, like the mailto link of EmailText.
const LINK_CLASS =
  'inline-flex min-h-touch items-center rounded-control underline underline-offset-4';
const MAIL_CLASS = clsx(buttonClass('secondary'), 'flex items-center');

export interface ElternScreenProps {
  manifest: ContentManifest;
  typen: AufgabenTypen;
}

function Paragraph({ parts }: { parts: ElternParagraph }) {
  return (
    <p>
      {parts.map((part, i) =>
        typeof part === 'string' ? (
          <EmailText key={i} text={part} />
        ) : 'to' in part ? (
          <Link key={i} to={part.to} className={LINK_CLASS}>
            {part.text}
          </Link>
        ) : (
          <a key={i} href={part.href} target="_blank" rel="noopener" className={LINK_CLASS}>
            {part.text}
          </a>
        ),
      )}
    </p>
  );
}

function Uebersicht({ manifest, typen }: ElternScreenProps) {
  return (
    <>
      {FAECHER.map((fach) => (
        <section key={fach} className="grid gap-xs">
          <h3 className="font-bold">{FACH_NAME[fach]}</h3>
          {BEREICHE_BY_FACH[fach].map((bereich) => (
            <p key={bereich}>
              <span className="font-bold">
                {bereichZeile(BEREICH_NAME[bereich], manifest.bereiche[bereich].items)}
              </span>
              <br />
              {typenText(typen[bereich], BEREICH_HINWEIS[bereich])}
            </p>
          ))}
        </section>
      ))}
      <p>
        {probetestZeile(
          FAECHER.map((fach) => ({ fach: FACH_NAME[fach], n: manifest.probetests[fach].length })),
        )}
      </p>
    </>
  );
}

function Vorschlag() {
  return (
    <>
      <div className="flex flex-wrap gap-md">
        <a href={mailtoHref(VORSCHLAG_SUBJECT, VORSCHLAG_BODY)} className={MAIL_CLASS}>
          {VORSCHLAG_BUTTON}
        </a>
        <a href={mailtoHref(FEHLER_SUBJECT, FEHLER_BODY)} className={MAIL_CLASS}>
          {FEHLER_BUTTON}
        </a>
      </div>
      <p>{BEISPIEL_TITLE}</p>
      <dl className="grid gap-xs border-l-4 border-line-strong pl-md">
        {BEISPIEL.map(([label, value]) => (
          <div key={label}>
            <dt className="inline font-bold">{label}: </dt>
            <dd className="inline">{value}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

export function ElternScreen({ manifest, typen }: ElternScreenProps) {
  return (
    <main className="screen-fit mx-auto grid max-w-page grid-rows-[minmax(0,1fr)_auto] gap-sm px-lg py-sm">
      {/* Room for the focus ring inside the scroll box. */}
      <div className="-mx-xs min-h-0 overflow-y-auto px-xs">
        <article className="mx-auto grid max-w-measure gap-lg pt-sm pb-lg">
          <h1 className="text-heading font-bold">{ELTERN_TITLE}</h1>
          {ELTERN_SECTIONS.map((section, i) => (
            <section key={i} className="grid gap-xs">
              {section.heading && <h2 className="text-option font-bold">{section.heading}</h2>}
              {section.paragraphs.map((parts, j) => (
                <Paragraph key={j} parts={parts} />
              ))}
              {section.extra === 'uebersicht' && <Uebersicht manifest={manifest} typen={typen} />}
              {section.extra === 'vorschlag' && <Vorschlag />}
            </section>
          ))}
          <footer>
            <QuietLinks label={ELTERN_TITLE} links={ELTERN_FOOTER} className="flex-wrap" />
          </footer>
        </article>
      </div>
      <div data-region="band" className="flex items-end justify-between gap-md">
        <Link to="/" className={QUIET_ACTION_CLASS}>
          {ELTERN_BACK}
        </Link>
      </div>
    </main>
  );
}
