import { test, expect } from '@playwright/test';
import { mockApi } from './mockApi';

/**
 * Every page, opened in a real browser on the production build: it must
 * render its content, throw nothing, not fall into the error boundary, and
 * not scroll sideways on a phone. Catches what unit tests of single
 * components cannot: a white screen, a lazy chunk that fails, a page too wide.
 */

/** `tab`: a tab to open first, for a view the page does not open on */
const PAGES: { path: string; tab?: { zh: string; en: string }; expect: { zh: string; en: string } }[] = [
  { path: '/', expect: { zh: '洛杉磯道奇', en: 'Los Angeles Dodgers' } },
  { path: '/teams/119', expect: { zh: '洛杉磯道奇', en: 'Los Angeles Dodgers' } },
  { path: '/teams/534', expect: { zh: 'Rochester', en: 'Rochester' } },
  { path: '/players/661531', expect: { zh: 'Brian Serven', en: 'Brian Serven' } },
  { path: '/players/661531', tab: { zh: '逐年成績', en: 'Years' }, expect: { zh: '2 隊', en: '2 teams' } },
  { path: '/leaders', expect: { zh: 'Aaron Judge', en: 'Aaron Judge' } },
  { path: '/games/776633', expect: { zh: 'Nathan Eovaldi', en: 'Nathan Eovaldi' } },
  { path: '/postseason/2025', expect: { zh: '洛杉磯道奇', en: 'Los Angeles Dodgers' } },
  { path: '/taiwan', expect: { zh: '李灝宇', en: 'Hao-Yu Lee' } },
  { path: '/compare?players=660271,592450', expect: { zh: 'Aaron Judge', en: 'Aaron Judge' } },
  { path: '/compare/teams?teams=119,140', expect: { zh: 'Corey Seager', en: 'Corey Seager' } },
  { path: '/transactions', expect: { zh: 'Traded Guy', en: 'Traded Guy' } },
  { path: '/awards?season=2025', expect: { zh: 'Aaron Judge', en: 'Aaron Judge' } },
  { path: '/awards/NLMVP', expect: { zh: '大谷翔平', en: 'Shohei Ohtani' } },
];

const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844, langs: ['zh', 'en'] as const },
  { name: 'desktop', width: 1280, height: 900, langs: ['zh'] as const },
];

for (const viewport of VIEWPORTS) {
  for (const lang of viewport.langs) {
    test.describe(`${viewport.name} ${lang}`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      for (const { path, tab, expect: text } of PAGES) {
        test(tab ? `${path} ${tab.en}` : path, async ({ page }) => {
          const errors: string[] = [];
          page.on('pageerror', (e) => errors.push(e.message));
          page.on('console', (m) => {
            // Blocked images and assets are expected; anything else is not
            if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text());
          });
          await page.addInitScript((l) => localStorage.setItem('plateview_lang', l), lang);
          await mockApi(page);

          await page.goto(`./#${path}`);
          if (tab) await page.getByRole('tab', { name: tab[lang] }).click();
          await expect(page.locator('main').getByText(text[lang]).first()).toBeVisible();
          await expect(page.getByRole('heading', { name: /這個頁面載入失敗|This page failed to load/ })).toHaveCount(0);

          // On failure, name the outermost elements past the right edge
          const { overflow, culprits } = await page.evaluate(() => {
            const width = window.innerWidth;
            const wide = [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > width + 0.5);
            const outermost = wide.filter((e) => !wide.includes(e.parentElement as Element));
            return {
              overflow: document.documentElement.scrollWidth - width,
              culprits: outermost.slice(0, 5).map((e) => {
                const r = e.getBoundingClientRect();
                return `<${e.tagName.toLowerCase()} class="${String(e.className).slice(0, 80)}"> right=${Math.round(r.right)} text="${(e.textContent ?? '').trim().slice(0, 40)}"`;
              }),
            };
          });
          expect(overflow, `page scrolls sideways:\n${culprits.join('\n')}`).toBeLessThanOrEqual(0);
          expect(errors).toEqual([]);
        });
      }
    });
  }
}
