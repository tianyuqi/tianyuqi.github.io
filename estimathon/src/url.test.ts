import { describe, expect, it } from 'vitest';
import LZString from 'lz-string';
import { decompressBounded } from './decompress';
import { emptyPairs, gameLinkState, newBuilder, resultLinkState, startPlaying, type State } from './game';
import { SAMPLE, SAMPLES } from './sample';
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
    ...SAMPLES.map(({ game }) => game),
    { ...SAMPLE, preview: true },
    startPlaying({ ...SAMPLE, preview: true }),
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
      expect(url).toMatch(/^https:\/\/tianyuqi.github.io\/estimathon\/#d=/);
      expect(new URL(url).search).toBe('');
      expect(readUrl(url)).toEqual(state.m === 'game' ? gameLinkState(state) : state);
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
    expect(stateUrl(null, 'https://example.com/old?d=x#d=y')).toBe('https://example.com/estimathon/');
  });
  it('reads legacy query links and rewrites them without query data', () => {
    const legacy = new URL('https://example.com/estimathon/');
    legacy.searchParams.set('d', encode(SAMPLE));
    expect(readUrl(legacy.href)).toEqual(SAMPLE);
    const rewritten = stateUrl(readUrl(legacy.href), legacy.href);
    expect(new URL(rewritten).search).toBe('');
    expect(readUrl(rewritten)).toEqual(SAMPLE);
  });
  it('prefers fragment state over legacy query data without hiding invalid fragments', () => {
    const url = stateUrl(finished, 'https://example.com');
    const mixed = new URL(url);
    mixed.searchParams.set('d', encode(SAMPLE));
    expect(readUrl(mixed.href)).toEqual(finished);
    mixed.hash = 'd=broken';
    expect(() => readUrl(mixed.href)).toThrow();
    mixed.hash = 'd=';
    expect(() => readUrl(mixed.href)).toThrow();
  });
  it('ignores unrelated query and fragment parameters', () => {
    expect(readUrl('https://example.com/estimathon/?topic=space#help')).toBeNull();
    const url = stateUrl(SAMPLE, 'https://example.com');
    expect(readUrl(`${url}&view=game`)).toEqual(SAMPLE);
  });
  it('publishes playable game URLs while keeping the author preview state intact', () => {
    const preview: State = { ...SAMPLE, preview: true };
    const url = stateUrl(preview, 'https://tianyuqi.github.io');
    expect(decode(new URLSearchParams(new URL(url).hash.slice(1)).get('d')!)).toEqual(SAMPLE);
    expect(startPlaying(readUrl(url)!).preview).toBeUndefined();
    expect(startPlaying(preview).preview).toBe(true);
    expect(preview.preview).toBe(true);
  });
  it('opens the reported legacy preview URL as the intended playable Growth Metrics game', () => {
    const url = 'https://tianyuqi.github.io/estimathon/?d=N4IgbiBcCMA0IFsogOYEMEFMTwC7IHEAnAewHdcALAAgFlNciBLAYwGccQBHKAbV5AAJctQRoAdgE9q4zGWpkSRANZsADmhaY2CzEUzUW%2BtLkwATak3HUqBxmiYAbKymoB2ambSSdACgAqlEw6ZJiYygCUAPycAMwAbAAM0ACcIAC6sALC8mJS1Jq4TGAGAK5sejq6%2BtT6LEpm5pbWtjZEDs7irh5ePtQBQSFhkTHwKakALLHQGVlCInnSVmBMpkM1mlpqphZWNpR27U4u7p7efoHBuuHRnNAATA%2BJswIA6pQmCmg6uCS4aI4CuJxKUAbVMCxSkRmF1wSUQQY9mYSI5HGgiBdBtdlIYUaUEOJbvBoBMABwTCnxKYvea5CTSRhMMFsf5EXDrAx1BpNPatezHWE9c79S5DG6jEATACsUoymRAan0KzkUEYpUwAF8gA';
    const legacy = decode(new URL(url).searchParams.get('d')!);
    expect(legacy.preview).toBe(true);
    const game = readUrl(url)!;
    expect(game).toEqual(gameLinkState(legacy));
    expect(game.t).toBe('Growth Metrics');
    expect(game.q.map(([, answer]) => answer)).toEqual(['36019', '919431', '12120', '148444643', '455']);
    const playing = startPlaying(game);
    expect(playing.m).toBe('playing');
    expect(playing.preview).toBeUndefined();
    expect(playing.a).toEqual(emptyPairs());
    expect(playing.i).toBe(0);
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
  it.each(['?', '#'])('rejects duplicate data parameters in %s', (prefix) =>
    expect(() => readUrl(`https://example.com/${prefix}d=${encode(SAMPLE)}&d=other`)).toThrow('duplicate'));
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
    const bomb = LZString.compressToEncodedURIComponent('a'.repeat(32000));
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
