import LZString from 'lz-string';
import { decompressBounded } from '../../estimathon/src/decompress';
import {
  MAX_BID,
  ROUND_COUNT,
  SIMULATED_VERSION,
  labels,
  outcome,
  squares,
  summarize,
  type Bid,
  type Home,
} from './game';

export interface Challenge {
  version: string;
  seed: number;
  rival?: Bid[];
  warning?: string;
}
const VERSION = /^\d{4}-\d{2}(?:-[a-z0-9]+)?$/;
const MAX_PAYLOAD = 1500;
export function newSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}

export function encodeBids(bids: Bid[]): string {
  if (
    bids.length !== ROUND_COUNT ||
    bids.some(
      (b) =>
        b !== null &&
        (!Number.isInteger(b) || b <= 0 || b > MAX_BID || b % 1000),
    )
  ) {
    throw new Error('Invalid bids.');
  }
  return LZString.compressToEncodedURIComponent(
    JSON.stringify([1, bids.map((b) => (b === null ? -1 : b / 1000))]),
  );
}
export function decodeBids(encoded: string): Bid[] {
  if (
    !encoded ||
    encoded.length > MAX_PAYLOAD ||
    !/^[A-Za-z0-9+\-$]+$/.test(encoded)
  )
    throw new Error('Invalid challenge.');
  // Bound decompression as well as input: tiny compressed strings can expand enormously.
  const text = boundedDecompress(encoded);
  const data: unknown = JSON.parse(text);
  if (
    !Array.isArray(data) ||
    data.length !== 2 ||
    data[0] !== 1 ||
    !Array.isArray(data[1]) ||
    data[1].length !== ROUND_COUNT ||
    data[1].some(
      (b: unknown) =>
        typeof b !== 'number' ||
        !Number.isInteger(b) ||
        (b !== -1 && (b <= 0 || b > MAX_BID / 1000)),
    )
  )
    throw new Error('Invalid challenge.');
  return data[1].map((b: number) => (b === -1 ? null : b * 1000));
}

// A valid payload has at most ~90 characters. Reject expansion before allocating a large string.
function boundedDecompress(encoded: string): string {
  const result = decompressBounded(encoded, 256);
  if (!result) throw new Error('Invalid challenge.');
  return result;
}

export function readChallenge(
  search: string,
  fallbackVersion: string,
): Challenge {
  const params = new URLSearchParams(search);
  if (
    !search ||
    ![...params.keys()].some((key) => ['v', 'd', 's', 'r'].includes(key))
  )
    return { version: fallbackVersion, seed: newSeed() };
  const seedText = params.get('s') || '';
  const version = params.get('d') || '';
  if (
    search.length > 2500 ||
    ['v', 'd', 's', 'r'].some((key) => params.getAll(key).length > 1) ||
    params.get('v') !== '1' ||
    !(VERSION.test(version) || version === SIMULATED_VERSION) ||
    !/^(0|[1-9]\d{0,9})$/.test(seedText) ||
    Number(seedText) > 0xffffffff
  ) {
    return {
      version: fallbackVersion,
      seed: newSeed(),
      warning: 'This game link is invalid. A fresh game is ready instead.',
    };
  }
  const challenge: Challenge = { version, seed: Number(seedText) };
  if (params.has('r')) {
    try {
      challenge.rival = decodeBids(params.get('r')!);
    } catch {
      challenge.warning =
        'The shared bids could not be read. You can still play the same homes.';
    }
  }
  return challenge;
}
export function gameUrl(challenge: Challenge, bids?: Bid[]): string {
  const url = new URL('/homebuyer/', location.origin);
  url.search = new URLSearchParams({
    v: '1',
    d: challenge.version,
    s: String(challenge.seed),
    ...(bids ? { r: encodeBids(bids) } : {}),
  }).toString();
  return url.href;
}
export function shareText(
  homes: Home[],
  bids: Bid[],
  url: string,
  simulated = false,
): string {
  const cells = homes.map(
    (home, i) => squares[outcome(bids[i], home.salePrice)],
  );
  const totals = summarize(homes, bids);
  return `SF Home Buying Game${simulated ? ' (simulated homes)' : ''}\n${cells.slice(0, 5).join('')}\n${cells.slice(5).join('')}\n${(Object.keys(labels) as (keyof typeof labels)[]).map((key) => `${totals[key]} ${key === 'good' ? (totals.good === 1 ? 'good buy' : 'good buys') : labels[key].toLowerCase()}`).join(' · ')}\nCan you buy better?\n${url}`;
}
