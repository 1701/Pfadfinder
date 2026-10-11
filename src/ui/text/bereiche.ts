// Names of subjects and areas as children read them. The only place for these labels:
// review the list with an adult before children see changes.

import type { Bereich, Fach } from '../../domain/content';

export const FACH_NAME: Record<Fach, string> = {
  mathe: 'Mathe',
  deutsch: 'Deutsch',
};

export const BEREICH_NAME: Record<Bereich, string> = {
  'zahlen-operationen': 'Zahlen und Rechnen',
  'raum-form': 'Formen und Raum',
  'groessen-messen': 'Größen und Messen',
  'daten-zufall': 'Daten und Zufall',
  'muster-strukturen': 'Muster und Zahlenfolgen',
  'lesen-sachtext': 'Sachtexte lesen',
  'lesen-literarisch': 'Geschichten lesen',
  'rs-laut-buchstabe': 'Laute und Buchstaben',
  'rs-strategien': 'Rechtschreib-Tricks',
};
