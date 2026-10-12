// The expedition map (PRODUCT.md §6, the start page's one memorable element). Each Gebiet is a
// hill with three Höhenstufen: Fuß = Etappe I (along the coast), Hang = II, Gipfel = III (the
// plateau with the name). Contour lines follow the coast, the only decoration. A reached Etappe
// fills its Stufe with land, the Stufe the child is on now is lighter: progress grows as area
// from the coast inwards, the way explorers go. A Gebiet without enough tasks is a blank spot: dashed,
// no contour lines, not selectable. Both layouts are in the DOM; CSS shows one by orientation,
// and the hidden one is display:none, so it has no tab stops.

import clsx from 'clsx';
import { useHref, useLinkClickHandler } from 'react-router';
import { BEREICHE, fachOfBereich, type Bereich, type Fach } from '../../domain/content/taxonomy';
import type { Niveau } from '../../domain/content/types';
import type { RegionState } from '../../domain/progress';
import { BEREICH_NAME, FACH_NAME } from '../text/bereiche';
import {
  MAP_LAYOUTS,
  MAP_STYLE,
  labelLines,
  insetPolygon,
  toPath,
  type MapLayout,
  type RegionShape,
} from './geometry';

const ETAPPEN: readonly Niveau[] = [1, 2, 3];

/** The name's halo takes the plateau's color. */
const HALO = {
  'fill-land': 'stroke-land',
  'fill-land-soft': 'stroke-land-soft',
  'fill-surface': 'stroke-surface',
} as const;

export interface KarteProps {
  states: Record<Bereich, RegionState>;
}

/** Name for screen readers: "Zahlen und Rechnen, Niveau 2". */
export function regionLabel(bereich: Bereich, state: RegionState): string {
  const name = BEREICH_NAME[bereich];
  if (state.kind === 'unerforscht') return `${name}, noch unerforscht`;
  return `${name}, Niveau ${state.niveau}${state.kind === 'gemeistert' ? ', gemeistert' : ''}`;
}

export function Karte({ states }: KarteProps) {
  return (
    <>
      <KartenLayout layout={MAP_LAYOUTS.wide} states={states} className="portrait:hidden" />
      <KartenLayout layout={MAP_LAYOUTS.tall} states={states} className="landscape:hidden" />
    </>
  );
}

function KartenLayout({
  layout,
  states,
  className,
}: KarteProps & { layout: MapLayout; className: string }) {
  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      className={clsx('size-full bg-water', className)}
      role="group"
      aria-label="Karte"
    >
      {(Object.entries(layout.islands) as [Fach, readonly [number, number]][]).map(
        ([fach, [x, y]]) => (
          <text
            key={fach}
            x={x}
            y={y}
            fontSize={MAP_STYLE.islandNameSize}
            className="fill-ink-muted font-bold"
            aria-hidden="true"
          >
            {FACH_NAME[fach]}
          </text>
        ),
      )}
      {BEREICHE.map((bereich) => (
        <Gebiet
          key={bereich}
          bereich={bereich}
          shape={layout.regions[bereich]}
          state={states[bereich]}
        />
      ))}
    </svg>
  );
}

interface GebietProps {
  bereich: Bereich;
  shape: RegionShape;
  state: RegionState;
}

function Gebiet({ bereich, shape, state }: GebietProps) {
  if (state.kind === 'unerforscht') {
    return (
      <g role="img" aria-label={regionLabel(bereich, state)}>
        <polygon
          points={toPath(shape.points)}
          className="fill-surface stroke-line-strong"
          strokeWidth={MAP_STYLE.outlineWidth}
          strokeDasharray={MAP_STYLE.unexploredDash}
          strokeLinejoin="round"
        />
        <Label bereich={bereich} shape={shape} halo="stroke-surface" muted />
      </g>
    );
  }
  return <GebietLink bereich={bereich} shape={shape} state={state} />;
}

