import { StrictMode, useEffect, useReducer, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { adjacent, availableHint, CELLS, complete, gameReducer, generatePuzzle, type Mode, type Pair } from './game';
import { loadMode, saveMode } from './settings';
import './style.css';

const colors = ['sage', 'peach', 'lavender', 'blue', 'rose'];
const positions = CELLS.map(([q, r]) => ({ x: 128 + q * 84 + r * 42, y: 62 + r * 73 }));
const points = Array.from({ length: 6 }, (_, i) => {
  const angle = (i * 60 - 30) * Math.PI / 180;
  return `${46 * Math.cos(angle)},${46 * Math.sin(angle)}`;
}).join(' ');
const seed = () => crypto.getRandomValues(new Uint32Array(1))[0];

function App() {
  const [game, dispatch] = useReducer(gameReducer, undefined, () => ({
    puzzle: generatePuzzle(loadMode(), seed()), pairs: [], history: [],
  }));
  const [selected, setSelected] = useState<number | null>(null);
  const [hint, setHint] = useState<Pair | undefined>();
  const [message, setMessage] = useState('Pick a number. Find its neighbor.');
  const [error, setError] = useState<number | null>(null);
  const [focused, setFocused] = useState(0);
  const cellRefs = useRef<(SVGGElement | null)[]>([]);
  const won = complete(game.puzzle, game.pairs);

  useEffect(() => { saveMode(game.puzzle.mode); }, [game.puzzle.mode]);
  useEffect(() => {
    if (error === null) return;
    const timer = window.setTimeout(() => setError(null), 450);
    return () => window.clearTimeout(timer);
  }, [error]);

  function clearSelection() { setSelected(null); setHint(undefined); setError(null); }
  function newPuzzle(mode = game.puzzle.mode) {
    let next = generatePuzzle(mode, seed());
    // A fresh seed can happen to produce the same visible board.
    while (next.target === game.puzzle.target && next.numbers.join() === game.puzzle.numbers.join()) {
      next = generatePuzzle(mode, seed());
    }
    dispatch({ type: 'new', puzzle: next });
    clearSelection();
    setMessage('A fresh little challenge. Take your time.');
  }
  function choose(cell: number) {
    setHint(undefined);
    if (game.pairs.some(pair => pair.includes(cell))) {
      dispatch({ type: 'remove', cell });
      setSelected(null);
      setMessage('Pair undone. Try another connection.');
    } else if (selected === cell) {
      setSelected(null);
      setMessage('Pick a number. Find its neighbor.');
    } else if (selected === null) {
      setSelected(cell);
      setMessage(`Find a touching number to make ${game.puzzle.target}.`);
    } else if (!adjacent(selected, cell) || game.puzzle.numbers[selected] + game.puzzle.numbers[cell] !== game.puzzle.target) {
      setError(cell);
      setMessage(!adjacent(selected, cell) ? 'Almost — choose hexagons that share an edge.' :
        `${game.puzzle.numbers[selected]} + ${game.puzzle.numbers[cell]} doesn’t make ${game.puzzle.target}. Try another neighbor.`);
    } else {
      dispatch({ type: 'pair', pair: [selected, cell] });
      setSelected(null);
      setMessage('A perfect pair. Keep going!');
    }
  }
  function showHint() {
    clearSelection();
    const pair = availableHint(game.puzzle, game.pairs);
    setHint(pair);
    setMessage(pair ? `Try ${game.puzzle.numbers[pair[0]]} + ${game.puzzle.numbers[pair[1]]}. The dotted hexagons show you where.` :
      'These pairs leave no way to finish. Undo a pair to open up the board.');
  }
  function moveFocus(cell: number, key: string) {
    const origin = positions[cell];
    const candidates = positions.map((point, index) => ({ index, dx: point.x - origin.x, dy: point.y - origin.y }))
      .filter(({ dx, dy }) => key === 'ArrowRight' ? dx > 1 : key === 'ArrowLeft' ? dx < -1 : key === 'ArrowDown' ? dy > 1 : dy < -1)
      .sort((a, b) => {
        const score = (p: typeof a) => key === 'ArrowRight' || key === 'ArrowLeft' ? Math.abs(p.dx) + Math.abs(p.dy) * 2 : Math.abs(p.dy) + Math.abs(p.dx) * 2;
        return score(a) - score(b);
      });
    const next = key === 'Home' ? 0 : key === 'End' ? 9 : candidates[0]?.index;
    if (next !== undefined) { setFocused(next); cellRefs.current[next]?.focus(); }
  }

  return <div className="page-shell">
    <header className="masthead">
      <a className="home-link" href="/" aria-label="Back to Tim Qi’s homepage">tq<span> / little experiments</span></a>
      <span className="edition">NO. 01 — A NUMBERS PUZZLE</span>
    </header>
    <main className={`game ${won ? 'is-complete' : ''}`}>
      <div className="intro">
        <span className="eyebrow"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 8.7 5v10L12 22l-8.7-5V7Z" /></svg> A LITTLE MOMENT OF FOCUS</span>
        <h1>Hex <em>Pairs</em><span className="title-dot">.</span></h1>
        <p>Ten numbers. Five connections. A little moment of clarity.</p>
      </div>

      <section className="puzzle-panel" aria-label="Hexagon number pairs game">
        <div className="target"><span>MAKE EACH PAIR ADD UP TO</span><strong key={game.puzzle.target}>{game.puzzle.target}</strong></div>
        <p className="board-instruction" id="board-help">Tap two touching hexagons to make a pair.</p>
        <svg className="board" viewBox="38 8 348 254" role="group" aria-label={`Puzzle board. Target ${game.puzzle.target}.`} aria-describedby="board-help keyboard-help">
          <g className="connections" aria-hidden="true">
            {game.pairs.map(([a, b], index) => <line key={`${a}-${b}`} className={colors[index]}
              x1={positions[a].x} y1={positions[a].y} x2={positions[b].x} y2={positions[b].y} />)}
          </g>
          {positions.map(({ x, y }, cell) => {
            const pairIndex = game.pairs.findIndex(pair => pair.includes(cell));
            const paired = pairIndex >= 0;
            const partner = paired ? game.pairs[pairIndex].find(index => index !== cell) : undefined;
            return <g key={cell} transform={`translate(${x},${y})`} role="button"
              ref={element => { cellRefs.current[cell] = element; }}
              tabIndex={focused === cell ? 0 : -1} onFocus={() => setFocused(cell)}
              aria-label={`Row ${CELLS[cell][1] + 1}, cell ${cell + 1}: ${game.puzzle.numbers[cell]}${paired ? `, paired with ${game.puzzle.numbers[partner!]}, activate to undo` : selected === cell ? ', selected' : hint?.includes(cell) ? ', hinted pair' : ', available'}`}
              aria-pressed={paired || selected === cell}
              className={`cell ${paired ? `paired ${colors[pairIndex]}` : ''} ${selected === cell ? 'selected' : ''} ${hint?.includes(cell) ? 'hinted' : ''} ${error === cell ? 'incorrect' : ''}`}
              onClick={() => choose(cell)} onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(cell); }
                else if (event.key.startsWith('Arrow') || ['Home', 'End'].includes(event.key)) { event.preventDefault(); moveFocus(cell, event.key); }
                else if (event.key === 'Escape') { clearSelection(); setMessage('Selection cleared.'); }
              }}>
              <polygon className="hex-focus" points={points} />
              <polygon className="hex-shape" points={points} />
              <text y="1" textAnchor="middle" dominantBaseline="central">{game.puzzle.numbers[cell]}</text>
              {paired && <circle className="pair-marker" cy="28" r="2.5" />}
            </g>;
          })}
        </svg>

        <div className="progress" role="group" aria-label={`${game.pairs.length} of 5 pairs`}>
          <div className="progress-dots" aria-hidden="true">{colors.map((color, index) => <span key={color} className={index < game.pairs.length ? color : ''} />)}</div>
          <span><strong>{game.pairs.length}</strong> of 5 pairs</span>
        </div>
        <div className={`feedback ${won ? 'success' : ''}`} role="status" aria-live="polite" aria-atomic="true">
          {won ? 'Beautifully connected. You found all five pairs!' : message}
        </div>
        <div className="controls">
          <button className="primary" onClick={() => newPuzzle()}><span aria-hidden="true">↻</span> New puzzle</button>
          <button onClick={() => { dispatch({ type: 'reset' }); clearSelection(); setMessage('A clean slate. Same puzzle, fresh eyes.'); }} disabled={!game.pairs.length && selected === null && !hint}>Reset</button>
          <button onClick={showHint} disabled={won}><span aria-hidden="true">✧</span> Hint</button>
        </div>
        <button className="undo" disabled={!game.history.length} onClick={() => {
          dispatch({ type: 'undo' }); clearSelection(); setMessage('Last move undone.');
        }}><span aria-hidden="true">↶</span> Undo last move</button>
      </section>

      <fieldset className="settings">
        <legend>YOUR NUMBER RANGE</legend>
        <div className="mode-options">{([1, 2, 3] as Mode[]).map(mode => <label key={mode}>
          <input type="radio" name="mode" value={mode} checked={game.puzzle.mode === mode} onChange={() => newPuzzle(mode)} />
          <span>{mode} {mode === 1 ? 'digit' : 'digits'}<small>0–{10 ** mode - 1}</small></span>
        </label>)}</div>
      </fieldset>
      <details className="how-to">
        <summary>How to play <span aria-hidden="true">+</span></summary>
        <p>Connect neighboring hexagons whose numbers add up to the target. Each number belongs to one pair. Find all five pairs to finish.</p>
        <p>Tap a completed pair to undo it. Hint highlights a pair without making the move. Changing the number range starts a new puzzle.</p>
        <p id="keyboard-help">Keyboard: Tab to the board, use arrow keys to move, and Enter or Space to select. Escape clears your selection.</p>
      </details>
    </main>
    <footer className="page-footer"><span>A small puzzle. A little clarity.</span><a href="/">Made by Tim Qi <span aria-hidden="true">↗</span></a></footer>
  </div>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
