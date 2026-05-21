# RhythmRun Robust Session Recovery & Native LockScreen Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Android native lock screen service subclassing, polish the iOS Live Activity monospaced layout, calibrate the session recovery Ref timings, and implement Firestore-backed crash telemetry.

**Architecture:** A native subclass of CapacitorForegroundService overrides system-level screen power broadcast event handling on Android to display stats programmatically above keyguard. React web context buffers location tracking splits to local storage, calibrated on recovery to guarantee precise duration ticking. Crash telemetry queues unhandled exceptions locally and publishes them to Firestore on subsequent startup when identity is resolved.

**Tech Stack:** React, Capacitor, Android (Java), iOS (Swift), Firebase Firestore, Vitest.

---

## Proposed Changes

### Task 1: Android Native Foreground Service & Lock Screen Overlay
**Files:**
- Create: `android/app/src/main/java/com/phchu/rhythmrun/RhythmRunForegroundService.java`
- Modify: `android/app/src/main/AndroidManifest.xml`

- [ ] **Step 1: Create RhythmRunForegroundService Java Class**
  Write the custom foreground service subclassing `CapacitorForegroundService` to dynamically register the screen state broadcast receiver and trigger `LockScreenActivity` on screen off or screen on.

  Create `android/app/src/main/java/com/phchu/rhythmrun/RhythmRunForegroundService.java`:
  ```java
  package com.phchu.rhythmrun;

  import android.content.BroadcastReceiver;
  import android.content.Context;
  import android.content.Intent;
  import android.content.IntentFilter;
  import android.os.Build;
  import android.util.Log;
  import me.paschalis.capfgservice.CapacitorForegroundService;

  public class RhythmRunForegroundService extends CapacitorForegroundService {
      private static final String TAG = "RhythmRunFGService";
      
      private String currentDistance = "0.00";
      private String currentDuration = "00:00";
      private String currentPace = "--:--";

      private final BroadcastReceiver screenReceiver = new BroadcastReceiver() {
          @Override
          public void onReceive(Context context, Intent intent) {
              String action = intent.getAction();
              Log.d(TAG, "Broadcast received: " + action);
              if (Intent.ACTION_SCREEN_OFF.equals(action) || Intent.ACTION_SCREEN_ON.equals(action)) {
                  // Launch LockScreenActivity
                  Intent lockIntent = new Intent(context, LockScreenActivity.class);
                  lockIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK |
                          Intent.FLAG_ACTIVITY_SINGLE_INSTANCE |
                          Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
                  context.startActivity(lockIntent);
                  
                  // Immediately broadcast current stats to the newly launched activity
                  sendStatsBroadcast(context);
              }
          }
      };

      @Override
      public void onCreate() {
          super.onCreate();
          Log.d(TAG, "RhythmRunForegroundService created");
          
          // Register receiver for screen state changes
          IntentFilter filter = new IntentFilter();
          filter.addAction(Intent.ACTION_SCREEN_OFF);
          filter.addAction(Intent.ACTION_SCREEN_ON);
          registerReceiver(screenReceiver, filter);
      }

      @Override
      public int onStartCommand(Intent intent, int flags, int startId) {
          if (intent != null) {
              String distance = intent.getStringExtra("distance");
              String duration = intent.getStringExtra("duration");
              String pace = intent.getStringExtra("pace");
              
              if (distance != null) currentDistance = distance;
              if (duration != null) currentDuration = duration;
              if (pace != null) currentPace = pace;
              
              Log.d(TAG, "Stats updated in service: " + currentDistance + ", " + currentDuration + ", " + currentPace);
              
              // Broadcast new stats to LockScreenActivity if it's active
              sendStatsBroadcast(this);
          }
          return super.onStartCommand(intent, flags, startId);
      }

      @Override
      public void onDestroy() {
          Log.d(TAG, "RhythmRunForegroundService destroyed");
          try {
              unregisterReceiver(screenReceiver);
          } catch (Exception e) {
              // Ignore
          }
          super.onDestroy();
      }

      private void sendStatsBroadcast(Context context) {
          Intent updateIntent = new Intent(LockScreenActivity.ACTION_UPDATE_STATS);
          updateIntent.putExtra("distance", currentDistance);
          updateIntent.putExtra("duration", currentDuration);
          updateIntent.putExtra("pace", currentPace);
          
          // Since we registered LockScreenActivity receiver as non-exported,
          // we specify our application ID or set package to avoid security restrictions.
          updateIntent.setPackage(context.getPackageName());
          context.sendBroadcast(updateIntent);
      }
  }
  ```

