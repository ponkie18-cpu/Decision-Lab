import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const MARKER = 'AIza';
const FIREBASE_CONFIG = 'firebase-applet-config.json';

if (!existsSync(DIST)) {
  console.error('[gate] FAIL: dist/ not found - run the build first');
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

// Allowlist: PUBLIC Firebase Web API keys declared in the project's own
// Firebase config. These are project identifiers, not secrets.
const allowed = new Set();
if (existsSync(FIREBASE_CONFIG)) {
  const collect = (node) => {
    if (typeof node === 'string') {
      if (/^AIza[0-9A-Za-z_-]+$/.test(node)) allowed.add(node);
    } else if (Array.isArray(node)) {
      node.forEach(collect);
    } else if (node && typeof node === 'object') {
      Object.values(node).forEach(collect);
    }
  };
  try {
    collect(JSON.parse(readFileSync(FIREBASE_CONFIG, 'utf8')));
  } catch (e) {
    console.error('[gate] WARN: could not parse firebase config - running strict');
  }
}
console.log('[gate] allowlist size: ' + allowed.size + ' public Firebase key(s)');

const files = walk(DIST);
const leaks = [];
let allowedHits = 0;
let geminiRefs = 0;

for (const file of files) {
  const text = readFileSync(file).toString('latin1');
  if (text.indexOf('GEMINI_API_KEY') !== -1) geminiRefs++;
  let idx = text.indexOf(MARKER);
  while (idx !== -1) {
    const run = /AIza[0-9A-Za-z_-]+/.exec(text.slice(idx, idx + 200));
    const key = run ? run[0] : '';
    if (key && allowed.has(key)) {
      allowedHits++;
      idx = text.indexOf(MARKER, idx + key.length);
    } else {
      leaks.push(file + ' at byte offset ' + idx);
      idx = text.indexOf(MARKER, idx + 1);
    }
  }
}

if (geminiRefs > 0) {
  console.error('[gate] FAIL: GEMINI_API_KEY reference found in dist/ (content redacted)');
  process.exit(1);
}

if (leaks.length > 0) {
  console.error('[gate] FAIL: unknown API key material in dist/ (content redacted)');
  for (const leak of leaks) console.error('  - ' + leak);
  process.exit(1);
}

console.log('[gate] PASS: no unknown key material in dist/ (' + files.length + ' files scanned, ' + allowedHits + ' allowed Firebase key reference(s))');
