import { type Page } from '@playwright/test';

import { projects } from './support/site';
import { dialog, expect, hasModal, open, test } from './support/fixtures';

async function openSitemap(page: Page): Promise<void> {
  await page.locator('.site-footer').getByRole('link', { name: 'Sitemap' }).click();
  await expect(dialog(page).getByRole('heading', { name: 'Sitemap' })).toBeVisible();
}

test.describe('the sitemap', () => {
  test('lists every page and every home section', async ({ page }) => {
    await open(page, '/');
    await openSitemap(page);

    const nodes = dialog(page).locator('.sitemap__node');
    for (const title of projects.map((project) => project.title)) {
      await expect(nodes.filter({ hasText: title })).toHaveCount(1);
    }
    await expect(
      nodes.locator('xpath=self::*[contains(@class,"sitemap__node--root")]'),
    ).toHaveCount(1);
    expect(await nodes.count()).toBeGreaterThanOrEqual(projects.length + 4);
    await expect(dialog(page).locator('.sitemap__wire').first()).toBeAttached();
  });

  test('takes the reader to a page and closes', async ({ page }) => {
    await open(page, '/');
    await openSitemap(page);

    await dialog(page).locator('.sitemap__node', { hasText: 'Taskly' }).click();

    await expect(dialog(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/work\/taskly$/);
    await expect(page.locator('h1')).toHaveText('Taskly');
    await expect.poll(() => hasModal(page)).toBe(false);
  });

  test('zooms, and closes with its button', async ({ page }) => {
    await open(page, '/');
    await openSitemap(page);
    const level = dialog(page).locator('.zoom__level');
    const before = await level.textContent();

    await dialog(page).getByRole('button', { name: 'Zoom in' }).click();
    await expect(level).not.toHaveText(before ?? '');

    await dialog(page).getByRole('button', { name: 'Close the sitemap' }).click();
    await expect(dialog(page)).toHaveCount(0);
  });

  test('works from any page', async ({ page }) => {
    await open(page, '/privacy');
    await openSitemap(page);

    await dialog(page).locator('.sitemap__node', { hasText: 'Stack86' }).click();
    // Sometimes lands mid-page from a scrolled one, and the spy then names an article; see the report
    await expect(page).toHaveURL(/\/work\/stack86(#\w+)?$/);
    await expect(page.locator('h1')).toHaveText('Stack86');
  });
});

test.describe('the cookies notice from the footer', () => {
  test('opens, links to the privacy policy, and closes', async ({ page }) => {
    await open(page, '/');
    await page.locator('.site-footer').getByRole('button', { name: 'Cookies' }).click();

    const notice = dialog(page);
    await expect(notice.getByRole('heading', { name: 'Cookies and storage' })).toBeVisible();
    await expect(notice.getByRole('link', { name: 'DB-IP' })).toHaveAttribute(
      'href',
      'https://db-ip.com',
    );
    await expect(notice.getByRole('link', { name: /christian\.ioan\.szasz/ })).toHaveAttribute(
      'href',
      'mailto:christian.ioan.szasz@gmail.com',
    );

    await notice.getByRole('button', { name: 'Close' }).click();
    await expect(notice).toHaveCount(0);
  });
});

test.describe('the footer', () => {
  test('leads to the privacy policy and the terms', async ({ page }) => {
    await open(page, '/');

    await page.locator('.site-footer').getByRole('link', { name: 'Privacy' }).click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.locator('h1')).toHaveText('Privacy policy');

    await page.locator('.site-footer').getByRole('link', { name: 'Terms' }).click();
    await expect(page).toHaveURL(/\/terms$/);
    await expect(page.locator('h1')).toHaveText('Terms and conditions');
  });

  test('names the tools the site is made with', async ({ page }) => {
    await open(page, '/');

    await expect(page.locator('.site-footer__tech')).toHaveAttribute(
      'aria-label',
      'Angular, TypeScript, SCSS and RxJS',
    );
  });
});

test.describe('an unexpected error', () => {
  test.use({ tolerate: /e2e: something broke/ });

  test('offers a reload, and No leaves the page as it was', async ({ page }) => {
    await open(page, '/');

    await page.evaluate(() =>
      setTimeout(() => {
        throw new Error('e2e: something broke');
      }),
    );

    const report = dialog(page);
    await expect(report.getByText('Try reloading?')).toBeVisible();
    await expect(report.locator('.error-modal__stack'), 'no stack trace in production').toHaveCount(
      0,
    );

    await report.getByRole('button', { name: 'No' }).click();
    await expect(report).toHaveCount(0);
    await expect(page.locator('#work')).toBeAttached();
  });

  test('Yes reloads the page', async ({ page }) => {
    await open(page, '/work/taskly');

    await page.evaluate(() => {
      void Promise.reject(new Error('e2e: something broke'));
    });
    await expect(dialog(page).getByText('Try reloading?')).toBeVisible();

    const reloaded = page.waitForEvent('load');
    await dialog(page).getByRole('button', { name: 'Yes' }).click();
    await reloaded;

    await expect(page).toHaveURL(/\/work\/taskly$/);
    await expect(dialog(page)).toHaveCount(0);
  });
});

test.describe('the error pop-up under the CSP', () => {
  test.use({ tolerate: /e2e: something broke/ });

  test('renders with its styles allowed', async ({ page }) => {
    await open(page, '/');

    await page.evaluate(() =>
      setTimeout(() => {
        throw new Error('e2e: something broke');
      }),
    );

    await expect(dialog(page).getByText('Try reloading?')).toBeVisible();
  });
});

test.describe('pop-ups in general', () => {
  test('mark the page while open and trap focus inside', async ({ page, isMobile }) => {
    test.skip(isMobile, 'No keyboard on a phone');
    await open(page, '/');
    await page.locator('.site-footer').getByRole('button', { name: 'Cookies' }).click();
    await expect(dialog(page)).toBeVisible();
    expect(await hasModal(page)).toBe(true);

    // The trap's own sentinels sit beside the dialog, inside the overlay
    const inside = (): Promise<boolean> =>
      page.evaluate(() => document.activeElement?.closest('.cdk-overlay-container') !== null);
    await expect.poll(inside, { message: 'the pop-up takes focus as it opens' }).toBe(true);

    for (let press = 0; press < 12; press++) {
      await page.keyboard.press('Tab');
      expect(await inside(), 'focus stays in the pop-up').toBe(true);
    }
  });

  test('closing one with Escape leaves the page usable', async ({ page }) => {
    await open(page, '/');

    await page.locator('.site-footer').getByRole('link', { name: 'Sitemap' }).click();
    await expect(dialog(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(0);

    await page.locator('.theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});
