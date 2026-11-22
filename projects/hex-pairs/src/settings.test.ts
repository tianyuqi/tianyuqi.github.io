import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadDifficulty, loadMode, loadOperation, saveDifficulty, saveMode, saveOperation } from './settings';

afterEach(() => vi.unstubAllGlobals());
describe('number mode persistence', () => {
  it('saves and restores the mode, and validates old values', () => {
    let value: string | null = null;
    vi.stubGlobal('localStorage', { getItem: () => value, setItem: (_: string, next: string) => { value = next; } });
    expect(loadMode()).toBe(1);
    saveMode(3);
    expect(loadMode()).toBe(3);
    saveMode(2);
    expect(loadMode()).toBe(2);
    value = '999';
    expect(loadMode()).toBe(1);
  });
  it('still works when browser storage is unavailable', () => {
    vi.stubGlobal('localStorage', { getItem() { throw Error('Unavailable'); }, setItem() { throw Error('Unavailable'); } });
    expect(loadMode()).toBe(1);
    expect(() => saveMode(2)).not.toThrow();
    expect(loadOperation()).toBe('addition');
    expect(loadDifficulty()).toBe('easy');
    expect(() => saveOperation('multiplication')).not.toThrow();
    expect(() => saveDifficulty('hard')).not.toThrow();
  });
});

describe('operation and difficulty persistence', () => {
  it('preserves the addition digit setting independently of multiplication preferences', () => {
    const values = new Map<string, string>([['hex-pairs:mode', '3']]);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });
    expect(loadOperation()).toBe('addition');
    expect(loadDifficulty()).toBe('easy');
    saveOperation('multiplication');
    saveDifficulty('hard');
    expect(loadMode()).toBe(3);
    expect(loadOperation()).toBe('multiplication');
    expect(loadDifficulty()).toBe('hard');
    saveMode(2);
    saveOperation('addition');
    expect(loadDifficulty()).toBe('hard');
    expect(loadMode()).toBe(2);
    saveDifficulty('medium');
    expect(loadDifficulty()).toBe('medium');
    values.set('hex-pairs:operation', 'invalid');
    values.set('hex-pairs:difficulty', 'invalid');
    expect(loadOperation()).toBe('addition');
    expect(loadDifficulty()).toBe('easy');
  });
});
