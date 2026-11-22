import { expect, test } from '@playwright/test';

test.describe('Gọn Tiệm, Sạch Phố — Kiểm thử trình duyệt (Điện thoại cầm dọc 390×844)', () => {
  test('mặc định ẩn nút Bot và nút Giảm hiệu ứng hoạt động tốt', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByTestId('btn-start-stage-1').click();

    await expect(page.getByTestId('btn-speed-toggle')).toBeVisible();
    await expect(page.getByTestId('btn-bot-toggle')).toHaveCount(0);

    const rmBtn = page.getByTestId('btn-reduce-motion');
    await expect(rmBtn).toBeVisible();
    const initialPressed = await rmBtn.getAttribute('aria-pressed');
    await rmBtn.click();
    const nextPressed = await rmBtn.getAttribute('aria-pressed');
    expect(nextPressed).not.toBe(initialPressed);
  });

  test('mở game trên điện thoại dọc (?bot=1) -> vào Tiệm Giày Hẻm Dốc -> chạm đặt món -> bật x2 & bot -> chạy hết 9 đợt và thắng, chụp ảnh dep_*_sau_*.png, không lỗi console, không gọi mạng ngoài', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const consoleErrors: string[] = [];
    const externalRequests: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    await page.route('**/*', async (route) => {
      const url = route.request().url();
      if (
        url.startsWith('http://127.0.0.1') ||
        url.startsWith('http://localhost') ||
        url.startsWith('data:') ||
        url.startsWith('blob:')
      ) {
        await route.continue();
      } else {
        externalRequests.push(url);
        await route.abort();
      }
    });

    await page.goto('/?bot=1');

    // 1. Màn hình chính hộp giày với tên chính thức
    const startBtn = page.getByTestId('btn-start-stage-1');
    await expect(startBtn).toBeVisible();
    await expect(page.locator('.td-title-heading')).toHaveText('Gọn Tiệm, Sạch Phố');
    await expect(page.locator('.td-stage-name').first()).toHaveText('Tiệm Giày Hẻm Dốc');
    await page.waitForTimeout(350);
    await page.screenshot({ path: 'docs/screenshots/dep_01_sau_title.png' });
    await page.screenshot({ path: 'docs/screenshots/td_01_title_portrait.png' });

    await startBtn.click();

    // 2. Đã vào Màn 1: HUD hiển thị 160 xu trong ví, 20/20 đôi giày, báo đợt 1 (Thủy & Thổ)
    const essenceVal = page.getByTestId('td-essence-val');
    const livesVal = page.getByTestId('td-lives-val');
    const upcomingBox = page.getByTestId('td-upcoming-box');
    await expect(essenceVal).toHaveText('160');
    await expect(livesVal).toHaveText('20/20');
    await expect(upcomingBox).toContainText('Thủy');
    await expect(upcomingBox).toContainText('Thổ');

    // 3. Chạm vào ô trống pad_1 trên bản đồ để mở bảng hộp giày chọn món
    const pad1Screen = await page.evaluate(() => {
      const scene = (
        window as unknown as {
          __TD_SCENE__?: { toScreen: (x: number, y: number) => { x: number; y: number } };
        }
      ).__TD_SCENE__;
      return scene ? scene.toScreen(112, 76) : { x: 120, y: 140 };
    });

    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: Math.round(pad1Screen.x), y: Math.round(pad1Screen.y) } });

    const buildSheet = page.getByTestId('td-build-sheet');
    await expect(buildSheet).toBeVisible();
    await expect(buildSheet).toContainText('Dép Tông');
    await expect(buildSheet).toContainText('Túi Hút Ẩm');
    await page.screenshot({ path: 'docs/screenshots/dep_02_sau_build.png' });
    await page.screenshot({ path: 'docs/screenshots/td_02_build_menu_portrait.png' });

    // Đặt Túi Hút Ẩm (Thổ — khắc Giọt Mưa Thủy ở Đợt 1)
    await page.getByTestId('build-fire_tower').click();
    await expect(buildSheet).toBeHidden();
    await expect(essenceVal).toHaveText('95');

    // 4. Bật tốc độ x2, gọi Đợt 1 và bật Bot tự động phối hợp món
    const speedBtn = page.getByTestId('btn-speed-toggle');
    await speedBtn.click();
    await expect(speedBtn).toHaveText('x2');

    await page.getByTestId('btn-call-wave').click();
    await page.getByTestId('btn-bot-toggle').click();

    await page.waitForTimeout(1900);
    await page.screenshot({ path: 'docs/screenshots/dep_03_sau_combat.png' });
    await page.screenshot({ path: 'docs/screenshots/td_03_combat_portrait.png' });

    // 5. Chạy hết 9 đợt bằng tickSimulation và kiểm tra thắng màn + hộp kết quả
    await page.evaluate(() => {
      const scene = (
        window as unknown as {
          __TD_SCENE__?: {
            engine: {
              status: string;
            };
            tickSimulation: (dt: number) => void;
          };
        }
      ).__TD_SCENE__;
      if (!scene) return;
      let guard = 0;
      while (scene.engine.status === 'playing' && guard < 25000) {
        scene.tickSimulation(0.05);
        guard += 1;
      }
    });

    const resultModal = page.getByTestId('td-result-modal');
    await expect(resultModal).toBeVisible();
    await expect(resultModal).toContainText('Giữ Tiệm Thành Công!');
    await page.waitForTimeout(950);
    await page.screenshot({ path: 'docs/screenshots/dep_04_sau_victory.png' });
    await page.screenshot({ path: 'docs/screenshots/td_04_victory_portrait.png' });

    expect(consoleErrors).toEqual([]);
    expect(externalRequests).toEqual([]);
  });
});
