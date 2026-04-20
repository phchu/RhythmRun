# RhythmRun: Running Tracker & Metronome - System Design

## 1. Overview
RhythmRun is a personal running tracking application designed to help users maintain a consistent pace and cadence through a background metronome and voice prompts, while accurately tracking GPS routes, pace, and time. 

## 2. Technical Architecture
**Platform & Framework:**
- Frontend: React + Vite (Web SPA)
- Styling: Tailwind CSS + ui-ux-pro-max guidelines (Soft UI Evolution / Professional style)
- Wrapper: Capacitor (for Native iOS deployment, to bypass Safari PWA background execution limits)

**Backend & Data Services:**
- Database: Firebase Cloud Firestore (NoSQL, offline-first syncing capabilities)
- Identification: Firebase Authentication (Anonymous or Google Sign-In)
- Quality & Metrics: Firebase Crashlytics & Performance monitoring.

## 3. Core Features

### 3.1 Run Tracking & Geolocation
- Utilizes `@capacitor-community/background-geolocation` to maintain tracking while the screen is locked or the app is in the background.
- Captures Lat, Lng, Accuracy, Speed, and Timestamp.
- Controls: Start, Pause, Resume, Stop.

### 3.2 Cadence Metronome & Voice Coach
- Metronome: Audio beep generation based on user-defined BPM (e.g., 160-180).
- Voice Coach: Web Speech API / Capacitor TTS for periodic updates (e.g., announcing time, pace, and distance at every 1km milestone).
- Runs in the background via native audio boundaries provided by Capacitor.

### 3.3 Health Data Integration
- Apple Health (HealthKit) integration via Capacitor plugins.
- **Read:** Fetch latest body weight to accurately estimate calorie burn calculation.
- **Write:** Upon run completion, write workout data (distance, active energy burned, time) directly into the Health App.

### 3.4 Data Storage & State
- **Offline-First:** All active run data points and historical data use Firestore. Firestore's local cache ensures the app works flawlessly with no internet connection during a run, syncing transparently when the connection returns.
- **Data Model:**
  - `users/{uid}`: Profile and settings (weight preference, BPM config).
  - `users/{uid}/runs/{runId}`: Document containing summary (date, total distance, total time, avg pace, avg cadence, calories).
  - `users/{uid}/runs/{runId}/trackPoints/{pointId}`: Sub-collection for raw GPS and split data points.

### 3.5 Statistics & History UI
- **History List:** Paginated list of past runs with essential summaries. Allows editing/deleting.
- **Detail View:**
  - Leaflet + OpenStreetMap rendering the run path.
  - Splits table (Pace per kilometer).
- **Dashboard:**
  - 30-day pace trend (Line Chart).
  - Monthly running distance/volume (Bar Chart).

## 4. Error Handling & Edge Cases
- **GPS Signal Loss:** UI will show a GPS status indicator. On signal loss, the app will log the gap and draw a straight line or pause the active interval calculation to avoid pace skewing.
- **App Termination:** Current run state will be persisted in real-time to SQLite/IndexedDB via Firestore so an accidental force-close can be resumed on next open.
- **Permissions:** Granular handling for "Always Allow" location permissions, Motion & Fitness tracking, and HealthKit permissions.

## 5. Implementation Phases
1. **Phase 1: Project Scaffolding & Capacitor / Firebase Setup** (Configuring Vite, Capacitor, and Firebase).
2. **Phase 2: Core Tracking UI & Geolocation Logic** (Displaying maps and recording points securely).
3. **Phase 3: The Metronome & Background Hooks** (Audio, TTS, testing on locked physical device).
4. **Phase 4: History, Charts, & Data Management** (Leaflet tracks, Recharts for trends).
5. **Phase 5: HealthKit & Polish** (Metrics mapping and Crashlytics).
