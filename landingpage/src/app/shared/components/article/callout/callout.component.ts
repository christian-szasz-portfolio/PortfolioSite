import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { CalloutTone } from '../../../../data/content.types';

/** An aside that sits beside the argument rather than in it */
@Component({
  selector: 'lpg-callout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './callout.component.html',
  styleUrl: './callout.component.scss',
})
export class CalloutComponent {
  public readonly text = input.required<string>();
  public readonly label = input($localize`:@@callout.note.label:Engineering note`);
  public readonly tone = input<CalloutTone>(CalloutTone.Note);

  protected readonly toneClass = computed(() => `note--${this.tone()}`);
}
