import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRuns, deleteRun } from '../../services/DatabaseService';
import { MapPin, TrendingUp, Loader2, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import ActivityCard from './ActivityCard';
import WeeklySummary from './WeeklySummary';

export default function ActivityTab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Deletion states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [runToDelete, setRunToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null); // null, 'syncing', 'success', 'error'

  useEffect(() => {
    const initLoad = async () => {
      if (user) {
        await loadRuns();
      } else {
        setLoading(false);
      }
    };
    initLoad();
  }, [user?.uid]);

  const loadRuns = async (isManual = false) => {
    try {
      setLoading(true);
      setError(null);
      if (isManual) {
        setSyncStatus('syncing');
        setShowToast(true);
      }
      
      const data = await getRuns(user.uid);
      setRuns(data);
      
      if (isManual) {
        setSyncStatus('success');
        setTimeout(() => {
          setShowToast(false);
          setSyncStatus(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Error loading runs:', error);
      setError(error.message || '載入失敗');
      if (isManual) setSyncStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDelete = (runId) => {
    setRunToDelete(runId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!runToDelete) return;
    setIsDeleting(true);
    try {
      await deleteRun(user.uid, runToDelete);
      // Instant UI update
      setRuns(prev => prev.filter(r => r.id !== runToDelete));
      
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
      setIsDeleteModalOpen(false);
      setRunToDelete(null);
    } catch (err) {
      console.error('Error deleting:', err);
      setError('刪除失敗，請稍後再試');
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate weekly stats
  const getWeeklyStats = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekRuns = runs.filter(r => r.createdAt >= startOfWeek);
    return {
      count: weekRuns.length,
      totalDistance: weekRuns.reduce((sum, r) => sum + (r.distance || 0), 0),
      totalDuration: weekRuns.reduce((sum, r) => sum + (r.duration || 0), 0),
    };
  };

  const weeklyStats = getWeeklyStats();

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="px-5 pt-14 pb-4 flex items-center justify-between" style={{ paddingTop: 'calc(var(--safe-area-top) + 3rem)' }}>
        <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>
          活動
        </h1>
        <button 
          onClick={() => loadRuns(true)}
          disabled={loading}
          className={`p-2 transition-all active:scale-90 ${
            syncStatus === 'success' ? 'text-accent-green' : 
            syncStatus === 'error' ? 'text-error' : 'text-text-secondary'
          }`}
        >
          {syncStatus === 'syncing' ? (
            <Loader2 size={20} className="animate-spin text-accent-red" />
          ) : (
            <TrendingUp size={20} className={syncStatus === 'success' ? 'animate-bounce' : ''} />
          )}
        </button>
      </header>

      {/* Weekly Summary */}
      <WeeklySummary stats={weeklyStats} />

      {/* Activity List */}
      <div className="flex-1 px-4 pb-6">
        {loading && runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Loader2 className="animate-spin text-text-secondary" size={28} />
            <p className="text-sm text-text-secondary">載入跑步記錄...</p>
          </div>
        ) : error && runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-sm text-error">{error}</p>
            <button
              onClick={loadRuns}
              className="px-6 py-2 bg-bg-card text-text-secondary rounded-full text-sm"
            >
              重試
            </button>
          </div>
        ) : runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 gap-4 transition-all animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-bg-card flex items-center justify-center">
              <MapPin size={32} className="text-text-tertiary" />
            </div>
            <div className="text-center">
              <p className="text-text-secondary text-base mb-1">還沒有跑步記錄</p>
            </div>
            <button
              onClick={() => navigate('/run')}
              className="px-8 py-3 bg-accent-red text-white rounded-full font-semibold text-sm glow-red"
            >
              開始第一次跑步
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between mb-2">
              <span className="stat-label">最近活動</span>
              <span className="text-xs text-text-muted">{runs.length} 次跑步</span>
            </div>
            <div className="flex flex-col gap-3">
              {runs.map((run, index) => (
                <div
                  key={run.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <ActivityCard
                    run={run}
                    onClick={() => navigate(`/activity/${run.id}`)}
                    onDelete={handleOpenDelete}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-bg-card rounded-3xl p-6 shadow-2xl border border-border-subtle">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-error mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">確定要刪除嗎？</h3>
              <p className="text-sm text-text-secondary mb-8">
                這筆跑步記錄將會被永久刪除，無法恢復。
              </p>
              
              <div className="flex flex-col w-full gap-3">
                <button
                  disabled={isDeleting}
                  onClick={confirmDelete}
                  className="w-full py-4 bg-error text-white rounded-2xl font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : '確認刪除'}
                </button>
                <button
                  disabled={isDeleting}
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setRunToDelete(null);
                  }}
                  className="w-full py-4 bg-bg-elevated text-text-primary rounded-2xl font-bold active:scale-95 transition-all"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success/Sync Toast */}
      {showToast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[110] animate-bounce-in">
          <div className={`${
            syncStatus === 'error' ? 'bg-error' : 
            syncStatus === 'syncing' ? 'bg-accent-blue' : 'bg-success'
          } text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-xl`}>
            {syncStatus === 'syncing' ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            <span className="text-sm font-bold">
              {syncStatus === 'syncing' ? '正在同步雲端紀錄...' : 
               syncStatus === 'error' ? '同步失敗，請檢查網路' : '紀錄已更新'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
