import type { State } from './game';

// Fixed, self-contained questions; no remote data is needed to play.
export const SAMPLE: State = {
  v: 1,
  m: 'game',
  t: 'A world of ballpark figures',
  q: [
    [
      'How many kilometers long is the Great Wall of China, including all its branches? (2012 survey, rounded)',
      '21196',
    ],
    ['How many minutes are there in a non-leap year?', '525600'],
    ['How many keys are on a standard modern piano?', '88'],
    ['How many meters tall is the Eiffel Tower, including its antenna? (2022)', '330'],
    ['How many bones are in a typical adult human body?', '206'],
  ],
};
