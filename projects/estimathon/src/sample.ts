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
    ['How many minutes are there in one week?', '10080'],
    ['How many squares of all sizes are in an 8 by 8 grid?', '204'],
    ['How many voting seats are in the US House of Representatives?', '435'],
    ['How many letter tiles, including blanks, are in a standard English-language Scrabble set?', '100'],
    ['How many seconds are there in one day?', '86400'],
    ['In how many different orders can seven distinct books be arranged on a shelf?', '5040'],
    ['What is the sum of all the whole numbers from 1 through 100?', '5050'],
    ['How many dots in total are on all 28 dominoes in a standard double-six set?', '168'],
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
        ['How many meters does light travel in a vacuum in one second? (exact value)', '299792458'],
        ['How many meters are in one astronomical unit? (IAU definition)', '149597870700'],
        ['How many chromosomes are in a typical human egg cell?', '23'],
        ['How many electrons does a neutral gold atom have?', '79'],
        ['How many protons does a uranium atom have?', '92'],
        ['How many cubic centimeters are in one liter?', '1000'],
        ['How many nanometers are in one meter?', '1000000000'],
        ['How many days are in a 400-year cycle of the Gregorian calendar?', '146097'],
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
        ['How many micrometers are in one inch?', '25400'],
        ['How many square feet are in one acre?', '43560'],
        ['How many minutes are in a leap year?', '527040'],
        ['How many square feet is an NBA basketball court measuring 94 feet by 50 feet?', '4700'],
        ['How many US teaspoons are in one US liquid gallon?', '768'],
        ['How many different four-digit PINs are possible, including those starting with zero?', '10000'],
        ['How many bits are in one kibibyte (1,024 bytes)?', '8192'],
        ['How many individual cells are in a 12 by 12 grid?', '144'],
      ],
    },
    description: 'Time, measurements, and familiar objects.',
  },
];
