import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconMarkComponent } from '@christian-szasz-portfolio/common-web';

import { IconName, IconRegistry } from './icon.registry';

/** One interface icon: this site's name resolved to a mark, drawn by the shared component */
@Component({
  selector: 'lpg-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconMarkComponent],
  templateUrl: './icon.component.html',
})
export class IconComponent {
  public readonly name = input.required<IconName>();

  protected readonly mark = computed(() => IconRegistry.markFor(this.name()));
  protected readonly strokeSize = IconRegistry.ICON_SIZE;
}
