import { describe, expect, it } from 'vitest';
import {
  countFor,
  evaluate,
  freshRun,
  generateBoard,
  LEVELS,
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

describe('uninterrupted clock and stage loop', () => {
  const board = generateBoard();
  const indices = (digit: number) =>
    board.t.flatMap((t, i) => (t[3] === digit ? [i] : []));
  it('waits for the first tap, including a wrong first tap', () => {
    const ready = freshRun(board);
    expect(tick(ready, 999999)).toEqual(ready);
    const wrong = tap(board, ready, indices(8)[0], 1000);
    expect(wrong.status).toBe('playing');
    expect(wrong.cleared).toEqual([]);
    expect(wrong.remaining).toBe(28000);
    expect(wrong.deadline).toBe(29000);
  });
  it('ignores cleared or invalid taps and ends at zero without allowing late matches', () => {
    const index = indices(9)[0];
    const run = tap(board, freshRun(board), index, 1000);
    expect(tap(board, run, index, 1000)).toEqual(run);
    expect(tap(board, run, 50, 1000)).toEqual(run);
    const lost = tap(board, run, indices(9)[1], 31000);
    expect(lost.status).toBe('lost');
    expect(lost.cleared).toEqual([index]);
    expect(tap(board, lost, indices(9)[1], 32000)).toEqual(lost);
  });
  it('rolls remaining time forward, awards bonuses, caps at 60s, and never bonuses zero', () => {
    let run = freshRun(board);
    let now = 1000;
    const targets = [];
    for (const digit of STAGES) {
      targets.push(targetOf(board, run));
      const before = run.remaining;
      for (const index of indices(digit)) run = tap(board, run, index, now);
      const expected =
        digit === 0
          ? before
          : Math.min(60000, before + LEVELS.normal.bonus * 1000);
      expect(run.remaining).toBe(expected);
      if (digit !== 0) {
        now += 1000;
        run = tick(run, now);
      }
    }
    expect(targets).toEqual(STAGES);
    expect(run.status).toBe('won');
    expect(run.cleared).toHaveLength(50);
    expect(run.remaining).toBe(59000); // no last-stage bonus
    expect(targetOf(board, run)).toBeNull();
    expect(tick(run, now + 900000)).toEqual(run);
  });
  it('applies each preset’s time, penalty, and bonus', () => {
    for (const d of ['easy', 'normal', 'hard'] as Difficulty[]) {
      const b = generateBoard(d);
      let run = freshRun(b);
      expect(run.remaining).toBe(LEVELS[d].initial * 1000);
      run = tap(
        b,
        run,
        b.t.findIndex((t) => t[3] === 8),
        0,
      );
      expect(run.remaining).toBe(
        (LEVELS[d].initial - LEVELS[d].penalty) * 1000,
      );
      run = tick(run, 5000);
      for (let i = 0; i < 50; i++)
        if (b.t[i][3] === 9) run = tap(b, run, i, 5000);
      expect(run.remaining).toBe(
        Math.min(
          60,
          LEVELS[d].initial - LEVELS[d].penalty - 5 + LEVELS[d].bonus,
        ) * 1000,
      );
    }
  });
  it('can lose on a wrong tap and cannot recover with a bonus', () => {
    let run = tap(board, freshRun(board), indices(9)[0], 0);
    run = tap(board, run, indices(8)[0], 29000);
    expect(run.status).toBe('lost');
    expect(run.remaining).toBe(0);
    expect(run.finishedAt).toBe(29000);
  });
});
