import React from 'react';
import {
  Compass,
  Zap,
  Clock,
  MapPin,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { ChargingStation } from '../types';

interface Screen1Props {
  stations: ChargingStation[];
  onNavigateToScreen2: (stationId?: string) => void;
}

export const Screen1Stations: React.FC<Screen1Props> = ({
  stations,
  onNavigateToScreen2,
}) => {
  // Nearest 3 charging stations to the driver
  const displayStations = [...stations]
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 3);

  return (
    <section className="w-full pb-10" aria-label="Nearest Charging Stations">
      {/* 3 Station Cards */}
      <div className="space-y-4">
        {displayStations.map((station, index) => {
          const availableCount = station.points.filter((p) => p.isAvailable).length;
          const totalCount = station.points.length;
          const isTopMatch = index === 0;

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
                    {station.area}
                  </span>
                </div>

                {isTopMatch && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-600/50 px-2.5 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    Closest to You
                  </span>
                )}
              </div>

              {/* Station Name & Address */}
              <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                {station.name}
              </h3>
              <p className="text-xs text-zinc-400 flex items-start gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{station.address}</span>
              </p>

              {/* Primary EV Metrics Grid - High Contrast for Phone at Arm's Length */}
              <div className="grid grid-cols-2 gap-2.5 my-3.5">
                {/* Distance & Speed Box */}
                <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-3">
                  <div className="text-[11px] font-semibold uppercase text-zinc-400 mb-1 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-emerald-400" />
                    Distance & Speed
                  </div>
                  <div className="text-lg font-black text-white leading-none">
                    {station.distanceKm} <span className="text-xs font-semibold text-zinc-400">km away</span>
                  </div>
                  <div className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                    <Zap className="w-3 h-3 fill-emerald-400" />
                    {station.maxSpeedKw} kW DC
                  </div>
                </div>

                {/* Estimated Charging Time from 20% */}
                <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-3">
                  <div className="text-[11px] font-semibold uppercase text-zinc-400 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    Time From 20%
                  </div>
                  <div className="text-lg font-black text-amber-300 leading-none">
                    {station.chargeTimeMinutesFrom20}{' '}
                    <span className="text-xs font-semibold text-zinc-400">mins</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1.5">
                    To reach 100% full
                  </div>
                </div>
              </div>

              {/* Availability Preview & Action Button */}
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-3">
                <div className="text-xs font-medium text-zinc-300">
                  <span className="font-bold text-emerald-400">{availableCount}</span> of{' '}
                  <span className="text-zinc-400">{totalCount} points available</span>
                </div>

                <button
                  type="button"
                  id={`btn-view-points-${station.id}`}
                  onClick={() => onNavigateToScreen2(station.id)}
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
    </section>
  );
};
