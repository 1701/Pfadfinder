// /so-gehts: how Pfadfinder works, for parents (Markus, 2026-10-22, text verbatim). Like Impressum
// and Datenschutz a page for adults, so paragraphs may be longer than two sentences (CLAUDE.md).

import { EMAIL } from './kontakt';

export interface SoGehtsSection {
  /** None for the opening paragraph and the contact line at the end. */
  heading?: string;
  paragraphs: string[];
}

export const SO_GEHTS_TITLE = 'So funktioniert Pfadfinder';
export const SO_GEHTS_BACK = 'Zurück';

export const SO_GEHTS: SoGehtsSection[] = [
  {
    paragraphs: [
      'Pfadfinder ist eine kostenlose Übungs-App für Viertklässler in Baden-Württemberg. Sie bereitet auf Kompass 4 vor: eine Lernstandserhebung in Deutsch und Mathe, Mitte November, je 45 Minuten auf Papier. Kompass 4 ist keine Klassenarbeit und gibt keine Note. Es zeigt Lehrkräften, wo ein Kind steht.',
    ],
  },
  {
    heading: 'Zwei Wege',
    paragraphs: [
      'Üben geht nach Bereichen, zum Beispiel „Größen und Messen“ oder „Sachtexte lesen“. Dein Kind bekommt nach jeder Aufgabe eine Rückmeldung, die den Weg erklärt, nicht nur das Ergebnis. Aufgaben lassen sich vorlesen. Beim ersten Start bietet Pfadfinder einen kurzen Einstieg in Mathe an, Deutsch folgt an einem anderen Tag. „Später“ heißt: heute nicht mehr.',
      'Probetest ist ein kompletter Durchlauf wie am Prüfungstag: 45 Minuten, ohne Rückmeldung zwischendurch. Lesetexte werden dabei nicht vorgelesen. Die Zeit läuft weiter, auch wenn das iPad kurz weggelegt wird. Nach der Abgabe kann dein Kind jede Aufgabe durchsehen.',
    ],
  },
  {
    heading: 'Bevor es losgeht',
    paragraphs: [
      'Zettel und Stift bereitlegen. Bei Kompass 4 darf auf Papier gerechnet werden, und Rechnen im Kopf ist bei vierstelligen Zahlen eine unnötige Fehlerquelle. Besser: einmal in Ruhe eine Aufgabe zusammen machen, dann allein.',
    ],
  },
  {
    heading: 'Die Sicherung',
    paragraphs: [
      'Pfadfinder braucht kein Konto und keinen Namen. Der Fortschritt bleibt auf diesem Gerät. Wer das Gerät wechselt oder Daten löscht, braucht vorher eine Sicherung. Du findest sie unter „Für Eltern“ am Ende von Impressum und Datenschutz: „Sicherung herunterladen“ tippen und die Datei speichern, zum Beispiel in „Dateien“. Auf dem neuen Gerät unter „Für Eltern“ auf „Sicherung einlesen“ tippen. Das ersetzt alles, was dort gespeichert ist.',
    ],
  },
  {
    heading: 'Warum die Probetest-Liste kein Ergebnis zeigt',
    paragraphs: [
      'Die Liste zeigt nur, ob ein Probetest gemacht ist. Das ist Absicht. Ein Probetest ist zum Ausprobieren da, nicht zum Bewerten: Die Aufgaben sind selbst geschrieben und nicht geeicht, eine Punktzahl würde mehr versprechen, als sie halten kann. Was zählt, ist das Durchsehen danach: Welche Aufgabe war schwer, und warum? Darüber lohnt sich das Gespräch, nicht über eine Zahl.',
    ],
  },
  {
    heading: 'Was Pfadfinder nicht ist',
    paragraphs: [
      'Keine Nachhilfe und kein Ersatz für die Schule. Keine Vorhersage, wie Kompass 4 ausgeht. Und kein Grund für Druck: Zwei, drei Übungsrunden pro Woche reichen, mehr bringt bei Neunjährigen wenig.',
    ],
  },
  {
    heading: 'Datenschutz',
    paragraphs: [
      'Die App selbst sendet nichts an einen Server, setzt keine Cookies und zeigt keine Werbung. Beim Vorlesen auf dem iPad bleibt die Stimme auf dem Gerät. Was dein Browser darüber hinaus tut, steht unter „Datenschutz“.',
    ],
  },
  { paragraphs: [`Fragen oder Fehler gefunden? ${EMAIL}`] },
];
