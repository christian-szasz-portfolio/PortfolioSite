import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ContactGlyphs } from '@christian-szasz-portfolio/common-web';

import { Cv, CvContactIcon } from '../../../../data/cv.types';

/** The sheet's own filled glyphs; the site's stroked set would quietly redraw the document */
const GLYPHS: Readonly<Record<CvContactIcon, string>> = {
  [CvContactIcon.Phone]: ContactGlyphs.phone,
  [CvContactIcon.Email]: ContactGlyphs.email,
  [CvContactIcon.Location]: ContactGlyphs.location,
  [CvContactIcon.Linkedin]: ContactGlyphs.linkedin,
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
    return GLYPHS[icon];
  }
}
