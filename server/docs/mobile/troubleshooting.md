# Troubleshooting

A short list of gotchas that look like bugs but are known, deliberate, or environmental.

**"Two copies of React" / hooks errors in Expo Go.**
React and react-dom are pinned to an exact version (`19.2.3`) via the root
`client/package.json`'s `overrides`, specifically to stop npm workspace hoisting from
letting mobile end up with a second, mismatched React copy — which Expo Go's bundled
runtime can't tolerate. If a dependency bump reintroduces a version mismatch here, check
the override first before debugging "phantom" hook errors.

**Editing `lib/design/*` breaks the token generator.**
`npm run tokens` loads `lib/design/tokens.ts` (and everything it imports) through plain
Node with `--experimental-strip-types`, not through Metro or `tsc`. That means:

- No React Native imports anywhere in `lib/design/*`.
- No TypeScript syntax that requires real compilation (enums, namespaces, parameter
  properties) — only erasable type annotations.
- Relative imports need explicit `.ts` extensions (`tokens.ts` imports `brand.ts` this
  way) — Node's ESM resolver won't infer it, even though Metro/`tsc` don't care either
  way.

If `npm run tokens` starts throwing syntax errors after an edit to this folder, this is
almost always why.

**Generated files look "out of sync."**
`global.css`, `lib/theme.ts`, and `lib/design/tailwind-tokens.generated.js` are committed
but generated — never hand-edit them. Change `lib/design/tokens.ts` and run `npm run
tokens`. `npm run tokens:check` is what CI runs to catch drift.

**`pod install` crashes with a Unicode Normalization error, or Xcode can't find a pod
header.** See [Build & Release](build-release.md#ios-builds) — needs a UTF-8 locale, and
`ios/Pods` can drift from `node_modules` independently of that.

**Local release APK builds fail on the JDK.** See
[Build & Release](build-release.md#local-android-apk-without-eas) — the system `java` is
too new for AGP; point `JAVA_HOME` at Android Studio's bundled JBR 17 instead of
installing a separate JDK.

**Google Sign-In does nothing / silently fails.** Three independent reasons this can
happen, in order of likelihood: no `EXPO_PUBLIC_GOOGLE_*` client IDs set (the button just
hides), running in Expo Go (blocked with an explicit alert — needs a dev build), or a
sideloaded debug-keystore build whose SHA-1 isn't registered on the OAuth client yet. See
[Auth](auth.md) and [Build & Release](build-release.md#local-android-apk-without-eas).
