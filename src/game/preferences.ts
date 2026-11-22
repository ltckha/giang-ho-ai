const REDUCE_MOTION_KEY = 'gon_tiem_reduce_motion_v1';

export function getInitialReduceMotion(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const saved = window.localStorage.getItem(REDUCE_MOTION_KEY);
    if (saved === '1') return true;
    if (saved === '0') return false;
  } catch {
    // Ignore storage errors
  }
  if (typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
}

export function saveReduceMotion(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(REDUCE_MOTION_KEY, enabled ? '1' : '0');
  } catch {
    // Ignore storage errors
  }
}
