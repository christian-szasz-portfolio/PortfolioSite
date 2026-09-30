import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { projects, technologies } from '../../../../data';
import { TechIconComponent } from './tech-icon.component';
import { TechIconRegistry } from './tech-icon.registry';

@Component({
  imports: [TechIconComponent],
  template: `<lpg-tech-icon [name]="name()" />`,
})
class Host {
  public readonly name = signal('Angular');
}

describe('TechIconComponent', () => {
  let fixture: ComponentFixture<Host>;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const render = (name: string) => {
    fixture.componentInstance.name.set(name);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('draws the real brand mark where Font Awesome has one', () => {
    render('Angular');

    const svg = element().querySelector('svg.tech-icon--brand') as SVGElement;

    expect(svg).not.toBeNull();
    expect(svg.getAttribute('viewBox')).toBe('0 0 448 512');
    expect(svg.querySelector('path')?.getAttribute('d')?.length).toBeGreaterThan(50);
  });

  it('falls back to the short form where no free set has a mark at all', () => {
    render('OpenIddict');

    expect(element().querySelector('svg')).toBeNull();
    expect(element().querySelector('.tech-icon--letters')?.textContent?.trim()).toBe('OID');
  });

  it('draws the brand mark for a technology Font Awesome has none for', () => {
    render('C#');

    const svg = element().querySelector('svg.tech-icon--brand') as SVGElement;

    expect(svg).not.toBeNull();
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.querySelectorAll('path').length).toBe(1);
  });

  it('gives the three that used to be lettered a real mark now', () => {
    for (const name of ['PowerShell', 'SQL Server', 'NgRx']) {
      render(name);

      expect(element().querySelector('svg.tech-icon--brand'), `${name} has no mark`).not.toBeNull();
      expect(element().querySelector('.tech-icon--letters')).toBeNull();
    }
  });

  it('shares one platform mark across a family that has no mark of its own', () => {
    render('.NET 10');
    const platform = element().querySelector('path')?.getAttribute('d');

    render('.NET MAUI');
    expect(element().querySelector('path')?.getAttribute('d')).toBe(platform);

    render('ASP.NET Core');
    expect(element().querySelector('path')?.getAttribute('d')).toBe(platform);
  });

  it('gives Signals the Angular mark, being a feature of it rather than a product', () => {
    render('Angular');
    const angular = element().querySelector('path')?.getAttribute('d');

    render('Signals');

    expect(element().querySelector('path')?.getAttribute('d')).toBe(angular);
  });

  it('marks the newly added web technologies', () => {
    for (const name of [
      'SCSS',
      'HTML',
      'Bootstrap',
      'Tailwind',
      'Redis',
      'Azure Functions',
      'Monaco',
    ]) {
      render(name);

      expect(element().querySelector('svg.tech-icon--brand'), `${name} has no mark`).not.toBeNull();
    }
  });

  it('leaves a Font Awesome mark alone, with no fill rule of its own', () => {
    render('Angular');

    expect(element().querySelector('path')?.getAttribute('fill-rule')).toBeNull();
  });

  it('draws the hand-drawn marks as paths, like every other mark', () => {
    for (const name of [
      'xUnit',
      'Rebus',
      'EF Core',
      'SQL Server',
      'SignalR',
      'Polly',
      'Aspire',
      'StyleCop',
    ]) {
      render(name);

      const svg = element().querySelector('svg.tech-icon--brand');

      expect(svg, `${name} has no mark`).not.toBeNull();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
      expect(element().querySelector('path')?.getAttribute('fill-rule')).toBe('evenodd');
      expect(element().querySelector('.tech-icon--letters')).toBeNull();
    }
  });

  it('marks the tools the thinking section says are used daily', () => {
    for (const name of ['Claude Code', 'GitHub Copilot']) {
      render(name);

      expect(element().querySelector('svg.tech-icon--brand'), `${name} has no mark`).not.toBeNull();
    }
  });

  it('leaves a pattern with nothing beside its name at all', () => {
    for (const name of ['CQRS', 'Saga']) {
      render(name);

      expect(element().querySelector('svg'), `${name} drew a mark`).toBeNull();
      expect(element().querySelector('.tech-icon--letters'), `${name} drew letters`).toBeNull();
      expect(element().textContent?.trim()).toBe('');
    }
  });

  it('draws the Azure mark for the services that sit on it', () => {
    render('Azure');
    const azure = element().querySelector('path')?.getAttribute('d');

    for (const name of ['Blob Storage', 'Service Bus']) {
      render(name);

      expect(element().querySelector('path')?.getAttribute('d'), name).toBe(azure);
    }
  });

  it('keeps the short form where no free set carries a mark', () => {
    const dropped: readonly (readonly [string, string])[] = [
      ['MVVM', 'MVVM'],
      ['OpenIddict', 'OID'],
    ];

    for (const [name, label] of dropped) {
      render(name);

      expect(element().querySelector('svg'), `${name} should not have a mark`).toBeNull();
      expect(element().querySelector('.tech-icon--letters')?.textContent?.trim()).toBe(label);
    }
  });

  it('is decoration beside a visible name, so it is hidden from assistive tech', () => {
    render('Angular');
    expect(element().querySelector('.tech-icon')?.getAttribute('aria-hidden')).toBe('true');

    render('MVVM');
    expect(element().querySelector('.tech-icon')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('swaps the mark when the name changes', () => {
    render('Docker');
    expect(element().querySelector('svg.tech-icon--brand')).not.toBeNull();

    render('MVVM');
    expect(element().querySelector('svg')).toBeNull();
    expect(element().querySelector('.tech-icon--letters')?.textContent?.trim()).toBe('MVVM');
  });
});

describe('tech icon registry', () => {
  /** Every technology the site shows, from the data rather than a copy of it */
  const used = [...technologies.flat(), ...projects.flatMap((project) => project.chips)];

  it('has an entry for every technology the site actually shows', () => {
    const missing = [...new Set(used)].filter(
      (name) => !TechIconRegistry.REGISTERED.includes(name),
    );

    expect(missing, `no icon registered for:\n  ${missing.join('\n  ')}`).toEqual([]);
  });

  it('keeps every short form short enough to read at 24px', () => {
    for (const name of used) {
      const mark = TechIconRegistry.markFor(name);
      if (mark.kind !== 'letters') {
        continue;
      }

      expect(mark.label.length, `${name} -> "${mark.label}"`).toBeLessThanOrEqual(4);
      expect(mark.label.length).toBeGreaterThan(0);
    }
  });

  it('answers something for a technology nobody registered, rather than throwing', () => {
    const mark = TechIconRegistry.markFor('Some New Framework');

    expect(mark.kind).toBe('letters');
    expect(mark.kind === 'letters' && mark.label).toBe('SOME');
  });
});
