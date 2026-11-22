import { expect, test, type Page } from '@playwright/test';

interface RuntimeProbe {
  sceneKey: string | null;
  x: number;
  y: number;
  bossActive: boolean;
}

async function setupOfflineAndErrorGuards(page: Page): Promise<{
  consoleErrors: string[];
  pageErrors: string[];
  externalRequests: string[];
}> {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  // Chặn hoàn toàn mọi kết nối ra mạng ngoài; chỉ cho phép máy chủ cục bộ dist/
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    const isLocal =
      url.startsWith('http://127.0.0.1:') ||
      url.startsWith('http://localhost:') ||
      url.startsWith('data:') ||
      url.startsWith('blob:');
    if (!isLocal) {
      externalRequests.push(url);
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });

  return { consoleErrors, pageErrors, externalRequests };
}

async function probeWorld(page: Page): Promise<RuntimeProbe> {
  return page.evaluate(() => {
    const g = (window as unknown as { __GIANG_HO_GAME__?: { scene?: { scenes?: Array<Record<string, unknown>> } } })
      .__GIANG_HO_GAME__;
    const scenes = g?.scene?.scenes ?? [];
    for (const sc of scenes) {
      const sys = sc.sys as { isActive?: () => boolean; settings?: { key?: string } } | undefined;
      const key = sys?.settings?.key ?? null;
      if (sys?.isActive?.() && key && key !== 'UIScene' && key !== 'BootScene' && key !== 'TitleScene') {
        const px = typeof sc.playerX === 'number' ? sc.playerX : 0;
        const py = typeof sc.playerY === 'number' ? sc.playerY : 0;
        const bossEl = document.querySelector('.gh-boss-bar') as HTMLElement | null;
        const bossActive = Boolean(bossEl && getComputedStyle(bossEl).display !== 'none');
        return { sceneKey: key, x: px, y: py, bossActive };
      }
    }
    return { sceneKey: null, x: 0, y: 0, bossActive: false };
  });
}

async function walkTowards(
  page: Page,
  targetX: number,
  targetY: number,
  options: {
    stopWhenScene?: string;
    stopWhenBossVisible?: boolean;
    tolerance?: number;
    maxSteps?: number;
  } = {},
): Promise<RuntimeProbe> {
  const tolerance = options.tolerance ?? 28;
  const maxSteps = options.maxSteps ?? 140;
  const held = new Set<string>();

  const syncKey = async (code: string, wantDown: boolean): Promise<void> => {
    if (wantDown && !held.has(code)) {
      await page.keyboard.down(code);
      held.add(code);
    } else if (!wantDown && held.has(code)) {
      await page.keyboard.up(code);
      held.delete(code);
    }
  };

  const releaseAll = async (): Promise<void> => {
    for (const code of Array.from(held)) {
      await page.keyboard.up(code);
      held.delete(code);
    }
  };

  try {
    let last = await probeWorld(page);
    for (let step = 0; step < maxSteps; step++) {
      last = await probeWorld(page);

      if (options.stopWhenScene && last.sceneKey === options.stopWhenScene) {
        return last;
      }
      if (options.stopWhenBossVisible) {
        const modalVisible = await page.locator('.gh-modal-title').isVisible().catch(() => false);
        if (last.bossActive || modalVisible) {
          return last;
        }
      }

      const dx = targetX - last.x;
      const dy = targetY - last.y;
      if (Math.hypot(dx, dy) <= tolerance) {
        return last;
      }

      await syncKey('KeyD', dx > 14);
      await syncKey('KeyA', dx < -14);
      await syncKey('KeyS', dy > 14);
      await syncKey('KeyW', dy < -14);

      // Dùng chiêu hồi máu / bình khi băng qua quái ngoài rừng/hang
      if (last.sceneKey !== 'TownScene') {
        if (step % 10 === 4) {
          await page.keyboard.press('Digit3');
        } else if (step % 14 === 10) {
          await page.keyboard.press('KeyQ');
        }
      }

      await page.waitForTimeout(80);
    }
    return last;
  } finally {
    await releaseAll();
  }
}

