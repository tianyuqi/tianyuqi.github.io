export type Mode = 1 | 2 | 3;
export type Pair = readonly [number, number];
export interface Puzzle {
  seed: number;
  mode: Mode;
  target: number;
  numbers: number[];
}

// Axial coordinates for pointy-top hexagons. The six offsets share an edge.
export const CELLS = [
  [0, 0], [1, 0], [2, 0],
  [-1, 1], [0, 1], [1, 1], [2, 1],
  [-1, 2], [0, 2], [1, 2],
] as const;

export function adjacent(a: number, b: number): boolean {
  if (!CELLS[a] || !CELLS[b] || a === b) return false;
  const dq = CELLS[a][0] - CELLS[b][0];
  const dr = CELLS[a][1] - CELLS[b][1];
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)) === 1;
}

export const NEIGHBORS = CELLS.map((_, a) =>
  CELLS.flatMap((_, b) => adjacent(a, b) ? [b] : []));

export function validPair(puzzle: Puzzle, [a, b]: Pair): boolean {
  return adjacent(a, b) && puzzle.numbers[a] + puzzle.numbers[b] === puzzle.target;
}

export function validPairs(puzzle: Puzzle, pairs: readonly Pair[]): boolean {
  return pairs.every(pair => validPair(puzzle, pair)) &&
    new Set(pairs.flat()).size === pairs.length * 2;
}

export function complete(puzzle: Puzzle, pairs: readonly Pair[]): boolean {
  return pairs.length === 5 && validPairs(puzzle, pairs);
}

// Explore perfect matchings, stopping at `limit`. Using the first free cell
// prevents counting the same solution in different pair orders.
function matchings(canPair: (a: number, b: number) => boolean, used: Set<number>, limit: number): Pair[][] {
  const results: Pair[][] = [];
  function visit(path: Pair[]) {
    if (results.length >= limit) return;
    const a = CELLS.findIndex((_, index) => !used.has(index));
    if (a === -1) {
      results.push([...path]);
      return;
    }
    used.add(a);
    for (const b of NEIGHBORS[a]) {
      if (used.has(b) || !canPair(a, b)) continue;
      used.add(b);
      path.push([a, b]);
      visit(path);
      path.pop();
      used.delete(b);
    }
    used.delete(a);
  }
  visit([]);
  return results;
}

export function solve(puzzle: Puzzle, pairs: readonly Pair[] = [], limit = 2): Pair[][] {
  if (!validPairs(puzzle, pairs)) return [];
  return matchings((a, b) => validPair(puzzle, [a, b]), new Set(pairs.flat()), limit)
    .map(rest => [...pairs, ...rest]);
}

export function availableHint(puzzle: Puzzle, pairs: readonly Pair[]): Pair | undefined {
  return solve(puzzle, pairs, 1)[0]?.[pairs.length];
}

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const layouts = matchings(() => true, new Set(), Infinity);

export function generatePuzzle(mode: Mode, seed: number): Puzzle {
  const random = seededRandom(seed);
  const max = 10 ** mode - 1;
  const integer = (min: number, upper: number) => min + Math.floor(random() * (upper - min + 1));
  for (let attempt = 0; attempt < 500; attempt++) {
    const target = integer(Math.ceil(max * 0.6), Math.floor(max * 1.4));
    const layout = layouts[integer(0, layouts.length - 1)];
    const numbers = Array<number>(10).fill(0);
    for (const [a, b] of layout) {
      numbers[a] = integer(Math.max(0, target - max), Math.min(max, target));
      numbers[b] = target - numbers[a];
    }
    const puzzle = { mode, seed, target, numbers };
    if (solve(puzzle).length === 1) return puzzle;
  }
  // A prevalidated unique board gives generation a bounded runtime even for
  // an unlucky seed. Scaling preserves both equality and the unique matching.
  const scale = max / 9;
  return { mode, seed, target: 9 * scale, numbers: [1, 2, 3, 8, 7, 6, 4, 2, 7, 5].map(n => n * scale) };
}

export interface Game {
  puzzle: Puzzle;
  pairs: Pair[];
  history: Pair[][];
}
export type Action = { type: 'pair'; pair: Pair } | { type: 'remove'; cell: number } |
  { type: 'undo' } | { type: 'reset' } | { type: 'new'; puzzle: Puzzle };

export function gameReducer(game: Game, action: Action): Game {
  if (action.type === 'new') return { puzzle: action.puzzle, pairs: [], history: [] };
  if (action.type === 'undo') {
    const previous = game.history.at(-1);
    return previous ? { ...game, pairs: previous, history: game.history.slice(0, -1) } : game;
  }
  let pairs: Pair[];
  if (action.type === 'pair') {
    pairs = [...game.pairs, action.pair];
    if (!validPairs(game.puzzle, pairs)) return game;
  } else if (action.type === 'remove') {
    pairs = game.pairs.filter(pair => !pair.includes(action.cell));
  } else {
    pairs = [];
  }
  if (pairs.length === game.pairs.length) return game;
  return { ...game, pairs, history: [...game.history, game.pairs] };
}
