import LZString from 'lz-string';
import { decompressBounded } from './decompress';
import { completeAnswers, completeQuestions, LIMITS, type Pair, type State } from './game';

export const MAX_ENCODED = 12000;
const MAX_JSON = 16000;
export const LONG_URL = 7000;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function text(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length <= max;
}
function pairs(value: unknown, firstMax: number, secondMax: number): value is Pair[] {
  return (
    Array.isArray(value) &&
    value.length === 5 &&
    value.every(
      (pair) =>
        Array.isArray(pair) && pair.length === 2 && text(pair[0], firstMax) && text(pair[1], secondMax),
    )
  );
}
// Reconstruct only known fields. Completed/published states have stricter rules than drafts.
export function validateState(value: unknown): State {
  if (!record(value)) throw new Error('This game link is invalid.');
  if (value.v !== 1) throw new Error('This game link uses an unsupported version.');
  if (
    !['builder', 'game', 'playing', 'result'].includes(String(value.m)) ||
    !text(value.t, LIMITS.title) ||
    !pairs(value.q, LIMITS.question, LIMITS.integer)
  ) {
    throw new Error('This game link is invalid or incomplete.');
  }
  const state: State = { v: 1, m: value.m as State['m'], t: value.t, q: value.q };
  if (state.m !== 'builder' && !completeQuestions(state.q))
    throw new Error('This game needs five valid questions.');
  if (value.preview !== undefined) {
    if (typeof value.preview !== 'boolean') throw new Error('Invalid preview.');
    state.preview = value.preview;
  }
  if (state.m === 'playing' || state.m === 'result') {
    if (!text(value.p, LIMITS.player) || !pairs(value.a, LIMITS.integer, LIMITS.integer))
      throw new Error('This game has invalid player answers.');
    state.p = value.p;
    state.a = value.a;
    if (state.m === 'playing') {
      if (!Number.isInteger(value.i) || Number(value.i) < 0 || Number(value.i) > 4)
        throw new Error('Invalid question number.');
      state.i = Number(value.i);
    } else if (!completeAnswers(state.a)) throw new Error('These results are incomplete.');
    if (value.o !== undefined) {
      if (
        !record(value.o) ||
        !text(value.o.p, LIMITS.player) ||
        !pairs(value.o.a, LIMITS.integer, LIMITS.integer) ||
        !completeAnswers(value.o.a)
      )
        throw new Error('Invalid challenge results.');
      state.o = { p: value.o.p, a: value.o.a };
    }
    if (value.reveal !== undefined) {
      if (typeof value.reveal !== 'boolean') throw new Error('Invalid results view.');
      state.reveal = value.reveal;
    }
  }
  return state;
}
export function encode(state: State): string {
  const json = JSON.stringify(validateState(state));
  if (json.length > MAX_JSON) throw new Error('This game is too large for a link.');
  const encoded = LZString.compressToEncodedURIComponent(json);
  if (encoded.length > MAX_ENCODED) throw new Error('This game link is too long. Try shorter questions.');
  return encoded;
}
export function decode(encoded: string): State {
  if (!encoded || encoded.length > MAX_ENCODED || !/^[A-Za-z0-9+\-$]+$/.test(encoded))
    throw new Error('This game link is invalid or too large.');
  try {
    const json = decompressBounded(encoded, MAX_JSON);
    if (!json || json.length > MAX_JSON) throw new Error();
    return validateState(JSON.parse(json));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('This')) throw error;
    throw new Error('This game link is damaged or incomplete. Ask for a new link.');
  }
}
export function stateUrl(state: State | null, base: string): string {
  const url = new URL('/estimathon/', base);
  if (state) url.searchParams.set('d', encode(state));
  return url.href;
}
export function readUrl(url: string): State | null {
  const params = new URL(url).searchParams;
  if (!params.has('d')) return null;
  if (params.getAll('d').length !== 1) throw new Error('This game link contains duplicate data.');
  return decode(params.get('d')!);
}
