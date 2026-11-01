import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { normalize, parseCsv } from './normalize.mjs';

const [csvPath, version, cutoff = '5000000'] = process.argv.slice(2);
if (
  !csvPath ||
  !/^\d{4}-\d{2}(?:-[a-z0-9]+)?$/.test(version || '') ||
  !/^\d+$/.test(cutoff) ||
  Number(cutoff) <= 0 ||
  Number(cutoff) > 100_000_000
) {
  console.error(
    'Usage: npm run data:homebuyer -- /path/to/listing_data.csv 2026-11 [max-price-usd=5000000]',
  );
  process.exit(1);
}
const root = fileURLToPath(new URL('../../', import.meta.url));
const dataDir = resolve(root, 'homebuyer/data');
const publicDir = resolve(root, 'homebuyer/public/data');
const hash = (text) => createHash('sha256').update(text).digest('hex');
const source = await readFile(csvPath);
const boundaryName = 'sf-neighborhoods-2026-11-01.geojson';
const boundary = await readFile(resolve(dataDir, boundaryName));
const { homes, report } = normalize(
  parseCsv(source.toString('utf8')),
  JSON.parse(boundary),
  { maxPrice: Number(cutoff) },
);
if (homes.length < 10)
  throw new Error(
    `Only ${homes.length} eligible homes; ten are required. ${JSON.stringify(report)}`,
  );
const manifest = JSON.parse(
  await readFile(resolve(publicDir, 'manifest.json'), 'utf8'),
);
if (Object.hasOwn(manifest.datasets, version))
  throw new Error(
    `Dataset ${version} already exists. Released versions are immutable; choose a new version.`,
  );
const file = `${version}.json`;
const raw = JSON.stringify({ version, homes }) + '\n';
await mkdir(resolve(dataDir, version), { recursive: true });
const archivedCsv = resolve(dataDir, version, 'listing_data.csv');
if (resolve(csvPath) !== archivedCsv)
  await copyFile(csvPath, archivedCsv, constants.COPYFILE_EXCL);
await writeFile(resolve(publicDir, file), raw, { flag: 'wx' });
await writeFile(
  resolve(dataDir, version, 'provenance.json'),
  JSON.stringify(
    {
      version,
      source: 'listing_data.csv',
      sourceSha256: hash(source),
      boundary: boundaryName,
      boundarySha256: hash(boundary),
      maxPrice: Number(cutoff),
      datasetSha256: hash(raw),
      ...report,
    },
    null,
    2,
  ) + '\n',
  { flag: 'wx' },
);
manifest.datasets[version] = { file, sha256: hash(raw), homes: homes.length };
manifest.latest = version;
await writeFile(
  resolve(publicDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log(JSON.stringify({ version, ...report }, null, 2));
