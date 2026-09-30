import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ArrowGlyphs } from '@christian-szasz-portfolio/common-web';

export interface Crumb {
  readonly label: string;
  /** Absent on the last crumb, which is the page you are already on */
  readonly path?: string;
  /** For a crumb that points at a section rather than a page */
  readonly fragment?: string;
}

/** Where this page sits, and the way back up */
@Component({
  selector: 'lpg-breadcrumbs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './breadcrumbs.component.html',
  styleUrl: './breadcrumbs.component.scss',
})
export class BreadcrumbsComponent {
  protected readonly glyphs = ArrowGlyphs;

  public readonly trail = input.required<readonly Crumb[]>();
}
