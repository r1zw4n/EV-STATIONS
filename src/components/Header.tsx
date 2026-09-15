import React from 'react';
import { BatteryCharging, Zap, MapPin, Gauge } from 'lucide-react';
import { ScreenId } from '../types';
import { USER_CURRENT_BATTERY_PCT, USER_CURRENT_LOCATION_LABEL } from '../chargingData';

interface HeaderProps {
  activeScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeScreen, onSelectScreen }) => {
  return (
    <header className="w-full bg-zinc-950 border-b border-zinc-800 sticky top-0 z-30 shadow-lg">
      <div className="max-w-xl mx-auto px-4 pt-4 pb-3">
        {/* App Title Bar */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {/* EV Stations Logo */}
            <div
              id="app-logo"
              className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400/20 via-emerald-500/15 to-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-md shadow-emerald-950/50"
            >
              <Zap className="w-6 h-6 fill-emerald-400/30 text-emerald-400" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
                EV STATIONS
              </h1>
              <p className="text-xs text-zinc-400 font-medium flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Singapore EV Network</span>
              </p>
            </div>
          </div>

          {/* Battery Status Pill */}
          <div className="bg-zinc-900 border border-amber-500/40 px-3 py-1.5 rounded-full flex items-center gap-2 shrink-0">
            <div className="relative flex items-center justify-center">
              <BatteryCharging className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <div className="text-right">
              <span className="text-xs uppercase font-semibold tracking-wider text-zinc-400 block leading-none">
                Battery
              </span>
              <span className="text-sm font-bold text-amber-400 leading-none">
                {USER_CURRENT_BATTERY_PCT}%
              </span>
            </div>
          </div>
        </div>

        {/* Location banner */}
        <div className="text-xs text-zinc-400 bg-zinc-900/90 rounded-lg px-3 py-1.5 mb-3 border border-zinc-800/80 flex items-center justify-between">
          <span className="truncate">{USER_CURRENT_LOCATION_LABEL}</span>
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded shrink-0 ml-2">
            GPS Active
          </span>
        </div>

        {/* Screen Navigation Tabs */}
        <nav
          aria-label="Screens"
          className="grid grid-cols-2 gap-2 bg-zinc-900/90 p-1.5 rounded-xl border border-zinc-800"
        >
          <button
            type="button"
            id="tab-screen1"
            onClick={() => onSelectScreen('screen1')}
            className={`min-h-[48px] px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeScreen === 'screen1'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Gauge className="w-4 h-4 shrink-0" />
            <span>1. Nearest & Speeds</span>
          </button>

          <button
            type="button"
            id="tab-screen2"
            onClick={() => onSelectScreen('screen2')}
            className={`min-h-[48px] px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeScreen === 'screen2'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Zap className="w-4 h-4 shrink-0" />
            <span>2. Available Points</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
