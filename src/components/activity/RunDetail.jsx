import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings, MAP_STYLES } from '../../context/SettingsContext';
import { getRuns, deleteRun } from '../../services/DatabaseService';
import { ArrowLeft, Trash2, Clock, Zap, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, CircleMarker } from 'react-leaflet';

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

const formatFullDate = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric',
    weekday: 'long', hour: '2-digit', minute: '2-digit'
  }).format(d);
};

export default function RunDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (user) loadRun();
  }, [user, id]);

  const loadRun = async () => {
    try {
      const runs = await getRuns(user.uid);
      const found = runs.find(r => r.id === id);
      setRun(found || null);
    } catch (err) {
      console.error('Error loading run detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteRun(user.uid, id);
      // Show success toast before navigating
      setShowToast(true);
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);
    } catch (err) {
      console.error('Error deleting:', err);
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary">
        <div className="w-8 h-8 rounded-full border-2 border-accent-cyan border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary gap-4">
        <p className="text-text-secondary">找不到此筆記錄</p>
        <button onClick={() => navigate('/')} className="text-accent-cyan text-sm">返回</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-14 pb-4" style={{ paddingTop: 'calc(var(--safe-area-top) + 3rem)' }}>
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-text-secondary active:scale-90 transition-transform">
          <ArrowLeft size={22} />
        </button>
        <button onClick={() => setIsDeleteModalOpen(true)} className="p-2 text-text-muted hover:text-error active:scale-90 transition-all">
          <Trash2 size={20} />
        </button>
      </header>

      {/* Date */}
      <div className="px-5 mb-6">
        <p className="text-sm text-text-secondary">{formatFullDate(run.createdAt)}</p>
      </div>

      {/* Main Stats */}
      <div className="px-5 mb-8">
        <div className="flex items-baseline gap-2">
          <span className="stat-value-xl text-text-primary">
            {(run.distance || 0).toFixed(2)}
          </span>
          <span className="text-lg text-text-secondary font-medium">公里</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="card-elevated text-center py-4">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Clock size={14} className="text-accent-orange" />
              <span className="stat-label">時間</span>
            </div>
            <span className="stat-value text-xl text-text-primary">
              {formatDuration(run.duration)}
            </span>
          </div>
          <div className="card-elevated text-center py-4">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Zap size={14} className="text-accent-cyan" />
              <span className="stat-label">平均配速</span>
            </div>
            <span className="stat-value text-xl text-text-primary">
              {formatPace(run.avgPace)}
            </span>
            <span className="text-[10px] text-text-muted block">/km</span>
          </div>
          <div className="card-elevated text-center py-4">
            <div className="flex items-center justify-center gap-1 mb-2">
              <TrendingDown size={14} className="text-accent-green" />
              <span className="stat-label">分段</span>
            </div>
            <span className="stat-value text-xl text-text-primary">
              {run.splits?.length || 0}
            </span>
            <span className="text-[10px] text-text-muted block">km</span>
          </div>
        </div>
      </div>

      {/* Splits */}
      {run.splits && run.splits.length > 0 && (
        <div className="px-5 mb-8">
          <div className="stat-label mb-3">每公里分段</div>
          <div className="card flex flex-col gap-0 p-0 overflow-hidden">
            {run.splits.map((split, i) => {
              const maxPace = Math.max(...run.splits.map(s => s.pace));
              const barWidth = maxPace > 0 ? (split.pace / maxPace) * 100 : 0;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle last:border-0 relative"
                >
                  <span className="text-xs text-text-muted w-8">{split.km}</span>
                  <div className="flex-1 h-2 rounded-full bg-bg-elevated overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-cyan transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-text-primary w-14 text-right" style={{ fontFamily: 'var(--font-display)' }}>
                    {formatPace(split.pace)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Route Map */}
      {run.coordinates && run.coordinates.length > 2 && (
        <div className="px-5 mb-24">
          <div className="stat-label mb-3">路線紀錄</div>
          <div className="h-64 rounded-2xl overflow-hidden relative border border-border-subtle shadow-sm">
            <RunMap coordinates={run.coordinates} mapStyle={settings.mapStyle} />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
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
                  onClick={handleDelete}
                  className="w-full py-4 bg-error text-white rounded-2xl font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : '確認刪除'}
                </button>
                <button
                  disabled={isDeleting}
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="w-full py-4 bg-bg-elevated text-text-primary rounded-2xl font-bold active:scale-95 transition-all"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[60] animate-bounce-in">
          <div className="bg-success text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-xl">
            <CheckCircle2 size={18} />
            <span className="text-sm font-bold">紀錄已成功刪除</span>
          </div>
        </div>
      )}
    </div>
  );
}

function RunMap({ coordinates, mapStyle }) {
  const positions = useMemo(() => 
    coordinates.map(c => [c.latitude, c.longitude])
  , [coordinates]);

  if (positions.length < 2) return null;

  // Auto-calculate bounds
  const bounds = useMemo(() => {
    const lats = positions.map(p => p[0]);
    const lngs = positions.map(p => p[1]);
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    ];
  }, [positions]);

  const tileUrl = MAP_STYLES[mapStyle.toUpperCase()]?.url || MAP_STYLES.VOYAGER.url;

  return (
    <MapContainer 
      bounds={bounds} 
      zoomControl={false} 
      dragging={true}
      touchZoom={true}
      doubleClickZoom={false}
      scrollWheelZoom={false}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer url={tileUrl} />
      <Polyline
        positions={positions}
        pathOptions={{
          color: mapStyle === 'dark' ? '#00D4AA' : '#FF3B30',
          weight: 4,
          opacity: 0.8,
          lineJoin: 'round',
          lineCap: 'round'
        }}
      />
      {/* Start Dot */}
      <CircleMarker 
        center={positions[0]} 
        radius={5} 
        pathOptions={{ fillColor: '#34C759', color: 'white', weight: 2, fillOpacity: 1 }} 
      />
      {/* End Dot */}
      <CircleMarker 
        center={positions[positions.length - 1]} 
        radius={5} 
        pathOptions={{ fillColor: mapStyle === 'dark' ? '#FFD60A' : '#000', color: 'white', weight: 2, fillOpacity: 1 }} 
      />
    </MapContainer>
  );
}
