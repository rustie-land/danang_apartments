import { test, expect } from '@playwright/test';

/* === REAL design tokens (as rendered on https://danang-apartments.vercel.app) ===
 * page bg   #FCFAF7  (rgb 253,251,247)  — светлее чем style-guide #F5F0E8
 * text      #1A1A1A  (rgb 26,26,26)     — graphite  ✓ matches guide
 * accent    #C77B4E  (rgb 199,123,78)   — VND toggle bg; НЕ #D4A373 из guide
 * card radius 16px   — ✓ в диапазоне 12-20
 * NOTE: see design.spec.ts for strict style-guide assertions (these intentionally FAIL today).
 */

test.describe('Homepage — smoke', () => {
  test('loads with correct title and H1', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Asia Stays/i);
    await expect(page.locator('h1')).toHaveText(/Apartments for rent across Asia/i);
    await page.screenshot({ path: 'e2e/screenshots/00-homepage.png', fullPage: true });
  });

  test('main navigation links present', async ({ page }) => {
    await page.goto('/');
    // Mobile: open hamburger menu if nav links not directly visible
    try {
      await expect(page.getByRole('link', { name: /about/i })).toBeVisible({ timeout: 3000 });
    } catch {
      await page.getByRole('button', { name: /menu|open menu/i }).click();
    }
    await expect(page.getByRole('link', { name: /about/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /faq/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /contacts/i })).toBeVisible();
  });
});

test.describe('Design (live values)', () => {
  test('page background is rendered', async ({ page }) => {
    await page.goto('/');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe('rgb(253, 251, 247)'); // #FCFAF7
  });

  test('primary text is graphite #1A1A1A', async ({ page }) => {
    await page.goto('/');
    const color = await page.evaluate(() => getComputedStyle(document.body).color);
    expect(color).toBe('rgb(26, 26, 26)'); // #1A1A1A ✓
  });

  test('active currency toggle uses accent bg', async ({ page }) => {
    await page.goto('/');
    const vnd = await page.getByRole('button', { name: /^VND$/ });
    const bg = await vnd.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bg).toBe('rgb(199, 123, 78)'); // #C77B4E — terracotta accent
  });

  test('cards have rounded corners (>= 12px)', async ({ page }) => {
    await page.goto('/');
    // scroll to ensure lazy 'How it works' cards are in viewport
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);
    const radii = await page.locator('section > div > div, [class*="card"]').evaluateAll(els =>
      els.slice(0, 20).map(e => parseFloat(getComputedStyle(e).borderRadius)).filter(r => !isNaN(r) && r > 0)
    );
    expect(radii.length).toBeGreaterThan(0);
    expect(Math.max(...radii)).toBeGreaterThanOrEqual(12);
  });
});

test.describe('Search filters', () => {
  test('search bar shows city, currency, and CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Da Nang, VN').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^VND$/ })).toBeVisible();
    // CTA button
    await expect(page.getByRole('button', { name: /find rentals/i })).toBeVisible();
  });

  test('Find rentals CTA is clickable and triggers results', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByRole('button', { name: /find rentals/i });
    await expect(cta).toBeVisible({ timeout: 10000 });
    await cta.click();
    // Desktop -> map renders; Mobile -> list renders (map toggled via bottom toggle).
    // Accept EITHER outcome as a sign the search submitted successfully.
    const isDesktop = page.viewportSize()!.width > 768;
    const target = isDesktop
      ? '.leaflet-container, .leaflet-map-container, canvas'
      : '.results-list-pane, .property-card, [class*="card"]';
    await page.waitForSelector(target, { timeout: 15000 });
    await expect(page.locator(target)).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/02-after-find.png' });
  });
});

test.describe('404', () => {
  test('nonexistent route does not show homepage H1', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-12345');
    const hasH1 = await page.locator('h1').getByText(/Apartments for rent/i).count();
    expect(hasH1).toBe(0);
  });
});
