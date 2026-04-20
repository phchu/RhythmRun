import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const MAP_STYLES = {
  VOYAGER: {
    id: 'voyager',
    name: '淺色質感',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
  },
  STANDARD: {
    id: 'standard',
    name: '標準彩色',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  },
  DARK: {
    id: 'dark',
    name: '暗色美學',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
  }
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('rhythmrun_settings');
    return saved ? JSON.parse(saved) : {
      mapStyle: 'voyager',
      voiceInterval: 1,
      units: 'km'
    };
  });

  useEffect(() => {
    localStorage.setItem('rhythmrun_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
