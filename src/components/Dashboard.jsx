import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Settings2, Volume2, VolumeX, ListRestart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { saveRun } from '../services/DatabaseService';

import useRunTracker from '../hooks/useRunTracker';
import useMetronome from '../hooks/useMetronome';
import { startTracking, stopTracking } from '../services/LocationService';
import { speak } from '../services/VoiceService';

// Ensure leafet icon fixes
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { status, distance, coordinates, startRun, pauseRun, resumeRun, stopRun, addLocation } = useRunTracker();
  const { bpm, setBpm, isPlaying: metronomePlaying, toggle: toggleMetronome } = useMetronome(160);
  
  const [currentPos, setCurrentPos] = useState([25.0330, 121.5654]); // Default Taipei 101
  const mapRef = useRef(null);
  const lastAnnouncedKm = useRef(0);

  // Voice Coach effect
  useEffect(() => {
    const currentKm = Math.floor(distance);
    if (currentKm > lastAnnouncedKm.current) {
      lastAnnouncedKm.current = currentKm;
      speak(`已完成 ${currentKm} 公里`);
    }
  }, [distance]);

  // Reset Voice Coach on new run
  useEffect(() => {
    if (status === 'stopped' || status === 'idle') {
      lastAnnouncedKm.current = 0;
    }
  }, [status]);

  useEffect(() => {
    if (status === 'running') {
      startTracking((location) => {
        setCurrentPos([location.latitude, location.longitude]);
        addLocation(location);
      }, (err) => console.error("Tracking Error:", err));
    } else {
      stopTracking();
    }
  }, [status, addLocation]);

  useEffect(() => {
    // Recenter map on user specifically when they are running
    if (mapRef.current && status === 'running') {
      mapRef.current.setView(currentPos, 16);
    }
  }, [currentPos, status]);

  const handleAction = () => {
    if (status === 'idle') {
      speak("開始跑步");
      startRun();
    }
    else if (status === 'running') {
      speak("跑步暫停");
      pauseRun();
    }
    else if (status === 'paused') {
      speak("繼續跑步");
      resumeRun();
    }
    else if (status === 'stopped') {
      speak("開始跑步");
      startRun();
    }
  };

  const handleEndRun = async () => {
    stopRun();
    speak("跑步結束");
    
    // Save to Database mapping distance into the Auth cloud sync
    // Temporarily lowered threshold to 0 for indoor testing
    if (user) {
      try {
        await saveRun(user.uid, {
          distance,
          coordinates
        });
        console.log("[Dashboard] Run saved successfully");
      } catch (error) {
        console.error("[Dashboard] Failed to save run:", error);
        alert("資料儲存失敗: " + (error.message || "請檢查網路或 Firebase 設定"));
      }
    }
    
    navigate('/history');
  };
  
  const polylineCoords = coordinates.map(c => [c.latitude, c.longitude]);
  const displayPace = '--:--'; // Pace calc can be implemented later

  return (
    <div className="flex flex-col h-screen w-full bg-white relative overflow-hidden">
      <header className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10 relative shadow-sm">
        <h1 className="text-xl font-semibold text-gray-800 tracking-wide">RhythmRun</h1>
        <div className="flex gap-4">
          <button onClick={() => navigate('/history')} className="p-2 rounded-full bg-gray-50 text-gray-600 active:bg-gray-100" aria-label="History">
             <ListRestart size={20} />
          </button>
          <button onClick={toggleMetronome} className="p-2 rounded-full bg-gray-50 text-gray-600 active:bg-gray-100">
            {metronomePlaying ? <Volume2 size={20} className="text-[#E8B4B8]" /> : <VolumeX size={20} />}
          </button>
          {(status !== 'idle' && status !== 'stopped') && (
            <button onClick={handleEndRun} className="text-sm font-semibold text-red-500 bg-red-50 px-4 py-1.5 rounded-full hover:bg-red-100 transition-colors">
              End
            </button>
          )}
        </div>
      </header>
      
      <main className="flex-1 relative flex flex-col">
        {/* Map Area */}
        <div data-testid="map-placeholder" className="flex-1 bg-gray-100 z-0 relative">
          <MapContainer 
            center={currentPos} 
            zoom={15} 
            scrollWheelZoom={false} 
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            ref={mapRef}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            {polylineCoords.length > 0 && <Polyline positions={polylineCoords} color="#E8B4B8" weight={6} />}
            <Marker position={currentPos} />
          </MapContainer>
        </div>

        {/* Dashboard Stats / Controls */}
        <div className="bg-white px-6 py-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10 flex flex-col rounded-t-3xl -mt-4">
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
              <span className="text-sm text-gray-400 font-medium tracking-wide">Distance</span>
              <span className="text-4xl font-bold text-gray-800">{distance.toFixed(2)} <span className="text-sm text-gray-400 font-normal">km</span></span>
            </div>
            
            <div className="flex flex-col flex-1 mx-6 relative">
               <div className="flex justify-between items-center mb-1">
                 <span className="text-xs text-gray-400 font-medium tracking-wide flex items-center gap-1"><Settings2 size={12}/> BPM</span>
                 <span className="text-sm font-bold text-gray-600">{bpm}</span>
               </div>
               <input 
                 type="range" min="100" max="220" value={bpm} 
                 onChange={(e) => setBpm(e.target.value)}
                 className="w-full accent-[#E8B4B8]"
               />
            </div>

            <div className="flex flex-col text-right">
              <span className="text-sm text-gray-400 font-medium tracking-wide">Pace</span>
              <span className="text-4xl font-bold text-gray-800">{displayPace} <span className="text-sm text-gray-400 font-normal">/km</span></span>
            </div>
          </div>
          
          <button 
            onClick={handleAction}
            className={`w-full text-white font-semibold rounded-2xl py-4 transition-all duration-300 shadow-lg active:scale-[0.98] ${
              status === 'running' 
              ? 'bg-[#A8D5BA] shadow-[#A8D5BA]/30 hover:bg-[#A8D5BA]/90 text-gray-800' // Sage Green for Pause
              : 'bg-[#E8B4B8] shadow-[#E8B4B8]/30 hover:bg-[#E8B4B8]/90' // Soft Pink for Start
            }`}
          >
            {status === 'idle' && 'Start Run'}
            {status === 'running' && 'Pause'}
            {status === 'paused' && 'Resume'}
            {status === 'stopped' && 'Start New Run'}
          </button>
        </div>
      </main>
    </div>
  );
}
