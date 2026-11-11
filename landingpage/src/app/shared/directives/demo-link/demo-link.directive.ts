import { Directive, ElementRef, inject, input } from '@angular/core';

import { DemoLaunchService } from '../../../core/services/site/demo-launch/demo-launch.service';
import { PlainClickUtils } from '../../../core/utils/plain-click/plain-click.utils';

/** A link to a demo that may be asleep, which waits for it to answer before leaving */
@Directive({
  selector: 'a[lpgDemoLink]',
  host: { '(click)': 'onClick($event)' },
})
export class DemoLinkDirective {
  private readonly host = inject<ElementRef<HTMLAnchorElement>>(ElementRef);
  private readonly launcher = inject(DemoLaunchService);

  /** The demo's name, as the notice says it */
  public readonly lpgDemoLink = input.required<string>();

  /** The link stays a real link, so a new tab, a copy and a no-script visit all still work */
  protected onClick(event: MouseEvent): void {
    const link = this.host.nativeElement;

    if (!PlainClickUtils.isPlain(event) || (link.target !== '' && link.target !== '_self')) {
      return;
    }

    event.preventDefault();
    this.launcher.open(link.href, this.lpgDemoLink());
  }
}
