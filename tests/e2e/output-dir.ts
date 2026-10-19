// Where the e2e specs and `npm run screenshots` write screenshots and budget JSON: normally the
// gitignored tests/e2e/output/ (uploaded as an artifact in CI), so a normal run leaves git
// clean. Only with PFADFINDER_UPDATE_SCREENSHOTS=1 into the versioned tests/e2e/screenshots/,
// for a deliberate UI change (CLAUDE.md, "Screenshots").

import { mkdirSync } from 'node:fs';

export const SCREENSHOTS =
  process.env.PFADFINDER_UPDATE_SCREENSHOTS === '1' ? 'tests/e2e/screenshots' : 'tests/e2e/output';

// writeFileSync does not create the folder; page.screenshot would.
mkdirSync(SCREENSHOTS, { recursive: true });
