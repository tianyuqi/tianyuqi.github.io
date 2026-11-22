import { useState } from 'react';
import type { Home } from './game';

// Never geocode a simulated address, even if a future fixture supplies one.
export function homeLocation(home: Home, simulated: boolean) {
  const address = home.address?.trim();
  const neighborhood = home.neighborhood.trim();
  const approximate = simulated || !address;
  const query = approximate
    ? neighborhood && `${neighborhood}, San Francisco, CA`
    : `${address}, San Francisco, CA`;
  return {
    address: simulated
      ? 'Simulated home · No real street address'
      : address || 'Street address unavailable',
    approximate,
    query,
    embedUrl: query
      ? `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=${approximate ? 14 : 16}&output=embed`
      : null,
    mapsUrl: query
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
      : null,
  };
}

interface LocationProps {
  home: Home;
  simulated: boolean;
}

export function HomeAddress({ home, simulated }: LocationProps) {
  return <p className="home-address">{homeLocation(home, simulated).address}</p>;
}

export function HomeMap({ home, simulated }: LocationProps) {
  const [open, setOpen] = useState(false);
  const location = homeLocation(home, simulated);
  if (!location.embedUrl || !location.mapsUrl)
    return <p className="map-note">Map unavailable for this home.</p>;
  return (
    <details
      className="home-map"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        {location.approximate
          ? 'View neighborhood map (approximate)'
          : 'View address on Google Map'}
      </summary>
      {open && (
        <div className="map-content">
          <p className="map-note">
            {simulated
              ? 'Approximate neighborhood only. This fictional home has no real property location.'
              : location.approximate
                ? 'Street address unavailable. This is an approximate neighborhood map, not a property location.'
                : 'Google Maps address search based on the listing address. The map may not identify the exact property.'}
          </p>
          <iframe
            title={
              location.approximate
                ? `Approximate neighborhood map: ${home.neighborhood}`
                : `Address map: ${location.query}`
            }
            src={location.embedUrl}
            loading="lazy"
            referrerPolicy="no-referrer"
            allowFullScreen
          />
          <a href={location.mapsUrl} target="_blank" rel="noopener noreferrer">
            Open in Google Maps ↗
          </a>
          <p className="map-note">
            If the embed is unavailable, use the link above.
          </p>
        </div>
      )}
    </details>
  );
}
