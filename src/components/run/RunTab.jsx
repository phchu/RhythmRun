import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRun } from '../../context/RunContext';
import { useAuth } from '../../context/AuthContext';
import { useRhythm } from '../../context/RhythmContext';
import { initAudio } from '../../services/VoiceService';
import { 
  Play, Settings, Music2, Plus, Minus, 
  Target, Clock, Navigation, MapPin
} from 'lucide-react';

export default function RunTab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startRun, resetRun, setGoal } = useRun();
  const { bpm, setBpm, isEnabled, setIsEnabled, initAudio: initMetronome } = useRhythm();

  const [localGoal, setLocalGoal] = useState({ type: 'none', value: 5.0, autoEnd: false });
  const [gpsReady, setGpsReady] = useState(false);
  const [locating, setLocating] = useState(true);

  useEffect(() => {
    resetRun();
    
    // Check GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setGpsReady(true);
          setLocating(false);
        },
        () => {
          setGpsReady(false);
          setLocating(false);
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      setLocating(false);
    }
  }, [resetRun]);

  const handleStartRun = async () => {
    setGoal(localGoal);
    await initAudio(); // WebVoice
    await initMetronome(); // WebAudio
    startRun();
    navigate('/run/active');
  };

  const adjustGoalValue = (delta) => {
    setLocalGoal(prev => {
      const step = prev.type === 'distance' ? 0.5 : 5;
      const min = prev.type === 'distance' ? 0.5 : 5;
      const max = prev.type === 'distance' ? 100 : 300;
      return {
        ...prev,
        value: Math.max(min, Math.min(max, prev.value + delta * step))
      };
    });
  };

  const setGoalType = (type) => {
    const defaultVal = type === 'distance' ? 5.0 : 30.0;
    setLocalGoal({ type, value: defaultVal, autoEnd: localGoal.autoEnd });
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary overflow-hidden">
      {/* Header */}
      <header className="px-6 pt-14 pb-2" style={{ paddingTop: 'calc(var(--safe-area-top) + 2rem)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-text-primary italic tracking-tight uppercase" style={{ fontFamily: 'var(--font-display)' }}>
              Ready to Run
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${
                locating ? 'bg-accent-orange animate-pulse' : gpsReady ? 'bg-accent-green' : 'bg-error'
              }`} />
              <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted">
                {locating ? 'GPS 定位中...' : gpsReady ? 'GPS 已就緒' : 'GPS 無法使用'}
              </span>
            </div>
          </div>
          <button onClick={() => navigate('/settings')} className="p-2.5 rounded-full bg-bg-elevated text-text-secondary active:scale-90 transition-transform">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 px-6 py-6 flex flex-col gap-8 overflow-y-auto pb-48">
        {/* Training Goal Selection */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-accent-red" />
            <h2 className="text-xs font-black uppercase tracking-widest text-text-secondary">運動目標設定</h2>
          </div>
          
          <div className="card-elevated p-4 flex flex-col gap-6">
            <div className="flex gap-2 p-1 bg-bg-card rounded-2xl border border-white/5">
              {[
                { id: 'none', label: '自由跑', icon: Navigation },
                { id: 'distance', label: '距離', icon: MapPin },
                { id: 'time', label: '時間', icon: Clock }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setGoalType(type.id)}
                  className={`flex-1 flex flex-col items-center gap-2 py-3.5 rounded-xl transition-all duration-300 ${
                    localGoal.type === type.id 
                      ? 'bg-bg-elevated text-text-primary shadow-lg ring-1 ring-white/10' 
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  <type.icon size={18} className={localGoal.type === type.id ? 'text-accent-red' : ''} />
                  <span className="text-[10px] font-black tracking-widest uppercase">{type.label}</span>
                </button>
              ))}
            </div>

            {localGoal.type !== 'none' && (
              <div className="animate-fade-in-up flex flex-col gap-6">
                <div className="flex items-center justify-between px-4">
                  <button 
                    onClick={() => adjustGoalValue(-1)}
                    className="w-14 h-14 rounded-full bg-bg-card flex items-center justify-center text-text-primary active:scale-90 border border-white/5 shadow-inner"
                  >
                    <Minus size={24} />
                  </button>
                  <div className="text-center group">
                    <span className="text-6xl font-black text-white block leading-none tracking-tighter" style={{ fontFamily: 'var(--font-display)' }}>
                      {localGoal.type === 'distance' ? localGoal.value.toFixed(1) : Math.round(localGoal.value)}
                    </span>
                    <span className="text-[10px] text-accent-red font-black tracking-[0.2em] uppercase mt-2 block">
                      {localGoal.type === 'distance' ? '公里 (KM)' : '分鐘 (MIN)'}
                    </span>
                  </div>
                  <button 
                    onClick={() => adjustGoalValue(1)}
                    className="w-14 h-14 rounded-full bg-bg-card flex items-center justify-center text-text-primary active:scale-90 border border-white/5 shadow-inner"
                  >
                    <Plus size={24} />
                  </button>
                </div>

                <div className="flex items-center justify-between py-4 px-5 bg-bg-card/40 rounded-3xl border border-white/5 backdrop-blur-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-bold text-text-primary">達成時自動停止紀錄</span>
                    <span className="text-[10px] text-text-muted font-medium">到達目標後將為您自動結算</span>
                  </div>
                  <button 
                    onClick={() => setLocalGoal(prev => ({ ...prev, autoEnd: !prev.autoEnd }))}
                    className={`w-12 h-6 rounded-full p-1 transition-all duration-500 ease-in-out ${
                      localGoal.autoEnd ? 'bg-accent-green' : 'bg-bg-elevated'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                      localGoal.autoEnd ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Metronome Setup Card */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Music2 size={16} className="text-accent-cyan" />
            <h2 className="text-xs font-black uppercase tracking-widest text-text-secondary">跑步節拍器設定</h2>
          </div>
          
          <div className="card-elevated p-5 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${isEnabled ? 'bg-accent-cyan text-white shadow-lg glow-cyan' : 'bg-bg-card text-text-muted'}`}>
                  <Music2 size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text-primary">穩定跑頻 (Cadence)</span>
                  <span className="text-[10px] text-text-muted font-medium">運動開始時自動同步播放</span>
                </div>
              </div>
              <button 
                onClick={() => setIsEnabled(!isEnabled)}
                className={`px-5 py-2 rounded-full text-[10px] font-black tracking-widest uppercase transition-all ${
                  isEnabled ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20' : 'bg-bg-elevated text-text-muted border border-transparent'
                }`}
              >
                {isEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {isEnabled && (
              <div className="flex items-center justify-between pt-5 border-t border-white/5 animate-fade-in-up">
                <button 
                  onClick={() => setBpm(Math.max(100, bpm - 1))}
                  className="w-11 h-11 rounded-full bg-bg-card flex items-center justify-center text-text-primary active:scale-90 border border-white/5"
                >
                  <Minus size={20} />
                </button>
                <div className="text-center">
                  <span className="text-3xl font-black text-text-primary block leading-none" style={{ fontFamily: 'var(--font-display)' }}>{bpm}</span>
                  <span className="text-[10px] text-text-muted font-black tracking-widest uppercase mt-2">BPM (步頻)</span>
                </div>
                <button 
                  onClick={() => setBpm(Math.min(220, bpm + 1))}
                  className="w-11 h-11 rounded-full bg-bg-card flex items-center justify-center text-text-primary active:scale-90 border border-white/5"
                >
                  <Plus size={20} />
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Optimized Circular Start Button */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center">
        <button
          onClick={handleStartRun}
          className="w-24 h-24 bg-accent-red text-white rounded-full font-black text-lg shadow-2xl glow-red active:scale-90 transition-all duration-300 flex flex-col items-center justify-center ring-4 ring-bg-primary"
        >
          <Play size={28} fill="currentColor" strokeWidth={3} className="mb-0.5" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase">Start</span>
        </button>
      </div>
      
      {/* Background Pulse Effect for Start Button */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[55] w-24 h-24 rounded-full bg-accent-red/20 pulse-ring pointer-events-none" />
    </div>
  );
}
