import React, { useState } from 'react';
import { Header } from './components/Header';
import { Screen1Stations } from './components/Screen1Stations';
import { Screen2Availability } from './components/Screen2Availability';
import { ScreenId } from './types';
import { INVENTED_CHARGING_STATIONS } from './chargingData';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('screen1');
  const [selectedStationId, setSelectedStationId] = useState<string | undefined>(undefined);

  const handleNavigateToScreen2 = (stationId?: string) => {
    setSelectedStationId(stationId);
    setActiveScreen('screen2');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToScreen1 = () => {
    setActiveScreen('screen1');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Header & Navigation */}
      <Header
        activeScreen={activeScreen}
        onSelectScreen={(screen) => {
          setActiveScreen(screen);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Container - Optimized for mobile view at arm's length */}
      <main className="max-w-xl mx-auto px-4 pt-4">
        {activeScreen === 'screen1' ? (
          <Screen1Stations
            stations={INVENTED_CHARGING_STATIONS}
            onNavigateToScreen2={handleNavigateToScreen2}
          />
        ) : (
          <Screen2Availability
            stations={INVENTED_CHARGING_STATIONS}
            initialSelectedStationId={selectedStationId}
            onNavigateToScreen1={handleNavigateToScreen1}
          />
        )}
      </main>

      {/* Bottom Sticky Quick Toggle Bar for Phone Ergonomics */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-zinc-950/95 backdrop-blur border-t border-zinc-800/80 py-2.5 px-4">
        <div className="max-w-xl mx-auto flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-medium text-zinc-300">EV STATIONS</span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-emerald-400">
            <span>Battery: 20%</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">Singapore</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
