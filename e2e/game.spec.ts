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

  test('ô Màn 2 bị khoá cho tới khi qua Màn 1, nhưng ?stage=2 hoặc bản lưu unlockedStage=2 mở được', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const s2Btn = page.getByTestId('btn-start-stage-2');
    await expect(s2Btn).toBeVisible();
    await expect(s2Btn).toBeDisabled();
    await expect(page.getByTestId('stage2-stars')).toContainText('Khóa');
    await page.screenshot({ path: 'docs/screenshots/man2_00_title_locked.png' });

    // ?stage=2 cho phép mở thử ngay dù chưa qua Màn 1
    await page.goto('/?stage=2');
    await expect(page.getByTestId('btn-start-stage-2')).toBeEnabled();

    // Khi bản lưu đã qua Màn 1 (unlockedStage = 2), vào / bình thường cũng mở được Màn 2
    await page.evaluate(() => {
      window.localStorage.setItem(
        'giang_ho_ai_thu_thanh_save_v1',
        JSON.stringify({
          version: 1,
          unlockedStage: 2,
          starsByStage: { stage_1: 3 },
          bestLivesByStage: { stage_1: 18 },
          updatedAt: Date.now(),
        }),
      );
    });
    await page.goto('/');
    await expect(page.getByTestId('btn-start-stage-2')).toBeEnabled();
    await expect(page.getByTestId('btn-start-stage-2')).toContainText('Mở Cửa Tiệm Bánh');
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
    await page.screenshot({ path: 'docs/screenshots/man1v2_01_sau_title.png' });
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
    await page.screenshot({ path: 'docs/screenshots/man1v2_02_sau_build.png' });
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
    await page.screenshot({ path: 'docs/screenshots/man1v2_03_sau_combat.png' });
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
    const dropsBox = page.getByTestId('td-result-drops');
    await expect(dropsBox).toBeVisible();
    await expect(dropsBox).toHaveClass(/chest-opened/);
    await expect(dropsBox.locator('.td-drop-card').first()).toBeVisible();
    await page.screenshot({ path: 'docs/screenshots/man1v2_04_sau_victory.png' });
    await page.screenshot({ path: 'docs/screenshots/td_04_victory_portrait.png' });
    await page.screenshot({ path: 'docs/screenshots/gear_04_victory_drops.png' });

    expect(consoleErrors).toEqual([]);
    expect(externalRequests).toEqual([]);
  });

  test('Màn 2 Tiệm Bánh Đầu Phố (?bot=1): đặt 5 món tiệm bánh, đường sáng tương sinh (+15% & chạm xem giải thích), thắng 10 đợt và chụp ảnh man2_*.png', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const consoleErrors: string[] = [];
    const externalRequests: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
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
    const startStage2 = page.getByTestId('btn-start-stage-2');
    await expect(startStage2).toBeEnabled();
    await startStage2.click();

    // 1. HUD Màn 2: 170 xu, 20/20 ổ bánh, 0/10 đợt, báo Đợt 1 (Thủy & Thổ)
    const essenceVal = page.getByTestId('td-essence-val');
    const livesVal = page.getByTestId('td-lives-val');
    const waveVal = page.getByTestId('td-wave-val');
    const upcomingBox = page.getByTestId('td-upcoming-box');
    await expect(essenceVal).toHaveText('170');
    await expect(livesVal).toHaveText('20/20');
    await expect(waveVal).toHaveText('0/10');
    await expect(upcomingBox).toContainText('Thủy');
    await expect(upcomingBox).toContainText('Thổ');

    // 2. Chạm ô pad_5 (240, 205) trong quầy bánh -> mở bảng chọn 5 món tiệm bánh
    const canvas = page.locator('canvas');
    const pad5Screen = await page.evaluate(() => {
      const s = (window as unknown as { __TD_SCENE__?: { toScreen: (x: number, y: number) => { x: number; y: number } } }).__TD_SCENE__;
      return s ? s.toScreen(240, 205) : { x: 240, y: 260 };
    });
    await canvas.click({ position: { x: Math.round(pad5Screen.x), y: Math.round(pad5Screen.y) } });

    const buildSheet = page.getByTestId('td-build-sheet');
    await expect(buildSheet).toBeVisible();
    await expect(buildSheet).toContainText('Vỉ Đập Ruồi');
    await expect(buildSheet).toContainText('Hũ Sành Kín');
    await expect(buildSheet).toContainText('Quạt Điện');
    await expect(buildSheet).toContainText('Lò Nướng');
    await expect(buildSheet).toContainText('Tủ Mát');
    await page.screenshot({ path: 'docs/screenshots/man2_01_build_menu.png' });

    // Đặt Quạt Điện (Mộc, 60 xu) vào pad_5
    await page.getByTestId('build-bk_fan').click();
    await expect(essenceVal).toHaveText('110');

    // Đặt Lò Nướng (Hỏa, 65 xu) vào pad_6 (180, 250) ngay cạnh pad_5 -> kích hoạt tương sinh Mộc sinh Hỏa!
    const pad6Screen = await page.evaluate(() => {
      const s = (window as unknown as { __TD_SCENE__?: { toScreen: (x: number, y: number) => { x: number; y: number } } }).__TD_SCENE__;
      return s ? s.toScreen(180, 250) : { x: 180, y: 310 };
    });
    await canvas.click({ position: { x: Math.round(pad6Screen.x), y: Math.round(pad6Screen.y) } });
    await page.getByTestId('build-bk_oven').click();
    await expect(essenceVal).toHaveText('45');
    await page.waitForTimeout(250);

    // 3. Kiểm tra đường sáng tương sinh nối pad_5 -> pad_6 và chạm vào giữa đường để mở câu giải thích
    const linkMid = await page.evaluate(() => {
      const s = (
        window as unknown as {
          __TD_SCENE__?: {
            getActiveSynergyLinks: () => Array<{
              key: string;
              midScreen: { x: number; y: number };
            }>;
          };
        }
      ).__TD_SCENE__;
      const links = s?.getActiveSynergyLinks() ?? [];
      return links[0]?.midScreen ?? null;
    });
    expect(linkMid).not.toBeNull();
    await canvas.click({ position: { x: Math.round(linkMid!.x), y: Math.round(linkMid!.y) } });

    const synergyTip = page.getByTestId('td-synergy-tooltip');
    await expect(synergyTip).toBeVisible();
    await expect(synergyTip).toContainText('Gió thổi lửa to hơn — Mộc sinh Hỏa');
    await page.screenshot({ path: 'docs/screenshots/man2_02_synergy_tooltip.png' });

    // Đóng chú thích, bật x2, gọi Đợt 1 & bật Bot tự phối hợp món Màn 2
    await page.locator('#btn-close-synergy').click();
    await expect(synergyTip).toHaveCount(0);

    await page.getByTestId('btn-speed-toggle').click();
    await page.getByTestId('btn-call-wave').click();
    await page.getByTestId('btn-bot-toggle').click();

    await page.waitForTimeout(2600);
    await page.screenshot({ path: 'docs/screenshots/man2_03_combat.png' });

    // 4. Chạy hết 10 đợt bằng tickSimulation và kiểm tra thắng Màn 2
    await page.evaluate(() => {
      const scene = (
        window as unknown as {
          __TD_SCENE__?: {
            engine: { status: string };
            tickSimulation: (dt: number) => void;
          };
        }
      ).__TD_SCENE__;
      if (!scene) return;
      let guard = 0;
      while (scene.engine.status === 'playing' && guard < 35000) {
        scene.tickSimulation(0.05);
        guard += 1;
      }
    });

    const resultModal = page.getByTestId('td-result-modal');
    await expect(resultModal).toBeVisible();
    await expect(resultModal).toContainText('Giữ Tiệm Thành Công!');
    await expect(resultModal).toContainText('Tiệm Bánh Đầu Phố');
    await expect(resultModal).toContainText('ổ bánh');
    await page.waitForTimeout(950);
    await page.screenshot({ path: 'docs/screenshots/man2_04_victory.png' });

    expect(consoleErrors).toEqual([]);
    expect(externalRequests).toEqual([]);
  });

  test('ô Màn 3 bị khoá tới khi qua Màn 2 (unlockedStage=3), nhưng ?stage=3 mở thử được', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const s3Btn = page.getByTestId('btn-start-stage-3');
    await expect(s3Btn).toBeVisible();
    await expect(s3Btn).toBeDisabled();
    await expect(page.getByTestId('stage3-stars')).toContainText('Khóa');

    // Khi mới qua Màn 1 (unlockedStage = 2), Màn 3 vẫn khoá
    await page.evaluate(() => {
      window.localStorage.setItem(
        'giang_ho_ai_thu_thanh_save_v1',
        JSON.stringify({
          version: 1,
          unlockedStage: 2,
          starsByStage: { stage_1: 3 },
          bestLivesByStage: { stage_1: 18 },
          updatedAt: Date.now(),
        }),
      );
    });
    await page.goto('/');
    await expect(page.getByTestId('btn-start-stage-2')).toBeEnabled();
    await expect(page.getByTestId('btn-start-stage-3')).toBeDisabled();
    await page.screenshot({ path: 'docs/screenshots/man3_00_title_locked.png' });

    // ?stage=3 mở thử ngay dù chưa qua Màn 2
    await page.goto('/?stage=3');
    await expect(page.getByTestId('btn-start-stage-3')).toBeEnabled();

    // Khi đã qua Màn 2 (unlockedStage = 3), vào / bình thường mở được Màn 3
    await page.evaluate(() => {
      window.localStorage.setItem(
        'giang_ho_ai_thu_thanh_save_v1',
        JSON.stringify({
          version: 1,
          unlockedStage: 3,
          starsByStage: { stage_1: 3, stage_2: 2 },
          bestLivesByStage: { stage_1: 18, stage_2: 15 },
          updatedAt: Date.now(),
        }),
      );
    });
    await page.goto('/');
    await expect(page.getByTestId('btn-start-stage-3')).toBeEnabled();
    await expect(page.getByTestId('btn-start-stage-3')).toContainText('Mở Cửa Tiệm Hoa');
  });

  test('Màn 3 Tiệm Hoa Cuối Dốc (?bot=1): đặt 5 món tiệm hoa, giao tranh 2 cửa, Trùm Mùa Nồm Đổi hành! (3 màu) & thắng 12 đợt, chụp ảnh man3_*.png', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const consoleErrors: string[] = [];
    const externalRequests: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
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
    const startStage3 = page.getByTestId('btn-start-stage-3');
    await expect(startStage3).toBeEnabled();
    await startStage3.click();

    // 1. HUD Màn 3: 180 xu, 20/20 chậu hoa, 0/12 đợt, báo Đợt 1 (Mộc & Thủy)
    const essenceVal = page.getByTestId('td-essence-val');
    const livesVal = page.getByTestId('td-lives-val');
    const waveVal = page.getByTestId('td-wave-val');
    const upcomingBox = page.getByTestId('td-upcoming-box');
    await expect(essenceVal).toHaveText('180');
    await expect(livesVal).toHaveText('20/20');
    await expect(waveVal).toHaveText('0/12');
    await expect(upcomingBox).toContainText('Mộc');
    await expect(upcomingBox).toContainText('Thủy');

    // 2. Chạm ô pad_3 (188, 180) ở giữa 2 cửa -> mở bảng chọn 5 món tiệm hoa
    const canvas = page.locator('canvas');
    const pad3Screen = await page.evaluate(() => {
      const s = (window as unknown as { __TD_SCENE__?: { toScreen: (x: number, y: number) => { x: number; y: number } } }).__TD_SCENE__;
      return s ? s.toScreen(188, 180) : { x: 188, y: 240 };
    });
    await canvas.click({ position: { x: Math.round(pad3Screen.x), y: Math.round(pad3Screen.y) } });

    const buildSheet = page.getByTestId('td-build-sheet');
    await expect(buildSheet).toBeVisible();
    await expect(buildSheet).toContainText('Bình Tưới');
    await expect(buildSheet).toContainText('Kéo Tỉa');
    await expect(buildSheet).toContainText('Vôi Bột');
    await expect(buildSheet).toContainText('Đèn Sưởi');
    await expect(buildSheet).toContainText('Quạt Thông Gió');
    await page.screenshot({ path: 'docs/screenshots/man3_01_build_menu.png' });

    // Đặt Kéo Tỉa (Kim, 70 xu) vào pad_3
    await page.getByTestId('build-fl_shears').click();
    await expect(essenceVal).toHaveText('110');

    // Bật tốc độ x2, gọi Đợt 1 và bật Bot tự phối hợp món Màn 3
    await page.getByTestId('btn-speed-toggle').click();
    await page.getByTestId('btn-call-wave').click();
    await page.getByTestId('btn-bot-toggle').click();

    await page.waitForTimeout(2600);
    await page.screenshot({ path: 'docs/screenshots/man3_02_combat.png' });

    // 3. Tua mô phỏng tới Đợt 12 khi Trùm Mùa Nồm xuất hiện, để hiệu ứng cũ tan hết rồi chụp đúng khoảnh khắc Đổi hành!
    await page.evaluate(() => {
      const scene = (
        window as unknown as {
          __TD_SCENE__?: {
            engine: { status: string; enemies: Array<{ defId: string; element: string }> };
            tickSimulation: (dt: number) => void;
          };
        }
      ).__TD_SCENE__;
      if (!scene) return;
      let guard = 0;
      while (scene.engine.status === 'playing' && guard < 36000) {
        scene.tickSimulation(0.05);
        guard += 1;
        if (scene.engine.enemies.some((e) => e.defId === 'fl_monsoon')) {
          break;
        }
      }
    });
    await page.waitForTimeout(950);

    const bossShifted = await page.evaluate(() => {
      const scene = (
        window as unknown as {
          __TD_SCENE__?: {
            engine: {
              status: string;
              enemies: Array<{ defId: string; element: string }>;
            };
            tickSimulation: (dt: number) => void;
          };
        }
      ).__TD_SCENE__;
      if (!scene) return false;
      let guard = 0;
      while (scene.engine.status === 'playing' && guard < 12000) {
        scene.tickSimulation(0.05);
        guard += 1;
        const boss = scene.engine.enemies.find((e) => e.defId === 'fl_monsoon');
        if (boss && boss.element === 'moc') {
          return true;
        }
      }
      return false;
    });
    expect(bossShifted).toBe(true);

    // Kiểm tra banner "Đổi hành!" hiển thị rõ kèm biểu tượng Hành Mộc và chụp ảnh khoảnh khắc Trùm đổi màu xanh lá
    const shiftBanner = page.getByTestId('td-boss-shift-banner');
    await expect(shiftBanner).toBeVisible();
    await expect(shiftBanner).toContainText('Đổi hành!');
    await expect(shiftBanner).toContainText('Mộc');
    await page.waitForTimeout(160);
    await page.screenshot({ path: 'docs/screenshots/man3_03_boss_shift.png' });

    // 4. Tiếp tục chạy tới khi thắng hết 12 đợt Màn 3
    await page.evaluate(() => {
      const scene = (
        window as unknown as {
          __TD_SCENE__?: {
            engine: { status: string };
            tickSimulation: (dt: number) => void;
          };
        }
      ).__TD_SCENE__;
      if (!scene) return;
      let guard = 0;
      while (scene.engine.status === 'playing' && guard < 20000) {
        scene.tickSimulation(0.05);
        guard += 1;
      }
    });

    const resultModal = page.getByTestId('td-result-modal');
    await expect(resultModal).toBeVisible();
    await expect(resultModal).toContainText('Giữ Tiệm Thành Công!');
    await expect(resultModal).toContainText('Tiệm Hoa Cuối Dốc');
    await expect(resultModal).toContainText('chậu hoa');
    await page.waitForTimeout(950);
    await page.screenshot({ path: 'docs/screenshots/man3_04_victory.png' });

    expect(consoleErrors).toEqual([]);
    expect(externalRequests).toEqual([]);
  });

  test('Trang bị chủ tiệm: hình chủ tiệm mặc đúng đồ, vòng 10 ô 2 chống lưng, đổi đồ & Ngũ hành viên mãn, chụp ảnh gear_*.png', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const consoleErrors: string[] = [];
    const externalRequests: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));
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
    const gearBox = page.getByTestId('td-gear-box');
    await expect(gearBox).toBeVisible();
    await gearBox.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);

    // Chủ tiệm mặc đúng đồ khởi đầu (Mũ Mộc + Kính Hỏa) và đủ 10 ô quanh vòng
    const avatar = page.getByTestId('shopkeeper-avatar');
    await expect(avatar).toBeVisible();
    await expect(avatar).toHaveAttribute('data-worn', /hat:moc/);
    await expect(avatar).toHaveAttribute('data-worn', /glasses:hoa/);
    for (const sid of ['hat', 'glasses', 'jacket', 'belt', 'shoes', 'bag', 'wallet', 'watch', 'phone', 'umbrella']) {
      await expect(page.getByTestId(`gear-slot-${sid}`)).toBeVisible();
    }
    await page.screenshot({ path: 'docs/screenshots/gear_01_ring_starter.png' });

    // Chạm ô Kính mắt mở ngăn chọn đồ, hiện rõ 2 món chống lưng A/B
    await page.getByTestId('gear-slot-glasses').click();
    const picker = page.getByTestId('td-gear-picker');
    await expect(picker).toBeVisible();
    await expect(picker).toContainText('Chống lưng A');
    await expect(picker).toContainText('Chống lưng B');
    await expect(picker).toContainText('Kính Râm Tròng Cam');
    await picker.scrollIntoViewIfNeeded();
    await page.waitForTimeout(180);
    await page.screenshot({ path: 'docs/screenshots/gear_02_picker.png' });

    // Cởi Kính mắt -> chủ tiệm tháo kính ngay; bấm lại để mặc lại
    await picker.locator('[data-gear-off="1"]').click();
    await expect(page.getByTestId('shopkeeper-avatar')).not.toHaveAttribute('data-worn', /glasses:/);
    await picker.locator('[data-gear-item]').first().click();
    await expect(page.getByTestId('shopkeeper-avatar')).toHaveAttribute('data-worn', /glasses:hoa/);

    // Đủ 10 món theo vòng ngũ hành lặp 2 lần -> Ngũ hành viên mãn & chủ tiệm mặc đủ mũ/kính/áo/dây nịt/giày/túi/đồng hồ/ô dù
    await page.evaluate(() => {
      const cycle = ['kim', 'thuy', 'moc', 'hoa', 'tho'];
      const slots = ['hat', 'glasses', 'jacket', 'belt', 'shoes', 'bag', 'wallet', 'watch', 'phone', 'umbrella'];
      const names: Record<string, string> = {
        hat: 'Nón Bảo Hiểm Bạc',
        glasses: 'Kính Tròng Xanh Biển',
        jacket: 'Áo Khoác Kaki Xanh',
        belt: 'Dây Nịt Da Đỏ Đô',
        shoes: 'Bốt Lội Bùn Không Dính',
        bag: 'Túi Khóa Kim Loại',
        wallet: 'Ví Dài Xanh Đậm',
        watch: 'Đồng Hồ Mặt Gỗ',
        phone: 'Điện Thoại Pin 3 Ngày',
        umbrella: 'Ô Dù Chống Bão Cấp 12',
      };
      const inv = slots.map((slot, i) => ({
        uid: `full_${slot}`,
        slot,
        name: names[slot],
        element: cycle[i % 5],
        rarity: i === 4 || i === 8 || i === 9 ? 'hieu' : i % 2 === 0 ? 'xin' : 'tot',
        visible: [{ kind: 'all_dmg', value: 0.04 }, { kind: 'speed', value: 0.05 }],
        hidden: [
          { kind: 'range', value: 0.05 },
          { kind: 'coin_pct', value: 0.06 },
          { kind: 'boss_dmg', value: 0.08 },
        ],
      }));
      const eq = Object.fromEntries(slots.map((s) => [s, `full_${s}`]));
      window.localStorage.setItem(
        'giang_ho_ai_thu_thanh_save_v1',
        JSON.stringify({
          version: 1,
          unlockedStage: 3,
          starsByStage: { stage_1: 3, stage_2: 3, stage_3: 3 },
          bestLivesByStage: { stage_1: 20, stage_2: 20, stage_3: 20 },
          gearInventory: inv,
          gearEquipped: eq,
          updatedAt: Date.now(),
        }),
      );
    });
    await page.goto('/');
    await page.getByTestId('td-gear-box').scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await expect(page.getByTestId('td-fullring-banner')).toBeVisible();
    await expect(page.getByTestId('shopkeeper-avatar')).toHaveAttribute('data-worn', /umbrella:tho/);
    await expect(page.getByTestId('shopkeeper-avatar')).toHaveAttribute('data-worn', /jacket:moc/);
    await page.screenshot({ path: 'docs/screenshots/gear_03_fullring.png' });

    expect(consoleErrors).toEqual([]);
    expect(externalRequests).toEqual([]);
  });

  test('Bậc 4 tuyệt chiêu (Màn 2): mở khóa btn-unlock-ultimate, nút nổi trên món, kích hoạt hiện banner & vòng hồi chiêu 30s', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const consoleErrors: string[] = [];
    const externalRequests: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));
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

    await page.goto('/?stage=2');
    await page.getByTestId('btn-start-stage-2').click();
    await expect(page.getByTestId('td-wave-val')).toHaveText('0/10');

    // Đặt sẵn 2 món bậc 3 (Hũ Sành trên pad_5 & Quạt Điện trên pad_4) để kiểm tra mở khóa & nút nổi Bậc 4
    await page.evaluate(() => {
      const scene = (
        window as unknown as {
          __TD_SCENE__?: {
            engine: {
              essence: number;
              buildTower: (padId: string, defId: string) => unknown;
              upgradeTower: (padId: string, branch?: 'A' | 'B') => boolean;
              unlockUltimate: (padId: string) => boolean;
            };
            selectPadById: (padId: string) => void;
          };
        }
      ).__TD_SCENE__;
      if (!scene) return;
      scene.engine.essence = 900;
      scene.engine.buildTower('pad_5', 'bk_jar');
      scene.engine.upgradeTower('pad_5');
      scene.engine.upgradeTower('pad_5', 'A');
      scene.engine.buildTower('pad_4', 'bk_fan');
      scene.engine.upgradeTower('pad_4');
      scene.engine.upgradeTower('pad_4', 'A');
      scene.engine.unlockUltimate('pad_4');
      scene.selectPadById('pad_5');
    });

    // 1. Nút btn-unlock-ultimate hiển thị đẹp trong bảng nâng cấp với tên tuyệt chiêu "Úp Cả Mẻ"
    const unlockBtn = page.getByTestId('btn-unlock-ultimate');
    await expect(unlockBtn).toBeVisible();
    await expect(unlockBtn).toContainText('Úp Cả Mẻ');
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'docs/screenshots/ult_01_unlock_sheet.png' });

    // 2. Bấm mở khóa Bậc 4 -> hiện nút btn-use-ultimate và nút nổi ngay trên món pad_5
    await unlockBtn.click();
    await expect(page.getByTestId('btn-use-ultimate')).toBeVisible();
    const floatingBtn = page.getByTestId('btn-floating-ult-pad_5');
    await expect(floatingBtn).toBeVisible();
    await expect(floatingBtn).toHaveAttribute('data-state', 'ready');

    // Đóng bảng nâng cấp, gọi Đợt 1 cho quái tiến vào để thấy nút nổi rõ trên sân
    await page.locator('#btn-close-sheet').click();
    await page.getByTestId('btn-call-wave').click();
    await page.waitForTimeout(700);
    await page.screenshot({ path: 'docs/screenshots/ult_02_floating_ready.png' });

    // 3. Bấm trực tiếp nút tuyệt chiêu nổi trên món -> hiện banner "★ Úp Cả Mẻ!" & chuyển sang vòng đếm hồi chiêu 30s
    await floatingBtn.click();
    const ultBanner = page.getByTestId('td-ult-banner');
    await expect(ultBanner).toBeVisible();
    await expect(ultBanner).toContainText('Úp Cả Mẻ');
    await expect(floatingBtn).toHaveAttribute('data-state', 'cooling');
    await expect(floatingBtn).toContainText(/\d+s/);
    await page.waitForTimeout(140);
    await page.screenshot({ path: 'docs/screenshots/ult_03_cast_and_cd.png' });

    expect(consoleErrors).toEqual([]);
    expect(externalRequests).toEqual([]);
  });

  test('Con phố dốc Đà Lạt: đủ 3 mặt tiền từ SHOP_STREET, cửa cuốn khóa, chạm tiệm hiện 5 món + quái chính + bảng giới thiệu đổi theo tiệm, chụp c3_01_*.png', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const street = page.getByTestId('shop-street');
    await expect(street).toBeVisible();
    await expect(page.getByTestId('street-shop-1')).toBeVisible();
    await expect(page.getByTestId('street-shop-2')).toBeVisible();
    await expect(page.getByTestId('street-shop-3')).toBeVisible();
    await expect(page.getByTestId('street-coming-soon')).toBeVisible();

    // Tiệm 1 mở (không có cửa cuốn), Tiệm 2 & 3 có cửa cuốn kéo xuống + ổ khóa
    await expect(page.getByTestId('street-shop-1').locator('[data-shutter="closed"]')).toHaveCount(0);
    await expect(page.getByTestId('street-shop-2').locator('[data-shutter="closed"]')).toHaveCount(1);
    await expect(page.getByTestId('street-shop-3').locator('[data-shutter="closed"]')).toHaveCount(1);
    await expect(page.getByTestId('shop-detail-1')).toContainText('Dép Tông');
    await expect(page.getByTestId('shop-detail-1')).toContainText('Giọt Mưa');
    await page.waitForTimeout(250);
    await page.screenshot({ path: 'docs/screenshots/c3_01_street_top.png' });

    // Khi đã mở Tiệm 2 và qua Tiệm 1 với 3 sao -> chạm Tiệm 2 xem 5 món Tiệm Bánh + quái Tiệm Bánh
    await page.evaluate(() => {
      window.localStorage.setItem(
        'giang_ho_ai_thu_thanh_save_v1',
        JSON.stringify({
          version: 1,
          unlockedStage: 2,
          starsByStage: { stage_1: 3 },
          bestLivesByStage: { stage_1: 19 },
          updatedAt: Date.now(),
        }),
      );
    });
    await page.goto('/');
    await expect(page.getByTestId('stage1-stars')).toContainText('★★★');
    await expect(page.getByTestId('street-shop-2').locator('[data-shutter="closed"]')).toHaveCount(0);
    await expect(page.getByTestId('street-shop-3').locator('[data-shutter="closed"]')).toHaveCount(1);

    await page.getByTestId('street-shop-2').click();
    const detail2 = page.getByTestId('shop-detail-2');
    await expect(detail2).toBeVisible();
    await expect(detail2).toContainText('Vỉ Đập Ruồi');
    await expect(detail2).toContainText('Lò Nướng');
    await expect(detail2).toContainText('Hơi Ẩm');
    await expect(detail2).toContainText('Than Hồng');

    // Bảng giới thiệu món ở màn hình đầu đổi sang 5 món của Tiệm Bánh
    const guide = page.getByTestId('td-element-guide');
    await expect(guide).toContainText('Tiệm Bánh Đầu Phố');
    await expect(guide).toContainText('Vỉ Đập Ruồi');

    await page.getByTestId('street-shop-2').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'docs/screenshots/c3_01_street_bakery_detail.png' });

    // Chạm Tiệm 3 (dù đang khóa vẫn xem được thông tin 5 món + Trùm Mùa Nồm)
    await page.getByTestId('street-shop-3').click();
    const detail3 = page.getByTestId('shop-detail-3');
    await expect(detail3).toBeVisible();
    await expect(detail3).toContainText('Bình Tưới');
    await expect(detail3).toContainText('Trùm Mùa Nồm');
    await expect(guide).toContainText('Tiệm Hoa Cuối Dốc');
    await expect(guide).toContainText('Kéo Tỉa');
    await page.getByTestId('street-shop-3').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'docs/screenshots/c3_01_street_flower_locked.png' });
  });

  test('Hướng dẫn chơi lần đầu: người mới vào Màn 1 thấy hướng dẫn 5 bước, đi qua thao tác thật, bấm Bỏ qua thì không thấy lại & xem lại được trong menu ⏸', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByTestId('btn-start-stage-1').click();

    // 1. Người mới vào Màn 1 thấy bong bóng hướng dẫn Bước 1/5 + avatar chủ tiệm + mũi tên
    const tutOverlay = page.getByTestId('td-tutorial-overlay');
    await expect(tutOverlay).toBeVisible();
    await expect(tutOverlay).toHaveAttribute('data-tut-step', 'tap_pad');
    await expect(page.getByTestId('td-tutorial-step-count')).toHaveText('Bước 1/5');
    await expect(page.getByTestId('td-tutorial-avatar')).toBeVisible();
    await expect(page.getByTestId('td-tutorial-arrow')).toBeVisible();
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'docs/screenshots/c3_02_tut_step1_pad.png' });

    // 2. Chạm ô pad_1 -> tự sang Bước 2/5 (chỉ vào Dép Tông)
    const pad1Screen = await page.evaluate(() => {
      const s = (
        window as unknown as {
          __TD_SCENE__?: { toScreen: (x: number, y: number) => { x: number; y: number } };
        }
      ).__TD_SCENE__;
      return s ? s.toScreen(112, 76) : { x: 120, y: 140 };
    });
    await page.locator('canvas').click({ position: { x: Math.round(pad1Screen.x), y: Math.round(pad1Screen.y) } });
    await expect(tutOverlay).toHaveAttribute('data-tut-step', 'pick_tower');
    await expect(page.getByTestId('td-tutorial-step-count')).toHaveText('Bước 2/5');
    await page.waitForTimeout(180);
    await page.screenshot({ path: 'docs/screenshots/c3_02_tut_step2_build.png' });

    // 3. Đặt Dép Tông -> tự sang Bước 3/5 (nhìn đợt sắp tới) -> bấm Tiếp sang Bước 4/5 (vòng Ngũ Hành)
    await page.getByTestId('build-wood_tower').click();
    await expect(tutOverlay).toHaveAttribute('data-tut-step', 'see_wave');
    await expect(page.getByTestId('td-tutorial-step-count')).toHaveText('Bước 3/5');
    await page.getByTestId('btn-tut-next').click();

    await expect(tutOverlay).toHaveAttribute('data-tut-step', 'counter');
    await expect(page.getByTestId('td-tutorial-element-guide')).toBeVisible();
    await page.waitForTimeout(180);
    await page.screenshot({ path: 'docs/screenshots/c3_02_tut_step4_counter.png' });

    // 4. Bấm Bỏ qua -> ẩn hướng dẫn và đánh dấu markTutorialDone(); vào lại Màn 1 không thấy nữa
    await page.getByTestId('btn-tut-skip').click();
    await expect(tutOverlay).toBeHidden();

    await page.goto('/');
    await page.getByTestId('btn-start-stage-1').click();
    await expect(page.getByTestId('td-essence-val')).toHaveText('160');
    await expect(page.getByTestId('td-tutorial-overlay')).toBeHidden();

    // 5. Mở menu tạm dừng (⏸) -> bấm "Xem lại hướng dẫn" -> hướng dẫn hiện lại từ Bước 1/5
    await page.getByTestId('btn-pause-toggle').click();
    const pauseMenu = page.getByTestId('td-pause-menu');
    await expect(pauseMenu).toBeVisible();
    await expect(page.getByTestId('btn-replay-tutorial')).toBeVisible();
    await page.getByTestId('btn-replay-tutorial').click();

    await expect(pauseMenu).toHaveCount(0);
    await expect(page.getByTestId('td-tutorial-overlay')).toBeVisible();
    await expect(page.getByTestId('td-tutorial-overlay')).toHaveAttribute('data-tut-step', 'tap_pad');
  });

  test('Biểu tượng app (public/icons/) & Màn hình chờ hộp giày (BootScene): đủ 4 icon, khai báo trong index.html, logo + thanh tải + phụ đề Ngũ hành giữ tiệm, chụp c3_03_boot_splash.png', async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?splash=1');

    // 1. Kiểm tra thẻ khai báo favicon & apple-touch-icon trong index.html và 4 tệp icon tải được 200
    await expect(page.locator('link[rel="icon"][sizes="32x32"]')).toHaveAttribute('href', /favicon-32\.png/);
    await expect(page.locator('link[rel="icon"][sizes="192x192"]')).toHaveAttribute('href', /icon-192\.png/);
    await expect(page.locator('link[rel="apple-touch-icon"][sizes="180x180"]')).toHaveAttribute(
      'href',
      /apple-touch-icon-180\.png/,
    );
    for (const file of ['icon-512.png', 'icon-192.png', 'apple-touch-icon-180.png', 'favicon-32.png']) {
      const res = await request.get(`/icons/${file}`);
      expect(res.status()).toBe(200);
    }

    // 1b. Kiểm tra thẻ Open Graph chia sẻ link và tệp /og-image.png trả về 200
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Gọn Tiệm, Sạch Phố/);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', /Đà Lạt/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-image\.png/);
    const ogRes = await request.get('/og-image.png');
    expect(ogRes.status()).toBe(200);

    // 2. Kiểm tra màn hình chờ BootScene: nền hộp giày, logo, thanh tải, phụ đề "Ngũ hành giữ tiệm"
    const splash = page.getByTestId('td-boot-splash');
    await expect(splash).toBeVisible();
    await expect(page.getByTestId('boot-logo')).toBeVisible();
    await expect(page.getByTestId('boot-subtitle')).toHaveText('Ngũ hành giữ tiệm');
    await expect(page.getByTestId('boot-progress-bar')).toBeVisible();
    await expect(page.getByTestId('boot-progress-pct')).toHaveText('76%');
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'docs/screenshots/c3_03_boot_splash.png' });
  });

  test('Nhạc nền Web Audio tự tạo: chỉ mở sau lần chạm đầu, tắt Nhạc riêng với Tiếng, nhớ trên máy, đổi giai điệu theo tiệm & Trùm Mùa Nồm, chụp c3_04_audio_pause_menu.png', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?bot=1');

    // 1. Đợi TitleScene dựng xong; trước lần chạm đầu tiên: nhạc chọn bài 'title' nhưng chưa unlock (tôn trọng luật chặn tự phát)
    const musicBtn = page.getByTestId('btn-toggle-music');
    const sfxBtn = page.getByTestId('btn-toggle-sfx');
    await expect(musicBtn).toContainText('Nhạc: BẬT');
    await expect(sfxBtn).toContainText('Tiếng: BẬT');

    const beforeTouch = await page.evaluate(() => {
      const a = (window as unknown as {
        __GON_TIEM_AUDIO__?: {
          music: { getCurrentTrack: () => string | null; isUnlocked: () => boolean; isMuted: () => boolean };
          sound: { isMuted: () => boolean };
        };
      }).__GON_TIEM_AUDIO__;
      return a
        ? {
            track: a.music.getCurrentTrack(),
            unlocked: a.music.isUnlocked(),
            mMuted: a.music.isMuted(),
            sMuted: a.sound.isMuted(),
          }
        : null;
    });
    expect(beforeTouch).toEqual({ track: 'title', unlocked: false, mMuted: false, sMuted: false });

    // 2. Bấm tắt Nhạc -> chỉ tắt Nhạc (Tiếng vẫn BẬT) và kích hoạt lần chạm đầu

    await musicBtn.click();
    await expect(musicBtn).toContainText('Nhạc: TẮT');
    await expect(sfxBtn).toContainText('Tiếng: BẬT');

    // Tải lại trang -> vẫn nhớ Nhạc: TẮT, Tiếng: BẬT
    await page.goto('/?bot=1');
    await expect(page.getByTestId('btn-toggle-music')).toContainText('Nhạc: TẮT');
    await expect(page.getByTestId('btn-toggle-sfx')).toContainText('Tiếng: BẬT');

    // Bật lại Nhạc, tắt Tiếng riêng -> nhớ trên máy
    await page.getByTestId('btn-toggle-music').click();
    await page.getByTestId('btn-toggle-sfx').click();
    await expect(page.getByTestId('btn-toggle-music')).toContainText('Nhạc: BẬT');
    await expect(page.getByTestId('btn-toggle-sfx')).toContainText('Tiếng: TẮT');

    // 3. Vào Tiệm Hoa (Màn 3): đổi sang giai điệu 'stage_3'; mở menu ⏸ thấy nút tắt Nhạc/Tiếng riêng
    await page.getByTestId('btn-start-stage-3').click();
    await expect(page.getByTestId('td-wave-val')).toHaveText('0/12');
    const s3Track = await page.evaluate(() => {
      const a = (window as unknown as {
        __GON_TIEM_AUDIO__?: { music: { getCurrentTrack: () => string | null; isUnlocked: () => boolean } };
      }).__GON_TIEM_AUDIO__;
      return a ? { track: a.music.getCurrentTrack(), unlocked: a.music.isUnlocked() } : null;
    });
    expect(s3Track).toEqual({ track: 'stage_3', unlocked: true });

    await page.getByTestId('btn-pause-toggle').click();
    await expect(page.getByTestId('td-pause-menu')).toBeVisible();
    await expect(page.getByTestId('btn-toggle-music')).toContainText('Nhạc: BẬT');
    await expect(page.getByTestId('btn-toggle-sfx')).toContainText('Tiếng: TẮT');
    await page.waitForTimeout(180);
    await page.screenshot({ path: 'docs/screenshots/c3_04_audio_pause_menu.png' });
    await page.getByTestId('btn-resume-game').click();

    // 4. Khi Trùm Mùa Nồm xuất hiện -> tự chuyển sang giai điệu nhịp dồn 'boss'
    await page.evaluate(() => {
      const s = (window as unknown as {
        __TD_SCENE__?: {
          engine: {
            status: string;
            enemies: Array<{ defId: string }>;
            startNextWave: (early: boolean) => unknown;
          };
          autoBotEnabled: boolean;
          tickSimulation: (dt: number) => void;
        };
      }).__TD_SCENE__;
      if (!s) return;
      s.autoBotEnabled = true;
      s.engine.startNextWave(false);
      let guard = 0;
      while (s.engine.status === 'playing' && guard < 36000) {
        s.tickSimulation(0.05);
        guard += 1;
        if (s.engine.enemies.some((e) => e.defId === 'fl_monsoon')) break;
      }
    });
    await page.waitForTimeout(120);
    const bossTrack = await page.evaluate(() => {
      const a = (window as unknown as {
        __GON_TIEM_AUDIO__?: { music: { getCurrentTrack: () => string | null } };
      }).__GON_TIEM_AUDIO__;
      return a?.music.getCurrentTrack() ?? null;
    });
    expect(bossTrack).toBe('boss');
  });

  test('Việc 6 — Bảng trang bị gọn chữ: gợi ý 1 dòng + nút ?, statShort (chạm 2 lần mở statText), so sánh previewEquip, thu gọn bộ đồ & chip tổng sức mạnh', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    // Nạp kho gồm 2 đồ khởi đầu (đang mặc) + 1 chiếc kính thứ 2 để hiện đủ chip tổng sức mạnh & dòng so sánh previewEquip
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.setItem(
        'giang_ho_ai_thu_thanh_save_v1',
        JSON.stringify({
          version: 1,
          unlockedStage: 1,
          starsByStage: {},
          bestLivesByStage: {},
          gearInventory: [
            {
              uid: 'starter_hat',
              slot: 'hat',
              name: 'Mũ Len Xanh Rêu',
              element: 'moc',
              rarity: 'tot',
              visible: [{ kind: 'el_moc', value: 0.07 }],
              hidden: [
                { kind: 'speed', value: 0.05 },
                { kind: 'coin_pct', value: 0.06 },
              ],
            },
            {
              uid: 'starter_glasses',
              slot: 'glasses',
              name: 'Kính Râm Tròng Cam',
              element: 'hoa',
              rarity: 'tot',
              visible: [
                { kind: 'range', value: 0.06 },
                { kind: 'boss_dmg', value: 0.08 },
              ],
              hidden: [
                { kind: 'all_dmg', value: 0.04 },
                { kind: 'crit', value: 0.08 },
              ],
            },
            {
              uid: 'extra_glasses_test',
              slot: 'glasses',
              name: 'Kính Chống Nắng Vàng',
              element: 'hoa',
              rarity: 'xin',
              visible: [
                { kind: 'all_dmg', value: 0.08 },
                { kind: 'crit', value: 0.1 },
              ],
              hidden: [
                { kind: 'speed', value: 0.06 },
                { kind: 'range', value: 0.07 },
              ],
            },
          ],
          gearEquipped: { hat: 'starter_hat', glasses: 'starter_glasses' },
          updatedAt: Date.now(),
        }),
      );
    });
    await page.goto('/');

    const gearBox = page.getByTestId('td-gear-box');
    await gearBox.scrollIntoViewIfNeeded();
    await expect(gearBox).toContainText('Món chống lưng đúng hành sẽ sáng dòng ẩn');

    // Nút ? mở bảng luật đầy đủ rồi đóng lại
    await page.locator('#btn-gear-rules').click();
    const rulesPanel = page.getByTestId('td-gear-rules-panel');
    await expect(rulesPanel).toBeVisible();
    await expect(rulesPanel).toContainText('2 món chống lưng');
    await page.locator('#btn-close-gear-rules').click();
    await expect(rulesPanel).toHaveCount(0);

    // 10 ô quanh chủ tiệm không còn dòng chữ tên ô ở dưới
    const emptyJacketText = (await page.getByTestId('gear-slot-jacket').innerText()).trim();
    expect(emptyJacketText).toBe('');

    // Bộ đồ mặc định thu gọn (1 nút Đủ 4 bộ ▾), bấm mở ra đủ 4 bộ
    await expect(page.getByTestId('gear-set-di_mua')).toHaveCount(0);
    await page.getByTestId('btn-toggle-gear-sets').click();
    await expect(page.getByTestId('gear-set-di_mua')).toBeVisible();
    await expect(page.getByTestId('gear-set-chu_tiem_xin')).toBeVisible();
    await page.getByTestId('btn-toggle-gear-sets').click();

    // Bấm chip tổng sức mạnh hiện câu đầy đủ
    await page.getByTestId('gear-bonus-chip-0').click();
    await expect(page.getByTestId('td-bonus-chip-detail')).toBeVisible();

    // Mở picker Kính mắt: thấy previewEquip so sánh & chạm 2 lần vào 1 dòng statShort mở câu đầy đủ
    await page.getByTestId('gear-slot-glasses').click();
    const picker = page.getByTestId('td-gear-picker');
    await expect(picker).toBeVisible();
    await expect(page.getByTestId('gear-preview-extra_glasses_test')).toBeVisible();
    const firstStatRow = picker.locator('[data-stat-key]').first();
    const shortBefore = (await firstStatRow.innerText()).trim();
    await firstStatRow.dblclick();
    const fullAfter = (await picker.locator('[data-stat-key]').first().innerText()).trim();
    expect(fullAfter.length).toBeGreaterThan(shortBefore.length);

    await page.waitForTimeout(160);
    await page.screenshot({ path: 'docs/screenshots/v6_gear_compact.png' });
    expect(consoleErrors).toEqual([]);
  });

  test('Việc 7 — Chuỗi tương sinh trên sân (Chuỗi 3 +25%, Chuỗi 5 +40%), banner Ngũ hành viên mãn & dòng chuỗi trong bảng nâng cấp', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/?stage=2');
    await page.getByTestId('btn-start-stage-2').click();
    await expect(page.getByTestId('td-wave-val')).toHaveText('0/10');

    // Đặt chuỗi 3 món (Kim -> Thủy -> Mộc) trên pad_4 -> pad_3 -> pad_5
    await page.evaluate(() => {
      const s = (window as unknown as {
        __TD_SCENE__?: {
          engine: { essence: number; buildTower: (p: string, t: string) => unknown };
          tickSimulation: (dt: number) => void;
        };
      }).__TD_SCENE__;
      if (!s) return;
      s.engine.essence = 900;
      s.engine.buildTower('pad_4', 'bk_swatter'); // Kim
      s.engine.buildTower('pad_3', 'bk_fridge'); // Thủy
      s.engine.buildTower('pad_5', 'bk_fan'); // Mộc
      s.tickSimulation(0.05);
    });
    await page.waitForTimeout(200);
    await expect(page.getByTestId('td-chain-label').first()).toContainText('Chuỗi 3 +25%');

    // Nối thêm Hỏa (pad_6) và Thổ (pad_8) -> Chuỗi 5 (+40%) + Ngũ hành viên mãn!
    await page.evaluate(() => {
      const s = (window as unknown as {
        __TD_SCENE__?: {
          engine: { buildTower: (p: string, t: string) => unknown };
          tickSimulation: (dt: number) => void;
        };
      }).__TD_SCENE__;
      if (!s) return;
      s.engine.buildTower('pad_6', 'bk_oven'); // Hỏa
      s.engine.buildTower('pad_8', 'bk_jar'); // Thổ
      s.tickSimulation(0.05);
    });
    await page.waitForTimeout(250);
    await expect(page.getByTestId('td-full-cycle-banner')).toBeVisible();
    await expect(page.getByTestId('td-full-cycle-banner')).toContainText('Ngũ hành viên mãn!');
    await expect(page.locator('[data-testid="td-chain-label"][data-chain-len="5"]')).toContainText('Chuỗi 5 +40%');
    await page.screenshot({ path: 'docs/screenshots/v7_synergy_full_cycle.png' });

    // Mở bảng nâng cấp món cuối chuỗi (pad_8) -> thấy dòng "Chuỗi tương sinh: 5 món (+40% sức)"
    await page.evaluate(() => {
      const s = (window as unknown as { __TD_SCENE__?: { selectPadById: (p: string) => void } }).__TD_SCENE__;
      s?.selectPadById('pad_8');
    });
    const chainRow = page.getByTestId('td-upgrade-synergy-chain');
    await expect(chainRow).toBeVisible();
    await expect(chainRow).toContainText('Chuỗi tương sinh: 5 món (+40% sức)');
    await page.waitForTimeout(150);
    await page.screenshot({ path: 'docs/screenshots/v7_upgrade_chain.png' });

    expect(consoleErrors).toEqual([]);
  });

  test('Việc 8 — Trận Trùm Phố Dốc Đà Lạt: khóa trước khi qua 3 tiệm, bảng chọn 6/15 món, bản đồ dốc 3 tiệm, Bão Lốc 5 màu, thắng nhận huy hiệu Giữ trọn phố & mở 2 Phố Thật', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const consoleErrors: string[] = [];
    const externalRequests: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));
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

    // 1. Khi mới chơi: Trùm Phố khóa & các Phố Thật trên bản đồ Đà Lạt khóa
    await page.goto('/');
    await expect(page.getByTestId('btn-start-stage-4')).toBeDisabled();
    await expect(page.getByTestId('real-streets-status')).toContainText('Thắng Trùm Phố để mở');
    await page.getByTestId('real-street-pin-street_pho_ca_phe').click();
    await expect(page.getByTestId('btn-start-street_pho_ca_phe')).toBeDisabled();
    await page.getByTestId('real-street-pin-street_tang_bat_ho').click();
    await expect(page.getByTestId('btn-start-street_tang_bat_ho')).toBeDisabled();

    // 2. Đã qua 3 tiệm (unlockedStage=4): mở nút Ra Phố Đánh Trùm -> mở bảng chọn 6/15 món
    await page.evaluate(() => {
      window.localStorage.setItem(
        'giang_ho_ai_thu_thanh_save_v1',
        JSON.stringify({
          version: 1,
          unlockedStage: 4,
          starsByStage: { stage_1: 3, stage_2: 3, stage_3: 3 },
          bestLivesByStage: { stage_1: 20, stage_2: 20, stage_3: 20 },
          tutorialDone: true,
          updatedAt: Date.now(),
        }),
      );
    });
    await page.goto('/');
    const startStage4 = page.getByTestId('btn-start-stage-4');
    await expect(startStage4).toBeEnabled();
    await startStage4.scrollIntoViewIfNeeded();
    await startStage4.click();

    const loModal = page.getByTestId('td-loadout-modal');
    await expect(loModal).toBeVisible();
    await expect(loModal).toContainText('Đủ 5 hành + 1 hỗ trợ');
    await page.waitForTimeout(180);
    await page.screenshot({ path: 'docs/screenshots/v8_loadout_modal.png' });

    // Xác nhận bộ 6 món -> vào Trận Trùm Phố dùng bản đồ map_trum_pho
    await page.getByTestId('btn-confirm-loadout').click();
    await expect(page.getByTestId('td-wave-val')).toHaveText('0/12');

    const mapCheck = await page.evaluate(() => {
      const s = (window as unknown as {
        __TD_SCENE__?: { placeholderMap: unknown; mapImage?: { texture?: { key?: string } } };
      }).__TD_SCENE__;
      return { hasPlaceholder: Boolean(s?.placeholderMap), mapKey: s?.mapImage?.texture?.key ?? '' };
    });
    expect(mapCheck).toEqual({ hasPlaceholder: false, mapKey: 'map_trum_pho' });

    // Bật Bot tự động đánh qua đợt đầu & chụp giao tranh trên bản đồ 3 tiệm
    await page.evaluate(() => {
      const s = (window as unknown as {
        __TD_SCENE__?: {
          autoBotEnabled: boolean;
          engine: { startNextWave: (e: boolean) => unknown };
          tickSimulation: (dt: number) => void;
        };
      }).__TD_SCENE__;
      if (!s) return;
      s.autoBotEnabled = true;
      s.engine.startNextWave(false);
      for (let i = 0; i < 160; i += 1) s.tickSimulation(0.05);
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'docs/screenshots/v8_stage4_combat.png' });

    // Chạy tới Đợt 12 gặp Trùm Bão Lốc Cuối Mùa & đợi Trùm đổi hành
    const bossShifted = await page.evaluate(() => {
      const s = (window as unknown as {
        __TD_SCENE__?: {
          engine: { status: string; enemies: Array<{ defId: string; element: string }> };
          tickSimulation: (dt: number) => void;
        };
      }).__TD_SCENE__;
      if (!s) return false;
      let seenBoss = false;
      let firstEl = '';
      for (let i = 0; i < 42000 && s.engine.status === 'playing'; i += 1) {
        s.tickSimulation(0.05);
        const boss = s.engine.enemies.find((e) => e.defId === 'st_bao_loc');
        if (boss) {
          if (!seenBoss) {
            seenBoss = true;
            firstEl = boss.element;
          } else if (boss.element !== firstEl) {
            return true;
          }
        }
      }
      return false;
    });
    expect(bossShifted).toBe(true);
    await expect(page.getByTestId('td-boss-shift-banner')).toBeVisible();
    await page.waitForTimeout(160);
    await page.screenshot({ path: 'docs/screenshots/v8_boss_bao_loc.png' });

    // Tiếp tục tới chiến thắng Trận Trùm Phố
    await page.evaluate(() => {
      const s = (window as unknown as {
        __TD_SCENE__?: { engine: { status: string }; tickSimulation: (dt: number) => void };
      }).__TD_SCENE__;
      if (!s) return;
      for (let i = 0; i < 30000 && s.engine.status === 'playing'; i += 1) {
        s.tickSimulation(0.05);
      }
    });

    const resultModal = page.getByTestId('td-result-modal');
    await expect(resultModal).toBeVisible();
    await expect(resultModal).toContainText('PHỐ SẠCH BÓNG!');
    await expect(page.getByTestId('td-result-badge')).toContainText('Giữ trọn phố');
    await expect(page.getByTestId('td-result-drops')).toContainText('Hàng hiệu');
    await page.waitForTimeout(950);
    await page.screenshot({ path: 'docs/screenshots/v8_stage4_victory.png' });

    // Về Màn Chính -> thấy huy hiệu vàng "Giữ trọn phố" & các Phố Thật trên Bản đồ Đà Lạt đã mở khóa!
    await page.getByTestId('btn-back-title').click();
    await expect(page.getByTestId('real-streets-status')).toContainText('Đã mở khóa');
    await page.getByTestId('real-street-pin-street_pho_ca_phe').click();
    await expect(page.getByTestId('btn-start-street_pho_ca_phe')).toBeEnabled();
    await page.getByTestId('real-street-pin-street_tang_bat_ho').click();
    await expect(page.getByTestId('btn-start-street_tang_bat_ho')).toBeEnabled();
    await page.getByTestId('real-street-pin-street_pho_ca_phe').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'docs/screenshots/v8_title_dalat_unlocked.png' });

    expect(consoleErrors).toEqual([]);
    expect(externalRequests).toEqual([]);
  });

  test('Việc 9 — 2 Phố Thật Đà Lạt (/#street_tang_bat_ho và /#street_pho_ca_phe): bản đồ thật có ghi nguồn OSM, 18 món & 14 quái vẽ riêng, 0 lỗi console, 0 mạng ngoài', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const consoleErrors: string[] = [];
    const externalRequests: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));
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

    // 1. Mở thẳng /#street_tang_bat_ho
    await page.goto('/#street_tang_bat_ho');
    await expect(page.getByTestId('td-wave-val')).toHaveText('0/11');
    const tbhInfo = await page.evaluate(() => {
      const s = (window as unknown as {
        __TD_SCENE__?: {
          placeholderMap: unknown;
          mapImage?: { texture?: { key?: string } };
          engine: { stage: { id: string } };
        };
      }).__TD_SCENE__;
      return {
        stageId: s?.engine.stage.id,
        hasPlaceholder: Boolean(s?.placeholderMap),
        mapKey: s?.mapImage?.texture?.key ?? '',
      };
    });
    expect(tbhInfo).toEqual({
      stageId: 'street_tang_bat_ho',
      hasPlaceholder: false,
      mapKey: 'map_street_tang_bat_ho',
    });

    // Mở bảng đặt món ô 1 & đặt 2 món đặc trưng Tăng Bạt Hổ -> gọi đợt 1 giao tranh
    await page.evaluate(() => {
      const s = (window as unknown as { __TD_SCENE__?: { selectPadById: (p: string) => void } }).__TD_SCENE__;
      s?.selectPadById('pad_1');
    });
    const buildSheet1 = page.getByTestId('td-build-sheet');
    await expect(buildSheet1).toBeVisible();
    await page.waitForTimeout(160);
    await page.screenshot({ path: 'docs/screenshots/v9_tang_bat_ho_build.png' });

    await buildSheet1.locator('.td-build-option').first().click();
    await page.evaluate(() => {
      const s = (window as unknown as {
        __TD_SCENE__?: {
          engine: { essence: number; stage: { towerIds?: string[] }; buildTower: (p: string, t: string) => unknown; startNextWave: (e: boolean) => unknown };
          tickSimulation: (dt: number) => void;
        };
      }).__TD_SCENE__;
      if (!s) return;
      s.engine.essence = 500;
      const tids = s.engine.stage.towerIds ?? [];
      if (tids[1]) s.engine.buildTower('pad_2', tids[1]);
      if (tids[2]) s.engine.buildTower('pad_3', tids[2]);
      s.engine.startNextWave(false);
      for (let i = 0; i < 130; i += 1) s.tickSimulation(0.05);
    });
    await page.waitForTimeout(220);
    await page.screenshot({ path: 'docs/screenshots/v9_tang_bat_ho_combat.png' });

    // Mở menu Tạm dừng -> Về Con phố dốc phải xoá hash và về được TitleScene
    await page.getByTestId('btn-pause-toggle').click();
    await page.getByTestId('btn-pause-title').click();
    await expect(page.getByTestId('shop-street')).toBeVisible();

    // 2. Mở thẳng /#street_pho_ca_phe
    await page.goto('/#street_pho_ca_phe');
    await expect(page.getByTestId('td-wave-val')).toHaveText('0/11');
    const pcpInfo = await page.evaluate(() => {
      const s = (window as unknown as {
        __TD_SCENE__?: {
          placeholderMap: unknown;
          mapImage?: { texture?: { key?: string } };
          engine: { stage: { id: string } };
        };
      }).__TD_SCENE__;
      return {
        stageId: s?.engine.stage.id,
        hasPlaceholder: Boolean(s?.placeholderMap),
        mapKey: s?.mapImage?.texture?.key ?? '',
      };
    });
    expect(pcpInfo).toEqual({
      stageId: 'street_pho_ca_phe',
      hasPlaceholder: false,
      mapKey: 'map_street_pho_ca_phe',
    });

    await page.evaluate(() => {
      const s = (window as unknown as { __TD_SCENE__?: { selectPadById: (p: string) => void } }).__TD_SCENE__;
      s?.selectPadById('pad_1');
    });
    const buildSheet2 = page.getByTestId('td-build-sheet');
    await expect(buildSheet2).toBeVisible();
    await page.waitForTimeout(160);
    await page.screenshot({ path: 'docs/screenshots/v9_pho_ca_phe_build.png' });

    await buildSheet2.locator('.td-build-option').first().click();
    await page.evaluate(() => {
      const s = (window as unknown as {
        __TD_SCENE__?: {
          engine: { essence: number; stage: { towerIds?: string[] }; buildTower: (p: string, t: string) => unknown; startNextWave: (e: boolean) => unknown };
          tickSimulation: (dt: number) => void;
        };
      }).__TD_SCENE__;
      if (!s) return;
      s.engine.essence = 500;
      const tids = s.engine.stage.towerIds ?? [];
      if (tids[1]) s.engine.buildTower('pad_2', tids[1]);
      if (tids[2]) s.engine.buildTower('pad_3', tids[2]);
      s.engine.startNextWave(false);
      for (let i = 0; i < 130; i += 1) s.tickSimulation(0.05);
    });
    await page.waitForTimeout(220);
    await page.screenshot({ path: 'docs/screenshots/v9_pho_ca_phe_combat.png' });

    expect(consoleErrors).toEqual([]);
    expect(externalRequests).toEqual([]);
  });

  test('Việc 10 — Phố Phan Đình Phùng (/#street_phan_dinh_phung): nền Cầu Quẹo riêng, ghim Phố 3 trên bản đồ Đà Lạt, hình Spark món/quái chạy mượt, 0 lỗi console, 0 mạng ngoài', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const consoleErrors: string[] = [];
    const externalRequests: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));
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

    // 1. Mở thẳng /#street_phan_dinh_phung
    await page.goto('/#street_phan_dinh_phung');
    await expect(page.getByTestId('td-wave-val')).toHaveText('0/12');
    const pdpInfo = await page.evaluate(() => {
      const s = (window as unknown as {
        __TD_SCENE__?: {
          placeholderMap: unknown;
          mapImage?: { texture?: { key?: string } };
          engine: { stage: { id: string } };
        };
      }).__TD_SCENE__;
      return {
        stageId: s?.engine.stage.id,
        hasPlaceholder: Boolean(s?.placeholderMap),
        mapKey: s?.mapImage?.texture?.key ?? '',
      };
    });
    expect(pdpInfo).toEqual({
      stageId: 'street_phan_dinh_phung',
      hasPlaceholder: false,
      mapKey: 'map_street_phan_dinh_phung',
    });

    // 2. Mở bảng đặt món ô 1 (hiện món Spark của Phố Phan Đình Phùng) & đặt 3 món -> gọi đợt 1 giao tranh
    await page.evaluate(() => {
      const s = (window as unknown as { __TD_SCENE__?: { selectPadById: (p: string) => void } }).__TD_SCENE__;
      s?.selectPadById('pad_1');
    });
    const buildSheet = page.getByTestId('td-build-sheet');
    await expect(buildSheet).toBeVisible();
    await page.waitForTimeout(160);
    await page.screenshot({ path: 'docs/screenshots/v10_phan_dinh_phung_build.png' });

    await buildSheet.locator('.td-build-option').first().click();
    await page.evaluate(() => {
      const s = (window as unknown as {
        __TD_SCENE__?: {
          engine: {
            essence: number;
            stage: { towerIds?: string[] };
            buildTower: (p: string, t: string) => unknown;
            startNextWave: (e: boolean) => unknown;
          };
          tickSimulation: (dt: number) => void;
        };
      }).__TD_SCENE__;
      if (!s) return;
      s.engine.essence = 500;
      const tids = s.engine.stage.towerIds ?? [];
      if (tids[1]) s.engine.buildTower('pad_3', tids[1]);
      if (tids[2]) s.engine.buildTower('pad_4', tids[2]);
      s.engine.startNextWave(false);
      for (let i = 0; i < 140; i += 1) s.tickSimulation(0.05);
    });
    await page.waitForTimeout(220);
    await page.screenshot({ path: 'docs/screenshots/v10_phan_dinh_phung_combat.png' });

    // 3. Về Màn Chính kiểm tra ghim Phố 3 Phan Đình Phùng hiện trên Bản đồ Đà Lạt
    await page.getByTestId('btn-pause-toggle').click();
    await page.getByTestId('btn-pause-title').click();
    const pdpPin = page.getByTestId('real-street-pin-street_phan_dinh_phung');
    await expect(pdpPin).toBeVisible();
    await pdpPin.scrollIntoViewIfNeeded();
    await pdpPin.click();
    await expect(page.getByTestId('real-street-detail')).toContainText('Phố Phan Đình Phùng');

    expect(consoleErrors).toEqual([]);
    expect(externalRequests).toEqual([]);
  });
});
