import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { EXEMPT, isExempt, scanColourLiterals } from "./colorLiterals";

/**
 * Ratchet guard for hardcoded colours.
 *
 * src/index.css is the single source of colour truth; components are meant to
 * reach for token utilities (bg-card, text-muted-foreground) instead of raw
 * values. Enforcing that outright is impossible today — the pre-redesign
 * screens still hold hundreds of literals — so this locks in a per-file
 * baseline that may only shrink.
 *
 * The guard fails when a file gains literals, when a new offender appears, AND
 * when the baseline is stale after an improvement. That last case is
 * deliberate: without it the recorded numbers drift upward from reality and
 * quietly buy back the headroom that was just paid off.
 *
 * After migrating a file, re-record the smaller numbers:
 *
 *   npm run baseline:colors
 */

const BASELINE_PATH = resolve(process.cwd(), "src/tests/colorLiterals.baseline.json");

const actual = scanColourLiterals();

// Writing the baseline from inside the test keeps generation and checking on
// exactly one code path; `npm run baseline:colors` just sets this flag.
if (process.env.UPDATE_COLOR_BASELINE) {
  writeFileSync(BASELINE_PATH, JSON.stringify(actual, null, 2) + "\n");
}

const baseline: Record<string, number> = JSON.parse(
  readFileSync(BASELINE_PATH, "utf8"),
);

const REMEDY =
  "Replace the literal with a design token utility (see src/index.css), then run `npm run baseline:colors`.";

describe("hardcoded colour ratchet", () => {
  it("has no file above its recorded baseline", () => {
    const regressions = Object.entries(actual)
      .filter(([file, count]) => file in baseline && count > baseline[file])
      .map(
        ([file, count]) =>
          `${file}: ${baseline[file]} -> ${count} (+${count - baseline[file]})`,
      );

    expect(
      regressions,
      `Colour literals increased. ${REMEDY}`,
    ).toEqual([]);
  });

  it("has no new file introducing colour literals", () => {
    const newOffenders = Object.keys(actual).filter(
      (file) => !(file in baseline),
    );

    expect(
      newOffenders,
      `New files must be token-only from the start. ${REMEDY}`,
    ).toEqual([]);
  });

  it("has an up-to-date baseline", () => {
    // Fires when a file improved but the baseline still claims the old count,
    // which would otherwise leave silent headroom to regress back into.
    const stale = Object.entries(baseline)
      .filter(([file, recorded]) => (actual[file] ?? 0) < recorded)
      .map(
        ([file, recorded]) => `${file}: recorded ${recorded}, now ${actual[file] ?? 0}`,
      );

    expect(
      stale,
      "Baseline is looser than reality — run `npm run baseline:colors` and commit the result.",
    ).toEqual([]);
  });

  it("documents a reason for every exemption", () => {
    for (const { prefix, reason } of EXEMPT) {
      expect(reason.length, `${prefix} needs a reason`).toBeGreaterThan(20);
    }
  });

  it("keeps exempt paths out of the baseline", () => {
    // An exempt path in the baseline would be counted twice over and could
    // never be cleared, making the ratchet impossible to finish.
    const overlap = Object.keys(baseline).filter(isExempt);
    expect(overlap).toEqual([]);
  });
});
