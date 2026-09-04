# Build & Release

## Running the app day to day

See `client/mobile/README.md` in the repo — `npx expo start` (or `npm run dev`, which
adds `-c` to clear cache) then press `i` for the iOS Simulator.

Physical devices via Expo Go are capped at SDK 54 and can't run this SDK 56 app, and
Google Sign-In needs a dev build regardless (blocked in Expo Go — see [Auth](auth.md)).
So day-to-day development happens in the Simulator/emulator, not on a physical phone in
Expo Go.

## Local Android APK, without EAS

`client/mobile` is a Continuous Native Generation (CNG) app — `android/` and `ios/` are
gitignored and generated on demand — so a sideloadable release APK doesn't require an EAS
build:

```bash
npx expo prebuild --platform android
cd android
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
ANDROID_HOME="$HOME/Library/Android/sdk" \
./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a
```

**Why the explicit `JAVA_HOME`:** the machine's default `java` is a version AGP rejects;
Android Studio bundles a compatible JBR (17) that this points at instead. Limiting to
`arm64-v8a` cuts a cold build from ~9 minutes to ~1.5 minutes incremental and still covers
any modern phone — Gradle downloads any missing SDK platform/build-tools/NDK on its own.

The APK lands at `android/app/build/outputs/apk/release/app-release.apk`. Expo's generated
`release` build type signs with the **debug keystore**, so it installs by sideloading with
no keystore setup — but Google Sign-In will fail in that build unless the debug SHA-1
(`5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`) is added to the
`cc.freshr.app` Android OAuth client in Google Cloud Console.

## iOS builds

`pod install` in `client/mobile/ios` needs a UTF-8 locale or it crashes with `Unicode
Normalization not appropriate for ASCII-8BIT`:

```bash
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install
```

Separately, `ios/Pods` can drift out of sync with `client/node_modules` (seen: `RNScreens`
missing a header, an `ExpoModulesCore` podspec version mismatch), which fails the Xcode
build with `could not build Objective-C module 'RNScreens'` — nothing to do with app
config or assets. Plain `pod install` refuses to fix podspec drift on its own; use:

```bash
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod update --no-repo-update
```

## EAS

`eas.json` has three build profiles — `development` (internal, dev client), `preview`
(internal APK), `production` (auto-incrementing version) — but `submit.production` is an
empty object, so `eas submit` isn't configured with store credentials yet. `EAS_BUILD_PROFILE`
is what `app.config.ts` reads to pick the right API base URL per profile
(`staging.freshr.cc` for preview, `freshr.cc` for production); local dev has no such env
var set and falls back to `http://localhost:8000` unless `EXPO_PUBLIC_API_BASE_URL`
overrides it.
