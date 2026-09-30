import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CodeToken, CodeTokenType, CsharpHighlighter } from '@christian-szasz-portfolio/common-web';

import { CodeLanguage } from '../../../../data/content.types';
import { CopyButtonComponent } from '../copy-button/copy-button.component';

/** A source snippet; C# is coloured in-house, every other language renders as one plain run */
@Component({
  selector: 'lpg-code-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CopyButtonComponent],
  templateUrl: './code-block.component.html',
  styleUrl: './code-block.component.scss',
})
export class CodeBlockComponent {
  public readonly source = input.required<string>();
  public readonly language = input.required<CodeLanguage>();
  public readonly caption = input<string | undefined>(undefined);

  /** Coloured runs for C#; a single plain run for anything else */
  protected readonly tokens = computed<readonly CodeToken[]>(() =>
    this.language() === CodeLanguage.Csharp
      ? CsharpHighlighter.highlight(this.source())
      : [{ text: this.source(), type: CodeTokenType.Plain }],
  );
}
