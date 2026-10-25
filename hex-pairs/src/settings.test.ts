import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadMode, saveMode } from './settings';

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
  });
});
