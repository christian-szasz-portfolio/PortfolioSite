import { locales, routes } from './support/site';
import { expect, open, test } from './support/fixtures';

/** The og:locale each language declares */
const OG_LOCALE: Readonly<Record<string, string>> = { 'en-GB': 'en_GB', de: 'de_DE', ro: 'ro_RO' };

/** The case studies with a share card of their own; every other page uses the site's */
const SHARE_CARD: Readonly<Record<string, string>> = {
  '/work/stack86': 'stack86',
  '/work/taskly': 'taskly',
};

const SHARE_CARDS = ['portfolio', 'stack86', 'taskly'];

test.describe('page metadata', () => {
  for (const locale of locales) {
    test(`every ${locale.lang} page is titled, described and canonical`, async ({ page }) => {
      const titles = new Set<string>();

      for (const route of routes) {
        await open(page, route, locale.lang);
        const path = route === '/' ? `${locale.prefix}/` : `${locale.prefix}${route}`;

        const title = await page.title();
        expect(title, `${path} has a title`).toMatch(/Christian-Ioan Szasz/);
        titles.add(title);

        const description = await page.locator('meta[name="description"]').getAttribute('content');
        expect(description?.length ?? 0, `${path} is described`).toBeGreaterThan(50);

        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
          'href',
          new RegExp(`${path.replace(/[/.]/g, '\\$&')}$`),
        );
        await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title);
        await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
          'content',
          new RegExp(`/assets/img/social/${SHARE_CARD[route] ?? 'portfolio'}\\.png$`),
        );
        await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
      }

      expect(titles.size, 'no two pages share a title').toBe(routes.length);
    });
  }

  for (const locale of locales) {
    test(`og:locale is written language_TERRITORY in ${locale.lang}`, async ({ page }) => {
      await open(page, '/', locale.lang);

      await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
        'content',
        OG_LOCALE[locale.lang] ?? '',
        {
          timeout: 2_000,
        },
      );
    });
  }

  test('structured data parses and names the author', async ({ page }) => {
    for (const route of routes) {
      await open(page, route);
      const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(blocks.length, `${route} has structured data`).toBeGreaterThan(0);

      for (const block of blocks) {
        const data = JSON.parse(block) as {
          '@context'?: string;
          '@graph'?: { '@type': string; name?: string }[];
        };
        expect(data['@context']).toBe('https://schema.org');
        const person = data['@graph']?.find((node) => node['@type'] === 'Person');
        expect(person?.name).toBe('Christian-Ioan Szasz');
      }
    }
  });

  test('a case study carries its breadcrumb trail as structured data', async ({ page }) => {
    await open(page, '/work/taskly');
    const graph = (await page.locator('script[type="application/ld+json"]').allTextContents())
      .map(
        (block) =>
          JSON.parse(block) as { '@graph'?: { '@type': string; itemListElement?: unknown[] }[] },
      )
      .flatMap((data) => data['@graph'] ?? []);

    const trail = graph.find((node) => node['@type'] === 'BreadcrumbList');
    expect(trail?.itemListElement).toHaveLength(3);
  });

  test('every social card image is served', async ({ request }) => {
    for (const card of SHARE_CARDS) {
      const response = await request.get(`/assets/img/social/${card}.png`);

      expect(response.status(), `${card}.png`).toBe(200);
      expect(response.headers()['content-type']).toContain('image/png');
    }
  });
});
