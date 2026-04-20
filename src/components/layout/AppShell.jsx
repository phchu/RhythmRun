import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TabBar from './TabBar';
import ActivityTab from '../activity/ActivityTab';
import StatsTab from '../stats/StatsTab';
import RunTab from '../run/RunTab';
import RunActive from '../run/RunActive';
import RunSummary from '../run/RunSummary';
import RunDetail from '../activity/RunDetail';
import RhythmTab from '../rhythm/RhythmTab';
import SettingsTab from '../settings/SettingsTab';

export default function AppShell() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-bg-primary">
      <main className="flex-1 pb-20">
        <Routes>
          <Route path="/" element={<ActivityTab />} />
          <Route path="/stats" element={<StatsTab />} />
          <Route path="/run" element={<RunTab />} />
          <Route path="/run/active" element={<RunActive />} />
          <Route path="/run/summary" element={<RunSummary />} />
          <Route path="/activity/:id" element={<RunDetail />} />
          <Route path="/rhythm" element={<RhythmTab />} />
          <Route path="/settings" element={<SettingsTab />} />
        </Routes>
      </main>
      <TabBar />
    </div>
  );
}
