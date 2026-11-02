import { describe, expect, it } from 'vitest';
import {
  countFor,
  evaluate,
  freshRun,
  generateBoard,
  LEVELS,
  OPERATORS,
  startRun,
  STAGES,
  tap,
  targetOf,
  tick,
  validTile,
  type Difficulty,
  type Rule,
} from './game';

describe('board generation', () => {
  for (const d of ['easy', 'normal', 'hard'] as Difficulty[])
    for (const r of ['exact', 'last'] as Rule[]) {
      it(`generates valid, varied ${d}/${r} boards with the exact distribution`, () => {
        const seen = new Set<string>();
        let larger = false;
        for (let n = 0; n < 16; n++) {
          const board = generateBoard(d, r);
          expect(board.t).toHaveLength(50);
          for (const digit of STAGES)
            expect(board.t.filter((t) => t[3] === digit)).toHaveLength(
              countFor(digit),
            );
          for (const tile of board.t) {
            expect(validTile(tile, d, r)).toBe(true);
            expect(Number.isInteger(evaluate(tile))).toBe(true);
            larger ||= evaluate(tile) > 9;
          }
          expect(new Set(board.t.map((t) => JSON.stringify(t))).size).toBe(50);
          seen.add(JSON.stringify(board));
        }
        expect(seen.size).toBe(16);
        expect(larger).toBe(r === 'last');
      });
    }
});

describe('explicit start, timer resets, and stage loop', () => {
  const board = generateBoard();
  const indices = (digit: number) =>
    board.t.flatMap((t, i) => (t[3] === digit ? [i] : []));
  const playing = () => startRun(freshRun(board), 1000);

  it('waits for Start game and ignores tiles until then', () => {
    const ready = freshRun(board);
    expect(tick(ready, 999999)).toEqual(ready);
    expect(tap(board, ready, indices(9)[0], 1000)).toEqual(ready);
    const run = playing();
    expect(run.status).toBe('playing');
    expect(run.deadline).toBe(31000);
    expect(run.startedAt).toBe(1000);
    expect(startRun(run, 5000)).toEqual(run);
  });
  it('resets time on every match, including within a stage and after a penalty', () => {
    let run = tap(board, playing(), indices(8)[0], 11000);
    expect(run.remaining).toBe(18000);
    expect(run.deadline).toBe(29000);
    run = tap(board, run, indices(9)[0], 12000);
    expect(run.remaining).toBe(30000);
    expect(run.deadline).toBe(42000);
    run = tap(board, run, indices(9)[1], 40000);
    expect(run.remaining).toBe(30000);
    expect(run.deadline).toBe(70000);
    expect(run.startedAt).toBe(1000);
  });
  it('ignores cleared or invalid taps and disallows late matches', () => {
    const index = indices(9)[0];
    const run = tap(board, playing(), index, 1000);
    expect(tap(board, run, index, 1000)).toEqual(run);
    expect(tap(board, run, 50, 1000)).toEqual(run);
    const lost = tap(board, run, indices(9)[1], 31000);
    expect(lost.status).toBe('lost');
    expect(lost.cleared).toEqual([index]);
    expect(tap(board, lost, indices(9)[1], 32000)).toEqual(lost);
  });
  it('advances through every target and resets even on the winning match', () => {
    let run = playing();
    let now = 1000;
    const targets = [];
    for (const digit of STAGES) {
      targets.push(targetOf(board, run));
      for (const index of indices(digit)) {
        now += 1000;
        run = tap(board, run, index, now);
        expect(run.remaining).toBe(30000);
        expect(run.deadline).toBe(now + 30000);
      }
    }
    expect(targets).toEqual(STAGES);
    expect(run.status).toBe('won');
    expect(run.cleared).toHaveLength(50);
    expect(targetOf(board, run)).toBeNull();
    expect(tick(run, now + 900000)).toEqual(run);
  });
  it('applies each pace’s starting time, penalty, and reset duration', () => {
    for (const d of ['easy', 'normal', 'hard'] as Difficulty[]) {
      const b = generateBoard(d);
      let run = startRun(freshRun(b), 0);
      expect(run.remaining).toBe(LEVELS[d].initial * 1000);
      run = tap(
        b,
        run,
        b.t.findIndex((t) => t[3] === 8),
        5000,
      );
      expect(run.remaining).toBe(
        (LEVELS[d].initial - LEVELS[d].penalty - 5) * 1000,
      );
      run = tap(
        b,
        run,
        b.t.findIndex((t) => t[3] === 9),
        6000,
      );
      expect(run.remaining).toBe(LEVELS[d].initial * 1000);
      expect(run.deadline).toBe(6000 + LEVELS[d].initial * 1000);
    }
  });
  it('can lose on a wrong tap and cannot recover with a match', () => {
    const run = tap(board, playing(), indices(8)[0], 30000);
    expect(run.status).toBe('lost');
    expect(run.remaining).toBe(0);
    expect(run.finishedAt).toBe(30000);
    expect(tap(board, run, indices(9)[0], 30000)).toEqual(run);
  });
});

describe('selectable operations', () => {
  for (const d of ['easy', 'normal', 'hard'] as Difficulty[])
    for (const r of ['exact', 'last'] as Rule[])
      for (let mask = 1; mask < 16; mask++) {
        const operations = OPERATORS.filter((_, i) => mask & (1 << i));
        it(`supports ${d}/${r} with ${operations.join(', ')}`, () => {
          const board = generateBoard(d, r, Math.random, operations);
          expect(board.o).toEqual(operations);
          expect(board.t).toHaveLength(50);
          for (const digit of STAGES)
            expect(board.t.filter((tile) => tile[3] === digit)).toHaveLength(
              countFor(digit),
            );
          for (const tile of board.t) {
            expect(operations).toContain(tile[1]);
            expect(validTile(tile, d, r, operations)).toBe(true);
          }
        });
      }
  it('requires at least one supported operation', () => {
    expect(() => generateBoard('easy', 'exact', Math.random, [])).toThrow();
  });
});
