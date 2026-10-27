// The page for parents and teachers (/eltern, task L) as its own lazy chunk: static text, the
// overview from the manifest and content/typen.json. No IndexedDB; the device area is
// /eltern/geraet (geraet-route).

import manifest from '../../content/manifest.json';
import typen from '../../content/typen.json';
import type { ContentManifest } from '../domain/content/manifest';
import type { AufgabenTypen } from '../domain/content/typen';
import { ElternScreen } from '../ui/screens/ElternScreen';

export function ElternRoute() {
  return <ElternScreen manifest={manifest as ContentManifest} typen={typen as AufgabenTypen} />;
}
