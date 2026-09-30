import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { JsonLd, SeoService } from '@christian-szasz-portfolio/common-web';

import { ArticleBlock, BlockKind, projects, Project, ProjectCatalog, ProjectPage, siteUrl } from '../../data';
import { Crumb } from '../../shared/components/headings/breadcrumbs/breadcrumbs.component';
import { TableOfContentsComponent, TocEntry } from '../../shared/components/article/table-of-contents/table-of-contents.component';
import { notFoundSeo, NotFoundContentComponent } from '../../shared/components/messages/not-found-content/not-found-content.component';
import { ProjectArticleComponent } from './project-article/project-article.component';
import { ProjectHeroComponent } from './project-hero/project-hero.component';
import { ProjectPagerComponent } from './project-pager/project-pager.component';

interface Resolved {
  readonly project: Project;
  readonly page: ProjectPage;
  readonly contents: readonly TocEntry[];
  readonly trail: readonly Crumb[];
  readonly words: number;
  readonly previous: Project | null;
  readonly next: Project | null;
}

/** One project, at length. An unknown slug falls through to the 404. */
@Component({
  selector: 'lpg-project-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NotFoundContentComponent,
    ProjectArticleComponent,
    ProjectHeroComponent,
    ProjectPagerComponent,
    TableOfContentsComponent,
  ],
  templateUrl: './project-page.component.html',
  styleUrl: './project-page.component.scss',
})
export class ProjectPageComponent {
  /** Words in a block, for the reading time. Only what a reader actually reads. */
  private static wordsIn(block: ArticleBlock): number {
    switch (block.kind) {
      case BlockKind.Prose:
        return ProjectPageComponent.count(block.text);
      case BlockKind.List:
        return block.items.reduce((total, item) => total + ProjectPageComponent.count(item), 0);
      case BlockKind.Callout:
        return ProjectPageComponent.count(block.text);
      case BlockKind.Specs:
        return block.rows.reduce((total, row) => total + ProjectPageComponent.count(row.value), 0);
      case BlockKind.Figure:
        return ProjectPageComponent.count(block.caption);
      case BlockKind.Code:
        // Source is read differently from prose, and counting it would lie.
        return 0;
    }
  }

  private static count(text: string): number {
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  }

  private readonly seo = inject(SeoService);
  private readonly params = toSignal(inject(ActivatedRoute).paramMap);

  protected readonly resolved = computed<Resolved | null>(() => {
    const slug = this.params()?.get('slug') ?? '';
    const project = ProjectCatalog.projectBySlug(slug);
    const page = ProjectCatalog.pageBySlug(slug);

    if (project === null || page === null) {
      return null;
    }

    const at = projects.indexOf(project);

    return {
      project,
      page,
      contents: page.articles.map(({ id, heading }) => ({ id, heading })),
      trail: [
        { label: 'Home', path: '/' },
        { label: 'Work', path: '/', fragment: 'work' },
        { label: project.title },
      ],
      words: page.articles.reduce(
        (total, article) =>
          total +
          ProjectPageComponent.count(article.lede ?? '') +
          article.blocks.reduce((sum, block) => sum + ProjectPageComponent.wordsIn(block), 0),
        0,
      ),
      previous: projects[at - 1] ?? null,
      next: projects[at + 1] ?? null,
    };
  });

  public constructor() {
    effect(() => {
      const found = this.resolved();
      // A slug that resolves to nothing is a 404, and says so rather than leaving the
      // metadata of whichever page was looked at before.
      if (found === null) {
        this.seo.apply(notFoundSeo);

        return;
      }

      this.seo.apply({
        title: `${found.project.title} - Christian-Ioan Szasz`,
        description: found.page.description,
        path: `/work/${found.project.slug}`,
        type: 'article',
        graph: ProjectPageComponent.graphFor(found),
      });
    });
  }

  /** The schema.org nodes for a project page: the work itself, and the way to it */
  private static graphFor(found: Resolved): readonly JsonLd[] {
    const url = `${siteUrl}/work/${found.project.slug}`;

    const work: JsonLd = {
      '@type': 'SoftwareSourceCode',
      name: found.project.title,
      description: found.page.description,
      url,
      ...(found.project.repository ? { codeRepository: found.project.repository } : {}),
      programmingLanguage: [...found.project.languages],
      author: { '@type': 'Person', name: 'Christian-Ioan Szasz', url: `${siteUrl}/` },
    };

    const breadcrumbs: JsonLd = {
      '@type': 'BreadcrumbList',
      itemListElement: found.trail.map((crumb, index) => {
        const item: Record<string, JsonLd[string]> = {
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.label,
        };
        // The last crumb is the page itself, and carries no link
        if (crumb.path !== undefined) {
          const fragment = crumb.fragment === undefined ? '' : `#${crumb.fragment}`;
          item['item'] = `${siteUrl}${crumb.path === '/' ? '/' : crumb.path}${fragment}`;
        }
        return item;
      }),
    };

    return [work, breadcrumbs];
  }
}
