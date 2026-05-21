import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRun } from '../../context/RunContext';
import { useAuth } from '../../context/AuthContext';
import { saveRun } from '../../services/DatabaseService';
import { AlertTriangle, Play, Save, Trash2, Loader2 } from 'lucide-react';

export default function RecoveryOverlay() {
  const { recoveredSession, restoreRun, discardRecoveredRun } = useRun();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  if (!recoveredSession) return null;

  const formatDuration = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const min = Math.floor((totalSec % 3600) / 60);
    const sec = Math.floor(totalSec % 60);
    if (hrs > 0) return `${hrs}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const handleContinue = () => {
    restoreRun(recoveredSession);
    navigate('/run/active');
  };

  const handleSave = async () => {
    if (!user) {
      console.warn("No user found, cannot save recovered run.");
      return;
    }
    setIsSaving(true);
    
    const runDataToSave = {
      distance: recoveredSession.distance || 0,
      duration: recoveredSession.duration || 0,
      avgPace: recoveredSession.duration > 0 && recoveredSession.distance > 0 
                 ? Math.round(recoveredSession.duration / recoveredSession.distance) 
                 : null,
      coordinates: recoveredSession.coordinates || [],
      splits: recoveredSession.splits || [],
      goal: recoveredSession.goal,
      bpmUsed: null // Fallback
    };

    try {
      const savedId = await saveRun(user.uid, runDataToSave);
      discardRecoveredRun(); // Clears from local storage
      navigate(`/activity/${savedId}`);
    } catch (err) {
      console.error('Failed to save recovered run:', err);
      alert('儲存失敗，請稍後再試');
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('確定要放棄這筆未完成的紀錄嗎？放棄後將無法復原。')) {
      discardRecoveredRun();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-bg-card rounded-[40px] p-8 shadow-2xl border border-white/10 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-accent-orange/20 blur-3xl rounded-full" />
        
        <div className="flex flex-col items-center text-center relative z-10">
          <div className="w-20 h-20 rounded-full bg-accent-orange/10 flex items-center justify-center text-accent-orange mb-6">
            <AlertTriangle size={36} />
          </div>
          <h3 className="text-2xl font-black text-text-primary mb-3">偵測到未完成的紀錄</h3>
          <p className="text-sm text-text-secondary mb-6 leading-relaxed">
            系統發現您上次的跑步似乎因為意外中斷而沒有正常結束。
          </p>
          
          {/* Stats Preview */}
          <div className="flex items-center justify-center gap-6 w-full bg-bg-elevated rounded-2xl py-4 mb-8">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>
                {(recoveredSession.distance || 0).toFixed(2)}
              </span>
              <span className="text-[10px] font-bold text-text-muted tracking-widest uppercase">公里</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>
                {formatDuration(recoveredSession.duration || 0)}
              </span>
              <span className="text-[10px] font-bold text-text-muted tracking-widest uppercase">時間</span>
            </div>
          </div>

          <div className="flex flex-col w-full gap-4">
            <button
              onClick={handleContinue}
              disabled={isSaving}
              className="w-full py-4 bg-accent-green text-white rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 glow-green"
            >
              <Play size={20} fill="currentColor" />
              繼續紀錄
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-4 bg-bg-elevated text-text-primary rounded-2xl font-bold text-base active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <Loader2 size={20} className="animate-spin text-accent-cyan" />
              ) : (
                <Save size={20} />
              )}
              {isSaving ? '儲存中...' : '直接儲存'}
            </button>
            <button
              onClick={handleDiscard}
              disabled={isSaving}
              className="w-full py-4 bg-transparent text-text-muted hover:text-accent-red rounded-2xl font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              放棄紀錄
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
