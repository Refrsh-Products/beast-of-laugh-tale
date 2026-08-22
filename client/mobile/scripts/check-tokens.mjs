#!/usr/bin/env node
/**
 * Fails if a hardcoded colour has crept back into the app.
 *
 * Every colour must resolve from `lib/design/tokens.ts` — through a Tailwind
 * utility (`bg-card`, `text-muted-foreground`) or, where a className can't
 * reach, through the `useThemeColors()` hook. A literal hex in a component is
 * a colour that won't follow the theme and won't survive a rebrand.
 *
 * This is a script rather than an ESLint rule because client/mobile has no
 * ESLint setup, and a script is one `npm run check:tokens` for a developer and
 * one line in CI.
 *
 * Usage:
 *   npm run check:tokens
 *   npm run check:tokens -- --list    print every offender, not just a summary
 */

import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIST = process.argv.includes('--list');

const SCAN_DIRS = ['app', 'components', 'lib', 'context', 'hooks'];
const SCAN_EXTS = ['.ts', '.tsx'];

/**
 * Files allowed to hold literal colours, each for a reason that is about the
 * file, not about convenience. Keep this list short and keep the reasons here.
 */
const ALLOWLIST = new Map([
  [
    'lib/design/brand.ts',
    'The brandbook ramps themselves. The hex in the comments is the authority the HSL is derived from.',
  ],
  [
    'lib/design/tokens.ts',
    'The token definitions. The few literals here are roles with no ramp step (muted-foreground, destructive), annotated with their hex.',
  ],
  [
    'lib/theme.ts',
    'Generated from lib/design/tokens.ts by `npm run tokens`.',
  ],
  [
    'components/presentation/SlideRenderer.tsx',
    'A slide is a fixed-design canvas: it must match how web renders the same deck and how it exports to PDF, and must NOT invert with the app theme. Colours live in SLIDE_PALETTE at the top of the file.',
  ],
  [
    'components/presentation/exportPresentation.ts',
    'Same as SlideRenderer — the exported document has to look identical to web, which needs literal colours at export time.',
  ],
  [
    'components/auth/GoogleSignInButton.tsx',
    "Google's mark. Its colours are prescribed by their branding guidelines and are not ours to theme.",
  ],
]);

const HEX = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return; // a scan dir that doesn't exist on this branch is fine
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      yield* walk(full);
    } else if (SCAN_EXTS.some((ext) => entry.name.endsWith(ext))) {
      yield full;
    }
  }
}

const offenders = [];
let allowedCount = 0;

for (const dir of SCAN_DIRS) {
  for await (const file of walk(join(ROOT, dir))) {
    const rel = relative(ROOT, file);
    const source = await readFile(file, 'utf8');
    const lines = source.split('\n');

    const hits = [];
    lines.forEach((line, i) => {
      for (const match of line.matchAll(HEX)) {
        hits.push({ line: i + 1, value: match[0], text: line.trim() });
      }
    });

    if (hits.length === 0) continue;

    if (ALLOWLIST.has(rel)) {
      allowedCount += hits.length;
      continue;
    }

    offenders.push({ file: rel, hits });
  }
}

const total = offenders.reduce((n, o) => n + o.hits.length, 0);

if (total === 0) {
  console.log(
    `✓ no hardcoded colours (${allowedCount} in ${ALLOWLIST.size} allowlisted files, each documented in this script)`
  );
  process.exit(0);
}

console.error(`✗ ${total} hardcoded colour${total === 1 ? '' : 's'} in ${offenders.length} files:\n`);

for (const { file, hits } of offenders.sort((a, b) => b.hits.length - a.hits.length)) {
  console.error(`  ${String(hits.length).padStart(3)}  ${file}`);
  if (LIST) {
    for (const hit of hits) {
      console.error(`       ${file}:${hit.line}  ${hit.value}   ${hit.text.slice(0, 80)}`);
    }
  }
}

console.error(
  `\nUse a Tailwind utility (bg-card, text-destructive) or the useThemeColors() hook.` +
    `${LIST ? '' : '\nRe-run with `-- --list` to see every line.'}`
);
process.exit(1);
