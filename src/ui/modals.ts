import { resolveSkillElement } from '../core/combat';
import { CONTENT } from '../core/contentRegistry';
import { ALL_ELEMENTS, ELEMENT_COUNTERS, ELEMENT_INFO } from '../core/elements';
import {
  computeEquipmentPowerScore,
  estimateCraftEquipment,
  getEquipmentSellPrice,
} from '../core/equipmentGen';
import {
  ALL_GUILD_IDS,
  ALL_SPOT_IDS,
  type GuildNewsEvent,
} from '../core/guildSystem';
import { ITEMS, SHOP_STOCK, getSellPrice } from '../core/inventory';
import { QUEST_REWARDS } from '../core/quests';
import { getSectAttitudeTier } from '../core/reputation';
import { SECTS } from '../core/skills';
import type {
  EquipmentAffix,
  EquipmentInstance,
  EquipmentSlot,
  QuestId,
  QuestStatus,
  SectId,
} from '../core/types';
import { decomposeWorldClock } from '../core/worldClock';
import { gameState } from '../game/gameState';
import type { DialogRequest } from '../game/inputBridge';
import { sound } from '../game/sound';

export type ActiveModal =
  | { kind: 'dialog'; req: DialogRequest }
  | { kind: 'shop'; tab: 'buy' | 'sell' }
  | { kind: 'bag' }
  | { kind: 'forge'; slot: EquipmentSlot; selectedUids: string[] }
  | { kind: 'guild_board'; tab: 'ranks' | 'spots' | 'siege' }
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

export function formatAffixLine(af: EquipmentAffix): string {
  const meta = CONTENT.affixes[af.type];
  if (af.type === 'elem_resist' && af.element) {
    return `${meta.name} (${ELEMENT_INFO[af.element].label}): +${Math.round(af.value * 100)}%`;
  }
  if (meta.unit === '%') {
    return `${meta.name}: +${Math.round(af.value * 100)}%`;
  }
  return `${meta.name}: +${af.value}`;
}

export function formatRolledItemTitle(inst: EquipmentInstance): string {
  const baseName = CONTENT.items[inst.baseItemId]?.name ?? inst.baseItemId;
  const rar = CONTENT.rarities[inst.rarity];
  return `[${rar.name} Cấp ${inst.itemLevel}] ${baseName}`;
}

export function formatRolledItemAffixes(inst: EquipmentInstance): string {
  return inst.affixes.map(formatAffixLine).join(' • ');
}

