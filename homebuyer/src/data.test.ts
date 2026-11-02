import { afterEach, expect, it, vi } from 'vitest';
import simulatedDataset from '../data/testing/simulated-listings-20.json';
import { loadDataset } from './data';
import { sample, SIMULATED_VERSION } from './game';
import { gameUrl, readChallenge } from './url';

afterEach(() => vi.unstubAllGlobals());

it('plays and shares the demo with an empty historical manifest', async () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  vi.stubGlobal('location', { origin: 'https://tianyuqi.github.io' });
  const challenge = readChallenge('', SIMULATED_VERSION);
  const dataset = await loadDataset(challenge.version, {});
  const homes = sample(dataset.homes, challenge.seed);
  expect(homes).toHaveLength(10);
  expect(new Set(homes.map((home) => home.id)).size).toBe(10);
  const bids = homes.map((home) => home.salePrice);
  const shared = readChallenge(
    new URL(gameUrl(challenge, bids)).search,
    '2026-12',
  );
  expect(shared).toEqual({ ...challenge, rival: bids });
  const replay = await loadDataset(shared.version, {
    '2026-12': { file: '2026-12.json', sha256: 'unused' },
  });
  expect(sample(replay.homes, shared.seed)).toEqual(homes);
  expect(fetch).not.toHaveBeenCalled();
});

it('still verifies historical dataset bytes before playing', async () => {
  const dataset = { ...simulatedDataset, version: '2026-12' };
  const raw = JSON.stringify(dataset);
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(raw),
  );
  const sha256 = Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
  vi.stubGlobal('fetch', vi.fn(async () => new Response(raw)));
  const datasets = { '2026-12': { file: '2026-12.json', sha256 } };
  await expect(loadDataset('2026-12', datasets)).resolves.toEqual(dataset);
  datasets['2026-12'].sha256 = 'incorrect';
  await expect(loadDataset('2026-12', datasets)).rejects.toThrow('did not match');
  await expect(loadDataset('2026-11', datasets)).rejects.toThrow('not available');
});
