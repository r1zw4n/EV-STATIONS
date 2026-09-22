import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Compass,
  Zap,
  Clock,
  MapPin,
  ChevronRight,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Info,
  Layers,
} from 'lucide-react';
import { LiveStation, LiveStationsApiResponse } from '../types';

const CITY_HALL_COORDS = { lat: 1.3521, lng: 103.8198 };
const GEOLOCATION_TIMEOUT_MS = 6000;

interface Screen1Props {
  onNavigateToScreen2: (stationId?: string, postcode?: string) => void;
  onDataProviderLoaded?: (providerTitle: string | null) => void;
  onGpsStateChange?: (isGpsActive: boolean) => void;
  batteryPct?: number;
}

type FetchState = 'loading' | 'empty' | 'refused' | 'unreachable' | 'success';

export const Screen1Stations: React.FC<Screen1Props> = ({
  onNavigateToScreen2,
  onDataProviderLoaded,
  onGpsStateChange,
  batteryPct = 20,
}) => {
  const [stations, setStations] = useState<LiveStation[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLocationDeniedOrTimedOut, setIsLocationDeniedOrTimedOut] = useState<boolean>(false);
  const [currentCoords, setCurrentCoords] = useState(CITY_HALL_COORDS);

  // Store whether a geolocation attempt is actively resolving
  const locationResolutionRef = useRef<boolean>(false);

  // Calculate estimated finish charging time based on batteryPct and live PowerKW
  // energy needed = ([TARGET]% − battery%) of a [60] kWh battery, time = energy ÷ live kW × 60
  const calculateChargeTime = (powerKw: number | null, currentBattery: number) => {
    const targetPct = 100;
    const clampedBattery = Math.min(Math.max(currentBattery, 5), 95);
    const energyNeededKwh = ((targetPct - clampedBattery) / 100) * 60;

    if (!powerKw || powerKw <= 0) {
      const fallbackMinutes = Math.max(1, Math.round((energyNeededKwh / 22) * 60));
      const hours = Math.floor(fallbackMinutes / 60);
      const mins = fallbackMinutes % 60;
      const formatted = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim() : `${fallbackMinutes}m`;
      return {
        minutes: fallbackMinutes,
        timeDisplay: `est. ~${formatted}`,
        speedDisplay: 'Unlisted kW',
        isEstimated: true,
        energyNeededKwh,
      };
    }

    const totalMinutes = Math.max(1, Math.round((energyNeededKwh / powerKw) * 60));

    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return {
        minutes: totalMinutes,
        timeDisplay: `est. ${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim(),
        speedDisplay: `${powerKw} kW`,
        isEstimated: false,
        energyNeededKwh,
      };
    }

    return {
      minutes: totalMinutes,
      timeDisplay: `est. ${totalMinutes}m`,
      speedDisplay: `${powerKw} kW`,
      isEstimated: false,
      energyNeededKwh,
    };
  };

  const fetchLiveStations = useCallback(
    async (lat: number, lng: number) => {
      setFetchState('loading');
      setErrorMessage('');

      try {
        // Calls our serverless function at /api/stations with lat and lng
        const res = await fetch(`/api/stations?lat=${lat}&lng=${lng}`);

        // Check HTTP status before reading body
        if (res.status === 503 || res.status === 401 || res.status === 403) {
          setFetchState('refused');
          try {
            const errData: LiveStationsApiResponse = await res.json();
            if (errData.error) setErrorMessage(errData.error);
          } catch {
            // Keep generic refused sentence
          }
          return;
        }

        if (!res.ok) {
          setFetchState('refused');
          try {
            const errData: LiveStationsApiResponse = await res.json();
            if (errData.error) setErrorMessage(errData.error);
          } catch {
            // Keep generic refused sentence
          }
          return;
        }

        const data: LiveStationsApiResponse = await res.json();

        if (data.refused) {
          setFetchState('refused');
          if (data.error) setErrorMessage(data.error);
          return;
        }

        if (data.unreachable) {
          setFetchState('unreachable');
          if (data.error) setErrorMessage(data.error);
          return;
        }

        const stationList = Array.isArray(data.stations) ? data.stations : [];

        if (stationList.length === 0) {
          setFetchState('empty');
          return;
        }

        setStations(stationList.slice(0, 3));
        setFetchState('success');

        if (onDataProviderLoaded) {
          onDataProviderLoaded(data.dataProviderTitle || stationList[0]?.dataProviderTitle || null);
        }
      } catch {
        // Network failure, fetch failed, or serverless endpoint not responding
        setFetchState('unreachable');
      }
    },
    [onDataProviderLoaded]
  );

  const requestLocationAndFetch = useCallback(() => {
    locationResolutionRef.current = true;
    let resolved = false;

    // Timer to enforce fallback within N seconds if browser prompt is pending or unresolved
    const timerId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        locationResolutionRef.current = false;
        setIsLocationDeniedOrTimedOut(true);
        setCurrentCoords(CITY_HALL_COORDS);
        if (onGpsStateChange) onGpsStateChange(false);
        fetchLiveStations(CITY_HALL_COORDS.lat, CITY_HALL_COORDS.lng);
      }
    }, GEOLOCATION_TIMEOUT_MS);

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (resolved) return;
          resolved = true;
          clearTimeout(timerId);
          locationResolutionRef.current = false;

          const realLat = position.coords.latitude;
          const realLng = position.coords.longitude;

          setIsLocationDeniedOrTimedOut(false);
          setCurrentCoords({ lat: realLat, lng: realLng });
          if (onGpsStateChange) onGpsStateChange(true);

          fetchLiveStations(realLat, realLng);
        },
        (error) => {
          if (resolved) return;
          resolved = true;
          clearTimeout(timerId);
          locationResolutionRef.current = false;

          console.warn('Geolocation access denied or unavailable:', error?.message);
          setIsLocationDeniedOrTimedOut(true);
          setCurrentCoords(CITY_HALL_COORDS);
          if (onGpsStateChange) onGpsStateChange(false);

          fetchLiveStations(CITY_HALL_COORDS.lat, CITY_HALL_COORDS.lng);
        },
        {
          enableHighAccuracy: true,
          timeout: GEOLOCATION_TIMEOUT_MS,
          maximumAge: 60000,
        }
      );
    } else {
      resolved = true;
      clearTimeout(timerId);
      locationResolutionRef.current = false;
      setIsLocationDeniedOrTimedOut(true);
      setCurrentCoords(CITY_HALL_COORDS);
      if (onGpsStateChange) onGpsStateChange(false);
      fetchLiveStations(CITY_HALL_COORDS.lat, CITY_HALL_COORDS.lng);
    }
  }, [fetchLiveStations, onGpsStateChange]);

  useEffect(() => {
    requestLocationAndFetch();
  }, [requestLocationAndFetch]);

  return (
    <section className="w-full pb-10" aria-label="Nearest Charging Stations">
      {/* Geolocation fallback banner if denied or timed out */}
      {isLocationDeniedOrTimedOut && (
        <div
          id="location-fallback-banner"
          className="mb-4 bg-zinc-900/90 border border-amber-500/40 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <span>[Allow Location Access (Default:CityHall)]</span>
          </div>
          <button
            type="button"
            id="btn-retry-location"
            onClick={requestLocationAndFetch}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0 min-h-[44px] sm:min-h-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try again</span>
          </button>
        </div>
      )}

      {/* 1. Case: The data is loading */}
      {fetchState === 'loading' && (
        <div
          id="status-loading"
          className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 text-center my-4 shadow-sm"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <p className="text-base font-semibold text-zinc-100 leading-relaxed max-w-md mx-auto">
            Retrieving the nearest EV charging stations from Open Charge Map...
          </p>
          <p className="text-xs text-zinc-400 mt-2">
            Targeting Singapore region coordinates ({currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)})
          </p>
        </div>
      )}

      {/* 2. Case: The data is empty */}
      {fetchState === 'empty' && (
        <div
          id="status-empty"
          className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 text-center my-4 shadow-sm"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
            <Info className="w-6 h-6" />
          </div>
          <p className="text-base font-semibold text-zinc-200 leading-relaxed max-w-md mx-auto">
            No EV charging stations were found within 10 km of your selected Singapore location.
          </p>
          <button
            type="button"
            onClick={() => fetchLiveStations(currentCoords.lat, currentCoords.lng)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Search</span>
          </button>
        </div>
      )}

      {/* 3. Case: The upstream refused */}
      {fetchState === 'refused' && (
        <div
          id="status-refused"
          className="bg-zinc-900/90 border border-amber-500/40 rounded-2xl p-6 text-center my-4 shadow-sm"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-base font-semibold text-amber-200 leading-relaxed max-w-md mx-auto">
            The Open Charge Map service refused the request because the API key is missing, invalid, or unauthorized.
          </p>
          {errorMessage && (
            <p className="text-xs text-zinc-400 mt-2 font-mono bg-zinc-950/80 px-3 py-1.5 rounded-lg border border-zinc-800 inline-block max-w-full truncate">
              {errorMessage}
            </p>
          )}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => fetchLiveStations(currentCoords.lat, currentCoords.lng)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-bold text-amber-300 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Request</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Case: The upstream is unreachable */}
      {fetchState === 'unreachable' && (
        <div
          id="status-unreachable"
          className="bg-zinc-900/90 border border-red-500/40 rounded-2xl p-6 text-center my-4 shadow-sm"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-base font-semibold text-red-200 leading-relaxed max-w-md mx-auto">
            Unable to connect to Open Charge Map; the charging registry is currently unreachable.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => fetchLiveStations(currentCoords.lat, currentCoords.lng)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-xs font-bold text-red-300 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Check Connection & Retry</span>
            </button>
          </div>
        </div>
      )}

      {/* Live 3 Station Cards */}
      {fetchState === 'success' && (
        <div className="space-y-4">
          {stations.map((station, index) => {
            const chargeCalc = calculateChargeTime(station.highestPowerKW, batteryPct);
            const isTopMatch = index === 0;

            const isTitleSameAsAddress = Boolean(
              station.title &&
                station.addressLine &&
                station.title.trim().toLowerCase() === station.addressLine.trim().toLowerCase()
            );

            const addressParts = isTitleSameAsAddress
              ? [station.town]
              : [station.addressLine, station.addressLine !== station.town ? station.town : null];

            const addressText = addressParts.filter(Boolean).join(', ') || 'Singapore';

            return (
              <article
                key={station.id}
                id={`station-card-${station.id}`}
                className={`bg-zinc-900/90 rounded-2xl p-4 border transition-all relative ${
                  isTopMatch
                    ? 'border-emerald-500/60 shadow-lg shadow-emerald-950/40 bg-gradient-to-b from-zinc-900 to-zinc-950'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Badge for Rank / Recommendation */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-200 text-xs font-bold flex items-center justify-center border border-zinc-700">
                      #{index + 1}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {station.town || 'Singapore'}
                    </span>
                  </div>

                  {isTopMatch && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-600/50 px-2.5 py-0.5 rounded-full">
                      <Sparkles className="w-3 h-3" />
                      Closest to You
                    </span>
                  )}
                </div>

                {/* Station Name & Address from Live Data */}
                <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                  {station.title}
                </h3>
                <p className="text-xs text-zinc-400 flex items-start gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{addressText}</span>
                </p>

                {/* Primary EV Metrics Grid with LIVE PowerKW & calculated charge time */}
                <div className="grid grid-cols-2 gap-2.5 my-3.5">
                  {/* Distance & Live PowerKW Box */}
                  <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-3">
                    <div className="text-[11px] font-semibold uppercase text-zinc-400 mb-1 flex items-center gap-1">
                      <Compass className="w-3 h-3 text-emerald-400" />
                      Distance & Speed
                    </div>
                    <div className="text-lg font-black text-white leading-none">
                      {station.distance !== null ? `${station.distance}` : '—'}{' '}
                      <span className="text-xs font-semibold text-zinc-400">km away</span>
                    </div>
                    <div className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                      <Zap className="w-3 h-3 fill-emerald-400" />
                      {chargeCalc.speedDisplay}
                    </div>
                  </div>

                  {/* Calculated Time From batteryPct using Live PowerKW */}
                  <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-3">
                    <div className="text-[11px] font-semibold uppercase text-zinc-400 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      Time From {batteryPct}%
                    </div>
                    <div className="text-lg font-black text-amber-300 leading-none">
                      {chargeCalc.timeDisplay}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-1.5">
                      {chargeCalc.isEstimated ? 'est. based on 22 kW' : 'est. to 100% full'}
                    </div>
                  </div>
                </div>

                {/* Registration Info & Action Button */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-3">
                  <div className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      <strong className="text-white">{station.numberOfPoints ?? 1}</strong>{' '}
                      {(station.numberOfPoints ?? 1) === 1 ? 'point registered' : 'points registered'}
                    </span>
                  </div>

                  <button
                    type="button"
                    id={`btn-view-points-${station.id}`}
                    onClick={() => {
                      const postal = station.postcode || station.addressLine?.match(/\b(\d{6})\b/)?.[1] || undefined;
                      onNavigateToScreen2(String(station.id), postal);
                    }}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white border border-zinc-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>Check Points</span>
                    <ChevronRight className="w-4 h-4 text-emerald-400" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
