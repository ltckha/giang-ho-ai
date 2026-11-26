import { expect, test } from '@playwright/test';

// Bản quốc tế "Little Shops of Dalat" (src/game/i18n.ts, docs/QUOC_TE.md)
test('Bản tiếng Anh: ?lang=en ra tên Little Shops of Dalat, nút VI đổi về tiếng Việt', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lang=en');
  await expect(page.locator('.td-title-heading')).toHaveText('Little Shops of Dalat');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByTestId('btn-start-stage-1')).toBeVisible();
  await expect(page.locator('.td-stage-name').first()).toHaveText('Slope Alley Shoe Shop');
  await page.getByTestId('btn-lang').click();
  await expect(page.locator('.td-title-heading')).toHaveText('Gọn Phố');
  await expect(page.getByTestId('btn-lang')).toHaveText('EN');
});
