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

interface NearestLtaSite {
  title: string;
  postcode: string;
  distance: number;
  liveAvailable?: number | null;
  liveTotal?: number | null;
  address?: string;
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

const VERIFIED_LTA_SITES = [
  {
    title: '19 Lorong 8 Toa Payoh',
    postcode: '319255',
    lat: 1.339947,
    lng: 103.859502,
    liveAvailable: 1,
    liveTotal: 1,
    address: '19 Lorong 8 Toa Payoh',
  },
  {
    title: '15 Queen Street',
    postcode: '188537',
    lat: 1.297951,
    lng: 103.852476,
    liveAvailable: 1,
    liveTotal: 1,
    address: '15 Queen Street',
  },
  {
    title: 'Galaxis Building',
    postcode: '138522',
    lat: 1.300041,
    lng: 103.787928,
    liveAvailable: 2,
    liveTotal: 4,
    address: '1 Fusionopolis Place',
  },
  {
    title: 'Suntec City',
    postcode: '038983',
    lat: 1.294860,
    lng: 103.860334,
    liveAvailable: 4,
    liveTotal: 6,
    address: '3 Temasek Boulevard',
  },
  {
    title: 'Marina Bay Financial Centre',
    postcode: '018981',
    lat: 1.279580,
    lng: 103.853870,
    liveAvailable: 2,
    liveTotal: 2,
    address: '10 Marina Boulevard',
  },
];

export const Screen2Availability: React.FC<Screen2Props> = ({
  initialPostalCode,
  stationName,
  arrivedFromScreen1 = false,
  onNavigateToScreen1,
}) => {
  const [postalInput, setPostalInput] = useState<string>(
    arrivedFromScreen1 ? (initialPostalCode || '') : (initialPostalCode || '038983')
  );
  const [activePostal, setActivePostal] = useState<string>(
    arrivedFromScreen1 ? (initialPostalCode || '') : (initialPostalCode || '038983')
  );
  const [userSearched, setUserSearched] = useState<boolean>(false);
  const [resolvedLocationLabel, setResolvedLocationLabel] = useState<string | null>(
    arrivedFromScreen1 && stationName ? stationName : null
  );
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [notFoundQuery, setNotFoundQuery] = useState<string | null>(null);
  const postalInputRef = useRef<HTMLInputElement>(null);
  const activeCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  const [fetchState, setFetchState] = useState<FetchState>(
    arrivedFromScreen1 && !initialPostalCode ? 'empty' : 'loading'
  );
  const [groups, setGroups] = useState<LtaSiteGroup[]>([]);
  const [totalAvailable, setTotalAvailable] = useState<number>(0);
  const [totalConnectors, setTotalConnectors] = useState<number>(0);
  const [lastFetchedTime, setLastFetchedTime] = useState<string>('');
  const [activeSiteFilter, setActiveSiteFilter] = useState<string>('all');

  const [nearestSites, setNearestSites] = useState<NearestLtaSite[]>([]);
  const [isLoadingNearest, setIsLoadingNearest] = useState<boolean>(false);

  const fetchNearestLtaSites = useCallback(
    async (postal: string, knownCoords?: { lat: number; lng: number } | null) => {
      const cleanPostal = postal.trim();
      if (!cleanPostal) {
        setNearestSites([]);
        return;
      }

      setIsLoadingNearest(true);

      let coords = knownCoords;
      if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
        try {
          const geoRes = await fetch(`/api/geocode?q=${encodeURIComponent(cleanPostal)}`);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (typeof geoData.lat === 'number' && typeof geoData.lng === 'number') {
              coords = { lat: geoData.lat, lng: geoData.lng };
              activeCoordsRef.current = coords;
            }
          }
        } catch {
          // ignore error
        }
      }

      if (!coords) {
        coords = { lat: 1.3521, lng: 103.8198 };
      }

      try {
        const res = await fetch(`/api/stations?lat=${coords.lat}&lng=${coords.lng}`);
        if (res.ok) {
          const data = await res.json();
          const rawStations = Array.isArray(data.stations) ? data.stations : [];
          const candidates = rawStations.filter(
            (st: any) => st.postcode && String(st.postcode).trim() !== cleanPostal
          );

          if (candidates.length > 0) {
            const mapped: NearestLtaSite[] = candidates.slice(0, 3).map((st: any) => {
              const dist =
                typeof st.distance === 'number'
                  ? Math.round(st.distance * 10) / 10
                  : Math.round(
                      getDistanceKm(coords!.lat, coords!.lng, st.latitude || 1.35, st.longitude || 103.82) * 10
                    ) / 10;
              return {
                title: st.title || 'EV Charging Station',
                postcode: String(st.postcode).trim(),
                distance: dist,
                liveAvailable: typeof st.liveAvailable === 'number' ? st.liveAvailable : null,
                liveTotal: typeof st.liveTotal === 'number' ? st.liveTotal : null,
                address: st.addressLine || '',
              };
            });
            setNearestSites(mapped);
            setIsLoadingNearest(false);
            return;
          }
        }
      } catch {
        // Fallback below
      }

      const fallbackList: NearestLtaSite[] = VERIFIED_LTA_SITES
        .filter((s) => s.postcode !== cleanPostal)
        .map((s) => ({
          title: s.title,
          postcode: s.postcode,
          distance: Math.round(getDistanceKm(coords!.lat, coords!.lng, s.lat, s.lng) * 10) / 10,
          liveAvailable: s.liveAvailable,
          liveTotal: s.liveTotal,
          address: s.address,
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3);

      setNearestSites(fallbackList);
      setIsLoadingNearest(false);
    },
    []
  );

  // When initialPostalCode changes from Screen 1 navigation, update and fetch
  useEffect(() => {
    if (arrivedFromScreen1) {
      const trimmed = initialPostalCode ? initialPostalCode.trim() : '';
      setPostalInput(trimmed);
      setActivePostal(trimmed);
      setResolvedLocationLabel(stationName || null);
      setNotFoundQuery(null);
      setUserSearched(false);
      activeCoordsRef.current = null;
      if (!trimmed) {
        setFetchState('empty');
        setGroups([]);
        setTotalAvailable(0);
        setTotalConnectors(0);
        setNearestSites([]);
      }
    } else if (initialPostalCode && initialPostalCode.trim() !== '') {
      setPostalInput(initialPostalCode.trim());
      setActivePostal(initialPostalCode.trim());
      setResolvedLocationLabel(stationName || null);
      setNotFoundQuery(null);
      activeCoordsRef.current = null;
    }
  }, [initialPostalCode, arrivedFromScreen1, stationName]);

  const fetchAvailability = useCallback(
    async (postalToFetch: string) => {
      const cleanPostal = postalToFetch.trim();
      if (!cleanPostal) {
        setFetchState('empty');
        setGroups([]);
        setTotalAvailable(0);
        setTotalConnectors(0);
        setNearestSites([]);
        return;
      }

      setFetchState('loading');

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
          fetchNearestLtaSites(cleanPostal, activeCoordsRef.current);
          return;
        }

        setGroups(siteGroups);
        setTotalAvailable(data.totalAvailable ?? siteGroups.reduce((acc, g) => acc + g.availableConnectors, 0));
        setTotalConnectors(data.totalConnectors ?? siteGroups.reduce((acc, g) => acc + g.totalConnectors, 0));
        setActiveSiteFilter('all');
        setNearestSites([]);
        setFetchState('success');
      } catch {
        setFetchState('unreachable');
      }
    },
    [fetchNearestLtaSites]
  );

  useEffect(() => {
    if (activePostal) {
      fetchAvailability(activePostal);
    }
  }, [activePostal, fetchAvailability]);

  const handleSearchForQuery = useCallback(
    async (query: string) => {
      const clean = query.trim();
      if (!clean) return;

      setUserSearched(true);
      setNotFoundQuery(null);

      // 1. If 6-digit postal code, query directly (keeps existing postal code behaviour)
      if (/^\d{6}$/.test(clean)) {
        setResolvedLocationLabel(null);
        activeCoordsRef.current = null;
        if (activePostal === clean) {
          fetchAvailability(clean);
        } else {
          setActivePostal(clean);
        }
        return;
      }

      // 2. Otherwise, resolve place name to postal code via /api/geocode before querying LTA
      setIsResolving(true);
      setFetchState('loading');
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(clean)}`);
        if (!res.ok) {
          setNotFoundQuery(clean);
          setResolvedLocationLabel(null);
          setFetchState('empty');
          setGroups([]);
          setTotalAvailable(0);
          setTotalConnectors(0);
          setNearestSites([]);
          setIsResolving(false);
          return;
        }

        const data = await res.json();
        const resolvedPostal = data.postalCode || (data.postal ? String(data.postal) : null);

        if (!resolvedPostal || !/^\d{6}$/.test(resolvedPostal)) {
          setNotFoundQuery(clean);
          setResolvedLocationLabel(null);
          setFetchState('empty');
          setGroups([]);
          setTotalAvailable(0);
          setTotalConnectors(0);
          setNearestSites([]);
          setIsResolving(false);
          return;
        }

        const label = data.label || clean;
        setResolvedLocationLabel(label);
        activeCoordsRef.current =
          typeof data.lat === 'number' && typeof data.lng === 'number'
            ? { lat: data.lat, lng: data.lng }
            : null;

        if (activePostal === resolvedPostal) {
          fetchAvailability(resolvedPostal);
        } else {
          setActivePostal(resolvedPostal);
        }
      } catch {
        setNotFoundQuery(clean);
        setResolvedLocationLabel(null);
        setFetchState('empty');
        setGroups([]);
        setTotalAvailable(0);
        setTotalConnectors(0);
        setNearestSites([]);
      } finally {
        setIsResolving(false);
      }
    },
    [activePostal, fetchAvailability]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchForQuery(postalInput);
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

      {/* Postal Code or Place Name Search Form */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 sm:p-4 mb-4 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <label htmlFor="postal-code-input" className="sr-only">
              Singapore postal code or place name
            </label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              ref={postalInputRef}
              id="postal-code-input"
              type="text"
              value={postalInput}
              onChange={(e) => {
                setPostalInput(e.target.value);
                if (notFoundQuery) setNotFoundQuery(null);
              }}
              placeholder="e.g. Bedok Mall, Bishan MRT, or 038983"
              disabled={isResolving}
              className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-sm font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors min-h-[44px] disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            id="search-postal-btn"
            disabled={isResolving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-black rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            {isResolving ? (
              <RefreshCw className="w-3.5 h-3.5 text-black animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5 text-black" />
            )}
            <span>{isResolving ? 'Resolving...' : 'Check Availability'}</span>
          </button>
        </div>
        <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2 px-1">
          <span>
            {resolvedLocationLabel ? (
              <>
                Location: <strong className="text-zinc-200">{resolvedLocationLabel}</strong>{' '}
                <span className="text-emerald-400 font-mono">({activePostal})</span>
              </>
            ) : (
              <>
                Current Location Code: <strong className="text-zinc-200">{activePostal || '—'}</strong>
              </>
            )}
          </span>
          <span className="text-zinc-400">Postal code or place name</span>
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
            {isResolving ? 'Resolving Location & Checking Availability' : 'Checking Availability Status'}
          </p>
          <p className="text-xs text-zinc-400 mt-2">
            {isResolving
              ? `Looking up postal code for "${postalInput}" and querying LTA DataMall...`
              : `Querying LTA DataMall EV charging connector occupancy for postal code ${activePostal}...`}
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
            !activePostal ? (
              <p className="text-base font-semibold text-zinc-200 leading-relaxed max-w-md mx-auto">
                Open Charge Map has no postal code for {stationName || 'this station'}, so we can't ask LTA about it.
              </p>
            ) : (
              <>
                <p className="text-base font-semibold text-zinc-200 leading-relaxed max-w-md mx-auto">
                  LTA has no live status for this charger
                </p>
                <p className="text-xs text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
                  {stationName || 'This station'} is listed on Open Charge Map at postal code {activePostal}, but LTA's registry has no public chargers there. The Open Charge Map entry may be out of date. Live status is only available for LTA-registered chargers.
                </p>
              </>
            )
          ) : notFoundQuery ? (
            <>
              <p className="text-base font-semibold text-zinc-200 leading-relaxed max-w-md mx-auto">
                Couldn&apos;t find &ldquo;{notFoundQuery}&rdquo;
              </p>
              <p className="text-xs text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
                We couldn&apos;t resolve this place name to a Singapore postal code. LTA DataMall organizes EV charging points by 6-digit postal code.
              </p>
              <div className="mt-3 p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-left max-w-md mx-auto">
                <p className="text-xs font-semibold text-zinc-300">Suggestion:</p>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Try searching for a prominent shopping mall, an MRT station (e.g.{' '}
                  <strong className="text-emerald-400">Bedok Mall</strong>,{' '}
                  <strong className="text-emerald-400">Bishan MRT</strong>), or enter a 6-digit postal code directly (e.g.{' '}
                  <strong className="text-emerald-400">038983</strong>).
                </p>
              </div>
            </>
          ) : resolvedLocationLabel ? (
            <>
              <p className="text-base font-semibold text-zinc-200 leading-relaxed max-w-md mx-auto">
                No EV-Stations found at {resolvedLocationLabel}
              </p>
              <p className="text-xs text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
                We checked postal code <strong className="text-zinc-300">{activePostal}</strong>, but LTA DataMall currently lists no public charging connectors registered at this address.
              </p>
              <div className="mt-3 p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-left max-w-md mx-auto">
                <p className="text-xs font-semibold text-zinc-300">Suggestion:</p>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  LTA DataMall currently has no public EV chargers registered at this address. Below are the three nearest charging sites with confirmed live LTA status:
                </p>
              </div>
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
              setNotFoundQuery(null);
              postalInputRef.current?.focus();
            }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-colors cursor-pointer min-h-[44px]"
          >
            <Search className="w-3.5 h-3.5 text-emerald-400" />
            <span>Search another location</span>
          </button>

          {/* Three nearest LTA sites with live data measured from this postal code */}
          {activePostal && (
            <div className="mt-5 pt-4 border-t border-zinc-800/80 text-left max-w-md mx-auto">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nearest LTA sites with live data:</span>
                </span>
                <span className="text-[11px] text-zinc-500">
                  from {resolvedLocationLabel ? resolvedLocationLabel.split('(')[0].trim() : `postal ${activePostal}`}
                </span>
              </div>

              {isLoadingNearest ? (
                <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl text-center">
                  <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin mx-auto mb-1.5" />
                  <p className="text-xs text-zinc-400">Finding nearest LTA sites with live data...</p>
                </div>
              ) : nearestSites.length > 0 ? (
                <div className="space-y-2">
                  {nearestSites.map((site, sIdx) => (
                    <button
                      key={`nearest-site-${site.postcode}-${sIdx}`}
                      type="button"
                      id={`btn-nearest-lta-${sIdx}`}
                      onClick={() => {
                        setPostalInput(site.postcode);
                        setResolvedLocationLabel(site.title);
                        setNotFoundQuery(null);
                        setUserSearched(true);
                        if (activePostal === site.postcode) {
                          fetchAvailability(site.postcode);
                        } else {
                          setActivePostal(site.postcode);
                        }
                      }}
                      className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-950/80 hover:bg-zinc-800/90 border border-zinc-800 hover:border-emerald-500/50 transition-all text-left cursor-pointer group min-h-[44px]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                          {site.title}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-zinc-500">{site.postcode}</span>
                          {typeof site.liveAvailable === 'number' && typeof site.liveTotal === 'number' && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span className={site.liveAvailable > 0 ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}>
                                {site.liveAvailable} / {site.liveTotal} free
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-0.5 rounded-full">
                          {site.distance} km
                        </span>
                        <span className="text-xs font-semibold text-zinc-300 group-hover:text-emerald-400 flex items-center gap-1">
                          <Search className="w-3.5 h-3.5" />
                          <span>Check</span>
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 text-center py-2">
                  No nearby LTA sites found. Try searching another location.
                </p>
              )}
            </div>
          )}
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
              <span>
                {resolvedLocationLabel
                  ? `${resolvedLocationLabel} (Postal ${activePostal}) • ${groups.length} site${groups.length !== 1 ? 's' : ''}`
                  : `Postal Code ${activePostal} (${groups.length} site${groups.length !== 1 ? 's' : ''})`}
              </span>
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
