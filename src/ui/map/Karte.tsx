// The expedition map (PRODUCT.md §6, the start page's one memorable element). Each Gebiet is a
// hill with three Höhenstufen: Fuß = Etappe I (along the coast), Hang = II, Gipfel = III (the
// plateau with the name). Contour lines follow the coast, the only decoration. A reached Etappe
// fills its Stufe with land, the Stufe the child is on now is lighter: progress grows as area
// from the coast inwards, the way explorers go. A Gebiet without enough tasks is a blank spot: dashed,
// no contour lines, not selectable. Both layouts are in the DOM; CSS shows one by orientation,
// and the hidden one is display:none, so it has no tab stops. With `fach` only that island is
// drawn (Einstieg result); `interactive={false}` draws the Gebiete as pictures, not links.

import clsx from 'clsx';
import { Fragment, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { useHref, useLinkClickHandler } from 'react-router';
import {
  BEREICHE,
  BEREICHE_BY_FACH,
  fachOfBereich,
  type Bereich,
  type Fach,
} from '../../domain/content/taxonomy';
import type { Niveau } from '../../domain/content/types';
import type { RegionState } from '../../domain/progress';
import { BEREICH_NAME, FACH_NAME } from '../text/bereiche';
import {
  MAP_LAYOUTS,
  MAP_STYLE,
  islandViewBox,
  labelLines,
  insetPolygon,
  toPath,
  type MapLayout,
  type RegionShape,
} from './geometry';

const ETAPPEN: readonly Niveau[] = [1, 2, 3];

export interface KarteProps {
  states: Record<Bereich, RegionState>;
  /** Only this island, cut to its size. */
  fach?: Fach;
  /** False: the Gebiete are pictures with their name and niveau, not links. */
  interactive?: boolean;
}

/** Name for screen readers: "Zahlen und Rechnen, Niveau 2". */
export function regionLabel(bereich: Bereich, state: RegionState): string {
  const name = BEREICH_NAME[bereich];
  if (state.kind === 'unerforscht') return `${name}, noch unerforscht`;
  return `${name}, Niveau ${state.niveau}${state.kind === 'gemeistert' ? ', gemeistert' : ''}`;
}

export function Karte(props: KarteProps) {
  return (
    <>
      <KartenLayout {...props} layout={MAP_LAYOUTS.wide} className="portrait:hidden" />
      <KartenLayout {...props} layout={MAP_LAYOUTS.tall} className="landscape:hidden" />
    </>
  );
}

function KartenLayout({
  layout,
  states,
  fach: only,
  interactive = true,
  className,
}: KarteProps & { layout: MapLayout; className: string }) {
  const islands = (Object.entries(layout.islands) as [Fach, readonly [number, number]][]).filter(
    ([fach]) => only === undefined || fach === only,
  );
  const bereiche: readonly Bereich[] = only ? BEREICHE_BY_FACH[only] : BEREICHE;
  return (
    <svg
      viewBox={only ? islandViewBox(layout, only) : `0 0 ${layout.width} ${layout.height}`}
      className={clsx('size-full bg-water', className)}
      role="group"
      aria-label="Karte"
    >
      {islands.map(([fach, [x, y]]) => (
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
      ))}
      {bereiche.map((bereich) => (
        <Gebiet
          key={bereich}
          bereich={bereich}
          shape={layout.regions[bereich]}
          state={states[bereich]}
          interactive={interactive}
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

function Gebiet({ interactive, ...props }: GebietProps & { interactive: boolean }) {
  const { bereich, shape, state } = props;
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
        <Label bereich={bereich} shape={shape} muted />
      </g>
    );
  }
  if (!interactive) {
    return (
      <g role="img" aria-label={regionLabel(bereich, state)}>
        <GebietZeichnung bereich={bereich} shape={shape} state={state} />
      </g>
    );
  }
  return <GebietLink bereich={bereich} shape={shape} state={state} />;
}

type OpenGebietProps = GebietProps & { state: Exclude<RegionState, { kind: 'unerforscht' }> };

function GebietLink({ bereich, shape, state }: OpenGebietProps) {
  const to = `/ueben/${fachOfBereich(bereich)}/${bereich}`;
  const href = useHref(to);
  // React types an <a> inside SVG like the HTML element; only the event is used here.
  const onClick = useLinkClickHandler<HTMLAnchorElement>(to);
  return (
    <a
      href={href}
      onClick={onClick}
      aria-label={regionLabel(bereich, state)}
      className="map-region"
    >
      <GebietZeichnung bereich={bereich} shape={shape} state={state} />
    </a>
  );
}

/** The hill with its three Höhenstufen, contour lines, outline and name sign. */
function GebietZeichnung({ bereich, shape, state }: OpenGebietProps) {
  const [hangDistance, gipfelDistance] = MAP_STYLE.contours;
  const hang = insetPolygon(shape.points, hangDistance);
  const gipfel = insetPolygon(shape.points, gipfelDistance);
  const stufen = [shape.points, hang, gipfel];

  const fill = (index: number) =>
    state.erschlossen[index]
      ? 'fill-land'
      : state.kind === 'unterwegs' && state.niveau === index + 1
        ? 'fill-land-soft'
        : 'fill-surface';

  return (
    <>
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
      <Label bereich={bereich} shape={shape} state={state} plate={fill(2)} />
    </>
  );
}

function Label({
  bereich,
  shape,
  state,
  plate,
  muted = false,
}: {
  bereich: Bereich;
  shape: RegionShape;
  state?: Exclude<RegionState, { kind: 'unerforscht' }>;
  /** Fill class of the plateau: the name stands on a small sign in this color. */
  plate?: string;
  muted?: boolean;
}) {
  const { labelSize, labelLineHeight, mark } = MAP_STYLE;
  const [x, y] = shape.label;
  const lines = labelLines(BEREICH_NAME[bereich]);
  const textTop =
    y - (lines.length * labelLineHeight + (state ? mark.offset + mark.height : 0)) / 2;
  const marksTop = textTop + lines.length * labelLineHeight + mark.offset;
  const marksLeft = x - (3 * mark.width + 2 * mark.gap) / 2;
  const content = useRef<SVGGElement>(null);
  const box = useTextBox(content, `${lines.join('|')}:${state?.niveau ?? ''}`, {
    // Before the browser can measure (and in tests): estimated from the longest line.
    x: x - (Math.max(...lines.map((l) => l.length)) * MAP_STYLE.labelCharWidth) / 2,
    y: textTop,
    width: Math.max(...lines.map((l) => l.length)) * MAP_STYLE.labelCharWidth,
    height: marksTop + (state ? mark.height + mark.ring : 0) - textTop,
  });
  const { padding, radius } = MAP_STYLE.plate;

  return (
    <g aria-hidden="true">
      {/* A small sign in the plateau's color: it interrupts the contour lines cleanly. */}
      {plate && (
        <rect
          data-plate=""
          x={box.x - padding}
          y={box.y - padding}
          width={box.width + 2 * padding}
          height={box.height + 2 * padding}
          rx={radius}
          className={plate}
        />
      )}
      <g ref={content}>
        <text
          x={x}
          fontSize={labelSize}
          textAnchor="middle"
          className={clsx('font-bold', muted ? 'fill-ink-muted' : 'fill-ink')}
        >
          {/* A space between the lines keeps the visible name whole ("Formen und Raum") for
              tools that read the text, so it matches the link's accessible name (WCAG 2.5.3). */}
          {lines.map((line, i) => (
            <Fragment key={line}>
              {i > 0 && ' '}
              <tspan x={x} y={textTop + (i + 1) * labelLineHeight - labelLineHeight / 4}>
                {line}
              </tspan>
            </Fragment>
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
    </g>
  );
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Bounding box of the label in map units, measured again once the web font has loaded. */
function useTextBox(
  ref: RefObject<SVGGElement | null>,
  /** Changes when the label's content changes: measure again. */
  contentKey: string,
  estimate: Box,
): Box {
  const [measured, setMeasured] = useState<Box | null>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || typeof element.getBBox !== 'function') return;
    let active = true;
    const measure = () => {
      if (!active) return;
      const { x, y, width, height } = element.getBBox();
      if (width > 0) setMeasured({ x, y, width, height });
    };
    measure();
    void document.fonts?.ready.then(measure);
    return () => {
      active = false;
    };
  }, [ref, contentKey]);
  return measured ?? estimate;
}
