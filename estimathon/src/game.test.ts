import { describe, expect, it } from 'vitest';
import {
  completeAnswers,
  completeQuestions,
  emptyPairs,
  formatInteger,
  formatRatio,
  gameLinkState,
  inputNumber,
  intervalError,
  newBuilder,
  questionErrors,
  resultLinkState,
  scoreGame,
  scoreInterval,
  shareText,
  startPlaying,
  validInteger,
  type Pair,
  type State,
} from './game';
import { SAMPLE } from './sample';

const intervals: Pair[] = [
  ['20000', '22000'],
  ['1000', '1000000'],
  ['100', '200'],
  ['300', '400'],
  ['206', '206'],
];
const result: State = { ...SAMPLE, m: 'result', p: 'Alex', a: intervals };

describe('positive integer and five-question validation', () => {
  it.each(['1', '0001', '99999999999999999999999999999999', '9'.repeat(100)])(
    'accepts decimal integer %s',
    (value) => expect(validInteger(value)).toBe(true),
  );
  it.each([
    '',
    '0',
    '00',
    '-1',
    '+1',
    '1.5',
    '1e3',
    'Infinity',
    'NaN',
    ' 1',
    '1 ',
    '1,000',
    '９',
    '1'.repeat(101),
  ])('rejects %s', (value) => expect(validInteger(value)).toBe(false));
  it('requires exactly five nonempty, limited questions with valid answers', () => {
    expect(completeQuestions(SAMPLE.q)).toBe(true);
    expect(completeQuestions(SAMPLE.q.slice(0, 4))).toBe(false);
    expect(completeQuestions([...SAMPLE.q, SAMPLE.q[0]])).toBe(false);
    expect(questionErrors(['  ', '2'])[0]).toBeTruthy();
    expect(questionErrors(['x'.repeat(201), '2'])[0]).toBeTruthy();
    expect(questionErrors(['你好 🌏?', '0'])[1]).toBeTruthy();
    expect(questionErrors(['你好 🌏?', '1'])).toEqual(['', '']);
  });
  it('allows equal bounds but rejects reversed and missing bounds', () => {
    expect(intervalError(['1', '1'])).toBe('');
    expect(intervalError(['99999999999999999999', '99999999999999999998'])).toBeTruthy();
    expect(intervalError(['', '10'])).toBeTruthy();
    expect(completeAnswers(intervals)).toBe(true);
    expect(completeAnswers(intervals.slice(0, 4))).toBe(false);
    expect(completeAnswers(emptyPairs())).toBe(false);
  });
});

describe('exact scoring', () => {
  it.each([
    ['100', ['90', '110'], 'green', 2n],
    ['100', ['10', '1000'], 'yellow', 100n],
    ['100', ['110', '200'], 'red', 0n],
    ['100', ['100', '100'], 'green', 1n],
    ['100', ['50', '100'], 'green', 2n],
    ['100', ['100', '200'], 'green', 2n],
    ['100', ['50', '101'], 'yellow', 3n],
    ['100', ['1', '99'], 'red', 0n],
  ] as [string, Pair, string, bigint][])('scores %s in %j as %s', (answer, bounds, status, points) => {
    expect(scoreInterval(answer, bounds)).toEqual({ status, points });
  });
  it('distinguishes integers and ratios that floating point arithmetic would round together', () => {
    const n = 9007199254740993n;
    expect(scoreInterval(String(n), [String(n), String(2n * n)])).toEqual({ status: 'green', points: 2n });
    expect(scoreInterval(String(n), [String(n), String(2n * n + 1n)])).toEqual({
      status: 'yellow',
      points: 3n,
    });
    expect(scoreInterval(String(n - 1n), [String(n), String(2n * n)]).status).toBe('red');
  });
  it('adds only correct interval scores, then doubles for every miss', () => {
    const q: Pair[] = Array.from({ length: 5 }, () => ['Question?', '100']);
    const score = scoreGame(q, [
      ['90', '110'],
      ['10', '1000'],
      ['110', '200'],
      ['100', '100'],
      ['1', '99'],
    ]);
    expect(score.total).toBe(452n); // (10 + 2 + 100 + 1) × 4
    expect(score.counts).toEqual({ green: 2, yellow: 1, red: 2 });
    expect(score.circles).toBe('🟢 🟡 🔴 🟢 🔴');
    expect(
      scoreGame(
        q,
        Array.from({ length: 5 }, () => ['1', '99']),
      ).total,
    ).toBe(320n);
    expect(
      scoreGame(
        q,
        Array.from({ length: 5 }, () => ['100', '100']),
      ).total,
    ).toBe(15n);
    expect(() => scoreGame(q, emptyPairs())).toThrow();
  });
  it('displays ratios without floating point, including rounding and very large values', () => {
    expect(formatRatio(['10', '20'])).toBe('2×');
    expect(formatRatio(['3', '10'])).toBe('≈ 3.33×');
    expect(formatRatio(['1000', '1999'])).toBe('≈ 2.00×');
    expect(formatRatio(['1', '12345678901234567890'])).toBe('12,345,678,901,234,567,890×');
    expect(formatInteger(12345678901234567890n)).toBe('12,345,678,901,234,567,890');
    expect(inputNumber('001,234')).toBe('1234');
    expect(validInteger(inputNumber('1e3'))).toBe(false);
  });
});

describe('challenge and share data', () => {
  it('starts fresh answers while keeping just the original opponent when challenged', () => {
    const playing = startPlaying(result, true);
    expect(playing.a).toEqual(emptyPairs());
    expect(playing.o).toEqual({ p: 'Alex', a: intervals });
    expect(playing.q).toEqual(SAMPLE.q);
    expect(playing.i).toBe(0);
    expect(startPlaying(result).o).toBeUndefined();
  });
  it('shares only the current player, with no participant chain or reveal flag', () => {
    const next: State = { ...result, p: 'Sam', o: { p: 'Alex', a: intervals }, reveal: true, preview: true };
    expect(resultLinkState(next)).toEqual({
      v: 1,
      m: 'result',
      t: SAMPLE.t,
      q: SAMPLE.q,
      p: 'Sam',
      a: intervals,
    });
    expect(gameLinkState(next)).toEqual(SAMPLE);
    expect(newBuilder().q).toEqual(emptyPairs());
  });
  it('creates a complete text summary with exactly five circles and the URL', () => {
    const summary = shareText(result, 'https://tianyuqi.github.io/estimathon/?d=abc');
    expect(summary).toContain("Alex's Results");
    expect(summary).toContain(scoreGame(SAMPLE.q, intervals).circles);
    expect(summary).toContain(`Score: ${scoreGame(SAMPLE.q, intervals).total} (lower is better)`);
    expect(summary).toContain('3 🟢  1 🟡  1 🔴');
    expect(summary).toContain('Think you can do better?\nhttps://tianyuqi.github.io/estimathon/?d=abc');
  });
});
