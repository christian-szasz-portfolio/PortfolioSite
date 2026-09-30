import { type Page } from '@playwright/test';

import { locales, Lang, projects, Section, t } from './support/site';
import { expect, headerLink, open, test } from './support/fixtures';

/** How far the page has been scrolled */
async function scrollY(page: Page): Promise<number> {
  return page.evaluate(() => window.scrollY);
}

test.describe('the home page', () => {
  test('shows every section in order', async ({ page }) => {
    await open(page, '/');

    const ids = await page
      .locator('main section[id]')
      .evaluateAll((sections) => sections.map((s) => s.id));
    expect(ids).toEqual(['top', Section.Work, Section.Thinking, Section.About]);

    await expect(page.locator('h1')).toHaveText('Engineer by trade, curious by default.');
    await expect(page.locator('.profile__photo')).toHaveJSProperty('complete', true);
    await expect(page.locator('.hobby')).toHaveCount(5);
    await expect(page.locator('.pillars > *')).toHaveCount(3);
  });

  test('lists the projects in document order', async ({ page }) => {
    await open(page, '/');

    await expect(page.locator('.project__title')).toHaveText(
      projects.map((project) => project.title),
    );
  });

  for (const project of projects) {
    test(`the ${project.title} card links to its page and its repository`, async ({ page }) => {
      await open(page, '/');
      const card = page.locator('.project', {
        has: page.locator('.project__title', { hasText: project.title }),
      });

      if (project.repository === null) {
        await expect(card.locator('.link--repo')).toHaveCount(0);
      } else {
        await expect(card.locator('.link--repo')).toHaveAttribute('href', project.repository);
        await expect(card.locator('.link--repo')).toHaveText(
          project.demo ? 'View the demo repository' : 'View the repository',
        );
      }

      await card.getByRole('link', { name: `See more about ${project.title}` }).click();

      await expect(page).toHaveURL(new RegExp(`/work/${project.slug}(#\\w+)?$`));
      await expect(page.locator('h1')).toHaveText(project.title);
    });
  }

  test('the contact rows are real links', async ({ page }) => {
    await open(page, '/');
    const links = page.locator('#about .contact a');

    await expect(links.filter({ hasText: '@' })).toHaveAttribute(
      'href',
      'mailto:christian.ioan.szasz@gmail.com',
    );
    await expect(page.locator('#about .contact a[href*="linkedin.com"]')).toHaveCount(1);
    await expect(page.locator('#about .contact a[href*="github.com"]')).toHaveCount(1);
  });
});

