import React, { useState } from 'react';
import { useRhythm } from '../../context/RhythmContext';
import { Volume2, VolumeX, Play, Pause, Music2 } from 'lucide-react';

const PRESETS = [
  { label: '散步', bpm: 120, color: 'bg-accent-green/20 text-accent-green', desc: '輕鬆散步節奏' },
  { label: '慢跑', bpm: 150, color: 'bg-accent-cyan/20 text-accent-cyan', desc: '舒適慢跑' },
  { label: '配速跑', bpm: 165, color: 'bg-accent-orange/20 text-accent-orange', desc: '穩定配速訓練' },
  { label: '競速', bpm: 180, color: 'bg-accent-red/20 text-accent-red', desc: '高強度競速' },
];

export default function RhythmTab() {
  const { bpm, setBpm, isPlaying, toggle } = useRhythm();
  const [selectedPreset, setSelectedPreset] = useState(null);

  const handlePresetSelect = (preset) => {
    setBpm(preset.bpm);
    setSelectedPreset(preset.label);
  };

  // Visual beat indicator
  const beatColor = isPlaying
    ? bpm >= 180 ? 'bg-accent-red' 
    : bpm >= 165 ? 'bg-accent-orange'
    : bpm >= 150 ? 'bg-accent-cyan'
    : 'bg-accent-green'
    : 'bg-bg-elevated';

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="px-5 pt-14 pb-4" style={{ paddingTop: 'calc(var(--safe-area-top) + 3rem)' }}>
        <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>
          節奏
        </h1>
        <p className="text-sm text-text-secondary mt-1">控制你的跑步節拍器</p>
      </header>

      {/* BPM Display */}
      <div className="flex flex-col items-center justify-center py-8">
        <div className="relative">
          {/* Beat ring */}
          {isPlaying && (
            <div className={`absolute inset-0 rounded-full ${beatColor}/20 pulse-ring`} style={{ margin: '-20px' }} />
          )}
          <div className={`w-44 h-44 rounded-full ${beatColor} flex flex-col items-center justify-center transition-colors duration-300`}>
            <span className="stat-value-xl text-white">{bpm}</span>
            <span className="text-xs text-white/70 mt-1 font-medium tracking-wider uppercase">BPM</span>
          </div>
        </div>
      </div>

      {/* BPM Slider */}
      <div className="px-8 mb-6">
        <input
          type="range"
          min="100"
          max="220"
          value={bpm}
          onChange={(e) => {
            setBpm(Number(e.target.value));
            setSelectedPreset(null);
          }}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #00D4AA ${((bpm - 100) / 120) * 100}%, #2C2C2E ${((bpm - 100) / 120) * 100}%)`,
          }}
        />
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-text-muted">100</span>
          <span className="text-[10px] text-text-muted">220</span>
        </div>
      </div>

      {/* Play/Pause Button */}
      <div className="flex justify-center mb-8">
        <button
          onClick={toggle}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 ${
            isPlaying ? 'bg-accent-orange' : 'bg-accent-cyan glow-cyan'
          }`}
        >
          {isPlaying ? (
            <Pause size={28} className="text-white" fill="white" />
          ) : (
            <Play size={28} className="text-white ml-1" fill="white" />
          )}
        </button>
      </div>

      {/* Presets */}
      <div className="px-5 mb-6">
        <span className="stat-label block mb-3">預設節奏</span>
        <div className="grid grid-cols-2 gap-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePresetSelect(preset)}
              className={`card flex flex-col items-start p-4 transition-all duration-200 active:scale-[0.97] ${
                selectedPreset === preset.label ? 'ring-1 ring-accent-cyan/50' : ''
              }`}
            >
              <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${preset.color} mb-2`}>
                {preset.bpm} BPM
              </div>
              <span className="text-sm font-medium text-text-primary">{preset.label}</span>
              <span className="text-xs text-text-muted mt-0.5">{preset.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="px-5 mb-24">
        <div className="card-elevated flex items-start gap-3 p-4">
          <Music2 size={18} className="text-accent-cyan mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-text-secondary leading-relaxed">
              節拍器會在跑步開始時自動連動。你也可以在跑步中隨時調整節奏。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
