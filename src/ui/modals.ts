import { resolveSkillElement } from '../core/combat';
import { CONTENT } from '../core/contentRegistry';
import { ALL_ELEMENTS, ELEMENT_COUNTERS, ELEMENT_INFO } from '../core/elements';
import { ITEMS, SHOP_STOCK, getSellPrice } from '../core/inventory';
import { QUEST_REWARDS } from '../core/quests';
import { SECTS } from '../core/skills';
import type { QuestId, QuestStatus } from '../core/types';
import { gameState } from '../game/gameState';
import type { DialogRequest } from '../game/inputBridge';
import { sound } from '../game/sound';

export type ActiveModal =
  | { kind: 'dialog'; req: DialogRequest }
  | { kind: 'shop'; tab: 'buy' | 'sell' }
  | { kind: 'bag' }
  | { kind: 'quests' }
  | { kind: 'elements' }
  | { kind: 'victory' }
  | null;

const QUEST_STATUS_LABELS: Record<QuestStatus, { text: string; color: string }> = {
  not_started: { text: 'Chưa nhận', color: '#a0aec0' },
  active: { text: 'Đang làm', color: '#ffd166' },
  ready: { text: 'Sẵn sàng trả', color: '#7bf1a8' },
  completed: { text: 'Hoàn thành', color: '#4cc9f0' },
};

