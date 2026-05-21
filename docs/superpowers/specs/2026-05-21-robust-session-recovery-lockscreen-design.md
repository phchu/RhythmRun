# System Design Specification: RhythmRun Robust Session Recovery & Native LockScreen Suite

## 1. Overview
This specification details the architecture and implementation plan for a triple-pillar stability and lock screen enhancement suite in RhythmRun. The goal is to provide a seamless, robust, and highly polished running companion experience across Android and iOS platforms.

The suite comprises three main pillars:
1. **Android Native Lock Screen & Foreground Service subclassing**: Automatically presenting a custom running HUD activity overlay when the device screen turns off/on during a run.
2. **iOS Live Activities Premium Theme**: Polishing the Nike-style neon green high-contrast layout with monospaced digit formatting.
3. **Robust Session Recovery & Automated Crash Telemetry**: High-frequency localStorage state buffering, a frosted-glass interactive recovery UI overlay on app restart, and automatic Firebase crash report syncing.

---

## 2. Technical Architecture & Component Details

### 2.1 Android Native Lock Screen Subclassing (`RhythmRunForegroundService`)
To intercept hardware power button clicks (screen turning on/off) even when the primary Capacitor React WebView is paused or sleeping by the OS memory manager, we will extend the third-party `CapacitorForegroundService` natively:

- **Service Extension**: Create a new class `RhythmRunForegroundService.java` that extends `CapacitorForegroundService`.
- **Dynamic BroadcastReceiver**: Register a dynamic receiver in the service's `onCreate()` lifecycle listening for:
  - `Intent.ACTION_SCREEN_OFF`
  - `Intent.ACTION_SCREEN_ON`
- **Auto-Launch Overlay**: When triggered, launch `LockScreenActivity` with system-level flags:
  - `Intent.FLAG_ACTIVITY_NEW_TASK`
  - `Intent.FLAG_ACTIVITY_SINGLE_INSTANCE`
  - `Intent.FLAG_ACTIVITY_REORDER_TO_FRONT`
- **AndroidManifest.xml Configuration**: Update the manifest to use `.RhythmRunForegroundService` as the registered class, overriding the default plugin class seamlessly while preserving original Capacitor core bridge functionality.

### 2.2 iOS Live Activities Premium Visual Layout
- **Style Specification**: A striking dark gray layout (`#1C1C1E`) with vibrant neon green details (`#30D158`) and monospaced bold stats.
- **Monospacing**: Use CSS/Swift monospaced digit formatting for distance (`{{distance}}` KM) and duration (`{{duration}}`) to guarantee layout stability (no text stuttering or bouncing labels) as the seconds tick by.
- **Dynamic Island Integration**: Optimize compact and expanded layouts in `LiveActivitiesBundle.swift` to align with the wellness high-contrast specification.

### 2.3 Session Recovery & Automated Crash Telemetry
- **State Buffer Frequency**: Persist splits, coordinates, elapsed duration, pace, and active goal structures to local storage inside `RunContext.jsx` on every location change or duration tick (1s frequency).
- **Frosted-Glass Recovery Overlay**: Implement a custom fullscreen `RecoveryOverlay.jsx` with backdrop blur, glowing neon-orange indicator rings, and 3 clear control buttons:
  - **繼續紀錄 (Resume)**: Restores paused run state refs seamlessly so runners continue their workout from where they left off.
  - **直接儲存 (Save)**: Packages current stats and pushes a partial workout record directly to Firebase Firestore, clearing the buffer.
  - **放棄紀錄 (Discard)**: Destructive action showing an alert window confirming deletion of current buffered progress.
- **Automated Telemetry Sync**: Add event interceptors inside `CrashLogger.js` for global `error` and `unhandledrejection` events. On subsequent app launch, check if the local error buffer contains un-synced logs. If so, push them to Firestore under `users/{uid}/crashes/{crashId}` asynchronously and clear the queue.

---

## 3. Data Models

### 3.1 Firestore Crash Log Collection
```json
// users/{uid}/crashes/{crashId}
{
  "timestamp": "2026-05-21T11:53:00Z",
  "appVersion": "2.2.0",
  "platform": "android | ios",
  "type": "UNCAUGHT_ERROR | UNHANDLED_PROMISE | CONSOLE_ERROR",
  "error": {
    "message": "ReferenceError: foo is not defined",
    "filename": "http://localhost/assets/index.js",
    "lineno": 120,
    "colno": 35,
    "stack": "ReferenceError: foo is not defined\n  at click (index.js:120:35)"
  }
}
```

---

## 4. Verification Plan

### 4.1 Automated Tests
- **Recovery & Refs Calibration**: Run existing unit tests and add assertions to verify that restoring a session in `RunContext.jsx` sets all Ref timers correctly (e.g., `startTimeRef`, `pausedDurationRef`) to prevent elapsed duration skips.
- **Crash Queue Fixture Tests**: Verify `CrashLogger.js` processes logs correctly, keeps only the last 50 entries, and exports formatted diagnostic strings accurately.

### 4.2 Manual Verification Steps
1. **Android Screen-Off Trigger**: Start a mock run, press the power button to lock the screen, and wake it back up. Verify the native `LockScreenActivity` overlay displays instantly over the lock screen.
2. **iOS Live Activity Design**: Deploy to simulated iOS device, activate tracking, lock screen, and inspect the high-contrast Dynamic Island and lock screen metrics card.
3. **Simulated Crash Recovery**: Start a run, manually call `window.dispatchEvent(new Event('error'))` or force-close the app process via Xcode/Android Studio. Re-launch the app, verify the frosted-glass `RecoveryOverlay` presents itself, click "繼續紀錄", and confirm that the duration timer resumes accurately.
4. **Crash Firestore Sync**: Verify that intercepted crashes are successfully written to the Cloud Firestore database on the next app startup.