- [ ] **Step 2: Update AndroidManifest.xml**
  Modify `<service>` inside `android/app/src/main/AndroidManifest.xml` to use the subclassed `RhythmRunForegroundService` and include a `tools:replace` attribute for replacing `android:name`.

  Replace `AndroidManifest.xml:46-51`:
  ```xml
          <service
              android:name="com.phchu.rhythmrun.RhythmRunForegroundService"
              android:enabled="true"
              android:exported="false"
              android:foregroundServiceType="dataSync"
              tools:replace="android:name,android:exported,android:foregroundServiceType" />
  ```

- [ ] **Step 3: Commit native changes**
  ```bash
  git add android/app/src/main/java/com/phchu/rhythmrun/RhythmRunForegroundService.java android/app/src/main/AndroidManifest.xml
  git commit -m "feat(android): subclass CapacitorForegroundService to support dynamic screen-off lock screen trigger"
  ```


### Task 2: iOS Live Activities Layout Monospace Polishing
**Files:**
- Modify: `src/services/LockScreenService.js`

- [ ] **Step 1: Set Monospaced Metric Attributes in Layout**
  Update the React Native / iOS Live Activity layout definition inside `LockScreenService.js` to ensure the numeric digits (distance, pace, duration) use `monospacedDigit: true` for both main Lock Screen widget and Dynamic Island states.

  Modify `src/services/LockScreenService.js:120-131` (distance block):
  ```javascript
                    children: [
                      {
                        type: 'text',
                        properties: [
                          { text: '{{distance}}' },
                          { fontSize: 32 },
                          { fontWeight: 'black' },
                          { color: '#FFFFFF' },
                          { monospacedDigit: true }
                        ]
                      },
  ```

  Modify `src/services/LockScreenService.js:151-160` (pace block):
  ```javascript
                    children: [
                      {
                        type: 'text',
                        properties: [
                          { text: '{{pace}}' },
                          { fontSize: 24 },
                          { fontWeight: 'bold' },
                          { color: '#FFFFFF' },
                          { monospacedDigit: true }
                        ]
                      },
  ```

  Modify `src/services/LockScreenService.js:200-207` (dynamic island distance):
  ```javascript
              trailing: {
                type: 'text',
                properties: [
                  { text: '{{distance}} 公里' },
                  { fontSize: 15 },
                  { fontWeight: 'bold' },
                  { color: '#FFFFFF' },
                  { monospacedDigit: true }
                ]
              },
  ```

  Modify `src/services/LockScreenService.js:208-216` (dynamic island duration):
  ```javascript
              center: {
                type: 'text',
                properties: [
                  { text: '{{duration}}' },
                  { fontSize: 16 },
                  { fontWeight: 'bold' },
                  { color: '#30D158' },
                  { monospacedDigit: true }
                ]
              },
  ```

  Modify `src/services/LockScreenService.js:245-252` (dynamic island compact distance):
  ```javascript
            compactTrailing: {
              type: 'text',
              properties: [
                { text: '{{distance}}' },
                { fontSize: 12 },
                { fontWeight: 'bold' },
                { color: '#30D158' },
                { monospacedDigit: true }
              ]
            },
  ```

- [ ] **Step 2: Commit iOS widget layout update**
  ```bash
  git add src/services/LockScreenService.js
  git commit -m "feat(ios): apply monospaced digit typography to Live Activity and Dynamic Island layouts"
  ```


### Task 3: Local Session Recovery Timings Calibration
**Files:**
- Modify: `src/context/RunContext.jsx`
- Create: `src/context/RunContext.test.jsx`

- [ ] **Step 1: Implement robust timers calibration in RunContext.jsx**
  Verify and update the `restoreRun` callback logic in `src/context/RunContext.jsx` to correctly offset the `pausedDurationRef.current` according to recovered seconds so that when the session resumes, the timer computes elapsed seconds precisely without jumps.

  Verify `src/context/RunContext.jsx:124-140`:
  ```javascript
    const restoreRun = useCallback((data) => {
      setStatus('paused');
      setDistance(data.distance || 0);
      setDuration(data.duration || 0);
      setCoordinates(data.coordinates || []);
      setSplits(data.splits || []);
      setCurrentPace(data.currentPace || null);
      setGoal(data.goal || { type: 'none', value: 0, autoEnd: false });
      
      // Setup refs so that resumeRun works flawlessly
      startTimeRef.current = Date.now();
      pausedDurationRef.current = -(data.duration * 1000);
      pauseStartRef.current = Date.now();
      lastKmRef.current = data.lastKm || Math.floor(data.distance || 0);
      
      setRecoveredSession(null);
    }, []);
  ```