export function renderModalContent(
  host: HTMLDivElement,
  modal: ActiveModal,
  setModal: (next: ActiveModal) => void,
): void {
  host.innerHTML = '';
  if (!modal) return;

  const backdrop = document.createElement('div');
  backdrop.className = 'gh-modal-backdrop';
  backdrop.addEventListener('click', (ev) => {
    if (ev.target === backdrop) {
      sound.playUiClick();
      setModal(null);
    }
  });

  const box = document.createElement('div');
  box.className = 'gh-modal';

  const addHeader = (title: string, subtitle?: string): void => {
    const head = document.createElement('div');
    head.className = 'gh-modal-head';
    head.innerHTML = `
      <div>
        <div class="gh-modal-title">${title}</div>
        ${subtitle ? `<div class="gh-modal-sub">${subtitle}</div>` : ''}
      </div>
    `;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'gh-btn gh-btn-secondary';
    closeBtn.textContent = 'Đóng';
    closeBtn.onclick = () => {
      sound.playUiClick();
      setModal(null);
    };
    head.appendChild(closeBtn);
    box.appendChild(head);
  };

  if (modal.kind === 'dialog') {
    const { req } = modal;
    addHeader(req.speaker, req.subtitle);

    const linesDiv = document.createElement('div');
    linesDiv.className = 'gh-dialog-lines';
    for (const line of req.lines) {
      const p = document.createElement('p');
      p.textContent = line;
      linesDiv.appendChild(p);
    }
    box.appendChild(linesDiv);

    const actions = document.createElement('div');
    actions.className = 'gh-modal-actions';

    if (req.secondaryLabel && req.onSecondary) {
      const secBtn = document.createElement('button');
      secBtn.className = 'gh-btn gh-btn-secondary';
      secBtn.textContent = req.secondaryLabel;
      secBtn.onclick = () => {
        sound.playUiClick();
        const fn = req.onSecondary;
        setModal(null);
        fn?.();
      };
      actions.appendChild(secBtn);
    }

    if (req.actionLabel) {
      const actBtn = document.createElement('button');
      actBtn.className = 'gh-btn';
      actBtn.textContent = req.actionLabel;
      actBtn.onclick = () => {
        sound.playUiClick();
        const fn = req.onAction;
        setModal(null);
        fn?.();
      };
      actions.appendChild(actBtn);
    }
    box.appendChild(actions);
  } else if (modal.kind === 'shop') {
    const d = gameState.getData();
    addHeader(
      'Chợ Khôi Lỗi Bến Đá — Bà Tư Chợ Đá',
      `Bạc hiện có: ${d.silver} Bạc Vụn • Mảnh Linh Thạch: ${d.spiritStones}`,
    );

    const tabs = document.createElement('div');
    tabs.className = 'gh-tabs';
    const buyTab = document.createElement('button');
    buyTab.className = modal.tab === 'buy' ? 'gh-btn' : 'gh-btn gh-btn-secondary';
    buyTab.textContent = 'Mua trang bị & Ngọc';
    buyTab.onclick = () => {
      sound.playUiClick();
      setModal({ kind: 'shop', tab: 'buy' });
    };

    const sellTab = document.createElement('button');
    sellTab.className = modal.tab === 'sell' ? 'gh-btn' : 'gh-btn gh-btn-secondary';
    sellTab.textContent = `Bán đồ trong túi (${d.inventory.length})`;
    sellTab.onclick = () => {
      sound.playUiClick();
      setModal({ kind: 'shop', tab: 'sell' });
    };
    tabs.append(buyTab, sellTab);
    box.appendChild(tabs);

    const list = document.createElement('div');
    list.className = 'gh-list';

    if (modal.tab === 'buy') {
      for (const itemId of SHOP_STOCK) {
        const def = ITEMS[itemId];
        const info = CONTENT.items[itemId];
        const row = document.createElement('div');
        row.className = 'gh-list-item';
        row.innerHTML = `
          <div class="gh-item-info">
            <strong>${info.name}</strong> <span style="color:#e8c468">(${def.price} Bạc)</span>
            <div class="gh-item-desc">${info.desc}</div>
          </div>
        `;
        const buyBtn = document.createElement('button');
        buyBtn.className = 'gh-btn';
        buyBtn.textContent = 'Mua';
        buyBtn.disabled = d.silver < def.price;
        buyBtn.onclick = () => {
          if (gameState.buyShopItem(itemId)) {
            sound.playPickup();
            gameState.pushToast(`Đã mua ${info.name} (-${def.price} Bạc)`, '#7bf1a8');
          }
        };
        row.appendChild(buyBtn);
        list.appendChild(row);
      }
    } else if (d.inventory.length === 0) {
      list.innerHTML = '<div class="gh-item-desc">Túi đồ đang trống. Hãy đánh quái ở Rừng Thạch Mạch để nhặt chiến lợi phẩm!</div>';
    } else {
      for (const entry of d.inventory) {
        const info = CONTENT.items[entry.itemId];
        const sellPrice = getSellPrice(entry.itemId);
        const row = document.createElement('div');
        row.className = 'gh-list-item';
        row.innerHTML = `
          <div class="gh-item-info">
            <strong>${info?.name ?? entry.itemId}</strong> x${entry.quantity}
            <div class="gh-item-desc">${info?.desc ?? ''} ${sellPrice > 0 ? `• Giá bán: ${sellPrice} Bạc` : '• Vật phẩm nhiệm vụ (không bán)'}</div>
          </div>
        `;
        const sellBtn = document.createElement('button');
        sellBtn.className = 'gh-btn gh-btn-secondary';
        sellBtn.textContent = sellPrice > 0 ? `Bán +${sellPrice}` : 'Giữ lại';
        sellBtn.disabled = sellPrice <= 0;
        sellBtn.onclick = () => {
          const res = gameState.sellBagItem(entry.itemId);
          if (res.success) {
            sound.playPickup();
            gameState.pushToast(`Đã bán ${info?.name ?? entry.itemId} (+${res.gained} Bạc)`, '#e8c468');
          }
        };
        row.appendChild(sellBtn);
        list.appendChild(row);
      }
    }
    box.appendChild(list);
  } else if (modal.kind === 'bag') {
    const d = gameState.getData();
    const stats = gameState.getEffectiveStats();
    const sectEl = SECTS[d.sectId].element;
    const skill1El = resolveSkillElement(1, sectEl, stats.imbueElement);

    addHeader(
      `Túi đồ & Trang bị — ${CONTENT.sects[d.sectId].name}`,
      `Cấp ${d.level} • ${d.silver} Bạc • ${d.spiritStones} Linh Thạch`,
    );

    const statsGrid = document.createElement('div');
    statsGrid.className = 'gh-stats-grid';
    statsGrid.innerHTML = `
      <div class="gh-stat-pill"><strong>Máu:</strong> ${Math.round(d.hp)} / ${stats.maxHp}</div>
      <div class="gh-stat-pill"><strong>Công:</strong> ${stats.atk}</div>
      <div class="gh-stat-pill"><strong>Thủ:</strong> ${stats.def}</div>
      <div class="gh-stat-pill"><strong>Hệ Chiêu 1:</strong> <span style="color:${ELEMENT_INFO[skill1El].colorHex}">${ELEMENT_INFO[skill1El].label}</span></div>
      <div class="gh-stat-pill"><strong>Kháng hệ:</strong> ${stats.resistElement ? `${ELEMENT_INFO[stats.resistElement].label} ${Math.round(stats.resistBonus * 100)}%` : 'Chưa có'}</div>
    `;
    box.appendChild(statsGrid);

    const eqBox = document.createElement('div');
    eqBox.className = 'gh-list';
    eqBox.style.marginBottom = '12px';
    const slots: Array<{ label: string; id: string | null }> = [
      { label: 'Vũ khí đang cầm', id: d.equipment.weapon },
      { label: 'Giáp đang mặc', id: d.equipment.armor },
      { label: 'Ngọc Ngũ Hành (đổi hệ Chiêu 1)', id: d.equipment.charm },
    ];
    for (const s of slots) {
      const info = s.id ? CONTENT.items[s.id] : null;
      const row = document.createElement('div');
      row.className = 'gh-list-item';
      row.innerHTML = `
        <div class="gh-item-info">
          <span style="color:#c2b399">${s.label}:</span> <strong>${info ? info.name : 'Chưa trang bị'}</strong>
          ${info ? `<div class="gh-item-desc">${info.desc}</div>` : ''}
        </div>
      `;
      eqBox.appendChild(row);
    }
    box.appendChild(eqBox);

    const bagTitle = document.createElement('div');
    bagTitle.style.fontWeight = '700';
    bagTitle.style.marginBottom = '6px';
    bagTitle.textContent = 'Hành trang';
    box.appendChild(bagTitle);

    const bagList = document.createElement('div');
    bagList.className = 'gh-list';
    if (d.inventory.length === 0) {
      bagList.innerHTML = '<div class="gh-item-desc">Chưa có vật phẩm nào trong túi.</div>';
    } else {
      for (const entry of d.inventory) {
        const def = ITEMS[entry.itemId];
        const info = CONTENT.items[entry.itemId];
        const row = document.createElement('div');
        row.className = 'gh-list-item';
        row.innerHTML = `
          <div class="gh-item-info">
            <strong>${info?.name ?? entry.itemId}</strong> x${entry.quantity}
            <div class="gh-item-desc">${info?.desc ?? ''}</div>
          </div>
        `;
        if (def && (def.kind === 'weapon' || def.kind === 'armor' || def.kind === 'charm')) {
          const btn = document.createElement('button');
          btn.className = 'gh-btn';
          btn.textContent = 'Trang bị';
          btn.onclick = () => {
            if (gameState.equipBagItem(entry.itemId)) {
              sound.playUiClick();
              gameState.pushToast(`Đã trang bị ${info?.name ?? entry.itemId}!`, '#e8c468');
            }
          };
          row.appendChild(btn);
        } else if (def && def.kind === 'consumable') {
          const btn = document.createElement('button');
          btn.className = 'gh-btn gh-btn-cyan';
          btn.textContent = 'Dùng';
          btn.onclick = () => {
            const res = gameState.useConsumable(entry.itemId);
            if (res.used) {
              sound.playHeal();
              gameState.pushToast(`Đã dùng ${info?.name} (+${res.healAmount} HP)!`, '#7bf1a8');
            }
          };
          row.appendChild(btn);
        }
        bagList.appendChild(row);
      }
    }
    box.appendChild(bagList);
  } else if (modal.kind === 'quests') {
    const d = gameState.getData();
    addHeader('Nhật ký Nhiệm vụ', 'Hoàn thành nhiệm vụ phụ để lấy trang bị & Ngọc Ngũ Hành trước khi đánh Sơ Giác');

    const list = document.createElement('div');
    list.className = 'gh-list';
    const order: QuestId[] = ['quest_boss', 'quest_blacksmith', 'quest_hallucination'];
    for (const qid of order) {
      const prog = d.quests[qid];
      const meta = CONTENT.quests[qid];
      const reward = QUEST_REWARDS[qid];
      const stInfo = QUEST_STATUS_LABELS[prog.status];
      const rewardItem = reward.itemId ? CONTENT.items[reward.itemId]?.name : '';
      const row = document.createElement('div');
      row.className = 'gh-list-item';
      row.innerHTML = `
        <div class="gh-item-info">
          <strong>${meta.title}</strong>
          <div class="gh-item-desc">${meta.summary}</div>
          <div class="gh-item-desc" style="color:#e8c468;margin-top:3px">
            Tiến độ: ${prog.count}/${prog.targetCount} • Thưởng: ${reward.silver} Bạc, ${reward.spiritStones} Linh Thạch, ${reward.xp} KN${rewardItem ? `, ${rewardItem}` : ''}
          </div>
        </div>
        <span class="gh-badge" style="background:${stInfo.color};white-space:nowrap">${stInfo.text}</span>
      `;
      list.appendChild(row);
    }
    box.appendChild(list);
  } else if (modal.kind === 'elements') {
    addHeader('Vòng Ngũ Hành & 3 Đồng đội AI Khôi Lỗi', 'Khắc chế: 1.35x sát thương • Bị khắc: 0.75x sát thương');

    const list = document.createElement('div');
    list.className = 'gh-list';
    for (const el of ALL_ELEMENTS) {
      const target = ELEMENT_COUNTERS[el];
      const row = document.createElement('div');
      row.className = 'gh-list-item';
      row.innerHTML = `
        <div class="gh-item-info">
          <span class="gh-badge" style="background:${ELEMENT_INFO[el].colorHex}">${ELEMENT_INFO[el].label}</span>
          &nbsp;khắc&nbsp;
          <span class="gh-badge" style="background:${ELEMENT_INFO[target].colorHex}">${ELEMENT_INFO[target].label}</span>
          <span class="gh-item-desc"> &nbsp;(1.35x sát thương)</span>
        </div>
      `;
      list.appendChild(row);
    }

    const tip = document.createElement('div');
    tip.className = 'gh-sect-bonus';
    tip.style.marginTop = '10px';
    tip.innerHTML = `
      <strong>Mẹo cân bằng Ngũ Hành:</strong><br/>
      • <strong>Ngọc Ngũ Hành</strong> (mua ở Bà Tư Chợ Đá hoặc nhặt từ quái) đổi hệ <strong>Chiêu 1</strong> sang hệ của viên ngọc!<br/>
      • Phái <strong>Hỏa Ấn Môn</strong> gặp Trùm <strong>Sơ Giác (Thủy)</strong> nên đeo <strong>Ngọc Thổ Thạch</strong> (Chiêu 1 thành hệ Thổ khắc Thủy 1.35x) hoặc <strong>Ngọc Thủy Mạch</strong> (kháng Thủy 28%).<br/>
      • 3 Khôi Lỗi tự hành bằng cây quyết định: <strong>Thiết Xung</strong> (Liều — xông thẳng), <strong>Mộc Tĩnh</strong> (Cẩn thận — hồi máu & giữ tầm), <strong>Tích Linh</strong> (Tham đồ — chạy nhặt đồ & kết liễu quái yếu).
    `;
    box.append(list, tip);
  } else if (modal.kind === 'victory') {
    const d = gameState.getData();
    addHeader('Hoàn thành Giai đoạn 1 — Giang Hồ AI', 'Sơ Giác — Khôi Lỗi Số Không đã khuất phục!');
    const body = document.createElement('div');
    body.className = 'gh-dialog-lines';
    body.innerHTML = `
      <p>Bạn cùng 3 khôi lỗi <strong>Thiết Xung</strong>, <strong>Mộc Tĩnh</strong>, <strong>Tích Linh</strong> đã chinh phục Động Tàn Cơ và nghe trọn câu hỏi của khôi lỗi đầu tiên thức tỉnh.</p>
      <p><strong>Thành tích hiện tại:</strong> ${CONTENT.sects[d.sectId].name} • Cấp ${d.level} • ${d.silver} Bạc Vụn • ${d.spiritStones} Mảnh Linh Thạch.</p>
      <p>Tiến độ đã được tự động lưu vào máy. Bạn có thể tiếp tục khám phá Thành Lam Lư, Rừng Thạch Mạch hoặc thử môn phái khác!</p>
    `;
    box.appendChild(body);
  }

  backdrop.appendChild(box);
  host.appendChild(backdrop);
}
