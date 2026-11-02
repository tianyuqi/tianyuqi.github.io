import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createRoot } from 'react-dom/client';
import {
  ActiveClock,
  compare,
  labels,
  outcome,
  parseBid,
  sample,
  squares,
  summarize,
  SIMULATED_VERSION,
  type Bid,
  type Home,
  type Outcome,
} from './game';
import {
  gameUrl,
  newSeed,
  readChallenge,
  shareText,
  type Challenge,
} from './url';
import { loadDataset } from './data';
import './style.css';

const money = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
const date = (value: string) =>
  new Date(`${value}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
function Difference({ bid, home }: { bid: Bid; home: Home }) {
  if (bid === null) return <span>No bid placed</span>;
  const difference = bid - home.salePrice;
  return (
    <span>
      {difference >= 0 ? '+' : '−'}
      {money(Math.abs(difference))}{' '}
      <span className="muted">
        ({difference >= 0 ? '+' : '−'}
        {((Math.abs(difference) / home.salePrice) * 100).toFixed(1)}%)
      </span>
    </span>
  );
}
function Street() {
  return (
    <svg
      className="street"
      viewBox="0 0 440 138"
      fill="none"
      aria-hidden="true"
    >
      <path d="M0 124h440M16 124V49l35-25 35 25v75M94 124V35l38-23 38 23v89M180 124V55l36-25 36 25v69M262 124V38l35-25 35 25v86M342 124V55l38-24 38 24v69" />
      <path d="M12 49h78M90 35h84M176 55h80M258 38h78M338 55h84M22 93h58M100 90h64M186 96h60M268 90h58M348 96h64" />
      {[32, 57, 111, 141, 195, 222, 278, 305, 358, 387].map((x, i) => (
        <g key={x}>
          <path d={`M${x} 65v15h11V65zM${x} 103v21h11v-21z`} />
          {i > 1 && i < 8 && <path d={`M${x} 45v10h11V45z`} />}
        </g>
      ))}
      <path d="M28 28V14h10v8M275 23V8h10v9M4 133h432" />
    </svg>
  );
}
function Header() {
  return (
    <header className="brand">
      <a href="/" aria-label="Tianyu Qi home">
        tq<span> / </span>play
      </a>
      <span className="edition">SAN FRANCISCO, CA</span>
    </header>
  );
}

interface Loaded {
  challenge: Challenge;
  homes: Home[];
}
function App() {
  const [loaded, setLoaded] = useState<Loaded>();
  const [error, setError] = useState('');
  const [latest, setLatest] = useState<string | null>(null);
  useEffect(() => {
    const abort = new AbortController();
    async function load() {
      try {
        const response = await fetch('/homebuyer/data/manifest.json', {
          signal: abort.signal,
        });
        if (!response.ok)
          throw new Error(
            'The home data could not be loaded. Please try again.',
          );
        const manifest = await response.json();
        if (typeof manifest.datasets !== 'object' || !manifest.datasets)
          throw new Error('The dataset index could not be read.');
        const currentVersion = manifest.latest || SIMULATED_VERSION;
        setLatest(currentVersion);
        const challenge = readChallenge(location.search, currentVersion);
        const dataset = await loadDataset(
          challenge.version,
          manifest.datasets,
          abort.signal,
        );
        if (!abort.signal.aborted) {
          history.replaceState(null, '', gameUrl(challenge, challenge.rival));
          setLoaded({
            challenge,
            homes: sample(dataset.homes, challenge.seed),
          });
        }
      } catch (cause) {
        if (!abort.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : 'The home data could not be loaded.',
          );
      }
    }
    void load();
    const pop = () => location.reload();
    window.addEventListener('popstate', pop);
    return () => {
      abort.abort();
      window.removeEventListener('popstate', pop);
    };
  }, []);
  return (
    <main className="shell">
      <Header />
      {loaded?.challenge.version === SIMULATED_VERSION && (
        <p className="notice">
          <strong>Demo · Simulated homes</strong>
          <br />
          Practice with fictional listings and prices, not historical sales.
        </p>
      )}
      {loaded ? (
        <Game
          key={`${loaded.challenge.version}-${loaded.challenge.seed}`}
          {...loaded}
        />
      ) : (
        <section className="intro">
          <p className="eyebrow">SF HOME BUYING GAME</p>
          <h1>
            Know the city.
            <br />
            Name the price.
          </h1>
          <p className="lede">
            Ten homes. Ten seconds each.
            <br />A little market intuition goes a long way.
          </p>
          <Street />
          {error ? (
            <div className="notice" role="status">
              <strong>Homes aren’t ready.</strong>
              <p>{error}</p>
            </div>
          ) : (
            <p role="status" className="muted">
              Opening the neighborhood…
            </p>
          )}
          {error && (
            <a
              className="button primary"
              href={
                latest
                  ? `/homebuyer/?v=1&d=${latest}&s=${newSeed()}`
                  : '/homebuyer/'
              }
            >
              {latest ? 'Start a fresh game' : 'Try again'}
            </a>
          )}
          <p className="footnote">
            Historical sales. No accounts. Just your judgment.
          </p>
        </section>
      )}
    </main>
  );
}

function Game({ challenge, homes }: Loaded) {
  const [phase, setPhase] = useState<'start' | 'bid' | 'reveal' | 'done'>(
    'start',
  );
  const [index, setIndex] = useState(0);
  const [bids, setBids] = useState<Bid[]>([]);
  const [input, setInput] = useState('');
  const [remaining, setRemaining] = useState(10_000);
  const [shareStatus, setShareStatus] = useState('');
  const [manualShare, setManualShare] = useState('');
  const clock = useRef<ActiveClock | null>(null);
  const locked = useRef(false);
  const title = useRef<HTMLHeadingElement>(null);
  const simulated = challenge.version === SIMULATED_VERSION;
  const home = homes[index];
  const bid = parseBid(input);

  const finish = useCallback(
    (value: Bid) => {
      if (locked.current || phase !== 'bid' || !clock.current) return;
      const actualBid =
        clock.current.remaining(performance.now()) <= 0 ? null : value;
      locked.current = true;
      (document.activeElement as HTMLElement | null)?.blur();
      setBids((previous) => [...previous, actualBid]);
      setPhase('reveal');
    },
    [phase],
  );
  const next = useCallback(() => {
    if (phase !== 'reveal' || locked.current) return;
    locked.current = true;
    if (index === 9) setPhase('done');
    else {
      setIndex(index + 1);
      setInput('');
      setRemaining(10_000);
      setPhase('bid');
    }
  }, [phase, index]);

  useLayoutEffect(() => {
    locked.current = false;
    if (phase !== 'bid' && phase !== 'reveal') return;
    const active = new ActiveClock(
      performance.now(),
      document.visibilityState === 'visible',
      phase === 'bid' ? 10_000 : 2200,
    );
    clock.current = active;
    const visibility = () =>
      active.visibility(
        performance.now(),
        document.visibilityState === 'visible',
      );
    document.addEventListener('visibilitychange', visibility);
    const tick = () => {
      const left = active.remaining(performance.now());
      if (phase === 'bid') setRemaining(left);
      if (left <= 0) {
        if (phase === 'bid') finish(null);
        else next();
      }
    };
    const interval = window.setInterval(tick, 40);
    title.current?.focus();
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [phase, index, finish, next]);

  async function share() {
    const text = shareText(homes, bids, gameUrl(challenge, bids), simulated);
    try {
      if (navigator.share)
        await navigator.share({ title: 'SF Home Buying Game', text });
      else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setShareStatus('Challenge copied. Send it to a friend.');
      } else {
        setManualShare(text);
        setShareStatus('Copy the challenge below to share.');
      }
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(text);
        setShareStatus('Challenge copied. Send it to a friend.');
      } catch {
        setManualShare(text);
        setShareStatus('Copy the challenge below to share.');
      }
    }
  }
  function adjust(amount: number) {
    if (bid !== null)
      setInput(
        (
          Math.max(1000, Math.min(100_000_000, bid + amount)) / 1_000_000
        ).toFixed(3),
      );
  }
  if (phase === 'start')
    return (
      <section className="intro">
        <p className="eyebrow">SF HOME BUYING GAME</p>
        <h1>
          Know the city.
          <br />
          Name the price.
        </h1>
        <p className="lede">
          Ten homes. Ten seconds each.
          <br />
          Can you win without overpaying?
        </p>
        <Street />
        {challenge.warning && (
          <p className="notice" role="status">
            {challenge.warning}
          </p>
        )}
        {challenge.rival && (
          <p className="challenge-note">
            A friend has made their bids. Yours come first.
            <br />
            <span className="muted">
              Compare results after your tenth home.
            </span>
          </p>
        )}
        <ol className="rules">
          <li>
            <span>01</span>
            <p>
              Read the clues. Bid in <strong>$ millions</strong>.
            </p>
          </li>
          <li>
            <span>02</span>
            <p>
              Match the sale price, or go up to <strong>25% over</strong>, for a
              good buy.
            </p>
          </li>
          <li>
            <span>03</span>
            <p>
              Too low? Outbid. Too high? Overpaid.
              <br />
              Pass whenever you like.
            </p>
          </li>
        </ol>
        <button className="primary start" onClick={() => setPhase('bid')}>
          Start Game <span aria-hidden="true">↗</span>
        </button>
        <p className="footnote">
          {simulated ? 'Simulated homes' : 'Real historical sales'} · No accounts
          · Nothing saved
        </p>
      </section>
    );

  if (phase === 'done') {
    const total = summarize(homes, bids);
    const rival = challenge.rival ? summarize(homes, challenge.rival) : null;
    const ranking = challenge.rival
      ? compare(homes, bids, challenge.rival)
      : null;
    return (
      <section className="results">
        <p className="eyebrow">THE CLOSING STATEMENT</p>
        <h1>
          {total.good}
          <span className="score-denominator"> / 10</span>
        </h1>
        <p className="result-subtitle">
          good {total.good === 1 ? 'buy' : 'buys'}.{' '}
          {total.good >= 7
            ? 'You know this market.'
            : total.good >= 4
              ? 'A few solid investments.'
              : 'This city keeps you guessing.'}
        </p>
        <div className="result-grid" role="group" aria-label="Your ten results">
          {homes.map((h, i) => (
            <a
              key={h.id}
              href={`#home-${i}`}
              className={`result-cell ${outcome(bids[i], h.salePrice)}`}
              aria-label={`Home ${i + 1}: ${labels[outcome(bids[i], h.salePrice)]}`}
            >
              {i + 1}
            </a>
          ))}
        </div>
        <div className="totals">
          {(Object.keys(labels) as Outcome[]).map((key) => (
            <div key={key}>
              <strong>{total[key]}</strong>
              <span>
                <i className={`dot ${key}`} />
                {labels[key]}
              </span>
            </div>
          ))}
        </div>
        <div className="premium">
          <div>
            <span>
              Total premium on {total.won} won{' '}
              {total.won === 1 ? 'home' : 'homes'}
            </span>
            <strong>{money(total.premium)}</strong>
          </div>
          <div>
            <span>Average premium on won homes</span>
            <strong>{total.averagePremium.toFixed(1)}%</strong>
          </div>
        </div>
        {rival && (
          <div className="comparison">
            <p className="eyebrow">HEAD TO HEAD</p>
            <h2>
              {ranking === 0
                ? 'An even market.'
                : ranking! < 0
                  ? 'You bought better.'
                  : 'Your friend bought better.'}
            </h2>
            <table>
              <caption className="sr-only">
                Your score compared with the shared bids
              </caption>
              <thead>
                <tr>
                  <th>Score</th>
                  <th>You</th>
                  <th>Friend</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Good buys</th>
                  <td>{total.good}</td>
                  <td>{rival.good}</td>
                </tr>
                <tr>
                  <th>Overpaid</th>
                  <td>{total.overpaid}</td>
                  <td>{rival.overpaid}</td>
                </tr>
                <tr>
                  <th>Premium</th>
                  <td>{money(total.premium)}</td>
                  <td>{money(rival.premium)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <div className="result-actions">
          <button className="primary" onClick={() => void share()}>
            Share your challenge <span aria-hidden="true">↗</span>
          </button>
          <a
            className="button secondary"
            href={gameUrl({ ...challenge, seed: freshSeed(challenge.seed) })}
          >
            Play Again
          </a>
        </div>
        <p role="status" className="share-status">
          {shareStatus}
        </p>
        {manualShare && (
          <textarea
            aria-label="Challenge text to copy"
            readOnly
            value={manualShare}
            onFocus={(event) => event.currentTarget.select()}
          />
        )}
        <p className="ranking-note">
          Most good buys wins. Ties go to fewer overpaid, then a lower total
          premium. Won homes include good buys and overpaid.
        </p>
        <div className="recap-heading">
          <h2>Every home. Every call.</h2>
          <span>YOUR RECAP</span>
        </div>
        {homes.map((h, i) => (
          <article className="recap" id={`home-${i}`} key={h.id}>
            <div className="recap-top">
              <span className="eyebrow">
                HOME {String(i + 1).padStart(2, '0')}
              </span>
              <span
                className={`outcome-label ${outcome(bids[i], h.salePrice)}`}
              >
                {squares[outcome(bids[i], h.salePrice)]}{' '}
                {labels[outcome(bids[i], h.salePrice)]}
              </span>
            </div>
            <h3>{h.neighborhood}</h3>
            <p className="muted">{h.address}</p>
            <p className="recap-clues">
              {h.beds} beds · {h.baths} baths · {h.sqft.toLocaleString('en-US')}{' '}
              sq ft · Sold {date(h.saleDate)}
            </p>
            <dl className="recap-prices">
              <div>
                <dt>Sale price</dt>
                <dd>{money(h.salePrice)}</dd>
              </div>
              <div>
                <dt>Your bid</dt>
                <dd>{bids[i] === null ? 'Passed' : money(bids[i]!)}</dd>
              </div>
            </dl>
            <p className="difference">
              <Difference bid={bids[i]} home={h} />
            </p>
            {challenge.rival && (
              <p className="friend-bid">
                Friend:{' '}
                {challenge.rival[i] === null
                  ? 'Passed'
                  : money(challenge.rival[i]!)}{' '}
                · {labels[outcome(challenge.rival[i], h.salePrice)]}
              </p>
            )}
            {!simulated && (
              <a
                className="source"
                href={h.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Original listing ↗
              </a>
            )}
          </article>
        ))}
        <footer className="game-footer">
          {simulated
            ? 'Fictional listings and prices for practice.'
            : 'Historical prices, not current valuations.'}
          <br />
          Dataset {challenge.version} ·{' '}
          <a href="https://github.com/tianyuqi/tianyuqi.github.io/tree/HEAD/homebuyer/data">
            Data & methodology ↗
          </a>
        </footer>
      </section>
    );
  }
  const result =
    phase === 'reveal' ? outcome(bids[index], home.salePrice) : null;
  return (
    <section className={`round ${phase}`}>
      <div className="round-top">
        <span className="eyebrow">
          HOME {String(index + 1).padStart(2, '0')}{' '}
          <span className="muted">OF 10</span>
        </span>
        <span className="round-score">
          {summarize(homes, bids).good} good buys
        </span>
      </div>
      <div className="timer-row">
        <span>
          {phase === 'bid' ? 'Make your move' : 'The market has spoken'}
        </span>
        <span
          className="timer"
          role="timer"
          aria-label={
            phase === 'bid'
              ? `${Math.ceil(remaining / 1000)} seconds remaining`
              : 'Bid locked'
          }
        >
          {phase === 'bid' ? `${(remaining / 1000).toFixed(1)}s` : 'Locked'}
        </span>
      </div>
      <div className="timer-track" aria-hidden="true">
        <div style={{ width: `${phase === 'bid' ? remaining / 100 : 0}%` }} />
      </div>
      <div className="property">
        <p className="eyebrow">SAN FRANCISCO · SINGLE FAMILY</p>
        <h1 ref={title} tabIndex={-1}>
          {home.neighborhood}
        </h1>
        <div className="clues">
          <div>
            <strong>{home.beds}</strong>
            <span>Beds</span>
          </div>
          <div>
            <strong>{home.baths}</strong>
            <span>Baths</span>
          </div>
          <div>
            <strong>{home.sqft.toLocaleString('en-US')}</strong>
            <span>Sq ft</span>
          </div>
        </div>
        <div className="sold">
          <span>Sold</span>
          <strong>{date(home.saleDate)}</strong>
        </div>
      </div>
      {phase === 'bid' ? (
        <form
          className="bid-panel"
          onSubmit={(event) => {
            event.preventDefault();
            if (bid !== null) finish(bid);
          }}
        >
          <label htmlFor="bid">
            YOUR BID <span>IN $ MILLIONS</span>
          </label>
          <div className="bid-input">
            <span aria-hidden="true">$</span>
            <input
              id="bid"
              inputMode="decimal"
              maxLength={16}
              autoComplete="off"
              spellCheck={false}
              placeholder="1.50"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              aria-describedby="bid-help"
            />
            <span className="million" aria-hidden="true">
              M
            </span>
          </div>
          <div className="quick-picks" role="group" aria-label="Quick bids">
            {[1, 1.5, 2, 3].map((value) => (
              <button
                type="button"
                key={value}
                onClick={() => setInput(value.toFixed(2))}
              >
                ${value}M
              </button>
            ))}
          </div>
          <div
            className="adjustments"
            role="group"
            aria-label="Adjust your bid"
          >
            {[-100_000, -50_000, 50_000, 100_000].map((value) => (
              <button
                type="button"
                disabled={bid === null}
                key={value}
                onClick={() => adjust(value)}
              >
                {value < 0 ? '−' : '+'}${Math.abs(value) / 1000}K
              </button>
            ))}
          </div>
          <p id="bid-help" className="bid-help">
            {input && bid === null
              ? 'Enter a bid from $0.001M to $100M.'
              : bid !== null
                ? `${money(bid)} · rounded to the nearest $1K`
                : '1.50 = $1,500,000 · rounded to the nearest $1K'}
          </p>
          <div className="bid-actions">
            <button
              type="button"
              className="secondary"
              onClick={() => finish(null)}
            >
              Pass
            </button>
            <button className="primary" type="submit" disabled={bid === null}>
              Lock bid <span aria-hidden="true">→</span>
            </button>
          </div>
        </form>
      ) : (
        <div className={`reveal-card ${result}`} role="status">
          <p className="reveal-label">
            {squares[result!]} {labels[result!]}
          </p>
          <div className="reveal-price">
            <span>Actual sale price</span>
            <strong>{money(home.salePrice)}</strong>
          </div>
          <p>
            Your bid:{' '}
            <strong>
              {bids[index] === null ? 'Passed' : money(bids[index]!)}
            </strong>
          </p>
          <p className="difference">
            <Difference bid={bids[index]} home={home} />
          </p>
          <p className="revealed-address">{home.address}</p>
          <button className="primary" onClick={next}>
            {index === 9 ? 'See your results' : 'Next home'}{' '}
            <span aria-hidden="true">→</span>
          </button>
          <p className="auto-note">
            Continuing automatically in about 2 seconds
          </p>
        </div>
      )}
    </section>
  );
}
function freshSeed(previous: number) {
  const seed = newSeed();
  return seed === previous ? (seed + 1) >>> 0 : seed;
}

createRoot(document.getElementById('root')!).render(<App />);
