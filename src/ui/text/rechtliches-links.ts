// The link labels on their own: the map (start bundle) links to the pages without loading their
// text, which stays in the lazy chunks of RechtlichesScreen and SoGehtsScreen.

export const IMPRESSUM_LINK = 'Impressum';
export const DATENSCHUTZ_LINK = 'Datenschutz';
/**
 * /so-gehts, on /eltern/geraet and at the end of Impressum and Datenschutz. Not on the map: with it
 * the line below the map needed 723 of 720 px in portrait (2026-10-22, decision Markus).
 */
export const SO_GEHTS_LINK = 'So geht’s';
/**
 * /eltern, the page for parents and teachers (task L): at the end of Impressum, Datenschutz and
 * /so-gehts. The installed app has no address bar, so these links are its way there.
 */
export const ELTERN_LINK = 'Für Eltern';
/**
 * /eltern in the line below the map, before "Impressum" (task L). Short: "Für Eltern" made the line
 * wrap in portrait (768 px), "Eltern" fits in every viewport without changing the map.
 */
export const ELTERN_MAP_LINK = 'Eltern';
/** /eltern/geraet (backup, delete, build): on /eltern and beside "Für Eltern" on the legal pages. */
export const GERAET_LINK = 'Sicherung und Gerät';
