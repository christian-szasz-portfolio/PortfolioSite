import { locales, routes } from './support/site';
import { expect, open, test } from './support/fixtures';

test.describe('the structure a screen reader walks', () => {
  for (const route of routes) {
    test(`${route} is built to be navigated`, async ({ page }) => {
      await open(page, route);

      await expect(page.getByRole('banner')).toHaveCount(1);
      await expect(page.locator('main#main')).toHaveCount(1);
      await expect(page.getByRole('contentinfo')).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

      const faults = await page.evaluate(() => {
        const found: string[] = [];
        const visible = (element: Element): boolean =>
          (element as HTMLElement).offsetParent !== null;

        for (const image of document.querySelectorAll('img')) {
          if (!image.hasAttribute('alt')) {
            found.push(`image without alt: ${image.getAttribute('src') ?? ''}`);
          }
        }

        for (const control of document.querySelectorAll('button, a[href]')) {
          const name = (control.getAttribute('aria-label') ?? control.textContent ?? '').trim();
          if (
            visible(control) &&
            name === '' &&
            control.querySelector('[class*="visually-hidden"]') === null
          ) {
            found.push(
              `unnamed ${control.tagName.toLowerCase()}: ${control.outerHTML.slice(0, 80)}`,
            );
          }
        }

        // Flag ids are a known defect, tested on their own below
        const ids = [...document.querySelectorAll('[id]')]
          .map((element) => element.id)
          .filter((id) => !id.startsWith('flag-'));
        for (const id of new Set(ids.filter((id, index) => ids.indexOf(id) !== index))) {
          found.push(`duplicate id: ${id}`);
        }

        let previous = 1;
        for (const heading of document.querySelectorAll('main h1, main h2, main h3, main h4')) {
          const level = Number(heading.tagName[1]);
          if (visible(heading) && level > previous + 1) {
            found.push(
              `heading jumps from h${previous} to h${level}: ${heading.textContent?.trim().slice(0, 40)}`,
            );
          }
          previous = level;
        }

        return found;
      });

      expect(faults).toEqual([]);
    });
  }

  test('no id is used twice', async ({ page }) => {
    await open(page, '/');

    const repeated = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
      return [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    });
    expect(repeated).toEqual([]);
  });

  test('the CV page has one main landmark', async ({ page }) => {
    await open(page, '/cv');

    await expect(page.getByRole('main')).toHaveCount(1);
  });

  for (const locale of locales) {
    test(`the document declares ${locale.lang}, and the switcher names each language in its own`, async ({
      page,
    }) => {
      await open(page, '/', locale.lang);

      await expect(page.locator('html')).toHaveAttribute('lang', locale.lang);
      await page.locator('.lang__trigger').click();
      for (const other of locales) {
        await expect(page.locator(`.lang__item[hreflang="${other.lang}"]`)).toHaveAttribute(
          'lang',
          other.lang,
        );
      }
    });
  }
});

test.describe('the keyboard', () => {
  test.beforeEach(({ isMobile }) => {
    test.skip(isMobile, 'No keyboard on a phone');
  });

  test('every focus stop shows where it is', async ({ page }) => {
    await open(page, '/');

    const unmarked: string[] = [];
    for (let press = 0; press < 25; press++) {
      await page.keyboard.press('Tab');
      const stop = await page.evaluate(() => {
        const active = document.activeElement as HTMLElement | null;
        if (active === null || active === document.body) {
          return null;
        }
        const style = getComputedStyle(active);
        const marked =
          (style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) > 0) ||
          style.boxShadow !== 'none';
        return { marked, label: active.outerHTML.slice(0, 80) };
      });

      if (stop !== null && !stop.marked) {
        unmarked.push(stop.label);
      }
    }

    expect(unmarked).toEqual([]);
  });

  test('reaches the header controls in reading order', async ({ page }) => {
    await open(page, '/');

    const order: string[] = [];
    for (let press = 0; press < 10; press++) {
      await page.keyboard.press('Tab');
      order.push(
        await page.evaluate(
          () => (document.activeElement as HTMLElement | null)?.className.split(' ')[0] ?? '',
        ),
      );
    }

    expect(order.indexOf('skip-link')).toBe(0);
    expect(order.indexOf('brand')).toBeLessThan(order.indexOf('site-nav__link'));
    expect(order.indexOf('site-nav__link')).toBeLessThan(order.indexOf('theme-toggle'));
    expect(order.indexOf('theme-toggle')).toBeLessThan(order.indexOf('lang__trigger'));
  });
});

test.describe('with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('nothing keeps moving on its own', async ({ page }) => {
    await open(page, '/');

    const running = await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter((animation) => animation.playState === 'running')
          .filter((animation) => {
            const timing = animation.effect?.getComputedTiming();
            return timing?.iterations === Infinity;
          }).length,
    );

    expect(running, 'no endless animation plays').toBe(0);
  });

  test('the clips wait to be asked', async ({ page }) => {
    await open(page, '/work/taskly');

    await expect(page.locator('.project-hero .play-toggle')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
