import { describe, expect, it } from 'vitest';
import simulatedDataset from '../data/testing/simulated-listings-20.json';
import {
  ActiveClock,
  compare,
  outcome,
  parseBid,
  sample,
  summarize,
  validateDataset,
  type Bid,
  type Home,
} from './game';
const homes: Home[] = Array.from({ length: 20 }, (_, i) => ({
  id: String(i + 1).padStart(2, '0'),
  neighborhood: 'Test only',
  beds: 3,
  baths: 2,
  sqft: 1500,
  saleDate: '2025-10-01',
  salePrice: 1_000_000,
  address: 'Test fixture',
  sourceUrl: `https://example.com/${i}`,
}));

describe('exact outcomes and scoring', () => {
  it.each([
    [null, 'passed'],
    [999_999, 'outbid'],
    [1_000_000, 'good'],
    [1_250_000, 'good'],
    [1_250_001, 'overpaid'],
  ] as [Bid, string][])('%s yields %s', (bid, result) =>
    expect(outcome(bid, 1_000_000)).toBe(result),
  );
  it('uses exact integer arithmetic for non-round sale prices', () => {
    expect(outcome(1_250_005, 1_000_004)).toBe('good');
    expect(outcome(1_250_006, 1_000_004)).toBe('overpaid');
  });
  it('includes overpayments in won premiums and averages per-home percentages', () => {
    const varied = [
      homes[0],
      { ...homes[1], salePrice: 2_000_000 },
      homes[2],
      homes[3],
    ];
    expect(summarize(varied, [1_200_000, 3_000_000, 900_000, null])).toEqual({
      good: 1,
      overpaid: 1,
      outbid: 1,
      passed: 1,
      premium: 1_200_000,
      won: 2,
      averagePremium: 35,
    });
    expect(summarize(homes, Array(10).fill(null)).averagePremium).toBe(0);
  });
  it('ranks good buys, fewer overpaid, then aggregate premium', () => {
    expect(compare(homes, [1_000_000, 3_000_000], [null, null])).toBeLessThan(
      0,
    );
    expect(
      compare(homes, [1_000_000, null], [1_000_000, 2_000_000]),
    ).toBeLessThan(0);
    expect(compare(homes, [1_000_000], [1_100_000])).toBeLessThan(0);
    expect(compare(homes, [1_100_000], [1_100_000])).toBe(0);
  });
});
describe('mobile bid parsing', () => {
  it.each([
    ['1.75', 1_750_000],
    ['1.750499', 1_750_000],
    ['1.7505', 1_751_000],
    ['.001', 1000],
    ['1.', 1_000_000],
    ['100', 100_000_000],
    ['0.0005', 1000],
  ])('parses %s as %s', (text, expected) =>
    expect(parseBid(text)).toBe(expected),
  );
  it.each([
    '',
    '0',
    '-1',
    '1e3',
    'Infinity',
    'NaN',
    '1,50',
    '$1',
    '100.001',
    '0.000499',
    '1.1234567',
  ])('rejects %s', (text) => expect(parseBid(text)).toBeNull());
});
describe('deterministic properties', () => {
  it('validates and samples the clearly labeled 20-home testing dataset', () => {
    const dataset = validateDataset(simulatedDataset, 'simulated-test-20');
    expect(dataset.homes).toHaveLength(20);
    expect(dataset.homes.every((home) => home.id.startsWith('SIM-HB-'))).toBe(
      true,
    );
    expect(
      dataset.homes.every((home) => home.address.startsWith('Simulated home ')),
    ).toBe(true);
    expect(
      dataset.homes.every((home) => home.sourceUrl.includes('.invalid/')),
    ).toBe(true);
    expect(sample(dataset.homes, 8372641)).toHaveLength(10);
  });

  it('fixes the v1 sequence, samples distinct homes and ignores input order', () => {
    const result = sample(homes, 8372641);
    expect(result.map((home) => home.id)).toEqual([
      '06',
      '18',
      '16',
      '11',
      '08',
      '19',
      '12',
      '05',
      '03',
      '02',
    ]);
    expect(sample([...homes].reverse(), 8372641)).toEqual(result);
    expect(new Set(result.map((home) => home.id)).size).toBe(10);
    expect(homes[0].id).toBe('01');
  });
  it('accepts zero and maximum seed and rejects undersized datasets', () => {
    expect(sample(homes, 0)).toHaveLength(10);
    expect(sample(homes, 0xffffffff)).not.toEqual(sample(homes, 0));
    expect(() => sample(homes.slice(0, 9), 1)).toThrow();
  });
  it('validates version, unique IDs, home fields, and URLs', () => {
    expect(
      validateDataset({ version: '2026-11', homes }, '2026-11').homes,
    ).toHaveLength(20);
    for (const data of [
      { version: 'other', homes },
      { version: '2026-11', homes: Array(10).fill(homes[0]) },
      {
        version: '2026-11',
        homes: [{ ...homes[0], salePrice: 0 }, ...homes.slice(1)],
      },
      {
        version: '2026-11',
        homes: [
          { ...homes[0], sourceUrl: 'javascript:bad' },
          ...homes.slice(1),
        ],
      },
    ])
      expect(() => validateDataset(data, '2026-11')).toThrow();
  });
});
describe('active deadline clock', () => {
  it('checks monotonic elapsed time even when callbacks arrive late', () => {
    const clock = new ActiveClock(100);
    expect(clock.remaining(10_099)).toBe(1);
    expect(clock.remaining(10_100)).toBe(0);
    expect(clock.remaining(90_000)).toBe(0);
  });
  it('pauses hidden time and resumes at exactly the same remaining duration', () => {
    const clock = new ActiveClock(100);
    clock.visibility(2100, false);
    expect(clock.remaining(100_000)).toBe(8000);
    clock.visibility(100_000, true);
    expect(clock.remaining(107_999)).toBe(1);
    expect(clock.remaining(108_000)).toBe(0);
  });
  it('handles an initially hidden page and repeated visibility events', () => {
    const clock = new ActiveClock(0, false);
    clock.visibility(1000, false);
    clock.visibility(5000, true);
    clock.visibility(6000, true);
    expect(clock.remaining(7000)).toBe(8000);
  });
});
