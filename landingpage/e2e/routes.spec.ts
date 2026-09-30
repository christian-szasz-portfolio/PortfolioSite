import { locales, Lang, projects, routes, t } from './support/site';
import { expect, hydrated, open, test } from './support/fixtures';

test.describe('every prerendered page', () => {
  for (const locale of locales) {
    for (const route of routes) {
      test(`${locale.prefix}${route} serves, hydrates and fits the screen`, async ({ page }) => {
        const response = await page.goto(`${locale.prefix}${route}`);

        expect(response?.status()).toBe(200);
        await expect(page.locator('html')).toHaveAttribute('lang', locale.lang);
        await hydrated(page);

        await expect(page.locator('h1')).toHaveCount(1);
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('main#main')).toBeVisible();
        await expect(page.locator('.site-header')).toBeVisible();
        await expect(page.locator('.site-footer')).toBeVisible();

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow, 'no sideways scrolling').toBeLessThanOrEqual(0);
      });
    }
  }

  test('the legal pages carry their headings', async ({ page }) => {
    for (const lang of [Lang.English, Lang.German, Lang.Romanian]) {
      await open(page, '/privacy', lang);
      await expect(page.locator('h1')).toHaveText(t(lang, 'privacy.title'));

      await open(page, '/terms', lang);
      await expect(page.locator('h1')).toHaveText(t(lang, 'terms.title'));
    }
  });
});

test.describe('addresses that are not pages', () => {
  // Chromium logs the 404 document itself as a failed resource
  test.use({ tolerate: /status of 404/ });

  const missing: readonly (readonly [string, Lang])[] = [
    ['/nope', Lang.English],
    ['/work/nope', Lang.English],
    ['/a/b/c?x=1', Lang.English],
    ['/de-DE/nope', Lang.German],
    ['/ro-RO/work/nope', Lang.Romanian],
  ];

  for (const [address, lang] of missing) {
    test(`${address} answers 404 with a way back`, async ({ page }) => {
      const response = await page.goto(address);

      expect(response?.status()).toBe(404);
      expect(await response?.text()).toMatch(/<meta name="robots" content="noindex">/);
      await hydrated(page);

      await expect(page.locator('h1')).toHaveText(t(lang, 'notFound.title'));

      const cards = page.locator('.card-panel__card');
      await expect(cards).toHaveCount(projects.length);

      for (const [index, project] of projects.entries()) {
        await expect(cards.nth(index)).toHaveAttribute(
          'href',
          new RegExp(`/work/${project.slug}$`),
        );
        await expect(cards.nth(index)).toContainText(project.title);
      }
    });
  }

  test('a 404 page keeps noindex once the app has started', async ({ page }) => {
    await page.goto('/nope');
    await hydrated(page);

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/, {
      timeout: 2_000,
    });
  });

  test('a project card on the 404 page leads to the project', async ({ page }) => {
    await page.goto('/nope');
    await hydrated(page);

    await page.locator('.card-panel__card', { hasText: 'Taskly' }).click();

    await expect(page).toHaveURL(/\/work\/taskly$/);
    await expect(page.locator('h1')).toHaveText('Taskly');
  });

  test('the 404 page leads home', async ({ page }) => {
    await page.goto('/nope');
    await hydrated(page);

    await page.locator('.message-page .button--primary').click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('#work')).toBeAttached();
  });
});

test.describe('redirects', () => {
  test('/unsupported sends the reader home', async ({ page }) => {
    await page.goto('/unsupported');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('#work')).toBeAttached();
  });

  for (const locale of locales) {
    test(`${locale.prefix}/cookies is a permanent redirect to that language's home`, async ({
      request,
    }) => {
      const response = await request.get(`${locale.prefix}/cookies`, { maxRedirects: 0 });

      expect(response.status()).toBe(301);
      expect(new URL(response.headers()['location'] ?? '', 'http://x').pathname).toBe(
        `${locale.prefix}/`,
      );
    });
  }

  test('/favicon.ico is served from the icons folder', async ({ request }) => {
    const response = await request.get('/favicon.ico');

    expect(response.status()).toBe(200);
  });
});

test.describe('Internet Explorer', () => {
  test.use({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko' });

  // The plain page's own script is refused by the CSP; see the test below
  test.use({ tolerate: /Content Security Policy/ });

  test('is sent to the plain page before the app boots', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/pages\/unsupported\.html$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('the plain unsupported page in a current browser', () => {
  test.use({ tolerate: /Content Security Policy/ });

  test('sends the reader home', async ({ page }) => {
    await page.goto('/pages/unsupported.html');

    await expect(page).toHaveURL(/\/$/, { timeout: 3_000 });
  });
});

test.describe('history', () => {
  test('back and forward move between pages the router opened', async ({ page }) => {
    await open(page, '/');

    await page
      .locator('.project', { hasText: 'Taskly' })
      .getByRole('link', { name: /Taskly/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/work\/taskly$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/(#\w+)?$/);
    await expect(page.locator('#work')).toBeAttached();

    await page.goForward();
    await expect(page).toHaveURL(/\/work\/taskly(#\w+)?$/);
    await expect(page.locator('h1')).toHaveText('Taskly');
  });
});

test.describe('scroll position', () => {
  test('a new page always opens at the top', async ({ page }) => {
    await open(page, '/privacy');
    await page.locator('.site-footer').scrollIntoViewIfNeeded();

    await page.locator('.site-footer').getByRole('link', { name: 'Terms' }).click();

    await expect(page).toHaveURL(/\/terms$/);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });
});
