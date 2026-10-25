import type { Difficulty, Mode, Operation } from './game';
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

export function loadOperation(): Operation {
  try { return localStorage.getItem('hex-pairs:operation') === 'multiplication' ? 'multiplication' : 'addition'; }
  catch { return 'addition'; }
}

export function saveOperation(operation: Operation): void {
  try { localStorage.setItem('hex-pairs:operation', operation); } catch { /* Play still works without storage. */ }
}

export function loadDifficulty(): Difficulty {
  try {
    const value = localStorage.getItem('hex-pairs:difficulty');
    return value === 'medium' || value === 'hard' ? value : 'easy';
  } catch { return 'easy'; }
}

export function saveDifficulty(difficulty: Difficulty): void {
  try { localStorage.setItem('hex-pairs:difficulty', difficulty); } catch { /* Play still works without storage. */ }
}
