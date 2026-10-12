import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { checkSvgAsset } from '../../../src/domain/content';

const ok = (body: string, root = 'viewBox="0 0 10 10"') =>
  `<svg xmlns="http://www.w3.org/2000/svg" ${root} role="img">${body}</svg>`;

describe('checkSvgAsset', () => {
  it('accepts currentColor, none and inherited font', () => {
    expect(
      checkSvgAsset(
        ok(
          '<rect fill="currentColor" fill-opacity="0.2" stroke="none"/><text font-family="inherit">A</text>',
        ),
      ),
    ).toEqual([]);
  });

  it('rejects scripts, event handlers and external references', () => {
    expect(checkSvgAsset(ok('<script>alert(1)</script>'))).toHaveLength(1);
    expect(checkSvgAsset(ok('<rect onclick="x()"/>'))).toHaveLength(1);
    expect(checkSvgAsset(ok('<use href="other.svg#a"/>'))).toHaveLength(1);
    expect(checkSvgAsset(ok('<rect fill="currentColor" filter="url(#f)"/>'))).toHaveLength(1);
    expect(checkSvgAsset(ok('<foreignObject><div/></foreignObject>'))).toHaveLength(1);
  });

  it('rejects fixed colors, style attributes, other fonts and a missing viewBox', () => {
    expect(checkSvgAsset(ok('<rect fill="#ff0000"/>'))[0]).toMatch(/currentColor/);
    expect(checkSvgAsset(ok('<rect style="fill:red"/>'))).toHaveLength(1);
    expect(checkSvgAsset(ok('<text font-family="Arial">A</text>'))).toHaveLength(1);
    expect(checkSvgAsset(ok('', 'width="10"'))).toEqual(['<svg> braucht eine viewBox']);
    expect(checkSvgAsset('<div/>')).toEqual(['Kein <svg>-Element gefunden']);
  });

  it('holds for every asset in content/', () => {
    const dir = 'content/assets/svg';
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.svg'))) {
      expect(checkSvgAsset(readFileSync(`${dir}/${file}`, 'utf8')), file).toEqual([]);
    }
  });
});
