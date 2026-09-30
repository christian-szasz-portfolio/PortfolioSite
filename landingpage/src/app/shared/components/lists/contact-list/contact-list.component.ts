import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FlagComponent } from '@christian-szasz-portfolio/common-web';

import { ContactRow } from '../../../../data/content.types';
import { IconComponent } from '../../marks/icon/icon.component';
import { IconName } from '../../marks/icon/icon.registry';

/** Key and value rows for the ways to reach me */
@Component({
  selector: 'lpg-contact-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FlagComponent, IconComponent],
  templateUrl: './contact-list.component.html',
  styleUrl: './contact-list.component.scss',
})
export class ContactListComponent {
  /** Keyed on the row's stable id, not its translated label; a spec fails on an unmarked row */
  private static readonly ICONS: Readonly<Record<string, IconName>> = {
    email: 'email',
    linkedin: 'linkedin',
    github: 'github',
    languages: 'languages',
  };

  public readonly rows = input.required<readonly ContactRow[]>();

  protected readonly items = computed(() =>
    this.rows().map((row) => ({ row, icon: ContactListComponent.iconForId(row.id) })),
  );

  /** Exposed for the guard that proves every row the site shows has a mark */
  public static iconForId(id: string): IconName | null {
    return ContactListComponent.ICONS[id] ?? null;
  }
}
