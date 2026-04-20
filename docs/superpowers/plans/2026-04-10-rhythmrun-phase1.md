# RhythmRun Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the Vite+React scaffolding, set up Tailwind CSS + ui-ux-pro-max guidelines, integrate Capacitor, configure Firebase, and establish the main Map/Run tracking UI layout with TDD.

**Architecture:** App wrapper uses standard React Vite SPA structure integrated with Capacitor. Tests use Vitest + React Testing Library.

**Tech Stack:** React, Vite, TailwindCSS, Capacitor, Firebase, Leaflet, Vitest.

---

## User Review Required

> [!NOTE]
> 這是基於我們先前同意的系統架構，為專案的「第一階段（基礎搭建與基本畫面 UI）」所撰寫的開發實作計畫清單。請檢閱這些步驟！

## Proposed Changes

### Task 1: Scaffolding & Configuration
**Files:**
- [NEW] `package.json`
- [NEW] `vite.config.js`
- [NEW] `vitest.config.js`
- [NEW] `tailwind.config.js`
- [NEW] `postcss.config.js`
- [NEW] `index.html`

- [ ] **Step 1: Write foundational files**
  - Execute `npm init -y` and install dependencies: `react`, `react-dom`, `firebase`, `tailwindcss`, `@capacitor/core`, etc.
  - Setup Vitest test environment.
- [ ] **Step 2: Initialize Tailwind & UI UX Pro Max theme**
  - Inject the basic color themes specified for Wellness/Running applications via the `tailwind.config.js`.

### Task 2: Firebase Connection Module
**Files:**
- [NEW] `src/lib/firebase.js`
- [NEW] `src/lib/firebase.test.js`

- [ ] **Step 1: Write the failing test**
  - Test that `db` and `auth` objects are correctly exported and initialized.
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Write minimal implementation**
  - Configure the Firebase SDK using environment variables.
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

### Task 3: Main Dashboard Component (Map Placeholder)
**Files:**
- [NEW] `src/components/Dashboard.jsx`
- [NEW] `src/components/Dashboard.test.jsx`

- [ ] **Step 1: Write the failing test**
  - Test that the dashboard renders a "Start Run" button and a placeholder for the Map.
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Write minimal implementation**
  - Create the layout using Tailwind.
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

### Task 4: Capacitor iOS Integration
**Files:**
- [NEW] `capacitor.config.json`

- [ ] **Step 1: Initialize Capacitor**
  - Run `npx cap init RhythmRun com.phchu.rhythmrun --web-dir dist`
  - Add iOS platform: `npx cap add ios`
- [ ] **Step 2: Commit**

## Verification Plan

### Automated Tests
- `npm run test` (Vitest) should pass for components and utilities.

### Manual Verification
- Execute `npm run dev` and ensure the website loads properly in the browser with the correct UI layout.
