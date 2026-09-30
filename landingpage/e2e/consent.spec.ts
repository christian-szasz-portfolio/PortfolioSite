import { type Page } from '@playwright/test';

import { ConsentChoice, Lang, StorageKey, t } from './support/site';
import { dialog, expect, headerLink, open, sampleStats, test, today } from './support/fixtures';

async function stored(page: Page, key: StorageKey): Promise<string | null> {
  return page.evaluate((name) => localStorage.getItem(name), key);
}

test.describe('a first visit', () => {
  test.use({ consent: ConsentChoice.Unset });

  test('asks before counting anything, and sends nothing while it waits', async ({ page, api }) => {
    await open(page, '/');

    const banner = page.getByRole('region', { name: 'Usage statistics consent' });
    await expect(banner).toBeVisible();
    await expect(banner.getByRole('button', { name: 'Accept' })).toBeVisible();
    await expect(banner.getByRole('button', { name: 'Decline' })).toBeVisible();

    await page.locator('#about').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1_000);
    expect(api.calls).toEqual([]);
    await expect(page.locator('.views')).toHaveCount(0);
  });

  for (const lang of [Lang.German, Lang.Romanian]) {
    test(`asks in ${lang}`, async ({ page }) => {
      await open(page, '/', lang);

      await expect(
        page.locator('.consent').getByRole('button', { name: t(lang, 'consent.accept.cta') }),
      ).toBeVisible();
      await expect(
        page.locator('.consent').getByRole('button', { name: t(lang, 'consent.decline.cta') }),
      ).toBeVisible();
    });
  }

  test('declining is remembered and nothing is ever sent', async ({ page, api }) => {
    await open(page, '/');

    await page.locator('.consent').getByRole('button', { name: 'Decline' }).click();

    await expect(page.locator('.consent')).toHaveCount(0);
    expect(await stored(page, StorageKey.Consent)).toBe(ConsentChoice.Denied);

    await page.reload();
    await (await headerLink(page, 'CV')).click();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(6_000);

    await expect(page.locator('.consent')).toHaveCount(0);
    expect(api.calls).toEqual([]);
  });

  test('accepting counts this visit once and shows the total', async ({ page, api }) => {
    await open(page, '/');

    await page.locator('.consent').getByRole('button', { name: 'Accept' }).click();

    await expect(page.locator('.consent')).toHaveCount(0);
    expect(await stored(page, StorageKey.Consent)).toBe(ConsentChoice.Granted);
    await expect(page.locator('.hero .views__value')).toHaveText(String(sampleStats.total));
    await expect(page.locator('.hero .views')).toHaveAttribute(
      'title',
      /counted once a day per browser/,
    );

    expect(api.views('POST')).toHaveLength(1);
    expect(api.views('GET')).toHaveLength(0);
    expect(await stored(page, StorageKey.ViewsDay)).toBe(today());
  });

  test('the notice behind Details opens and closes', async ({ page }) => {
    await open(page, '/');

    await page.locator('.consent__more').click();

    const notice = dialog(page);
    await expect(notice.getByRole('heading', { name: 'Cookies and storage' })).toBeVisible();
    await expect(notice.locator('lpg-cookies-content')).toContainText('no cookies');
    await page.keyboard.press('Escape');

    await expect(notice).toHaveCount(0);
    await expect(page.locator('.consent'), 'the question is still waiting').toBeVisible();
  });
});

test.describe('a return visit', () => {
  test.use({ consent: ConsentChoice.Granted });

  test('on the same day reads the count without adding to it', async ({ page, api }) => {
    await page.addInitScript(([key, day]) => localStorage.setItem(key, day), [
      StorageKey.ViewsDay,
      today(),
    ] as const);
    await open(page, '/');

    await expect(page.locator('.hero .views__value')).toHaveText(String(sampleStats.total));
    expect(api.views('GET')).toHaveLength(1);
    expect(api.views('POST')).toHaveLength(0);
    await expect(page.locator('.consent')).toHaveCount(0);
  });

  test('on a later day counts again', async ({ page, api }) => {
    await page.addInitScript(([key]) => localStorage.setItem(key, '2020-01-01'), [
      StorageKey.ViewsDay,
    ] as const);
    await open(page, '/');

    await expect(page.locator('.hero .views__value')).toHaveText(String(sampleStats.total));
    expect(api.views('POST')).toHaveLength(1);
  });

  test('moving between pages asks the counter only once', async ({ page, api }) => {
    await open(page, '/');
    await expect(page.locator('.hero .views__value')).toBeVisible();

    await page.locator('.project .button--primary').first().click();
    await expect(page.locator('h1')).toHaveText('Stack86');
    await page.locator('.crumbs').getByRole('link', { name: 'Home' }).click();
    await expect(page.locator('.hero .views__value')).toBeVisible();

    expect(api.views()).toHaveLength(1);
  });

  test('the cookies notice breaks the count down by country', async ({ page }) => {
    await open(page, '/');
    await page.locator('.site-footer').getByRole('button', { name: 'Cookies' }).click();

    const rows = dialog(page).locator('.view-breakdown__row');
    await expect(rows).toHaveCount(sampleStats.countries.length);
    await expect(rows.nth(0).locator('.view-breakdown__name')).toHaveText('Romania');
    await expect(rows.nth(1).locator('.view-breakdown__name')).toHaveText('Germany');
    await expect(rows.nth(2).locator('.view-breakdown__name')).toHaveText('Unknown');
    await expect(rows.nth(0).locator('.view-breakdown__count')).toHaveText('900');
  });

  test('the breakdown names countries in the reader language', async ({ page }) => {
    await open(page, '/', Lang.German);
    await page
      .locator('.site-footer .site-footer__link')
      .filter({ hasText: t(Lang.German, 'footer.cookies.cta') })
      .click();

    await expect(dialog(page).locator('.view-breakdown__name').first()).toHaveText('Rumänien');
  });

  test('a count of nothing shows no breakdown', async ({ page, api }) => {
    api.stats = { total: 0, countries: [] };
    await open(page, '/');
    await page.locator('.site-footer').getByRole('button', { name: 'Cookies' }).click();

    await expect(dialog(page).getByRole('heading', { name: 'Cookies and storage' })).toBeVisible();
    await expect(dialog(page).locator('.view-breakdown')).toHaveCount(0);
  });
});

test.describe('without storage', () => {
  test.use({ consent: ConsentChoice.Unset });

  test('the site still works and the choice holds for the visit', async ({ page, api }) => {
    await page.addInitScript(() => {
      const refuse = (): never => {
        throw new DOMException('denied', 'SecurityError');
      };
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get: () => ({
          getItem: refuse,
          setItem: refuse,
          removeItem: refuse,
          clear: refuse,
          key: refuse,
          length: 0,
        }),
      });
    });
    await open(page, '/');

    await page.locator('.consent').getByRole('button', { name: 'Accept' }).click();
    await expect(page.locator('.consent')).toHaveCount(0);
    await expect(page.locator('.hero .views__value')).toHaveText(String(sampleStats.total));
    expect(api.views('POST')).toHaveLength(1);

    await page.locator('.theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});
