import React from 'react';
import { TrendingUp, Timer, Footprints } from 'lucide-react';

const formatDuration = (totalSec) => {
  if (!totalSec || totalSec <= 0) return '0:00';
  const hrs = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${min}m`;
  return `${min}m`;
};

export default function WeeklySummary({ stats }) {
  return (
    <div className="px-4 mb-4">
      <div className="card">
        <div className="stat-label mb-3">本週統計</div>
        <div className="flex justify-between items-end">
          {/* Distance */}
          <div className="flex flex-col">
            <span className="stat-value text-3xl text-text-primary">
              {stats.totalDistance.toFixed(1)}
            </span>
            <span className="text-xs text-text-muted mt-1">公里</span>
          </div>

          {/* Count */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <Footprints size={14} className="text-accent-cyan" />
              <span className="stat-value text-xl text-text-primary">
                {stats.count}
              </span>
            </div>
            <span className="text-xs text-text-muted mt-1">次跑步</span>
          </div>

          {/* Duration */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1">
              <Timer size={14} className="text-accent-orange" />
              <span className="stat-value text-xl text-text-primary">
                {formatDuration(stats.totalDuration)}
              </span>
            </div>
            <span className="text-xs text-text-muted mt-1">總時間</span>
          </div>
        </div>

        {/* Progress bar showing weekly distance towards a simple goal */}
        <div className="mt-4 h-1.5 rounded-full bg-bg-elevated overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-green transition-all duration-500"
            style={{ width: `${Math.min((stats.totalDistance / 20) * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-text-muted">週跑量</span>
          <span className="text-[10px] text-text-muted">20 km 目標</span>
        </div>
      </div>
    </div>
  );
}
