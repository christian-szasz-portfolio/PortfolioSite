import { locales, routes } from './support/site';
import { expect, headerLink, open, test } from './support/fixtures';

test.describe('response headers', () => {
  for (const route of ['/', '/cv', '/work/taskly', '/de-DE/', '/nope']) {
    test(`${route} is served with the full policy`, async ({ request }) => {
      const response = await request.get(route);
      const headers = response.headers();
      const csp = headers['content-security-policy'] ?? '';

      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("base-uri 'self'");
      expect(csp).toContain("form-action 'none'");
      expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
      expect(csp).not.toMatch(/script-src[^;]*'unsafe-eval'/);

      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-frame-options']).toBe('DENY');
      expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(headers['cross-origin-opener-policy']).toBe('same-origin');
      expect(headers['strict-transport-security']).toMatch(/max-age=\d+/);
      expect(headers['permissions-policy']).toContain('camera=()');
    });
  }

  test('hashed bundles are cached for good, pages are not', async ({ page, request }) => {
    const bundles: string[] = [];
    page.on('response', (response) => {
      if (/\/(main|chunk|polyfills|styles)-[\w-]+\.(js|css)$/.test(response.url())) {
        bundles.push(response.url());
      }
    });
    await open(page, '/');
    expect(bundles.length).toBeGreaterThan(0);

    for (const bundle of bundles.slice(0, 5)) {
      const response = await request.get(bundle);
      expect(response.headers()['cache-control']).toContain('immutable');
    }

    const html = await request.get('/');
    expect(html.headers()['cache-control']).not.toContain('immutable');
  });
});

test.describe('the content security policy in practice', () => {
  // The guard fixture fails any of these on a refused style or script, so each only has to get there
  for (const locale of locales) {
    test(`every pop-up renders unrefused in ${locale.lang}`, async ({ page }) => {
      await open(page, '/', locale.lang);

      await (await headerLink(page, /CV/)).click();
      await expect(page.getByRole('dialog').locator('lpg-cv-document')).toBeVisible();
      await page.getByRole('dialog').locator('.download__trigger').click();
      await expect(page.getByRole('menu')).toBeVisible();
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');

      await page.locator('.site-footer .site-footer__link').first().click();
      await expect(page.getByRole('dialog').locator('.sitemap__node').first()).toBeVisible();
      await page.keyboard.press('Escape');

      await page.locator('.site-footer button.site-footer__link').click();
      await expect(page.getByRole('dialog').locator('lpg-cookies-content')).toBeVisible();
      await page.keyboard.press('Escape');

      await page.locator('.lang__trigger').click();
      await expect(page.getByRole('menu')).toBeVisible();
      await page.keyboard.press('Escape');

      await open(page, '/work/taskly', locale.lang);
      await page.locator('.project-hero .media__expand').click();
      await expect(page.getByRole('dialog').locator('.viewer__image')).toBeVisible();
      await page.keyboard.press('Escape');

      await page.locator('.figure__frame').first().click();
      await expect(page.getByRole('dialog').locator('.diagram__image')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
    });
  }
});

test.describe('an injected inline script', () => {
  test.use({ tolerate: /Content Security Policy/ });

  test('is refused', async ({ page }) => {
    await open(page, '/');
    const refused: string[] = [];
    page.on('console', (message) => {
      if (message.text().includes('Content Security Policy')) {
        refused.push(message.text());
      }
    });

    await page.evaluate(() => {
      const script = document.createElement('script');
      script.textContent = 'window.pwned = true';
      document.body.append(script);
    });

    expect(
      await page.evaluate(() => (window as unknown as { pwned?: boolean }).pwned),
    ).toBeUndefined();
    await expect.poll(() => refused.length).toBeGreaterThan(0);
  });
});

test.describe('what search engines are given', () => {
  test('robots.txt allows everything and names the sitemap', async ({ request }) => {
    const text = await (await request.get('/robots.txt')).text();

    expect(text).toMatch(/User-agent: \*/);
    expect(text).toMatch(/Allow: \//);
    expect(text).toMatch(/Sitemap: \S+\/sitemap\.xml/);
  });

  test('sitemap.xml lists every page in every language, and nothing else', async ({ request }) => {
    const text = await (await request.get('/sitemap.xml')).text();
    const listed = [...text.matchAll(/<loc>[^<]*?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map(
      (match) => match[1],
    );

    const expected = locales.flatMap((locale) =>
      routes.map((route) => (route === '/' ? `${locale.prefix}/` : `${locale.prefix}${route}`)),
    );
    expect([...listed].sort()).toEqual([...expected].sort());
  });
});
