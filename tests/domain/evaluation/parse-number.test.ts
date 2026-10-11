import { describe, expect, it } from 'vitest';
import { parseGermanNumber } from '../../../src/domain/evaluation';

describe('parseGermanNumber', () => {
  it.each<[string, number]>([
    ['7603', 7603],
    ['0', 0],
    ['007', 7],
    ['2,5', 2.5],
    ['0,75', 0.75],
    ['  12  ', 12],
    ['4 735', 4735],
    ['1 000 000', 1000000],
    ['4 735', 4735],
    ['1.000', 1000],
    ['1.250.000', 1250000],
    ['1.000,5', 1000.5],
  ])('parses "%s" as %d', (input, expected) => {
    expect(parseGermanNumber(input)).toBe(expected);
  });

  it.each([
    ['empty', ''],
    ['only spaces', '   '],
    ['trailing comma', '3,'],
    ['leading comma', ',5'],
    ['two commas', '1,2,3'],
    ['dot as decimal (ambiguous)', '1.5'],
    ['bad grouping', '10.00'],
    ['negative', '-3'],
    ['letters', '12a'],
    ['English decimal', '2.50'],
  ])('rejects %s', (_name, input) => {
    expect(parseGermanNumber(input)).toBeNull();
  });
});
