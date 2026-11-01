import { expect, it, vi } from 'vitest';
import LZString from 'lz-string';
import {
  decodeBids,
  encodeBids,
  gameUrl,
  readChallenge,
  shareText,
} from './url';
import type { Bid, Home } from './game';
const bids: Bid[] = [
  null,
  1_000_000,
  1_250_000,
  1_251_000,
  999_000,
  null,
  1_500_000,
  2_000_000,
  3_000_000,
  100_000_000,
];
it('round-trips integer thousands and pass sentinels', () => {
  expect(decodeBids(encodeBids(bids))).toEqual(bids);
  expect(decodeBids(encodeBids(Array(10).fill(null)))).toEqual(
    Array(10).fill(null),
  );
  expect(() => encodeBids([1001])).toThrow();
});
it('rejects bad versions, lengths, types, ranges, and compressed bombs', () => {
  for (const invalid of [
    [2, Array(10).fill(-1)],
    [1, []],
    [1, Array(11).fill(-1)],
    [1, Array(10).fill(0)],
    [1, Array(10).fill(-2)],
    [1, Array(10).fill(1.5)],
    [1, Array(10).fill(100001)],
    [1, Array(10).fill('100')],
    { v: 1 },
    'x'.repeat(100_000),
  ])
    expect(() =>
      decodeBids(
        LZString.compressToEncodedURIComponent(JSON.stringify(invalid)),
      ),
    ).toThrow();
  for (const invalid of ['', 'a'.repeat(1501), '%bad', '----', 'B'])
    expect(() => decodeBids(invalid)).toThrow();
});
it('preserves same-property challenge when only rival data is broken', () => {
  const challenge = readChallenge('?v=1&d=2026-11&s=8372641&r=bad', '2026-12');
  expect(challenge.seed).toBe(8372641);
  expect(challenge.version).toBe('2026-11');
  expect(challenge.rival).toBeUndefined();
  expect(challenge.warning).toBeTruthy();
});
it('recovers from malformed game links and accepts full uint32 seed range', () => {
  for (const search of [
    '?v=2&d=2026-11&s=1',
    '?v=1&d=../../x&s=1',
    '?v=1&d=2026-11&s=-1',
    '?v=1&d=2026-11&s=4294967296',
    '?v=1&d=2026-11&s=01',
    '?v=1&d=2026-11&s=1&s=2',
  ]) {
    const challenge = readChallenge(search, '2026-12');
    expect(challenge.version).toBe('2026-12');
    expect(challenge.warning).toBeTruthy();
  }
  expect(readChallenge('?v=1&d=2026-11&s=0', '2026-12').seed).toBe(0);
  expect(readChallenge('?v=1&d=2026-11&s=4294967295', '2026-12').seed).toBe(
    0xffffffff,
  );
});
it('creates links that reproduce dataset, seed and optional rival bids', () => {
  vi.stubGlobal('location', { origin: 'https://tianyuqi.github.io' });
  const challenge = { seed: 8372641, version: '2026-11' };
  const link = new URL(gameUrl(challenge, bids));
  expect(link.pathname).toBe('/homebuyer/');
  expect(readChallenge(link.search, 'other')).toEqual({
    ...challenge,
    rival: bids,
  });
  expect(new URL(gameUrl(challenge)).searchParams.has('r')).toBe(false);
  vi.unstubAllGlobals();
});
it('shares exactly two rows of five outcome squares plus totals and link', () => {
  const homes = Array.from(
    { length: 10 },
    () => ({ salePrice: 1_000_000 }) as Home,
  );
  const text = shareText(homes, bids, 'https://example.com/homebuyer/');
  const lines = text.split('\n');
  expect(lines[1]).toBe('⬜🟩🟩🟨🟥');
  expect(lines[2]).toBe('⬜🟨🟨🟨🟨');
  expect(lines[3]).toBe('2 good buys · 5 overpaid · 1 outbid · 2 passed');
  expect(lines.at(-1)).toBe('https://example.com/homebuyer/');
});
