/** Offline Redfin CSV normalization. No network access is performed here. */
export function parseCsv(text) {
  const rows = [];
  let row = [],
    field = '',
    quoted = false,
    closed = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else field += char;
    } else if (char === '"') {
      if (field || closed) throw new Error('Unexpected quote in CSV.');
      quoted = true;
    } else if (char === ',' || char === '\n' || char === '\r') {
      row.push(field.trim());
      field = '';
      closed = false;
      if (char !== ',') {
        if (char === '\r' && text[i + 1] === '\n') i++;
        if (row.some(Boolean)) rows.push(row);
        row = [];
      }
    } else {
      if (closed && char.trim())
        throw new Error('Unexpected content after CSV quote.');
      if (!closed) field += char;
    }
  }
  if (quoted) throw new Error('Unclosed CSV quote.');
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  if (rows.length < 2) throw new Error('CSV has no listings.');
  const headers = rows.shift().map((header) => header.toUpperCase());
  if (new Set(headers).size !== headers.length)
    throw new Error('Duplicate CSV headers.');
  return rows.map((values) => {
    if (values.length !== headers.length)
      throw new Error('CSV row has an unexpected number of fields.');
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index]]),
    );
  });
}

function onSegment(x, y, a, b) {
  const cross = (x - a[0]) * (b[1] - a[1]) - (y - a[1]) * (b[0] - a[0]);
  return (
    Math.abs(cross) < 1e-12 &&
    x >= Math.min(a[0], b[0]) &&
    x <= Math.max(a[0], b[0]) &&
    y >= Math.min(a[1], b[1]) &&
    y <= Math.max(a[1], b[1])
  );
}
function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i],
      b = ring[j];
    if (onSegment(x, y, a, b)) return true;
    if (
      a[1] > y !== b[1] > y &&
      x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
}
function inPolygon(x, y, rings) {
  return (
    inRing(x, y, rings[0]) && !rings.slice(1).some((ring) => inRing(x, y, ring))
  );
}
export function neighborhoodFor(lon, lat, boundaries) {
  // Stable lexical tie-break on a shared boundary, independent of feature order.
  const matches = boundaries.features
    .filter((feature) => {
      const geometry = feature.geometry;
      if (geometry.type === 'Polygon')
        return inPolygon(lon, lat, geometry.coordinates);
      if (geometry.type === 'MultiPolygon')
        return geometry.coordinates.some((polygon) =>
          inPolygon(lon, lat, polygon),
        );
      return false;
    })
    .map((feature) => feature.properties.nhood)
    .filter((name) => typeof name === 'string' && name);
  return matches.sort()[0] || null;
}
function numeric(value) {
  if (typeof value !== 'string' || !value.trim()) return NaN;
  const cleaned = value.replace(/[$,]/g, '').trim();
  return /^-?\d+(\.\d+)?$/.test(cleaned) ? Number(cleaned) : NaN;
}
export function saleDate(value) {
  if (!value) return null;
  let year, month, day;
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const us = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const named = value.match(/^([A-Za-z]+)[ -](\d{1,2})[, -]+(\d{4})$/);
  if (iso) [, year, month, day] = iso.map(Number);
  else if (us) [, month, day, year] = us.map(Number);
  else if (named) {
    year = Number(named[3]);
    day = Number(named[2]);
    month =
      [
        'jan',
        'feb',
        'mar',
        'apr',
        'may',
        'jun',
        'jul',
        'aug',
        'sep',
        'oct',
        'nov',
        'dec',
      ].indexOf(named[1].slice(0, 3).toLowerCase()) + 1;
  } else return null;
  if (
    year < 1900 ||
    year > 2100 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  )
    return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return null;
  return date.toISOString().slice(0, 10);
}
export function normalize(rows, boundaries, { maxPrice = 5_000_000 } = {}) {
  const candidates = [];
  const excluded = {};
  const reject = (reason) => {
    excluded[reason] = (excluded[reason] || 0) + 1;
  };
  for (const row of rows) {
    if (
      !['PAST SALE', 'SOLD'].includes(
        (row['SALE TYPE'] || row.STATUS || '').toUpperCase(),
      ) ||
      (row.CITY || '').toLowerCase() !== 'san francisco' ||
      (row.STATE || 'CA').toUpperCase() !== 'CA' ||
      (row['PROPERTY TYPE'] || '').toLowerCase() !== 'single family residential'
    ) {
      reject('ineligible');
      continue;
    }
    const id = row['LISTING ID'] || row['MLS#'] || row['MLS ID'];
    const salePrice = numeric(row.PRICE),
      beds = numeric(row.BEDS),
      baths = numeric(row.BATHS),
      sqft = numeric(row['SQUARE FEET']);
    const lat = numeric(row.LATITUDE),
      lon = numeric(row.LONGITUDE),
      date = saleDate(row['SOLD DATE']);
    const urlKey = Object.keys(row).find(
      (key) => key === 'URL' || key.startsWith('URL ('),
    );
    const sourceUrl = row[urlKey];
    let validUrl = false;
    try {
      const url = new URL(sourceUrl);
      validUrl = url.protocol === 'https:' && !url.username && !url.password;
    } catch {
      /* excluded below */
    }
    if (
      !id ||
      !Number.isSafeInteger(salePrice) ||
      salePrice <= 0 ||
      !Number.isInteger(beds) ||
      beds < 0 ||
      beds > 50 ||
      !Number.isFinite(baths) ||
      baths < 0 ||
      baths > 50 ||
      !Number.isSafeInteger(sqft) ||
      sqft <= 0 ||
      !date ||
      !Number.isFinite(lat) ||
      lat < -90 ||
      lat > 90 ||
      !Number.isFinite(lon) ||
      lon < -180 ||
      lon > 180 ||
      !validUrl
    ) {
      reject('invalid');
      continue;
    }
    if (salePrice > maxPrice) {
      reject('aboveCutoff');
      continue;
    }
    const neighborhood = neighborhoodFor(lon, lat, boundaries);
    if (!neighborhood) {
      reject('unmapped');
      continue;
    }
    candidates.push({
      id: String(id),
      neighborhood,
      beds,
      baths,
      sqft,
      saleDate: date,
      salePrice,
      address: row.ADDRESS || '',
      sourceUrl,
    });
  }
  // Latest valid sale per ID; identical-date ties use the full normalized record.
  candidates.sort((a, b) =>
    a.id < b.id
      ? -1
      : a.id > b.id
        ? 1
        : a.saleDate > b.saleDate
          ? -1
          : a.saleDate < b.saleDate
            ? 1
            : JSON.stringify(a) < JSON.stringify(b)
              ? -1
              : JSON.stringify(a) > JSON.stringify(b)
                ? 1
                : 0,
  );
  const unique = new Map();
  for (const home of candidates) {
    if (unique.has(home.id)) reject('duplicate');
    else unique.set(home.id, home);
  }
  return {
    homes: [...unique.values()],
    report: { input: rows.length, kept: unique.size, excluded },
  };
}
