// @ts-check
const { test, expect } = require('@playwright/test');

const SAVE_KEYS = ['pennantChase_v2', 'baseballManagerSave_v1'];

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate((keys) => {
    keys.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch (_) {}
    });
  }, SAVE_KEYS);
  await page.reload({ waitUntil: 'networkidle' });
});

test('loads splash and can reach team picker', async ({ page }) => {
  await expect(page.locator('#onboarding')).toBeVisible();
  await expect(page.locator('.splash-title')).toContainText('Pennant Chase');
  await page.locator('#ob-s1').click();
  await expect(page.getByRole('heading', { name: 'Choose your club' })).toBeVisible();
  await expect(page.locator('.team-card').first()).toBeVisible();
});

test('full new career flow reaches clubhouse and core UI', async ({ page }) => {
  await page.locator('#ob-s1').click();
  await page.locator('.team-card').nth(3).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('[data-dif="1"]').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Open clubhouse' }).click();

  await expect(page.locator('#app')).not.toHaveClass(/hidden/);
  await expect(page.locator('#onboarding')).toHaveClass(/hidden/);
  await expect(page.locator('#main')).toBeVisible();
  await expect(page.locator('#main .panel').first()).toBeVisible();
  await expect(page.locator('#team-banner')).toContainText(/\d+-\d+/);
});

test('sidebar navigation switches main content', async ({ page }) => {
  await page.locator('#ob-s1').click();
  await page.locator('.team-card').first().click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('[data-dif="1"]').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Open clubhouse' }).click();

  await page.locator('[data-nav="roster"]').click();
  await expect(page.locator('#main')).toContainText('Position players');

  await page.locator('[data-nav="standings"]').click();
  await expect(page.locator('#main')).toContainText('Division');

  await page.locator('[data-nav="settings"]').click();
  await expect(page.locator('#main h2')).toContainText('Settings');
});

test('sim day advances season from home', async ({ page }) => {
  await page.locator('#ob-s1').click();
  await page.locator('.team-card').first().click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('[data-dif="1"]').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Open clubhouse' }).click();

  const dayLine = page.locator('#main').getByText(/Day \d+ of 162/);
  const before = await dayLine.first().textContent();
  await page.locator('#sim1').click();
  const after = await dayLine.first().textContent();
  expect(before).not.toEqual(after);
});

test('player search modal opens from sidebar', async ({ page }) => {
  await page.locator('#ob-s1').click();
  await page.locator('.team-card').first().click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('[data-dif="1"]').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Open clubhouse' }).click();

  const search = page.locator('#player-search');
  await search.fill('jo');
  await search.press('Enter');
  await expect(page.locator('#modal-bg')).toHaveClass(/show/);
  await expect(page.locator('#modal h3')).toContainText('Player search');
});

test('schedule list and calendar toggle', async ({ page }) => {
  await page.locator('#ob-s1').click();
  await page.locator('.team-card').first().click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('[data-dif="1"]').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Open clubhouse' }).click();

  await page.locator('[data-nav="schedule"]').click();
  await page.locator('#sv-list').click();
  await expect(page.locator('#main')).toContainText(/Your schedule · list/i);
  await page.locator('#sv-cal').click();
  await expect(page.locator('#main')).toContainText(/Your schedule · calendar/i);
  await expect(page.locator('.cal-grid')).toBeVisible();
});

test('standings view toggles highlight active control', async ({ page }) => {
  await page.locator('#ob-s1').click();
  await page.locator('.team-card').first().click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('[data-dif="1"]').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Open clubhouse' }).click();

  await page.locator('[data-nav="standings"]').click();
  await expect(page.locator('#st-div.is-on')).toBeVisible();
  await page.locator('#st-ov').click();
  await expect(page.locator('#st-ov.is-on')).toBeVisible();
  await page.locator('#st-wc').click();
  await expect(page.locator('#st-wc.is-on')).toBeVisible();
});

test('legacy baseball-manager.html redirects to index', async ({ page }) => {
  await page.goto('/baseball-manager.html');
  await page.waitForURL(/index\.html$/);
  await expect(page).toHaveURL(/index\.html/);
  await expect(page.locator('#onboarding')).toBeVisible();
});

test('no console errors on cold boot', async ({ page }) => {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('/index.html');
  await page.waitForTimeout(600);
  expect(errors, errors.join('\n')).toEqual([]);
});

async function startCareer(page) {
  await page.locator('#ob-s1').click();
  await page.locator('.team-card').first().click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('[data-dif="1"]').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Open clubhouse' }).click();
}

test('key sections render without errors after navigation', async ({ page }) => {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await startCareer(page);
  const sections = ['leaders', 'prospects', 'finances', 'fa', 'intl', 'draft', 'trades', 'news', 'postseason'];
  for (const id of sections) {
    await page.locator(`[data-nav="${id}"]`).click();
    await expect(page.locator('#main .panel').first()).toBeVisible();
  }
  expect(errors, errors.join('\n')).toEqual([]);
});

test('multiple sim days keep UI consistent', async ({ page }) => {
  await startCareer(page);
  for (let i = 0; i < 5; i++) await page.locator('#sim1').click();
  await expect(page.locator('#main')).toContainText('Day ');
  await expect(page.locator('#team-banner')).toContainText(/\d+-\d+/);
});
