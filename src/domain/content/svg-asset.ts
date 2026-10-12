// Rules for content/assets/svg (CONTENT_SCHEMA.md §7). The app embeds these files inline, so
// they must not bring scripts or external references, and they take color and font from the
// theme (currentColor, font-family="inherit") to work on screen and in print alike.

const COLOR_ATTRIBUTE = /\s(fill|stroke|color|stop-color)="([^"]*)"/g;

/** Problems of one SVG file as German messages for authors; empty when the file is fine. */
export function checkSvgAsset(svg: string): string[] {
  const problems: string[] = [];
  const root = /<svg\b[^>]*>/.exec(svg)?.[0];
  if (!root) return ['Kein <svg>-Element gefunden'];
  if (!/\sviewBox="[^"]+"/.test(root)) problems.push('<svg> braucht eine viewBox');
  if (/<(script|foreignObject|style|image|iframe)\b/i.test(svg)) {
    problems.push('Nicht erlaubt: <script>, <foreignObject>, <style>, <image>, <iframe>');
  }
  if (/\son[a-z]+\s*=/i.test(svg)) problems.push('Keine Event-Attribute (onload, onclick …)');
  if (/\s(xlink:)?href\s*=/i.test(svg) || /url\(/i.test(svg)) {
    problems.push('Keine Verweise (href, url()) – alles steht in der Datei selbst');
  }
  if (/\sstyle\s*=/i.test(svg)) problems.push('Kein style-Attribut – Farben über currentColor');
  for (const [, name, value] of svg.matchAll(COLOR_ATTRIBUTE)) {
    if (value !== 'currentColor' && value !== 'none') {
      problems.push(`${name}="${value}": nur currentColor oder none`);
    }
  }
  for (const [, value] of svg.matchAll(/\sfont-family="([^"]*)"/g)) {
    if (value !== 'inherit') problems.push(`font-family="${value}": nur inherit (Andika aus der App)`);
  }
  return problems;
}