function formatNewsLine(ev: GuildNewsEvent): string {
  const actor = CONTENT.guilds[ev.actorGuildId].name;
  const target = ev.targetGuildId ? CONTENT.guilds[ev.targetGuildId].name : 'bãi vô chủ';
  const spot = ev.spotId ? CONTENT.huntingSpots[ev.spotId].name : '';
  const tag = `[T${ev.week}•N${ev.dayOfWeek} ${String(ev.hourOfDay).padStart(2, '0')}h]`;

  switch (ev.kind) {
    case 'spot_captured':
      return `${tag} ${actor} đã chiếm ${spot} (${target})!`;
    case 'spot_defended':
      return `${tag} ${actor} giữ vững ${spot} trước đợt tiến công của ${target}.`;
    case 'guild_leveled_up':
      return `${tag} ${actor} đã đột phá lên Cấp ${ev.value}!`;
    case 'siege_won':
      return `${tag} [CÔNG THÀNH] ${actor} hạ bệ ${target}, giành quyền làm chủ Thành Bế Các (Tuần ${ev.value})!`;
    case 'siege_defended':
      return `${tag} [CÔNG THÀNH] ${actor} thủ vững Thành Bế Các (Tuần ${ev.value})!`;
    case 'player_joined':
      return `${tag} Thiếu hiệp đã gia nhập ${actor}!`;
    case 'player_left':
      return `${tag} Thiếu hiệp đã rời ${actor}, trở lại làm khách độc hành.`;
  }
}

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

    if (req.choices && req.choices.length > 0) {
      const choiceList = document.createElement('div');
      choiceList.className = 'gh-list';
      choiceList.style.marginBottom = '10px';
      for (const ch of req.choices) {
        const cBtn = document.createElement('button');
        cBtn.className = 'gh-btn';
        cBtn.style.textAlign = 'left';
        cBtn.style.width = '100%';
        cBtn.innerHTML = `
          <div>${ch.label}</div>
          ${ch.sublabel ? `<div style="font-size:11px;font-weight:500;opacity:0.85;margin-top:2px">${ch.sublabel}</div>` : ''}
        `;
        cBtn.onclick = () => {
          sound.playUiClick();
          setModal(null);
          ch.onSelect();
        };
        choiceList.appendChild(cBtn);
      }
      box.appendChild(choiceList);
    }

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

    const totalSellables = d.inventory.length + d.rolledBag.length;
    const sellTab = document.createElement('button');
    sellTab.className = modal.tab === 'sell' ? 'gh-btn' : 'gh-btn gh-btn-secondary';
    sellTab.textContent = `Bán đồ trong túi (${totalSellables})`;
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
    } else if (d.inventory.length === 0 && d.rolledBag.length === 0) {
      list.innerHTML = '<div class="gh-item-desc">Túi đồ đang trống. Hãy đánh quái ở Rừng Thạch Mạch hoặc Lũng Đại Mạch để nhặt chiến lợi phẩm!</div>';
    } else {
      for (const inst of d.rolledBag) {
        const sellPrice = getEquipmentSellPrice(inst);
        const rar = CONTENT.rarities[inst.rarity];
        const row = document.createElement('div');
        row.className = 'gh-list-item';
        row.innerHTML = `
          <div class="gh-item-info">
            <strong style="color:${rar.colorHex}">${formatRolledItemTitle(inst)}</strong>
            <div class="gh-item-desc">${formatRolledItemAffixes(inst)} • Giá bán: ${sellPrice} Bạc</div>
          </div>
        `;
        const sellBtn = document.createElement('button');
        sellBtn.className = 'gh-btn gh-btn-secondary';
        sellBtn.textContent = `Bán +${sellPrice}`;
        sellBtn.onclick = () => {
          const res = gameState.sellRolledItem(inst.uid);
          if (res.success) {
            sound.playPickup();
            gameState.pushToast(`Đã bán ${formatRolledItemTitle(inst)} (+${res.gained} Bạc)`, '#e8c468');
          }
        };
        row.appendChild(sellBtn);
        list.appendChild(row);
      }
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
      <div class="gh-stat-pill"><strong>Chí mạng / Xuyên:</strong> +${Math.round((stats.critChanceBonus ?? 0) * 100)}% / +${Math.round((stats.armorPierceBonus ?? 0) * 100)}%</div>
      <div class="gh-stat-pill"><strong>Kháng hệ:</strong> ${stats.resistElement ? `${ELEMENT_INFO[stats.resistElement].label} ${Math.round(stats.resistBonus * 100)}%` : 'Chưa có'}</div>
    `;
    box.appendChild(statsGrid);

    const eqBox = document.createElement('div');
    eqBox.className = 'gh-list';
    eqBox.style.marginBottom = '12px';
    const slots: Array<{ label: string; slotKey: EquipmentSlot; id: string | null }> = [
      { label: 'Vũ khí đang cầm', slotKey: 'weapon', id: d.equipment.weapon },
      { label: 'Giáp đang mặc', slotKey: 'armor', id: d.equipment.armor },
      { label: 'Ngọc Ngũ Hành (đổi hệ Chiêu 1)', slotKey: 'charm', id: d.equipment.charm },
    ];
    for (const s of slots) {
      const rolledInst = d.equippedInstances[s.slotKey];
      const info = s.id ? CONTENT.items[s.id] : null;
      const row = document.createElement('div');
      row.className = 'gh-list-item';
      if (rolledInst) {
        const rar = CONTENT.rarities[rolledInst.rarity];
        row.innerHTML = `
          <div class="gh-item-info">
            <span style="color:#c2b399">${s.label}:</span>
            <strong style="color:${rar.colorHex}">${formatRolledItemTitle(rolledInst)}</strong>
            <div class="gh-item-desc">${info?.desc ?? ''} • ${formatRolledItemAffixes(rolledInst)}</div>
          </div>
        `;
      } else {
        row.innerHTML = `
          <div class="gh-item-info">
            <span style="color:#c2b399">${s.label}:</span> <strong>${info ? info.name : 'Chưa trang bị'}</strong>
            ${info ? `<div class="gh-item-desc">${info.desc}</div>` : ''}
          </div>
        `;
      }
      eqBox.appendChild(row);
    }
    box.appendChild(eqBox);

    const actionRow = document.createElement('div');
    actionRow.style.display = 'flex';
    actionRow.style.justifyContent = 'space-between';
    actionRow.style.alignItems = 'center';
    actionRow.style.marginBottom = '8px';
    actionRow.innerHTML = '<strong>Hành trang & Trang bị chỉ số ngẫu nhiên</strong>';
    const forgeShortcutBtn = document.createElement('button');
    forgeShortcutBtn.className = 'gh-btn gh-btn-cyan';
    forgeShortcutBtn.textContent = 'Ghép đồ Thợ Rèn (2–3 món)';
    forgeShortcutBtn.onclick = () => {
      sound.playUiClick();
      setModal({ kind: 'forge', slot: 'weapon', selectedUids: [] });
    };
    actionRow.appendChild(forgeShortcutBtn);
    box.appendChild(actionRow);

    const bagList = document.createElement('div');
    bagList.className = 'gh-list';
    if (d.inventory.length === 0 && d.rolledBag.length === 0) {
      bagList.innerHTML = '<div class="gh-item-desc">Chưa có vật phẩm nào trong túi.</div>';
    } else {
      for (const inst of d.rolledBag) {
        const rar = CONTENT.rarities[inst.rarity];
        const baseInfo = CONTENT.items[inst.baseItemId];
        const pwr = computeEquipmentPowerScore(inst);
        const row = document.createElement('div');
        row.className = 'gh-list-item';
        row.innerHTML = `
          <div class="gh-item-info">
            <strong style="color:${rar.colorHex}">${formatRolledItemTitle(inst)}</strong>
            <span class="gh-item-desc">(Lực chiến: ${pwr})</span>
            <div class="gh-item-desc">${baseInfo?.desc ?? ''} • ${formatRolledItemAffixes(inst)}</div>
          </div>
        `;
        const btn = document.createElement('button');
        btn.className = 'gh-btn';
        btn.textContent = 'Trang bị';
        btn.onclick = () => {
          if (gameState.equipRolledItem(inst.uid)) {
            sound.playUiClick();
            gameState.pushToast(`Đã trang bị ${formatRolledItemTitle(inst)}!`, rar.colorHex);
          }
        };
        row.appendChild(btn);
        bagList.appendChild(row);
      }

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
  } else if (modal.kind === 'forge') {
    const d = gameState.getData();
    addHeader(
      'Lò Rèn Lão Bính & Tiểu Bính — Ghép Đồ 2–3 Món',
      `Chọn 2 hoặc 3 trang bị ngẫu nhiên cùng loại để hợp luyện thành 1 món phẩm chất cao hơn • Bạc: ${d.silver} • Linh Thạch: ${d.spiritStones}`,
    );

    const slotTabs = document.createElement('div');
    slotTabs.className = 'gh-tabs';
    const slotDefs: Array<{ slot: EquipmentSlot; label: string }> = [
      { slot: 'weapon', label: 'Vũ khí' },
      { slot: 'armor', label: 'Giáp trụ' },
      { slot: 'charm', label: 'Ngọc Ngũ Hành' },
    ];
    for (const sd of slotDefs) {
      const count = d.rolledBag.filter((i) => i.slot === sd.slot).length;
      const b = document.createElement('button');
      b.className = modal.slot === sd.slot ? 'gh-btn' : 'gh-btn gh-btn-secondary';
      b.textContent = `${sd.label} (${count})`;
      b.onclick = () => {
        sound.playUiClick();
        setModal({ kind: 'forge', slot: sd.slot, selectedUids: [] });
      };
      slotTabs.appendChild(b);
    }
    box.appendChild(slotTabs);

    const candidates = d.rolledBag.filter((i) => i.slot === modal.slot);
    const validSelected = modal.selectedUids.filter((u) => candidates.some((c) => c.uid === u));
    const selectedItems = validSelected
      .map((u) => candidates.find((c) => c.uid === u))
      .filter((i): i is EquipmentInstance => Boolean(i));

    const previewBox = document.createElement('div');
    previewBox.className = 'gh-sect-bonus';
    previewBox.style.marginBottom = '10px';
    if (selectedItems.length >= 2) {
      const est = estimateCraftEquipment(selectedItems);
      const targetRar = CONTENT.rarities[est.targetRarity];
      previewBox.innerHTML = `
        <strong>Dự kiến hợp luyện (${selectedItems.length} món):</strong>
        Lên bậc <strong style="color:${targetRar.colorHex}">${targetRar.name} (Cấp ${est.targetItemLevel})</strong>
        ${selectedItems.length === 3 ? '• 20% cơ hội Đại Thành vượt bậc!' : ''}<br/>
        Chi phí: <strong>${est.silver} Bạc</strong>${est.spiritStones > 0 ? ` + <strong>${est.spiritStones} Linh Thạch</strong>` : ''}
      `;
    } else {
      previewBox.innerHTML =
        'Hãy chọn <strong>2 hoặc 3 món cùng loại</strong> bên dưới để xem phẩm chất dự kiến và tiến hành ghép đồ.';
    }
    box.appendChild(previewBox);

    const list = document.createElement('div');
    list.className = 'gh-list';
    if (candidates.length === 0) {
      list.innerHTML =
        '<div class="gh-item-desc">Chưa có trang bị ngẫu nhiên loại này trong túi. Hãy đánh quái ngoài bản đồ hoặc nhận thưởng nhiệm vụ để có phôi ghép!</div>';
    } else {
      for (const inst of candidates) {
        const isSel = validSelected.includes(inst.uid);
        const rar = CONTENT.rarities[inst.rarity];
        const row = document.createElement('div');
        row.className = 'gh-list-item';
        if (isSel) {
          row.style.borderColor = '#4cc9f0';
          row.style.background = 'rgba(28, 52, 68, 0.55)';
        }
        row.innerHTML = `
          <div class="gh-item-info">
            <strong style="color:${rar.colorHex}">${formatRolledItemTitle(inst)}</strong>
            <div class="gh-item-desc">${formatRolledItemAffixes(inst)}</div>
          </div>
        `;
        const toggleBtn = document.createElement('button');
        toggleBtn.className = isSel ? 'gh-btn gh-btn-cyan' : 'gh-btn gh-btn-secondary';
        toggleBtn.textContent = isSel ? 'Đã chọn ✓' : 'Chọn ghép';
        toggleBtn.onclick = () => {
          sound.playUiClick();
          let nextSel: string[];
          if (isSel) {
            nextSel = validSelected.filter((u) => u !== inst.uid);
          } else if (validSelected.length < 3) {
            nextSel = [...validSelected, inst.uid];
          } else {
            nextSel = [validSelected[1], validSelected[2], inst.uid];
          }
          setModal({ kind: 'forge', slot: modal.slot, selectedUids: nextSel });
        };
        row.appendChild(toggleBtn);
        list.appendChild(row);
      }
    }
    box.appendChild(list);

    const footer = document.createElement('div');
    footer.className = 'gh-modal-actions';
    const craftBtn = document.createElement('button');
    craftBtn.className = 'gh-btn';
    craftBtn.textContent = `Hợp Luyện Ngay (${selectedItems.length}/3)`;
    const est = estimateCraftEquipment(selectedItems);
    craftBtn.disabled =
      !est.valid || d.silver < est.silver || d.spiritStones < est.spiritStones;
    craftBtn.onclick = () => {
      const res = gameState.craftRolledItems(validSelected);
      if (res.success && res.result) {
        sound.playLevelUp();
        const rar = CONTENT.rarities[res.result.rarity];
        gameState.pushToast(
          `Ghép thành công: ${formatRolledItemTitle(res.result)}${res.criticalUpgrade ? ' (ĐẠI THÀNH!)' : ''}!`,
          rar.colorHex,
        );
        setModal({ kind: 'forge', slot: modal.slot, selectedUids: [] });
      }
    };
    footer.appendChild(craftBtn);
    box.appendChild(footer);
  } else if (modal.kind === 'guild_board') {
    const d = gameState.getData();
    const gw = d.guildWorld;
    const clock = decomposeWorldClock(gw.clockHours);
    const ownerMeta = CONTENT.guilds[gw.castleOwnerId];
    const playerGuildMeta = gw.playerGuildId ? CONTENT.guilds[gw.playerGuildId] : null;

    addHeader(
      'Đài Bảng Tin Giang Hồ — Bang Hội AI & Công Thành',
      `Tuần ${clock.week} • Ngày ${clock.dayOfWeek}/7 • ${String(clock.hourOfDay).padStart(2, '0')}:00 • Giữ Thành Bế Các: ${ownerMeta.name}`,
    );

    const statusBanner = document.createElement('div');
    statusBanner.className = 'gh-sect-bonus';
    statusBanner.style.marginBottom = '10px';
    statusBanner.innerHTML = `
      <strong>Thành chủ Thành Bế Các hiện tại:</strong> <span style="color:${ownerMeta.bannerColor}">${ownerMeta.name}</span>
      • <strong>Bang của bạn:</strong> ${playerGuildMeta ? `<span style="color:${playerGuildMeta.bannerColor}">${playerGuildMeta.name}</span>` : 'Khách độc hành (Chưa gia nhập)'}<br/>
      <span>Lịch Công Thành: Ngày 7 hằng tuần (18:00–22:00 giờ trong game) • Còn ${clock.hoursUntilNextSiege} giờ nữa tới kỳ Công Thành tiếp theo.</span>
    `;
    box.appendChild(statusBanner);

    const tabs = document.createElement('div');
    tabs.className = 'gh-tabs';
    const makeTab = (tabId: 'ranks' | 'spots' | 'siege', label: string): HTMLButtonElement => {
      const b = document.createElement('button');
      b.className = modal.tab === tabId ? 'gh-btn' : 'gh-btn gh-btn-secondary';
      b.textContent = label;
      b.onclick = () => {
        sound.playUiClick();
        setModal({ kind: 'guild_board', tab: tabId });
      };
      return b;
    };
    tabs.append(
      makeTab('ranks', '4 Bang Hội & Thứ Hạng'),
      makeTab('spots', '3 Bãi Mỏ & Tin Tức'),
      makeTab('siege', 'Công Thành Hằng Tuần'),
    );
    box.appendChild(tabs);

    const contentList = document.createElement('div');
    contentList.className = 'gh-list';

    if (modal.tab === 'ranks') {
      const sortedGuilds = [...ALL_GUILD_IDS]
        .map((id) => gw.guilds[id])
        .sort((a, b) => a.rank - b.rank);

      for (const g of sortedGuilds) {
        const meta = CONTENT.guilds[g.id];
        const isMember = gw.playerGuildId === g.id;
        const isCastleOwner = gw.castleOwnerId === g.id;
        const trendIcon =
          g.rankTrend === 'up'
            ? '<span style="color:#59c173">▲ Lên hạng</span>'
            : g.rankTrend === 'down'
              ? '<span style="color:#ef6351">▼ Xuống hạng</span>'
              : '<span style="color:#a0aec0">▬ Giữ hạng</span>';
        const spotNames =
          g.controlledSpots.length > 0
            ? g.controlledSpots.map((s) => CONTENT.huntingSpots[s].name).join(', ')
            : 'Chưa giữ bãi';

        const row = document.createElement('div');
        row.className = 'gh-list-item';
        row.innerHTML = `
          <div class="gh-item-info">
            <div>
              <span class="gh-badge" style="background:${meta.bannerColor}">Hạng #${g.rank}</span>
              <strong style="color:${meta.bannerColor};margin-left:6px">${meta.name}</strong>
              ${isCastleOwner ? '<span class="gh-badge" style="background:#ffd166;margin-left:4px">Giữ Thành Bế Các</span>' : ''}
              &nbsp;${trendIcon}
            </div>
            <div class="gh-item-desc" style="margin-top:3px">
              ${meta.styleLabel} • Cấp ${g.level} • Quân số: ${g.members}/${g.maxMembers} • Kho: ${g.spiritStones} Linh Thạch • Lực bang: ${g.powerScore}
            </div>
            <div class="gh-item-desc" style="color:#e8c468">
              Bãi đang chiếm: ${spotNames} • Quyết định AI: ${CONTENT.guildActions[g.lastAction]}
            </div>
          </div>
        `;

        const joinBtn = document.createElement('button');
        joinBtn.className = isMember ? 'gh-btn gh-btn-secondary' : 'gh-btn';
        joinBtn.textContent = isMember ? 'Rời bang' : 'Gia nhập';
        joinBtn.onclick = () => {
          sound.playUiClick();
          if (isMember) {
            gameState.leaveGuild();
            gameState.pushToast(`Đã rời ${meta.name}.`, '#e8c468');
          } else {
            gameState.joinGuild(g.id);
            gameState.pushToast(`Đã gia nhập ${meta.name}!`, meta.bannerColor);
          }
          setModal({ kind: 'guild_board', tab: 'ranks' });
        };
        row.appendChild(joinBtn);
        contentList.appendChild(row);
      }
    } else if (modal.tab === 'spots') {
      for (const sid of ALL_SPOT_IDS) {
        const sp = gw.spots[sid];
        const spotMeta = CONTENT.huntingSpots[sid];
        const owner = sp.ownerGuildId ? CONTENT.guilds[sp.ownerGuildId] : null;
        const elInfo = ELEMENT_INFO[sp.element];
        const row = document.createElement('div');
        row.className = 'gh-list-item';
        row.innerHTML = `
          <div class="gh-item-info">
            <strong>${spotMeta.name}</strong>
            <span class="gh-badge" style="background:${elInfo.colorHex};margin-left:6px">Mạch ${elInfo.label}</span>
            <div class="gh-item-desc">
              Vị trí: ${spotMeta.mapName} • Sản lượng: +${sp.stonesPerTick} Linh Thạch & +${sp.xpPerTick} KN bang / 6 giờ
            </div>
            <div class="gh-item-desc" style="margin-top:2px">
              Bang đang giữ: <strong style="color:${owner ? owner.bannerColor : '#a0aec0'}">${owner ? owner.name : 'Đang bỏ trống'}</strong>
            </div>
          </div>
        `;
        contentList.appendChild(row);
      }

      const simRow = document.createElement('div');
      simRow.className = 'gh-modal-actions';
      const advanceBtn = document.createElement('button');
      advanceBtn.className = 'gh-btn gh-btn-cyan';
      advanceBtn.textContent = 'Chuyển 6 giờ trong game (Bang AI hành động)';
      advanceBtn.onclick = () => {
        sound.playUiClick();
        gameState.advanceWorldHours(6);
        setModal({ kind: 'guild_board', tab: 'spots' });
      };
      simRow.appendChild(advanceBtn);
      contentList.appendChild(simRow);

      const newsHeader = document.createElement('div');
      newsHeader.style.fontWeight = '700';
      newsHeader.style.marginTop = '6px';
      newsHeader.textContent = 'Nhật ký Thế giới sống (Bang hội tự luyện cấp & tranh bãi)';
      contentList.appendChild(newsHeader);

      const recentNews = [...gw.newsLog].reverse().slice(0, 8);
      if (recentNews.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'gh-item-desc';
        empty.textContent = 'Chưa có biến động mới. Các bang hội sẽ tự hành động sau mỗi 6 giờ trong game!';
        contentList.appendChild(empty);
      } else {
        for (const ev of recentNews) {
          const nRow = document.createElement('div');
          nRow.className = 'gh-list-item';
          nRow.innerHTML = `<div class="gh-item-desc" style="color:#f4ead5">${formatNewsLine(ev)}</div>`;
          contentList.appendChild(nRow);
        }
      }
    } else {
      // Tab Công Thành hằng tuần
      const siegeCard = document.createElement('div');
      siegeCard.className = 'gh-list-item';
      siegeCard.style.flexDirection = 'column';
      siegeCard.style.alignItems = 'stretch';
      const pStats = gameState.getEffectiveStats();
      const playerContribution = Math.min(200, Math.round(pStats.atk * 2.2 + d.level * 18));

      siegeCard.innerHTML = `
        <div class="gh-item-info">
          <strong>Đại Chiến Công Thành Bế Các (Tuần ${clock.week})</strong>
          <div class="gh-item-desc" style="margin-top:4px">
            • Mỗi tuần 1 lần (Ngày 7, 20:00 giờ trong game), 4 bang hội giao chiến tại Sân Công Thành Bắc Môn để giành Thành Bế Các.<br/>
            • Bạn có thể cùng bang của mình phát động / tham chiến Công Thành ngay bên dưới (Đóng góp sức chiến đấu hiện tại của bạn: <strong>+${playerContribution} điểm công thành</strong>).
          </div>
        </div>
      `;

      const btnRow = document.createElement('div');
      btnRow.className = 'gh-modal-actions';
      const siegeBtn = document.createElement('button');
      siegeBtn.className = 'gh-btn';
      siegeBtn.textContent = gw.playerGuildId
        ? `Tham Chiến Công Thành Cùng ${CONTENT.guilds[gw.playerGuildId].name}`
        : 'Quan Sát Trận Công Thành Tuần Này';
      siegeBtn.onclick = () => {
        sound.playBossPhase();
        const res = gameState.runWeeklySiegeNow(gw.playerGuildId ? playerContribution : 0);
        const winMeta = CONTENT.guilds[res.winnerGuildId];
        if (gw.playerGuildId && res.winnerGuildId === gw.playerGuildId) {
          gameState.addCurrency(120, 6);
          gameState.pushToast(
            `Chiến thắng Công Thành Tuần ${res.week}! ${winMeta.name} làm chủ Thành Bế Các (+120 Bạc, +6 Linh Thạch)!`,
            '#ffd166',
          );
        } else {
          gameState.pushToast(
            `Kết quả Công Thành Tuần ${res.week}: ${winMeta.name} nắm giữ Thành Bế Các!`,
            winMeta.bannerColor,
          );
        }
        setModal({ kind: 'guild_board', tab: 'siege' });
      };
      btnRow.appendChild(siegeBtn);
      siegeCard.appendChild(btnRow);
      contentList.appendChild(siegeCard);

      const histTitle = document.createElement('div');
      histTitle.style.fontWeight = '700';
      histTitle.style.marginTop = '6px';
      histTitle.textContent = 'Chiến報 Công Thành các tuần gần nhất';
      contentList.appendChild(histTitle);

      const history = [...gw.siegeHistory].reverse();
      if (history.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'gh-item-desc';
        empty.textContent = 'Chưa có trận Công Thành nào diễn ra. Hãy bấm nút trên để mở chiến dịch Công Thành tuần này!';
        contentList.appendChild(empty);
      } else {
        for (const h of history) {
          const winMeta = CONTENT.guilds[h.winnerGuildId];
          const prevMeta = CONTENT.guilds[h.previousOwnerId];
          const scoresText = h.participants
            .map((p) => `${CONTENT.guilds[p.guildId].name}: ${p.siegeScore}`)
            .join(' • ');
          const row = document.createElement('div');
          row.className = 'gh-list-item';
          row.innerHTML = `
            <div class="gh-item-info">
              <strong>Tuần ${h.week}: <span style="color:${winMeta.bannerColor}">${winMeta.name}</span> ${h.defenderHeld ? 'thủ thành thành công' : `đoạt thành từ ${prevMeta.name}`}</strong>
              <div class="gh-item-desc">Điểm chiến công: ${scoresText}</div>
            </div>
          `;
          contentList.appendChild(row);
        }
      }
    }

    box.appendChild(contentList);
  } else if (modal.kind === 'quests') {
    const d = gameState.getData();
    const mq = d.mainQuestGd2;
    addHeader(
      'Nhật ký Nhiệm vụ & Thái độ 3 Môn Phái',
      'Lựa chọn trong nhiệm vụ chính sẽ thay đổi thiện cảm của Phổ Mộc Đường, Tỏa Kim Các và Hỏa Ấn Môn',
    );

    // Thanh thái độ 3 môn phái
    const repGrid = document.createElement('div');
    repGrid.className = 'gh-stats-grid';
    for (const sid of ['sect_open', 'sect_closed', 'sect_ban'] as SectId[]) {
      const score = d.sectReputation[sid];
      const tier = getSectAttitudeTier(score);
      const tierInfo = CONTENT.attitudeLabels[tier];
      const pill = document.createElement('div');
      pill.className = 'gh-stat-pill';
      pill.innerHTML = `
        <strong>${CONTENT.sects[sid].name}:</strong>
        <span style="color:${tierInfo.colorHex};font-weight:700">${tierInfo.label} (${score >= 0 ? `+${score}` : score})</span>
      `;
      repGrid.appendChild(pill);
    }
    box.appendChild(repGrid);

    // Khung nhiệm vụ chính Giai đoạn 2 (6 bước)
    const mqCard = document.createElement('div');
    mqCard.className = 'gh-sect-bonus';
    mqCard.style.marginBottom = '10px';
    if (mq.step === 0) {
      mqCard.innerHTML = `
        <strong>${CONTENT.mainQuestGd2.title}</strong><br/>
        <span>${CONTENT.mainQuestGd2.lockedHint}</span>
      `;
    } else {
      const stepMeta = CONTENT.mainQuestGd2.steps[mq.step] ?? CONTENT.mainQuestGd2.steps[7];
      mqCard.innerHTML = `
        <strong>${CONTENT.mainQuestGd2.title} — ${stepMeta.title}</strong><br/>
        <span>${stepMeta.summary}</span>
        ${mq.step <= 6 ? `<div style="color:#ffd166;margin-top:3px">Tiến độ bước ${mq.step}/6: ${mq.stepProgress}/${mq.stepTarget}</div>` : ''}
      `;
    }
    box.appendChild(mqCard);

    const list = document.createElement('div');
    list.className = 'gh-list';
    const order: QuestId[] = [
      'quest_boss',
      'quest_blacksmith',
      'quest_hallucination',
      'quest_fake_elder',
      'quest_stolen_manual',
      'quest_seal_breaker',
    ];
    for (const qid of order) {
      const prog = d.quests[qid];
      const meta = CONTENT.quests[qid];
      const reward = QUEST_REWARDS[qid];
      const stInfo = QUEST_STATUS_LABELS[prog.status];
      const rewardItem = reward.itemId
        ? CONTENT.items[reward.itemId]?.name
        : reward.rolledRewardRarity
          ? `Trang bị ${CONTENT.rarities[reward.rolledRewardRarity].name} ngẫu nhiên`
          : '';
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
      <strong>Mẹo cân bằng Ngũ Hành (Giai đoạn 1 &amp; 2):</strong><br/>
      • <strong>Ngọc Ngũ Hành</strong> đổi hệ <strong>Chiêu 1</strong> sang hệ của viên ngọc.<br/>
      • Trùm Động Tàn Cơ <strong>Sơ Giác (Thủy)</strong>: phái Hỏa nên đeo <strong>Ngọc Thổ Thạch</strong> (Chiêu 1 thành hệ Thổ khắc Thủy 1.35x).<br/>
      • Trùm Lũng Đại Mạch <strong>Vạn Chép (Kim)</strong>: phái Hỏa khắc trực tiếp 1.35x; phái Mộc nên đeo <strong>Ngọc Hỏa Tinh</strong> hoặc <strong>Ngọc Lõi Thức Tỉnh</strong> để đổi Chiêu 1 sang hệ Hỏa khắc Kim!
    `;
    box.append(list, tip);
  } else if (modal.kind === 'victory') {
    const d = gameState.getData();
    addHeader('Chiến Thắng Giang Hồ AI', 'Bạn cùng 3 khôi lỗi đồng đội đã vượt qua thử thách!');
    const body = document.createElement('div');
    body.className = 'gh-dialog-lines';
    body.innerHTML = `
      <p>Bạn cùng 3 khôi lỗi <strong>Thiết Xung</strong>, <strong>Mộc Tĩnh</strong>, <strong>Tích Linh</strong> đã khắc tên mình vào biên niên sử giang hồ thời khôi lỗi thức tỉnh.</p>
      <p><strong>Thành tích hiện tại:</strong> ${CONTENT.sects[d.sectId].name} • Cấp ${d.level} • ${d.silver} Bạc Vụn • ${d.spiritStones} Mảnh Linh Thạch.</p>
      <p>Tiến độ đã được tự động lưu vào máy. Hãy tiếp tục khám phá <strong>Thành Bế Các</strong>, <strong>Lũng Đại Mạch</strong> và tranh bá <strong>Công Thành hằng tuần</strong> cùng các bang hội AI!</p>
    `;
    box.appendChild(body);
  }

  backdrop.appendChild(box);
  host.appendChild(backdrop);
}
