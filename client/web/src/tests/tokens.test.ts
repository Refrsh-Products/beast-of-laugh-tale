import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * These tests parse src/index.css directly rather than rendering components.
 * jsdom does not run Tailwind or resolve custom properties, so asserting on
 * getComputedStyle in a component test would pass no matter what the palette
 * says. Reading the token file is the only place the palette can actually be
 * checked.
 *
 * Reference: FRESHR Brandbook V1 (2026) — Colour, pp. 22-26.
 */

// The jsdom environment gives import.meta.url an http: scheme, so resolve from
// the vitest root (client/web) instead.
const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");

/** Tokens that intentionally exist only in :root — shape, not colour. */
const LIGHT_ONLY = new Set(["--radius"]);

/** Raw brand ramps and gradients: theme-independent by design. */
const isRamp = (name: string) => name.startsWith("--brand-");

function declarations(selector: string): Map<string, string> {
  // index.css splits :root across several blocks (ramps, then semantics), so
  // collect every matching block rather than just the first.
  const blocks = [
    ...css.matchAll(new RegExp(`(?:^|\\n)${selector}\\s*\\{([^}]*)\\}`, "g")),
  ];
  if (blocks.length === 0) throw new Error(`No ${selector} block in index.css`);
  const tokens = new Map<string, string>();
  for (const b of blocks) {
    for (const [, name, value] of b[1].matchAll(
      /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi,
    )) {
      tokens.set(name, value.trim());
    }
  }
  return tokens;
}

const light = declarations(":root");
const dark = declarations("\\.dark");

/** Follows var(--x) chains down to a literal value. */
function resolveToken(name: string, scope: Map<string, string>): string {
  const initial = scope.get(name) ?? light.get(name);
  if (initial === undefined) throw new Error(`Undefined token ${name}`);
  let value: string = initial;
  for (let hops = 0; hops < 10; hops++) {
    const ref: RegExpMatchArray | null = value.match(
      /^var\((--[a-z0-9-]+)\)$/i,
    );
    if (!ref) return value;
    const next = scope.get(ref[1]) ?? light.get(ref[1]);
    if (next === undefined) {
      throw new Error(`${name} resolves to undefined ${ref[1]}`);
    }
    value = next;
  }
  throw new Error(`Cyclic var() chain at ${name}`);
}

/* -------------------------------------------------------------------------- */
/* WCAG relative luminance and contrast.                                      */
/* -------------------------------------------------------------------------- */

const toLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

function luminance(hex: string): number {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) throw new Error(`Not a 6-digit hex colour: ${hex}`);
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    toLinear(v / 255),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string, scope: Map<string, string>): number {
  const [hi, lo] = [
    luminance(resolveToken(a, scope)),
    luminance(resolveToken(b, scope)),
  ].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const themes: Array<[string, Map<string, string>]> = [
  ["light", light],
  ["dark", dark],
];

/* -------------------------------------------------------------------------- */

describe("brand palette fidelity", () => {
  it("anchors each scale on the brandbook's named colour", () => {
    expect(resolveToken("--brand-primary-900", light)).toBe("#19392e"); // Timber Green
    expect(resolveToken("--brand-secondary-300", light)).toBe("#b4ff6e"); // Sulu
    expect(resolveToken("--brand-tertiary-100", light)).toBe("#f1f1e7"); // Ecru White
  });

  it("maps the brand anchors onto the semantic roles they own", () => {
    // Timber Green leads in light, and the brand's own logo rule flips this in
    // dark: on a dark surface the mark is Sulu, so --primary becomes the neon.
    expect(resolveToken("--primary", light)).toBe("#19392e");
    expect(resolveToken("--secondary", light)).toBe("#b4ff6e");
    expect(resolveToken("--background", light)).toBe("#f1f1e7");
    expect(resolveToken("--primary", dark)).toBe("#b4ff6e");
    expect(resolveToken("--primary-foreground", dark)).toBe("#19392e");
  });

  it("keeps the gradient stops the brandbook specifies", () => {
    expect(resolveToken("--brand-primary-600", light)).toBe("#2c6f55");
    expect(resolveToken("--brand-secondary-500", light)).toBe("#67dd05");
  });
});

describe("design token parity", () => {
  it("gives every themeable :root token a .dark counterpart", () => {
    const missing = [...light.keys()].filter(
      (n) => !isRamp(n) && !LIGHT_ONLY.has(n) && !dark.has(n),
    );
    expect(missing).toEqual([]);
  });

  it("does not declare .dark tokens that light mode never defines", () => {
    expect([...dark.keys()].filter((n) => !light.has(n))).toEqual([]);
  });

  it("exposes every semantic colour token as a Tailwind utility", () => {
    // A token with no --color-* mapping is unreachable from a className, which
    // is the failure mode where someone quietly falls back to inline styles.
    const unmapped = [...light.keys()].filter((n) => {
      if (isRamp(n) || LIGHT_ONLY.has(n)) return false;
      return !css.includes(`--color-${n.slice(2)}: var(${n});`);
    });
    expect(unmapped).toEqual([]);
  });
});

describe("token contrast (WCAG 2.1 AA)", () => {
  it.each(themes)("keeps text readable on its surface in %s", (_name, scope) => {
    const pairs: Array<[string, string]> = [
      ["--foreground", "--background"],
      ["--card-foreground", "--card"],
      ["--popover-foreground", "--popover"],
      ["--muted-foreground", "--background"],
      ["--muted-foreground", "--card"],
      ["--muted-foreground", "--muted"],
      ["--primary-foreground", "--primary"],
      ["--secondary-foreground", "--secondary"],
      ["--accent-foreground", "--accent"],
      ["--destructive-foreground", "--destructive"],
      ["--success-foreground", "--success"],
      ["--sidebar-foreground", "--sidebar"],
    ];
    for (const [fg, bg] of pairs) {
      expect(contrast(fg, bg, scope), `${fg} on ${bg}`).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });

  it.each(themes)(
    "keeps controls and focus distinguishable in %s (3:1, WCAG 1.4.11)",
    (_name, scope) => {
      // --input outlines a control, so it carries the non-text minimum;
      // --border is decorative and deliberately softer.
      for (const surface of ["--background", "--card"] as const) {
        expect(
          contrast("--input", surface, scope),
          `--input on ${surface}`,
        ).toBeGreaterThanOrEqual(3);
        expect(
          contrast("--ring", surface, scope),
          `--ring on ${surface}`,
        ).toBeGreaterThanOrEqual(3);
      }
    },
  );

  it.each(themes)(
    "keeps the status colours readable as text in %s",
    (_name, scope) => {
      // The quiz review marks each answer by colouring the tick, the label and
      // the option text, so --success and --destructive are read as text on a
      // surface, not only as fills behind their own foreground token.
      for (const status of ["--success", "--destructive"] as const) {
        for (const surface of ["--background", "--card"] as const) {
          expect(
            contrast(status, surface, scope),
            `${status} as text on ${surface}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    },
  );

  it("never lets Sulu act as text on a light surface", () => {
    // The brandbook calls this out directly: the neon green breaks contrast on
    // light backgrounds. It scores ~1.3:1 on Ecru, so this asserts the token
    // wiring keeps it out of every light-mode foreground role.
    const sulu = resolveToken("--brand-secondary-300", light);
    const foregrounds = [
      "--foreground",
      "--card-foreground",
      "--muted-foreground",
      "--secondary-foreground",
      "--accent-foreground",
    ];
    for (const token of foregrounds) {
      expect(resolveToken(token, light), `${token} must not be Sulu`).not.toBe(
        sulu,
      );
    }
  });
});
