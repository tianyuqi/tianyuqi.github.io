import LZString from 'lz-string';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  freshRun,
  generateBoard,
  tap,
  startRun,
  type Difficulty,
  type Rule,
} from './game';
import {
  decode,
  encode,
  readBoard,
  restoreRun,
  saveRun,
  summary,
  validateBoard,
} from './state';

afterEach(() => vi.unstubAllGlobals());
function storage() {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    setItem: (key: string, value: string) => values.set(key, value),
    getItem: (key: string) => values.get(key) ?? null,
  });
}
describe('concrete board links', () => {
  it('round trips identical questions, positions, and settings with compact URLs', () => {
    for (const d of ['easy', 'normal', 'hard'] as Difficulty[])
      for (const r of ['exact', 'last'] as Rule[]) {
        const b = generateBoard(d, r);
        const url = new URL('https://tianyuqi.github.io/number-hunt/');
        url.searchParams.set('g', encode(b));
        expect(url.href.length).toBeLessThan(2000);
        expect(readBoard(url.href)).toEqual(b);
        expect(JSON.stringify(decode(encode(b)))).toBe(JSON.stringify(b));
      }
  });
  it('preserves custom operations and accepts older links without operation settings', () => {
    const board = generateBoard('easy', 'exact', Math.random, ['/']);
    expect(decode(encode(board))).toEqual(board);
    expect(board.t.every((tile) => tile[1] === '/')).toBe(true);
    const legacy = generateBoard();
    delete legacy.o;
    expect(decode(encode(legacy))).toEqual(legacy);
    expect(() => validateBoard({ ...board, o: ['+'] })).toThrow();
  });
  it('rejects broken, duplicated, oversized, unsupported, or invalid data', () => {
    for (const input of [
      '',
      'bogus',
      '*',
      'a'.repeat(4001),
      LZString.compressToEncodedURIComponent('x'.repeat(100000)),
    ])
      expect(() => decode(input)).toThrow();
    expect(readBoard('https://example.org/number-hunt/')).toBeNull();
    expect(() => readBoard('https://example.org/?g=a&g=b')).toThrow();
    const b = generateBoard();
    for (const bad of [
      null,
      { ...b, v: 2 },
      { ...b, d: 'toString' },
      { ...b, r: 'other' },
      { ...b, o: [] },
      { ...b, o: ['bogus'] },
      { ...b, o: ['+', '+'] },
      { ...b, o: '/' },
      { ...b, t: b.t.slice(1) },
      { ...b, t: b.t.map(() => [0, '+', 9, 9]) },
    ])
      expect(() => validateBoard(bad)).toThrow();
    for (const tile of [
      [1, '/', 0, 0],
      [3, '/', 2, 1],
      [0, '-', 1, 9],
      [7, '*', 7, 9],
      [1, 'eval', 2, 3],
      [-1, '+', 2, 1],
      [1.5, '+', 1.5, 3],
    ]) {
      const bad = { ...b, t: [tile, ...b.t.slice(1)] };
      expect(() => validateBoard(bad)).toThrow();
    }
  });
});
describe('local run recovery', () => {
  it('resumes the same board with elapsed wall time and never transfers progress to a different board', () => {
    storage();
    const b = generateBoard();
    const run = tap(
      b,
      startRun(freshRun(b), 1000),
      b.t.findIndex((t) => t[3] === 9),
      1000,
    );
    saveRun(b, run);
    const resumed = restoreRun(b, 11000);
    expect(resumed.cleared).toEqual(run.cleared);
    expect(resumed.remaining).toBe(20000);
    expect(restoreRun(generateBoard(), 11000).status).toBe('ready');
    expect(restoreRun(b, 31000).status).toBe('lost');
    saveRun(b, freshRun(b));
    expect(restoreRun(b, 100000).status).toBe('ready');
  });
  it('safely ignores corrupt or blocked storage and invalid progress', () => {
    storage();
    const b = generateBoard();
    localStorage.setItem('number-hunt:run:v1', '{');
    expect(restoreRun(b, 1000)).toEqual(freshRun(b));
    const run = tap(
      b,
      startRun(freshRun(b), 1000),
      b.t.findIndex((t) => t[3] === 9),
      1000,
    );
    for (const corrupt of [
      { ...run, cleared: [99] },
      { ...run, cleared: [run.cleared[0], run.cleared[0]] },
      { ...run, cleared: [b.t.findIndex((t) => t[3] === 1)] },
      { ...run, deadline: null },
      { ...run, status: 'won' },
    ]) {
      localStorage.setItem(
        'number-hunt:run:v1',
        JSON.stringify({ key: encode(b), run: corrupt }),
      );
      expect(restoreRun(b, 2000)).toEqual(freshRun(b));
    }
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error();
      },
      setItem: () => {
        throw new Error();
      },
    });
    expect(restoreRun(b, 1000)).toEqual(freshRun(b));
    expect(() => saveRun(b, run)).not.toThrow();
  });
  it('shares a compact outcome and stage progress without any answer list', () => {
    const b = generateBoard();
    const run = {
      ...freshRun(b),
      status: 'lost' as const,
      startedAt: 1000,
      finishedAt: 6000,
    };
    const text = summary(b, run, 'https://example.org/?g=compressed');
    expect(text).toContain('0/50');
    expect(text).toContain('⬜'.repeat(10));
    expect(text).toContain('5s played');
    expect(text).toContain('https://example.org/?g=compressed');
    expect(text).not.toContain('hidden');
  });
});
