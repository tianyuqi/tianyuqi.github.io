import LZString from 'lz-string';
import { decompressBounded } from '../../estimathon/src/decompress';
import {
  countFor,
  freshRun,
  LEVELS,
  OPERATORS,
  operatorsOf,
  STAGES,
  targetOf,
  tick,
  validTile,
  type Board,
  type Run,
  type Tile,
} from './game';

export function validateBoard(value: unknown): Board {
  if (!value || typeof value !== 'object') throw new Error('Invalid board.');
  const b = value as Board;
  if (
    b.v !== 1 ||
    !Object.hasOwn(LEVELS, b.d) ||
    !['exact', 'last'].includes(b.r) ||
    (b.o !== undefined &&
      (!Array.isArray(b.o) ||
        !b.o.length ||
        new Set(b.o).size !== b.o.length ||
        !b.o.every((op) => OPERATORS.includes(op)))) ||
    !Array.isArray(b.t) ||
    b.t.length !== 50
  )
    throw new Error('Invalid board version or settings.');
  if (
    !b.t.every(
      (t) =>
        Array.isArray(t) &&
        t.length === 4 &&
        validTile(t, b.d, b.r, operatorsOf(b)),
    ) ||
    !STAGES.every((d) => b.t.filter((t) => t[3] === d).length === countFor(d))
  )
    throw new Error('Invalid board expressions or distribution.');
  return {
    v: 1,
    d: b.d,
    r: b.r,
    ...(b.o ? { o: [...b.o] } : {}),
    t: b.t.map((t) => [...t] as Tile),
  };
}
export const encode = (board: Board) =>
  LZString.compressToEncodedURIComponent(JSON.stringify(validateBoard(board)));
export function decode(payload: string): Board {
  if (!payload || payload.length > 4000 || !/^[A-Za-z0-9+\-$]+$/.test(payload))
    throw new Error('Invalid game link.');
  return validateBoard(JSON.parse(decompressBounded(payload, 4000)));
}
export function readBoard(url: string): Board | null {
  const params = new URL(url).searchParams;
  if (!params.has('g')) return null;
  if (params.getAll('g').length !== 1) throw new Error('Duplicate game data.');
  return decode(params.get('g')!);
}
const STORAGE = 'number-hunt:run:v1';
export function saveRun(board: Board, run: Run) {
  try {
    localStorage.setItem(STORAGE, JSON.stringify({ key: encode(board), run }));
  } catch {
    /* Storage is optional. */
  }
}
export function restoreRun(board: Board, now: number): Run {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE) || 'null');
    if (stored?.key !== encode(board)) return freshRun(board);
    const r = stored.run as Run;
    if (
      !r ||
      !Array.isArray(r.cleared) ||
      r.cleared.length > 50 ||
      new Set(r.cleared).size !== r.cleared.length ||
      !r.cleared.every((i) => Number.isInteger(i) && i >= 0 && i < 50) ||
      !Number.isFinite(r.remaining) ||
      r.remaining < 0 ||
      r.remaining > LEVELS[board.d].initial * 1000 ||
      !['ready', 'playing', 'won', 'lost'].includes(r.status)
    )
      return freshRun(board);
    const target = targetOf(board, r);
    if (target !== null && r.cleared.some((i) => board.t[i][3] < target))
      return freshRun(board);
    if (r.status === 'ready') return freshRun(board);
    if (
      !Number.isFinite(r.startedAt) ||
      r.startedAt! > now ||
      !Number.isFinite(r.deadline) ||
      r.deadline! - now > LEVELS[board.d].initial * 1000 ||
      (r.status === 'won') !== (r.cleared.length === 50) ||
      (r.status === 'playing'
        ? r.finishedAt !== null
        : !Number.isFinite(r.finishedAt))
    )
      return freshRun(board);
    return tick(r, now);
  } catch {
    return freshRun(board);
  }
}
export function summary(board: Board, run: Run, url: string): string {
  const stages = STAGES.map((d) =>
    run.cleared.filter((i) => board.t[i][3] === d).length === countFor(d)
      ? '🟩'
      : '⬜',
  ).join('');
  return `Number Search ${run.status === 'won' ? '🏆' : '⏱'} ${run.cleared.length}/50\n${board.d[0].toUpperCase() + board.d.slice(1)} · ${board.r === 'exact' ? 'Exact answer' : 'Last digit'}\n${stages}\n${run.status === 'won' ? `${Math.ceil(run.remaining / 1000)}s left` : `${Math.round(((run.finishedAt ?? Date.now()) - (run.startedAt ?? Date.now())) / 1000)}s played`}\nTry my board: ${url}`;
}
