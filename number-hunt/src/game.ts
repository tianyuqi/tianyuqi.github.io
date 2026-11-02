export type Difficulty = 'easy' | 'normal' | 'hard';
export type Rule = 'exact' | 'last';
export type Operator = '+' | '-' | '*' | '/';
// Balancing defaults, operand limits, and allowed operations live together.
export const LEVELS = {
  easy: {
    initial: 45,
    bonus: 25,
    penalty: 1,
    maxOperand: 20,
    maxFactor: 0,
    maxResult: 40,
    operators: ['+', '-'],
  },
  normal: {
    initial: 30,
    bonus: 20,
    penalty: 2,
    maxOperand: 30,
    maxFactor: 9,
    maxResult: 81,
    operators: ['+', '-', '*'],
  },
  hard: {
    initial: 20,
    bonus: 15,
    penalty: 3,
    maxOperand: 81,
    maxFactor: 12,
    maxResult: 144,
    operators: ['+', '-', '*', '/'],
  },
} as const;
export type Tile = [number, Operator, number, number]; // left, operator, right, hidden digit
export interface Board {
  v: 1;
  d: Difficulty;
  r: Rule;
  t: Tile[];
}
export const STAGES = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
export const countFor = (digit: number) => (digit === 0 ? 5 : digit);
export const evaluate = ([a, op, b]: Tile) =>
  op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b;
export const expression = ([a, op, b]: Tile) =>
  `${a} ${op === '*' ? '×' : op === '/' ? '÷' : op === '-' ? '−' : '+'} ${b}`;
export function validTile(
  tile: Tile,
  difficulty: Difficulty,
  rule: Rule,
): boolean {
  const [a, op, b, digit] = tile;
  const level = LEVELS[difficulty];
  const result = evaluate(tile);
  return (
    [a, b, digit].every(Number.isInteger) &&
    a >= 0 &&
    b >= 0 &&
    digit >= 0 &&
    digit <= 9 &&
    a <= level.maxOperand &&
    b <= level.maxOperand &&
    (level.operators as readonly string[]).includes(op) &&
    (op !== '*' || (a <= level.maxFactor && b <= level.maxFactor)) &&
    (op !== '/' || b !== 0) &&
    Number.isInteger(result) &&
    result >= 0 &&
    result <= level.maxResult &&
    (rule === 'exact' ? result === digit : result % 10 === digit)
  );
}
export function generateBoard(
  d: Difficulty = 'normal',
  r: Rule = 'exact',
  random = Math.random,
): Board {
  const level = LEVELS[d];
  const t: Tile[] = [];
  const shuffle = <T>(items: T[]) => {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  };
  for (const digit of STAGES) {
    const pool: Tile[] = [];
    for (const op of level.operators) {
      for (let a = 0; a <= level.maxOperand; a++) {
        for (let b = 0; b <= level.maxOperand; b++) {
          const tile: Tile = [a, op, b, digit];
          if (validTile(tile, d, r)) pool.push(tile);
        }
      }
    }
    // Every target has at least nine distinct candidates, including 0 and 1.
    t.push(...shuffle(pool).slice(0, countFor(digit)));
  }
  return { v: 1, d, r, t: shuffle(t) };
}
export interface Run {
  cleared: number[];
  remaining: number;
  deadline: number | null;
  startedAt: number | null;
  finishedAt: number | null;
  status: 'ready' | 'playing' | 'won' | 'lost';
}
export const freshRun = (board: Board): Run => ({
  cleared: [],
  remaining: LEVELS[board.d].initial * 1000,
  deadline: null,
  startedAt: null,
  finishedAt: null,
  status: 'ready',
});
export const targetOf = (board: Board, run: Run) =>
  STAGES.find(
    (digit) =>
      run.cleared.filter((i) => board.t[i][3] === digit).length <
      countFor(digit),
  ) ?? null;
export function tick(run: Run, now: number): Run {
  if (run.status !== 'playing') return run;
  const remaining = Math.max(0, run.deadline! - now);
  return {
    ...run,
    remaining,
    status: remaining ? 'playing' : 'lost',
    finishedAt: remaining ? null : run.deadline,
  };
}
export function tap(
  board: Board,
  previous: Run,
  index: number,
  now: number,
): Run {
  let run = tick(previous, now);
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= 50 ||
    run.cleared.includes(index) ||
    ['won', 'lost'].includes(run.status)
  )
    return run;
  if (run.status === 'ready')
    run = {
      ...run,
      status: 'playing',
      deadline: now + run.remaining,
      startedAt: now,
    };
  const target = targetOf(board, run);
  if (board.t[index][3] !== target) {
    const deadline = run.deadline! - LEVELS[board.d].penalty * 1000;
    const penalized = tick({ ...run, deadline }, now);
    return penalized.status === 'lost'
      ? { ...penalized, finishedAt: now }
      : penalized;
  }
  const cleared = [...run.cleared, index];
  if (cleared.length === 50)
    return { ...run, cleared, status: 'won', finishedAt: now };
  const next = { ...run, cleared };
  if (targetOf(board, next) !== target) {
    next.remaining = Math.min(
      60000,
      next.remaining + LEVELS[board.d].bonus * 1000,
    );
    next.deadline = now + next.remaining;
  }
  return next;
}
