// The expedition map as data (PRODUCT.md §6): two islands, Mathe and Deutsch, with flat polygons
// for the nine Gebiete. Two layouts with the same neighbours and reading order: "wide" for
// landscape, "tall" (islands one above the other) for portrait. All coordinates and drawing
// measures live here, in viewBox units; components only read them.
// Shared corners keep the Gebiete gap-free: N lies on the edge F–G, so it is part of the
// polygons on both sides.

import type { Bereich, Fach } from '../../domain/content/taxonomy';

export type Point = readonly [x: number, y: number];

export interface RegionShape {
  /** Convex outline, clockwise on screen. */
  points: readonly Point[];
  /** Center of the label (name and Etappen marks), on the Gipfel plateau. */
  label: Point;
}

export interface MapLayout {
  width: number;
  height: number;
  /** Island names, left baseline. */
  islands: Record<Fach, Point>;
  regions: Record<Bereich, RegionShape>;
}

/** Drawing measures in viewBox units, the same for both layouts. */
export const MAP_STYLE = {
  /** The two contour lines: distance from the coast (Hang, Gipfel). */
  contours: [14, 28],
  labelSize: 24,
  labelLineHeight: 28,
  islandNameSize: 28,
  /** Etappen marks below the name, like the Wegstriche of the item screen. */
  mark: { width: 18, height: 9, gap: 6, offset: 14 },
  /** Halo around the name in the plateau's color, where a long name meets a contour line. */
  labelHalo: 6,
  outlineWidth: 2,
  contourWidth: 1.5,
  unexploredDash: '8 6',
} as const;

// Corners of the wide layout (viewBox 1000 × 600).
// prettier-ignore
const W = {
  A: [40, 70], B: [220, 40], C: [390, 55], D: [560, 95],
  E: [30, 310], F: [240, 280], N: [310, 290], G: [380, 300], H: [570, 330],
  I: [60, 560], J: [300, 580], K: [540, 545],
  P: [625, 110], Q: [800, 80], R: [980, 120],
  S: [615, 300], T: [800, 310], U: [985, 290],
  V: [645, 540], X: [965, 520], Y: [805, 560],
} as const satisfies Record<string, Point>;

// Corners of the tall layout (viewBox 720 × 900).
// prettier-ignore
const T = {
  A: [30, 70], B: [250, 45], C: [470, 55], D: [700, 90],
  E: [20, 265], F: [240, 255], N: [360, 262], G: [480, 258], H: [705, 272],
  I: [50, 445], J: [370, 465], K: [680, 435],
  P: [40, 560], Q: [370, 540], R: [690, 570],
  S: [30, 715], T: [360, 725], U: [700, 705],
  V: [60, 875], X: [670, 865], Y: [380, 885],
} as const satisfies Record<string, Point>;

export const MAP_LAYOUTS: Record<'wide' | 'tall', MapLayout> = {
  wide: {
    width: 1000,
    height: 600,
    islands: { mathe: [40, 28], deutsch: [625, 62] },
    regions: {
      'zahlen-operationen': { points: [W.A, W.B, W.F, W.E], label: [132, 175] },
      'raum-form': { points: [W.B, W.C, W.G, W.N, W.F], label: [308, 193] },
      'groessen-messen': { points: [W.C, W.D, W.H, W.G], label: [475, 185] },
      'daten-zufall': { points: [W.E, W.F, W.N, W.J, W.I], label: [188, 404] },
      'muster-strukturen': {
        points: [W.N, W.G, W.H, W.K, W.J],
        label: [420, 401],
      },
      'lesen-sachtext': { points: [W.P, W.Q, W.T, W.S], label: [710, 200] },
      'lesen-literarisch': { points: [W.Q, W.R, W.U, W.T], label: [891, 200] },
      'rs-laut-buchstabe': { points: [W.S, W.T, W.Y, W.V], label: [716, 428] },
      'rs-strategien': { points: [W.T, W.U, W.X, W.Y], label: [889, 420] },
    },
  },
  tall: {
    width: 720,
    height: 900,
    islands: { mathe: [30, 32], deutsch: [30, 525] },
    regions: {
      'zahlen-operationen': { points: [T.A, T.B, T.F, T.E], label: [135, 159] },
      'raum-form': { points: [T.B, T.C, T.G, T.N, T.F], label: [360, 175] },
      'groessen-messen': { points: [T.C, T.D, T.H, T.G], label: [589, 169] },
      'daten-zufall': { points: [T.E, T.F, T.N, T.J, T.I], label: [208, 338] },
      'muster-strukturen': {
        points: [T.N, T.G, T.H, T.K, T.J],
        label: [519, 338],
      },
      'lesen-sachtext': { points: [T.P, T.Q, T.T, T.S], label: [200, 635] },
      'lesen-literarisch': { points: [T.Q, T.R, T.U, T.T], label: [530, 635] },
      'rs-laut-buchstabe': { points: [T.S, T.T, T.Y, T.V], label: [208, 800] },
      'rs-strategien': { points: [T.T, T.U, T.X, T.Y], label: [528, 795] },
    },
  },
};

/** Element of a closed ring: index -1 is the last one. */
function around<T>(list: readonly T[], index: number): T {
  return list[(index + list.length) % list.length] as T;
}

/**
 * A contour line: the convex outline moved inwards by `distance` on every side (each edge
 * shifted along its inner normal, neighbours intersected). Corners on a straight edge (like N)
 * are dropped first, since parallel edges have no intersection.
 */
export function insetPolygon(points: readonly Point[], distance: number): Point[] {
  const corners = points.filter((p, i) => {
    const a = around(points, i - 1);
    const b = around(points, i + 1);
    return Math.abs((p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0])) > 1e-6;
  });
  // Clockwise on screen (y down): the inner normal of edge (dx, dy) is (-dy, dx).
  const lines = corners.map((p, i) => {
    const q = around(corners, i + 1);
    const [dx, dy] = [q[0] - p[0], q[1] - p[1]];
    const length = Math.hypot(dx, dy);
    const [nx, ny] = [(-dy / length) * distance, (dx / length) * distance];
    return { x: p[0] + nx, y: p[1] + ny, dx, dy };
  });
  return lines.map((l, i) => {
    const m = around(lines, i - 1);
    // Intersection of the previous edge line m and this edge line l.
    const t = ((l.x - m.x) * l.dy - (l.y - m.y) * l.dx) / (m.dx * l.dy - m.dy * l.dx);
    return [m.x + m.dx * t, m.y + m.dy * t] as const;
  });
}

export function toPath(points: readonly Point[]): string {
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}

/**
 * A Gebiet's name in two lines, broken at the space or hyphen that keeps the longer line
 * shortest: "Laute und / Buchstaben", "Rechtschreib- / Tricks". One word stays one line.
 */
export function labelLines(name: string): string[] {
  let best: string[] = [name];
  for (let i = 1; i < name.length; i++) {
    const breakAfter = name[i - 1] === '-' ? i : name[i] === ' ' ? i : -1;
    if (breakAfter < 0) continue;
    const lines = [name.slice(0, breakAfter), name.slice(breakAfter).trimStart()];
    if (Math.max(...lines.map((l) => l.length)) < Math.max(...best.map((l) => l.length))) {
      best = lines;
    }
  }
  return best;
}
