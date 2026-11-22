export const ROUND_COUNT = 10;
export const ROUND_MS = 10_000;
export const MAX_BID = 100_000_000;
export const SIMULATED_VERSION = 'simulated-test-20';
export type Bid = number | null;
export type Outcome = 'good' | 'overpaid' | 'outbid' | 'passed';
export interface Home {
  id: string;
  neighborhood: string;
  beds: number;
  baths: number;
  sqft: number;
  saleDate: string;
  salePrice: number;
  address: string;
  sourceUrl: string;
}
export interface Dataset {
  version: string;
  homes: Home[];
}
export const labels: Record<Outcome, string> = {
  good: 'Good buy',
  overpaid: 'Overpaid',
  outbid: 'Outbid',
  passed: 'Passed',
};
export const squares: Record<Outcome, string> = {
  good: '🟩',
  overpaid: '🟨',
  outbid: '🟥',
  passed: '⬜',
};

export function outcome(bid: Bid, price: number): Outcome {
  if (bid === null) return 'passed';
  if (bid < price) return 'outbid';
  return 4 * bid <= 5 * price ? 'good' : 'overpaid';
}

// Decimal millions become integer dollars, rounded half-up without float drift.
export function parseBid(input: string): Bid {
  if (!/^(?:\d{1,3}(?:\.\d{0,6})?|\.\d{1,6})$/.test(input.trim())) return null;
  const [whole, fraction = ''] = input.trim().split('.');
  const dollars =
    Number(whole || 0) * 1_000_000 + Number(fraction.padEnd(6, '0'));
  const rounded = Math.floor((dollars + 500) / 1000) * 1000;
  return rounded > 0 && rounded <= MAX_BID ? rounded : null;
}

export function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function sample(homes: Home[], seed: number): Home[] {
  if (homes.length < ROUND_COUNT)
    throw new Error('At least ten homes are required.');
  const shuffled = [...homes].sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
  );
  const random = mulberry32(seed);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, ROUND_COUNT);
}
export function summarize(homes: Home[], bids: Bid[]) {
  const counts = { good: 0, overpaid: 0, outbid: 0, passed: 0 };
  let premium = 0;
  let percent = 0;
  let won = 0;
  bids.forEach((bid, i) => {
    const price = homes[i].salePrice;
    counts[outcome(bid, price)]++;
    if (bid !== null && bid >= price) {
      won++;
      premium += bid - price;
      percent += ((bid - price) / price) * 100;
    }
  });
  return { ...counts, premium, averagePremium: won ? percent / won : 0, won };
}
export function compare(homes: Home[], left: Bid[], right: Bid[]): number {
  const a = summarize(homes, left);
  const b = summarize(homes, right);
  return b.good - a.good || a.overpaid - b.overpaid || a.premium - b.premium;
}

// Only visible time counts. The same clock is checked by both rendering and submission.
export class ActiveClock {
  private elapsed = 0;
  private last: number;
  private visible: boolean;
  constructor(
    now: number,
    visible = true,
    private duration = ROUND_MS,
  ) {
    this.last = now;
    this.visible = visible;
  }
  remaining(now: number) {
    return Math.max(
      0,
      this.duration -
        this.elapsed -
        (this.visible ? Math.max(0, now - this.last) : 0),
    );
  }
  visibility(now: number, visible: boolean) {
    if (this.visible) this.elapsed += Math.max(0, now - this.last);
    this.last = now;
    this.visible = visible;
  }
}

export function validateDataset(value: unknown, version: string): Dataset {
  if (!value || typeof value !== 'object')
    throw new Error('Invalid home data.');
  const data = value as Dataset;
  if (
    data.version !== version ||
    !Array.isArray(data.homes) ||
    data.homes.length < 10
  )
    throw new Error('Invalid home data.');
  const ids = new Set<string>();
  for (const home of data.homes) {
    if (
      !home ||
      typeof home.id !== 'string' ||
      !home.id ||
      ids.has(home.id) ||
      typeof home.neighborhood !== 'string' ||
      !home.neighborhood ||
      typeof home.address !== 'string' ||
      !Number.isSafeInteger(home.salePrice) ||
      home.salePrice <= 0 ||
      home.salePrice > MAX_BID ||
      !Number.isFinite(home.beds) ||
      home.beds < 0 ||
      !Number.isFinite(home.baths) ||
      home.baths < 0 ||
      !Number.isSafeInteger(home.sqft) ||
      home.sqft <= 0 ||
      typeof home.saleDate !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(home.saleDate) ||
      !Number.isFinite(Date.parse(home.saleDate)) ||
      typeof home.sourceUrl !== 'string' ||
      !/^https:\/\//.test(home.sourceUrl)
    )
      throw new Error('Invalid home data.');
    ids.add(home.id);
  }
  return data;
}
