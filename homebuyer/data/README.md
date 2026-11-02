# Historical home sales

**No real dataset is published yet.** The supplied `listing_data.csv` was not present in the repository or attached to HOM-15 when implementation began. The empty manifest is deliberately not a released dataset version.

`testing/simulated-listings-20.json` is a synthetic fixture for game tests and local development. Its `simulated-test-20` version, `SIM-HB-*` IDs, simulated addresses, and reserved `.invalid` URLs identify it as test-only data. It stays outside `public/data/` and is not included in the release manifest, so the site will not present it as historical sales.

Import the supplied file from the repository root:

```
npm run data:homebuyer -- /path/to/listing_data.csv 2026-11
```

An optional third argument changes the inclusive $5,000,000 sale-price cutoff. The importer requires ten eligible, distinct IDs, archives the exact CSV at `homebuyer/data/<version>/listing_data.csv`, writes a compact JSON file in `homebuyer/public/data/`, records source/boundary/output SHA-256 hashes and exclusion counts, then adds the release to `manifest.json`. It refuses to overwrite a released version. Commit the source CSV, provenance, JSON and updated manifest together. Keep every released JSON and manifest entry forever; change the version when source, normalization, polygons, or cutoff changes. Do not repurpose `2026-11` after release.

Source is expected to use Redfin CSV headers: `SALE TYPE` (`PAST SALE` or `SOLD`; `STATUS` is also supported), `CITY` (`San Francisco`), `STATE` (`CA`, when present), `PROPERTY TYPE` (`Single Family Residential`), `LISTING ID` (or `MLS#`/`MLS ID`), `SOLD DATE`, `PRICE`, `BEDS`, `BATHS`, `SQUARE FEET`, `LATITUDE`, `LONGITUDE`, `ADDRESS`, and `URL` (including Redfin's longer `URL (...)` header). Prices are integer USD. Dates accept ISO, US month/day/year, and Redfin's month-name formats. No list price or list date is created or used.

Rows missing valid positive sale price/square footage, nonnegative bed/bath counts, valid date/coordinates, stable ID or HTTPS listing URL are excluded. Coordinates outside the polygons (including polygon holes) are excluded, never filled from `LOCATION`. The latest valid sale per ID wins; same-date duplicates use lexical comparison of the complete normalized record. Stable IDs are sorted in code-point order.

## Neighborhood boundaries

`sf-neighborhoods-2026-11-01.geojson` is a pinned snapshot retrieved on November 1, 2026 from **DataSF, SF Find Neighborhoods**, dataset `j2bu-swwd` (41 named neighborhood polygons):

- Catalog: https://data.sfgov.org/Geographic-Locations-and-Boundaries/SF-Find-Neighborhoods/j2bu-swwd
- Download: https://data.sfgov.org/resource/j2bu-swwd.geojson?$limit=1000
- DataSF open-data terms: https://datasf.org/opendata/terms-of-use/

These are polygon-derived neighborhood names, independent of the source's broad `LOCATION` districts. Polygon and MultiPolygon rings and holes are supported. If a coordinate lies on a shared boundary, the lexically first matching neighborhood name wins. All gameplay lookup is offline; no maps or external gameplay APIs are called.

## Game format v1

`/homebuyer/?v=1&d=2026-11&s=8372641&r=...`

Unsigned 32-bit seed → Mulberry32 → Fisher–Yates over stable ID ordering → first ten homes. The format version fixes these algorithms. Released dataset bytes are verified against the manifest's SHA-256 before play.

Optional `r` is lz-string `compressToEncodedURIComponent(JSON.stringify([1, bids]))`. The ten integer bids are **$1K units**, with `-1` for a pass. Decimal millions are parsed without float drift and rounded half-up to the nearest $1K (so `1.7505` becomes $1,751,000); accepted bids are $1K–$100M. The decoder validates version, array shape, count, integer/range constraints, compressed input size and decompressed size. Outcomes are always recomputed from bids and sale prices. This encoding is not encryption or anti-cheat: the static JSON and compressed bids are public, but the UI hides them until the appropriate reveal.

Ranking is good buys descending, overpaid ascending, then aggregate premium ascending on all won homes (good and overpaid). Average percentage premium is the arithmetic mean of each won home's percentage premium; no wins displays 0%. Equal sale price and exactly +25% are good buys. No storage, cookies, tracking, or player accounts are used. A refresh starts the same game over.
