import { describe, expect, it } from 'vitest';
import LZString from 'lz-string';
import { gamePrompt } from './prompt';
import { readUrl } from './url';

describe('copyable game generation prompt', () => {
  it.each(['https://tianyuqi.github.io', 'http://localhost:5173'])(
    'provides executable encoding code that opens a valid game on %s',
    (base) => {
      const prompt = gamePrompt(`${base}/estimathon/?d=old#d=draft`);
      const code = prompt.match(/```js\n([\s\S]*?)\n```/)![1];
      const links: string[] = [];
      const run = new Function(
        'LZString',
        'console',
        code.replace(/^import LZString from 'lz-string';\n/, ''),
      );
      run(LZString, { log: (url: string) => links.push(url) });

      expect(links).toHaveLength(1);
      expect(links[0].startsWith(`${base}/estimathon/#d=`)).toBe(true);
      expect(new URL(links[0]).search).toBe('');
      expect(prompt).toContain('fragment (#d=...), never the query string');
      const state = readUrl(links[0])!;
      expect(state.m).toBe('game');
      expect(state.v).toBe(1);
      expect(state.t).toBe('A question of scale');
      expect(state.q).toHaveLength(5);
      expect(state.q[0][1]).toBe('204');
      expect(prompt).toContain('instead of inventing a URL');
    },
  );
});
