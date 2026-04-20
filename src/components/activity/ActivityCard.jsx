import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, Clock, Zap, Trash2 } from 'lucide-react';

// Format seconds to MM:SS pace
const formatPace = (secPerKm) => {
  if (!secPerKm || secPerKm <= 0 || secPerKm > 3600) return '--:--';
  const min = Math.floor(secPerKm / 60);
  const sec = Math.floor(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

// Format seconds to HH:MM:SS or MM:SS
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

const formatDate = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('zh-TW', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(date instanceof Date ? date : new Date(date));
};

const formatTime = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date instanceof Date ? date : new Date(date));
};

export default function ActivityCard({ run, onClick, onDelete }) {
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const startX = useRef(0);
  const threshold = 80;

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    
    // Only allow left swipe
    if (diff < 0) {
      setSwipeX(Math.max(diff, -100));
    } else if (isOpen && diff > 0) {
      setSwipeX(-threshold + diff);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (swipeX < -threshold / 2) {
      setSwipeX(-threshold);
      setIsOpen(true);
    } else {
      setSwipeX(0);
      setIsOpen(false);
    }
  };

  // Close swipe on click elsewhere if needed
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        // Optional: auto close after some time
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(run.id);
    setSwipeX(0);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-error group">
      {/* Background action button */}
      <button
        onClick={handleDelete}
        className="absolute right-0 top-0 bottom-0 w-20 flex flex-col items-center justify-center text-white gap-1 active:bg-error/80 transition-colors"
      >
        <Trash2 size={20} />
        <span className="text-[10px] font-bold">刪除</span>
      </button>

      {/* Main Content Layer */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={onClick}
        className="relative z-10 w-full card flex items-center gap-4 active:scale-[0.98] transition-transform duration-200 ease-out cursor-pointer select-none"
        style={{ transform: `translateX(${swipeX}px)` }}
      >
        {/* Left: Mini route visualization */}
        <div className="w-12 h-12 rounded-xl bg-bg-elevated flex items-center justify-center flex-shrink-0">
          {run.coordinates && run.coordinates.length > 2 ? (
            <MiniRoute coordinates={run.coordinates} />
          ) : (
            <Zap size={20} className="text-accent-cyan" />
          )}
        </div>

        {/* Center: Info */}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">
              {formatDate(run.createdAt)}
            </span>
            <span className="text-xs text-text-muted">
              {formatTime(run.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1.5">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>
                {(run.distance || 0).toFixed(2)}
              </span>
              <span className="text-xs text-text-secondary">km</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={12} className="text-text-muted" />
              <span className="text-xs text-text-secondary">
                {formatDuration(run.duration)}
              </span>
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-xs text-text-secondary">
                {formatPace(run.avgPace)}
              </span>
              <span className="text-[10px] text-text-muted">/km</span>
            </div>
          </div>
        </div>

        {/* Right: Chevron */}
        <ChevronRight size={18} className={`text-text-tertiary flex-shrink-0 transition-opacity ${swipeX < 0 ? 'opacity-0' : 'opacity-100'}`} />
      </div>
    </div>
  );
}

// Mini route SVG from coordinates
function MiniRoute({ coordinates }) {
  if (!coordinates || coordinates.length < 2) return null;

  const lats = coordinates.map(c => c.latitude);
  const lngs = coordinates.map(c => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const rangeX = maxLng - minLng || 0.001;
  const rangeY = maxLat - minLat || 0.001;
  const padding = 4;
  const size = 40;

  const points = coordinates.map(c => {
    const x = padding + ((c.longitude - minLng) / rangeX) * (size - padding * 2);
    const y = padding + ((maxLat - c.latitude) / rangeY) * (size - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polyline
        points={points}
        fill="none"
        stroke="#00D4AA"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
