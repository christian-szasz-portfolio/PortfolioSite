import { locales, projects, routes } from './support/site';
import { expect, test } from './support/fixtures';

test.describe('with scripting off', () => {
  test.use({ javaScriptEnabled: false });

  for (const locale of locales) {
    for (const route of routes) {
      test(`${locale.prefix}${route} is readable from the prerender alone`, async ({ page }) => {
        await page.goto(`${locale.prefix}${route}`);

        await expect(page.locator('h1')).toHaveCount(1);
        await expect(page.locator('h1')).not.toBeEmpty();
        await expect(page.locator('main#main')).not.toBeEmpty();
        await expect(page.locator('.site-footer')).toBeVisible();
      });
    }
  }

  test('the home page still links to every project and the CV', async ({ page }) => {
    await page.goto('/');

    for (const project of projects) {
      await expect(page.locator(`a[href="/work/${project.slug}"]`).first()).toBeAttached();
    }
    await expect(page.locator('.site-nav__link--cta')).toHaveAttribute('href', '/cv');
  });

  test('following a link is a real page load', async ({ page }) => {
    await page.goto('/');

    await page.locator('a[href="/work/stack86"]').first().click();

    await expect(page).toHaveURL(/\/work\/stack86$/);
    await expect(page.locator('h1')).toHaveText('Stack86');
  });

  test('/unsupported still sends the reader home', async ({ page }) => {
    await page.goto('/unsupported');

    await expect(page).toHaveURL(/\/$/);
  });

  test('the language can still be changed', async ({ page }) => {
    await page.goto('/work/taskly');

    await expect(
      page.locator('.lang__trigger'),
      'the menu that needs scripting is not offered',
    ).toBeHidden();
    const german = page.locator('.lang__plain a[hreflang="de"]');
    await expect(german).toBeVisible();
    await expect(german).toHaveAttribute('href', '/de-DE/work/taskly');

    await german.click();

    await expect(page).toHaveURL(/\/de-DE\/work\/taskly$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  });
});
