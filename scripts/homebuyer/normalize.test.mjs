import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalize,
  parseCsv,
  saleDate,
  neighborhoodFor,
} from './normalize.mjs';
const box = (name, ring, holes = []) => ({
  type: 'Feature',
  properties: { nhood: name },
  geometry: { type: 'Polygon', coordinates: [ring, ...holes] },
});
const outer = [
  [-123, 37],
  [-122, 37],
  [-122, 38],
  [-123, 38],
  [-123, 37],
];
const boundaries = { features: [box('Actual neighborhood', outer)] };
const row = {
  'SALE TYPE': 'PAST SALE',
  CITY: 'San Francisco',
  STATE: 'CA',
  'PROPERTY TYPE': 'Single Family Residential',
  'MLS#': '123',
  PRICE: '$1,000,000',
  BEDS: '3',
  BATHS: '2.5',
  'SQUARE FEET': '1,600',
  LATITUDE: '37.7',
  LONGITUDE: '-122.4',
  'SOLD DATE': 'October-15-2025',
  URL: 'https://example.com/home/123',
  ADDRESS: 'Example',
  LOCATION: 'WRONG DISTRICT',
};
test('CSV handles BOM, quoted commas, escaped quotes, multiline fields, and CRLF', () => {
  assert.deepEqual(
    parseCsv('\uFEFFID,ADDRESS\r\n1,"A, B"\r\n2,"A ""quoted""\nhome"\r\n'),
    [
      { ID: '1', ADDRESS: 'A, B' },
      { ID: '2', ADDRESS: 'A "quoted"\nhome' },
    ],
  );
  assert.throws(() => parseCsv('ID,A\n1,"unclosed'));
  assert.throws(() => parseCsv('ID,A\n1,2,3'));
});
test('dates are sale dates and invalid calendar dates are rejected', () => {
  for (const input of [
    '2025-10-15',
    '10/15/2025',
    'October-15-2025',
    'Oct 15, 2025',
  ])
    assert.equal(saleDate(input), '2025-10-15');
  for (const input of ['2025-02-29', '2/30/2024', '', '2025-99-10'])
    assert.equal(saleDate(input), null);
});
test('uses coordinates rather than LOCATION and keeps correct source fields', () => {
  const { homes } = normalize([row], boundaries);
  assert.equal(homes[0].neighborhood, 'Actual neighborhood');
  assert.equal(homes[0].salePrice, 1000000);
  assert.equal(homes[0].saleDate, '2025-10-15');
  assert.equal(homes[0].sourceUrl, row.URL);
  assert.equal(homes[0].id, '123');
  assert.equal('listPrice' in homes[0], false);
});
test('eligibility, missing values, cutoff and unmapped coordinates exclude rows', () => {
  const changes = [
    { CITY: 'Oakland' },
    { 'PROPERTY TYPE': 'Condo/Co-op' },
    { 'SALE TYPE': 'MLS Listing' },
    { PRICE: '' },
    { BEDS: '' },
    { BATHS: '-1' },
    { 'SQUARE FEET': '0' },
    { LATITUDE: '' },
    { LONGITUDE: '999' },
    { 'SOLD DATE': 'bad' },
    { PRICE: '5000001' },
    { LATITUDE: '40' },
    { URL: 'javascript:alert(1)' },
  ];
  const result = normalize(
    changes.map((change) => ({ ...row, ...change })),
    boundaries,
  );
  assert.equal(result.homes.length, 0);
  assert.equal(
    Object.values(result.report.excluded).reduce((a, b) => a + b, 0),
    changes.length,
  );
  assert.equal(
    normalize([{ ...row, PRICE: '5000000' }], boundaries).homes.length,
    1,
  );
});
test('deduplicates deterministically and sorts stable IDs before sampling', () => {
  const rows = [
    row,
    { ...row, 'SOLD DATE': '10/15/2024' },
    { ...row, PRICE: '900000' },
    { ...row, 'MLS#': '122' },
  ];
  assert.deepEqual(
    normalize(rows, boundaries),
    normalize([...rows].reverse(), boundaries),
  );
  assert.deepEqual(
    normalize(rows, boundaries).homes.map((home) => home.id),
    ['122', '123'],
  );
  assert.equal(normalize(rows, boundaries).report.excluded.duplicate, 2);
});
test('polygon holes, MultiPolygon, and boundary ties have defined treatment', () => {
  const hole = [
    [-122.6, 37.6],
    [-122.3, 37.6],
    [-122.3, 37.9],
    [-122.6, 37.9],
    [-122.6, 37.6],
  ];
  assert.equal(
    neighborhoodFor(-122.4, 37.7, { features: [box('Hole', outer, [hole])] }),
    null,
  );
  assert.equal(
    neighborhoodFor(-122.4, 37.7, {
      features: [
        {
          properties: { nhood: 'Multi' },
          geometry: { type: 'MultiPolygon', coordinates: [[outer]] },
        },
      ],
    }),
    'Multi',
  );
  assert.equal(
    neighborhoodFor(-123, 37.5, {
      features: [box('Z', outer), box('A', outer)],
    }),
    'A',
  );
});

test('CLI archives the supplied CSV, publishes hashes, and refuses a released version', async () => {
  const { mkdtemp, mkdir, readFile, writeFile, cp, rm } = await import(
    'node:fs/promises'
  );
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { spawnSync } = await import('node:child_process');
  const { createHash } = await import('node:crypto');
  const root = await mkdtemp(join(tmpdir(), 'homebuyer-import-'));
  try {
    await mkdir(join(root, 'scripts/homebuyer'), { recursive: true });
    await mkdir(join(root, 'homebuyer/data'), { recursive: true });
    await mkdir(join(root, 'homebuyer/public/data'), { recursive: true });
    for (const file of ['import.mjs', 'normalize.mjs'])
      await cp(
        new URL(file, import.meta.url),
        join(root, 'scripts/homebuyer', file),
      );
    await writeFile(
      join(root, 'homebuyer/data/sf-neighborhoods-2026-11-01.geojson'),
      JSON.stringify(boundaries),
    );
    await writeFile(
      join(root, 'homebuyer/public/data/manifest.json'),
      '{"latest":null,"datasets":{}}\n',
    );
    const records = Array.from({ length: 12 }, (_, i) => ({
      ...row,
      'MLS#': String(i),
    }));
    const csv = [
      Object.keys(row),
      ...records.map((record) => Object.values(record)),
    ]
      .map((fields) =>
        fields
          .map((field) => `"${String(field).replaceAll('"', '""')}"`)
          .join(','),
      )
      .join('\n');
    const source = join(root, 'supplied.csv');
    await writeFile(source, csv);
    const run = () =>
      spawnSync(
        process.execPath,
        [join(root, 'scripts/homebuyer/import.mjs'), source, '2026-11'],
        { encoding: 'utf8' },
      );
    const first = run();
    assert.equal(first.status, 0, first.stderr);
    const released = await readFile(
      join(root, 'homebuyer/public/data/2026-11.json'),
    );
    const manifest = JSON.parse(
      await readFile(join(root, 'homebuyer/public/data/manifest.json'), 'utf8'),
    );
    assert.equal(manifest.latest, '2026-11');
    assert.equal(
      manifest.datasets['2026-11'].sha256,
      createHash('sha256').update(released).digest('hex'),
    );
    assert.equal(
      await readFile(
        join(root, 'homebuyer/data/2026-11/listing_data.csv'),
        'utf8',
      ),
      csv,
    );
    assert.equal(run().status, 1);
    assert.deepEqual(
      await readFile(join(root, 'homebuyer/public/data/2026-11.json')),
      released,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
