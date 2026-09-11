import { expect, test } from '@playwright/test';

test('does not load InsightFlare in Vite development mode', async ({ page }) => {
  const analyticsRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('insightflare.ravelloh.top/script.js')) {
      analyticsRequests.push(request.url());
    }
  });

  await page.goto('/', { waitUntil: 'commit' });
  await page.waitForTimeout(500);

  expect(analyticsRequests).toEqual([]);
  expect(await page.evaluate(() => 'insightflare' in window)).toBe(false);
});

test('loads the static SPA and preserves the add-timer hash flow', async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(`[pageerror] ${error.message}`));
  page.on('console', (message) => {
    // External analytics/font endpoints may be unavailable in an isolated CI
    // browser; assert application runtime errors without making that network
    // availability a functional requirement.
    if (message.type() === 'error' && !message.text().includes('Failed to load resource')) {
      runtimeErrors.push(`[console.error] ${message.text()}`);
    }
  });
  await page.goto('/', { waitUntil: 'commit' });
  await expect(page.getByRole('heading', { name: 'TimePulse', exact: true })).toBeVisible({ timeout: 25_000 });
  await expect(page).toHaveTitle('TimePulse - 现代化倒计时');

  await page.locator('[data-insightflare-event="timer_create_open"]').first().click();
  await expect(page).toHaveURL(/#add$/);
  const timerTypeHeading = page.getByRole('heading', { name: '选择计时器类型' });
  await expect(timerTypeHeading).toBeVisible();
  const timerTypeBox = await timerTypeHeading.boundingBox();
  const viewport = page.viewportSize();
  expect(timerTypeBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(timerTypeBox!.y).toBeGreaterThan(0);
  expect(timerTypeBox!.y + timerTypeBox!.height).toBeLessThan(viewport!.height);
  await expect(page.getByRole('button', { name: /倒计时/ })).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test('opens the migrated background, sharing, and sync flows', async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(`[pageerror] ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource')) {
      runtimeErrors.push(`[console.error] ${message.text()}`);
    }
  });

  await page.goto('/', { waitUntil: 'commit' });
  await expect(page.getByRole('heading', { name: 'TimePulse', exact: true })).toBeVisible({ timeout: 25_000 });
  await page.locator('[data-insightflare-event="background_open"]').first().click();
  await expect(page.getByRole('heading', { name: '背景设置' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const element = document.elementFromPoint(10, 40);
    return typeof element?.className === 'string' ? element.className : '';
  })).toContain('bg-black/50');

  await page.goto('/', { waitUntil: 'commit' });
  await page.locator('[data-insightflare-event="share_open"]').first().click();
  await expect(page.getByRole('heading', { name: '分享计时器' })).toBeVisible();

  await page.goto('/', { waitUntil: 'commit' });
  await page.locator('[data-insightflare-event="login_open"]').first().click();
  await expect(page.getByRole('heading', { name: '数据同步' })).toBeVisible();

  expect(runtimeErrors).toEqual([]);
});

test('animates theme changes and switches to the footer card with discrete wheel navigation', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Discrete wheel navigation is covered by the Chromium mouse input path.');

  await page.goto('/', { waitUntil: 'commit' });
  await expect(page.getByRole('heading', { name: 'TimePulse', exact: true })).toBeVisible({ timeout: 25_000 });

  const pageScrollState = () => page.evaluate(() => {
    const scrollingElement = document.scrollingElement;
    const documentHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body?.scrollHeight ?? 0,
    );
    const viewportHeight = window.innerHeight;
    const rootOverflow = [
      getComputedStyle(document.documentElement).overflowY,
      getComputedStyle(document.body).overflowY,
    ];
    const rootCanScroll = Boolean(scrollingElement)
      && scrollingElement!.scrollHeight > scrollingElement!.clientHeight
      && !rootOverflow.some((value) => value === 'hidden' || value === 'clip');

    return {
      hash: window.location.hash,
      scrollTop: scrollingElement?.scrollTop ?? -1,
      documentHeight,
      viewportHeight,
      rootCanScroll,
    };
  });

  const expectPageScrollLocked = async () => {
    await expect.poll(async () => (await pageScrollState()).scrollTop).toBe(0);
    const state = await pageScrollState();
    expect(state.documentHeight <= state.viewportHeight || !state.rootCanScroll).toBe(true);
  };

  await expectPageScrollLocked();

  const themeToggle = page.locator('[data-insightflare-event="theme_toggle"]').first();
  await themeToggle.click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(18, 18, 18)');

  await themeToggle.click();
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(255, 255, 255)');
  await expectPageScrollLocked();

  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  await page.mouse.move(5, viewport!.height / 2);

  // Keep the first wheel event below the transition threshold so the page
  // switch is driven by accumulated input rather than continuous scrolling.
  const wheelStep = 40;
  const wheelThresholdCrossing = 50;
  await page.mouse.wheel(0, wheelStep);
  await page.waitForTimeout(50);
  const afterFirstDownWheel = await pageScrollState();
  expect(afterFirstDownWheel.hash).toBe('');
  expect(afterFirstDownWheel.scrollTop).toBe(0);
  expect(afterFirstDownWheel.documentHeight <= afterFirstDownWheel.viewportHeight || !afterFirstDownWheel.rootCanScroll).toBe(true);

  await page.mouse.wheel(0, wheelThresholdCrossing);
  await expectPageScrollLocked();

  await expect(page).toHaveURL(/#footer$/);
  const about = page.getByText('关于 TimePulse', { exact: true });
  await expect(about).toBeVisible();
  await expect(page.getByText('使用 Vite 和 Framer Motion 构建')).toBeVisible();
  await page.waitForTimeout(500);
  await expect(about).toBeVisible();

  await page.mouse.wheel(0, -wheelStep);
  await page.waitForTimeout(50);
  const afterFirstUpWheel = await pageScrollState();
  expect(afterFirstUpWheel.hash).toBe('#footer');
  expect(afterFirstUpWheel.scrollTop).toBe(0);
  expect(afterFirstUpWheel.documentHeight <= afterFirstUpWheel.viewportHeight || !afterFirstUpWheel.rootCanScroll).toBe(true);

  await page.mouse.wheel(0, -wheelThresholdCrossing);
  await expectPageScrollLocked();

  await page.waitForTimeout(650);
  await expect(page).toHaveURL(/\/$/);
});

test('does not leave notification or modal backdrops mounted while closed', async ({ page }) => {
  await page.goto('/', { waitUntil: 'commit' });
  await expect(page.getByRole('heading', { name: 'TimePulse', exact: true })).toBeVisible({ timeout: 25_000 });

  const backdropCount = () => page.evaluate(() => [...document.querySelectorAll('div')].filter((element) => {
    const classes = typeof element.className === 'string' ? element.className.split(/\s+/) : [];
    return classes.includes('fixed') && classes.includes('inset-0') && classes.includes('bg-black/50');
  }).length);

  await expect.poll(backdropCount).toBe(0);

  await page.locator('[data-insightflare-event="timer_create_open"]').first().click();
  await expect(page.getByRole('heading', { name: '选择计时器类型' })).toBeVisible();
  await expect.poll(backdropCount).toBe(1);

  await page.getByRole('button', { name: '取消' }).last().click();
  await expect.poll(backdropCount).toBe(0);
});
