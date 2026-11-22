import { QUESTION_COUNT } from './game';

export function chatPromptLinks(prompt: string) {
  const query = new URLSearchParams({ q: prompt });
  return {
    chatgpt: `https://chatgpt.com/?${query}`,
    claude: `https://claude.ai/new?${query}`,
  };
}

export function gamePrompt(base: string): string {
  const url = new URL('/estimathon/', base).href;
  return `Create an Estimathon game about a topic of my choice. Ask me for a topic if I have not supplied one.

Write exactly ${QUESTION_COUNT} interesting estimation questions with factual, positive whole-number answers. State units and any date or scope needed to make each answer unambiguous. Check the answers and cite sources separately from the game URL. Avoid disputed or rapidly changing figures unless a reference date is given.

The game state is JSON with exactly these fields:
- v: 1 (format version).
- m: "game" (opens a ready-to-play game, not a builder draft).
- t: a title of at most 60 characters.
- q: exactly ${QUESTION_COUNT} [question, answer] pairs. Each question is nonempty and at most 200 characters. Each answer is a decimal STRING of 1–100 digits representing an integer greater than zero, with no commas, signs, decimals, units, or scientific notation.

Replace the example title and questions in this JavaScript with your game, then EXECUTE it using the lz-string npm package (version 1.5.0). Do not guess or hand-write the compressed data. The URL uses lz-string compressToEncodedURIComponent, NOT Base64 or plain JSON. Store the encoded state in the URL fragment (#d=...), never the query string, so normal HTTP requests do not send it to the hosting server. URLSearchParams must escape the compressed value, especially + as %2B; do not concatenate an unescaped value or encode it twice.

\`\`\`js
import LZString from 'lz-string';

const state = {
  v: 1,
  m: "game",
  t: "A question of scale",
  q: [
    ["How many squares are in an 8 by 8 grid (counting all sizes)?", "204"],
    ["How many minutes are in a week?", "10080"],
    ["How many keys are on a standard modern piano?", "88"],
    ["How many faces does a regular icosahedron have?", "20"],
    ["How many meters are in a marathon?", "42195"],
    ["How many seconds are in one day?", "86400"],
    ["How many voting seats are in the US House of Representatives?", "435"],
    ["How many tiles, including blanks, are in a standard English-language Scrabble set?", "100"],
    ["In how many different orders can seven distinct books be arranged on a shelf?", "5040"],
    ["What is the sum of all the whole numbers from 1 through 100?", "5050"],
    ["How many dots in total are on a standard double-six set of 28 dominoes?", "168"],
    ["How many square feet are in one acre?", "43560"],
    ["How many minutes are in a leap year?", "527040"]
  ]
};
const url = new URL(${JSON.stringify(url)});
url.hash = new URLSearchParams({ d: LZString.compressToEncodedURIComponent(JSON.stringify(state)) }).toString();
console.log(url.href);
\`\`\`

Return a clickable game URL and the title, with the questions, answers, and sources in a separate spoiler section. Keep questions concise so the URL stays below 7,000 characters (the compressed d value must not exceed 12,000 characters). The link contains the answers: compression is not encryption.

If you cannot execute JavaScript with lz-string, say so and return the complete game JSON and runnable encoding code instead of inventing a URL.`;
}
