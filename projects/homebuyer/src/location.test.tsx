import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import simulatedDataset from '../data/testing/simulated-listings-20.json';
import { validateDataset } from './game';
import { HomeAddress, HomeMap, homeLocation } from './location';

const home = { ...simulatedDataset.homes[0], address: '480 Bartlett St' };

describe('home addresses and map targets', () => {
  it('uses the supplied real address without requiring coordinates', () => {
    const location = homeLocation(home, false);
    expect(location.address).toBe('480 Bartlett St');
    expect(location.approximate).toBe(false);
    expect(new URL(location.embedUrl!).searchParams.get('q')).toBe(
      '480 Bartlett St, San Francisco, CA',
    );
    expect(new URL(location.embedUrl!).searchParams.get('output')).toBe('embed');
    expect(new URL(location.mapsUrl!).searchParams.get('query')).toBe(
      location.query,
    );
    expect(
      renderToStaticMarkup(<HomeAddress home={home} simulated={false} />),
    ).toContain('480 Bartlett St');
  });

  it.each([undefined, null, '', '   '])(
    'supports a missing address (%s) and labels the neighborhood fallback',
    (address) => {
      const missing = { ...home, address };
      const dataset = {
        ...simulatedDataset,
        homes: [missing, ...simulatedDataset.homes.slice(1)],
      };
      expect(() => validateDataset(dataset, dataset.version)).not.toThrow();
      const location = homeLocation(missing, false);
      expect(location.address).toBe('Street address unavailable');
      expect(location.approximate).toBe(true);
      expect(new URL(location.embedUrl!).searchParams.get('q')).toBe(
        'Bernal Heights, San Francisco, CA',
      );
      expect(
        renderToStaticMarkup(<HomeMap home={missing} simulated={false} />),
      ).toContain('neighborhood map (approximate)');
    },
  );

  it('never presents or geocodes a simulated address as a real property', () => {
    for (const fixture of simulatedDataset.homes) {
      const location = homeLocation(fixture, true);
      expect(location.address).toBe('Simulated home · No real street address');
      expect(location.approximate).toBe(true);
      expect(new URL(location.embedUrl!).searchParams.get('q')).toBe(
        `${fixture.neighborhood}, San Francisco, CA`,
      );
      expect(location.embedUrl).not.toContain('SIM-HB');
    }
    expect(homeLocation(home, true).query).not.toContain('480 Bartlett');
    expect(
      renderToStaticMarkup(<HomeAddress home={home} simulated />),
    ).toContain('Simulated home · No real street address');
  });

  it('encodes map queries so address characters cannot change URL parameters', () => {
    const address = 'Test &output=other #1';
    const location = homeLocation({ ...home, address }, false);
    const url = new URL(location.embedUrl!);
    expect(url.searchParams.get('q')).toBe(
      'Test &output=other #1, San Francisco, CA',
    );
    expect(url.searchParams.get('output')).toBe('embed');
    expect(url.hash).toBe('');
  });

  it('does not load embeds while collapsed and handles no usable location', () => {
    const html = renderToStaticMarkup(<HomeMap home={home} simulated={false} />);
    expect(html).toContain('View address on Google Map');
    expect(html).not.toContain('<iframe');
    const unknown = { ...home, address: '', neighborhood: '  ' };
    expect(homeLocation(unknown, false).embedUrl).toBeNull();
    expect(
      renderToStaticMarkup(<HomeMap home={unknown} simulated={false} />),
    ).toContain('Map unavailable');
  });
});
