import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { ArticleBlock, BlockKind, CalloutTone, CodeLanguage } from '../../../data';
import { ArticleBlockComponent } from './article-block.component';

@Component({
  imports: [ArticleBlockComponent],
  template: `<lpg-article-block [block]="block()" />`,
})
class Host {
  public readonly block = signal<ArticleBlock>({
    kind: BlockKind.Prose,
    text: 'A modular monolith.',
  });
}

describe('ArticleBlockComponent', () => {
  let fixture: ComponentFixture<Host>;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const render = (block: ArticleBlock) => {
    fixture.componentInstance.block.set(block);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        {
          provide: BrowserEnvironment,
          useValue: {
            isBrowser: true,
            animationsEnabled: () => false,
            pointerEffectsEnabled: () => false,
            window: { navigator: {} },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('renders prose as a paragraph, held to the measure', () => {
    render({ kind: BlockKind.Prose, text: 'A modular monolith.' });

    expect(element().querySelector('.prose p')?.textContent?.trim()).toBe('A modular monolith.');
  });

  it('renders an unordered list by default', () => {
    render({ kind: BlockKind.List, items: ['Api', 'Logic', 'Common'] });

    const items = [...element().querySelectorAll('ul li')].map((li) => li.textContent?.trim());

    expect(items).toEqual(['Api', 'Logic', 'Common']);
    expect(element().querySelector('ol')).toBeNull();
  });

  it('renders an ordered list when the order is the point', () => {
    render({ kind: BlockKind.List, items: ['Parse', 'Lower', 'Emit'], ordered: true });

    const items = [...element().querySelectorAll('ol li')].map((li) => li.textContent?.trim());

    expect(items).toEqual(['Parse', 'Lower', 'Emit']);
    expect(element().querySelector('ul')).toBeNull();
  });

  it('renders code as text in a pre, with its language named', () => {
    render({
      kind: BlockKind.Code,
      language: CodeLanguage.Csharp,
      source: 'var x = 1;',
      caption: 'Program.cs',
    });

    expect(element().querySelector('pre > code')?.textContent).toBe('var x = 1;');
    expect(element().querySelector('.code__language')?.textContent?.trim()).toBe('csharp');
    expect(element().querySelector('.code__caption')?.textContent?.trim()).toBe('Program.cs');
  });

  it('renders a figure with its caption and its reserved box', () => {
    render({
      kind: BlockKind.Figure,
      src: 'assets/img/stack86-1280.jpg',
      srcSmall: 'assets/img/stack86-640.jpg',
      alt: 'The IDE',
      caption: 'The pipeline.',
      width: 1280,
      height: 800,
    });

    expect(element().querySelector('figcaption')?.textContent?.trim()).toBe('The pipeline.');
    expect(element().querySelector('img')?.getAttribute('alt')).toBe('The IDE');
  });

  it('renders a callout, defaulting its tone to a note', () => {
    render({ kind: BlockKind.Callout, label: 'Engineering note', text: 'The IR is the point.' });

    const aside = element().querySelector('aside.note') as HTMLElement;

    expect(aside.classList.contains('note--note')).toBe(true);
    expect(element().querySelector('.note__text')?.textContent?.trim()).toBe(
      'The IR is the point.',
    );
  });

  it('carries a stated tone through to the callout', () => {
    render({
      kind: BlockKind.Callout,
      label: 'Unwritten',
      text: 'Not yet.',
      tone: CalloutTone.Warning,
    });

    expect(
      (element().querySelector('aside.note') as HTMLElement).classList.contains('note--warning'),
    ).toBe(true);
  });

  it('renders specs as a two-column table', () => {
    render({ kind: BlockKind.Specs, rows: [{ key: 'Role', value: 'Sole author' }] });

    expect(element().querySelector('th.specs__key')?.textContent?.trim()).toBe('Role');
    expect(element().querySelector('td.specs__value')?.textContent?.trim()).toBe('Sole author');
  });

  it('renders nothing at all for a kind it does not know, rather than throwing', () => {
    const unknown = { kind: 'video', src: 'clip.webm' } as unknown as ArticleBlock;

    expect(() => render(unknown)).not.toThrow();
    expect(element().querySelector('lpg-article-block')?.textContent?.trim()).toBe('');
  });
});
