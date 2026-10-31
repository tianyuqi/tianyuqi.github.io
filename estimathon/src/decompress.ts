/**
 * Size-bounded decoder for lz-string's URI alphabet. Stop while expanding, before
 * a small malicious payload can allocate an arbitrarily large JSON string.
 * Adapted from lz-string 1.5.0's decoder (https://github.com/pieroxy/lz-string).
 *
 * Copyright (c) 2013 Pieroxy
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$';
export function decompressBounded(input: string, limit: number): string {
  let bit = 0;
  const read = (count: number): number => {
    let value = 0;
    for (let power = 1; power < 2 ** count; power *= 2) {
      if (bit >= input.length * 6) throw new Error('Truncated compressed data.');
      const symbol = ALPHABET.indexOf(input[Math.floor(bit / 6)]);
      if (symbol < 0) throw new Error('Invalid compressed data.');
      if (symbol & (1 << (5 - (bit % 6)))) value += power;
      bit++;
    }
    return value;
  };
  const initial = read(2);
  if (initial === 2) return '';
  if (initial > 1) throw new Error('Invalid compressed data.');
  let previous = String.fromCharCode(read(initial === 0 ? 8 : 16));
  const dictionary = ['', '', '', previous];
  const output = [previous];
  let size = 1,
    remaining = 4,
    width = 3;
  while (true) {
    let code = read(width);
    if (code === 2) return output.join('');
    if (code === 0 || code === 1) {
      dictionary.push(String.fromCharCode(read(code === 0 ? 8 : 16)));
      code = dictionary.length - 1;
      remaining--;
    }
    if (remaining === 0) {
      remaining = 2 ** width;
      width++;
    }
    const entry = dictionary[code] || (code === dictionary.length ? previous + previous[0] : '');
    if (!entry) throw new Error('Invalid compressed dictionary.');
    size += entry.length;
    if (size > limit) throw new Error('This game link expands beyond the size limit.');
    output.push(entry);
    dictionary.push(previous + entry[0]);
    previous = entry;
    remaining--;
    if (remaining === 0) {
      remaining = 2 ** width;
      width++;
    }
  }
}
