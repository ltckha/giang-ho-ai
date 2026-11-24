const REDUCE_MOTION_KEY = 'gon_tiem_reduce_motion_v1';
const SFX_MUTED_KEY = 'gon_tiem_sfx_muted_v1';
const MUSIC_MUTED_KEY = 'gon_tiem_music_muted_v1';

function readBoolPref(key: string): boolean | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = window.localStorage.getItem(key);
    if (saved === '1') return true;
    if (saved === '0') return false;
  } catch {
    // Ignore storage errors
  }
  return null;
}

function writeBoolPref(key: string, enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, enabled ? '1' : '0');
  } catch {
    // Ignore storage errors
  }
}

export function getInitialReduceMotion(): boolean {
  const saved = readBoolPref(REDUCE_MOTION_KEY);
  if (saved !== null) return saved;
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
}

export function saveReduceMotion(enabled: boolean): void {
  writeBoolPref(REDUCE_MOTION_KEY, enabled);
}

export function getInitialSfxMuted(): boolean {
  return readBoolPref(SFX_MUTED_KEY) ?? false;
}

export function saveSfxMuted(muted: boolean): void {
  writeBoolPref(SFX_MUTED_KEY, muted);
}

export function getInitialMusicMuted(): boolean {
  return readBoolPref(MUSIC_MUTED_KEY) ?? false;
}

export function saveMusicMuted(muted: boolean): void {
  writeBoolPref(MUSIC_MUTED_KEY, muted);
}

export const REAL_STREET_LOADOUT_PREFIX = 'gon_tiem_real_street_loadout_v1_';

export function loadRealStreetLoadout(stageId: string, allowed: string[], size: number): string[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${REAL_STREET_LOADOUT_PREFIX}${stageId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const clean = Array.from(new Set(parsed.filter((id): id is string => typeof id === 'string' && allowed.includes(id)))).slice(0, size);
    return clean.length === size ? clean : null;
  } catch {
    return null;
  }
}

export function saveRealStreetLoadout(stageId: string, loadout: string[], allowed: string[], size: number): string[] {
  const clean = Array.from(new Set(loadout.filter((id) => allowed.includes(id)))).slice(0, size);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(`${REAL_STREET_LOADOUT_PREFIX}${stageId}`, JSON.stringify(clean));
    } catch {
      // Ignore storage errors
    }
  }
  return clean;
}

