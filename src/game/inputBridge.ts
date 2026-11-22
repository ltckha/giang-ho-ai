import type { Vec2 } from '../core/types';

export interface DialogRequest {
  speaker: string;
  subtitle?: string;
  lines: string[];
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export interface WorldActionHandlers {
  castSkill: (slot: 1 | 2 | 3 | 4) => void;
  interact: () => void;
  usePotion: (itemId: 'pot_heal_small' | 'pot_ally_oil') => void;
  returnToTown: () => void;
  returnToTitle: () => void;
}

export interface UiModalHandlers {
  openDialog: (req: DialogRequest) => void;
  openShop: () => void;
  openBag: () => void;
  openQuests: () => void;
  openElementsGuide: () => void;
  openVictory: () => void;
  closeAll: () => void;
}

/**
 * Cầu nối điều khiển cảm ứng (joystick ảo, nút chiêu thức) & hộp thoại giữa UIScene và các WorldScene.
 */
class InputBridge {
  public touchMove: Vec2 = { x: 0, y: 0 };
  public isModalOpen = false;

  private worldHandlers: WorldActionHandlers | null = null;
  private uiHandlers: UiModalHandlers | null = null;

  public registerWorld(handlers: WorldActionHandlers): void {
    this.worldHandlers = handlers;
  }

  public unregisterWorld(handlers: WorldActionHandlers): void {
    if (this.worldHandlers === handlers) {
      this.worldHandlers = null;
    }
  }

  public registerUi(handlers: UiModalHandlers): void {
    this.uiHandlers = handlers;
  }

  public unregisterUi(handlers: UiModalHandlers): void {
    if (this.uiHandlers === handlers) {
      this.uiHandlers = null;
    }
  }

  public setTouchMove(x: number, y: number): void {
    const mag = Math.hypot(x, y);
    if (mag > 1) {
      this.touchMove = { x: x / mag, y: y / mag };
    } else {
      this.touchMove = { x, y };
    }
  }

  public clearTouchMove(): void {
    this.touchMove = { x: 0, y: 0 };
  }

  public triggerSkill(slot: 1 | 2 | 3 | 4): void {
    if (this.isModalOpen) return;
    this.worldHandlers?.castSkill(slot);
  }

  public triggerInteract(): void {
    if (this.isModalOpen) return;
    this.worldHandlers?.interact();
  }

  public triggerPotion(itemId: 'pot_heal_small' | 'pot_ally_oil'): void {
    if (this.isModalOpen) return;
    this.worldHandlers?.usePotion(itemId);
  }

  public triggerReturnToTown(): void {
    this.uiHandlers?.closeAll();
    this.worldHandlers?.returnToTown();
  }

  public triggerReturnToTitle(): void {
    this.uiHandlers?.closeAll();
    this.worldHandlers?.returnToTitle();
  }

  public openDialog(req: DialogRequest): void {
    this.uiHandlers?.openDialog(req);
  }

  public openShop(): void {
    this.uiHandlers?.openShop();
  }

  public openBag(): void {
    this.uiHandlers?.openBag();
  }

  public openQuests(): void {
    this.uiHandlers?.openQuests();
  }

  public openElementsGuide(): void {
    this.uiHandlers?.openElementsGuide();
  }

  public openVictory(): void {
    this.uiHandlers?.openVictory();
  }
}

export const inputBridge = new InputBridge();
