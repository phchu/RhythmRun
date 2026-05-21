/**
 * CrashLogger - In-app crash & error logger for remote debugging
 * No external services required. Logs to localStorage and displays in /debug screen.
 * 
 * Usage:
 *   import { CrashLogger } from './services/CrashLogger';
 *   CrashLogger.init();  // call once at app start
 *   CrashLogger.log('tag', 'message');  // manual breadcrumb
 */

import { collection, addDoc } from 'firebase/firestore';
import { initFirebase } from '../lib/firebase.js';

const MAX_LOGS = 50;
const STORAGE_KEY = 'rhythmrun_crash_logs';

export const CrashLogger = {
  /**
   * Initialize global error handlers
   * Call once in main.jsx or App.jsx
   */
  init() {
    // Catch unhandled JS errors
    window.addEventListener('error', (event) => {
      this.record('UNCAUGHT_ERROR', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack || '(no stack)',
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.record('UNHANDLED_PROMISE', {
        message: String(event.reason),
        stack: event.reason?.stack || '(no stack)',
      });
    });

    // Override console.error to capture plugin/capacitor errors
    const originalConsoleError = console.error.bind(console);
    console.error = (...args) => {
      originalConsoleError(...args);
      const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      // Only log errors that look interesting (avoid noisy React/dev warnings)
      if (msg.includes('Error') || msg.includes('error') || msg.includes('fail') || msg.includes('crash')) {
        this.record('CONSOLE_ERROR', { message: msg });
      }
    };

    this.log('CrashLogger', 'Initialized at ' + new Date().toISOString());
  },

  /**
   * Add a manual breadcrumb log
   */
  log(tag, message) {
    this.record('LOG', { tag, message });
  },

  /**
   * Record an event to localStorage
   */
  record(type, data) {
    try {
      const logs = this.getLogs();
      logs.push({
        id: Date.now(),
        type,
        ts: new Date().toISOString(),
        data,
      });
      // Keep only last MAX_LOGS entries
      if (logs.length > MAX_LOGS) logs.splice(0, logs.length - MAX_LOGS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
      // localStorage might be full or unavailable — fail silently
    }
  },

  /**
   * Get all stored logs
   */
  getLogs() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  },

  /**
   * Clear all logs
   */
  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },

  /**
   * Export logs as a formatted string for sharing
   */
  export() {
    const logs = this.getLogs();
    return logs.map(l => `[${l.ts}] ${l.type}: ${JSON.stringify(l.data)}`).join('\n');
  },

  /**
   * Sync unsynced crashes to Firestore
   * @param {string} uid User ID
   */
  async syncCrashes(uid) {
    if (!uid) return;
    try {
      const logs = this.getLogs();
      const unsyncedLogs = logs.filter(log => 
        (log.type === 'UNCAUGHT_ERROR' || log.type === 'UNHANDLED_PROMISE' || log.type === 'CONSOLE_ERROR') && 
        !log.synced
      );

      if (unsyncedLogs.length === 0) return;

      const { db } = await initFirebase();
      if (!db) {
        console.warn('[CrashLogger] Firestore not initialized, skipping sync.');
        return;
      }

      const collectionRef = collection(db, 'users', uid, 'crashes');

      for (const log of unsyncedLogs) {
        try {
          await addDoc(collectionRef, {
            id: log.id,
            type: log.type,
            ts: log.ts,
            data: log.data,
            syncedAt: new Date().toISOString()
          });
          log.synced = true;
        } catch (e) {
          console.error('[CrashLogger] Failed to upload crash log:', e);
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch (err) {
      console.error('[CrashLogger] syncCrashes failed:', err);
    }
  }
};
