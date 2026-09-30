import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { CodeBlockComponent } from './code-block.component';
import { CodeLanguage } from '../../../../data';

const SOURCE = `export function slug(title: string): string {
  return title.toLowerCase();
}`;

@Component({
  imports: [CodeBlockComponent],
  template: `
    <lpg-code-block [source]="source()" [language]="language()" [caption]="caption()" />
  `,
})
class Host {
  public readonly source = signal<string>(SOURCE);
  public readonly language = signal<CodeLanguage>(CodeLanguage.Typescript);
  public readonly caption = signal<string | undefined>('slug.ts');
}

describe('CodeBlockComponent', () => {
  let fixture: ComponentFixture<Host>;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const code = (): HTMLElement => element().querySelector('pre > code') as HTMLElement;

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

  it('renders the source as text inside pre and code, exactly as given', () => {
    expect(code().textContent).toBe(SOURCE);
  });

  it('escapes markup in the source rather than interpreting it', () => {
    fixture.componentInstance.source.set('<b>x</b> && "y"');
    fixture.detectChanges();

    expect(code().querySelector('b')).toBeNull();
    expect(code().textContent).toBe('<b>x</b> && "y"');
  });

  it('colours C# keywords, types and strings, and rebuilds the source', () => {
    fixture.componentInstance.language.set(CodeLanguage.Csharp);
    fixture.componentInstance.source.set('public var name = "hi";');
    fixture.detectChanges();

    expect(code().textContent).toBe('public var name = "hi";');
    expect(code().querySelector('.code__token--keyword')?.textContent).toBe('public');
    expect(code().querySelector('.code__token--string')?.textContent).toBe('"hi"');
  });

  it('names the language', () => {
    expect(element().querySelector('.code__language')?.textContent?.trim()).toBe('typescript');
  });

  it('shows a caption when there is one, and omits the element when there is not', () => {
    expect(element().querySelector('.code__caption')?.textContent?.trim()).toBe('slug.ts');

    fixture.componentInstance.caption.set(undefined);
    fixture.detectChanges();

    expect(element().querySelector('.code__caption')).toBeNull();
  });

  it('offers a copy control that knows what it is copying', () => {
    const copy = element().querySelector('.copy') as HTMLButtonElement;

    expect(copy.getAttribute('aria-label')).toBe('Copy the typescript snippet');
  });

  it('lets a long line scroll inside the block rather than widening the page', () => {
    expect(element().querySelector('.code__scroll')).not.toBeNull();
  });
});
