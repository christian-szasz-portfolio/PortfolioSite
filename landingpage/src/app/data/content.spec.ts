import { existsSync } from 'node:fs';
import { join } from 'node:path';

import site from '../../site.config.json';
import { ArticleBlock, projectPages, ProjectCatalog, projects } from './index';

const PUBLIC_DIR = join(process.cwd(), 'public');

/** Every asset an article or a card points at, as a repository-relative path */
function assetPaths(): readonly string[] {
  const fromMedia = projects.flatMap((project) => [
    project.media.poster,
    ...(project.media.clip === null ? [] : [project.media.clip]),
  ]);

  const fromArticles = projectPages.flatMap((page) =>
    page.articles.flatMap((article) =>
      article.blocks.flatMap((block: ArticleBlock) =>
        block.kind === 'figure' ? [block.src, block.srcSmall] : [],
      ),
    ),
  );

  return [...fromMedia, ...fromArticles];
}

describe('content data', () => {
  it('gives every project a unique, URL-safe slug', () => {
    const slugs = projects.map((project) => project.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it('gives every project a page, and every page a project', () => {
    for (const project of projects) {
      expect(ProjectCatalog.pageBySlug(project.slug)).not.toBeNull();
    }
    for (const page of projectPages) {
      expect(ProjectCatalog.projectBySlug(page.slug)).not.toBeNull();
    }
  });

  // The CSP is built from site.config's list, so a demo missing from it is a wake the CSP refuses
  it('lists every linked demo in site.config, where the CSP allows waking it', () => {
    const allowed = site.demos.map((demo) => new URL(demo).origin);

    for (const project of projects) {
      if (project.demo) {
        expect(allowed).toContain(new URL(project.demo).origin);
      }
    }
  });

  it('answers null for a slug nobody has', () => {
    expect(ProjectCatalog.projectBySlug('no-such-project')).toBeNull();
    expect(ProjectCatalog.pageBySlug('no-such-project')).toBeNull();
  });

  it('keeps article ids unique within a page and usable as anchors', () => {
    for (const page of projectPages) {
      const ids = page.articles.map((article) => article.id);

      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) {
        expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      }
    }
  });

  it('carries the six sections a case study is meant to have', () => {
    for (const page of projectPages) {
      expect(page.articles.length).toBe(6);
      expect(page.articles[0]?.id).toBe('overview');
      expect(page.articles.at(-1)?.id).toBe('changes');
    }
  });

  it('states a description for every page, for the metadata', () => {
    for (const page of projectPages) {
      expect(page.description.length).toBeGreaterThan(40);
    }
  });

  it('points every asset path at a file that exists', () => {
    for (const path of assetPaths()) {
      expect(path.startsWith('assets/'), `${path} is not under assets/`).toBe(true);
      expect(existsSync(join(PUBLIC_DIR, path)), `${path} is missing`).toBe(true);
    }
  });

  it('numbers the cards in document order', () => {
    expect(projects.map((project) => project.index)).toEqual(['01', '02', '03', '04']);
  });
});
