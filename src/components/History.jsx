import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRuns, deleteRun } from '../services/DatabaseService';
import { ArrowLeft, MapPin, Clock, Trash2, Loader2 } from 'lucide-react';

export default function History() {
  const navigate = useNavigate();
  const { user, authError } = useAuth();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRuns();
    }
  }, [user]);

  const loadRuns = async () => {
    try {
      setLoading(true);
      const data = await getRuns(user.uid);
      setRuns(data);
    } catch (error) {
      console.error("Error loading runs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (runId) => {
    if(window.confirm("Are you sure you want to delete this run?")) {
      try {
        await deleteRun(user.uid, runId);
        setRuns(runs.filter(r => r.id !== runId));
      } catch (error) {
        console.error("Error deleting run:", error);
      }
    }
  }

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('zh-TW', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 relative">
      <header className="px-6 py-4 border-b border-gray-100 flex items-center bg-white z-10 shadow-sm sticky top-0">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-500 rounded-full bg-gray-50">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold text-gray-800 tracking-wide ml-4">Run History</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center h-48 text-gray-400 flex-col gap-2">
            <Loader2 className="animate-spin" size={32} />
            <p>Loading your journeys...</p>
          </div>
        ) : runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-4 mt-12">
            <MapPin size={48} className="text-gray-300" />
            <p className="text-lg">No runs recorded yet.</p>
            <button onClick={() => navigate('/')} className="px-6 py-2 bg-[#E8B4B8] text-white rounded-full font-medium shadow-md">
              Start your first run
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pb-12">
            {runs.map(run => (
              <div key={run.id} className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex justify-between items-center relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#A8D5BA]"></div>
                
                <div className="flex flex-col gap-1 pl-2">
                  <span className="text-xs font-semibold text-gray-400 tracking-wider flex items-center gap-1">
                    <Clock size={12}/> {formatDate(run.createdAt)}
                  </span>
                  <div className="flex items-end gap-1 mt-1">
                    <span className="text-3xl font-bold text-gray-800">{run.distance.toFixed(2)}</span>
                    <span className="text-sm text-gray-500 mb-1 font-medium">km</span>
                  </div>
                </div>
                
                <button onClick={() => handleDelete(run.id)} className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Debug Information Footer */}
      <footer className="px-6 py-4 bg-gray-100 border-t border-gray-200 text-[10px] text-gray-400 font-mono break-all">
        <p>DEBUG INFO</p>
        <p>Current UID: {user?.uid || 'Not authenticated'}</p>
        {authError && <p className="text-red-500 mt-1 font-bold">AUTH ERROR: {authError}</p>}
        <p className="mt-1 opacity-50 italic">If this UID changed from your last session, your history will not be visible.</p>
      </footer>
    </div>
  );
}