test.describe('Giang Hồ AI — Kiểm thử tự động trình duyệt (bản build offline)', () => {
  test('chọn phái → vào Thành Lam Lư → sang Rừng Thạch Mạch → xuống Động Tàn Cơ → thấy Trùm Sơ Giác (không lỗi console, không gọi mạng ngoài)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const guards = await setupOfflineAndErrorGuards(page);

    await page.goto('/');
    await expect(page.locator('#gh-title-overlay')).toBeVisible();

    // 1. Chọn phái Phổ Mộc Đường
    await page.getByRole('button', { name: 'Chọn Phổ Mộc Đường' }).click();
    await expect(page.locator('#gh-hud-overlay')).toBeVisible();
    await expect(page.locator('.gh-hud-top-center .gh-map-pill')).toHaveText('Thành Lam Lư');

    // 2. Đi từ Thành Lam Lư qua Cổng Đông sang Rừng Thạch Mạch
    const afterTown = await walkTowards(page, 1365, 480, {
      stopWhenScene: 'ForestScene',
      maxSteps: 180,
    });
    expect(afterTown.sceneKey, `Expected ForestScene, got ${JSON.stringify(afterTown)}`).toBe('ForestScene');
    await expect(page.locator('.gh-hud-top-center .gh-map-pill')).toHaveText('Rừng Thạch Mạch');

    // 3. Băng qua Rừng Thạch Mạch (vòng tránh tảng đá trung tâm) xuống Cửa Hầm Mỏ Sâu vào Động Tàn Cơ
    await walkTowards(page, 820, 620, { stopWhenScene: 'CaveScene', tolerance: 36, maxSteps: 140 });
    await walkTowards(page, 1340, 620, { stopWhenScene: 'CaveScene', tolerance: 36, maxSteps: 140 });
    await walkTowards(page, 1460, 865, { stopWhenScene: 'CaveScene', tolerance: 36, maxSteps: 140 });
    const afterForest = await walkTowards(page, 1700, 865, {
      stopWhenScene: 'CaveScene',
      maxSteps: 120,
    });
    expect(afterForest.sceneKey, `Expected CaveScene, got ${JSON.stringify(afterForest)}`).toBe('CaveScene');
    await expect(page.locator('.gh-hud-top-center .gh-map-pill')).toHaveText('Động Tàn Cơ');

    // 4. Tiến sâu vào Động Tàn Cơ gặp Trùm Sơ Giác
    await walkTowards(page, 940, 480, {
      stopWhenBossVisible: true,
      maxSteps: 120,
    });

    // Thấy hộp thoại mở đầu của Trùm Sơ Giác hoặc thanh máu Trùm trên HUD
    const bossDialogTitle = page.locator('.gh-modal-title');
    if (await bossDialogTitle.isVisible()) {
      await expect(bossDialogTitle).toContainText('Sơ Giác');
      await page.getByRole('button', { name: 'Nghênh chiến!' }).click();
    }
    await expect(page.locator('.gh-boss-bar')).toBeVisible();
    await expect(page.locator('.gh-boss-bar')).toContainText('Sơ Giác');

    expect(guards.externalRequests).toEqual([]);
    expect(guards.pageErrors).toEqual([]);
    expect(guards.consoleErrors).toEqual([]);
  });

  test('điện thoại cầm dọc: thu gọn tổ đội & nút ≡, bản đồ thấy ≥ 2/3 màn hình, thông báo không đè Linh Dịch / Dầu Chốt', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const guards = await setupOfflineAndErrorGuards(page);

    await page.goto('/');
    await expect(page.locator('#gh-title-overlay')).toBeVisible();
    await page.getByRole('button', { name: 'Chọn Hỏa Ấn Môn' }).click();
    await expect(page.locator('#gh-hud-overlay')).toBeVisible();

    // Bảng tổ đội mặc định thu gọn, bấm mở được
    const alliesBox = page.getByTestId('allies-box');
    const alliesToggle = page.getByTestId('allies-toggle');
    await expect(alliesToggle).toBeVisible();
    await expect(alliesBox).toBeHidden();

    // Hàng nút trên cùng gom vào nút "≡", bấm mở ra được thực đơn
    const menuBtn = page.getByTestId('mobile-menu-toggle');
    const utilBar = page.getByTestId('util-bar');
    await expect(menuBtn).toBeVisible();
    await expect(menuBtn).toHaveText('≡');
    await expect(utilBar).toBeHidden();

    // Thông báo "Đã đến Thành Lam Lư" hiện rõ và KHÔNG đè lên nút Linh Dịch / Dầu Chốt
    const toast = page.locator('.gh-toast').first();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Đã đến Thành Lam Lư');

    const metrics = await page.evaluate(() => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const topLeft = document.querySelector('.gh-hud-top-left')!.getBoundingClientRect();
      const topRight = document.querySelector('.gh-hud-top-right')!.getBoundingClientRect();
      const joystick = document.querySelector('.gh-joystick-zone')!.getBoundingClientRect();
      const controlsRight = document.querySelector('.gh-controls-right')!.getBoundingClientRect();
      const toastRect = document.querySelector('.gh-toast')!.getBoundingClientRect();
      const potionRects = Array.from(document.querySelectorAll('.gh-potion-btn')).map((el) =>
        el.getBoundingClientRect(),
      );

      const intersects = (a: DOMRect, b: DOMRect): boolean =>
        a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

      const topEdge = Math.max(topLeft.bottom, topRight.bottom);
      const bottomEdge = Math.min(joystick.top, controlsRight.top);
      const clearHeightRatio = (bottomEdge - topEdge) / vh;
      const hudArea =
        topLeft.width * topLeft.height +
        topRight.width * topRight.height +
        joystick.width * joystick.height +
        controlsRight.width * controlsRight.height;
      const freeAreaRatio = 1 - hudArea / (vw * vh);
      const toastOverlapsPotion = potionRects.some((r) => intersects(toastRect, r));

      return { clearHeightRatio, freeAreaRatio, toastOverlapsPotion, toastBottom: toastRect.bottom, bottomEdge };
    });

    expect(metrics.toastOverlapsPotion).toBe(false);
    expect(metrics.toastBottom).toBeLessThan(metrics.bottomEdge);
    expect(metrics.clearHeightRatio).toBeGreaterThanOrEqual(2 / 3);
    expect(metrics.freeAreaRatio).toBeGreaterThanOrEqual(2 / 3);

    // Kiểm tra tương tác mở rộng tổ đội và nút ≡
    await alliesToggle.click();
    await expect(alliesBox).toBeVisible();
    await alliesToggle.click();
    await expect(alliesBox).toBeHidden();

    await menuBtn.click();
    await expect(utilBar).toBeVisible();
    await page.getByRole('button', { name: 'Bang Hội (G)' }).click();
    await expect(page.locator('.gh-modal')).toBeVisible();
    await expect(utilBar).toBeHidden();

    // Ghi chú REVIEW_LOG #2: Bảng tin bang hội phải đọc được đầy đủ trên điện thoại dọc, không tràn màn hình
    await expect(page.locator('.gh-modal')).toContainText('Đài Bảng Tin Giang Hồ');
    await expect(page.locator('.gh-modal')).toContainText('Cương Lô Hội');
    await expect(page.locator('.gh-modal')).toContainText('Mộc Khế Bang');
    await expect(page.locator('.gh-modal')).toContainText('Thủy Kính Minh');
    await expect(page.locator('.gh-modal')).toContainText('Diệm Giới Đoàn');

    const boardFitsViewport = await page.evaluate(() => {
      const m = document.querySelector('.gh-modal')!.getBoundingClientRect();
      return m.left >= 0 && m.right <= window.innerWidth && m.top >= 0 && m.bottom <= window.innerHeight;
    });
    expect(boardFitsViewport).toBe(true);

    // Chuyển qua tab bãi mỏ và tab công thành trên điện thoại dọc
    await page.getByRole('button', { name: '3 Bãi Mỏ & Tin Tức' }).click();
    await expect(page.locator('.gh-modal')).toContainText('Bãi Mỏ Tinh Lam');
    await expect(page.locator('.gh-modal')).toContainText('Hẻm Đứt Bùa');
    await expect(page.locator('.gh-modal')).toContainText('Khe Vỡ Khung Đồng');

    await page.getByRole('button', { name: 'Công Thành Hằng Tuần' }).click();
    await expect(page.locator('.gh-modal')).toContainText('Đại Chiến Công Thành Bế Các');
    await page.getByRole('button', { name: 'Đóng' }).click();

    expect(guards.externalRequests).toEqual([]);
    expect(guards.pageErrors).toEqual([]);
    expect(guards.consoleErrors).toEqual([]);
  });

  test('Giai đoạn 2: đi bộ từ Thành Lam Lư → Rừng Thạch Mạch → Thành Bế Các → Lũng Đại Mạch → thấy Trùm Vạn Chép', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const guards = await setupOfflineAndErrorGuards(page);

    await page.goto('/');
    await expect(page.locator('#gh-title-overlay')).toBeVisible();

    // 1. Chọn Hỏa Ấn Môn (Hệ Hỏa khắc Kim của Trùm Vạn Chép)
    await page.getByRole('button', { name: 'Chọn Hỏa Ấn Môn' }).click();
    await expect(page.locator('#gh-hud-overlay')).toBeVisible();
    await expect(page.locator('.gh-hud-top-center .gh-map-pill')).toHaveText('Thành Lam Lư');

    // 2. Đi bộ qua Cổng Đông Thành Lam Lư ra Rừng Thạch Mạch
    const inForest = await walkTowards(page, 1365, 480, {
      stopWhenScene: 'ForestScene',
      maxSteps: 180,
    });
    expect(inForest.sceneKey).toBe('ForestScene');
    await expect(page.locator('.gh-hud-top-center .gh-map-pill')).toHaveText('Rừng Thạch Mạch');

    // 3. Từ Rừng Thạch Mạch đi tới Ngã Ba Sương Độc rồi rẽ lên Cổng Bắc vào Thành Bế Các
    await walkTowards(page, 645, 530, { stopWhenScene: 'InnerCityScene', tolerance: 32, maxSteps: 140 });
    const inInnerCity = await walkTowards(page, 645, 25, {
      stopWhenScene: 'InnerCityScene',
      maxSteps: 140,
    });
    expect(inInnerCity.sceneKey, `Expected InnerCityScene, got ${JSON.stringify(inInnerCity)}`).toBe('InnerCityScene');
    await expect(page.locator('.gh-hud-top-center .gh-map-pill')).toHaveText('Thành Bế Các');

    // 4. Băng qua Đài Bảng Tin Giang Hồ tới Cổng Đông Thành Bế Các để sang Lũng Đại Mạch
    await walkTowards(page, 700, 520, { stopWhenScene: 'ValleyScene', tolerance: 36, maxSteps: 120 });
    const inValley = await walkTowards(page, 1440, 490, {
      stopWhenScene: 'ValleyScene',
      maxSteps: 160,
    });
    expect(inValley.sceneKey, `Expected ValleyScene, got ${JSON.stringify(inValley)}`).toBe('ValleyScene');
    await expect(page.locator('.gh-hud-top-center .gh-map-pill')).toHaveText('Lũng Đại Mạch');

    // 5. Đi xuyên Lũng Đại Mạch xuống Tế Đàn Lõi Trầm gặp Trùm Vạn Chép — Khôi Lỗi Hợp Lõi
    await walkTowards(page, 880, 500, { stopWhenBossVisible: true, tolerance: 36, maxSteps: 140 });
    await walkTowards(page, 1300, 660, { stopWhenBossVisible: true, tolerance: 36, maxSteps: 120 });
    await walkTowards(page, 1500, 790, {
      stopWhenBossVisible: true,
      maxSteps: 120,
    });

    const bossDialogTitle = page.locator('.gh-modal-title');
    if (await bossDialogTitle.isVisible()) {
      await expect(bossDialogTitle).toContainText('Vạn Chép');
      await page.getByRole('button', { name: 'Nghênh chiến!' }).click();
    }
    await expect(page.locator('.gh-boss-bar')).toBeVisible();
    await expect(page.locator('.gh-boss-bar')).toContainText('Vạn Chép');

    expect(guards.externalRequests).toEqual([]);
    expect(guards.pageErrors).toEqual([]);
    expect(guards.consoleErrors).toEqual([]);
  });

  test('mở được bản lưu cũ từ Giai đoạn 1 (giang_ho_ai_save_v1) không mất cấp, đồ hay nhiệm vụ', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const guards = await setupOfflineAndErrorGuards(page);

    const legacyV1 = {
      version: 1,
      savedAt: 1732200000000,
      sectId: 'sect_closed',
      mapId: 'map_forest',
      playerPos: { x: 640, y: 540 },
      level: 4,
      xp: 80,
      hp: 210,
      silver: 275,
      spiritStones: 9,
      equipment: {
        weapon: 'wpn_blacksmith_blade',
        armor: 'arm_bronze_mail',
        charm: 'chm_tho',
      },
      inventory: [
        { itemId: 'pot_heal_small', quantity: 5 },
        { itemId: 'pot_ally_oil', quantity: 2 },
        { itemId: 'chm_thuy', quantity: 1 },
      ],
      quests: {
        quest_blacksmith: { status: 'completed', count: 3, targetCount: 3 },
        quest_hallucination: { status: 'active', count: 0, targetCount: 1 },
        quest_boss: { status: 'active', count: 0, targetCount: 1 },
      },
      allies: [
        { id: 'ally_reckless', hp: 110 },
        { id: 'ally_cautious', hp: 115 },
        { id: 'ally_greedy', hp: 95 },
      ],
      bossDefeated: false,
    };

    await page.addInitScript((payload) => {
      window.localStorage.clear();
      window.localStorage.setItem('giang_ho_ai_save_v1', JSON.stringify(payload));
    }, legacyV1);

    await page.goto('/');
    await expect(page.locator('.gh-continue-bar')).toBeVisible();
    await expect(page.locator('.gh-continue-bar')).toContainText('Tỏa Kim Các');
    await expect(page.locator('.gh-continue-bar')).toContainText('Cấp 4');
    await expect(page.locator('.gh-continue-bar')).toContainText('Rừng Thạch Mạch');

    await page.getByRole('button', { name: 'Tiếp tục chơi' }).click();
    await expect(page.locator('#gh-hud-overlay')).toBeVisible();
    await expect(page.locator('.gh-hud-top-center .gh-map-pill')).toHaveText('Rừng Thạch Mạch');
    await expect(page.locator('.gh-player-name')).toContainText('Cấp 4');
    await expect(page.locator('.gh-currency-row')).toContainText('275');

    // Mở túi đồ kiểm tra trang bị & vật phẩm còn nguyên
    await page.getByRole('button', { name: 'Túi đồ (I)' }).click();
    await expect(page.locator('.gh-modal')).toContainText('Đao Rèn Lão Bính');
    await expect(page.locator('.gh-modal')).toContainText('Ngọc Thủy Mạch');
    await page.getByRole('button', { name: 'Đóng' }).click();

    // Mở nhiệm vụ kiểm tra trạng thái nhiệm vụ còn nguyên
    await page.getByRole('button', { name: 'Nhiệm vụ (M)' }).click();
    await expect(page.locator('.gh-modal')).toContainText('Hoàn thành');
    await expect(page.locator('.gh-modal')).toContainText('Đang làm');

    expect(guards.externalRequests).toEqual([]);
    expect(guards.pageErrors).toEqual([]);
    expect(guards.consoleErrors).toEqual([]);
  });
});
