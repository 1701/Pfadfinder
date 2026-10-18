// Impressum (§ 5 DDG) and Datenschutz (PRODUCT.md §12), linked only from /eltern. Written for
// adults and in Du like the Eltern page; legal text may be longer than two sentences. The markers
// [NAME], [ADRESSE] and [E-MAIL] are replaced before Pfadfinder goes public (docs/DEPLOY.md §6).

export interface LegalSection {
  heading: string;
  /** One paragraph each; a line break inside a paragraph is "\n". */
  paragraphs: string[];
}

export interface LegalPage {
  title: string;
  sections: LegalSection[];
}

export const IMPRESSUM_LINK = 'Impressum';
export const DATENSCHUTZ_LINK = 'Datenschutz';

const CONTACT = '[NAME]\n[ADRESSE]\nE-Mail: [E-MAIL]';

export const IMPRESSUM: LegalPage = {
  title: 'Impressum',
  sections: [
    { heading: 'Angaben nach §\u00a05\u00a0DDG', paragraphs: [CONTACT] },
    {
      heading: 'Verantwortlich für den Inhalt nach §\u00a018\u00a0Abs.\u00a02\u00a0MStV',
      paragraphs: ['[NAME], Anschrift wie oben'],
    },
    {
      heading: 'Über Pfadfinder',
      paragraphs: [
        'Pfadfinder ist ein privates, kostenloses Übungsangebot zur Vorbereitung auf Kompass\u00a04. Es steht in keiner Verbindung zum Kultusministerium Baden-Württemberg oder zum Institut für Bildungsanalysen Baden-Württemberg (IBBW).',
        'Alle Aufgaben sind selbst geschrieben. Sie ersetzen keine Beratung durch die Lehrkraft und sagen kein Testergebnis voraus.',
        'Schrift: Andika von SIL International, SIL Open Font License 1.1.',
      ],
    },
  ],
};

export const DATENSCHUTZ: LegalPage = {
  title: 'Datenschutz',
  sections: [
    {
      heading: 'Kurz gesagt',
      paragraphs: [
        'Alles, was dein Kind in Pfadfinder tut, bleibt auf diesem Gerät. Es gibt kein Konto, keine Werbung, kein Tracking und keine Cookies, und keine Antwort wird an uns geschickt.',
      ],
    },
    { heading: 'Verantwortlich', paragraphs: [CONTACT] },
    {
      heading: 'Was auf dem Gerät gespeichert wird',
      paragraphs: [
        'Pfadfinder speichert Antworten, Niveaus, Entdeckungen, Probetest-Durchgänge und die Wahl „Später“ im Speicher des Browsers (IndexedDB) auf diesem Gerät. Dazu kommen die Dateien der App selbst, damit sie auch ohne Internet läuft. Diese Daten verlassen das Gerät nicht, und wir können sie nicht sehen.',
        'Das Speichern ist nötig, damit die App den Fortschritt zeigen kann, den du mit ihr nutzen willst (§\u00a025\u00a0Abs.\u00a02\u00a0Nr.\u00a02\u00a0TDDDG). Eine Einwilligung braucht es dafür nicht.',
        'Löschen kannst du alles im Eltern-Bereich mit „Alles löschen“ oder indem du die Websitedaten im Browser löschst. Die „Sicherung“ im Eltern-Bereich ist eine Datei, die auf dem Gerät entsteht und nirgendwohin geschickt wird.',
      ],
    },
    {
      heading: 'Hosting bei Cloudflare',
      paragraphs: [
        'Die Dateien der App liegen bei Cloudflare, Inc., 101 Townsend St., San Francisco, CA 94107, USA. Wenn dein Browser sie abruft (beim ersten Laden und wenn er nach einer neuen Version sieht), erhält Cloudflare technisch nötige Angaben: IP-Adresse, Zeitpunkt, die abgerufene Datei und die Kennung des Browsers.',
        'Cloudflare nutzt diese Angaben, um die Dateien auszuliefern und die Seite vor Angriffen zu schützen, und hält sie in Zugriffsprotokollen fest. Rechtsgrundlage ist unser berechtigtes Interesse an einer sicheren Auslieferung (Art. 6 Abs. 1 lit. f DSGVO). Cloudflare ist nach dem EU-US Data Privacy Framework zertifiziert.',
      ],
    },
    {
      heading: 'Vorlesen',
      paragraphs: [
        'Zum Vorlesen nutzt Pfadfinder die Sprachausgabe des Browsers. Auf dem iPad bleibt sie auf dem Gerät; manche Browser, zum Beispiel Chrome mit Google-Stimmen, schicken den vorzulesenden Text an ihren Hersteller.',
        'Vorgelesen werden nur Aufgaben, Texte und Rückmeldungen der App, nie Eingaben deines Kindes.',
      ],
    },
    {
      heading: 'Deine Rechte',
      paragraphs: [
        'Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung und Widerspruch (Art. 15–21 DSGVO). Schreib dafür an die E-Mail-Adresse oben. Wir selbst haben keine Daten über dich oder dein Kind.',
        'Du kannst dich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren, zum Beispiel beim Landesbeauftragten für den Datenschutz und die Informationsfreiheit Baden-Württemberg.',
      ],
    },
    { heading: 'Stand', paragraphs: ['Oktober 2026'] },
  ],
};

export const LEGAL_BACK = 'Zurück';
