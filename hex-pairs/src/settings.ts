import type { Mode } from './game';
const KEY = 'hex-pairs:mode';

export function loadMode(): Mode {
  try {
    const mode = Number(localStorage.getItem(KEY));
    return mode === 2 || mode === 3 ? mode : 1;
  } catch {
    return 1;
  }
}

export function saveMode(mode: Mode): void {
  try { localStorage.setItem(KEY, String(mode)); } catch { /* Play still works without storage. */ }
}
