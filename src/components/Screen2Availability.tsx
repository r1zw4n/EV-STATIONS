import React, { useState } from 'react';
import {
  Zap,
  CheckCircle2,
  XCircle,
  MapPin,
  ChevronLeft,
  ShieldCheck,
  Radio,
  Clock,
} from 'lucide-react';
import { ChargingStation } from '../types';

interface Screen2Props {
  stations: ChargingStation[];
  initialSelectedStationId?: string;
  onNavigateToScreen1: () => void;
}

export const Screen2Availability: React.FC<Screen2Props> = ({
  stations,
  initialSelectedStationId,
  onNavigateToScreen1,
}) => {
  // Sort by nearest distance to identify the two nearby locations
  const nearestStations = [...stations].sort((a, b) => a.distanceKm - b.distanceKm);
  const twoNearbyLocations = nearestStations.slice(0, 2);

  // Selected station filter (allows viewing both or focusing on one)
  const [activeStationFilter, setActiveStationFilter] = useState<string>(
    initialSelectedStationId && twoNearbyLocations.some((s) => s.id === initialSelectedStationId)
      ? initialSelectedStationId
      : 'all'
  );

  // Filtered stations to show
  const displayedStations =
    activeStationFilter === 'all'
      ? twoNearbyLocations
      : twoNearbyLocations.filter((s) => s.id === activeStationFilter);

  // Overall totals across the two nearby locations
  const totalAvailableInNearby = twoNearbyLocations.reduce((acc, station) => {
    return acc + station.points.filter((p) => p.isAvailable).length;
  }, 0);

  const totalPointsInNearby = twoNearbyLocations.reduce((acc, station) => {
    return acc + station.points.length;
  }, 0);

  const totalInUseInNearby = totalPointsInNearby - totalAvailableInNearby;

  return (
    <section className="w-full pb-10" aria-labelledby="screen2-heading">
      {/* Back button link to Screen 1 */}
      <div className="mb-3">
        <button
          type="button"
          id="back-to-screen1-btn"
          onClick={onNavigateToScreen1}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white py-1.5 px-2 rounded-lg hover:bg-zinc-800/60 transition-colors cursor-pointer min-h-[44px]"
        >
          <ChevronLeft className="w-4 h-4 text-emerald-400" />
          <span>Back to Screen 1 (Nearest & Speeds)</span>
        </button>
      </div>

      {/* Screen Title */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <h2 id="screen2-heading" className="text-lg font-bold text-white tracking-tight">
            Available Charging Points
          </h2>
        </div>
        <p className="text-sm text-zinc-400 mt-0.5">
          Real-time count of points not being used in your 2 nearby locations.
        </p>
      </div>

      {/* Hero Availability Stat Card - Ultra High Legibility at Arm's Length */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-emerald-500/40 rounded-2xl p-5 mb-5 shadow-lg shadow-emerald-950/20">
        <div className="text-xs uppercase font-bold tracking-wider text-zinc-400 flex items-center justify-between">
          <span>Combined 2 Nearby Locations</span>
          <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
            Unused & Ready
          </span>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight">
            {totalAvailableInNearby}
          </span>
          <span className="text-xl font-bold text-zinc-300">
            / {totalPointsInNearby} points free
          </span>
        </div>

        {/* Visual Slot Meter */}
        <div className="mt-3.5 flex gap-1.5">
          {Array.from({ length: totalPointsInNearby }).map((_, idx) => {
            const isFreeSlot = idx < totalAvailableInNearby;
            return (
              <div
                key={`meter-${idx}`}
                className={`h-2.5 flex-1 rounded-full ${
                  isFreeSlot ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50' : 'bg-zinc-800'
                }`}
                title={isFreeSlot ? 'Available' : 'In Use'}
              />
            );
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {totalAvailableInNearby} available now
          </span>
          <span className="flex items-center gap-1.5 text-zinc-400 font-medium">
            <XCircle className="w-3.5 h-3.5 text-zinc-500" />
            {totalInUseInNearby} currently charging
          </span>
        </div>
      </div>

      {/* Location Filter Pills */}
      <div className="mb-4">
        <div className="text-xs uppercase font-semibold text-zinc-400 mb-2 flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          Filter by Location:
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            id="filter-loc-all"
            onClick={() => setActiveStationFilter('all')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              activeStationFilter === 'all'
                ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/50 shadow-sm'
                : 'bg-zinc-900/80 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
            }`}
          >
            Both Locations ({twoNearbyLocations.length})
          </button>
          {twoNearbyLocations.map((loc, idx) => (
            <button
              key={`filter-${loc.id}`}
              type="button"
              id={`filter-loc-${loc.id}`}
              onClick={() => setActiveStationFilter(loc.id)}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                activeStationFilter === loc.id
                  ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/50 shadow-sm'
                  : 'bg-zinc-900/80 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
              }`}
            >
              #{idx + 1} {loc.name.split(' ')[0]} ({loc.points.filter((p) => p.isAvailable).length} free)
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Bay Breakdowns for Nearby Locations */}
      <div className="space-y-5">
        {displayedStations.map((station, index) => {
          const availableInStation = station.points.filter((p) => p.isAvailable).length;
          const totalInStation = station.points.length;
          const occupiedInStation = totalInStation - availableInStation;

          return (
            <div
              key={station.id}
              id={`availability-card-${station.id}`}
              className="bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800 shadow-sm"
            >
              {/* Header of Station */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-emerald-400 border border-zinc-700">
                      Nearby #{index + 1}
                    </span>
                    <span className="text-xs text-zinc-400">{station.distanceKm} km away</span>
                  </div>
                  <h3 className="text-base font-bold text-white leading-snug">
                    {station.name}
                  </h3>
                  <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span>{station.address}</span>
                  </p>
                </div>

                {/* Big summary badge for this station */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-right shrink-0">
                  <div className="text-[11px] font-semibold text-zinc-400 uppercase leading-none">
                    Free Points
                  </div>
                  <div className="text-xl font-black text-emerald-400 leading-tight mt-0.5">
                    {availableInStation}{' '}
                    <span className="text-xs font-semibold text-zinc-400">/ {totalInStation}</span>
                  </div>
                </div>
              </div>

              {/* Station Speed & Battery 20% reminder */}
              <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-950/60 rounded-lg px-3 py-1.5 my-3 border border-zinc-800/60">
                <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Max {station.maxSpeedKw} kW DC</span>
                <span className="text-zinc-600">•</span>
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{station.chargeTimeMinutesFrom20} mins from 20% to full</span>
              </div>

              {/* Points Listing: Each Individual EV Charging Bay */}
              <div className="mt-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Charging Point Bays & Status:
                </div>

                <div className="space-y-2">
                  {station.points.map((point) => (
                    <div
                      key={point.id}
                      id={`point-row-${point.id}`}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        point.isAvailable
                          ? 'bg-emerald-950/15 border-emerald-800/40 text-white'
                          : 'bg-zinc-950/50 border-zinc-800/80 text-zinc-400'
                      }`}
                    >
                      {/* Bay identifier and plug specs */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            point.isAvailable
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            <span>{point.bayLabel}</span>
                          </div>
                          <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                            <span className="font-semibold text-zinc-300">
                              {point.speedKw} kW
                            </span>
                            <span className="text-zinc-600">•</span>
                            <span>{point.connectorType}</span>
                          </div>
                        </div>
                      </div>

                      {/* Availability status badge */}
                      <div>
                        {point.isAvailable ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-600/50 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            AVAILABLE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full">
                            <XCircle className="w-3.5 h-3.5 text-zinc-500" />
                            IN USE
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
