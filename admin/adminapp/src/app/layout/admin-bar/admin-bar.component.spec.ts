import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SyncReport } from '../../data';
import { AdminBarComponent } from './admin-bar.component';

const ONE_DAY: SyncReport = {
  from: '2026-08-09',
  to: '2026-09-07',
  daysArchived: 1,
  viewsTotal: 46,
  location: 'C:/archive',
};

@Component({
  imports: [AdminBarComponent],
  template: `
    <adm-admin-bar
      [archiveLocation]="location()"
      [source]="source()"
      [live]="live()"
      [report]="report()"
      [busy]="busy()"
      (sync)="asked = asked + 1"
    />
  `,
})
class Host {
  public readonly location = signal<string | null>(null);
  public readonly source = signal('');
  public readonly live = signal(false);
  public readonly report = signal<SyncReport | null>(null);
  public readonly busy = signal(false);
  public asked = 0;
}

describe('AdminBarComponent', () => {
  let fixture: ComponentFixture<Host>;

  function button(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.button') as HTMLButtonElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('says it is still reading before the archive answers', () => {
    expect(fixture.nativeElement.querySelector('.bar__where')?.textContent).toContain('reading');
  });

  it('shows where on this machine the figures came from', () => {
    fixture.componentInstance.location.set('C:/archive');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.bar__where')?.textContent).toContain('C:/archive');
  });

  it('asks the shell to sync rather than syncing itself', () => {
    button().click();

    expect(fixture.componentInstance.asked).toBe(1);
  });

  // One press is one trip to Azure, and a second press while the first is in flight is a second
  // one nobody asked for.
  it('cannot be pressed twice while a sync is in flight', () => {
    fixture.componentInstance.busy.set(true);
    fixture.detectChanges();

    expect(button().disabled).toBe(true);
    expect(button().textContent?.trim()).toBe('Working…');
  });

  it('says nothing about the source until the archive has answered', () => {
    expect(fixture.nativeElement.querySelector('.bar__source')).toBeNull();
  });

  // Two runs of this tool look identical, and one of them may be reading figures somebody seeded
  // on a laptop. The badge is how they are told apart before anybody reads a number off the page.
  it('marks a local archive as local, and quietly', () => {
    fixture.componentInstance.source.set('Azurite emulator');
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.bar__source') as HTMLElement;

    expect(badge.textContent).toContain('local');
    expect(badge.textContent).toContain('Azurite emulator');
    expect(badge.classList.contains('bar__source--live')).toBe(false);
  });

  it('marks the real account as live, and says which account it is', () => {
    fixture.componentInstance.source.set('portfolioanalytics');
    fixture.componentInstance.live.set(true);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.bar__source') as HTMLElement;

    expect(badge.textContent).toContain('live');
    expect(badge.textContent).toContain('portfolioanalytics');
    expect(badge.classList.contains('bar__source--live')).toBe(true);
  });

  it('reads back what the last sync did, in the singular when it was one day', () => {
    fixture.componentInstance.report.set(ONE_DAY);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.bar__note')?.textContent).toContain(
      '1 day archived',
    );
  });

  it('says days when there were several', () => {
    fixture.componentInstance.report.set({ ...ONE_DAY, daysArchived: 4 });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.bar__note')?.textContent).toContain(
      '4 days archived',
    );
  });
});
