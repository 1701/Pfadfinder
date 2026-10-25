// Pictures from content/assets/svg, embedded inline (not as <img>) so they take ink color and
// Andika from the theme: the SVGs use currentColor and font-family="inherit". Printing later
// needs no change for the same reason. Safety rules for these files: CONTENT_SCHEMA.md §7.

import { ASSET_SOURCES } from './asset-sources';

const byId = new Map(
  Object.entries(ASSET_SOURCES).map(([path, svg]) => [path.replace(/^.*\/(.+)\.svg$/, '$1'), svg]),
);

/** Pictures wider than this (width : height) go below the text, narrower ones beside it. */
const WIDE_RATIO = 2;

/** True for a wide picture (from its viewBox); unknown ids count as wide. */
export function isWideAsset(assetId: string): boolean {
  const viewBox = /viewBox="([^"]+)"/.exec(byId.get(assetId) ?? '')?.[1]?.split(/[\s,]+/);
  const [width, height] = [Number(viewBox?.[2]), Number(viewBox?.[3])];
  return !(width > 0 && height > 0) || width / height > WIDE_RATIO;
}

function escapeAttribute(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** The SVG markup with the description as its accessible name; null for an unknown id. */
export function assetMarkup(assetId: string, alt: string): string | null {
  const svg = byId.get(assetId);
  if (svg === undefined) return null;
  return svg
    .replace(/<svg\b([^>]*?)\s+role="[^"]*"/, '<svg$1')
    .replace(/<svg\b/, `<svg role="img" aria-label="${escapeAttribute(alt)}" focusable="false"`);
}

export function ContentAsset({ assetId, alt }: { assetId: string; alt: string }) {
  const markup = assetMarkup(assetId, alt);
  if (markup === null) return null;
  // Content is validated at build time (no scripts, no event handlers, no external references).
  return <div className="content-asset" dangerouslySetInnerHTML={{ __html: markup }} />;
}
