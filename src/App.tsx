import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Screen1Stations } from './components/Screen1Stations';
import { Screen2Availability } from './components/Screen2Availability';
import { DisqusComments } from './components/DisqusComments';
import { ScreenId } from './types';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('screen1');
  const [selectedPostalCode, setSelectedPostalCode] = useState<string | undefined>(undefined);
  const [selectedStationName, setSelectedStationName] = useState<string | undefined>(undefined);
  const [arrivedFromScreen1, setArrivedFromScreen1] = useState<boolean>(false);
  const [dataProviderTitle, setDataProviderTitle] = useState<string | null>(null);
  const [isGpsActive, setIsGpsActive] = useState<boolean>(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [batteryPct, setBatteryPct] = useState<number>(20);

  const handleGpsStateChange = useCallback(
    (active: boolean, coords?: { lat: number; lng: number } | null) => {
      setIsGpsActive((prev) => (prev === active ? prev : active));
      setGpsCoords((prev) => {
        const nextCoords = active && coords ? coords : null;
        if (!prev && !nextCoords) return prev;
        if (
          prev &&
          nextCoords &&
          prev.lat === nextCoords.lat &&
          prev.lng === nextCoords.lng
        ) {
          return prev;
        }
        return nextCoords;
      });
    },
    []
  );

  const handleNavigateToScreen2 = (
    _stationId?: string,
    postcode?: string,
    stationTitle?: string
  ) => {
    setSelectedPostalCode(postcode ? postcode.trim() : '');
    setSelectedStationName(stationTitle);
    setArrivedFromScreen1(true);
    setActiveScreen('screen2');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToScreen1 = () => {
    setActiveScreen('screen1');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-black flex flex-col justify-between">
      <div>
        {/* Top Header & Navigation */}
        <Header
          activeScreen={activeScreen}
          isGpsActive={isGpsActive}
          gpsCoords={gpsCoords}
          batteryPct={batteryPct}
          onBatteryChange={setBatteryPct}
          onSelectScreen={(screen) => {
            if (screen === 'screen2') {
              setArrivedFromScreen1(false);
              setSelectedStationName(undefined);
            }
            setActiveScreen(screen);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        {/* Main Container - Optimized for mobile view at arm's length */}
        <main className="max-w-xl mx-auto px-4 pt-4 pb-28">
          {activeScreen === 'screen1' ? (
            <>
              <Screen1Stations
                onNavigateToScreen2={handleNavigateToScreen2}
                onDataProviderLoaded={setDataProviderTitle}
                onGpsStateChange={handleGpsStateChange}
                batteryPct={batteryPct}
              />
              <DisqusComments />
            </>
          ) : (
            <Screen2Availability
              initialPostalCode={selectedPostalCode}
              stationName={selectedStationName}
              arrivedFromScreen1={arrivedFromScreen1}
              onNavigateToScreen1={handleNavigateToScreen1}
            />
          )}
        </main>
      </div>

      {/* Bottom Sticky Bar with Open Charge Map and LTA DataMall License Attribution */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-zinc-950/95 backdrop-blur border-t border-zinc-800/80 py-2.5 px-4">
        <div className="max-w-xl mx-auto space-y-1.5">
          {/* Quick status bar */}
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="font-medium text-zinc-300">EV STATIONS</span>
            </div>
            <div className="flex items-center gap-1 font-semibold text-emerald-400">
              <span id="footer-battery-status">Battery: {batteryPct}%</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">Singapore</span>
            </div>
          </div>

          {/* Attribution */}
          <div className="pt-1.5 border-t border-zinc-800/60 text-center space-y-0.5">
            <p className="text-[10px] sm:text-[11px] text-zinc-400 leading-tight">
              • Live-Availability Data — LTA DataMall (SG Open Data Licence)
            </p>
            <p className="text-[10px] sm:text-[11px] text-zinc-400 leading-tight">
              • Location Data — © Open Charge Map Contributors
            </p>
            <p className="text-[10px] sm:text-[11px] text-zinc-400 leading-tight">
              • Place Names — © OpenStreetMap contributors
            </p>
            <p className="text-[10px] sm:text-[11px] text-zinc-400 leading-tight pt-1">
              This page uses Microsoft Clarity and Disqus, which use cookies to record how visitors use the site and to host comments. By using this page you agree that we and Microsoft may collect and use this data. See the{' '}
              <a
                href="https://www.microsoft.com/privacy/privacystatement"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-zinc-200"
              >
                Microsoft Privacy Statement
              </a>
              , the{' '}
              <a
                href="https://disqus.com/privacy-policy/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-zinc-200"
              >
                Disqus privacy policy
              </a>{' '}
              and the{' '}
              <a
                href="https://disqus.com/data-sharing-settings/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-zinc-200"
              >
                Disqus data sharing settings
              </a>
              .
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
