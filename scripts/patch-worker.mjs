// Post-processes the @cloudflare/next-on-pages worker bundle.
//
// next-on-pages (deprecated, built for Next <= 14) cannot serve Next 16's
// segment-prefetch requests for dynamic routes: its router rewrites them to
// `.segments/...segment.rsc` assets that only exist for prerendered pages, so
// every link prefetch on the site returns 404. The Next.js middleware can't
// intercept them either — the middleware adapter strips the internal RSC
// headers before user code runs.
//
// Fix: wrap the generated worker's fetch handler so that, for a segment
// prefetch, we drop the `next-router-segment-prefetch` header and let the
// request fall through as an ordinary RSC prefetch. next-on-pages then routes
// it to the route's `.rsc` asset and returns a real 200 payload the router
// caches — no 404, and no empty 204 that the browser aborts (ERR_ABORTED).
//
// Run after `npx @cloudflare/next-on-pages` (see the pages:build script).
import fs from 'node:fs';
import path from 'node:path';

const MARKER = '/*seg-prefetch-fwd*/';
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

const [match, req] = matches[0];
const intercept =
  `${MARKER}if(${req}.headers.get("next-router-segment-prefetch")){` +
  `const _h=new Headers(${req}.headers);_h.delete("next-router-segment-prefetch");` +
  `${req}=new Request(${req},{headers:_h});}`;

fs.writeFileSync(entry, src.replace(match, match + intercept));
console.log('patch-worker: worker now forwards segment prefetches as ordinary RSC requests.');
