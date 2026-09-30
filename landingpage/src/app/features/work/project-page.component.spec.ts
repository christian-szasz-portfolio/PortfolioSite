import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { projectPages, ProjectCatalog } from '../../data';
import { provideSeo } from '../../core/services/site/seo/seo.providers';
import { ProjectPageComponent } from './project-page.component';

async function navigate(path: string): Promise<HTMLElement> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'work/:slug', component: ProjectPageComponent }]),
      provideSeo(),
    ],
  });

  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl(path);
  harness.detectChanges();

  return harness.routeNativeElement as HTMLElement;
}

describe('ProjectPageComponent', () => {
  it('names the project once, at the top', async () => {
    const element = await navigate('/work/stack86');

    expect(element.querySelectorAll('h1').length).toBe(1);
    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Stack86');
  });

  it('renders every article the page declares, in order, as anchors', async () => {
    const element = await navigate('/work/stack86');
    const expected = ProjectCatalog.pageBySlug('stack86')?.articles ?? [];

    const ids = [...element.querySelectorAll('.article')].map((article: Element) => article.id);

    expect(ids).toEqual(expected.map((article) => article.id));
  });

  it('renders the prose of an article as real text, not a placeholder', async () => {
    const element = await navigate('/work/taskly');

    expect(element.textContent).toContain('Someone triages the overnight cards');
  });

  it('sets the metadata from the page it resolved', async () => {
    await navigate('/work/assembler');

    expect(TestBed.inject(Title).getTitle()).toBe('Assembler - Christian-Ioan Szasz');
  });

  it('falls through to the 404 for a slug nobody has', async () => {
    const element = await navigate('/work/no-such-project');

    expect(element.querySelector('lpg-not-found-content')).not.toBeNull();
    expect(element.querySelector('lpg-project-hero')).toBeNull();
  });

  // The body used to bring its own metadata with it, which meant this page depended on a side
  // effect of a component it embedded. It now says so itself.
  it('sets the 404 metadata for a slug nobody has', async () => {
    await navigate('/work/no-such-project');

    expect(TestBed.inject(Title).getTitle()).toContain('Page not found');
  });

  it('has a page for every project the data declares', async () => {
    for (const page of projectPages) {
      TestBed.resetTestingModule();
      const element = await navigate(`/work/${page.slug}`);

      expect(element.querySelector('lpg-not-found')).toBeNull();
    }
  });
});
