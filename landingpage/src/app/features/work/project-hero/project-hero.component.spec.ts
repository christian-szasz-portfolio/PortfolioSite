import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BrowserEnvironment, ScrollService, ScrollState } from '@christian-szasz-portfolio/common-web';

import { Project } from '../../../data';
import { assembler } from '../../../data/projects/assembler.data';
import { stack86 } from '../../../data/projects/stack86.data';
import { Crumb } from '../../../shared/components/headings/breadcrumbs/breadcrumbs.component';
import { ProjectHeroComponent } from './project-hero.component';

const TRAIL: readonly Crumb[] = [{ label: 'Home', path: '/' }, { label: 'Stack86' }];

@Component({
  imports: [ProjectHeroComponent],
  template: `<lpg-project-hero [project]="project()" [trail]="trail" [words]="words()" />`,
})
class Host {
  public readonly project = signal<Project>(stack86);
  public readonly trail = TRAIL;
  public readonly words = signal(1320);
}

describe('ProjectHeroComponent', () => {
  let fixture: ComponentFixture<Host>;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
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
        {
          provide: ScrollService,
          useValue: { state: signal<ScrollState>({ y: 0, viewport: 800, document: 3200 }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('names the project in the one first-level heading', () => {
    expect(element().querySelectorAll('h1').length).toBe(1);
    expect(element().querySelector('h1')?.textContent?.trim()).toBe('Stack86');
  });

  it('numbers the project the same way the card does', () => {
    expect(element().querySelector('.page-header__eyebrow')?.textContent?.trim()).toBe(
      'Project 01',
    );
  });

  it('states how long the read is, from the count it was given', () => {
    expect(element().querySelector('.project-hero__reading')?.textContent?.trim()).toBe(
      '6 minute read',
    );

    fixture.componentInstance.words.set(220);
    fixture.detectChanges();

    expect(element().querySelector('.project-hero__reading')?.textContent?.trim()).toBe(
      '1 minute read',
    );
  });

  it('shows the stack and the languages', () => {
    const chips = [...element().querySelectorAll('.chip__name')].map((c) => c.textContent?.trim());

    expect(chips).toEqual([...stack86.chips]);
    expect(element().querySelector('.project-hero__languages')?.textContent?.trim()).toBe(
      stack86.languages.join(', '),
    );
  });

  it('links out to the repository', () => {
    const repo = element().querySelector('a.link--repo') as HTMLAnchorElement;

    expect(repo.getAttribute('href')).toBe(stack86.repository);
  });

  // The test page is served on localhost, so the demo link points at the local stand-in.
  it('links out to the live demo, where one exists', () => {
    const demo = element().querySelector('a.link--demo') as HTMLAnchorElement;

    expect(demo.getAttribute('href')).toBe('http://localhost:8086');
    expect(demo.textContent?.trim()).toBe('Open the live demo');
  });

  it('says a demo repository is one', () => {
    const repo = element().querySelector('a.link--repo') as HTMLAnchorElement;

    expect(repo.textContent?.trim()).toBe('View the demo repository');
  });

  it('shows a note instead of a repository link where there is no repository', () => {
    fixture.componentInstance.project.set(assembler);
    fixture.detectChanges();

    expect(element().querySelector('a.link--repo')).toBeNull();
    expect(element().querySelector('.link--note')?.textContent?.trim()).toBe(
      assembler.repositoryNote,
    );
  });

  it('shows no demo link where there is no demo', () => {
    fixture.componentInstance.project.set(assembler);
    fixture.detectChanges();

    expect(element().querySelector('a.link--demo')).toBeNull();
  });

  it('shows the screenshot, described', () => {
    const image = element().querySelector('.media__image') as HTMLImageElement;

    expect(image.getAttribute('alt')).toBe(stack86.media.alt);
  });

  it('carries the trail it was handed', () => {
    expect(element().querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('Stack86');
  });
});