- [ ] **Step 2: Create unit tests for Session Recovery & Timer Calibration**
  Write tests in `src/context/RunContext.test.jsx` that mock `localStorage` data, render the `RunProvider`, trigger recovery via `restoreRun`, wait for standard intervals, and assert that the duration timer counts forward flawlessly.

  Create `src/context/RunContext.test.jsx`:
  ```jsx
  import React from 'react';
  import { renderHook, act } from '@testing-library/react';
  import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
  import { RunProvider, useRun } from './RunContext';

  describe('RunContext - Session Recovery Calibration', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      localStorage.clear();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should restore paused session state and resume tracking precisely', () => {
      const wrapper = ({ children }) => <RunProvider>{children}</RunProvider>;
      const { result } = renderHook(() => useRun(), { wrapper });

      const mockSession = {
        distance: 2.5,
        duration: 600, // 10 minutes
        coordinates: [{ latitude: 25.03, longitude: 121.56, time: Date.now() }],
        splits: [{ km: 1, pace: 240, time: 240 }, { km: 2, pace: 250, time: 490 }],
        currentPace: 240,
        goal: { type: 'none', value: 0, autoEnd: false },
        lastKm: 2
      };

      act(() => {
        result.current.restoreRun(mockSession);
      });

      expect(result.current.status).toBe('paused');
      expect(result.current.distance).toBe(2.5);
      expect(result.current.duration).toBe(600);

      // Trigger resume
      act(() => {
        result.current.resumeRun();
      });

      expect(result.current.status).toBe('running');

      // Fast-forward 3 seconds
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.duration).toBe(603);
    });
  });
  ```

- [ ] **Step 3: Run the unit test to verify correctness**
  Run: `npx vitest run src/context/RunContext.test.jsx`
  Expected: PASS

- [ ] **Step 4: Commit recovery updates**
  ```bash
  git add src/context/RunContext.jsx src/context/RunContext.test.jsx
  git commit -m "test(recovery): add unit test for RunContext session recovery timing calibration"
  ```


### Task 4: Automated Firestore Crash Telemetry Sync
**Files:**
- Modify: `src/services/CrashLogger.js`
- Modify: `src/context/AuthContext.jsx`
- Create: `src/services/CrashLogger.test.js`

- [ ] **Step 1: Implement Firestore syncing in CrashLogger.js**
  Update `CrashLogger.js` to add a `syncCrashes(uid)` method. This method loads the local logs queue, filters out unsynced uncaught exception entries, dynamically imports the Firestore dependencies, uploads each crash event to the `users/{uid}/crashes` collection, and marks the logs as `synced: true` locally to prevent duplicate uploads.

  Modify `src/services/CrashLogger.js` to add `syncCrashes` and update handlers:
  ```javascript
  // Target: add syncCrashes to CrashLogger object in src/services/CrashLogger.js
  ```
  Let's replace the whole exported object in `src/services/CrashLogger.js` to include `syncCrashes` and proper syncing filters:
  ```javascript
  const MAX_LOGS = 50;
  const STORAGE_KEY = 'rhythmrun_crash_logs';

  export const CrashLogger = {
    init() {
      window.addEventListener('error', (event) => {
        this.record('UNCAUGHT_ERROR', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack || '(no stack)',
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.record('UNHANDLED_PROMISE', {
          message: String(event.reason),
          stack: event.reason?.stack || '(no stack)',
        });
      });

      const originalConsoleError = console.error.bind(console);
      console.error = (...args) => {
        originalConsoleError(...args);
        const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        if (msg.includes('Error') || msg.includes('error') || msg.includes('fail') || msg.includes('crash')) {
          this.record('CONSOLE_ERROR', { message: msg });
        }
      };

      this.log('CrashLogger', 'Initialized at ' + new Date().toISOString());
    },

    log(tag, message) {
      this.record('LOG', { tag, message });
    },

    record(type, data) {
      try {
        const logs = this.getLogs();
        logs.push({
          id: Date.now() + Math.random(),
          type,
          ts: new Date().toISOString(),
          data,
          synced: false
        });
        if (logs.length > MAX_LOGS) logs.splice(0, logs.length - MAX_LOGS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
      } catch (e) {
        // fail silently
      }
    },

    getLogs() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      } catch {
        return [];
      }
    },

    clear() {
      localStorage.removeItem(STORAGE_KEY);
    },

    export() {
      const logs = this.getLogs();
      return logs.map(l => `[${l.ts}] ${l.type}: ${JSON.stringify(l.data)}`).join('\n');
    },

    async syncCrashes(uid) {
      try {
        const logs = this.getLogs();
        const crashLogs = logs.filter(l => 
          ['UNCAUGHT_ERROR', 'UNHANDLED_PROMISE', 'CONSOLE_ERROR'].includes(l.type) && !l.synced
        );
        if (crashLogs.length === 0) return;

        const { initFirebase } = await import('../lib/firebase');
        const { db } = await initFirebase();
        if (!db) return;

        const { collection, addDoc } = await import('firebase/firestore');
        const ref = collection(db, `users/${uid}/crashes`);

        for (const log of crashLogs) {
          try {
            await addDoc(ref, {
              timestamp: log.ts,
              appVersion: '1.0.0',
              platform: window.Capacitor?.getPlatform() || 'web',
              type: log.type,
              error: log.data
            });
            log.synced = true;
          } catch (uploadErr) {
            console.error('Failed to upload crash log:', uploadErr);
          }
        }

        // Save updated logs back to localStorage with synced: true
        const updatedLogs = logs.map(originalLog => {
          const matchingCrash = crashLogs.find(c => c.id === originalLog.id);
          return matchingCrash ? { ...originalLog, synced: true } : originalLog;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
      } catch (err) {
        console.error('Crash sync processing failed:', err);
      }
    }
  };
  ```

