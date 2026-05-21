import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRun } from '../../context/RunContext';
import { useRhythm } from '../../context/RhythmContext';
import { speak } from '../../services/VoiceService';
import { LockScreenService } from '../../services/LockScreenService';
import { Capacitor } from '@capacitor/core';
import { Pause, Play, Square, Music2, Target, Plus, Minus } from 'lucide-react';

const formatPace = (secPerKm) => {
  if (!secPerKm || secPerKm <= 0 || secPerKm > 3600) return '--:--';
  const min = Math.floor(secPerKm / 60);
  const sec = Math.floor(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

const formatDuration = (totalSec) => {
  const hrs = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  const sec = Math.floor(totalSec % 60);
  if (hrs > 0) {
    return `${hrs}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

const formatSpokenTime = (totalSec) => {
  const min = Math.floor(totalSec / 60);
  const sec = Math.floor(totalSec % 60);
  if (min > 0 && sec > 0) return `${min} 分 ${sec} 秒`;
  if (min > 0) return `${min} 分鐘`;
  return `${sec} 秒`;
};

export default function RunActive() {
  const navigate = useNavigate();
  const { 
    status, distance, duration, avgPace, currentPace, goal,
    pauseRun, resumeRun, stopRun, addLocation 
  } = useRun();
  const { isEnabled: isMetronomeEnabled, setIsEnabled: setMetronomeEnabled, isPlaying, setIsPlaying, bpm, setBpm } = useRhythm();
  
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const goalReachedRef = useRef(false);
  const lastAnnouncedHalfKm = useRef(0);

  // Request Notification Permissions for Lock Screen (Android 13+)
  useEffect(() => {
    LockScreenService.requestPermissions();
  }, []);

  // Sync Metronome with Run Status
  useEffect(() => {
    if (isMetronomeEnabled) {
      if (status === 'running') {
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(false);
    }
  }, [status, isMetronomeEnabled, setIsPlaying]);

  // Monitor Geolocation
  useEffect(() => {
    if (status !== 'running') return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        addLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          time: pos.timestamp,
        });
      },
      (err) => console.error('GPS Error:', err),
      { enableHighAccuracy: true, distanceFilter: 2 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [status, addLocation]);



  // Listen for native media button clicks
  useEffect(() => {
    let listenerPromise = null;
    
    listenerPromise = LockScreenService.onMediaButton((action) => {
      if (action === 'pause') {
        pauseRun();
      } else if (action === 'resume') {
        resumeRun();
      } else if (action === 'stop') {
        pauseRun();
        setShowStopConfirm(true);
      }
    });

    return () => {
      if (listenerPromise) {
        listenerPromise.then(handle => {
          if (handle && handle.remove) handle.remove();
        });
      }
    };
  }, [status, pauseRun, resumeRun]);

  // Main UI update effect for lock screen and background polling
  useEffect(() => {
    // 1. Poll for background actions since Chromium might block evaluateJavascript
    const pollBackgroundActions = async () => {
      if (status !== 'running' && status !== 'paused') return;
      const action = await LockScreenService.checkMediaAction();
      if (action) {
        console.log("Polled background media action:", action);
        if (action === 'pause') {
          pauseRun();
        } else if (action === 'resume') {
          resumeRun();
        } else if (action === 'stop') {
          pauseRun();
          setShowStopConfirm(true);
        }
      }
    };
    const interval = setInterval(pollBackgroundActions, 3000);

    // 2. Update the lock screen stats
    if (status === 'running') {
      const stats = {
        distance,
        duration: formatDuration(duration),
        pace: currentPace ? formatPace(currentPace) : (avgPace ? formatPace(avgPace) : '--:--'),
        progress: goal.type !== 'none' ? (distance / goal.value) : 0,
        isPaused: status === 'paused'
      };
      
      if (LockScreenService.activeActivityId || Capacitor.getPlatform() === 'android') {
        LockScreenService.update(stats);
      } else {
        LockScreenService.start(stats);
      }
    } else if (status === 'paused') {
      const stats = {
        distance,
        duration: formatDuration(duration),
        pace: currentPace ? formatPace(currentPace) : (avgPace ? formatPace(avgPace) : '--:--'),
        progress: goal.type !== 'none' ? (distance / goal.value) : 0,
        isPaused: true
      };
      if (Capacitor.getPlatform() === 'android') {
        LockScreenService.update(stats);
      }
    } else {
      LockScreenService.stop();
    }
    
    return () => {
      clearInterval(interval);
      if (status === 'finished') {
        LockScreenService.stop();
      }
    };
  }, [status, distance, duration, currentPace, avgPace, goal, pauseRun, resumeRun]);

  // Voice coach - announce every 0.5 km
  useEffect(() => {
    const currentHalfKm = Math.floor(distance * 2);
    if (currentHalfKm > lastAnnouncedHalfKm.current && currentHalfKm > 0) {
      lastAnnouncedHalfKm.current = currentHalfKm;
      
      const currentDist = (currentHalfKm / 2).toFixed(1);
      const timeStr = formatSpokenTime(duration);
      const paceStr = avgPace ? formatSpokenTime(avgPace) : '';
      
      let speech = `目前距離 ${currentDist} 公里，經過時間 ${timeStr}，平均配速每公里 ${paceStr}。`;
      
      // Add goal specifics
      if (goal.type === 'distance') {
        const rem = Math.max(0, goal.value - distance);
        speech += ` 剩餘距離 ${rem.toFixed(1)} 公里。`;
      } else if (goal.type === 'time') {
        const remSec = Math.max(0, (goal.value * 60) - duration);
        const remMin = Math.ceil(remSec / 60);
        speech += ` 剩餘時間約 ${remMin} 分鐘。`;
      }
      
      speak(speech);
    }
  }, [distance, duration, avgPace, goal]);

  // Goal Monitoring
  useEffect(() => {
    if (status !== 'running' || goal.type === 'none' || goalReachedRef.current) return;

    let progress = 0;
    if (goal.type === 'distance') {
      progress = distance / goal.value;
    } else if (goal.type === 'time') {
      progress = (duration / 60) / goal.value;
    }

    if (progress >= 1) {
      goalReachedRef.current = true;
      speak('恭喜！目標已達成，太棒了！');
      
      if (goal.autoEnd) {
        setTimeout(() => {
          stopRun();
          navigate('/run/summary');
        }, 2000);
      }
    }
  }, [status, distance, duration, goal, stopRun, navigate]);

  const handleStopClick = () => {
    pauseRun();
    setShowStopConfirm(true);
  };

  const handleConfirmStop = () => {
    stopRun();
    navigate('/run/summary');
  };

  const handleCancelStop = () => {
    setShowStopConfirm(false);
    resumeRun();
  };

  const getProgress = () => {
    if (goal.type === 'none') return 0;
    if (goal.type === 'distance') return Math.min(100, (distance / goal.value) * 100);
    if (goal.type === 'time') return Math.min(100, ((duration / 60) / goal.value) * 100);
    return 0;
  };

  const remainingText = () => {
    if (goal.type === 'none') return null;
    if (goal.type === 'distance') {
      const rem = Math.max(0, goal.value - distance);
      return `剩餘 ${rem.toFixed(2)} 公里`;
    }
    if (goal.type === 'time') {
      const rem = Math.max(0, goal.value - (duration / 60));
      return `剩餘 ${Math.ceil(rem)} 分鐘`;
    }
    return null;
  };

  const progress = getProgress();

  return (
    <div className="flex flex-col h-screen bg-bg-primary text-text-primary overflow-hidden">
      {/* Target Progress Header */}
      {goal.type !== 'none' && (
        <div className="px-6 pt-14 pb-4 animate-fade-in" style={{ paddingTop: 'calc(var(--safe-area-top) + 2rem)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-accent-orange" />
              <span className="text-[10px] font-bold tracking-widest text-text-secondary uppercase">運動目標進度</span>
            </div>
            <span className="text-xs font-bold text-accent-orange">{progress.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 w-full bg-bg-elevated rounded-full overflow-hidden shadow-inner border border-white/5">
            <div 
              className={`h-full transition-all duration-1000 ease-out ${progress >= 100 ? 'bg-accent-green' : 'bg-accent-orange'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-text-muted mt-2 text-right font-medium tracking-wide">{remainingText()}</p>
        </div>
      )}

      {/* Stats Display */}
      <div className={`flex-1 flex flex-col items-center justify-center gap-4 transition-all duration-500 ${goal.type === 'none' ? 'pt-12' : ''}`}>
        <div className="flex flex-col items-center">
          <span className="stat-value-xl text-[120px] leading-none text-text-primary drop-shadow-2xl" style={{ fontFamily: 'var(--font-display)', fontWeight: 900 }}>
            {distance.toFixed(2)}
          </span>
          <span className="text-xl font-bold text-text-secondary tracking-[0.2em] uppercase -mt-2">公里 (KM)</span>
        </div>

        <div className="grid grid-cols-2 w-full px-12 mt-12 gap-8">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-black text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>
              {formatDuration(duration)}
            </span>
            <span className="text-[10px] font-bold text-text-muted tracking-widest uppercase mt-1">跑步時間</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-black text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>
              {currentPace ? formatPace(currentPace) : (avgPace ? formatPace(avgPace) : '--:--')}
            </span>
            <span className="text-[10px] font-bold text-text-muted tracking-widest uppercase mt-1">目前配速</span>
          </div>
        </div>
      </div>

      {/* Controls Container */}
      <div className="px-8 pb-16 pt-8 flex flex-col gap-8 bg-gradient-to-t from-bg-primary via-bg-primary to-transparent">
        {/* Metronome Control */}
        <div className="flex items-center justify-between px-6 py-4 bg-bg-elevated/50 rounded-2xl border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              isPlaying ? 'bg-accent-cyan text-white animate-pulse' : 'bg-bg-card text-text-muted'
            }`}>
              <Music2 size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-primary">節拍器 (Cadence)</p>
              <div className="flex items-center gap-3 mt-1">
                <button onClick={() => setBpm(bpm - 1)} className="text-text-muted active:text-accent-cyan"><Minus size={14}/></button>
                <span className="text-xs font-black text-accent-cyan min-w-[30px] text-center">{bpm}</span>
                <button onClick={() => setBpm(bpm + 1)} className="text-text-muted active:text-accent-cyan"><Plus size={14}/></button>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setMetronomeEnabled(!isMetronomeEnabled)}
            className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${
              isMetronomeEnabled ? 'bg-accent-cyan/20 text-accent-cyan ring-1 ring-accent-cyan/30' : 'bg-bg-card text-text-muted'
            }`}
          >
            {isMetronomeEnabled ? '已連動' : '暫停中'}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-8">
          {status === 'running' ? (
            <button
              onClick={pauseRun}
              className="w-20 h-20 rounded-full bg-bg-elevated text-text-primary flex items-center justify-center shadow-xl active:scale-90 transition-transform border border-white/5"
            >
              <Pause size={32} fill="currentColor" />
            </button>
          ) : (
            <div className="flex items-center gap-8">
              <button
                onClick={handleStopClick}
                className="w-20 h-20 rounded-full bg-accent-red text-white flex items-center justify-center shadow-2xl glow-red active:scale-95 transition-transform"
              >
                <Square size={28} fill="currentColor" />
              </button>
              <button
                onClick={resumeRun}
                className="w-20 h-20 rounded-full bg-accent-green text-white flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
              >
                <Play size={32} fill="currentColor" className="ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stop Confirmation Overlay */}
      {showStopConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-bg-card rounded-[40px] p-8 shadow-2xl border border-white/5">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-accent-red/10 flex items-center justify-center text-accent-red mb-6">
                <Square size={36} fill="currentColor" />
              </div>
              <h3 className="text-2xl font-black text-text-primary mb-3">確定要結束嗎？</h3>
              <p className="text-sm text-text-secondary mb-8 leading-relaxed">
                您的努力已經被完整記錄。<br/>準備好查看今天的訓練成果了嗎？
              </p>
              
              <div className="flex flex-col w-full gap-4">
                <button
                  onClick={handleConfirmStop}
                  className="w-full py-5 bg-accent-red text-white rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all"
                >
                  確認結束
                </button>
                <button
                  onClick={handleCancelStop}
                  className="w-full py-5 bg-bg-elevated text-text-primary rounded-2xl font-bold text-sm active:scale-95 transition-all"
                >
                  繼續跑
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
