import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RunProvider, useRun } from './RunContext';

describe('RunContext Calibration & Recovery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should restore state and calibrate timers perfectly', () => {
    const wrapper = ({ children }) => <RunProvider>{children}</RunProvider>;
    const { result } = renderHook(() => useRun(), { wrapper });

    // Mock saved session data
    const mockData = {
      distance: 5.25,
      duration: 1800, // 30 mins
      coordinates: [{ latitude: 25.033, longitude: 121.565, time: Date.now() }],
      splits: [{ km: 1, pace: 340, time: 340 }],
      currentPace: 345,
      goal: { type: 'distance', value: 10, autoEnd: false },
      lastKm: 5
    };

    // Call restoreRun
    act(() => {
      result.current.restoreRun(mockData);
    });

    // Check that state is restored correctly
    expect(result.current.status).toBe('paused');
    expect(result.current.distance).toBe(5.25);
    expect(result.current.duration).toBe(1800);
    expect(result.current.coordinates).toEqual(mockData.coordinates);
    expect(result.current.splits).toEqual(mockData.splits);
    expect(result.current.currentPace).toBe(345);
    expect(result.current.goal).toEqual(mockData.goal);

    // Now advance timers by 10 seconds while still paused, duration should NOT change
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(result.current.duration).toBe(1800);

    // Resume the run
    act(() => {
      result.current.resumeRun();
    });
    expect(result.current.status).toBe('running');

    // Advance time by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    // The duration should be exactly 1801 seconds!
    expect(result.current.duration).toBe(1801);

    // Advance time by 4 more seconds
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    // The duration should be exactly 1805 seconds!
    expect(result.current.duration).toBe(1805);
  });
});
