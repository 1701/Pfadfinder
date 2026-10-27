import { describe, expect, it } from 'vitest';
import {
  BEREICHE,
  TYPEN_FILE,
  checkTypen,
  validateContent,
  type ContentFile,
} from '../../../src/domain/content';
import { toFiles } from '../../fixtures/builders';
import { numberInput } from '../../fixtures/items';
import { FIXTURE_TYPEN } from '../../fixtures/typen';

const [first, second] = BEREICHE;

describe('checkTypen (typen.json, CONTENT_SCHEMA §1 since 1.0.27)', () => {
  it('accepts one non-empty list of strings per Bereich', () => {
    expect(checkTypen(FIXTURE_TYPEN)).toEqual([]);
  });

  it('reports a missing Bereich', () => {
    const { [first]: _missing, ...rest } = FIXTURE_TYPEN;
    expect(checkTypen(rest)).toEqual([`Bereich "${first}" fehlt`]);
  });

  it('reports an unknown Bereich', () => {
    expect(checkTypen({ ...FIXTURE_TYPEN, geometrie: ['Probetyp'] })).toEqual([
      'Unbekannter Bereich "geometrie"',
    ]);
  });

  it('reports an empty list, a missing list and entries that are no text', () => {
    expect(checkTypen({ ...FIXTURE_TYPEN, [first]: [] })).toEqual([
      `"${first}": Liste von Aufgabentypen fehlt oder ist leer`,
    ]);
    expect(checkTypen({ ...FIXTURE_TYPEN, [first]: 'Probetyp' })).toEqual([
      `"${first}": Liste von Aufgabentypen fehlt oder ist leer`,
    ]);
    expect(checkTypen({ ...FIXTURE_TYPEN, [second]: ['Probetyp', 3, ' '] })).toEqual([
      `"${second}": jeder Aufgabentyp ist ein nicht leerer Text`,
    ]);
  });

  it('reports a file that is no object', () => {
    for (const data of [null, [], 'Probetyp']) expect(checkTypen(data)).toHaveLength(1);
  });
});

describe('validateContent – typen.json', () => {
  const run = (data: unknown) => {
    const files: ContentFile[] = [...toFiles({ items: [numberInput] }), { path: TYPEN_FILE, data }];
    return validateContent(files, { assetExists: () => false }).issues;
  };

  it('is an expected content file', () => {
    expect(run(FIXTURE_TYPEN)).toEqual([]);
  });

  it('reports its problems as errors of the file', () => {
    expect(run({ ...FIXTURE_TYPEN, [first]: [] })).toEqual([
      {
        severity: 'error',
        file: TYPEN_FILE,
        message: `"${first}": Liste von Aufgabentypen fehlt oder ist leer`,
      },
    ]);
  });
});
