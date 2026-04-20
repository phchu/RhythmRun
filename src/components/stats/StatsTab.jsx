import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getRuns } from '../../services/DatabaseService';
import { Loader2, Trophy, TrendingUp } from 'lucide-react';
import DistanceChart from './DistanceChart';
import PaceChart from './PaceChart';
import PersonalRecords from './PersonalRecords';

const formatPace = (secPerKm) => {
  if (!secPerKm || secPerKm <= 0 || secPerKm > 3600) return '--:--';
  const min = Math.floor(secPerKm / 60);
  const sec = Math.floor(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

const formatDuration = (totalSec) => {
  if (!totalSec || totalSec <= 0) return '0h';
  const hrs = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${min}m`;
  return `${min}m`;
};

export default function StatsTab() {
  const { user } = useAuth();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('week'); // 'week', 'month', 'year', 'all'

  useEffect(() => {
    if (user) {
      // Instant local load
      const local = localStorage.getItem(`rhythmrun_runs_${user.uid}`);
      if (local) {
        try {
          const parsed = JSON.parse(local).map(r => ({...r, createdAt: new Date(r.createdAt)}));
          setRuns(parsed);
          setLoading(false);
        } catch(e) {}
      }
      loadRuns();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadRuns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRuns(user.uid);
      setRuns(data);
    } catch (err) {
      console.error('Error loading runs for stats:', err);
      setError(err.message || '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  // Filter runs by time range
  const getFilteredRuns = () => {
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return runs;
    }
    return runs.filter(r => r.createdAt >= startDate);
  };

  const filteredRuns = getFilteredRuns();

  // Aggregate stats
  const totalDistance = filteredRuns.reduce((sum, r) => sum + (r.distance || 0), 0);
  const totalDuration = filteredRuns.reduce((sum, r) => sum + (r.duration || 0), 0);
  const totalRuns = filteredRuns.length;
  const avgPace = totalDistance > 0 ? Math.round(totalDuration / totalDistance) : null;

  const timeRangeOptions = [
    { key: 'week', label: '週' },
    { key: 'month', label: '月' },
    { key: 'year', label: '年' },
    { key: 'all', label: '全部' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary">
        <Loader2 className="animate-spin text-text-secondary" size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary gap-3">
        <p className="text-sm text-error">{error}</p>
        <button onClick={loadRuns} className="px-6 py-2 bg-bg-card text-text-secondary rounded-full text-sm">重試</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="px-5 pt-14 pb-4" style={{ paddingTop: 'calc(var(--safe-area-top) + 3rem)' }}>
        <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>
          統計
        </h1>
      </header>

      {/* Time Range Selector */}
      <div className="px-5 mb-6">
        <div className="flex gap-1 p-1 rounded-xl bg-bg-card">
          {timeRangeOptions.map(opt => (
            <button
              key={opt.key}
              onClick={() => setTimeRange(opt.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                timeRange === opt.key
                  ? 'bg-bg-elevated text-text-primary'
                  : 'text-text-muted'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="card py-5">
            <span className="stat-label block mb-1">總距離</span>
            <div className="flex items-baseline gap-1">
              <span className="stat-value text-3xl text-text-primary">{totalDistance.toFixed(1)}</span>
              <span className="text-xs text-text-muted">km</span>
            </div>
          </div>
          <div className="card py-5">
            <span className="stat-label block mb-1">跑步次數</span>
            <div className="flex items-baseline gap-1">
              <span className="stat-value text-3xl text-text-primary">{totalRuns}</span>
              <span className="text-xs text-text-muted">次</span>
            </div>
          </div>
          <div className="card py-5">
            <span className="stat-label block mb-1">總時間</span>
            <span className="stat-value text-2xl text-text-primary">
              {formatDuration(totalDuration)}
            </span>
          </div>
          <div className="card py-5">
            <span className="stat-label block mb-1">平均配速</span>
            <div className="flex items-baseline gap-1">
              <span className="stat-value text-2xl text-text-primary">{formatPace(avgPace)}</span>
              <span className="text-xs text-text-muted">/km</span>
            </div>
          </div>
        </div>
      </div>

      {/* Distance Chart */}
      <div className="px-5 mb-6">
        <DistanceChart runs={filteredRuns} timeRange={timeRange} />
      </div>

      {/* Pace Chart */}
      <div className="px-5 mb-6">
        <PaceChart runs={filteredRuns} />
      </div>

      {/* Personal Records */}
      <div className="px-5 mb-24">
        <PersonalRecords runs={runs} />
      </div>
    </div>
  );
}
