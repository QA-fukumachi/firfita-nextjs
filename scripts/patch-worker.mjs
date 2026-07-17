// Post-processes the @cloudflare/next-on-pages worker bundle.
//
// next-on-pages (deprecated, built for Next <= 14) cannot serve Next 16's
// segment-prefetch requests for dynamic routes: its router rewrites them to
// `.segments/...` assets that only exist for prerendered pages, so every
// link prefetch on the site returns 404. The Next.js middleware cannot
// intercept them either — the middleware adapter strips the internal RSC
// headers before user code runs. So we patch the generated worker's fetch
// handler to answer those requests with 204, which the Next.js router client
// treats as a prefetch cache miss: navigation then falls back to a regular
// dynamic RSC request, which next-on-pages serves correctly.
//
// Run after `npx @cloudflare/next-on-pages` (see the pages:build script).
import fs from 'node:fs';
import path from 'node:path';

const MARKER = '/*seg-prefetch-204*/';
const entry = path.resolve('.vercel/output/static/_worker.js/index.js');

if (!fs.existsSync(entry)) {
  console.error(`patch-worker: ${entry} not found — run @cloudflare/next-on-pages first.`);
  process.exit(1);
}

const src = fs.readFileSync(entry, 'utf8');

if (src.includes(MARKER)) {
  console.log('patch-worker: worker already patched, skipping.');
  process.exit(0);
}

const fetchHandler = /\{\s*async fetch\((\w+),\s*\w+,\s*\w+\)\s*\{/g;
const matches = [...src.matchAll(fetchHandler)];
if (matches.length !== 1) {
  console.error(
    `patch-worker: expected exactly one worker fetch handler, found ${matches.length}. ` +
      'The next-on-pages output format changed — update this script.'
  );
  process.exit(1);
}

const [match, requestParam] = matches[0];
const intercept =
  `${MARKER}if(${requestParam}.headers.get("next-router-segment-prefetch"))` +
  'return new Response(null,{status:204,headers:{vary:' +
  '"RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch"}});';

fs.writeFileSync(entry, src.replace(match, match + intercept));
console.log('patch-worker: worker fetch handler now answers segment prefetches with 204.');