- [ ] **Step 2: Trigger Sync on Identity Resolution in AuthContext.jsx**
  Import `CrashLogger` and call `CrashLogger.syncCrashes` inside `onAuthStateChanged` and `signInAnonymously` success blocks in `AuthContext.jsx`.

  Modify `src/context/AuthContext.jsx:40`:
  ```javascript
              setUser(currentUser);
              // Trigger asynchronous crash synchronization on user login
              import('../services/CrashLogger.js').then(({ CrashLogger }) => {
                CrashLogger.syncCrashes(currentUser.uid);
              });
  ```

  Modify `src/context/AuthContext.jsx:47-48`:
  ```javascript
                  addLog(`Anonymous Sign-in: SUCCESS (${result.user.uid})`);
                  setUser(result.user);
                  // Trigger asynchronous crash synchronization on anonymous session setup
                  import('../services/CrashLogger.js').then(({ CrashLogger }) => {
                    CrashLogger.syncCrashes(result.user.uid);
                  });
  ```

- [ ] **Step 3: Add Unit Tests for CrashLogger Telemetry Queue**
  Create `src/services/CrashLogger.test.js` to assert that uncaught errors are successfully recorded into local storage with `synced: false` flags.

  Create `src/services/CrashLogger.test.js`:
  ```javascript
  import { describe, it, expect, beforeEach, vi } from 'vitest';
  import { CrashLogger } from './CrashLogger';

  describe('CrashLogger - Telemetry Queue', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should queue unhandled promise rejections with synced: false', () => {
      CrashLogger.record('UNHANDLED_PROMISE', { message: 'Promise rejection mock error' });
      
      const logs = CrashLogger.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].type).toBe('UNHANDLED_PROMISE');
      expect(logs[0].data.message).toBe('Promise rejection mock error');
      expect(logs[0].synced).toBe(false);
    });

    it('should queue console.error entries with synced: false', () => {
      CrashLogger.record('CONSOLE_ERROR', { message: 'Network failed' });
      
      const logs = CrashLogger.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].type).toBe('CONSOLE_ERROR');
      expect(logs[0].data.message).toBe('Network failed');
      expect(logs[0].synced).toBe(false);
    });
  });
  ```

- [ ] **Step 4: Run the unit test to verify correctness**
  Run: `npx vitest run src/services/CrashLogger.test.js`
  Expected: PASS

- [ ] **Step 5: Commit telemetry sync updates**
  ```bash
  git add src/services/CrashLogger.js src/services/CrashLogger.test.js src/context/AuthContext.jsx
  git commit -m "feat(telemetry): add automated firestore crash sync and telemetry unit tests"
  ```

---

## Verification Plan

### Automated Tests
- Run: `npm run test` or `npx vitest run`
- Expected: All unit tests (including the new calibration and telemetry tests) must compile and pass cleanly.

### Manual Verification
1. **Android Power Button Locks Overlay**: Start a mock run, switch devices/emulator screen on and off, verify that `RhythmRunForegroundService` triggers `LockScreenActivity` layout and registers parameters dynamically.
2. **Crash Telemetry Sync**: Trigger an exception via console or mock throw, reboot the app, and assert that a new record is added under `users/{uid}/crashes` in Firestore.
