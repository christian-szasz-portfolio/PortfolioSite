import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ArticleBlock, BlockKind, CalloutTone } from '../../../data';
import { CalloutComponent } from '../../../shared/components/article/callout/callout.component';
import { CodeBlockComponent } from '../../../shared/components/article/code-block/code-block.component';
import { FigureBlockComponent } from '../../../shared/components/article/figure-block/figure-block.component';
import { ProseComponent } from '../../../shared/components/article/prose/prose.component';
import { SpecTableComponent } from '../../../shared/components/article/spec-table/spec-table.component';

/** One block of an article; the switch is exhaustive, so a new kind will not compile */
@Component({
  selector: 'lpg-article-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CalloutComponent,
    CodeBlockComponent,
    FigureBlockComponent,
    ProseComponent,
    SpecTableComponent,
  ],
  templateUrl: './article-block.component.html',
  styleUrl: './article-block.component.scss',
})
export class ArticleBlockComponent {
  /** The template switches on these, and a template cannot name an enum by itself */
  protected readonly kinds = BlockKind;
  protected readonly tones = CalloutTone;

  public readonly block = input.required<ArticleBlock>();
}
