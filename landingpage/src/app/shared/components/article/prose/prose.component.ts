import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Holds long-form text to a readable measure, wherever it is used */
@Component({
  selector: 'lpg-prose',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="prose"><ng-content /></div>`,
  styleUrl: './prose.component.scss',
})
export class ProseComponent {}
