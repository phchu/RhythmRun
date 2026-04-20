import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRun } from '../../context/RunContext';
import { useAuth } from '../../context/AuthContext';
import { saveRun } from '../../services/DatabaseService';
import { Check, X, Share2 } from 'lucide-react';

const formatPace = (secPerKm) => {
  if (!secPerKm || secPerKm <= 0 || secPerKm > 3600) return '--:--';
  const min = Math.floor(secPerKm / 60);
  const sec = Math.floor(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

const formatDuration = (totalSec) => {
  if (!totalSec || totalSec <= 0) return '--:--';
  const hrs = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  const sec = Math.floor(totalSec % 60);
  if (hrs > 0) {
    return `${hrs}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

export default function RunSummary() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { distance, duration, avgPace, splits, coordinates, getRunData, resetRun } = useRun();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Auto-save when user is available and not already saved
  useEffect(() => {
    if (user && !saved && !saving) {
      handleSave();
    }
  }, [user, saved, saving]);

  const handleSave = async () => {
    if (!user || saved) return;
    setSaving(true);
    try {
      const runData = getRunData();
      await saveRun(user.uid, runData);
      setSaved(true);
    } catch (error) {
      console.error('Failed to save run:', error);
      alert('儲存失敗: ' + (error.message || '請檢查網路連線'));
    } finally {
      setSaving(false);
    }
  };

  const handleDone = () => {
    resetRun();
    navigate('/');
  };

  const handleDiscard = () => {
    if (window.confirm('確定要捨棄這筆跑步記錄嗎？')) {
      resetRun();
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="px-5 pt-16 pb-2 flex items-center justify-between" style={{ paddingTop: 'calc(var(--safe-area-top) + 3rem)' }}>
        <h1 className="text-xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>
          跑步完成 🎉
        </h1>
        {saving && (
          <span className="text-xs text-accent-orange animate-pulse">儲存中...</span>
        )}
        {saved && (
          <span className="text-xs text-accent-green flex items-center gap-1">
            <Check size={14} /> 已儲存
          </span>
        )}
      </div>

      {/* Main Distance */}
      <div className="px-5 py-8 text-center">
        <span className="stat-label block mb-2">總距離</span>
        <div className="flex items-baseline justify-center gap-2">
          <span className="stat-value-xl text-text-primary animate-slide-up">
            {distance.toFixed(2)}
          </span>
          <span className="text-xl text-text-secondary">km</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="card text-center py-5">
            <span className="stat-label block mb-2">總時間</span>
            <span className="stat-value text-2xl text-text-primary">
              {formatDuration(duration)}
            </span>
          </div>
          <div className="card text-center py-5">
            <span className="stat-label block mb-2">平均配速</span>
            <span className="stat-value text-2xl text-text-primary">
              {formatPace(avgPace)}
            </span>
            <span className="text-xs text-text-muted">/km</span>
          </div>
        </div>
      </div>

      {/* Splits */}
      {splits.length > 0 && (
        <div className="px-5 mb-6">
          <span className="stat-label block mb-3">每公里分段</span>
          <div className="card p-0 overflow-hidden">
            {splits.map((split, i) => {
              const maxPace = Math.max(...splits.map(s => s.pace));
              const barWidth = maxPace > 0 ? (split.pace / maxPace) * 100 : 0;
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle last:border-0">
                  <span className="text-xs text-text-muted w-6 text-center">{split.km}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-cyan"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-sm text-text-primary font-medium w-14 text-right" style={{ fontFamily: 'var(--font-display)' }}>
                    {formatPace(split.pace)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Route Preview */}
      {coordinates.length > 2 && (
        <div className="px-5 mb-8">
          <span className="stat-label block mb-3">路線</span>
          <div className="card h-40">
            <RoutePreview coordinates={coordinates} />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-5 pb-12 mt-auto flex flex-col gap-3" style={{ paddingBottom: 'calc(var(--safe-area-bottom) + 3rem)' }}>
        <button
          onClick={handleDone}
          className="w-full py-4 rounded-2xl bg-accent-red text-white font-semibold text-base glow-red active:scale-[0.98] transition-transform"
        >
          完成
        </button>
        <button
          onClick={handleDiscard}
          className="w-full py-3 rounded-2xl bg-transparent text-text-muted text-sm"
        >
          捨棄記錄
        </button>
      </div>
    </div>
  );
}

function RoutePreview({ coordinates }) {
  if (!coordinates || coordinates.length < 2) return null;

  const lats = coordinates.map(c => c.latitude);
  const lngs = coordinates.map(c => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const padding = 16;
  const w = 280;
  const h = 120;
  const rangeX = maxLng - minLng || 0.001;
  const rangeY = maxLat - minLat || 0.001;

  const points = coordinates.map(c => {
    const x = padding + ((c.longitude - minLng) / rangeX) * (w - padding * 2);
    const y = padding + ((maxLat - c.latitude) / rangeY) * (h - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
      <polyline
        points={points}
        fill="none"
        stroke="#00D4AA"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