test.describe('moving around the home page', () => {
  for (const lang of [Lang.English, Lang.German, Lang.Romanian]) {
    test(`the header takes the reader to each section (${lang})`, async ({ page }) => {
      await open(page, '/', lang);

      for (const section of [Section.Work, Section.Thinking, Section.About]) {
        const link = await headerLink(page, t(lang, `nav.${section}.label`));
        await link.click();

        await expect(page.locator(`#${section}`)).toBeInViewport();
      }
    });
  }

  test('the address and the nav marker name the section a header link went to', async ({
    page,
  }) => {
    await open(page, '/');

    for (const section of [Section.Work, Section.Thinking, Section.About]) {
      const link = await headerLink(page, t(Lang.English, `nav.${section}.label`));
      await link.click();

      await expect(page).toHaveURL(new RegExp(`#${section}$`), { timeout: 2_000 });
      await expect(await headerLink(page, t(Lang.English, `nav.${section}.label`))).toHaveClass(
        /is-current/,
        {
          timeout: 2_000,
        },
      );
    }
  });

  test('the hero buttons scroll to the work and to the reader', async ({ page }) => {
    await open(page, '/');

    await page.locator('.hero__actions .button--primary').click();
    await expect(page.locator('#work')).toBeInViewport();

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('.hero__actions .button--ghost').click();
    await expect(page.locator('#about')).toBeInViewport();
  });

  test('the address follows the section being read', async ({ page }) => {
    await open(page, '/');

    await page.locator('#thinking').scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 200);

    await expect(page).toHaveURL(/#thinking$/);
  });

  test('scrolling keeps the language in the address', async ({ page }) => {
    await open(page, '/', Lang.German);

    await page.locator('#about').scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 200);

    await expect(page).toHaveURL(/\/de-DE\/#about$/);
  });

  for (const section of [Section.Work, Section.Thinking, Section.About]) {
    test(`a link to /#${section} opens at that section`, async ({ page }) => {
      await open(page, `/#${section}`);

      await expect(page.locator(`#${section}`)).toBeInViewport();
      const top = await page
        .locator(`#${section}`)
        .evaluate((element) => element.getBoundingClientRect().top);
      expect(top, 'the heading clears the sticky header').toBeGreaterThanOrEqual(0);
    });
  }

  test('the brand mark returns to the top', async ({ page }) => {
    await open(page, '/');
    await (await headerLink(page, t(Lang.English, 'nav.about.label'))).click();
    await expect(page.locator('#about')).toBeInViewport();

    await page.locator('.brand').click();

    await expect(page.locator('#top')).toBeInViewport();
  });

  test('back to top scrolls up without leaving the page', async ({ page }) => {
    await open(page, '/');
    await page.locator('.site-footer').scrollIntoViewIfNeeded();
    expect(await scrollY(page)).toBeGreaterThan(0);

    await page.locator('.site-footer__link--top').click();

    await expect.poll(() => scrollY(page)).toBe(0);
    await expect(page).toHaveURL(/\/(#\w*)?$/);
  });

  test('the skip link is the first stop and lands on the content', async ({ page, isMobile }) => {
    test.skip(isMobile, 'No keyboard on a phone');
    await open(page, '/');

    await page.keyboard.press('Tab');
    const skip = page.locator('.skip-link');
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });
});

test.describe('the project carousel', () => {
  test('pages through the projects with its buttons and dots', async ({ page }) => {
    await open(page, '/');
    await page.locator('#work').scrollIntoViewIfNeeded();
    const carousel = page.locator('.carousel');
    const previous = carousel.getByRole('button', { name: /^Previous/ });
    const next = carousel.getByRole('button', { name: /^Next/ });
    const dots = carousel.locator('.carousel__dot');

    await expect(dots).toHaveCount(projects.length);
    await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true');
    await expect(previous).toBeDisabled();

    for (let index = 1; index < projects.length; index++) {
      await next.click();
      await expect(dots.nth(index)).toHaveAttribute('aria-current', 'true');
    }

    await expect(next).toBeDisabled();
    await expect(previous).toBeEnabled();

    await dots.nth(0).click();
    await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true');
    await expect(previous).toBeDisabled();

    await dots.nth(projects.length - 1).click();
    await expect(dots.nth(projects.length - 1)).toHaveAttribute('aria-current', 'true');
    await previous.click();
    await expect(dots.nth(projects.length - 2)).toHaveAttribute('aria-current', 'true');
  });

  test('scrolls with the keyboard once focused', async ({ page, isMobile }) => {
    test.skip(isMobile, 'No keyboard on a phone');
    await open(page, '/');
    const track = page.locator('.carousel__track');

    await track.focus();
    await page.keyboard.press('ArrowRight');

    await expect.poll(() => track.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  });

  test('names each dot for a screen reader', async ({ page }) => {
    await open(page, '/');

    for (let index = 0; index < projects.length; index++) {
      await expect(page.locator('.carousel__dot').nth(index)).toHaveAttribute(
        'aria-label',
        `Go to ${index + 1} of ${projects.length}`,
      );
    }
  });
});

test.describe('the header in every language', () => {
  for (const locale of locales) {
    test(`points its CV link at the ${locale.lang} CV`, async ({ page }) => {
      await open(page, '/', locale.lang);

      await expect(page.locator('.site-nav__link--cta')).toHaveAttribute(
        'href',
        `${locale.prefix}/cv`,
      );
    });
  }
});
