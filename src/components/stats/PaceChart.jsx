import React, { useMemo } from 'react';

const formatPace = (secPerKm) => {
  if (!secPerKm || secPerKm <= 0) return '';
  const min = Math.floor(secPerKm / 60);
  const sec = Math.floor(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

export default function PaceChart({ runs }) {
  const chartData = useMemo(() => {
    return runs
      .filter(r => r.avgPace && r.avgPace > 0 && r.avgPace < 1200)
      .sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateA - dateB;
      })
      .slice(-10) // Last 10 runs
      .map(r => ({
        pace: r.avgPace,
        date: r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt),
        distance: r.distance || 0,
      }));
  }, [runs]);

  if (chartData.length < 2) {
    return (
      <div className="card py-8 flex items-center justify-center">
        <p className="text-sm text-text-muted">需要至少 2 次跑步才能顯示配速趨勢</p>
      </div>
    );
  }

  const paces = chartData.map(d => d.pace);
  const minPace = Math.min(...paces);
  const maxPace = Math.max(...paces);
  const range = maxPace - minPace || 60;
  const padding = 20;
  const w = 300;
  const h = 100;

  // Build SVG path
  const points = chartData.map((d, i) => {
    const x = padding + (i / (chartData.length - 1)) * (w - padding * 2);
    // Invert Y because lower pace = better = higher on chart
    const y = padding + ((d.pace - minPace) / range) * (h - padding * 2);
    return { x, y };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Area fill path
  const areaPath = pathD + ` L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`;

  return (
    <div className="card">
      <span className="stat-label block mb-4">配速趨勢</span>
      <svg width="100%" viewBox={`0 0 ${w} ${h + 24}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="paceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF375F" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FF375F" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <path d={areaPath} fill="url(#paceGradient)" />
        {/* Line */}
        <path d={pathD} fill="none" stroke="#FF375F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3" fill="#FF375F" />
            <text
              x={p.x}
              y={h + 16}
              textAnchor="middle"
              fill="#636366"
              fontSize="8"
              fontFamily="var(--font-display)"
            >
              {`${chartData[i].date.getMonth() + 1}/${chartData[i].date.getDate()}`}
            </text>
          </g>
        ))}
        {/* Y-axis labels (pace) */}
        <text x={4} y={padding + 4} fill="#8E8E93" fontSize="8" fontFamily="var(--font-display)">
          {formatPace(minPace)}
        </text>
        <text x={4} y={h - padding + 4} fill="#8E8E93" fontSize="8" fontFamily="var(--font-display)">
          {formatPace(maxPace)}
        </text>
      </svg>
      <div className="flex justify-between mt-2">
        <span className="text-[10px] text-text-muted">較快 ↑</span>
        <span className="text-[10px] text-text-muted">較慢 ↓</span>
      </div>
    </div>
  );
}
