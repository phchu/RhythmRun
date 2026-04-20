import React, { useMemo } from 'react';

export default function DistanceChart({ runs, timeRange }) {
  const chartData = useMemo(() => {
    if (runs.length === 0) return [];

    // Group runs by day/week/month based on time range
    const grouped = {};

    runs.forEach(run => {
      const date = run.createdAt instanceof Date ? run.createdAt : new Date(run.createdAt);
      let key;

      if (timeRange === 'year') {
        // Group by month
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (timeRange === 'month') {
        // Group by week
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
      } else {
        // Group by day
        key = `${date.getMonth() + 1}/${date.getDate()}`;
      }

      if (!grouped[key]) {
        grouped[key] = { label: key, distance: 0 };
      }
      grouped[key].distance += run.distance || 0;
    });

    return Object.values(grouped).slice(-7); // Show last 7 data points
  }, [runs, timeRange]);

  if (chartData.length === 0) {
    return (
      <div className="card py-8 flex items-center justify-center">
        <p className="text-sm text-text-muted">尚無數據</p>
      </div>
    );
  }

  const maxDistance = Math.max(...chartData.map(d => d.distance), 1);

  return (
    <div className="card">
      <span className="stat-label block mb-4">跑量趨勢</span>
      <div className="flex items-end justify-between gap-2 h-32">
        {chartData.map((item, i) => {
          const heightPercent = (item.distance / maxDistance) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-[10px] text-text-secondary" style={{ fontFamily: 'var(--font-display)' }}>
                {item.distance > 0 ? item.distance.toFixed(1) : ''}
              </span>
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-accent-cyan/60 to-accent-cyan transition-all duration-500"
                  style={{
                    height: `${Math.max(heightPercent, 2)}%`,
                    animationDelay: `${i * 0.08}s`,
                  }}
                />
              </div>
              <span className="text-[10px] text-text-muted truncate max-w-full">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
