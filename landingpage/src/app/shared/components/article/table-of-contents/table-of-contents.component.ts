import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ActiveSectionService } from '../../../../core/services/site/active-section/active-section.service';

export interface TocEntry {
  readonly id: string;
  readonly heading: string;
}

/** The sections of a long page, with the one being read marked */
@Component({
  selector: 'lpg-table-of-contents',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './table-of-contents.component.html',
  styleUrl: './table-of-contents.component.scss',
})
export class TableOfContentsComponent {
  public readonly entries = input.required<readonly TocEntry[]>();
  public readonly label = input($localize`:@@toc.title:On this page`);

  private readonly sections = inject(ActiveSectionService);

  /** Only marks an entry this list actually owns */
  protected readonly active = computed(() => {
    const current = this.sections.active();
    return this.entries().some((entry) => entry.id === current) ? current : null;
  });
}
