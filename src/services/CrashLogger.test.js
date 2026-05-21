import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrashLogger } from './CrashLogger';
import { addDoc } from 'firebase/firestore';

// Mock firebase/firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({ id: 'mock-collection' })),
  addDoc: vi.fn(() => Promise.resolve({ id: 'mock-doc-id' }))
}));

// Mock initFirebase
vi.mock('../lib/firebase.js', () => ({
  initFirebase: vi.fn(() => Promise.resolve({ db: { app: { options: {} } } }))
}));

describe('CrashLogger Service', () => {
  beforeEach(() => {
    localStorage.clear();
    CrashLogger.clear();
  });

  it('should record normal logs and retrieve them', () => {
    CrashLogger.log('Auth', 'Login initiated');
    const logs = CrashLogger.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].type).toBe('LOG');
    expect(logs[0].data.tag).toBe('Auth');
    expect(logs[0].data.message).toBe('Login initiated');
  });

  it('should record uncaught errors and promise rejections', () => {
    CrashLogger.record('UNCAUGHT_ERROR', { message: 'ReferenceError: x is not defined' });
    const logs = CrashLogger.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].type).toBe('UNCAUGHT_ERROR');
    expect(logs[0].data.message).toBe('ReferenceError: x is not defined');
  });

  it('should correctly format logs on export', () => {
    CrashLogger.log('Test', 'Formatted message');
    const logsString = CrashLogger.export();
    expect(logsString).toContain('LOG: {"tag":"Test","message":"Formatted message"}');
  });

  it('should sync unsynced crash logs to Firestore and update local sync status', async () => {
    // Record one normal log (should NOT sync) and one crash log (should sync)
    CrashLogger.log('Auth', 'Normal login flow');
    CrashLogger.record('UNCAUGHT_ERROR', { message: 'NullPointerException' });

    const logsBeforeSync = CrashLogger.getLogs();
    expect(logsBeforeSync.length).toBe(2);
    expect(logsBeforeSync[0].synced).toBeUndefined();
    expect(logsBeforeSync[1].synced).toBeUndefined();

    // Reset the addDoc mock call history
    vi.mocked(addDoc).mockClear();

    // Run sync
    await CrashLogger.syncCrashes('user123');

    // addDoc should have been called exactly once (for the UNCAUGHT_ERROR)
    expect(addDoc).toHaveBeenCalledTimes(1);

    // Retrieve updated logs and verify the crash log is marked as synced
    const logsAfterSync = CrashLogger.getLogs();
    expect(logsAfterSync.length).toBe(2);
    expect(logsAfterSync[0].synced).toBeUndefined(); // Normal log was not synced
    expect(logsAfterSync[1].synced).toBe(true);      // Crash log is synced
  });
});
