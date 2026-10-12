import { describe, expect, it } from 'vitest';
import { BEREICHE } from '../../../src/domain/content';
import { BEREICH_NAME } from '../../../src/ui/text/bereiche';
import {
  MAP_LAYOUTS,
  MAP_STYLE,
  insetPolygon,
  labelLines,
  type Point,
} from '../../../src/ui/map/geometry';

/** Twice the signed area; positive = clockwise on screen (y down). */
const area2 = (ps: readonly Point[]) =>
  ps.reduce((sum, [x, y], i) => {
    const [nx, ny] = ps[(i + 1) % ps.length]!;
    return sum + (x * ny - nx * y);
  }, 0);

function inside([x, y]: Point, ps: readonly Point[]): boolean {
  let c = false;
  for (let i = 0, j = ps.length - 1; i < ps.length; j = i++) {
    const [xi, yi] = ps[i]!;
    const [xj, yj] = ps[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

describe.each(Object.entries(MAP_LAYOUTS))('map layout %s', (_, layout) => {
  it('has all nine Gebiete, convex and clockwise, inside the viewBox', () => {
    expect(Object.keys(layout.regions).sort()).toEqual([...BEREICHE].sort());
    for (const bereich of BEREICHE) {
      const { points } = layout.regions[bereich];
      expect(area2(points), bereich).toBeGreaterThan(0);
      for (let i = 0; i < points.length; i++) {
        const a = points[i]!;
        const b = points[(i + 1) % points.length]!;
        const c = points[(i + 2) % points.length]!;
        const turn = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
        expect(turn, `${bereich} corner ${i + 1}`).toBeGreaterThanOrEqual(0);
      }
      for (const [x, y] of points) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(layout.width);
        expect(y).toBeLessThanOrEqual(layout.height);
      }
    }
  });

  it('keeps every label on the Gipfel plateau and both contour lines inside the Gebiet', () => {
    const [hang, gipfel] = MAP_STYLE.contours;
    for (const bereich of BEREICHE) {
      const shape = layout.regions[bereich];
      const plateau = insetPolygon(shape.points, gipfel);
      expect(inside(shape.label, plateau), bereich).toBe(true);
      for (const p of [...insetPolygon(shape.points, hang), ...plateau]) {
        expect(inside(p, shape.points), bereich).toBe(true);
      }
    }
  });
});

describe('insetPolygon', () => {
  it('moves every side inwards by the distance, also with a corner on a straight edge', () => {
    const square: Point[] = [
      [0, 0],
      [5, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];
    expect(insetPolygon(square, 2).map(([x, y]) => [Math.round(x), Math.round(y)])).toEqual([
      [2, 2],
      [8, 2],
      [8, 8],
      [2, 8],
    ]);
  });
});

describe('labelLines', () => {
  it('breaks every Gebiet name into two balanced lines', () => {
    expect(labelLines('Zahlen und Rechnen')).toEqual(['Zahlen und', 'Rechnen']);
    expect(labelLines('Rechtschreib-Tricks')).toEqual(['Rechtschreib-', 'Tricks']);
    expect(labelLines('Sachtexte lesen')).toEqual(['Sachtexte', 'lesen']);
    expect(labelLines('Karte')).toEqual(['Karte']);
    for (const bereich of BEREICHE) expect(labelLines(BEREICH_NAME[bereich])).toHaveLength(2);
  });
});
