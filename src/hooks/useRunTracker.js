import { useState, useCallback } from 'react';
import haversine from 'haversine-distance';

// GPS filtering thresholds
const MAX_ACCURACY_METERS = 30;      // Reject GPS points with accuracy worse than 30m
const MAX_SPEED_KMH = 50;            // Reject if implied speed exceeds 50 km/h (human running max ~45)
const MIN_DISTANCE_METERS = 2;       // Ignore micro-movements under 2 meters (GPS noise)

export default function useRunTracker() {
  const [status, setStatus] = useState('idle'); // 'idle', 'running', 'paused', 'stopped'
  const [distance, setDistance] = useState(0); // in kilometers
  const [coordinates, setCoordinates] = useState([]);

  const startRun = useCallback(() => {
    setStatus('running');
    setDistance(0);
    setCoordinates([]);
  }, []);

  const pauseRun = useCallback(() => {
    setStatus('paused');
  }, []);

  const resumeRun = useCallback(() => {
    setStatus('running');
  }, []);

  const stopRun = useCallback(() => {
    setStatus('stopped');
  }, []);

  const addLocation = useCallback((location) => {
    if (status !== 'running') return;

    // Filter 1: Reject low-accuracy GPS readings
    if (location.accuracy && location.accuracy > MAX_ACCURACY_METERS) {
      console.log(`[RunTracker] Rejected: accuracy ${location.accuracy.toFixed(1)}m > ${MAX_ACCURACY_METERS}m`);
      return;
    }
    
    setCoordinates(prevCoords => {
      if (prevCoords.length === 0) {
        console.log(`[RunTracker] First point recorded (accuracy: ${location.accuracy?.toFixed(1) || 'N/A'}m)`);
        return [location];
      }

      const lastPoint = prevCoords[prevCoords.length - 1];
      // haversine-distance returns meters
      const distMeters = haversine(
        { latitude: lastPoint.latitude, longitude: lastPoint.longitude },
        { latitude: location.latitude, longitude: location.longitude }
      );

      // Filter 2: Ignore micro-movements (GPS noise)
      if (distMeters < MIN_DISTANCE_METERS) {
        return prevCoords;
      }

      // Filter 3: Reject speed anomalies
      const timeDiffSec = (location.time - lastPoint.time) / 1000;
      if (timeDiffSec > 0) {
        const speedKmh = (distMeters / 1000) / (timeDiffSec / 3600);
        if (speedKmh > MAX_SPEED_KMH) {
          console.log(`[RunTracker] Rejected: speed ${speedKmh.toFixed(1)} km/h > ${MAX_SPEED_KMH} km/h (dist: ${distMeters.toFixed(1)}m, time: ${timeDiffSec.toFixed(1)}s)`);
          return prevCoords;
        }
      }

      console.log(`[RunTracker] Added: +${distMeters.toFixed(1)}m (accuracy: ${location.accuracy?.toFixed(1) || 'N/A'}m)`);
      setDistance(d => d + (distMeters / 1000));
      return [...prevCoords, location];
    });
  }, [status]);

  return {
    status,
    distance,
    coordinates,
    startRun,
    pauseRun,
    resumeRun,
    stopRun,
    addLocation
  };
}
