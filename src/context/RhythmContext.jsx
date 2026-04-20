import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const RhythmContext = createContext();

export const useRhythm = () => useContext(RhythmContext);

export const RhythmProvider = ({ children }) => {
  const [bpm, setBpm] = useState(160);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true); // Whether it should auto-link with run
  
  const audioContextRef = useRef(null);
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef(null);

  const lookahead = 25.0; // max timer latency (ms)
  const scheduleAheadTime = 0.1; // how far to schedule audio (sec)

  // Initialize AudioContext upon first interaction
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (AudioContextCtor) {
        audioContextRef.current = new AudioContextCtor();
      }
    }
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  const nextNote = useCallback(() => {
    const secondsPerBeat = 60.0 / bpm;
    nextNoteTimeRef.current += secondsPerBeat;
  }, [bpm]);

  const scheduleNote = useCallback((time) => {
    if (!audioContextRef.current) return;
    const osc = audioContextRef.current.createOscillator();
    const envelope = audioContextRef.current.createGain();

    osc.frequency.value = 880.0;
    envelope.gain.value = 1;
    envelope.gain.setValueAtTime(1, time);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(envelope);
    envelope.connect(audioContextRef.current.destination);

    osc.start(time);
    osc.stop(time + 0.05);
  }, []);

  const scheduler = useCallback(() => {
    if (!audioContextRef.current) return;
    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + scheduleAheadTime) {
      scheduleNote(nextNoteTimeRef.current);
      nextNote();
    }
    timerIDRef.current = setTimeout(scheduler, lookahead);
  }, [nextNote, scheduleNote]);

  useEffect(() => {
    if (isPlaying) {
      initAudio();
      if (audioContextRef.current) {
        nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.05;
        scheduler();
      }
    } else {
      clearTimeout(timerIDRef.current);
    }
    return () => clearTimeout(timerIDRef.current);
  }, [isPlaying, scheduler, initAudio]);

  const toggle = useCallback(() => {
    initAudio();
    setIsPlaying(prev => !prev);
  }, [initAudio]);

  const setBpmVal = useCallback((val) => {
    setBpm(Number(val));
  }, []);

  return (
    <RhythmContext.Provider value={{
      bpm,
      setBpm: setBpmVal,
      isPlaying,
      setIsPlaying,
      toggle,
      isEnabled,
      setIsEnabled,
      initAudio
    }}>
      {children}
    </RhythmContext.Provider>
  );
};
