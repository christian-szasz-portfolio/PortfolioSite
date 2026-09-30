/** The case-study diagrams, drawn by `npm run diagrams`: a folder per diagram, one file per locale */

import { ArticleBlock, BlockKind } from '../content.types';

/** Which drawing to load: translated like any other string, so each locale build picks its own */
const DIAGRAM_LOCALE = $localize`:@@diagram.locale:en`;

/** A figure block for one diagram; the SVG scales, so both sizes point at the same file */
export function diagram(
  name: string,
  width: number,
  height: number,
  alt: string,
  caption: string,
): ArticleBlock {
  const src = `assets/img/diagrams/${name}/${DIAGRAM_LOCALE}.svg`;

  return { kind: BlockKind.Figure, src, srcSmall: src, alt, caption, width, height };
}
