// /eltern, the page for parents and teachers (task L, text by Markus, verbatim). Written for adults
// in the Sie form, like the README; paragraphs may be longer than two sentences (CLAUDE.md). The
// screen holds no prose: sections, paragraphs and links live here, the overview is built from the
// manifest and content/typen.json.

import type { Bereich } from '../../domain/content/taxonomy';
import { EMAIL } from './kontakt';
import { DATENSCHUTZ_LINK, GERAET_LINK, IMPRESSUM_LINK } from './rechtliches-links';

/** A link inside a paragraph: internal (`to`) or to another site (`href`, new tab). */
export type ElternLink = { text: string } & ({ to: string } | { href: string });
/** A paragraph: text (the contact address becomes a mailto link) and links in reading order. */
export type ElternParagraph = readonly (string | ElternLink)[];

export interface ElternSection {
  /** None for the opening paragraphs. */
  heading?: string;
  paragraphs: readonly ElternParagraph[];
  /** Rendered after the paragraphs: the overview of Gebiete, or the mail buttons with the example. */
  extra?: 'uebersicht' | 'vorschlag';
}

export const ELTERN_TITLE = 'Für Eltern und Lehrkräfte';
export const ELTERN_BACK = 'Zurück';

const SO_GEHTS_PAGE = 'So funktioniert Pfadfinder';
export const REPO_URL = 'https://github.com/1701/Pfadfinder';

export const ELTERN_SECTIONS: readonly ElternSection[] = [
  {
    paragraphs: [
      [
        'Pfadfinder ist eine kostenlose Übungs-App für Kinder der 4. Klasse in Baden-Württemberg, die sich auf Kompass 4 vorbereiten. Keine Anmeldung, keine Werbung, kein Tracking: Alles, was Ihr Kind übt, bleibt auf dem Gerät. Die App ist unter kompassheld.de erreichbar und läuft auf Tablet, Laptop und Handy – nach dem ersten Laden auch ohne Internet.',
      ],
      [
        'Die Aufgaben sind selbst geschrieben und nicht amtlich geprüft; mehr dazu weiter unten. Kompass 4 ist eine Lernstandserhebung des Landes Baden-Württemberg. Pfadfinder ist ein privates Angebot und nicht damit verbunden.',
      ],
    ],
  },
  {
    heading: 'Was geübt wird',
    paragraphs: [
      [
        'Mathe und Deutsch, je fünf Gebiete. Alle Aufgabentypen der Kompass-4-Tests 2024 und 2025 sind dabei, dazu Probetests in Testlänge (45 Minuten, auch zum Ausdrucken) und ein Vorlesen-Knopf an jeder Aufgabe. Pfadfinder trainiert Aufgabentypen, Zeitgefühl und Routine – nicht die Fragen eines bestimmten Jahrgangs, denn die sind jedes Jahr neu.',
      ],
      [
        'Zehn Aufgabenformate: Ankreuzen (eine oder mehrere Antworten), Zahl eingeben, Zuordnen, Reihenfolge, Lückentext, im Text markieren, Fehler finden, Satz in Satzglieder teilen, Kurzantwort mit Musterlösung.',
      ],
    ],
    extra: 'uebersicht',
  },
  {
    heading: 'So nutzen Sie es',
    paragraphs: [
      [
        'Öffnen Sie kompassheld.de auf dem Tablet, am besten quer, und lassen Sie Ihr Kind anfangen; die App erklärt sich selbst. Was die Karte zeigt, wie das Üben aufgebaut ist und was die App absichtlich nicht tut, steht unter „',
        { to: '/so-gehts', text: SO_GEHTS_PAGE },
        '“.',
      ],
      [
        'Für den Unterricht: Pfadfinder läuft im Browser oder als installierte App („Zum Home-Bildschirm“), ohne Login und ohne Verwaltung. Jeder Browser auf jedem Gerät hat seinen eigenen Stand – ein Tablet-Koffer braucht keine Konten, aber jedes Kind sollte bei seinem Gerät und seinem Weg (Browser oder installierte App) bleiben. Ein Stand lässt sich als Datei sichern und auf ein anderes Gerät mitnehmen: ',
        { to: '/eltern/geraet', text: GERAET_LINK },
        '.',
      ],
    ],
  },
  {
    heading: 'Woher die Aufgaben kommen',
    paragraphs: [
      [
        'Alle Aufgaben hat ein Vater aus Marxzell geschrieben, mit Hilfe von KI, während seine Tochter sich auf den Test vorbereitet hat. Sie orientieren sich an Aufbau, Niveau und Aufgabentypen der Kompass-4-Tests 2024 und 2025; keine Aufgabe stammt aus einem echten Test. Geprüft hat sie bisher weder das Land noch eine Lehrkraft; eine Durchsicht durch eine Grundschullehrerin läuft. Pfadfinder sagt kein Testergebnis und keine Schulempfehlung voraus und ersetzt kein Gespräch mit der Lehrkraft Ihres Kindes.',
      ],
      [
        'Wenn Ihnen eine Aufgabe falsch, unklar, zu leicht oder zu schwer vorkommt: Schreiben Sie es bitte, mit Fach, Gebiet und dem Wortlaut der Aufgabe. Jede Rückmeldung wird gelesen.',
      ],
    ],
  },
  {
    heading: 'Aufgabe vorschlagen oder Fehler melden',
    paragraphs: [
      [
        `Sie kennen eine Aufgabe, die in Pfadfinder fehlt? Schicken Sie sie per E-Mail an ${EMAIL} – der Knopf unten öffnet eine Mail mit einer Vorlage. Kein Konto, kein Formular. Eingereichte Aufgaben werden geprüft, bei Bedarf angepasst und unter der Lizenz CC BY-SA 4.0 veröffentlicht, auf Wunsch mit Ihrem Namen.`,
      ],
    ],
    extra: 'vorschlag',
  },
  {
    heading: 'Das Projekt ist offen',
    paragraphs: [
      [
        'Quelltext und Aufgaben von Pfadfinder sind frei: der Code unter der MIT-Lizenz, die Aufgaben unter CC BY-SA 4.0. Schulen, Vereine und Entwickler können die App selbst betreiben, verändern oder mit eigenen Aufgaben ergänzen. Anleitung und Quelltext liegen auf GitHub, einer Plattform für offene Software: ',
        { href: REPO_URL, text: 'github.com/1701/Pfadfinder' },
        '.',
      ],
    ],
  },
];

