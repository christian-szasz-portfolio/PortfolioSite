import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

import { ActiveSectionService } from '../../../core/services/site/active-section/active-section.service';

/** Offers this section to the reading line, which decides whether it is the one being read */
@Directive({
  selector: '[lpgSectionSpy]',
})
export class SectionSpyDirective {
  public readonly lpgSectionSpy = input.required<string>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly sections = inject(ActiveSectionService);
  private readonly destroyRef = inject(DestroyRef);

  public constructor() {
    afterNextRender(() => {
      const id = this.lpgSectionSpy();
      this.sections.register(id, this.host.nativeElement);

      this.destroyRef.onDestroy(() => this.sections.unregister(id));
    });
  }
}
