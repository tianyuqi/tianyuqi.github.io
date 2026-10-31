import { describe, expect, it } from 'vitest';
import LZString from 'lz-string';
import { decompressBounded } from './decompress';
import { emptyPairs, newBuilder, resultLinkState, startPlaying, type State } from './game';
import { SAMPLE } from './sample';
import { decode, encode, MAX_ENCODED, readUrl, stateUrl, validateState } from './url';

const finished: State = { ...SAMPLE, m: 'result', p: 'Alex', a: SAMPLE.q.map((q) => [q[1], q[1]]) };
const pack = (value: unknown) => LZString.compressToEncodedURIComponent(JSON.stringify(value));

describe('versioned, compressed URL state', () => {
  const drafts: State[] = [
    newBuilder(),
    {
      ...newBuilder(),
      t: 'Draft',
      q: [
        ['你好 🌏 — π?', '9007199254740993123456789'],
        ['半分?', ''],
        ['', '0'],
        ['', '-1'],
        ['', '1e5'],
      ],
    },
    SAMPLE,
    { ...SAMPLE, preview: true },
    {
      ...startPlaying(SAMPLE),
      i: 3,
      p: 'Zoë & 雪',
      a: [
        ['1', '10000000000000000000000000000'],
        ['', ''],
        ['0', '2'],
        ['3', '2'],
        ['1e3', '5'],
      ],
    },
    { ...startPlaying(finished, true), i: 4 },
    finished,
    { ...finished, reveal: true, o: { p: 'Previous player', a: finished.a! } },
  ];
  it.each(drafts)(
    'round-trips $m state, including Unicode, large integers and unfinished inputs',
    (state) => {
      expect(decode(encode(state))).toEqual(state);
      const url = stateUrl(state, 'https://tianyuqi.github.io/estimathon/?old=data#fragment');
      expect(url).toMatch(/^https:\/\/tianyuqi.github.io\/estimathon\/\?d=/);
      expect(new URL(url).hash).toBe('');
      expect(readUrl(url)).toEqual(state);
      if (state.q[0][0]) expect(url).not.toContain(state.q[0][0]);
    },
  );
  it('escapes the compressor alphabet using URLSearchParams', () => {
    let withPlus: State = SAMPLE;
    for (let i = 0; i < 1000 && !encode(withPlus).includes('+'); i++)
      withPlus = { ...SAMPLE, t: `Game ${i} — 你好` };
    expect(encode(withPlus)).toContain('+');
    const url = stateUrl(withPlus, 'https://example.com');
    expect(url).toContain('%2B');
    expect(readUrl(url)).toEqual(withPlus);
  });
  it('supports fresh-session game and result links without relying on storage', () => {
    expect(readUrl(stateUrl(resultLinkState({ ...finished, reveal: true }), 'https://example.com'))).toEqual(
      finished,
    );
    expect(readUrl('https://example.com/estimathon/')).toBeNull();
    expect(stateUrl(null, 'https://example.com/old?d=x')).toBe('https://example.com/estimathon/');
  });
  it('recomputes results and discards unknown fields rather than trusting supplied scores', () => {
    expect(
      decode(pack({ ...finished, score: 1, counts: { green: 5 }, html: '<script>bad</script>' })),
    ).toEqual(finished);
  });
});

describe('malformed and excessive input', () => {
  it.each([
    '',
    '%',
    'not-a-game',
    'a'.repeat(MAX_ENCODED + 1),
    pack(null),
    pack([]),
    pack({ ...SAMPLE, v: 2 }),
    pack({ ...SAMPLE, m: 'unknown' }),
    pack({ ...SAMPLE, q: SAMPLE.q.slice(1) }),
    pack({ ...SAMPLE, q: [['?', '1']] }),
    pack({ ...SAMPLE, t: 'a'.repeat(61) }),
    pack('x'.repeat(17000)),
  ])('rejects damaged, unsupported or oversized payloads', (encoded) => {
    expect(() => decode(encoded)).toThrow();
  });
  it('explains unsupported versions', () =>
    expect(() => decode(pack({ ...SAMPLE, v: 9 }))).toThrow('unsupported version'));
  it('rejects duplicate query parameters', () =>
    expect(() => readUrl(`https://example.com/?d=${encode(SAMPLE)}&d=other`)).toThrow('duplicate'));
  it('allows invalid drafts, but validates all published questions and finished intervals', () => {
    expect(validateState(newBuilder())).toEqual(newBuilder());
    expect(() => encode({ ...SAMPLE, q: SAMPLE.q.map((q) => [q[0], '0']) })).toThrow();
    expect(() => encode({ ...finished, a: emptyPairs() })).toThrow();
    expect(() => encode({ ...finished, a: finished.a!.map(() => ['3', '2']) })).toThrow();
    expect(() => validateState({ ...startPlaying(SAMPLE), i: 5 })).toThrow();
    expect(() => validateState({ ...startPlaying(SAMPLE), i: 1.5 })).toThrow();
    expect(() => validateState({ ...finished, p: 'x'.repeat(31) })).toThrow();
    expect(() => validateState({ ...finished, o: { p: 'Alex', a: emptyPairs() } })).toThrow();
    expect(() => validateState({ ...finished, reveal: 'yes' })).toThrow();
    expect(() => validateState({ ...SAMPLE, q: SAMPLE.q.map((q) => [q[0], 123]) })).toThrow();
  });
});

describe('bounded decompression', () => {
  it('stops oversized expansions before constructing the full string', () => {
    const bomb = LZString.compressToEncodedURIComponent('a'.repeat(1000000));
    expect(bomb.length).toBeLessThan(MAX_ENCODED);
    expect(() => decode(bomb)).toThrow('size limit');
  });
  it('matches lz-string for varied UTF-16 content and repeated dictionary entries', () => {
    let seed = 42;
    for (let trial = 0; trial < 200; trial++) {
      let original = '你好 🌏 ';
      for (let i = 0; i < trial * 7; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        original += String.fromCharCode(seed % 65536);
      }
      if (trial % 2) original = original.repeat(3);
      const compressed = LZString.compressToEncodedURIComponent(original);
      expect(decompressBounded(compressed, 10000)).toBe(original);
    }
  });
});