/** The overview: "Zahlen und Rechnen · 44 Aufgaben", then the types of the Gebiet. */
export const bereichZeile = (name: string, items: number) =>
  `${name} · ${items} ${items === 1 ? 'Aufgabe' : 'Aufgaben'}`;

/** Said after the types of a Gebiet that the tests do not contain. */
export const BEREICH_HINWEIS: Partial<Record<Bereich, string>> = {
  'lesen-literarisch': 'nur zum Üben – in den Tests 2024 und 2025 kam kein literarischer Text vor',
};

export const typenText = (typen: readonly string[], hinweis?: string) =>
  hinweis ? `${typen.join(', ')} (${hinweis})` : typen.join(', ');

/** "3 Probetests Mathe, 3 Probetests Deutsch." */
export const probetestZeile = (counts: readonly { fach: string; n: number }[]) =>
  `${counts.map(({ fach, n }) => `${n} ${n === 1 ? 'Probetest' : 'Probetests'} ${fach}`).join(', ')}.`;

export const VORSCHLAG_BUTTON = 'Aufgabe vorschlagen';
export const FEHLER_BUTTON = 'Fehler melden';
export const VORSCHLAG_SUBJECT = 'Aufgabe für Pfadfinder';
export const FEHLER_SUBJECT = 'Fehler in Pfadfinder';

export const VORSCHLAG_BODY = `Fach (Mathe oder Deutsch):
Gebiet:
Was das Kind können soll:
Aufgabentext:
Richtige Antwort:
Zwei bis drei falsche Antworten (und warum ein Kind sie wählen könnte):
Ein Satz Rückmeldung, wenn es nicht klappt:
Optional: Klasse, Schule, Name für die Nennung:

Mit dem Senden bin ich einverstanden, dass die Aufgabe geprüft, angepasst und unter CC BY-SA 4.0 veröffentlicht wird.`;

export const FEHLER_BODY = `Fach:
Gebiet:
Wortlaut der Aufgabe:
Was nicht stimmt:`;

/** A mail to the contact address: line breaks become %0A, umlauts are percent-encoded. */
export const mailtoHref = (subject: string, body: string) =>
  `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

export const BEISPIEL_TITLE = 'So könnte ein Vorschlag aussehen:';

/** The example below the buttons, label and value per line; the Gebiet as on the map. */
export const BEISPIEL: readonly (readonly [string, string])[] = [
  ['Fach', 'Mathe'],
  ['Gebiet', 'Muster und Zahlenfolgen'],
  ['Was das Kind können soll', 'eine Zahlenmauer vollständig berechnen'],
  [
    'Aufgabe',
    'In einer Zahlenmauer steht in jedem Stein die Summe der beiden Steine darunter. In der untersten Reihe stehen 4, 7 und 2. Welche Zahl steht im Deckstein ganz oben?',
  ],
  ['Richtige Antwort', '20'],
  [
    'Falsche Antworten',
    '13 (nur die drei unteren Zahlen zusammengezählt), 11 (nur der linke mittlere Stein), 9 (nur der rechte mittlere Stein)',
  ],
  [
    'Rückmeldung, wenn es nicht klappt',
    'Rechne erst die mittlere Reihe: 4 + 7 = 11 und 7 + 2 = 9. Der Deckstein ist 11 + 9.',
  ],
  ['Nennung', 'Familie Beispiel, Klasse 4b, Grundschule Musterstadt'],
];

/** Quietly at the end of the text. */
export const ELTERN_FOOTER = [
  { to: '/impressum', text: IMPRESSUM_LINK },
  { to: '/datenschutz', text: DATENSCHUTZ_LINK },
  { to: '/so-gehts', text: SO_GEHTS_PAGE },
  { to: '/eltern/geraet', text: GERAET_LINK },
] as const;
