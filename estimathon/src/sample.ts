import type { State } from './game';

// Fixed, self-contained questions; no remote data is needed to play.
export const SAMPLE: State = {
  v: 1,
  m: 'game',
  t: 'General knowledge',
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

export const SAMPLES: { game: State; description: string }[] = [
  {
    game: SAMPLE,
    description: 'Landmarks, music, time, and the human body.',
  },
  {
    game: {
      v: 1,
      m: 'game',
      t: 'Science and space',
      q: [
        ['How many kilometers per second does light travel in a vacuum? (nearest whole kilometer)', '299792'],
        ['How many kilometers is the average distance from Earth to the Moon? (NASA average)', '384400'],
        ['How many chemical elements are in the periodic table?', '118'],
        ['How many minutes does the International Space Station take to orbit Earth? (approximate)', '90'],
        ['How many chromosomes are in a typical human body cell?', '46'],
      ],
    },
    description: 'Distances, orbits, elements, and biology.',
  },
  {
    game: {
      v: 1,
      m: 'game',
      t: 'Everyday numbers',
      q: [
        ['How many seconds are there in one week?', '604800'],
        ['How many milliliters are in one US liquid gallon? (nearest whole milliliter)', '3785'],
        ['How many meters long is an official marathon?', '42195'],
        ['How many centimeters long is the diagonal of a 55-inch television? (nearest whole centimeter)', '140'],
        ['How many square centimeters are in one square meter?', '10000'],
      ],
    },
    description: 'Time, measurements, and familiar objects.',
  },
];
