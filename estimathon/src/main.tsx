import { StrictMode, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  completeAnswers,
  completeQuestions,
  EMOJI,
  formatInteger,
  formatRatio,
  gameLinkState,
  inputNumber,
  integerError,
  intervalError,
  LIMITS,
  newBuilder,
  playerName,
  questionErrors,
  resultLinkState,
  scoreGame,
  shareText,
  startPlaying,
  title,
  validInteger,
  type Pair,
  type State,
} from './game';
import { SAMPLE } from './sample';
import { LONG_URL, readUrl, stateUrl } from './url';
import './style.css';

type Route = { state: State | null; error: string };
function load(): Route {
  try {
    return { state: readUrl(location.href), error: '' };
  } catch (error) {
    return { state: null, error: error instanceof Error ? error.message : 'Unable to open this link.' };
  }
}
function useUrlState() {
  const [route, setRoute] = useState(load);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pending = useRef<string | undefined>(undefined);
  const flush = useCallback(() => {
    clearTimeout(timer.current);
    if (pending.current) history.replaceState(null, '', pending.current);
    pending.current = undefined;
  }, []);
  useEffect(() => {
    const pop = () => {
      clearTimeout(timer.current);
      pending.current = undefined;
      setRoute(load());
    };
    const hidden = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('popstate', pop);
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      flush();
      window.removeEventListener('popstate', pop);
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [flush]);
  const update = (state: State | null, push = false) => {
    try {
      const url = stateUrl(state, location.href);
      if (push) {
        flush();
        history.pushState(null, '', url);
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else {
        clearTimeout(timer.current);
        pending.current = url;
        timer.current = setTimeout(flush, 250);
      }
      setRoute({ state, error: '' });
    } catch (error) {
      setRoute((current) => ({
        ...current,
        error: error instanceof Error ? error.message : 'Unable to save this game.',
      }));
    }
  };
  return { ...route, update };
}
function NumberField({
  id,
  label,
  value,
  onChange,
  error = '',
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        placeholder="e.g. 10,000"
        value={/^\d+$/.test(value) ? formatInteger(value) : value}
        onChange={(event) => {
          const next = inputNumber(event.target.value);
          if (next.length <= LIMITS.integer) onChange(next);
        }}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p className="error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
function Scoring() {
  return (
    <details className="scoring">
      <summary>
        How scoring works <span aria-hidden="true">↗</span>
      </summary>
      <div className="scoring-content">
        <p>
          Keep the correct answer inside your interval. The narrower, the better. Bounds are inclusive, and
          equal bounds are allowed.
        </p>
        <ul>
          <li>
            🟢 <strong>Green</strong> — contains the answer; upper ÷ lower is at most 2.
          </li>
          <li>
            🟡 <strong>Yellow</strong> — contains the answer; upper ÷ lower is greater than 2.
          </li>
          <li>
            🔴 <strong>Red</strong> — misses the answer.
          </li>
        </ul>
        <p>
          For each correct interval, round upper ÷ lower up to the next integer. Your score is{' '}
          <strong>
            (10 + sum of correct interval scores) × 2<sup>misses</sup>
          </strong>
          . Every miss doubles your score. Lower is better.
        </p>
        <p className="small">
          For an answer of 100: [90, 110] is green, [10, 1,000] is yellow, and [110, 200] is red.
        </p>
      </div>
    </details>
  );
}
function Circles({ q, a }: { q: Pair[]; a: Pair[] }) {
  const result = scoreGame(q, a);
  return (
    <div
      className="circles"
      role="img"
      aria-label={result.intervals.map((interval, i) => `Question ${i + 1}: ${interval.status}`).join(', ')}
    >
      {result.intervals.map((interval, i) => (
        <span key={i} aria-hidden="true">
          {EMOJI[interval.status]}
        </span>
      ))}
    </div>
  );
}
function Breakdown({ state }: { state: State }) {
  const result = scoreGame(state.q, state.a!);
  return (
    <div className="breakdown">
      {state.q.map(([question, answer], i) => (
        <article className="answer-card" key={i}>
          <div className="answer-title">
            <span className="eyebrow">Question 0{i + 1}</span>
            <span className="status">
              {EMOJI[result.intervals[i].status]} {result.intervals[i].status}
            </span>
          </div>
          <h3>{question}</h3>
          <dl>
            <div>
              <dt>Correct answer</dt>
              <dd>{formatInteger(answer)}</dd>
            </div>
            <div>
              <dt>Submitted interval</dt>
              <dd>
                {formatInteger(state.a![i][0])}–{formatInteger(state.a![i][1])}
              </dd>
            </div>
            <div>
              <dt>Interval ratio</dt>
              <dd>{formatRatio(state.a![i])}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}
function Comparison({ state }: { state: State }) {
  const opponent = state.o!;
  const theirs = scoreGame(state.q, opponent.a),
    yours = scoreGame(state.q, state.a!);
  const name = playerName(opponent.p);
  const verdict =
    yours.total === theirs.total ? 'It’s a tie!' : yours.total < theirs.total ? 'You win!' : `${name} wins!`;
  return (
    <section className="comparison">
      <div className="section-heading">
        <div>
          <p className="eyebrow">The head-to-head</p>
          <h2>{verdict}</h2>
        </div>
        <span className="small">Lower is better</span>
      </div>
      <div className="score-duo">
        <div>
          <span>{name}</span>
          <strong>{formatInteger(theirs.total)}</strong>
        </div>
        <div>
          <span>{state.p?.trim() || 'You'}</span>
          <strong>{formatInteger(yours.total)}</strong>
        </div>
      </div>
      <div className="comparison-table" role="table" aria-label="Results comparison">
        <div className="comparison-head" role="row">
          <span role="columnheader">Question</span>
          <span role="columnheader">{name}</span>
          <span role="columnheader">You</span>
          <span role="columnheader">Correct answer</span>
        </div>
        {state.q.map((q, i) => (
          <div className="comparison-row" role="row" key={i}>
            <span role="cell">
              <span className="mobile-label">Question </span>
              {i + 1}
            </span>
            <span role="cell">
              <span className="mobile-label">{name}</span>
              <span>
                {EMOJI[theirs.intervals[i].status]}{' '}
                <span className="sr-only">{theirs.intervals[i].status}: </span>
                {formatInteger(opponent.a[i][0])}–{formatInteger(opponent.a[i][1])}
              </span>
            </span>
            <span role="cell">
              <span className="mobile-label">You</span>
              <span>
                {EMOJI[yours.intervals[i].status]}{' '}
                <span className="sr-only">{yours.intervals[i].status}: </span>
                {formatInteger(state.a![i][0])}–{formatInteger(state.a![i][1])}
              </span>
            </span>
            <span role="cell">
              <span className="mobile-label">Correct answer</span>
              {formatInteger(q[1])}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
function App() {
  const { state, error, update } = useUrlState();
  const [attempted, setAttempted] = useState(false);
  const [notice, setNotice] = useState('');
  const [manualShare, setManualShare] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const manualShareInput = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (manualShare) manualShareInput.current?.focus();
  }, [manualShare]);
  const routeKey = `${state?.m}-${state?.i}-${state?.reveal}`;
  useEffect(() => {
    setAttempted(false);
    setNotice('');
    setManualShare('');
    heading.current?.focus({ preventScroll: true });
  }, [routeKey]);
  const navigate = (next: State | null) => {
    setAttempted(false);
    setNotice('');
    setManualShare('');
    update(next, true);
  };
  const edit = (next: State) => {
    setNotice('');
    update(next);
  };
  const copy = async (text: string, success: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(success);
    } catch {
      setManualShare(text);
      setNotice('Select and copy the text below.');
    }
  };
  const share = async () => {
    if (!state) return;
    const text = shareText(state, stateUrl(resultLinkState(state), location.href));
    if (navigator.share) {
      try {
        await navigator.share({ text });
        setNotice('Results shared.');
        return;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
      }
    }
    await copy(text, 'Results and challenge link copied!');
  };
  const h1 = (text: ReactNode, className = '') => (
    <h1 className={className} ref={heading} tabIndex={-1}>
      {text}
    </h1>
  );
  let content: ReactNode;
  if (error) {
    content = (
      <section className="narrow empty-state">
        <p className="eyebrow">A little detour</p>
        {h1('This link needs another guess.')}
        <p>{error}</p>
        <button className="primary" onClick={() => navigate(null)}>
          Go to Estimathon
        </button>
      </section>
    );
  } else if (!state) {
    content = (
      <>
        <section className="landing">
          <div className="landing-copy">
            <p className="eyebrow">Five questions. Infinite possibilities.</p>
            {h1('Estimathon', 'hero-title')}
            <p className="intro">
              A little knowledge.
              <br />A good guess.
            </p>
            <p className="lede">
              How wide is your world? Put a lower and upper bound around five numerical answers. Keep them
              close. Get them right.
            </p>
            <div className="actions">
              <button className="primary" onClick={() => navigate(startPlaying(SAMPLE))}>
                Play Sample Game <span aria-hidden="true">↗</span>
              </button>
              <button onClick={() => navigate(newBuilder())}>Create a Game</button>
            </div>
            <p className="small">No timer. No sign-up. Just your best estimate.</p>
          </div>
          <div className="example">
            <div className="example-top">
              <span className="eyebrow">A question of scale</span>
              <span className="small">01 / 05</span>
            </div>
            <h2>
              How many squares are on
              <br />a chessboard?
            </h2>
            <div className="example-bounds">
              <div>
                <span>Lower bound</span>
                <strong>60</strong>
              </div>
              <span className="range-dash" aria-hidden="true">
                —
              </span>
              <div>
                <span>Upper bound</span>
                <strong>80</strong>
              </div>
            </div>
            <div className="number-line" aria-hidden="true">
              <span className="line-range"></span>
              <span className="line-answer">64</span>
            </div>
            <div className="example-bottom">
              <span>🟢 A nicely framed estimate.</span>
              <span>≈ 1.33×</span>
            </div>
          </div>
        </section>
        <section className="steps">
          <div>
            <span className="eyebrow">01 / Make an estimate</span>
            <p>
              Give each answer a little
              <br />
              room to be right.
            </p>
          </div>
          <div>
            <span className="eyebrow">02 / Find your balance</span>
            <p>
              Narrow intervals score better.
              <br />
              Every miss doubles your score.
            </p>
          </div>
          <div>
            <span className="eyebrow">03 / Pass it on</span>
            <p>
              Share your five circles.
              <br />
              See who can get closer.
            </p>
          </div>
        </section>
        <Scoring />
      </>
    );
  } else if (state.m === 'builder') {
    const errors = state.q.map(questionErrors);
    const updateQuestion = (i: number, side: number, value: string) =>
      edit({
        ...state,
        q: state.q.map((q, index) =>
          index === i ? (q.map((part, j) => (j === side ? value : part)) as Pair) : q,
        ),
      });
    const reorder = (i: number, direction: number) => {
      const q = [...state.q];
      [q[i], q[i + direction]] = [q[i + direction], q[i]];
      edit({ ...state, q });
    };
    content = (
      <section className="narrow builder">
        <p className="eyebrow">The game builder</p>
        {h1('Curiosity, in five questions.')}
        <p className="lede">Pick your questions. Set the answers. Send a little challenge.</p>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setAttempted(true);
            if (completeQuestions(state.q)) navigate({ ...gameLinkState(state), preview: true });
          }}
        >
          <div className="field title-field">
            <label htmlFor="game-title">
              Game title <span className="optional">Optional</span>
            </label>
            <input
              id="game-title"
              maxLength={LIMITS.title}
              placeholder="Estimathon"
              value={state.t}
              onChange={(event) => edit({ ...state, t: event.target.value })}
            />
            <p className="small">
              Exactly five questions. Answers must be positive whole numbers, up to 100 digits.
            </p>
          </div>
          {state.q.map(([question, answer], i) => (
            <fieldset className="builder-question" key={i}>
              <legend>Question 0{i + 1}</legend>
              <div className="reorder">
                <button
                  type="button"
                  aria-label={`Move question ${i + 1} up`}
                  disabled={i === 0}
                  onClick={() => reorder(i, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={`Move question ${i + 1} down`}
                  disabled={i === 4}
                  onClick={() => reorder(i, 1)}
                >
                  ↓
                </button>
              </div>
              <div className="field">
                <label htmlFor={`question-${i}`}>
                  Question <span className="optional">{question.length} / 200</span>
                </label>
                <textarea
                  id={`question-${i}`}
                  rows={2}
                  maxLength={LIMITS.question}
                  placeholder="How many…?"
                  value={question}
                  onChange={(event) => updateQuestion(i, 0, event.target.value)}
                  aria-invalid={attempted && !!errors[i][0]}
                  aria-describedby={attempted && errors[i][0] ? `question-${i}-error` : undefined}
                />
                {attempted && errors[i][0] && (
                  <p className="error" id={`question-${i}-error`}>
                    {errors[i][0]}
                  </p>
                )}
              </div>
              <NumberField
                id={`correct-${i}`}
                label="Correct answer"
                value={answer}
                onChange={(value) => updateQuestion(i, 1, value)}
                error={attempted || answer ? errors[i][1] : ''}
              />
            </fieldset>
          ))}
          <div className="actions">
            <button className="primary" type="submit">
              Publish Game <span aria-hidden="true">↗</span>
            </button>
            <button type="button" onClick={() => navigate(null)}>
              Back to Home
            </button>
          </div>
          <p className="small">Your draft stays in this URL. Bookmark or copy the address to save it.</p>
        </form>
      </section>
    );
  } else if (state.m === 'game') {
    content = (
      <section className="narrow ready">
        <p className="eyebrow">{state.preview ? 'Ready to pass it on' : 'An invitation to estimate'}</p>
        {h1(title(state))}
        <p className="lede">Five questions. Your best bounds. How close can you get?</p>
        <div className="game-facts">
          <span>5 questions</span>
          <span>No timer</span>
          <span>Lower score wins</span>
        </div>
        <div className="actions">
          <button className="primary" onClick={() => navigate(startPlaying(state))}>
            {state.preview ? 'Preview Game' : 'Play Game'} <span aria-hidden="true">↗</span>
          </button>
          <button
            onClick={() => void copy(stateUrl(gameLinkState(state), location.href), 'Game link copied!')}
          >
            Copy Game Link
          </button>
        </div>
        <button className="text-button" onClick={() => navigate({ ...gameLinkState(state), m: 'builder' })}>
          Edit Questions
        </button>
        <Scoring />
      </section>
    );
  } else if (state.m === 'playing') {
    const i = state.i!,
      a = state.a!,
      bounds = a[i];
    const validation = intervalError(bounds);
    const changeBound = (side: number, value: string) =>
      edit({
        ...state,
        a: a.map((pair, index) =>
          index === i ? (pair.map((part, j) => (j === side ? value : part)) as Pair) : pair,
        ),
      });
    const next = () => {
      setAttempted(true);
      if (!validation) navigate({ ...state, i: i + 1 });
    };
    content = (
      <section className="narrow playing">
        <div className="play-meta">
          <p className="eyebrow">{title(state)}</p>
          <span className="small">Question {i + 1} of 5</span>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-label="Question progress"
          aria-valuemin={1}
          aria-valuemax={5}
          aria-valuenow={i + 1}
        >
          {a.map((pair, index) => (
            <span
              key={index}
              className={`${index === i ? 'current' : ''} ${!intervalError(pair) ? 'done' : ''}`}
            />
          ))}
        </div>
        {state.o && (
          <p className="challenge-note">
            Playing against {playerName(state.o.p)}. Answers stay hidden until you submit.
          </p>
        )}
        {h1(state.q[i][0], 'question-heading')}
        <p className="bound-hint">Find the range. Make it count.</p>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (i < 4) next();
            else {
              setAttempted(true);
              if (completeAnswers(a)) navigate({ ...state, m: 'result', reveal: true, preview: undefined });
            }
          }}
        >
          <div className="bounds">
            <NumberField
              id="lower"
              label="Lower bound"
              value={bounds[0]}
              onChange={(value) => changeBound(0, value)}
              error={attempted || bounds[0] ? integerError(bounds[0]) : ''}
            />
            <span className="range-dash" aria-hidden="true">
              —
            </span>
            <NumberField
              id="upper"
              label="Upper bound"
              value={bounds[1]}
              onChange={(value) => changeBound(1, value)}
              error={attempted || bounds[1] ? integerError(bounds[1]) : ''}
            />
          </div>
          {validation && bounds.every(validInteger) && (
            <p className="error" role="alert">
              {validation}
            </p>
          )}
          {i === 4 && (
            <div className="submit-area">
              <div className="field">
                <label htmlFor="player">
                  Display name <span className="optional">Optional · shown with your results</span>
                </label>
                <input
                  id="player"
                  maxLength={LIMITS.player}
                  autoComplete="nickname"
                  placeholder="What should we call you?"
                  value={state.p}
                  onChange={(event) => edit({ ...state, p: event.target.value })}
                />
              </div>
              <p className="small">Submitting locks your estimates and reveals the answers.</p>
              {attempted && !completeAnswers(a) && (
                <p className="error" role="alert">
                  Complete all five intervals before submitting. Use Previous to review earlier questions.
                </p>
              )}
            </div>
          )}
          <div className="play-actions">
            <button type="button" disabled={i === 0} onClick={() => navigate({ ...state, i: i - 1 })}>
              ← Previous
            </button>
            {i < 4 ? (
              <button className="primary" type="submit">
                Next Question →
              </button>
            ) : completeAnswers(a) ? (
              <button className="primary" type="submit">
                Submit Answers ↗
              </button>
            ) : (
              <button className="primary" type="submit">
                Complete Answers
              </button>
            )}
          </div>
        </form>
        <p className="small save-note">Progress lives in your URL. Refresh anytime.</p>
        {state.preview && (
          <button className="text-button" onClick={() => navigate({ ...gameLinkState(state), m: 'builder' })}>
            Edit Questions
          </button>
        )}
        <Scoring />
      </section>
    );
  } else if (state.m === 'result' && !state.reveal) {
    const result = scoreGame(state.q, state.a!);
    content = (
      <section className="narrow challenge">
        <p className="eyebrow">{title(state)} · A friendly challenge</p>
        {h1(
          <>
            {playerName(state.p)} scored {formatInteger(result.total)}.<br />
            <em>Can you beat them?</em>
          </>,
        )}
        <Circles q={state.q} a={state.a!} />
        <p className="lede">
          Same five questions. A fresh set of guesses.
          <br />
          Their answers stay hidden until you finish.
        </p>
        <div className="actions">
          <button className="primary" onClick={() => navigate(startPlaying(state, true))}>
            Play These Questions ↗
          </button>
        </div>
        <details className="spoiler">
          <summary>View {playerName(state.p)}’s Answers</summary>
          <p>Spoiler warning: this reveals all five correct answers and their intervals before you play.</p>
          <button onClick={() => navigate({ ...state, reveal: true })}>Reveal Results</button>
        </details>
        <Scoring />
      </section>
    );
  } else {
    const result = scoreGame(state.q, state.a!);
    content = (
      <section className="results">
        <div className="result-intro">
          <div>
            <p className="eyebrow">
              {title(state)} · {state.p?.trim() ? `${state.p.trim()}’s results` : 'The results are in'}
            </p>
            {h1('Every guess counts.')}
            <Circles q={state.q} a={state.a!} />
            <p className="counts">
              {result.counts.green} 🟢 Green <span>·</span> {result.counts.yellow} 🟡 Yellow <span>·</span>{' '}
              {result.counts.red} 🔴 Red
            </p>
          </div>
          <div className="score-box">
            <span className="eyebrow">Overall score</span>
            <strong>{formatInteger(result.total)}</strong>
            <span>Lower is better</span>
          </div>
        </div>
        <div className="actions result-actions">
          <button className="primary" onClick={() => void share()}>
            Share Results ↗
          </button>
          <button onClick={() => navigate(startPlaying(state))}>Play Again</button>
          <button className="text-button" onClick={() => navigate(newBuilder())}>
            Create Your Own Game
          </button>
        </div>
        {state.o && <Comparison state={state} />}
        <div className="section-heading">
          <h2>A closer look</h2>
          <span className="small">The answers, revealed.</span>
        </div>
        <Breakdown state={state} />
        <Scoring />
      </section>
    );
  }
  const urlLength = state
    ? stateUrl(state.m === 'result' ? resultLinkState(state) : state, location.href).length
    : 0;
  return (
    <div className="site-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Tim Qi home">
          TQ<span> / </span>
          <span className="brand-section">Play</span>
        </a>
        <button className="home-link" onClick={() => navigate(null)}>
          Estimathon <span aria-hidden="true">↗</span>
        </button>
      </header>
      <main id="main">
        {content}
        <div className="notices" aria-live="polite">
          {notice && <p className="notice">{notice}</p>}
          {urlLength > LONG_URL && (
            <p className="warning">
              This link is unusually long. Some messaging apps may cut it off; shorter questions make it
              easier to share.
            </p>
          )}
        </div>
        {manualShare && (
          <div className="manual-share field">
            <label htmlFor="manual-share">Copy this text</label>
            <textarea
              id="manual-share"
              ref={manualShareInput}
              rows={7}
              readOnly
              value={manualShare}
              onFocus={(event) => event.target.select()}
            />
          </div>
        )}
      </main>
      <footer className="site-footer">
        <span>
          A little game by <a href="/">Tim Qi</a>
        </span>
        <span>Trust your bounds.</span>
      </footer>
    </div>
  );
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
