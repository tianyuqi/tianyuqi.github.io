export const QUESTION_COUNT = 5;
export const LIMITS = { title: 60, question: 200, player: 30, integer: 100 } as const;
export type Pair = [string, string];
export type Question = Pair;
export type Mode = 'builder' | 'game' | 'playing' | 'result';
export type Opponent = { p: string; a: Pair[] };
export type State = {
  v: 1;
  m: Mode;
  t: string;
  q: Question[];
  p?: string;
  a?: Pair[];
  i?: number;
  o?: Opponent;
  preview?: boolean;
  reveal?: boolean;
};

export function emptyPairs(): Pair[] {
  return Array.from({ length: QUESTION_COUNT }, () => ['', '']);
}
export function newBuilder(): State {
  return { v: 1, m: 'builder', t: '', q: emptyPairs() };
}
export function title(state: State): string {
  return state.t.trim() || 'Estimathon';
}
export function playerName(name?: string): string {
  return name?.trim() || 'Your friend';
}
export function validInteger(value: string): boolean {
  return /^\d{1,100}$/.test(value) && BigInt(value) >= 1n;
}
export function integerError(value: string): string {
  return validInteger(value) ? '' : 'Enter a positive whole number (1–100 digits).';
}
export function questionErrors([text, answer]: Question): [string, string] {
  return [
    text.trim() && text.length <= LIMITS.question ? '' : 'Enter a question (up to 200 characters).',
    integerError(answer),
  ];
}
export function intervalError([lower, upper]: Pair): string {
  if (!validInteger(lower) || !validInteger(upper))
    return 'Enter two positive whole numbers (1–100 digits each).';
  return BigInt(lower) <= BigInt(upper)
    ? ''
    : 'The lower bound must be less than or equal to the upper bound.';
}
export function completeQuestions(q: Question[]): boolean {
  return (
    q.length === QUESTION_COUNT && q.every((question) => questionErrors(question).every((error) => !error))
  );
}
export function completeAnswers(a?: Pair[]): a is Pair[] {
  return !!a && a.length === QUESTION_COUNT && a.every((pair) => !intervalError(pair));
}
export function formatInteger(value: string | bigint): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
export function inputNumber(value: string): string {
  const plain = value.replaceAll(',', '');
  return /^\d+$/.test(plain) ? plain.replace(/^0+(?=\d)/, '') : plain;
}
export type Status = 'green' | 'yellow' | 'red';
export const EMOJI: Record<Status, string> = { green: '🟢', yellow: '🟡', red: '🔴' };
export function scoreInterval(answer: string, bounds: Pair) {
  if (!validInteger(answer) || intervalError(bounds)) throw new Error('Cannot score invalid answers.');
  const [lower, upper] = bounds.map(BigInt);
  const correct = lower <= BigInt(answer) && BigInt(answer) <= upper;
  const status: Status = !correct ? 'red' : upper <= 2n * lower ? 'green' : 'yellow';
  return { status, points: correct ? (upper + lower - 1n) / lower : 0n };
}
export function scoreGame(q: Question[], a: Pair[]) {
  if (!completeQuestions(q) || !completeAnswers(a)) throw new Error('Complete all five questions first.');
  const intervals = q.map((question, i) => scoreInterval(question[1], a[i]));
  const counts = { green: 0, yellow: 0, red: 0 };
  for (const interval of intervals) counts[interval.status]++;
  const total =
    (10n + intervals.reduce((sum, interval) => sum + interval.points, 0n)) * 2n ** BigInt(counts.red);
  return { intervals, counts, total, circles: intervals.map((interval) => EMOJI[interval.status]).join(' ') };
}
// Display rounded ratios using integer arithmetic, even above Number.MAX_SAFE_INTEGER.
export function formatRatio([lower, upper]: Pair): string {
  const l = BigInt(lower),
    u = BigInt(upper);
  if (u % l === 0n) return `${formatInteger(u / l)}×`;
  const hundredths = (u * 100n + l / 2n) / l;
  return `≈ ${formatInteger(hundredths / 100n)}.${String(hundredths % 100n).padStart(2, '0')}×`;
}
export function gameLinkState(state: State): State {
  return { v: 1, m: 'game', t: state.t, q: state.q };
}
export function resultLinkState(state: State): State {
  return { v: 1, m: 'result', t: state.t, q: state.q, p: state.p || '', a: state.a };
}
export function startPlaying(state: State, challenge = false): State {
  return {
    ...gameLinkState(state),
    m: 'playing',
    p: '',
    a: emptyPairs(),
    i: 0,
    ...(challenge && state.a ? { o: { p: state.p || '', a: state.a } } : {}),
    ...(state.preview ? { preview: true } : {}),
  };
}
export function shareText(state: State, url: string): string {
  const result = scoreGame(state.q, state.a!);
  const heading = state.p?.trim()
    ? `${title(state)} — ${state.p.trim()}'s Results`
    : `${title(state)} — My Results`;
  return `${heading}\n\n${result.circles}\n\nScore: ${result.total} (lower is better)\n\n${result.counts.green} 🟢  ${result.counts.yellow} 🟡  ${result.counts.red} 🔴\n\nThink you can do better?\n${url}`;
}
