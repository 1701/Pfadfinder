// A paragraph's text with the contact address as a mailto link, its text the address itself
// (Impressum, Datenschutz, /so-gehts). Tall enough to tap, like every other target.

import { Fragment } from 'react';
import { EMAIL } from '../text/kontakt';

export function EmailText({ text }: { text: string }) {
  return text.split(EMAIL).map((part, i) => (
    <Fragment key={i}>
      {i > 0 && (
        <a
          href={`mailto:${EMAIL}`}
          className="inline-flex min-h-touch items-center rounded-control underline underline-offset-4"
        >
          {EMAIL}
        </a>
      )}
      {part}
    </Fragment>
  ));
}
