import { useRef, useState } from 'react';
import { gamePrompt } from './prompt';

export function BuilderGuide() {
  const [status, setStatus] = useState('');
  const [expanded, setExpanded] = useState(false);
  const promptInput = useRef<HTMLTextAreaElement>(null);
  const prompt = gamePrompt(location.href);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setStatus('Prompt copied! Paste it into your LLM and choose a topic.');
    } catch {
      setExpanded(true);
      setStatus('Select and copy the prompt below.');
      requestAnimationFrame(() => {
        promptInput.current?.focus();
        promptInput.current?.select();
      });
    }
  };

  return (
    <aside className="builder-guide" aria-labelledby="builder-guide-title">
      <h2 id="builder-guide-title">A whole game in a link</h2>
      <p>
        Your title, five questions, and correct answers are saved as JSON, compressed with{' '}
        <code>lz-string</code>, and URL-escaped into the <code>#d=</code> fragment so normal HTTP
        requests do not send the game state to the hosting server. Draft edits update the address
        automatically; publishing creates a link ready for friends to play. No account or server
        storage is needed—save the URL to keep your game.
      </p>
      <p>
        The answers travel with the link. Compression is not encryption: anyone who decodes the URL
        can read them.
      </p>
      <div className="prompt-actions">
        <p>Want help writing a game? Give your LLM this prompt and a topic.</p>
        <button type="button" onClick={copy}>
          Copy LLM prompt
        </button>
      </div>
      <p className="small" role="status">
        {status}
      </p>
      <details open={expanded} onToggle={(event) => setExpanded(event.currentTarget.open)}>
        <summary>View or manually copy the prompt</summary>
        <div className="field">
          <label htmlFor="llm-prompt">Game generation prompt</label>
          <textarea
            id="llm-prompt"
            ref={promptInput}
            readOnly
            rows={12}
            value={prompt}
            onFocus={(event) => event.target.select()}
          />
        </div>
      </details>
    </aside>
  );
}
