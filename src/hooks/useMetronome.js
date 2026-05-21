import { useState, useEffect, useRef } from 'react';

/**
 * Robust Web Audio API Metronome Hook
 * Allows runners to pace their run with an audible rhythmic beat.
 * Supports dynamic BPM changes and fallback guards for non-browser/test environments.
 */
export default function useMetronome(initialBpm = 160) {
  const [bpm, setBpm] = useState(initialBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef(null);
  const nextTickTimeRef = useRef(0);
  const timerIdRef = useRef(null);

  // Safely initialize Web Audio Context
  const initAudio = () => {
    if (!audioContextRef.current && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        try {
          audioContextRef.current = new AudioCtx();
        } catch (e) {
          console.warn('[useMetronome] Failed to initialize AudioContext:', e);
        }
      }
    }
  };

  // Play a brief high-pitched metronome tick sound
  const playClick = (time) => {
    if (!audioContextRef.current) return;
    try {
      const osc = audioContextRef.current.createOscillator();
      const gain = audioContextRef.current.createGain();

      osc.connect(gain);
      gain.connect(audioContextRef.current.destination);

      // Metronome beep characteristics (high pitch, short duration)
      osc.frequency.value = 1200; // 1200Hz for a crisp click
      gain.gain.setValueAtTime(0.15, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04); // decay quickly

      osc.start(time);
      osc.stop(time + 0.05);
    } catch (e) {
      console.warn('[useMetronome] Failed to play click:', e);
    }
  };

  // Metronome scheduler loop
  const scheduler = () => {
    if (!audioContextRef.current) return;

    // Schedule ticks up to 100ms in advance
    const scheduleAheadTime = 0.1;
    while (nextTickTimeRef.current < audioContextRef.current.currentTime + scheduleAheadTime) {
      playClick(nextTickTimeRef.current);
      const secondsPerBeat = 60.0 / parseFloat(bpm || 160);
      nextTickTimeRef.current += secondsPerBeat;
    }
    
    timerIdRef.current = setTimeout(scheduler, 25);
  };

  useEffect(() => {
    if (isPlaying) {
      initAudio();
      
      if (audioContextRef.current) {
        // Resume context if suspended (due to browser autoplay policies)
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(e => {
            console.warn('[useMetronome] Failed to resume AudioContext:', e);
          });
        }
        nextTickTimeRef.current = audioContextRef.current.currentTime;
        scheduler();
      }
    } else {
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current);
        timerIdRef.current = null;
      }
    }

    return () => {
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current);
        timerIdRef.current = null;
      }
    };
  }, [isPlaying, bpm]);

  const toggle = () => {
    setIsPlaying(prev => !prev);
  };

  return {
    bpm,
    setBpm,
    isPlaying,
    toggle
  };
}
