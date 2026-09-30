import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ViewBreakdownComponent } from '../../lists/view-breakdown/view-breakdown.component';

/** The cookies-and-storage text, shared by the /cookies fallback page and the cookies modal. */
@Component({
  selector: 'lpg-cookies-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ViewBreakdownComponent],
  templateUrl: './cookies-content.component.html',
})
export class CookiesContentComponent {}
