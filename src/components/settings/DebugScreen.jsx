import React, { useState, useEffect } from 'react';
import { CrashLogger } from '../../services/CrashLogger';
import { Trash2, Copy, RefreshCw, ChevronDown, ChevronRight, Bug } from 'lucide-react';

export default function DebugScreen() {
  const [logs, setLogs] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [copied, setCopied] = useState(false);

  const refresh = () => setLogs(CrashLogger.getLogs().reverse());

  useEffect(() => {
    refresh();
    // Auto-refresh every 2s
    const timer = setInterval(refresh, 2000);
    return () => clearInterval(timer);
  }, []);

  const toggleExpand = (id) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const handleClear = () => {
    CrashLogger.clear();
    setLogs([]);
  };

  const handleCopy = async () => {
    const text = CrashLogger.export();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: show alert with text
      alert(text);
    }
  };

  const typeColors = {
    UNCAUGHT_ERROR:    { bg: 'bg-red-500/20',    text: 'text-red-400',    label: '💥 CRASH' },
    UNHANDLED_PROMISE: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: '⚠️ PROMISE' },
    CONSOLE_ERROR:     { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '🔴 ERROR' },
    LOG:               { bg: 'bg-blue-500/10',   text: 'text-blue-400',   label: '📋 LOG' },
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-mono text-xs">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug size={16} className="text-red-400" />
            <span className="font-bold text-sm text-white">Debug Log</span>
            <span className="text-gray-500 text-xs">({logs.length} entries)</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={refresh}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 active:scale-95 transition-all"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                copied ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {copied ? '✓ Copied' : <Copy size={14} />}
            </button>
            <button
              onClick={handleClear}
              className="p-2 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-400 active:scale-95 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex gap-3 mt-2 text-[10px]">
          {['UNCAUGHT_ERROR', 'UNHANDLED_PROMISE', 'CONSOLE_ERROR'].map(type => {
            const count = logs.filter(l => l.type === type).length;
            const style = typeColors[type];
            return count > 0 ? (
              <span key={type} className={`px-2 py-0.5 rounded ${style.bg} ${style.text} font-bold`}>
                {style.label} ×{count}
              </span>
            ) : null;
          })}
          {logs.length === 0 && (
            <span className="text-gray-600">No logs yet. Trigger a crash to see it here.</span>
          )}
        </div>
      </div>

      {/* Log entries */}
      <div className="divide-y divide-white/5">
        {logs.map((log) => {
          const style = typeColors[log.type] || typeColors.LOG;
          const isExp = expanded[log.id];
          const isCrash = log.type === 'UNCAUGHT_ERROR' || log.type === 'UNHANDLED_PROMISE';

          return (
            <div
              key={log.id}
              className={`px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors ${isCrash ? 'border-l-2 border-red-500' : ''}`}
              onClick={() => toggleExpand(log.id)}
            >
              {/* Row header */}
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-gray-600 flex-shrink-0">
                  {isExp ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                    <span className="text-gray-500 text-[10px] flex-shrink-0">
                      {new Date(log.ts).toLocaleTimeString('zh-TW', { hour12: false })}
                    </span>
                  </div>
                  {/* Preview */}
                  <p className={`mt-1 truncate ${isCrash ? 'text-red-300' : 'text-gray-400'}`}>
                    {log.data?.message || log.data?.tag || JSON.stringify(log.data).slice(0, 80)}
                  </p>
                </div>
              </div>

              {/* Expanded detail */}
              {isExp && (
                <div className="mt-3 ml-4 p-3 bg-black/40 rounded-lg border border-white/10 overflow-x-auto">
                  {log.data?.stack && (
                    <div className="mb-2">
                      <div className="text-[10px] text-gray-600 font-bold uppercase mb-1">Stack Trace</div>
                      <pre className="text-[10px] text-red-300 whitespace-pre-wrap break-all leading-relaxed">
                        {log.data.stack}
                      </pre>
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] text-gray-600 font-bold uppercase mb-1">Raw Data</div>
                    <pre className="text-[10px] text-gray-400 whitespace-pre-wrap break-all">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom padding */}
      <div className="h-20" />
    </div>
  );
}
