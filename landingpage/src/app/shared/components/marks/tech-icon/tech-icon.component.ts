import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { TechIconRegistry, TechMarkKind } from './tech-icon.registry';

/** The mark beside a technology name: a brand glyph, or its short form */
@Component({
  selector: 'lpg-tech-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tech-icon.component.html',
  styleUrl: './tech-icon.component.scss',
})
export class TechIconComponent {
  /** The template names these, and a template cannot reach an enum by itself */
  protected readonly kinds = TechMarkKind;

  public readonly name = input.required<string>();

  protected readonly mark = computed(() => TechIconRegistry.markFor(this.name()));

  protected readonly viewBox = computed(() => {
    const mark = this.mark();

    return mark.kind === TechMarkKind.Brand ? `0 0 ${mark.width} ${mark.height}` : '';
  });
}
