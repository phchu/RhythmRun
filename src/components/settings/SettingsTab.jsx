import React from 'react';
import { ChevronRight, Globe, Volume2, Map, Info } from 'lucide-react';
import { useSettings, MAP_STYLES } from '../../context/SettingsContext';

export default function SettingsTab() {
  const { settings, updateSettings } = useSettings();

  const handleStyleChange = (styleId) => {
    updateSettings({ mapStyle: styleId });
  };

  const handleIntervalChange = (val) => {
    updateSettings({ voiceInterval: val });
  };

  const handleUnitChange = (unit) => {
    updateSettings({ units: unit });
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="px-5 pt-14 pb-4" style={{ paddingTop: 'calc(var(--safe-area-top) + 3rem)' }}>
        <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>
          設定
        </h1>
      </header>

      {/* Voice Coach */}
      <div className="px-5 mb-6">
        <span className="stat-label block mb-3">語音教練</span>
        <div className="card p-0 overflow-hidden">
          {/* Voice interval */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <Volume2 size={18} className="text-accent-cyan" />
              <span className="text-sm text-text-primary">通報間隔</span>
            </div>
            <div className="flex items-center gap-2">
              {[0.5, 1, 2, 5].map(val => (
                <button
                  key={val}
                  onClick={() => handleIntervalChange(val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    settings.voiceInterval === val
                      ? 'bg-accent-cyan text-white'
                      : 'bg-bg-elevated text-text-secondary'
                  }`}
                >
                  {val} km
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-accent-orange" />
              <span className="text-sm text-text-primary">語音語言</span>
            </div>
            <span className="text-sm text-text-secondary">繁體中文</span>
          </div>
        </div>
      </div>

      {/* Units */}
      <div className="px-5 mb-6">
        <span className="stat-label block mb-3">單位</span>
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-sm text-text-primary">距離單位</span>
            <div className="flex gap-1 p-0.5 rounded-lg bg-bg-elevated">
              <button
                onClick={() => handleUnitChange('km')}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  settings.units === 'km' ? 'bg-bg-card text-text-primary' : 'text-text-muted'
                }`}
              >
                公里
              </button>
              <button
                onClick={() => handleUnitChange('mi')}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  settings.units === 'mi' ? 'bg-bg-card text-text-primary' : 'text-text-muted'
                }`}
              >
                英里
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map Style */}
      <div className="px-5 mb-6">
        <span className="stat-label block mb-3">地圖設定</span>
        <div className="card p-0 overflow-hidden">
          <div className="flex flex-col border-b border-border-subtle">
            <div className="flex items-center gap-3 px-4 pt-4 pb-2">
              <Map size={18} className="text-accent-green" />
              <span className="text-sm text-text-primary">底圖樣式</span>
            </div>
            <div className="grid grid-cols-3 gap-2 px-4 pb-4">
              {Object.values(MAP_STYLES).map((style) => (
                <button
                  key={style.id}
                  onClick={() => handleStyleChange(style.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    settings.mapStyle === style.id
                      ? 'border-accent-green bg-accent-green/10'
                      : 'border-transparent bg-bg-elevated text-text-secondary'
                  }`}
                >
                  <div className={`w-full h-10 rounded-lg ${
                    style.id === 'voyager' ? 'bg-slate-200' : 
                    style.id === 'standard' ? 'bg-blue-100' : 'bg-slate-900'
                  }`} />
                  <span className="text-[10px] font-bold">{style.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="px-5 mb-24">
        <span className="stat-label block mb-3">關於</span>
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-4 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <Info size={18} className="text-text-muted" />
              <span className="text-sm text-text-primary">RhythmRun</span>
            </div>
            <span className="text-sm text-text-muted">v2.1.0</span>
          </div>
          <div className="px-4 py-4">
            <p className="text-xs text-text-muted leading-relaxed">
              純粹的跑步記錄與分析工具，搭配獨家節拍器功能，幫助你建立穩定的跑步節奏。
              無廣告、無推銷、專注於你的每一步。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
