import { DestroyRef, Directive, ElementRef, inject } from '@angular/core';

import { MenuDirective } from '../menu/menu.directive';

/** One choice in an lpgMenu, registering itself so the arrow keys walk it in render order */
@Directive({
  selector: '[lpgMenuItem]',
  host: {
    role: 'menuitem',
  },
})
export class MenuItemDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly menu = inject(MenuDirective);

  public get element(): HTMLElement {
    return this.host.nativeElement;
  }

  public constructor() {
    this.menu.add(this);
    inject(DestroyRef).onDestroy(() => this.menu.remove(this));
  }

  public focus(): void {
    this.host.nativeElement.focus();
  }
}
