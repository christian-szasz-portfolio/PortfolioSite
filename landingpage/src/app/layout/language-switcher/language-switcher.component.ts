import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FlagComponent } from '@christian-szasz-portfolio/common-web';

import { LocaleService, SiteLocale } from '../../core/services/locale/locale/locale.service';
import { MenuDirective } from '../../shared/directives/menu/menu.directive';
import { MenuItemDirective } from '../../shared/directives/menu-item/menu-item.directive';
import { MenuTriggerDirective } from '../../shared/directives/menu-trigger/menu-trigger.directive';

/** Switches language by plain links to real addresses, so it works with scripting off */
@Component({
  selector: 'lpg-language-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MenuDirective, MenuItemDirective, MenuTriggerDirective, FlagComponent],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
})
export class LanguageSwitcherComponent {
  private readonly locale = inject(LocaleService);

  protected readonly locales = this.locale.locales;
  protected readonly current = this.locale.current;

  protected href(target: SiteLocale): string {
    return this.locale.urlFor(target);
  }
}
