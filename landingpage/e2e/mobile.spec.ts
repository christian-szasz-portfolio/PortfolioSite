import { Lang, routes, Section, t } from './support/site';
import { expect, open, test } from './support/fixtures';

test.describe('on a phone', () => {
  test.beforeEach(({ isMobile }) => {
    test.skip(!isMobile, 'Phone layout only');
  });

  test('the sections sit behind a menu button', async ({ page }) => {
    await open(page, '/');
    const toggle = page.getByRole('button', { name: t(Lang.English, 'nav.menu.label') });
    const nav = page.locator('#site-nav');

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toHaveAttribute('aria-controls', 'site-nav');
    await expect(nav.getByRole('link', { name: 'About' })).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(nav.getByRole('link', { name: 'About' })).toBeVisible();

    await nav.getByRole('link', { name: 'About' }).click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator(`#${Section.About}`)).toBeInViewport();
  });

  test('the menu closes on Escape and on a second press', async ({ page }) => {
    await open(page, '/');
    const toggle = page.locator('.nav-toggle');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await toggle.click();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('the CV opens from the menu and closes it', async ({ page }) => {
    await open(page, '/');
    await page.locator('.nav-toggle').click();

    await page.locator('#site-nav').getByRole('link', { name: 'CV' }).click();

    await expect(
      page.getByRole('dialog').getByRole('heading', { name: 'Curriculum vitae' }),
    ).toBeVisible();
    await expect(page.locator('.nav-toggle')).toHaveAttribute('aria-expanded', 'false');
  });

  for (const route of routes) {
    test(`${route} has tap targets a finger can hit`, async ({ page }) => {
      await open(page, route);

      // WCAG 2.5.8: under 24 by 24 passes when a 24px circle on its centre touches no other target
      const small = await page.evaluate(() => {
        const targets = [
          ...document.querySelectorAll<HTMLElement>(
            'header button, header a, footer button, footer a',
          ),
        ]
          .filter((element) => element.offsetParent !== null)
          .map((element) => ({ element, box: element.getBoundingClientRect() }));
        const touches = (x: number, y: number, box: DOMRect): boolean => {
          const nearestX = Math.max(box.left, Math.min(x, box.right));
          const nearestY = Math.max(box.top, Math.min(y, box.bottom));
          return Math.hypot(x - nearestX, y - nearestY) < 12;
        };

        return targets
          .filter(({ box }) => box.width < 24 || box.height < 24)
          .filter(({ element, box }) => {
            const x = box.left + box.width / 2;
            const y = box.top + box.height / 2;
            return targets.some(
              (other) =>
                other.element !== element &&
                !other.element.contains(element) &&
                !element.contains(other.element) &&
                touches(x, y, other.box),
            );
          })
          .map(
            ({ element, box }) =>
              `${element.textContent?.trim() || element.getAttribute('aria-label')} ${Math.round(box.width)}x${Math.round(box.height)}`,
          );
      });

      expect(small, 'WCAG 2.2 target size, 24 by 24').toEqual([]);
    });
  }
});
