import { type Page } from '@playwright/test';

import { ConsentChoice } from './support/site';
import { ApiMode, dialog, expect, headerLink, open, test } from './support/fixtures';

/** The banner that says the counter is down */
function statusBanner(page: Page) {
  return page.locator('.status-banner');
}

test.describe('when the counter API is down', () => {
  test.use({
    consent: ConsentChoice.Granted,
    tolerate: /Failed to load resource|ERR_INTERNET_DISCONNECTED/,
  });

  for (const mode of [ApiMode.Failing, ApiMode.Offline]) {
    test(`says so once, keeps the page working, and can be dismissed (${mode})`, async ({
      page,
      api,
    }) => {
      api.mode = mode;
      await open(page, '/');

      await expect(statusBanner(page)).toHaveClass(/status-banner--visible/);
      await expect(statusBanner(page)).toHaveAttribute('aria-hidden', 'false');
      await expect(statusBanner(page)).toContainText(
        'Visitor statistics are temporarily unavailable. The website itself is not affected.',
      );
      await expect(page.locator('.views')).toHaveCount(0);

      const height = await page.evaluate(() =>
        document.documentElement.style.getPropertyValue('--status-banner-height'),
      );
      expect(Number.parseFloat(height), 'the header makes room for it').toBeGreaterThan(0);

      await statusBanner(page).getByRole('button', { name: 'Dismiss' }).click();
      await expect(statusBanner(page)).not.toHaveClass(/status-banner--visible/);
      await expect(statusBanner(page)).toHaveAttribute('aria-hidden', 'true');

      await page.locator('.project .button--primary').first().click();
      await expect(page.locator('h1')).toHaveText('Stack86');
      await expect(statusBanner(page), 'dismissed for the rest of the visit').not.toHaveClass(
        /status-banner--visible/,
      );
      expect(api.views(), 'no retry once it is known to be down').toHaveLength(1);
    });
  }

  test('learning more opens the cookies notice', async ({ page, api }) => {
    api.mode = ApiMode.Failing;
    await open(page, '/');

    await statusBanner(page).getByRole('button', { name: 'Learn more' }).click();
    await expect(dialog(page).getByRole('heading', { name: 'Cookies and storage' })).toBeVisible();
  });

  test('stops reporting interactions once it is known to be down', async ({ page, api }) => {
    api.mode = ApiMode.Failing;
    await open(page, '/');
    await expect(statusBanner(page)).toHaveClass(/status-banner--visible/);

    await (await headerLink(page, 'CV')).click();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(6_000);

    expect(api.calls.filter((call) => call.path === '/api/interactions')).toHaveLength(0);
  });

  test('an interactions failure alone is reported the same way', async ({ page, api }) => {
    api.interactionsMode = ApiMode.Failing;
    await open(page, '/');
    await expect(page.locator('.hero .views__value')).toBeVisible();

    await page.waitForTimeout(6_000);

    await expect(statusBanner(page)).toHaveClass(/status-banner--visible/);
  });
});

test.describe('when the counter API is throttling', () => {
  test.use({ consent: ConsentChoice.Granted, tolerate: /status of 429/ });

  test('says nothing, shows no count, and does not ask again', async ({ page, api }) => {
    api.mode = ApiMode.Throttled;
    await open(page, '/');
    await page.waitForTimeout(6_000);

    await expect(statusBanner(page)).not.toHaveClass(/status-banner--visible/);
    await expect(page.locator('.views')).toHaveCount(0);
    expect(api.views()).toHaveLength(1);
  });
});

test.describe('when a first visitor meets a down API', () => {
  test.use({ consent: ConsentChoice.Unset });

  test('nothing is asked of it, so nothing is reported down', async ({ page, api }) => {
    api.mode = ApiMode.Failing;
    await open(page, '/');
    await page.waitForTimeout(1_000);

    expect(api.calls).toEqual([]);
    await expect(statusBanner(page)).not.toHaveClass(/status-banner--visible/);
    await expect(page.locator('.consent')).toBeVisible();
  });
});
