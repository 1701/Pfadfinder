// What a child reads before practice goes on: today's open round can be continued or started anew.

export const CHOICE_TITLE = 'Hier warst du heute schon unterwegs.';
export const CHOICE_TEXT = 'Mach weiter oder fang eine neue Runde an.';
export const RESUME = 'Fortsetzen';
export const RESTART = 'Neu anfangen';

/** Every text above, for the language checks in tests/ui/text.test.ts. */
export const UEBEN_TEXTS = [CHOICE_TITLE, CHOICE_TEXT, RESUME, RESTART] as const;
