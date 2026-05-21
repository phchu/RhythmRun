import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import haversine from 'haversine-distance';

// GPS filtering thresholds
const MAX_ACCURACY_METERS = 30;
const MAX_SPEED_KMH = 50;
const MIN_DISTANCE_METERS = 2;

const RunContext = createContext();

export const useRun = () => useContext(RunContext);

export const RunProvider = ({ children }) => {
  const [status, setStatus] = useState('idle'); // 'idle', 'running', 'paused', 'stopped'
  const [distance, setDistance] = useState(0); // km
  const [duration, setDuration] = useState(0); // seconds
  const [coordinates, setCoordinates] = useState([]);
  const [splits, setSplits] = useState([]); // per-km splits
  const [currentPace, setCurrentPace] = useState(null); // sec/km
  const [currentSplitStart, setCurrentSplitStart] = useState(0); // time when current km started
  const [goal, setGoal] = useState({ type: 'none', value: 0, autoEnd: false });
  const [recoveredSession, setRecoveredSession] = useState(null);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedDurationRef = useRef(0);
  const pauseStartRef = useRef(null);
  const lastKmRef = useRef(0);

  // Timer effect
  useEffect(() => {
    if (status === 'running') {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000;
        setDuration(Math.floor(elapsed));
      }, 1000);
    } else if (status === 'paused') {
      clearInterval(timerRef.current);
      pauseStartRef.current = Date.now();
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [status]);

  // On mount: check for recovered session
  useEffect(() => {
    const saved = localStorage.getItem('rhythmrun_active_session');
    if (saved) {
      try {
        setRecoveredSession(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recovered session', e);
      }
    }
  }, []);

  // Auto-save active state to local storage
  useEffect(() => {
    if (status === 'running' || status === 'paused') {
      const sessionData = {
        distance,
        duration,
        coordinates,
        splits,
        currentPace,
        goal,
        lastKm: lastKmRef.current
      };
      localStorage.setItem('rhythmrun_active_session', JSON.stringify(sessionData));
    }
  }, [status, distance, duration, coordinates, splits, currentPace, goal]);

  const startRun = useCallback(() => {
    setStatus('running');
    setDistance(0);
    setDuration(0);
    setCoordinates([]);
    setSplits([]);
    setCurrentPace(null);
    setCurrentSplitStart(0);
    startTimeRef.current = Date.now();
    pausedDurationRef.current = 0;
    pauseStartRef.current = null;
    lastKmRef.current = 0;
  }, []);

  const pauseRun = useCallback(() => {
    setStatus('paused');
  }, []);

  const resumeRun = useCallback(() => {
    if (pauseStartRef.current) {
      pausedDurationRef.current += (Date.now() - pauseStartRef.current);
      pauseStartRef.current = null;
    }
    setStatus('running');
  }, []);

  const stopRun = useCallback(() => {
    setStatus('stopped');
    clearInterval(timerRef.current);
    localStorage.removeItem('rhythmrun_active_session');
  }, []);

  const resetRun = useCallback(() => {
    setStatus('idle');
    setDistance(0);
    setDuration(0);
    setCoordinates([]);
    setSplits([]);
    setCurrentPace(null);
    setGoal({ type: 'none', value: 0, autoEnd: false });
    startTimeRef.current = null;
    pauseStartRef.current = null;
    lastKmRef.current = 0;
    localStorage.removeItem('rhythmrun_active_session');
  }, []);

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

  const discardRecoveredRun = useCallback(() => {
    localStorage.removeItem('rhythmrun_active_session');
    setRecoveredSession(null);
  }, []);

  const addLocation = useCallback((location) => {
    if (status !== 'running') return;

    // Filter: Reject low-accuracy GPS readings
    if (location.accuracy && location.accuracy > MAX_ACCURACY_METERS) {
      return;
    }

    setCoordinates(prevCoords => {
      if (prevCoords.length === 0) {
        return [location];
      }

      const lastPoint = prevCoords[prevCoords.length - 1];
      const distMeters = haversine(
        { latitude: lastPoint.latitude, longitude: lastPoint.longitude },
        { latitude: location.latitude, longitude: location.longitude }
      );

      // Filter: Ignore micro-movements
      if (distMeters < MIN_DISTANCE_METERS) {
        return prevCoords;
      }

      // Filter: Reject speed anomalies
      const timeDiffSec = (location.time - lastPoint.time) / 1000;
      if (timeDiffSec > 0) {
        const speedKmh = (distMeters / 1000) / (timeDiffSec / 3600);
        if (speedKmh > MAX_SPEED_KMH) {
          return prevCoords;
        }

        // Calculate current pace (sec/km)
        const paceSecPerKm = timeDiffSec / (distMeters / 1000);
        setCurrentPace(Math.round(paceSecPerKm));
      }

      // Update distance
      const newDistKm = distMeters / 1000;
      setDistance(d => {
        const totalDist = d + newDistKm;

        // Check for km split
        const currentKm = Math.floor(totalDist);
        if (currentKm > lastKmRef.current && currentKm > 0) {
          const elapsed = (Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000;
          const splitPace = Math.round(elapsed - (splits.length > 0 ? splits.reduce((sum, s) => sum + s.pace, 0) : 0));
          
          setSplits(prev => [...prev, {
            km: currentKm,
            pace: splitPace,
            time: Math.round(elapsed)
          }]);
          lastKmRef.current = currentKm;
        }

        return totalDist;
      });

      return [...prevCoords, location];
    });
  }, [status, splits]);

  // Computed values
  const avgPace = distance > 0.01 ? Math.round(duration / distance) : null; // sec/km

  const getRunData = useCallback(() => ({
    distance,
    duration,
    avgPace,
    coordinates,
    splits,
    goal,
    createdAt: new Date(),
  }), [distance, duration, avgPace, coordinates, splits, goal]);

  return (
    <RunContext.Provider value={{
      // State
      status,
      distance,
      duration,
      coordinates,
      splits,
      currentPace,
      avgPace,
      goal,
      recoveredSession,
      // Actions
      startRun,
      pauseRun,
      resumeRun,
      stopRun,
      resetRun,
      addLocation,
      getRunData,
      setGoal,
      restoreRun,
      discardRecoveredRun
    }}>
      {children}
    </RunContext.Provider>
  );
};
