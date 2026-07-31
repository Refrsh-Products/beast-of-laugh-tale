import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

/**
 * Shared scanning logic for the hardcoded-colour ratchet. Lives apart from the
 * test so the baseline generator (`npm run lint:colors -- --update`) and the
 * test itself can never disagree about what counts as a violation.
 */

export const SRC_ROOT = "src";

/**
 * Permanently outside the design-token system, with the reason recorded here
 * rather than left implicit. Anything not listed is migratable debt and
 * belongs in the baseline instead.
 */
export const EXEMPT: Array<{ prefix: string; reason: string }> = [
  {
    prefix: "src/components/landing",
    reason:
      "Marketing page with bespoke WebGL/ogl visuals; colours are shader inputs, not UI surfaces.",
  },
];

/** Colour literals: #rgb/#rrggbb/#rrggbbaa plus rgb()/rgba()/hsl()/hsla(). */
const COLOUR_PATTERN =
  /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(\s*[\d.]+/g;

const isSourceFile = (path: string) =>
  /\.tsx?$/.test(path) && !/\.d\.ts$/.test(path);

/**
 * Tests are excluded: asserting on a brand hex (as the token tests do) is a
 * legitimate use, and counting them would make the guard fight itself.
 */
const isTestFile = (path: string) =>
  /\.test\.tsx?$/.test(path) || path.split(sep).includes("tests");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

export function isExempt(posixPath: string): boolean {
  return EXEMPT.some((e) => posixPath.startsWith(e.prefix));
}

/** Maps repo-relative POSIX paths to their colour-literal count (>0 only). */
export function scanColourLiterals(root = SRC_ROOT): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const file of walk(root)) {
    const posixPath = relative(process.cwd(), file).split(sep).join("/");
    if (!isSourceFile(posixPath)) continue;
    if (isTestFile(posixPath)) continue;
    if (isExempt(posixPath)) continue;

    const matches = readFileSync(file, "utf8").match(COLOUR_PATTERN);
    if (matches?.length) counts[posixPath] = matches.length;
  }

  return counts;
}