function GebietLink({
  bereich,
  shape,
  state,
}: GebietProps & { state: Exclude<RegionState, { kind: 'unerforscht' }> }) {
  const to = `/ueben/${fachOfBereich(bereich)}/${bereich}`;
  const href = useHref(to);
  // React types an <a> inside SVG like the HTML element; only the event is used here.
  const onClick = useLinkClickHandler<HTMLAnchorElement>(to);
  const [hangDistance, gipfelDistance] = MAP_STYLE.contours;
  const hang = insetPolygon(shape.points, hangDistance);
  const gipfel = insetPolygon(shape.points, gipfelDistance);
  const stufen = [shape.points, hang, gipfel];

  const fill = (index: number): keyof typeof HALO =>
    state.erschlossen[index]
      ? 'fill-land'
      : state.kind === 'unterwegs' && state.niveau === index + 1
        ? 'fill-land-soft'
        : 'fill-surface';

  return (
    <a
      href={href}
      onClick={onClick}
      aria-label={regionLabel(bereich, state)}
      className="map-region"
    >
      {stufen.map((points, i) => (
        <polygon key={i} points={toPath(points)} className={fill(i)} />
      ))}
      {/* Thin, round contour lines: the Höhenstufen speak through their areas, not lines. */}
      <g
        className="fill-none stroke-line"
        strokeWidth={MAP_STYLE.contourWidth}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      >
        <polygon points={toPath(hang)} />
        <polygon points={toPath(gipfel)} />
      </g>
      <polygon
        points={toPath(shape.points)}
        className="map-outline fill-none stroke-ink-muted"
        strokeWidth={MAP_STYLE.outlineWidth}
        strokeLinejoin="round"
      />
      <Label bereich={bereich} shape={shape} state={state} halo={HALO[fill(2)]} />
    </a>
  );
}

function Label({
  bereich,
  shape,
  state,
  halo,
  muted = false,
}: {
  bereich: Bereich;
  shape: RegionShape;
  state?: Exclude<RegionState, { kind: 'unerforscht' }>;
  /** Stroke class in the color of the area under the name. */
  halo: string;
  muted?: boolean;
}) {
  const { labelSize, labelLineHeight, mark } = MAP_STYLE;
  const [x, y] = shape.label;
  const lines = labelLines(BEREICH_NAME[bereich]);
  const textTop =
    y - (lines.length * labelLineHeight + (state ? mark.offset + mark.height : 0)) / 2;
  const marksTop = textTop + lines.length * labelLineHeight + mark.offset;
  const marksLeft = x - (3 * mark.width + 2 * mark.gap) / 2;

  return (
    <g aria-hidden="true">
      <text
        x={x}
        fontSize={labelSize}
        textAnchor="middle"
        paintOrder="stroke"
        strokeWidth={MAP_STYLE.labelHalo}
        strokeLinejoin="round"
        className={clsx('font-bold', halo, muted ? 'fill-ink-muted' : 'fill-ink')}
      >
        {lines.map((line, i) => (
          <tspan key={line} x={x} y={textTop + (i + 1) * labelLineHeight - labelLineHeight / 4}>
            {line}
          </tspan>
        ))}
      </text>
      {state &&
        ETAPPEN.map((etappe, i) => {
          // Two separate signs: the fill says "reached", the ring says "you are here".
          const reached = state.erschlossen[i];
          const x = marksLeft + i * (mark.width + mark.gap);
          return (
            <g key={etappe} data-etappe={etappe}>
              <rect
                x={x}
                y={marksTop}
                width={mark.width}
                height={mark.height}
                rx={mark.height / 2}
                strokeWidth={MAP_STYLE.outlineWidth}
                className={reached ? 'fill-ink stroke-ink' : 'fill-line stroke-line'}
              />
              {state.niveau === etappe && (
                <rect
                  data-current=""
                  x={x - mark.ring}
                  y={marksTop - mark.ring}
                  width={mark.width + 2 * mark.ring}
                  height={mark.height + 2 * mark.ring}
                  rx={mark.height / 2 + mark.ring}
                  strokeWidth={MAP_STYLE.outlineWidth}
                  className="fill-none stroke-ink"
                />
              )}
            </g>
          );
        })}
    </g>
  );
}
