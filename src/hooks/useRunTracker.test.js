import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import useRunTracker from './useRunTracker';

describe('useRunTracker', () => {
  it('should initialize with idle state', () => {
    const { result } = renderHook(() => useRunTracker());
    expect(result.current.status).toBe('idle');
    expect(result.current.distance).toBe(0);
    expect(result.current.coordinates.length).toBe(0);
  });

  it('should change status to running on start', () => {
    const { result } = renderHook(() => useRunTracker());
    act(() => {
      result.current.startRun();
    });
    expect(result.current.status).toBe('running');
  });

  it('should calculate distance when points are added', () => {
    const { result } = renderHook(() => useRunTracker());
    act(() => {
      result.current.startRun();
    });
    act(() => {
      result.current.addLocation({ latitude: 0, longitude: 0 }); // Null Island 0,0
    });
    act(() => {
      // Move north exactly 0.01 degree, approx 1.11km
      result.current.addLocation({ latitude: 0.01, longitude: 0 }); 
    });
    expect(result.current.distance).toBeGreaterThan(1);
    expect(result.current.distance).toBeLessThan(1.2);
    expect(result.current.coordinates.length).toBe(2);
  });
});
