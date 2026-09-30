import { Directive, ElementRef, inject } from '@angular/core';

import { MenuDirective } from '../menu/menu.directive';

/** The button that opens an lpgMenu, keeping aria-expanded and the focus origin in step */
@Directive({
  selector: '[lpgMenuTrigger]',
  host: {
    type: 'button',
    'aria-haspopup': 'menu',
    '[attr.aria-expanded]': 'menu.open()',
    '(click)': 'menu.toggle()',
  },
})
export class MenuTriggerDirective {
  protected readonly menu = inject(MenuDirective);

  public constructor() {
    this.menu.register(inject<ElementRef<HTMLElement>>(ElementRef).nativeElement);
  }
}
