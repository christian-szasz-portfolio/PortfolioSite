import { type Locator, type Page } from '@playwright/test';

import { articleIds, projects } from './support/site';
import { dialog, expect, hasModal, open, test } from './support/fixtures';

/** The zoom a viewer reports, as a number of percent */
async function zoomLevel(viewer: Locator): Promise<number> {
  return Number.parseInt((await viewer.locator('.zoom__level').textContent()) ?? '', 10);
}

/** The zoom once the pop-up has finished opening and stopped refitting itself */
async function settledZoom(viewer: Locator): Promise<number> {
  let last = Number.NaN;

  await expect
    .poll(
      async () => {
        const now = await zoomLevel(viewer);
        const steady = now === last;
        last = now;
        return steady;
      },
      { intervals: [250] },
    )
    .toBe(true);

  return last;
}

/** Closes the open pop-up with Escape and checks the page lets go of it */
async function closeWithEscape(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toHaveCount(0);
  await expect.poll(() => hasModal(page)).toBe(false);
}

for (const [index, project] of projects.entries()) {
  test.describe(`/work/${project.slug}`, () => {
    test.beforeEach(async ({ page }) => {
      await open(page, `/work/${project.slug}`);
    });

    test('introduces the project', async ({ page }) => {
      await expect(page.locator('h1')).toHaveText(project.title);
      await expect(page.locator('.page-header__eyebrow')).toHaveText(`Project 0${index + 1}`);
      await expect(page.locator('.project-hero__reading')).toHaveText(/^\d+ minute read$/);
      await expect(
        page.locator('.project-hero .chip-list li, .project-hero lpg-chip-list li').first(),
      ).toBeVisible();
      await expect(page.locator('.specs__row').first()).toBeVisible();

      if (project.repository === null) {
        await expect(page.locator('.project-hero .link--repo')).toHaveCount(0);
        await expect(page.locator('.project-hero .link--note')).toBeVisible();
      } else {
        const repo = page.locator('.project-hero .link--repo');
        await expect(repo).toHaveAttribute('href', project.repository);
        await expect(repo).toHaveText(
          project.demo ? 'View the demo repository' : 'View the repository',
        );
      }

      // A live instance is only ever a demo, and the link says so
      await expect(page.locator('.project-hero .link--demo')).toHaveText(
        project.demo ? ['Open the live demo'] : [],
      );
    });

    test('breadcrumbs lead back to the work on the home page', async ({ page }) => {
      const crumbs = page.locator('.crumbs');

      await expect(crumbs.locator('[aria-current="page"]')).toHaveText(project.title);
      await crumbs.getByRole('link', { name: 'Work' }).click();

      await expect(page).toHaveURL(/\/#work$/);
      await expect(page.locator('#work')).toBeInViewport();
    });

    test('breadcrumbs lead home', async ({ page }) => {
      await page.locator('.crumbs').getByRole('link', { name: 'Home' }).click();

      await expect(page).toHaveURL(/\/(#\w+)?$/);
      await expect(page.locator('#top')).toBeAttached();
    });

    test('the contents list every article and jump to each', async ({ page, isMobile }) => {
      const links = page.locator('.toc__link');
      const articles = page.locator('article.article');
      await expect(links).toHaveCount(articleIds.length);
      await expect(articles).toHaveCount(articleIds.length);

      // One column leaves no room beside the articles, so a phone reads them in order instead
      if (isMobile) {
        await expect(page.locator('.project-page__contents')).toBeHidden();
        expect(await articles.evaluateAll((all) => all.map((article) => article.id))).toEqual([
          ...articleIds,
        ]);
        return;
      }

      for (const id of [...articleIds].reverse()) {
        await page.locator(`.toc__link[href$="#${id}"]`).click();

        await expect(page).toHaveURL(new RegExp(`#${id}$`));
        await expect(page.locator(`article#${id} .article__heading`)).toBeInViewport();
      }
    });

    test('the contents mark the article being read', async ({ page, isMobile }) => {
      if (isMobile) {
        // Nothing to click on a phone, so the reader scrolls there; the address follows them
        await page
          .locator('article#testing .article__heading')
          .evaluate((heading) => heading.scrollIntoView({ block: 'start', behavior: 'instant' }));
        await expect(page).toHaveURL(/#testing$/);
      } else {
        await page.locator('.toc__link[href$="#testing"]').click();
      }

      await expect(page.locator('.toc__link[href$="#testing"]')).toHaveAttribute(
        'aria-current',
        'true',
      );
      await expect(page.locator('.toc__link[aria-current="true"]')).toHaveCount(1);
    });

    test('each heading links to itself', async ({ page }) => {
      const anchor = page.locator('article#domain .article__anchor');

      await expect(anchor).toHaveAccessibleName('Link to this section');
      await anchor.click();

      await expect(page).toHaveURL(new RegExp(`/work/${project.slug}#domain$`));
    });

    test('the pager leads to the neighbouring projects', async ({ page }) => {
      const previous = projects[index - 1];
      const next = projects[index + 1];
      const pager = page.locator('.pager');

      await expect(pager.locator('.pager__link--previous')).toHaveCount(
        previous === undefined ? 0 : 1,
      );
      await expect(pager.locator('.pager__link--next')).toHaveCount(next === undefined ? 0 : 1);

      const target = next ?? previous;
      if (target === undefined) {
        return;
      }

      await pager
        .locator(next === undefined ? '.pager__link--previous' : '.pager__link--next')
        .click();

      await expect(page).toHaveURL(new RegExp(`/work/${target.slug}$`));
      await expect(page.locator('.crumbs [aria-current="page"]')).toHaveText(target.title);
      await expect(page).toHaveTitle(new RegExp(`^${target.title} `));
      await expect
        .poll(() => page.evaluate(() => window.scrollY), { message: 'opens at the top' })
        .toBeLessThan(50);
    });

    test('the heading follows the pager to the next project', async ({ page }) => {
      const target = projects[index + 1] ?? projects[index - 1];
      if (target === undefined) {
        return;
      }

      await page.locator('.pager__link').last().click();
      await expect(page).toHaveURL(new RegExp(`/work/${target.slug}$`));

      await expect(page.locator('h1')).toHaveText(target.title, { timeout: 2_000 });
    });

    test('the screenshot opens larger and closes again', async ({ page }) => {
      const frame = page.locator('.project-hero .media');
      const label = (await frame.locator('.media__path').textContent())?.trim() ?? '';

      await frame.getByRole('button', { name: 'View larger' }).click();

      const viewer = dialog(page);
      await expect(viewer).toBeVisible();
      await expect(viewer.getByRole('heading')).toHaveText(label);
      await expect(viewer.locator('.viewer__image')).toHaveJSProperty('complete', true);
      expect(await hasModal(page)).toBe(true);

      await viewer.locator('.modal__close').click();
      await expect(viewer).toHaveCount(0);
      await expect.poll(() => hasModal(page)).toBe(false);
    });

    if (project.clip) {
      test('the clip plays and pauses in the page and in the viewer', async ({ page }) => {
        const toggle = page.locator('.project-hero .media .play-toggle');
        const flipped = (pressed: string | null): string => (pressed === 'true' ? 'false' : 'true');

        // It starts itself where motion is welcome and waits where it is not
        const initial = await toggle.getAttribute('aria-pressed');
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-pressed', flipped(initial));
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-pressed', initial ?? 'false');

        await page.locator('.project-hero .media__expand').click();
        const inViewer = dialog(page).locator('.play-toggle');
        const viewerInitial = await inViewer.getAttribute('aria-pressed');
        await inViewer.click();
        await expect(inViewer).toHaveAttribute('aria-pressed', flipped(viewerInitial));

        await closeWithEscape(page);
      });
    } else {
      test('shows the poster alone, with nothing to play', async ({ page }) => {
        await expect(page.locator('.project-hero .media img')).toBeVisible();
        await expect(page.locator('.project-hero .media .play-toggle')).toHaveCount(0);
      });
    }

    if (project.figures > 0) {
      test('every diagram opens in a zoomable viewer', async ({ page }) => {
        const figures = page.locator('.figure__frame');
        await expect(figures).toHaveCount(project.figures);

        for (let figure = 0; figure < project.figures; figure++) {
          const caption =
            (await page.locator('.figure__caption').nth(figure).textContent())?.trim() ?? '';
          await figures.nth(figure).click();

          const viewer = dialog(page);
          await expect(viewer.getByRole('heading')).toHaveText(caption);
          await expect(viewer.locator('.diagram__image')).toHaveJSProperty('complete', true);
          expect(
            await viewer
              .locator('.diagram__image')
              .evaluate((image: HTMLImageElement) => image.naturalWidth),
          ).toBeGreaterThan(0);

          await closeWithEscape(page);
        }
      });

      test('the diagram viewer zooms by button, key and wheel, and pans by dragging', async ({
        page,
        isMobile,
      }) => {
        await page.locator('.figure__frame').first().click();
        const viewer = dialog(page);
        const fitted = await settledZoom(viewer);

        await viewer.getByRole('button', { name: 'Zoom in' }).click();
        await expect.poll(() => zoomLevel(viewer)).toBeGreaterThan(fitted);

        await viewer.getByRole('button', { name: 'Zoom out' }).click();
        await viewer.getByRole('button', { name: 'Zoom out' }).click();
        await expect.poll(() => zoomLevel(viewer)).toBeLessThan(fitted);

        await viewer.getByRole('button', { name: 'Fit' }).click();
        await expect.poll(() => zoomLevel(viewer)).toBe(fitted);

        test.skip(isMobile, 'Keys and a wheel are desktop input');

        await page.keyboard.press('+');
        await page.keyboard.press('+');
        await expect.poll(() => zoomLevel(viewer)).toBeGreaterThan(fitted);

        await page.keyboard.press('0');
        await expect.poll(() => zoomLevel(viewer)).toBe(fitted);

        const surface = viewer.locator('.diagram');
        const box = await surface.boundingBox();
        if (box === null) {
          throw new Error('The diagram has no box');
        }

        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.keyboard.down('Control');
        await page.mouse.wheel(0, -300);
        await page.keyboard.up('Control');
        await expect.poll(() => zoomLevel(viewer)).toBeGreaterThan(fitted);

        for (let press = 0; press < 6; press++) {
          await page.keyboard.press('+');
        }
        const before = await surface.evaluate((element) => [element.scrollLeft, element.scrollTop]);
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 - 150, box.y + box.height / 2 - 100, {
          steps: 8,
        });
        await page.mouse.up();
        const after = await surface.evaluate((element) => [element.scrollLeft, element.scrollTop]);

        expect(after, 'dragging moved the drawing').not.toEqual(before);
      });
    }

    if (project.codeBlocks > 0) {
      test('a code block copies its source', async ({ page, context, browserName }) => {
        test.skip(browserName !== 'chromium', 'Clipboard permissions are a Chromium feature here');
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);

        const block = page.locator('.code').first();
        const source = (await block.locator('.code__source').textContent()) ?? '';
        const button = block.locator('.copy');

        await expect(button).toHaveText(/Copy/);
        await button.click();

        await expect(button).toHaveText(/Copied/);
        await expect(button).toHaveClass(/is-copied/);
        await expect(block.locator('[role="status"]')).not.toBeEmpty();
        const copied = await page.evaluate(() => navigator.clipboard.readText());
        // The Windows clipboard hands text back with CRLF
        expect(copied.replace(/\r\n/g, '\n')).toBe(source);
      });
    }
  });

  test(`a link into /work/${project.slug} opens at that article`, async ({ page }) => {
    await open(page, `/work/${project.slug}#testing`);

    await expect(page.locator('article#testing .article__heading')).toBeInViewport();
    await expect(page).toHaveURL(/#testing$/);
  });
}
