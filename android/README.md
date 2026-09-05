# AegisVPN for Android

Kotlin + Jetpack Compose client with a **real** WireGuard tunnel via
[wireguard-android](https://github.com/WireGuard/wireguard-android)'s
`GoBackend` running on `VpnService`. No VPN simulation anywhere: the UI state
comes from a pure state machine fed by real tunnel statistics.

## Requirements

- Android Studio Ladybug (2024.2) or newer, JDK 17
- Android SDK 35, minSdk 26 (Android 8.0+)
- The Gradle wrapper jar is committed (`gradle/wrapper/gradle-wrapper.jar`);
  `./gradlew` works out of the box

## Build & run

```bash
cd android
./gradlew :app:assembleDebug          # debug APK at app/build/outputs/apk/debug/
./gradlew :app:testDebugUnitTest      # JVM unit tests (state machine, DTOs, API)
./gradlew :app:connectedDebugAndroidTest   # instrumented UI tests (needs emulator)
```

Or open the `android/` folder in Android Studio → Run ▶.

Point the app at your backend: the debug build uses
`http://10.0.2.2:8080/api/v1` (emulator → host loopback). Change it in
`app/build.gradle.kts` (`buildConfigField "String", "API_BASE_URL"`).
Real devices on the same LAN: use your machine's LAN IP and add it to
`app/src/debug/res/xml/network_security_config.xml`.

Demo login (after seeding the backend, see root README):
`demo@aegisvpn.local` / `DemoPass123`.

## First-build checklist

This codebase was **not compiled in CI** (no Android SDK in the build
environment — documented honestly in `docs/TESTING.md`). Expected first build:

1. Sync in Android Studio (it downloads AGP 8.5.2 / Kotlin 2.0.20 / deps).
2. If `com.wireguard.android:tunnel:1.0.20260102` fails to resolve, pick the
   newest `1.0.x` from Maven Central and update `app/build.gradle.kts`.
3. If `GoBackend.setVpnServiceCreator` does not exist in your library
   version, see `AegisApplication.kt` — that file is the single place where
   the library glue lives (the `NoSuchMethodError` fallback already handles
   it gracefully).
4. Install on device/emulator → log in → connect → grant VPN consent →
   verify your public IP changes (e.g. https://ifconfig.me) and DNS still
   resolves.

## Architecture

```
ui/            Compose screens (Login, Home, Servers, Devices, Settings)
vpn/           TunnelManager (state machine + GoBackend) + AegisVpnService
data/api/      Retrofit + kotlinx-serialization DTOs (contract v1)
data/repo/     AuthRepository, VpnRepository (device-side key generation)
data/secure/   EncryptedSharedPreferences token + tunnel-key storage
domain/        Pure Kotlin state machine + models (unit-testable)
sync/          SSE control stream (revocation → instant disconnect)
di/            Manual DI container (see ServiceLocator.kt for rationale)
```

**Security model**: WireGuard private keys are generated on-device
(`com.wireguard.crypto.KeyPair`); only the public key is uploaded. Private
keys live in EncryptedSharedPreferences and are never logged. Tokens are
refreshed with single-flight rotation (reuse-detection safe).

**Kill switch**: app-level kill switch = auto-reconnect with backoff +
explicit "traffic NOT protected" notification. For OS-level enforcement use
Android Settings → VPN → Always-on + Block connections without VPN
(system lockdown).
