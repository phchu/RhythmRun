import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};

export const startTracking = async (onLocation, onError) => {
  if (isNativePlatform()) {
    // Native tracking with Capacitor
    try {
      const permissions = await Geolocation.checkPermissions();
      if (permissions.location !== 'granted') {
        const req = await Geolocation.requestPermissions();
        if (req.location !== 'granted') {
          if(onError) onError(new Error("Location permission denied."));
          return;
        }
      }
      const watcherId = await Geolocation.watchPosition(
        { enableHighAccuracy: true },
        (position, err) => {
          if (err) {
            if(onError) onError(err);
            return;
          }
          if (position) {
            onLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              speed: position.coords.speed,
              time: position.timestamp
            });
          }
        }
      );
      window.rhythmRunWatcherId = watcherId;
    } catch (err) {
      if(onError) onError(err);
    }
  } else {
    // Web Fallback
    if (!navigator.geolocation) {
      if(onError) onError(new Error("Geolocation not supported by browser."));
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        onLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          time: pos.timestamp
        });
      },
      (err) => {
        if(onError) onError(err);
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );
    window.rhythmRunWatcherId = id;
  }
};

export const stopTracking = async () => {
  if (isNativePlatform()) {
    if (window.rhythmRunWatcherId != null) {
      await Geolocation.clearWatch({ id: window.rhythmRunWatcherId });
      window.rhythmRunWatcherId = null;
    }
  } else {
    if (window.rhythmRunWatcherId != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(window.rhythmRunWatcherId);
      window.rhythmRunWatcherId = null;
    }
  }
};
