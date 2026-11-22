import { cp, mkdir, rm } from 'node:fs/promises';

// Source folders are independent of the site's established public URLs.
await rm('_site', { recursive: true, force: true });
await cp('site', '_site', { recursive: true });
await cp('content/posts', '_site/posts', { recursive: true });
await cp('content/reports', '_site/output', { recursive: true });
await mkdir('_site/shared');
await cp('shared/components/site-header.css', '_site/shared/site-header.css');
await cp('dist/hex-pairs', '_site/hex-pairs', { recursive: true });
await cp('dist/estimathon', '_site/estimathon', { recursive: true });
await cp('dist/homebuyer', '_site/homebuyer', { recursive: true });
await cp('dist/number-hunt', '_site/number-hunt', { recursive: true });
