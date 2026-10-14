// Formats with a renderer. Kept apart from registry.ts so the start page can use the list
// without pulling the renderers (and Zod) into its bundle; a test keeps both in sync.

import type { Format } from '../../domain/content/types';

export const SUPPORTED_FORMATS = [
  'single-choice',
  'multi-choice',
  'number-input',
  'match',
  'order',
  'cloze-select',
  'mark-in-text',
  'find-error',
  'short-answer',
] as const satisfies readonly Format[];
