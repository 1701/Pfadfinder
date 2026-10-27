// The link labels on their own: the map (start bundle) links to the pages without loading their
// text, which stays in the lazy chunks of RechtlichesScreen and SoGehtsScreen. Also the labels of
// the top line of the pages for adults (ErwachsenenKopf, task N).

export const IMPRESSUM_LINK = 'Impressum';
export const DATENSCHUTZ_LINK = 'Datenschutz';
/**
 * /so-gehts, in the top line of the other pages for adults. Not on the map: with it the line below
 * the map needed 723 of 720 px in portrait (2026-10-22, decision Markus).
 */
export const SO_GEHTS_LINK = 'So geht’s';
/** /eltern, the page for parents and teachers (task L): at the end of /so-gehts. */
export const ELTERN_LINK = 'Für Eltern';
/**
 * /eltern in the line below the map, before "Impressum" (task L), and in the top line of the pages
 * for adults (task N). Short: "Für Eltern" made the line wrap in portrait (768 px), "Eltern" fits
 * in every viewport without changing the map.
 */
export const ELTERN_MAP_LINK = 'Eltern';
/**
 * /eltern/geraet (backup, delete, build): in the text of /eltern and in the top line of the other
 * pages for adults. The installed app has no address bar, so these links are its way there.
 */
export const GERAET_LINK = 'Sicherung und Gerät';
/** Top left on every page for adults: to the map, from /eltern/geraet to /eltern (task N). */
export const KOPF_BACK = 'Zurück';
/** The name of the links in the top line, for screen readers. */
export const KOPF_LABEL = 'Seiten für Erwachsene';
