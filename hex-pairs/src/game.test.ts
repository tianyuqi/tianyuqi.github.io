import { describe, expect, it } from 'vitest';
import { adjacent, availableHint, CELLS, complete, gameReducer, generatePuzzle, NEIGHBORS, solve, validPair, validPairs, type Game, type Mode, type Pair, type Puzzle } from './game';

const unique: Puzzle = { mode: 1, seed: 0, target: 9, numbers: [1, 2, 3, 8, 7, 6, 4, 2, 7, 5] };
const solution: Pair[] = [[0, 3], [1, 4], [2, 5], [6, 9], [7, 8]];

describe('hexagonal adjacency', () => {
  it('matches all edge neighbors in the 3–4–3 board', () => {
    expect(NEIGHBORS).toEqual([
      [1, 3, 4], [0, 2, 4, 5], [1, 5, 6],
      [0, 4, 7], [0, 1, 3, 5, 7, 8], [1, 2, 4, 6, 8, 9], [2, 5, 9],
      [3, 4, 8], [4, 5, 7, 9], [5, 6, 8],
    ]);
    for (let a = 0; a < CELLS.length; a++) {
      expect(adjacent(a, a)).toBe(false);
      for (let b = 0; b < CELLS.length; b++) expect(adjacent(a, b)).toBe(adjacent(b, a));
    }
    expect(adjacent(-1, 0)).toBe(false);
    expect(adjacent(0, 10)).toBe(false);
  });
});

describe('matching and completion', () => {
  it('requires a target sum, an edge, and unused distinct cells', () => {
    expect(validPair(unique, [0, 3])).toBe(true);
    expect(validPair(unique, [0, 4])).toBe(false);
    expect(validPair(unique, [1, 8])).toBe(false); // Right sum, wrong location.
    expect(validPairs(unique, [[1, 4], [4, 7]])).toBe(false);
    expect(complete(unique, solution.slice(0, 4))).toBe(false);
    expect(complete(unique, solution)).toBe(true);
    expect(complete(unique, [...solution.slice(0, 4), [1, 4]])).toBe(false);
  });
});

describe('backtracking solver', () => {
  it('finds a unique solution, counts ambiguous boards, and rejects impossible boards', () => {
    expect(solve(unique)).toEqual([solution]);
    const ambiguous = { ...unique, target: 2, numbers: Array(10).fill(1) };
    expect(solve(ambiguous)).toHaveLength(2);
    expect(solve(ambiguous, [], 1000).length).toBeGreaterThan(2);
    expect(solve({ ...unique, numbers: Array(10).fill(0) })).toEqual([]);
    expect(solve(unique, [[0, 1]])).toEqual([]);
  });
  it('hints respect existing pairs and report a blocked board', () => {
    expect(availableHint(unique, [[0, 3]])).toEqual([1, 4]);
    expect(availableHint(unique, [[4, 7]])).toBeUndefined(); // A legal pair that blocks completion.
    expect(availableHint(unique, solution)).toBeUndefined();
  });
});

describe.each([1, 2, 3] as Mode[])('generation in mode %i', mode => {
  it('is deterministic and varies by seed', () => {
    expect(generatePuzzle(mode, 123)).toEqual(generatePuzzle(mode, 123));
    expect(generatePuzzle(mode, 123).numbers).not.toEqual(generatePuzzle(mode, 124).numbers);
  });
  it('produces only in-range integers with exactly one complete solution across 500 seeds', () => {
    const max = 10 ** mode - 1;
    for (let seed = 0; seed < 500; seed++) {
      const puzzle = generatePuzzle(mode, seed);
      expect(puzzle.numbers).toHaveLength(10);
      expect(puzzle.numbers.every(n => Number.isInteger(n) && n >= 0 && n <= max)).toBe(true);
      expect(puzzle.target).toBeGreaterThanOrEqual(Math.ceil(max * .6));
      expect(puzzle.target).toBeLessThanOrEqual(Math.floor(max * 1.4));
      const solutions = solve(puzzle);
      expect(solutions).toHaveLength(1);
      expect(complete(puzzle, solutions[0])).toBe(true);
    }
  });
});

describe('move history', () => {
  const start: Game = { puzzle: unique, pairs: [], history: [] };
  it('supports pair, unpair, undo, reset, and new puzzle', () => {
    const first = gameReducer(start, { type: 'pair', pair: [0, 3] });
    const second = gameReducer(first, { type: 'pair', pair: [1, 4] });
    expect(gameReducer(second, { type: 'undo' })).toEqual(first);
    const removed = gameReducer(second, { type: 'remove', cell: 3 });
    expect(removed.pairs).toEqual([[1, 4]]);
    expect(gameReducer(removed, { type: 'undo' })).toEqual(second);
    const reset = gameReducer(second, { type: 'reset' });
    expect(reset.pairs).toEqual([]);
    expect(gameReducer(reset, { type: 'undo' })).toEqual(second);
    expect(gameReducer(second, { type: 'new', puzzle: unique })).toEqual(start);
  });
  it('ignores invalid moves and never reuses a cell', () => {
    const first = gameReducer(start, { type: 'pair', pair: [1, 4] });
    expect(gameReducer(first, { type: 'pair', pair: [4, 7] })).toBe(first);
    expect(gameReducer(start, { type: 'pair', pair: [1, 8] })).toBe(start);
    expect(gameReducer(start, { type: 'undo' })).toBe(start);
    expect(gameReducer(start, { type: 'remove', cell: 0 })).toBe(start);
  });
});
