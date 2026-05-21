import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { CrashLogger } from './CrashLogger.js';

/**
 * LockScreenService
 * Handles real-time run data sync to Lock Screen for iOS (Live Activities) 
 * and Android (Foreground Service).
 */
export const LockScreenService = {
  activeActivityId: null,
  // Track Android foreground service state to avoid redundant start calls
  _androidServiceStarted: false,

  /**
   * Request necessary permissions for lock screen notifications
   */
  async requestPermissions() {
    CrashLogger.log('LockScreenService', 'requestPermissions called, platform=' + Capacitor.getPlatform());
    if (Capacitor.getPlatform() === 'android') {
      try {
        const perm = await LocalNotifications.requestPermissions();
        CrashLogger.log('LockScreenService', 'notification permission=' + perm.display);
        return perm.display === 'granted';
      } catch (err) {
        console.error('Notification permission request failed:', err);
        return false;
      }
    }
    return true;
  },

  /**
   * Start the lock screen session
   * @param {Object} stats { distance, duration, pace, progress, isPaused }
   */
  async start(stats) {
    const platform = Capacitor.getPlatform();
    CrashLogger.log('LockScreenService', 'start() called, platform=' + platform);

    if (platform === 'ios') {
      try {
        const { LiveActivities } = await import('capacitor-live-activities');
        
        // Define beautiful, premium Nike-style progress card layout
        const layout = {
          type: 'container',
          properties: [
            { direction: 'vertical' },
            { spacing: 10 },
            { padding: 12 },
            { backgroundColor: '#1C1C1E' }, // Sleek dark gray
            { cornerRadius: 16 }
          ],
          children: [
            // Header Row (HStack)
            {
              type: 'container',
              properties: [
                { direction: 'horizontal' },
                { insideAlignment: 'center' }
              ],
              children: [
                {
                  type: 'image',
                  properties: [
                    { systemName: 'figure.run' },
                    { color: '#30D158' }, // Vibrant neon green
                    { width: 18 },
                    { height: 18 }
                  ]
                },
                {
                  type: 'text',
                  properties: [
                    { text: '  RhythmRun' },
                    { fontSize: 13 },
                    { fontWeight: 'semibold' },
                    { color: '#8E8E93' }
                  ]
                },
                {
                  type: 'text',
                  properties: [
                    { text: '  ({{statusText}})' },
                    { fontSize: 11 },
                    { fontWeight: 'medium' },
                    { color: '#8E8E93' }
                  ]
                },
                { type: 'spacer', properties: [{ minLength: 0 }] },
                // Dynamic Duration Timer
                {
                  type: 'text',
                  properties: [
                    { text: '{{duration}}' },
                    { fontSize: 14 },
                    { fontWeight: 'bold' },
                    { color: '#30D158' },
                    { monospacedDigit: true }
                  ]
                }
              ]
            },
            // Stats Row (HStack)
            {
              type: 'container',
              properties: [
                { direction: 'horizontal' },
                { insideAlignment: 'center' }
              ],
              children: [
                // Distance container (VStack)
                {
                  type: 'container',
                  properties: [
                    { direction: 'vertical' },
                    { spacing: 2 }
                  ],
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
                    {
                      type: 'text',
                      properties: [
                        { text: '公里 (KM)' },
                        { fontSize: 11 },
                        { fontWeight: 'bold' },
                        { color: '#8E8E93' }
                      ]
                    }
                  ]
                },
                { type: 'spacer', properties: [{ minLength: 0 }] },
                // Pace container (VStack)
                {
                  type: 'container',
                  properties: [
                    { direction: 'vertical' },
                    { spacing: 2 },
                    { alignment: 'trailing' }
                  ],
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
                    {
                      type: 'text',
                      properties: [
                        { text: '當前配速' },
                        { fontSize: 11 },
                        { fontWeight: 'bold' },
                        { color: '#8E8E93' }
                      ]
                    }
                  ]
                }
              ]
            },
            // Progress Bar towards goals
            {
              type: 'progress',
              properties: [
                { value: '{{progress}}' },
                { total: 1.0 },
                { color: '#30D158' },
                { backgroundColor: '#2C2C2E' },
                { height: 6 }
              ]
            }
          ]
        };

        // Premium Dynamic Island Layout for iPhone 14 Pro / 15 / 16
        const dynamicIslandLayout = {
          expanded: {
            leading: {
              type: 'image',
              properties: [
                { systemName: 'figure.run' },
                { color: '#30D158' },
                { width: 18 },
                { height: 18 }
              ]
            },
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
            bottom: {
              type: 'container',
              properties: [
                { direction: 'vertical' },
                { spacing: 6 }
              ],
              children: [
                {
                  type: 'progress',
                  properties: [
                    { value: '{{progress}}' },
                    { total: 1.0 },
                    { color: '#30D158' },
                    { backgroundColor: '#2C2C2E' },
                    { height: 6 }
                  ]
                }
              ]
            }
          },
          compactLeading: {
            type: 'image',
            properties: [
              { systemName: 'figure.run' },
              { color: '#30D158' }
            ]
          },
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
          minimal: {
            type: 'image',
            properties: [
              { systemName: 'figure.run' },
              { color: '#30D158' }
            ]
          }
        };

        const behavior = {
          backgroundTint: '#1C1C1E'
        };

        const { activityId } = await LiveActivities.startActivity({
          layout,
          dynamicIslandLayout,
          behavior,
          data: {
            distance: stats.distance.toFixed(2),
            duration: stats.duration,
            pace: stats.pace,
            progress: Number(stats.progress || 0),
            statusText: stats.isPaused ? '已暫停' : '跑步中'
          }
        });
        this.activeActivityId = activityId;
        CrashLogger.log('LockScreenService', 'iOS Live Activity started: ' + activityId);
      } catch (err) {
        console.error('Failed to start iOS Live Activity:', err);
        CrashLogger.log('LockScreenService', 'iOS Live Activity start failed: ' + err.message);
      }
    } else if (platform === 'android') {
      await this._startAndroidService(stats);
    }
  },

  /**
   * Update the live data on lock screen
   * @param {Object} stats { distance, duration, pace, progress, isPaused }
   */
  async update(stats) {
    const platform = Capacitor.getPlatform();

    if (platform === 'ios' && this.activeActivityId) {
      try {
        const { LiveActivities } = await import('capacitor-live-activities');
        await LiveActivities.updateActivity({
          activityId: this.activeActivityId,
          data: {
            distance: stats.distance.toFixed(2),
            duration: stats.duration,
            pace: stats.pace,
            progress: Number(stats.progress || 0),
            statusText: stats.isPaused ? '已暫停' : '跑步中'
          }
        });
      } catch (err) {
        console.warn('Live Activity update failed:', err);
      }
    } else if (platform === 'android') {
      if (!this._androidServiceStarted) {
        // First call: do the full start
        CrashLogger.log('LockScreenService', 'update(): service not started, calling start first');
        await this._startAndroidService(stats);
      } else {
        // Already running: just update notification content
        await this._updateAndroidNotification(stats);
      }
    }
  },

  /**
   * Internal: Start the Android foreground service (only call once)
   */
  async _startAndroidService(stats) {
    CrashLogger.log('LockScreenService', '_startAndroidService() called');
    try {
      const { CapacitorForegroundService } = await import('capacitor-foreground-service');
      CrashLogger.log('LockScreenService', 'plugin imported, calling startService...');
      await CapacitorForegroundService.startService({
        title: `🏃 RhythmRun`,
        description: `${stats.distance.toFixed(2)} km｜${stats.duration}｜配速 ${stats.pace}`,
        distance: stats.distance.toFixed(2),
        duration: stats.duration,
        pace: stats.pace,
        importance: 3,
        icon: 'ic_launcher_round'
      });
      this._androidServiceStarted = true;
      CrashLogger.log('LockScreenService', 'startService() succeeded ✅');
    } catch (err) {
      console.error('Failed to start Android Foreground Service:', err);
      CrashLogger.log('LockScreenService', 'startService() FAILED: ' + (err?.message || String(err)));
      // Don't throw - running should continue even if notification fails
    }
  },

  /**
   * Internal: Update the Android foreground notification (service already running)
   */
  async _updateAndroidNotification(stats) {
    try {
      const { CapacitorForegroundService } = await import('capacitor-foreground-service');
      await CapacitorForegroundService.startService({
        title: `🏃 RhythmRun`,
        description: `${stats.distance.toFixed(2)} km｜${stats.duration}｜配速 ${stats.pace}`,
        distance: stats.distance.toFixed(2),
        duration: stats.duration,
        pace: stats.pace,
        importance: 3,
        icon: 'ic_launcher_round'
      });
    } catch (err) {
      // Silently ignore update failures - not critical
      console.warn('Android notification update failed:', err);
    }
  },

  /**
   * Stop the lock screen session
   */
  async stop() {
    const platform = Capacitor.getPlatform();
    CrashLogger.log('LockScreenService', 'stop() called, platform=' + platform);

    if (platform === 'ios' && this.activeActivityId) {
      try {
        const { LiveActivities } = await import('capacitor-live-activities');
        await LiveActivities.endActivity({ activityId: this.activeActivityId });
        this.activeActivityId = null;
      } catch (err) {
        console.error('Failed to stop iOS Live Activity:', err);
      }
    } else if (platform === 'android' && this._androidServiceStarted) {
      try {
        const { CapacitorForegroundService } = await import('capacitor-foreground-service');
        await CapacitorForegroundService.stopService();
        this._androidServiceStarted = false;
        CrashLogger.log('LockScreenService', 'Android service stopped');
      } catch (err) {
        console.error('Failed to stop Android Foreground Service:', err);
        CrashLogger.log('LockScreenService', 'stopService() failed: ' + (err?.message || String(err)));
      }
    }
  },

  /**
   * Listen for lock screen media button clicks
   * @param {Function} callback (action) => void
   */
  onMediaButton(callback) {
    if (Capacitor.getPlatform() === 'android') {
      // 1. Listen via CustomEvent (bypasses Capacitor's background event queue)
      const windowListener = (e) => {
        if (e.detail) callback(e.detail);
      };
      window.addEventListener('nativeMediaAction', windowListener);
      
      // 2. Listen via Capacitor Plugin (works in foreground)
      const promise = import('capacitor-foreground-service').then(({ CapacitorForegroundService }) => {
        return CapacitorForegroundService.addListener('onMediaButtonClick', (data) => {
          if (data && data.action) {
            callback(data.action);
          }
        });
      }).catch(err => {
        console.warn('Failed to register media button listener:', err);
        return null;
      });
      
      return promise.then(handle => {
        return {
          remove: () => {
            window.removeEventListener('nativeMediaAction', windowListener);
            if (handle && handle.remove) handle.remove();
          }
        };
      });
    }
    return Promise.resolve(null);
  },

  /**
   * Check for any pending media actions directly from the native plugin (polling).
   * This bypasses the background event queue limitations.
   */
  async checkMediaAction() {
    if (Capacitor.getPlatform() === 'android') {
      try {
        const CapFGService = Capacitor.Plugins.CapacitorForegroundService;
        if (CapFGService && CapFGService.checkMediaAction) {
          const res = await CapFGService.checkMediaAction();
          return res.action || null;
        }
      } catch (err) {
        console.warn('Failed to poll media action:', err);
      }
    }
    return null;
  }
};
