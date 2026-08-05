import { describe, it, expect } from "vitest";

import * as viaAlias from "@/lib/constants";
import * as viaRelative from "../constants";
import { GoogleOAuthProvider } from "@react-oauth/google";

describe("@/ path alias", () => {
  it("resolves to the same module instance as a relative import", () => {
    // Identity, not equality: a mis-scoped alias can still resolve the file but
    // produce a second copy of the module, which silently breaks module-level
    // singletons such as webSessionStore.
    expect(viaAlias).toBe(viaRelative);
  });

  it("does not intercept scoped package imports", () => {
    // Guards the regex form of the alias: a bare "@" prefix match would try to
    // resolve @react-oauth/google and @testing-library/* out of src/.
    expect(GoogleOAuthProvider).toBeDefined();
  });
});
