import { SiteHeader } from '../../shared/SiteHeader';
import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  countFor,
  expression,
  freshRun,
  generateBoard,
  LEVELS,
  OPERATORS,
  operatorsOf,
  startRun,
  STAGES,
  tap,
  targetOf,
  tick,
  type Board,
  type Difficulty,
  type Rule,
  type Operator,
  type Run,
} from './game';
import { encode, readBoard, restoreRun, saveRun, summary } from './state';
import './style.css';

const operationNames: Record<Operator, string> = {
  '+': 'Addition',
  '-': 'Subtraction',
  '*': 'Multiplication',
  '/': 'Division',
};

type Session = { board: Board; run: Run; notice: string };
function load(): Session {
  let board: Board;
  let notice = '';
  try {
    board = readBoard(location.href) ?? generateBoard();
  } catch {
    board = generateBoard();
    notice = 'That game link could not be read. We made you a fresh board.';
  }
  return { board, run: restoreRun(board, Date.now()), notice };
}
function App() {
  const [session, setSession] = useState(load);
  const { board, run } = session;
  const [message, setMessage] = useState(
    'Choose your settings, then start the game.',
  );
  const [error, setError] = useState<number | null>(null);
  const [focused, setFocused] = useState(0);
  const [manualCopy, setManualCopy] = useState('');
  const cells = useRef<(HTMLButtonElement | null)[]>([]);
  const result = useRef<HTMLHeadingElement>(null);
  const level = LEVELS[board.d];
  const operations = operatorsOf(board);
  const ready = run.status === 'ready';
  const target = targetOf(board, run);
  const finished = run.status === 'won' || run.status === 'lost';
  const previousReady = useRef(ready);
  const found =
    target === null
      ? 5
      : run.cleared.filter((i) => board.t[i][3] === target).length;
  const urgent =
    run.remaining < 5000 ? 'critical' : run.remaining < 10000 ? 'warning' : '';

  useEffect(() => {
    const url = new URL(location.href);
    url.searchParams.set('g', encode(board));
    history.replaceState(null, '', url);
  }, [board]);
  useEffect(() => {
    saveRun(board, run);
  }, [board, run.cleared, run.deadline, run.status]); // Deadlines survive refresh without saving every tick.
  useEffect(() => {
    if (run.status !== 'playing') return;
    const update = () =>
      setSession((s) => ({ ...s, run: tick(s.run, Date.now()) }));
    const interval = window.setInterval(update, 100);
    document.addEventListener('visibilitychange', update);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', update);
    };
  }, [run.status]);
  useEffect(() => {
    const navigate = () => {
      setSession(load());
      setMessage('Board loaded. Press Start game when ready.');
      setError(null);
      setManualCopy('');
    };
    window.addEventListener('popstate', navigate);
    return () => window.removeEventListener('popstate', navigate);
  }, []);
  useEffect(() => {
    if (error === null) return;
    const timeout = window.setTimeout(() => setError(null), 650);
    return () => clearTimeout(timeout);
  }, [error]);
  useEffect(() => {
    if (previousReady.current === ready) return;
    previousReady.current = ready;
    window.scrollTo(0, 0);
    if (ready) document.getElementById('title')?.focus({ preventScroll: true });
  }, [ready]);
  useEffect(() => {
    if (finished) result.current?.focus();
    else if (run.status === 'playing')
      cells.current[0]?.focus({ preventScroll: true });
  }, [finished, run.status]);
  useEffect(() => {
    if (run.status === 'playing' && run.remaining < 5000)
      setMessage('Less than five seconds left.');
    else if (run.status === 'playing' && run.remaining < 10000)
      setMessage('Less than ten seconds left.');
  }, [run.status, run.remaining < 5000, run.remaining < 10000]);

  function start(next: Board, same = false) {
    setSession({ board: next, run: freshRun(next), notice: '' });
    setMessage(
      same
        ? 'Same questions, fresh clock. Press Start game when ready.'
        : 'New board ready. Press Start game when ready.',
    );
    setError(null);
    setFocused(0);
    setManualCopy('');
    if (!same) {
      const url = new URL(location.href);
      url.searchParams.set('g', encode(next));
      history.pushState(null, '', url);
    }
  }
  function choose(index: number) {
    const now = Date.now();
    const before = tick(run, now);
    if (
      ready ||
      finished ||
      before.status === 'lost' ||
      run.cleared.includes(index)
    )
      return;
    const next = tap(board, run, index, now);
    setSession((s) => ({ ...s, run: next }));
    if (board.t[index][3] !== target) {
      setError(index);
      setMessage(
        `Try again. Minus ${level.penalty} ${level.penalty === 1 ? 'second' : 'seconds'}.`,
      );
    } else {
      setError(null);
      const nextTarget = targetOf(board, next);
      setMessage(
        next.status === 'won'
          ? 'All fifty found!'
          : nextTarget !== target
            ? `Timer reset to ${level.initial}s. Find all the ${nextTarget}s.`
            : `Timer reset to ${level.initial}s. ${countFor(target!) - found - 1} left in this stage.`,
      );
    }
  }
  function move(index: number, key: string) {
    const step =
      key === 'ArrowRight'
        ? 1
        : key === 'ArrowLeft'
          ? -1
          : key === 'ArrowDown'
            ? 5
            : -5;
    const next =
      key === 'Home'
        ? 0
        : key === 'End'
          ? 49
          : Math.max(0, Math.min(49, index + step));
    setFocused(next);
    cells.current[next]?.focus();
  }
  async function share(native = false) {
    const url = location.href;
    const text = finished
      ? summary(board, run, url)
      : `Number Search · ${board.d} · ${board.r === 'exact' ? 'Exact answer' : 'Last digit'}\nCan you clear all 50?\n${url}`;
    try {
      if (native && navigator.share)
        await navigator.share({ title: 'Number Search', text });
      else {
        await navigator.clipboard.writeText(text);
        setMessage(
          finished
            ? 'Result and board link copied.'
            : 'Board link copied. Your friend gets a fresh clock.',
        );
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setManualCopy(text);
      setMessage('Copy the text below to share your board.');
    }
  }

  return (
    <>
      {ready && <SiteHeader />}
      <div className={`page ${ready ? '' : 'play-page'}`}>
        <main
          className={ready ? '' : `play-screen ${finished ? 'is-finished' : ''}`}
        >
          {ready && (
            <section className="intro" aria-labelledby="title">
              <h1 id="title" tabIndex={-1}>
                Number
                <br />
                <em>Search</em>
                <span className="period">.</span>
              </h1>
              <div className="settings">
                <fieldset>
                  <legend>01 / PICK YOUR PACE</legend>
                  <div className="segmented">
                    {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
                      <label key={d}>
                        <input
                          type="radio"
                          name="difficulty"
                          checked={board.d === d}
                          onChange={() =>
                            start(
                              generateBoard(d, board.r, Math.random, operations),
                            )
                          }
                        />
                        <span>{d[0].toUpperCase() + d.slice(1)}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="rule-label" htmlFor="rule">
                  02 / ANSWER RULE
                </label>
                <select
                  id="rule"
                  value={board.r}
                  onChange={(e) =>
                    start(
                      generateBoard(
                        board.d,
                        e.target.value as Rule,
                        Math.random,
                        operations,
                      ),
                    )
                  }
                >
                  <option value="exact">Exact answer</option>
                  <option value="last">Last digit</option>
                </select>
                <fieldset className="operations">
                  <legend>03 / QUESTION TYPES</legend>
                  <div className="operation-options">
                    {OPERATORS.map((op) => (
                      <label key={op}>
                        <input
                          type="checkbox"
                          checked={operations.includes(op)}
                          disabled={
                            operations.length === 1 && operations.includes(op)
                          }
                          onChange={(e) =>
                            start(
                              generateBoard(
                                board.d,
                                board.r,
                                Math.random,
                                e.target.checked
                                  ? [...operations, op]
                                  : operations.filter((o) => o !== op),
                              ),
                            )
                          }
                        />
                        {operationNames[op]}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <p className="setting-note">
                  Changing a setting deals a new board.
                </p>
              </div>
              <details
                className="how"
                open={matchMedia('(min-width: 741px)').matches}
              >
                <summary>
                  How to play <span aria-hidden="true">↙</span>
                </summary>
                <ol>
                  <li>
                    Solve the expressions. Find every <strong>9</strong>, then{' '}
                    <strong>8</strong>, all the way to <strong>0</strong>.
                  </li>
                  <li>
                    Tap a match to clear it. A wrong tap costs{' '}
                    <strong>{level.penalty}s</strong>.
                  </li>
                  <li>
                    Every correct answer resets the timer to{' '}
                    <strong>{level.initial}s</strong>.
                  </li>
                </ol>
                <p>
                  {board.r === 'last'
                    ? 'Only the units digit counts: 7 × 7 = 49 counts as 9.'
                    : 'The whole answer must match: 12 − 3 = 9 counts as 9.'}
                </p>
                <p className="small">
                  Press Start game to reveal the board and start with{' '}
                  {level.initial}s. The clock keeps running if you leave the page.
                  No pausing, keep searching.
                </p>
              </details>
            </section>
          )}

          <section className={`game ${urgent}`} aria-label="Number Search game">
            {session.notice && (
              <p className="notice" role="alert">
                {session.notice}
              </p>
            )}
            {!ready && (
              <div className="hud">
                <div className="game-top">
                  <a className="eyebrow" href="/" aria-label="Tim Qi home">
                    TQ / NUMBER SEARCH
                  </a>
                  <span className="mode-badge">
                    {board.d} /{' '}
                    {board.r === 'exact' ? 'exact answer' : 'last digit'}
                  </span>
                </div>
                <div className="dashboard">
                  <div className="target">
                    <span>{finished ? 'SEARCH COMPLETE' : 'FIND ALL THE'}</span>
                    <div>
                      <strong>{target ?? '✓'}</strong>
                      <p>
                        {finished ? (
                          `${run.cleared.length} / 50 cleared`
                        ) : (
                          <>
                            <b>
                              {found} / {countFor(target!)}
                            </b>{' '}
                            found
                            <br />
                            <small>{countFor(target!) - found} remaining</small>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div
                    className="timer"
                    role="timer"
                    aria-label={`${Math.ceil(run.remaining / 1000)} seconds remaining`}
                  >
                    <span>TIME LEFT</span>
                    <strong>
                      {(run.remaining / 1000).toFixed(1)}
                      <small>s</small>
                    </strong>
                    <small>
                      {run.status === 'ready'
                        ? 'starts with the game'
                        : finished
                          ? 'clock stopped'
                          : 'keep going'}
                    </small>
                  </div>
                </div>
                <div className="timer-track" aria-hidden="true">
                  <div
                    style={{ width: `${run.remaining / (level.initial * 10)}%` }}
                  />
                </div>
                <div
                  className="stage-strip"
                  role="group"
                  aria-label="Target progress"
                >
                  {STAGES.map((d) => (
                    <span
                      key={d}
                      role="img"
                      className={
                        target === d
                          ? 'current'
                          : run.cleared.filter((i) => board.t[i][3] === d)
                                .length === countFor(d)
                            ? 'done'
                            : ''
                      }
                      aria-label={`${d}: ${run.cleared.filter((i) => board.t[i][3] === d).length} of ${countFor(d)} found`}
                    >
                      {d}
                    </span>
                  ))}
                  <span className="total">
                    {run.cleared.length}
                    <span> / 50</span>
                  </span>
                </div>
              </div>
            )}
            {ready ? (
              <div className="start-panel">
                <h2>Ready to search?</h2>
                <p>
                  The board appears when you start. Each correct answer resets
                  your {level.initial}s timer.
                </p>
                <button
                  className="primary"
                  onClick={() => {
                    setSession((s) => ({
                      ...s,
                      run: startRun(s.run, Date.now()),
                    }));
                    setMessage('Find all the 9s.');
                  }}
                >
                  Start game
                </button>
              </div>
            ) : (
              <div className="board-wrap">
                <div
                  className="board"
                  role="group"
                  aria-label="50 expression tiles"
                  aria-describedby="keyboard-help"
                >
                  {board.t.map((tile, i) => {
                    const cleared = run.cleared.includes(i);
                    return (
                      <button
                        key={i}
                        ref={(el) => {
                          cells.current[i] = el;
                        }}
                        tabIndex={i === focused ? 0 : -1}
                        onFocus={() => setFocused(i)}
                        aria-disabled={cleared || finished}
                        aria-label={`Tile ${i + 1}: ${cleared ? 'cleared' : expression(tile)}`}
                        className={`tile ${cleared ? 'cleared' : ''} ${error === i ? 'incorrect' : ''}`}
                        onClick={() => choose(i)}
                        onKeyDown={(e) => {
                          if (
                            e.key.startsWith('Arrow') ||
                            e.key === 'Home' ||
                            e.key === 'End'
                          ) {
                            e.preventDefault();
                            move(i, e.key);
                          }
                        }}
                      >
                        <span>{cleared ? '·' : expression(tile)}</span>
                      </button>
                    );
                  })}
                </div>
                {finished && (
                  <div className="result">
                    <span className="result-icon" aria-hidden="true">
                      {run.status === 'won' ? '✳' : '◷'}
                    </span>
                    <span className="eyebrow">
                      {run.status === 'won' ? 'A CLEAN SWEEP' : 'UNTIL NEXT TIME'}
                    </span>
                    <h2 ref={result} tabIndex={-1}>
                      {run.status === 'won'
                        ? 'Every number found.'
                        : 'Time’s up.'}
                    </h2>
                    <p>
                      {run.cleared.length} / 50 tiles cleared ·{' '}
                      {
                        STAGES.filter(
                          (d) =>
                            run.cleared.filter((i) => board.t[i][3] === d)
                              .length === countFor(d),
                        ).length
                      }{' '}
                      / 10 stages
                    </p>
                    <p>
                      {run.status === 'won'
                        ? `${(run.remaining / 1000).toFixed(1)}s remaining`
                        : `${Math.round((run.finishedAt! - run.startedAt!) / 1000)}s played`}
                      <br />
                      {board.d} ·{' '}
                      {board.r === 'exact' ? 'Exact answer' : 'Last digit'}
                    </p>
                    <button
                      className="primary"
                      onClick={() => start(board, true)}
                    >
                      ↻ Retry this board
                    </button>
                    <button
                      onClick={() =>
                        start(
                          generateBoard(
                            board.d,
                            board.r,
                            Math.random,
                            operations,
                          ),
                        )
                      }
                    >
                      New game ↗
                    </button>
                    <button className="text-button" onClick={() => share()}>
                      Copy result & challenge link
                    </button>
                    {typeof navigator.share === 'function' && (
                      <button className="text-button" onClick={() => share(true)}>
                        Share result…
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            <div
              className="feedback"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {message}
            </div>
            {!finished && (
              <div className="controls">
                <button
                  className="primary"
                  onClick={() =>
                    start(
                      generateBoard(board.d, board.r, Math.random, operations),
                    )
                  }
                >
                  New game <span aria-hidden="true">↗</span>
                </button>
                <button onClick={() => start(board, true)}>↻ Restart</button>
                <button onClick={() => share()}>Copy link</button>
                {typeof navigator.share === 'function' && (
                  <button onClick={() => share(true)}>Share</button>
                )}
              </div>
            )}
            {manualCopy && (
              <label className="copy-fallback">
                Copy your challenge
                <textarea
                  readOnly
                  value={manualCopy}
                  onFocus={(e) => e.target.select()}
                />
              </label>
            )}
            {!ready && (
              <p className="keyboard-help" id="keyboard-help">
                Arrow keys to explore · Enter or Space to pick
              </p>
            )}
          </section>
        </main>
        {ready && (
          <footer>
            <span>Number Search</span>
            <a href="/">Made by Tim Qi ↗</a>
          </footer>
        )}
      </div>
    </>
  );
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
