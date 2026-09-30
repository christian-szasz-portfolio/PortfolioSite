import { type Page } from '@playwright/test';

import { Lang, StorageKey, ThemeName, t } from './support/site';
import { expect, open, test } from './support/fixtures';

/** The theme the document is drawn in */
async function theme(page: Page): Promise<string | null> {
  return page.locator('html').getAttribute('data-theme');
}

test.describe('the theme', () => {
  test('starts dark and says what a press will do', async ({ page }) => {
    await open(page, '/');
    const toggle = page.locator('.theme-toggle');

    expect(await theme(page)).toBe(ThemeName.Dark);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle).toHaveAttribute('aria-label', t(Lang.English, 'theme.toLight.cta'));
  });

  test('switches to light and back, and remembers the choice', async ({ page }) => {
    await open(page, '/');
    const toggle = page.locator('.theme-toggle');

    await toggle.click();
    await expect.poll(() => theme(page)).toBe(ThemeName.Light);
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(toggle).toHaveAttribute('aria-label', t(Lang.English, 'theme.toDark.cta'));
    expect(await page.evaluate((key) => localStorage.getItem(key), StorageKey.Theme)).toBe(
      ThemeName.Light,
    );

    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await toggle.click();
    await expect.poll(() => theme(page)).toBe(ThemeName.Dark);
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe(
      background,
    );

    await toggle.click();
    await expect.poll(() => theme(page)).toBe(ThemeName.Light);
    await page.reload();
    expect(await theme(page)).toBe(ThemeName.Light);
  });

  test('a stored choice is applied before the page first paints', async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, 'light');
      document.addEventListener('DOMContentLoaded', () => {
        (window as unknown as { themeAtLoad: string | null }).themeAtLoad =
          document.documentElement.getAttribute('data-theme');
      });
    }, StorageKey.Theme);

    await page.goto('/');

    const atLoad = await page.evaluate(
      () => (window as unknown as { themeAtLoad: string | null }).themeAtLoad,
    );
    expect(atLoad).toBe(ThemeName.Light);
  });

  test('carries across pages and languages', async ({ page }) => {
    await open(page, '/');
    await page.locator('.theme-toggle').click();
    await expect.poll(() => theme(page)).toBe(ThemeName.Light);

    await open(page, '/work/stack86', Lang.German);
    expect(await theme(page)).toBe(ThemeName.Light);
  });

  test('ignores a stored value it does not know', async ({ page }) => {
    await page.addInitScript((key) => localStorage.setItem(key, 'sepia'), StorageKey.Theme);
    await open(page, '/');

    expect(await theme(page)).toBe(ThemeName.Dark);
  });

  test.describe('with reduced motion', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } });

    test('switches at once, with no wipe', async ({ page }) => {
      await open(page, '/');

      await page.locator('.theme-toggle').click();

      expect(await theme(page)).toBe(ThemeName.Light);
      expect(
        await page.evaluate(() => document.documentElement.classList.contains('is-theme-wiping')),
      ).toBe(false);
    });
  });

  test('wipes in when motion is welcome, and tidies up after', async ({ page }) => {
    await open(page, '/');

    await page.locator('.theme-toggle').click();

    await expect.poll(() => theme(page)).toBe(ThemeName.Light);
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.classList.contains('is-theme-wiping')),
      )
      .toBe(false);
  });
});
