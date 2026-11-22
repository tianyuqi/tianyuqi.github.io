import { describe, expect, it, vi } from 'vitest';
import { adjacent, availableHint, CELLS, complete, competingMatches, factorPairs, gameReducer, generateMultiplicationPuzzle, generatePuzzle, MULTIPLICATION_LEVELS, NEIGHBORS, solve, validPair, validPairs, type Difficulty, type Game, type Mode, type Pair, type Puzzle } from './game';

const unique: Puzzle = { operation: 'addition', mode: 1, seed: 0, target: 9, numbers: [1, 2, 3, 8, 7, 6, 4, 2, 7, 5] };
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

describe('multiplication factors and matching', () => {
  const puzzle = generateMultiplicationPuzzle('medium', 0);
  it('enumerates bounded positive integer factors, including square factors once', () => {
    expect(factorPairs(24, 12)).toEqual([[2, 12], [3, 8], [4, 6]]);
    expect(factorPairs(36, 12)).toEqual([[3, 12], [4, 9], [6, 6]]);
    expect(factorPairs(120, 24)).toEqual([[5, 24], [6, 20], [8, 15], [10, 12]]);
    expect(factorPairs(1, 12)).toEqual([[1, 1]]);
    for (const target of [0, -24, 2.5]) expect(factorPairs(target, 12)).toEqual([]);
    expect(factorPairs(13, 12)).toEqual([]);
  });
  it('requires a product and adjacency, and rejects sums and reused cells', () => {
    const board: Puzzle = { operation: 'multiplication', difficulty: 'easy', seed: 0, target: 24,
      numbers: [3, 8, 21, 4, 6, 3, 8, 2, 12, 6] };
    expect(validPair(board, [0, 1])).toBe(true);
    expect(validPair({ ...board, numbers: [3, 21, ...board.numbers.slice(2)] }, [0, 1])).toBe(false); // Sum is 24.
    expect(validPair(board, [0, 6])).toBe(false); // Product is 24, but no shared edge.
    expect(validPair(board, [3, 4])).toBe(true);
    expect(validPair(board, [0, 0])).toBe(false);
    expect(validPairs(board, [[0, 1], [1, 5]])).toBe(false);
    expect(validPair({ ...board, numbers: Array(10).fill(6), target: 36 }, [0, 1])).toBe(true);
  });
  it('detects multiple and missing product solutions', () => {
    expect(solve({ ...puzzle, target: 36, numbers: Array(10).fill(6) })).toHaveLength(2);
    expect(solve({ ...puzzle, target: 36, numbers: Array(10).fill(5) })).toEqual([]);
  });
  it('supports hints, blocked matches, completion, removal, undo, reset, and new puzzles', () => {
    let game: Game = { puzzle, pairs: [], history: [] };
    const solution = solve(puzzle)[0];
    const blocked = NEIGHBORS.flatMap((neighbors, a) => neighbors
      .filter(b => b > a && validPair(puzzle, [a, b]) && solve(puzzle, [[a, b]]).length === 0)
      .map(b => [a, b] as Pair))[0];
    expect(blocked).toBeDefined();
    expect(availableHint(puzzle, [blocked])).toBeUndefined();
    for (const pair of solution) {
      expect(validPair(puzzle, availableHint(puzzle, game.pairs)!)).toBe(true);
      game = gameReducer(game, { type: 'pair', pair });
    }
    expect(complete(puzzle, game.pairs)).toBe(true);
    expect(availableHint(puzzle, game.pairs)).toBeUndefined();
    const removed = gameReducer(game, { type: 'remove', cell: solution[0][0] });
    expect(removed.pairs).toHaveLength(4);
    expect(gameReducer(removed, { type: 'undo' })).toEqual(game);
    const reset = gameReducer(game, { type: 'reset' });
    expect(reset.pairs).toEqual([]);
    expect(gameReducer(reset, { type: 'undo' })).toEqual(game);
    expect(gameReducer(game, { type: 'new', puzzle: unique })).toEqual({ puzzle: unique, pairs: [], history: [] });
  });
});

describe.each(['easy', 'medium', 'hard'] as Difficulty[])('multiplication generation: %s', difficulty => {
  const level = MULTIPLICATION_LEVELS[difficulty];
  it('is deterministic and varies by seed', () => {
    expect(generateMultiplicationPuzzle(difficulty, 123)).toEqual(generateMultiplicationPuzzle(difficulty, 123));
    expect(generateMultiplicationPuzzle(difficulty, 123).numbers).not.toEqual(generateMultiplicationPuzzle(difficulty, 124).numbers);
  });
  it('generates five factor pairs, one solution, and the required competing matches across 500 seeds', () => {
    const targets = new Set<number>();
    for (let seed = 0; seed < 500; seed++) {
      const puzzle = generateMultiplicationPuzzle(difficulty, seed);
      targets.add(puzzle.target);
      expect(puzzle.operation).toBe('multiplication');
      expect(puzzle).toMatchObject({ difficulty, seed });
      expect(puzzle.numbers).toHaveLength(10);
      expect(puzzle.numbers.every(n => Number.isInteger(n) && n > 0 && n <= level.maxFactor && puzzle.target % n === 0)).toBe(true);
      const solutions = solve(puzzle, [], 1000);
      expect(solutions).toHaveLength(1);
      expect(complete(puzzle, solutions[0])).toBe(true);
      const facts = new Set(solutions[0].map(([a, b]) => Math.min(puzzle.numbers[a], puzzle.numbers[b])));
      expect(facts.size).toBeGreaterThanOrEqual(Math.min(3, factorPairs(puzzle.target, level.maxFactor).length));
      expect(competingMatches(puzzle)).toBeGreaterThanOrEqual(level.minCompeting);
      expect(competingMatches(puzzle)).toBeLessThanOrEqual(level.maxCompeting);
    }
    expect([...targets].sort((a, b) => a - b)).toEqual([...level.targets]);
  });
  it('falls back to a unique board at the same difficulty if random candidates are exhausted', () => {
    const random = vi.spyOn(Math, 'imul').mockReturnValue(0);
    let puzzle: Puzzle;
    try { puzzle = generateMultiplicationPuzzle(difficulty, 42); }
    finally { random.mockRestore(); }
    expect(puzzle).toMatchObject({ operation: 'multiplication', difficulty, seed: 42 });
    expect(solve(puzzle, [], 1000)).toHaveLength(1);
    expect(competingMatches(puzzle)).toBeGreaterThanOrEqual(level.minCompeting);
    expect(competingMatches(puzzle)).toBeLessThanOrEqual(level.maxCompeting);
  });
});
