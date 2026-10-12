// The built app as a home-screen app: manifest, icons for Android/Chromium and iOS, theme colour.
// Runs against the production build (preview server), like Cloudflare serves it.

import { expect, test } from '@playwright/test';

test('Manifest, Icons und iOS-Angaben für den Home-Bildschirm', async ({ page, request }) => {
  await page.goto('/');
  const head = await page.evaluate(() => ({
    manifest: document.querySelector('link[rel="manifest"]')?.getAttribute('href'),
    appleTouchIcon: document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href'),
    themeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
  }));
  expect(head).toEqual({
    manifest: '/manifest.webmanifest',
    appleTouchIcon: '/icons/apple-touch-icon-180.png',
    themeColor: '#163a2f',
  });

  const manifest = await (await request.get(head.manifest!)).json();
  expect(manifest).toMatchObject({
    display: 'standalone',
    start_url: '/',
    scope: '/',
    theme_color: '#163a2f',
    background_color: '#eef3f1',
  });
  const purposes = (manifest.icons as { purpose: string; sizes: string }[]).map(
    (i) => `${i.sizes} ${i.purpose}`,
  );
  expect(purposes).toEqual(['192x192 any', '512x512 any', '512x512 maskable']);

  for (const src of [...manifest.icons.map((i: { src: string }) => i.src), head.appleTouchIcon]) {
    const response = await request.get(src);
    expect(response.status(), src).toBe(200);
    expect(response.headers()['content-type'], src).toBe('image/png');
    const png = await response.body();
    expect(png[25], `${src}: no alpha channel`).toBe(2);
  }
});
