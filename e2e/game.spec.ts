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
});
