import simulatedDataset from '../data/testing/simulated-listings-20.json';
import { SIMULATED_VERSION, validateDataset } from './game';

interface DatasetEntry {
  file: string;
  sha256: string;
}

// Keep demo challenges playable even after historical datasets are published.
export async function loadDataset(
  version: string,
  datasets: Record<string, DatasetEntry>,
  signal?: AbortSignal,
) {
  if (version === SIMULATED_VERSION)
    return validateDataset(simulatedDataset, version);
  const entry = Object.hasOwn(datasets, version) ? datasets[version] : null;
  if (!entry)
    throw new Error(
      'This link uses a dataset that is not available. Start a new game with the current homes.',
    );
  if (!/^[a-z0-9-]+\.json$/.test(entry.file))
    throw new Error('The dataset index could not be read.');
  const response = await fetch(`/homebuyer/data/${entry.file}`, { signal });
  if (!response.ok)
    throw new Error('The home data could not be loaded. Please try again.');
  const raw = await response.text();
  const hash = Array.from(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw)),
    ),
    (b) => b.toString(16).padStart(2, '0'),
  ).join('');
  if (hash !== entry.sha256)
    throw new Error(
      'The home data did not match its published version. Please try again.',
    );
  return validateDataset(JSON.parse(raw), version);
}
