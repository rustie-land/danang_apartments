import { test, expect } from '@playwright/test';

/* === STRICT design-system audit (Warm & Experiential Minimalist) ===
 * These tests ASSERT against the *intended* style guide.
 *   beige    #F5F0E8
 *   sand     #E8DCC8
 *   graphite #1A1A1A
 *   terracotta #D4A373
 *   radius 12-20px
 *
 * They are EXPECTED TO FAIL until the live site matches the guide.
 * Keep them in CI as a regression gate for the design handoff.
 */

test.describe('Design System Audit', () => {
  test('page background matches beige #F5F0E8', async ({ page }) => {
    await page.goto('/');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe('rgb(245, 240, 232)'); // #F5F0E8
  });

  test('terracotta accent matches #D4A373', async ({ page }) => {
    await page.goto('/');
    // VND toggle is the accent button — its bg should be #D4A373, not #C77B4E
    const vnd = await page.getByRole('button', { name: /^VND$/ });
    const bg = await vnd.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bg).toBe('rgb(212, 163, 115)'); // #D4A373
  });
});
