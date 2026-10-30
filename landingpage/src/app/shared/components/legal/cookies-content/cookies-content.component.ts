import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** The cookies-and-storage text, shared by the /cookies fallback page and the cookies modal. */
@Component({
  selector: 'lpg-cookies-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './cookies-content.component.html',
})
export class CookiesContentComponent {}
