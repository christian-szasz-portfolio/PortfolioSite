import { type Page } from '@playwright/test';

import { locales, Lang, routes, localeOf, t } from './support/site';
import { expect, hydrated, open, test } from './support/fixtures';

/** The language switcher's trigger */
function trigger(page: Page) {
  return page.locator('.lang__trigger');
}

test.describe('the language switcher', () => {
  for (const locale of locales) {
    test(`shows ${locale.short} and offers all three languages from ${locale.lang}`, async ({
      page,
    }) => {
      await open(page, '/', locale.lang);

      await expect(trigger(page).locator('.lang__code')).toHaveText(locale.short);
      await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');

      await trigger(page).click();
      const menu = page.getByRole('menu');
      await expect(menu).toBeVisible();
      await expect(trigger(page)).toHaveAttribute('aria-expanded', 'true');

      const items = menu.getByRole('menuitem');
      await expect(items).toHaveCount(locales.length);
      for (const [index, other] of locales.entries()) {
        await expect(items.nth(index)).toHaveAttribute('hreflang', other.lang);
        await expect(items.nth(index)).toHaveAttribute('href', `${other.prefix}/`);
      }

      await expect(menu.locator('[aria-current="true"]')).toHaveAttribute('hreflang', locale.lang);
    });
  }

  test('is driven by the keyboard and gives focus back', async ({ page, isMobile }) => {
    test.skip(isMobile, 'No keyboard on a phone');
    await open(page, '/');

    await trigger(page).focus();
    await page.keyboard.press('Enter');
    const items = page.getByRole('menu').getByRole('menuitem');
    await expect(items).toHaveCount(3);

    await page.keyboard.press('ArrowDown');
    await expect(items.nth(0)).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(items.nth(1)).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(items.nth(0)).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(trigger(page)).toBeFocused();
  });

  test('closes on a click elsewhere', async ({ page }) => {
    await open(page, '/');
    await trigger(page).click();
    await expect(page.getByRole('menu')).toBeVisible();

    await page.locator('h1').click();

    await expect(page.getByRole('menu')).toHaveCount(0);
  });

  const journeys: readonly (readonly [string, Lang, Lang])[] = [
    ['/work/taskly', Lang.English, Lang.German],
    ['/cv', Lang.German, Lang.Romanian],
    ['/privacy', Lang.Romanian, Lang.English],
    ['/', Lang.English, Lang.Romanian],
  ];

  for (const [route, from, to] of journeys) {
    test(`keeps the reader on ${route} going from ${from} to ${to}`, async ({ page }) => {
      await open(page, route, from);

      await trigger(page).click();
      await page.getByRole('menu').locator(`[hreflang="${to}"]`).click();

      const target = localeOf(to);
      const expected = route === '/' ? `${target.prefix}/` : `${target.prefix}${route}`;
      await expect(page).toHaveURL((url) => url.pathname === expected);
      await expect(page.locator('html')).toHaveAttribute('lang', to);
      await hydrated(page);
      await expect(trigger(page).locator('.lang__code')).toHaveText(target.short);
    });
  }
});

test.describe('translated pages', () => {
  for (const locale of locales) {
    test(`read in ${locale.lang} throughout`, async ({ page }) => {
      await open(page, '/', locale.lang);

      await expect(page.locator('.site-nav__link').first()).toContainText(
        t(locale.lang, 'nav.work.label'),
      );
      await expect(page.locator('.site-footer')).toContainText(
        t(locale.lang, 'footer.sitemap.cta'),
      );
      await expect(page.locator('.theme-toggle')).toHaveAttribute(
        'aria-label',
        t(locale.lang, 'theme.toLight.cta'),
      );
    });
  }

  test('each language reads differently', async ({ page }) => {
    const titles = new Set<string>();

    for (const locale of locales) {
      await open(page, '/', locale.lang);
      titles.add((await page.locator('h1').textContent()) ?? '');
    }

    expect(titles.size).toBe(locales.length);
  });

  for (const route of routes) {
    test(`${route} links its other languages in the head`, async ({ page }) => {
      await open(page, route);

      for (const locale of locales) {
        const path = route === '/' ? `${locale.prefix}/` : `${locale.prefix}${route}`;
        await expect(
          page.locator(`link[rel="alternate"][hreflang="${locale.lang}"]`),
        ).toHaveAttribute('href', new RegExp(`${path.replace(/[/.]/g, '\\$&')}$`));
      }
      await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
    });
  }
});
