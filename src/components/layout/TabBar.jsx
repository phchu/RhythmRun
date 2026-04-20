import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Activity, BarChart3, Play, Music, Settings } from 'lucide-react';

const tabs = [
  { id: 'activity', path: '/', icon: Activity, label: '活動' },
  { id: 'stats', path: '/stats', icon: BarChart3, label: '統計' },
  { id: 'run', path: '/run', icon: Play, label: '跑步', isCenter: true },
  { id: 'rhythm', path: '/rhythm', icon: Music, label: '節奏' },
  { id: 'settings', path: '/settings', icon: Settings, label: '設定' },
];

export default function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide tab bar during active run
  const isRunning = location.pathname === '/run/active';
  if (isRunning) return null;

  // Hide on detail pages
  const isDetailPage = location.pathname.startsWith('/run/') && location.pathname !== '/run';
  if (isDetailPage) return null;

  return (
    <nav className="tab-bar fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'var(--safe-area-bottom)' }}>
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = tab.path === '/' 
            ? location.pathname === '/' 
            : location.pathname.startsWith(tab.path);
          const Icon = tab.icon;

          if (tab.isCenter) {
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className="relative flex flex-col items-center justify-center -mt-4"
                aria-label={tab.label}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive 
                    ? 'bg-accent-red glow-red' 
                    : 'bg-bg-elevated'
                }`}>
                  <Icon size={24} className={isActive ? 'text-white' : 'text-text-secondary'} />
                </div>
                <span className={`text-[10px] mt-1 font-medium transition-colors duration-200 ${
                  isActive ? 'text-accent-red' : 'text-text-secondary'
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center gap-0.5 py-2 px-3 transition-all duration-200"
              aria-label={tab.label}
            >
              <Icon 
                size={22} 
                className={`transition-colors duration-200 ${
                  isActive ? 'text-white' : 'text-text-secondary'
                }`}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className={`text-[10px] font-medium transition-colors duration-200 ${
                isActive ? 'text-white' : 'text-text-secondary'
              }`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-0 w-1 h-1 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
