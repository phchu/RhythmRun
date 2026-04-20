import { describe, it, expect } from 'vitest';
import { isNativePlatform } from './LocationService';

describe('LocationService', () => {
  it('detects platform correctly', () => {
    // In vitest jsdom, window.Capacitor is typically undefined unless mocked
    expect(isNativePlatform()).toBe(false);
  });
});
