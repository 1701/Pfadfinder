// A static server for update.spec: serves one build directory like Cloudflare does (SPA fallback,
// max-age=0 + must-revalidate), and can switch to a second build while the page stays open.

import { createServer, type Server } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
};

export interface BuildServer {
  url: string;
  serve(dir: string): void;
  close(): Promise<void>;
}

export async function startBuildServer(dir: string, port: number): Promise<BuildServer> {
  let root = dir;
  const server: Server = createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname);
    let file = path.join(root, pathname);
    const isFile = await stat(file).then(
      (s) => s.isFile(),
      () => false,
    );
    if (!isFile) file = path.join(root, 'index.html');
    response.writeHead(200, {
      'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream',
      'cache-control': 'public, max-age=0, must-revalidate',
    });
    response.end(await readFile(file));
  });
  await new Promise<void>((resolve) => server.listen(port, 'localhost', resolve));
  return {
    url: `http://localhost:${port}`,
    serve: (next) => (root = next),
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}
