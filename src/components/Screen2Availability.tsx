import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Zap,
  CheckCircle2,
  XCircle,
  MapPin,
  ChevronLeft,
  Radio,
  Clock,
  Search,
  RefreshCw,
  AlertCircle,
  Info,
  Building,
} from 'lucide-react';
import { LtaSiteGroup, LtaAvailabilityApiResponse } from '../types';

interface Screen2Props {
  initialPostalCode?: string;
  stationName?: string;
  arrivedFromScreen1?: boolean;
  onNavigateToScreen1: () => void;
}

type FetchState = 'loading' | 'empty' | 'refused' | 'unreachable' | 'success';

export const Screen2Availability: React.FC<Screen2Props> = ({
  initialPostalCode,
  stationName,
  arrivedFromScreen1 = false,
  onNavigateToScreen1,
}) => {
  const [postalInput, setPostalInput] = useState<string>(initialPostalCode || '038983');
  const [activePostal, setActivePostal] = useState<string>(initialPostalCode || '038983');
  const [userSearched, setUserSearched] = useState<boolean>(false);
  const postalInputRef = useRef<HTMLInputElement>(null);
  const [fetchState, setFetchState] = useState<FetchState>('loading');
  const [groups, setGroups] = useState<LtaSiteGroup[]>([]);
  const [totalAvailable, setTotalAvailable] = useState<number>(0);
  const [totalConnectors, setTotalConnectors] = useState<number>(0);
  const [lastFetchedTime, setLastFetchedTime] = useState<string>('');
  const [activeSiteFilter, setActiveSiteFilter] = useState<string>('all');

  // When initialPostalCode changes from Screen 1 navigation, update and fetch
  useEffect(() => {
    if (initialPostalCode && initialPostalCode.trim() !== '') {
      setPostalInput(initialPostalCode.trim());
      setActivePostal(initialPostalCode.trim());
      setUserSearched(false);
    }
  }, [initialPostalCode]);

  const fetchAvailability = useCallback(async (postalToFetch: string) => {
    setFetchState('loading');
    const cleanPostal = postalToFetch.trim() || '038983';

    try {
      const res = await fetch(`/api/availability?postal=${encodeURIComponent(cleanPostal)}`);

      if (res.status === 503 || res.status === 401 || res.status === 403) {
        setFetchState('refused');
        return;
      }

      if (!res.ok) {
        setFetchState('refused');
        return;
      }

      const data: LtaAvailabilityApiResponse = await res.json();

      if (data.refused) {
        setFetchState('refused');
        return;
      }

      if (data.unreachable) {
        setFetchState('unreachable');
        return;
      }

      const siteGroups = Array.isArray(data.groups) ? data.groups : [];

      // Format current local time for last fetched display
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastFetchedTime(timeStr);

      if (siteGroups.length === 0) {
        setGroups([]);
        setTotalAvailable(0);
        setTotalConnectors(0);
        setFetchState('empty');
        return;
      }

      setGroups(siteGroups);
      setTotalAvailable(data.totalAvailable ?? siteGroups.reduce((acc, g) => acc + g.availableConnectors, 0));
      setTotalConnectors(data.totalConnectors ?? siteGroups.reduce((acc, g) => acc + g.totalConnectors, 0));
      setActiveSiteFilter('all');
      setFetchState('success');
    } catch {
      setFetchState('unreachable');
    }
  }, []);

  useEffect(() => {
    fetchAvailability(activePostal);
  }, [activePostal, fetchAvailability]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = postalInput.trim();
    if (clean) {
      setUserSearched(true);
      setActivePostal(clean);
    }
  };

  const displayedGroups =
    activeSiteFilter === 'all'
      ? groups
      : groups.filter((g) => g.name === activeSiteFilter);

  const totalInUse = Math.max(0, totalConnectors - totalAvailable);

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

      {/* Screen Title & Subtitle */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <h2 id="screen2-heading" className="text-lg font-bold text-white tracking-tight">
            Available Charging Points
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
          Data from LTA DataMall, refreshed every 5 minutes
          {lastFetchedTime ? ` • Last fetched: ${lastFetchedTime}` : ''}
        </p>
      </div>

      {/* Postal Code Search / Quick Selector */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 sm:p-4 mb-4 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <label htmlFor="postal-code-input" className="sr-only">
              Singapore 6-digit Postal Code
            </label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              ref={postalInputRef}
              id="postal-code-input"
              type="text"
              pattern="[0-9]{6}"
              maxLength={6}
              value={postalInput}
              onChange={(e) => setPostalInput(e.target.value)}
              placeholder="e.g. 038983"
              className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-sm font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors min-h-[44px]"
            />
          </div>
          <button
            type="submit"
            id="search-postal-btn"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-black rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <Search className="w-3.5 h-3.5 text-black" />
            <span>Check Availability</span>
          </button>
        </div>
        <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2 px-1">
          <span>Current Location Code: <strong className="text-zinc-200">{activePostal}</strong></span>
          <span className="text-zinc-400">Postal search</span>
        </div>
      </form>

      {/* Four distinct state sentences */}

      {/* 1. Case: Loading */}
      {fetchState === 'loading' && (
        <div
          id="status-loading-lta"
          className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 text-center my-4 shadow-sm"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <p className="text-base font-semibold text-zinc-100 leading-relaxed max-w-md mx-auto">
            Checking Availability Status
          </p>
          <p className="text-xs text-zinc-400 mt-2">
            Querying LTA DataMall EV charging connector occupancy for postal code {activePostal}...
          </p>
        </div>
      )}

      {/* 2. Case: Empty */}
      {fetchState === 'empty' && (
        <div
          id="status-empty-lta"
          className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 text-center my-4 shadow-sm"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
            <Info className="w-6 h-6" />
          </div>
          {arrivedFromScreen1 && !userSearched ? (
            <>
              <p className="text-base font-semibold text-zinc-200 leading-relaxed max-w-md mx-auto">
                LTA has no live status for this charger
              </p>
              <p className="text-xs text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
                {stationName || 'This station'} is listed on Open Charge Map at postal code {activePostal}, but LTA's registry has no public chargers there. The Open Charge Map entry may be out of date. Live status is only available for LTA-registered chargers.
              </p>
            </>
          ) : (
            <>
              <p className="text-base font-semibold text-zinc-200 leading-relaxed max-w-md mx-auto">
                No EV-Stations found - Try another Location!
              </p>
              <p className="text-xs text-zinc-400 mt-2">
                No registered LTA charging points returned for postal code {activePostal}.
              </p>
            </>
          )}
          <button
            type="button"
            id="btn-search-another-postal"
            onClick={() => {
              setPostalInput('');
              postalInputRef.current?.focus();
            }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-colors cursor-pointer min-h-[44px]"
          >
            <Search className="w-3.5 h-3.5 text-emerald-400" />
            <span>Search another postal code</span>
          </button>
        </div>
      )}

      {/* 3. Case: Refused */}
      {fetchState === 'refused' && (
        <div
          id="status-refused-lta"
          className="bg-zinc-900/90 border border-amber-500/40 rounded-2xl p-6 text-center my-4 shadow-sm"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-base font-semibold text-amber-200 leading-relaxed max-w-md mx-auto">
            System Maintenance, Try again later.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => fetchAvailability(activePostal)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-bold text-amber-300 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Request</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Case: Unreachable */}
      {fetchState === 'unreachable' && (
        <div
          id="status-unreachable-lta"
          className="bg-zinc-900/90 border border-red-500/40 rounded-2xl p-6 text-center my-4 shadow-sm"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-base font-semibold text-red-200 leading-relaxed max-w-md mx-auto">
            We couldn&apos;t reach LTA, availability is Unknown.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => fetchAvailability(activePostal)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-xs font-bold text-red-300 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry LTA Connection</span>
            </button>
          </div>
        </div>
      )}

      {/* Success State: Live Real-Time Availability from LTA DataMall */}
      {fetchState === 'success' && (
        <>
          {/* Hero Availability Stat Card */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-emerald-500/40 rounded-2xl p-5 mb-5 shadow-lg shadow-emerald-950/20">
            <div className="text-xs uppercase font-bold tracking-wider text-zinc-400 flex items-center justify-between">
              <span>Postal Code {activePostal} ({groups.length} site{groups.length !== 1 ? 's' : ''})</span>
              <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
                LTA Real-Time
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight">
                {totalAvailable}
              </span>
              <span className="text-xl font-bold text-zinc-300">
                / {totalConnectors} connectors free
              </span>
            </div>

            {/* Visual Slot Meter */}
            {totalConnectors > 0 && (
              <div className="mt-3.5 flex gap-1 flex-wrap">
                {Array.from({ length: Math.min(totalConnectors, 40) }).map((_, idx) => {
                  const isFreeSlot = idx < totalAvailable;
                  return (
                    <div
                      key={`meter-${idx}`}
                      className={`h-2.5 flex-1 min-w-[6px] rounded-full ${
                        isFreeSlot ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50' : 'bg-zinc-800'
                      }`}
                      title={isFreeSlot ? 'Available' : 'Occupied'}
                    />
                  );
                })}
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {totalAvailable} available now (Status &quot;1&quot;)
              </span>
              <span className="flex items-center gap-1.5 text-zinc-400 font-medium">
                <XCircle className="w-3.5 h-3.5 text-zinc-500" />
                {totalInUse} occupied / in use
              </span>
            </div>
          </div>

          {/* Group Filter Tabs (if more than 1 site exists in this postal code) */}
          {groups.length > 1 && (
            <div className="mb-4">
              <div className="text-xs uppercase font-semibold text-zinc-400 mb-2 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                Filter by Site Location:
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  id="filter-site-all"
                  onClick={() => setActiveSiteFilter('all')}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    activeSiteFilter === 'all'
                      ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/50 shadow-sm'
                      : 'bg-zinc-900/80 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  All Sites ({groups.length})
                </button>
                {groups.map((group, idx) => (
                  <button
                    key={`filter-${group.name}-${idx}`}
                    type="button"
                    id={`filter-site-${idx}`}
                    onClick={() => setActiveSiteFilter(group.name)}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer max-w-[200px] truncate ${
                      activeSiteFilter === group.name
                        ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/50 shadow-sm'
                        : 'bg-zinc-900/80 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    #{idx + 1} {group.name.split('(')[0].trim()} ({group.availableConnectors} free)
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grouped Sites Breakdown */}
          <div className="space-y-5">
            {displayedGroups.map((group, groupIdx) => (
              <div
                key={`site-group-${group.name}-${groupIdx}`}
                id={`site-group-${groupIdx}`}
                className="bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800 shadow-sm"
              >
                {/* Header of Site Group */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-emerald-400 border border-zinc-700">
                        Site #{groupIdx + 1}
                      </span>
                      <span className="text-xs text-zinc-400">{group.chargers.length} charger{group.chargers.length !== 1 ? 's' : ''}</span>
                    </div>
                    <h3 className="text-base font-bold text-white leading-snug">
                      {group.name}
                    </h3>
                    <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span>{group.address}</span>
                    </p>
                  </div>

                  {/* Summary Badge for this group */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-right shrink-0">
                    <div className="text-[11px] font-semibold text-zinc-400 uppercase leading-none">
                      Free Plugs
                    </div>
                    <div className="text-xl font-black text-emerald-400 leading-tight mt-0.5">
                      {group.availableConnectors}{' '}
                      <span className="text-xs font-semibold text-zinc-400">/ {group.totalConnectors}</span>
                    </div>
                  </div>
                </div>

                {/* Individual Chargers inside this Group */}
                <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Chargers & Bays:
                  </div>

                  <div className="space-y-2.5">
                    {group.chargers.map((charger, chargerIdx) => (
                      <div
                        key={`charger-${charger.position}-${chargerIdx}`}
                        className="bg-zinc-950/70 border border-zinc-800/90 rounded-xl p-3"
                      >
                        {/* Charger Position and Operator */}
                        <div className="flex items-center justify-between gap-2 text-xs mb-2">
                          <div className="flex items-center gap-1.5 font-bold text-zinc-200">
                            <Building className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Bay / Position: {charger.position || `Bay #${chargerIdx + 1}`}</span>
                          </div>
                          {charger.operator && (
                            <span className="text-[11px] font-medium text-zinc-400 truncate max-w-[150px]">
                              {charger.operator}
                            </span>
                          )}
                        </div>

                        {/* Plugs for this Charger */}
                        <div className="space-y-2">
                          {charger.plugs.map((plug, plugIdx) => (
                            <div
                              key={`plug-${plugIdx}`}
                              className="bg-zinc-900/60 rounded-lg p-2.5 border border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                  <Zap className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                    <span>{plug.plugType || 'EV Plug'}</span>
                                    <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-zinc-800 text-zinc-300 rounded">
                                      {plug.powerRating}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                                    <span className="text-zinc-300 font-semibold">{plug.chargingSpeed} kW</span>
                                    {plug.price > 0 && (
                                      <>
                                        <span className="text-zinc-600">•</span>
                                        <span className="text-zinc-300">${plug.price.toFixed(4)} / {plug.priceType}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Connectors status */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {plug.connectors.map((conn, connIdx) => {
                                  const isAvail = conn.status === '1';
                                  const isOcc = conn.status === '0';

                                  return (
                                    <div
                                      key={`conn-${conn.evCpId || connIdx}`}
                                      className="flex items-center gap-1"
                                    >
                                      {isAvail ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-600/50 px-2 py-0.5 rounded-full">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                          AVAILABLE
                                        </span>
                                      ) : isOcc ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                                          <XCircle className="w-3 h-3 text-zinc-500" />
                                          OCCUPIED
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded-full">
                                          UNAVAILABLE
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
};
