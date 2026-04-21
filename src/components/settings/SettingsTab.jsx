import React, { useState } from 'react';
import { 
  Globe, Volume2, Map, Info, Bug, ShieldCheck, 
  Wifi, WifiOff, Mail, Lock, UserPlus, LogIn, LogOut, Loader2
} from 'lucide-react';
import { useSettings, MAP_STYLES } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';

export default function SettingsTab() {
  const { settings, updateSettings } = useSettings();
  const { user, login, logout, signupAndLink, authError } = useAuth();
  
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleStyleChange = (styleId) => {
    updateSettings({ mapStyle: styleId });
  };

  const handleIntervalChange = (val) => {
    updateSettings({ voiceInterval: val });
  };

  const handleUnitChange = (unit) => {
    updateSettings({ units: unit });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        await login(email, password);
      } else {
        await signupAndLink(email, password);
      }
      setShowAuthForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary pb-28">
      {/* Header */}
      <header className="px-5 pt-14 pb-4" style={{ paddingTop: 'calc(var(--safe-area-top) + 2rem)' }}>
        <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>
          設定
        </h1>
      </header>

      {/* Account Section - NEW & PREMIUM */}
      <div className="px-5 mb-6">
        <span className="stat-label block mb-3">帳號與同步</span>
        <div className="card p-4 overflow-hidden bg-gradient-to-br from-bg-card to-bg-elevated border-l-4 border-accent-green">
          {!showAuthForm ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-green/20 flex items-center justify-center text-accent-green">
                  {user?.email ? <ShieldCheck size={20} /> : <UserPlus size={20} />}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text-primary">
                    {user?.email ? user.email : '訪客模式 (匿名)'}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {user?.email ? '已開啟雲端永久同步' : '資料僅存在此裝置，建議升級帳號'}
                  </span>
                </div>
              </div>
              {user?.email ? (
                <button 
                  onClick={logout}
                  className="p-2 text-text-muted hover:text-accent-red transition-colors"
                >
                  <LogOut size={18} />
                </button>
              ) : (
                <button 
                  onClick={() => setShowAuthForm(true)}
                  className="px-4 py-2 bg-accent-green text-white text-xs font-bold rounded-lg shadow-lg shadow-accent-green/20"
                >
                  登入 / 註冊
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-accent-green uppercase tracking-wider">
                  {authMode === 'login' ? '會員登入' : '建立永久帳號'}
                </span>
                <button 
                  type="button"
                  onClick={() => setShowAuthForm(false)}
                  className="text-[10px] text-text-muted"
                >
                  取消
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input 
                    type="email" 
                    placeholder="電子郵件"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/20 border border-border-subtle rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-accent-green outline-none transition-all"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input 
                    type="password" 
                    placeholder="密碼"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/20 border border-border-subtle rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-accent-green outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {authError && (
                <p className="text-[10px] text-accent-red bg-accent-red/10 p-2 rounded-lg border border-accent-red/20 italic">
                  {authError}
                </p>
              )}

              <div className="flex flex-col gap-3 pt-2">
                <button 
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 bg-accent-green text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {authLoading ? <Loader2 size={16} className="animate-spin" /> : (authMode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />)}
                  {authMode === 'login' ? '立即登入' : '註冊並遷移資料'}
                </button>
                <button 
                  type="button"
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="text-xs text-text-muted text-center py-1"
                >
                  {authMode === 'login' ? '還沒有帳號？ 按此註冊' : '已經有帳號了？ 按此登入'}
                </button>
              </div>
              
              {authMode === 'signup' && (
                <p className="text-[10px] text-accent-cyan bg-accent-cyan/10 p-2 rounded-lg text-center leading-relaxed">
                   💡 註冊後，您目前的匿名跑步紀錄將會自動隨帳號遷移，永不丟失。
                </p>
              )}
            </form>
          )}
        </div>
      </div>

      {/* Voice Coach */}
      <div className="px-5 mb-6">
        <span className="stat-label block mb-3">語音教練</span>
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-4 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <Volume2 size={18} className="text-accent-cyan" />
              <span className="text-sm text-text-primary">通報間隔</span>
            </div>
            <div className="flex items-center gap-2">
              {[0.5, 1, 2, 5].map(val => (
                <button
                  key={val}
                  onClick={() => handleIntervalChange(val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    settings.voiceInterval === val
                      ? 'bg-accent-cyan text-white'
                      : 'bg-bg-elevated text-text-secondary'
                  }`}
                >
                  {val} km
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-accent-orange" />
              <span className="text-sm text-text-primary">語音語言</span>
            </div>
            <span className="text-sm text-text-secondary">繁體中文</span>
          </div>
        </div>
      </div>

      {/* Units */}
      <div className="px-5 mb-6">
        <span className="stat-label block mb-3">單位</span>
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-sm text-text-primary">距離單位</span>
            <div className="flex gap-1 p-0.5 rounded-lg bg-bg-elevated">
              <button
                onClick={() => handleUnitChange('km')}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  settings.units === 'km' ? 'bg-bg-card text-text-primary' : 'text-text-muted'
                }`}
              >
                公里
              </button>
              <button
                onClick={() => handleUnitChange('mi')}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  settings.units === 'mi' ? 'bg-bg-card text-text-primary' : 'text-text-muted'
                }`}
              >
                英里
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map Style */}
      <div className="px-5 mb-6">
        <span className="stat-label block mb-3">地圖設定</span>
        <div className="card p-0 overflow-hidden">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 px-4 pt-4 pb-2">
              <Map size={18} className="text-accent-green" />
              <span className="text-sm text-text-primary">底圖樣式</span>
            </div>
            <div className="grid grid-cols-3 gap-2 px-4 pb-4">
              {Object.values(MAP_STYLES).map((style) => (
                <button
                  key={style.id}
                  onClick={() => handleStyleChange(style.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    settings.mapStyle === style.id
                      ? 'border-accent-green bg-accent-green/10'
                      : 'border-transparent bg-bg-elevated text-text-secondary'
                  }`}
                >
                  <div className={`w-full h-10 rounded-lg ${
                    style.id === 'voyager' ? 'bg-slate-200' : 
                    style.id === 'standard' ? 'bg-blue-100' : 'bg-slate-900'
                  }`} />
                  <span className="text-[10px] font-bold">{style.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="px-5 mb-8">
        <span className="stat-label block mb-3">關於</span>
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-4 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <Info size={18} className="text-text-muted" />
              <span className="text-sm text-text-primary">RhythmRun</span>
            </div>
            <span className="text-sm text-text-muted">v2.2.0</span>
          </div>
          <div className="px-4 py-4">
            <p className="text-xs text-text-muted leading-relaxed">
              純粹的跑步記錄與分析工具。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
