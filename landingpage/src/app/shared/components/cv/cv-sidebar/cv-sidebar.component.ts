import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ContactGlyphs } from '@christian-szasz-portfolio/common-web';

import { Cv, CvContactIcon } from '../../../../data/cv.types';

/** The viewBox a glyph was drawn for */
enum GlyphCanvas {
  Standard = '0 0 24 24',
  Octocat = '0 0 16 16',
}

interface Glyph {
  readonly path: string;
  readonly canvas: GlyphCanvas;
}

/** The sheet's own filled glyphs; the site's stroked set would quietly redraw the document */
const GLYPHS: Readonly<Record<CvContactIcon, Glyph>> = {
  [CvContactIcon.Phone]: { path: ContactGlyphs.phone, canvas: GlyphCanvas.Standard },
  [CvContactIcon.Email]: { path: ContactGlyphs.email, canvas: GlyphCanvas.Standard },
  [CvContactIcon.Location]: { path: ContactGlyphs.location, canvas: GlyphCanvas.Standard },
  [CvContactIcon.Website]: { path: ContactGlyphs.website, canvas: GlyphCanvas.Standard },
  [CvContactIcon.Linkedin]: { path: ContactGlyphs.linkedin, canvas: GlyphCanvas.Standard },
  [CvContactIcon.Github]: { path: ContactGlyphs.github, canvas: GlyphCanvas.Octocat },
};

/** The blue column: who to contact, what he knows, where he studied */
@Component({
  selector: 'lpg-cv-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cv-sidebar.component.html',
  styleUrl: './cv-sidebar.component.scss',
})
export class CvSidebarComponent {
  public readonly cv = input.required<Cv>();

  protected glyph(icon: CvContactIcon): string {
    return GLYPHS[icon].path;
  }

  protected canvas(icon: CvContactIcon): string {
    return GLYPHS[icon].canvas;
  }
}
