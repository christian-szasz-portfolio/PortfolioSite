import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { projects } from '../../../../data/projects';
import { PageHeaderComponent } from '../../headings/page-header/page-header.component';

/** What either page showing this content should tell a crawler. */
export const notFoundSeo = {
  title: $localize`:@@notFound.page.title:Page not found - Christian-Ioan Szasz`,
  description: $localize`:@@notFound.page.description:That page is not here. The four projects and the home page are.`,
  path: '/404',
  indexable: false,
} as const;

/** The body of a 404: what happened, and somewhere to go instead. */
@Component({
  selector: 'lpg-not-found-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, RouterLink],
  templateUrl: './not-found-content.component.html',
  styleUrl: './not-found-content.component.scss',
})
export class NotFoundContentComponent {
  protected readonly projects = projects;
}
