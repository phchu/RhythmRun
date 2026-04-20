import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RunProvider } from './context/RunContext';
import { RhythmProvider } from './context/RhythmContext';
import { SettingsProvider } from './context/SettingsContext';
import AppShell from './components/layout/AppShell';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <RunProvider>
            <RhythmProvider>
              <AppShell />
            </RhythmProvider>
          </RunProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
