import { expect, test } from '@playwright/test';

test.describe('Thủ Thành — Kiểm thử trình duyệt (Điện thoại cầm dọc 390×844)', () => {
  test('mở game trên điện thoại dọc -> vào Màn 1 -> chạm đặt quân -> bật tốc độ x2 & bot -> chạy hết 9 đợt và thắng, không lỗi console, không gọi mạng ngoài', async ({
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

    // Chặn tuyệt đối mọi yêu cầu ra ngoài localhost / 127.0.0.1
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

    await page.goto('/');

    // 1. Màn hình chính hiển thị tiêu đề và nút vào Màn 1
    const startBtn = page.getByTestId('btn-start-stage-1');
    await expect(startBtn).toBeVisible();
    await page.screenshot({ path: 'docs/screenshots/td_01_title_portrait.png' });

    await startBtn.click();

    // 2. Đã vào Màn 1: HUD hiển thị linh thạch, mạng thành, đợt và gợi ý hệ quái đợt sắp tới
    const essenceVal = page.getByTestId('td-essence-val');
    const livesVal = page.getByTestId('td-lives-val');
    const upcomingBox = page.getByTestId('td-upcoming-box');
    await expect(essenceVal).toHaveText('175');
    await expect(livesVal).toHaveText('20/20');
    await expect(upcomingBox).toContainText('Hệ Kim');

    // 3. Chạm vào ô trống đầu tiên (pad_1) trên bản đồ để mở bảng chọn quân
    const pad1Screen = await page.evaluate(() => {
      const scene = (window as unknown as { __TD_SCENE__?: { toScreen: (x: number, y: number) => { x: number; y: number } } }).__TD_SCENE__;
      return scene ? scene.toScreen(112, 76) : { x: 120, y: 140 };
    });

    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: Math.round(pad1Screen.x), y: Math.round(pad1Screen.y) } });

    const buildSheet = page.getByTestId('td-build-sheet');
    await expect(buildSheet).toBeVisible();
    await page.screenshot({ path: 'docs/screenshots/td_02_build_menu_portrait.png' });

    // Chọn đặt Quân Hỏa (Đánh lan, khắc hệ Kim của Đợt 1)
    await page.getByTestId('build-fire_tower').click();
    await expect(buildSheet).toBeHidden();
    await expect(essenceVal).toHaveText('110');

    // 4. Bật tốc độ x2, gọi Đợt 1 và bật Bot tự động phối hợp quân
    const speedBtn = page.getByTestId('btn-speed-toggle');
    await speedBtn.click();
    await expect(speedBtn).toHaveText('x2');

    await page.getByTestId('btn-call-wave').click();
    await page.getByTestId('btn-bot-toggle').click();

    // Chờ một chút cho quái xuất hiện và quân bắn để chụp ảnh chiến đấu dọc
    await page.waitForTimeout(1400);
    await page.screenshot({ path: 'docs/screenshots/td_03_combat_portrait.png' });

    // 5. Tăng tốc mô phỏng kết hợp x2 & Bot trong trình duyệt để chạy hết 9 đợt và kiểm tra thắng màn
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
        scene.tickSimulation(0.1);
        guard += 1;
      }
    });

    const resultModal = page.getByTestId('td-result-modal');
    await expect(resultModal).toBeVisible();
    await expect(resultModal).toContainText('Thủ Thành Thắng Lợi!');
    await page.screenshot({ path: 'docs/screenshots/td_04_victory_portrait.png' });

    expect(consoleErrors).toEqual([]);
    expect(externalRequests).toEqual([]);
  });
});
