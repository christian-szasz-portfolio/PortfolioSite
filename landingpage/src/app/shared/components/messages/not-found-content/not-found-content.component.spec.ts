import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { projects } from '../../../../data';
import { NotFoundContentComponent } from './not-found-content.component';

describe('NotFoundContentComponent', () => {
  let fixture: ComponentFixture<NotFoundContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundContentComponent],
      providers: [
        provideRouter([]),
        {
          provide: BrowserEnvironment,
          useValue: {
            isBrowser: true,
            animationsEnabled: () => false,
            pointerEffectsEnabled: () => false,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundContentComponent);
    fixture.detectChanges();
  });

  it('says what happened, in one heading', () => {
    const heading = fixture.nativeElement.querySelector('h1') as HTMLElement;

    expect(heading.textContent?.trim()).toBe('That page is not here');
  });

  it('offers the way back to the home page', () => {
    const home = fixture.nativeElement.querySelector('a.button') as HTMLAnchorElement;

    expect(home.getAttribute('href')).toBe('/');
  });

  it('lists every project, so a wrong slug still lands somewhere useful', () => {
    const links = [...fixture.nativeElement.querySelectorAll('.card-panel__card')].map(
      (link: Element) => link.getAttribute('href'),
    );

    expect(links).toEqual(projects.map((project) => `/work/${project.slug}`));
  });

  it('gives each project card its title and its tagline', () => {
    const cards = [...fixture.nativeElement.querySelectorAll('.card-panel__card')];

    expect(cards.length).toBe(projects.length);
    cards.forEach((card: Element, index: number) => {
      expect(card.querySelector('.card-panel__name')?.textContent?.trim()).toBe(
        projects[index]?.title,
      );
      expect(card.querySelector('.card-panel__text')?.textContent?.trim()).toBe(
        projects[index]?.tagline,
      );
    });
  });

  // The panel is a section with its own heading, so it is not one unlabelled list of links.
  it('heads the card panel below the page title', () => {
    const panel = fixture.nativeElement.querySelector('.card-panel') as HTMLElement;

    expect(panel.querySelector('h2')?.textContent?.trim()).toBe('Project pages');
  });
});
