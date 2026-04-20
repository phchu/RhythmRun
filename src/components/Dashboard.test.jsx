import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { AuthProvider } from '../context/AuthContext';

// Mock Leaflet since it requires window/DOM elements that JSDOM struggles with
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Polyline: () => <div data-testid="polyline" />,
  Marker: () => <div data-testid="marker" />
}));

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'test-uid' } }),
  AuthProvider: ({ children }) => <div>{children}</div>
}));

describe('Dashboard Component', () => {
  it('renders the Dashboard header accurately', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    expect(screen.getByText('RhythmRun')).toBeInTheDocument();
  });

  it('contains the interactive button', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    const startBtn = screen.getByText(/Start Run/i);
    expect(startBtn).toBeInTheDocument();
  });
});
