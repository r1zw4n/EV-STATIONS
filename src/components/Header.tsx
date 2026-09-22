import React, { useState, useEffect, useRef } from 'react';
import { BatteryCharging, Zap, MapPin, Gauge } from 'lucide-react';
import { ScreenId } from '../types';

const USER_CURRENT_LOCATION_LABEL = 'Current Location: Bras Basah / City Hall, Singapore';

interface HeaderProps {
  activeScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  isGpsActive?: boolean;
  gpsCoords?: { lat: number; lng: number } | null;
  batteryPct: number;
  onBatteryChange: (newPct: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeScreen,
  onSelectScreen,
  isGpsActive = false,
  gpsCoords = null,
  batteryPct,
  onBatteryChange,
}) => {
  const [placeLabel, setPlaceLabel] = useState<string | null>(null);
  const lastFetchedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isGpsActive || !gpsCoords) {
      setPlaceLabel(null);
      lastFetchedKeyRef.current = null;
      return;
    }

    // Call /api/where at most once per GPS fix
    const key = `${gpsCoords.lat.toFixed(3)},${gpsCoords.lng.toFixed(3)}`;
    if (lastFetchedKeyRef.current === key) {
      return;
    }
    lastFetchedKeyRef.current = key;

    let isMounted = true;

    fetch(`/api/where?lat=${gpsCoords.lat}&lng=${gpsCoords.lng}`)
      .then((res) => {
        if (!res.ok) return { label: null };
        return res.json();
      })
      .then((data: { label?: string | null }) => {
        if (isMounted) {
          if (data && typeof data.label === 'string' && data.label.trim()) {
            setPlaceLabel(data.label.trim());
          } else {
            setPlaceLabel(null);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setPlaceLabel(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isGpsActive, gpsCoords?.lat, gpsCoords?.lng]);

  const displayLocation = !isGpsActive
    ? 'City Hall (default)'
    : placeLabel
    ? `Near ${placeLabel}`
    : 'Near you';
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

          {/* Adjustable Battery Percentage Control */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div
              id="battery-adjust-control"
              className="bg-zinc-900 border border-amber-500/40 px-1.5 py-1 rounded-xl flex items-center gap-1 shadow-sm"
            >
              <button
                type="button"
                id="btn-battery-minus"
                aria-label="Decrease battery percentage by 5%"
                disabled={batteryPct <= 5}
                onClick={() => onBatteryChange(Math.max(5, batteryPct - 5))}
                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-100 font-bold text-lg flex items-center justify-center transition-colors cursor-pointer"
              >
                −
              </button>

              <div className="flex items-center gap-1 px-1.5 min-w-[58px] justify-center text-center">
                <BatteryCharging className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                <span className="text-sm font-black text-amber-300 tabular-nums">
                  {batteryPct}%
                </span>
              </div>

              <button
                type="button"
                id="btn-battery-plus"
                aria-label="Increase battery percentage by 5%"
                disabled={batteryPct >= 95}
                onClick={() => onBatteryChange(Math.min(95, batteryPct + 5))}
                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-100 font-bold text-lg flex items-center justify-center transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
            <span className="text-[10px] text-zinc-400 font-medium tracking-tight">
              60 kWh battery, to 100%
            </span>
          </div>
        </div>

        {/* Location banner */}
        <div className="text-xs text-zinc-400 bg-zinc-900/90 rounded-lg px-3 py-1.5 mb-3 border border-zinc-800/80 flex items-center justify-between">
          <span className="truncate font-medium text-zinc-200">
            {displayLocation}
          </span>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded shrink-0 ml-2 border ${
              isGpsActive
                ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/50'
                : 'text-zinc-400 bg-zinc-800 border-zinc-700'
            }`}
          >
            {isGpsActive ? 'GPS Active' : 'Default GPS'}
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
