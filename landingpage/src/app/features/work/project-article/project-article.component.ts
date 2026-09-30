import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ControlGlyphs } from '@christian-szasz-portfolio/common-web';

import { ProjectArticle } from '../../../data';
import { RevealDirective } from '../../../shared/directives/reveal/reveal.directive';
import { SectionSpyDirective } from '../../../shared/directives/section-spy/section-spy.directive';
import { ArticleBlockComponent } from '../article-block/article-block.component';

/** One section of a case study, and the anchor the contents list points at */
@Component({
  selector: 'lpg-project-article',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArticleBlockComponent, RevealDirective, SectionSpyDirective, RouterLink],
  templateUrl: './project-article.component.html',
  styleUrl: './project-article.component.scss',
})
export class ProjectArticleComponent {
  protected readonly glyphs = ControlGlyphs;

  public readonly article = input.required<ProjectArticle>();
}
