import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * Guards one cascade invariant that no rendering test can catch: jsdom neither
 * runs Tailwind nor applies cascade layers, so the only way to check this is to
 * read the source.
 *
 * Tailwind v4 emits every utility inside `@layer utilities`, and an unlayered
 * declaration outranks any layered one regardless of selector specificity. A
 * vendor stylesheet loaded as a plain <link> is unlayered, so an unscoped one
 * — reveal.js/reset.css resets `font`, `border`, `margin` and `padding` on
 * html, body, div, span and friends — overrides the entire design system for as
 * long as it is in the document. reveal.css itself is `.reveal`-scoped and safe.
 */

const SRC = resolve(process.cwd(), "src");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx|css)$/.test(entry) ? [path] : [];
  });
}

describe("reveal.js stylesheet loading", () => {
  it("never pulls reveal.js's global reset into the document", () => {
    // Matches the quoted module specifier, so prose mentioning the file (this
    // test included) does not register as an import.
    const importsReset = /["']reveal\.js\/reset\.css/;
    const offenders = sourceFiles(SRC)
      .filter((path) => path !== __filename)
      .filter((path) => importsReset.test(readFileSync(path, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("still loads the deck's own stylesheet", () => {
    const viewer = readFileSync(
      resolve(SRC, "components/presentation/PresentationViewer.tsx"),
      "utf8",
    );
    expect(viewer).toContain("reveal.js/reveal.css");
  });
});
