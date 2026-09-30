import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { ActiveSectionService } from '../../../core/services/site/active-section/active-section.service';
import { BlockKind, ProjectArticle } from '../../../data';
import { ProjectArticleComponent } from './project-article.component';

const ARTICLE: ProjectArticle = {
  id: 'architecture',
  heading: 'Architecture',
  lede: 'Four layers, one arrow.',
  blocks: [
    { kind: BlockKind.Prose, text: 'The domain depends on nothing.' },
    { kind: BlockKind.List, items: ['Api', 'Logic', 'Common'] },
  ],
};

@Component({
  imports: [ProjectArticleComponent],
  template: `<lpg-project-article [article]="article()" />`,
})
class Host {
  public readonly article = signal<ProjectArticle>(ARTICLE);
}

describe('ProjectArticleComponent', () => {
  let fixture: ComponentFixture<Host>;
  const register = vi.fn();

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideRouter([]),
        {
          provide: ActiveSectionService,
          useValue: { active: () => null, register, unregister: () => undefined },
        },
        {
          provide: BrowserEnvironment,
          useValue: {
            isBrowser: false,
            animationsEnabled: () => false,
            pointerEffectsEnabled: () => false,
            window: { navigator: {} },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('is an article, anchored at the id the contents list uses', () => {
    const article = element().querySelector('article') as HTMLElement;

    expect(article.id).toBe('architecture');
    expect(article.querySelector('h2')?.textContent?.trim()).toBe('Architecture');
  });

  it('offers a permalink to the section from its heading', () => {
    const anchor = element().querySelector('.article__heading .article__anchor') as HTMLElement;

    expect(anchor).not.toBeNull();
    expect(anchor.getAttribute('aria-label')).toBe('Link to this section');
  });

  it('shows the lede when there is one', () => {
    expect(element().querySelector('.article__lede')?.textContent?.trim()).toBe(
      'Four layers, one arrow.',
    );
  });

  it('omits the lede element entirely when there is none', () => {
    fixture.componentInstance.article.set({ id: 'flow', heading: 'Flow', blocks: [] });
    fixture.detectChanges();

    expect(element().querySelector('.article__lede')).toBeNull();
  });

  it('renders every block, in order', () => {
    expect(element().querySelectorAll('lpg-article-block').length).toBe(2);
    expect(element().querySelector('.prose p')?.textContent?.trim()).toBe(
      'The domain depends on nothing.',
    );
    expect(element().querySelectorAll('ul li').length).toBe(3);
  });

  it('registers itself as a section, so the contents list can follow it', () => {
    const article = element().querySelector('article#architecture');

    expect(register).toHaveBeenCalledWith('architecture', article);
  });
});
