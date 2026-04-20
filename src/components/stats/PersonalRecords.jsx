import React, { useMemo } from 'react';
import { Trophy, Zap, Timer, Route } from 'lucide-react';

const formatPace = (secPerKm) => {
  if (!secPerKm || secPerKm <= 0 || secPerKm > 3600) return '--:--';
  const min = Math.floor(secPerKm / 60);
  const sec = Math.floor(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

export default function PersonalRecords({ runs }) {
  const records = useMemo(() => {
    if (runs.length === 0) return null;

    // Longest run
    const longestRun = runs.reduce((best, r) =>
      (r.distance || 0) > (best?.distance || 0) ? r : best, null
    );

    // Fastest pace (lowest avgPace, but > 0)
    const fastestPace = runs
      .filter(r => r.avgPace && r.avgPace > 0)
      .reduce((best, r) =>
        !best || r.avgPace < best.avgPace ? r : best, null
      );

    // Longest duration
    const longestDuration = runs.reduce((best, r) =>
      (r.duration || 0) > (best?.duration || 0) ? r : best, null
    );

    // Most recent best km splits from all runs
    const bestSplits = {};
    runs.forEach(run => {
      if (!run.splits) return;
      run.splits.forEach(split => {
        if (!bestSplits[split.km] || split.pace < bestSplits[split.km].pace) {
          bestSplits[split.km] = { ...split, date: run.createdAt };
        }
      });
    });

    return { longestRun, fastestPace, longestDuration, bestSplits };
  }, [runs]);

  if (!records) {
    return (
      <div className="card py-8 flex items-center justify-center">
        <p className="text-sm text-text-muted">開始跑步來建立個人紀錄</p>
      </div>
    );
  }

  const prItems = [
    {
      icon: Route,
      color: 'text-accent-cyan',
      label: '最長距離',
      value: records.longestRun ? `${records.longestRun.distance.toFixed(2)} km` : '--',
    },
    {
      icon: Zap,
      color: 'text-accent-pink',
      label: '最快配速',
      value: records.fastestPace ? `${formatPace(records.fastestPace.avgPace)} /km` : '--',
    },
    {
      icon: Timer,
      color: 'text-accent-orange',
      label: '最長時間',
      value: records.longestDuration ? formatLongDuration(records.longestDuration.duration) : '--',
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={16} className="text-accent-yellow" />
        <span className="stat-label">個人紀錄</span>
      </div>
      <div className="flex flex-col gap-3">
        {prItems.map((item, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center">
              <item.icon size={18} className={item.color} />
            </div>
            <div className="flex-1">
              <span className="text-xs text-text-muted">{item.label}</span>
              <p className="text-lg font-bold text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatLongDuration(totalSec) {
  if (!totalSec) return '--';
  const hrs = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  const sec = Math.floor(totalSec % 60);
  if (hrs > 0) return `${hrs}h ${min}m ${sec}s`;
  return `${min}m ${sec}s`;
}
