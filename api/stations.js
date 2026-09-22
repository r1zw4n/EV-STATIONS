/**
 * Serverless function for Open Charge Map station retrieval.
 * Located at api/stations.js in the project root for Vercel deployment.
 */
export default async function handler(req, res) {
  // Cache response with updated s-maxage=300, stale-while-revalidate=600
  if (typeof res.setHeader === 'function') {
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.setHeader('Content-Type', 'application/json');
  }

  const sendResponse = (statusCode, data) => {
    if (typeof res.status === 'function') {
      res.status(statusCode);
    } else {
      res.statusCode = statusCode;
    }
    if (typeof res.json === 'function') {
      res.json(data);
    } else {
      res.end(JSON.stringify(data));
    }
  };

  // 1. BEFORE the fetch: if the credential is missing or empty, return 503
  const apiKey = process.env.OCM_API_KEY;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '' || apiKey === 'undefined') {
    return sendResponse(503, {
      error: 'Environment variable OCM_API_KEY is missing or empty.',
      variable: 'OCM_API_KEY',
      refused: true,
    });
  }

  // 2. Accept optional lat and lng query parameters, falling back to Singapore centre
  let lat = '1.3521';
  let lng = '103.8198';

  try {
    const urlObj = new URL(req.url || '/', `http://${req.headers?.host || 'localhost'}`);
    const queryLat = req.query?.lat || urlObj.searchParams.get('lat');
    const queryLng = req.query?.lng || urlObj.searchParams.get('lng');
    if (queryLat && !isNaN(Number(queryLat))) lat = String(queryLat);
    if (queryLng && !isNaN(Number(queryLng))) lng = String(queryLng);
  } catch {
    // Keep fallback coordinates
  }

  const ROUNDS = [
    { distance: 10, maxresults: 20 },
    { distance: 20, maxresults: 40 },
    { distance: 35, maxresults: 60 },
  ];

  // Helper to fetch from OCM
  const fetchOcm = async (dist, maxres) => {
    const upstreamUrl = `https://api.openchargemap.io/v3/poi/?output=json&countrycode=SG&latitude=${encodeURIComponent(
      lat
    )}&longitude=${encodeURIComponent(
      lng
    )}&distance=${dist}&distanceunit=KM&maxresults=${maxres}&compact=false&verbose=false`;

    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey.trim(),
        'User-Agent': 'EVStationsApp/1.0',
        Accept: 'application/json',
      },
    });

    if (!upstreamResponse.ok) {
      const err = new Error(`OCM refused request with status ${upstreamResponse.status}`);
      err.status = upstreamResponse.status;
      err.refused = true;
      throw err;
    }

    const rawData = await upstreamResponse.json();
    return Array.isArray(rawData) ? rawData : [];
  };

  // Deduplication & merge helper
  const processAndMerge = (rawData, currentMergedMap) => {
    let defaultProviderTitle = 'Open Charge Map Contributors';
    let defaultProviderLicense =
      'Licensed under Creative Commons Attribution 4.0 International (CC BY 4.0)';

    const mergedMap = currentMergedMap || new Map();

    for (const item of rawData) {
      const connections = Array.isArray(item.Connections) ? item.Connections : [];
      const powerKwList = connections
        .map((c) =>
          typeof c.PowerKW === 'number' && !isNaN(c.PowerKW) && c.PowerKW > 0
            ? c.PowerKW
            : null
        )
        .filter((p) => p !== null);

      const highestPowerKW = powerKwList.length > 0 ? Math.max(...powerKwList) : null;
      const providerTitle = item.DataProvider?.Title || defaultProviderTitle;
      const providerLicense = item.DataProvider?.License || defaultProviderLicense;

      defaultProviderTitle = providerTitle;
      defaultProviderLicense = providerLicense;

      const rawDistance = item.AddressInfo?.Distance;
      const distance =
        typeof rawDistance === 'number' ? Math.round(rawDistance * 10) / 10 : null;

      const rawTitle = (item.AddressInfo?.Title || '').trim();
      const addressLine1 = (item.AddressInfo?.AddressLine1 || '').trim();
      const town = (item.AddressInfo?.Town || '').trim();

      let title = '';
      const lowerRawTitle = rawTitle.toLowerCase();
      const lastAtIndex = lowerRawTitle.lastIndexOf(' at ');

      if (rawTitle.length > 0 && rawTitle.length <= 40 && lastAtIndex === -1) {
        title = rawTitle;
      } else if (lastAtIndex !== -1) {
        title = rawTitle.substring(lastAtIndex + 4).trim();
      }

      if (!title || title.length > 40) {
        title = addressLine1 || 'EV Charging Station';
      }

      let addressLine = addressLine1;
      if (
        title &&
        addressLine1 &&
        title.trim().toLowerCase() === addressLine1.trim().toLowerCase()
      ) {
        addressLine = town || addressLine1;
      }

      const numberOfPoints =
        item.NumberOfPoints ?? (connections.length > 0 ? connections.length : 1);

      const normalizedAddress = addressLine1
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      const mergeKey = normalizedAddress || `item_${item.ID}`;

      const currentStation = {
        id: item.ID,
        title,
        addressLine,
        town,
        latitude: item.AddressInfo?.Latitude ?? null,
        longitude: item.AddressInfo?.Longitude ?? null,
        distance,
        highestPowerKW,
        numberOfPoints,
        postcode: item.AddressInfo?.Postcode || null,
        dataProviderTitle: providerTitle,
        dataProviderLicense: providerLicense,
        mergedCount: 1,
        mergeKey,
      };

      if (!mergedMap.has(mergeKey)) {
        mergedMap.set(mergeKey, currentStation);
      } else {
        const existing = mergedMap.get(mergeKey);

        existing.mergedCount = (existing.mergedCount || 1) + 1;

        if (existing.distance === null) {
          existing.distance = currentStation.distance;
        } else if (currentStation.distance !== null && currentStation.distance < existing.distance) {
          existing.distance = currentStation.distance;
        }

        const existingPts = typeof existing.numberOfPoints === 'number' ? existing.numberOfPoints : 1;
        const currentPts = typeof currentStation.numberOfPoints === 'number' ? currentStation.numberOfPoints : 1;
        existing.numberOfPoints = Math.max(existingPts, currentPts);

        const existingKw = typeof existing.highestPowerKW === 'number' ? existing.highestPowerKW : -1;
        const currentKw = typeof currentStation.highestPowerKW === 'number' ? currentStation.highestPowerKW : -1;

        if (currentKw > existingKw) {
          existing.highestPowerKW = currentStation.highestPowerKW;
          existing.title = currentStation.title;
          if (currentStation.addressLine) existing.addressLine = currentStation.addressLine;
          if (currentStation.town) existing.town = currentStation.town;
          if (currentStation.latitude) existing.latitude = currentStation.latitude;
          if (currentStation.longitude) existing.longitude = currentStation.longitude;
        } else if (existing.highestPowerKW === null && currentStation.highestPowerKW !== null) {
          existing.highestPowerKW = currentStation.highestPowerKW;
        }

        if (!existing.postcode && currentStation.postcode) {
          existing.postcode = currentStation.postcode;
        }
      }
    }

    const distinctStations = Array.from(mergedMap.values());
    distinctStations.sort((a, b) => {
      const distA = typeof a.distance === 'number' ? a.distance : Infinity;
      const distB = typeof b.distance === 'number' ? b.distance : Infinity;
      return distA - distB;
    });

    return { distinctStations, defaultProviderTitle, defaultProviderLicense, mergedMap };
  };

  try {
    // Check if LTA_ACCOUNT_KEY is present
    const ltaKey = process.env.LTA_ACCOUNT_KEY;
    const isLtaKeyMissing =
      !ltaKey ||
      typeof ltaKey !== 'string' ||
      ltaKey.trim() === '' ||
      ltaKey === 'undefined';

    // If LTA_ACCOUNT_KEY is missing, skip the LTA check entirely and return the nearest 3 from the first ring with ltaFiltered: false
    if (isLtaKeyMissing) {
      const rawData = await fetchOcm(ROUNDS[0].distance, ROUNDS[0].maxresults);
      const { distinctStations, defaultProviderTitle, defaultProviderLicense } = processAndMerge(rawData);
      const stations = distinctStations.slice(0, 3).map((st) => ({
        ...st,
        ltaFiltered: false,
        searchRadiusKm: ROUNDS[0].distance,
      }));

      return sendResponse(200, {
        stations,
        searchRadiusKm: ROUNDS[0].distance,
        ltaFiltered: false,
        dataProviderTitle: defaultProviderTitle,
        dataProviderLicense: defaultProviderLicense,
      });
    }

    // LTA is configured. Run in rounds to guarantee exactly 3 LTA-confirmed stations.
    let providerTitle = 'Open Charge Map Contributors';
    let providerLicense = 'Licensed under Creative Commons Attribution 4.0 International (CC BY 4.0)';
    const mergedMap = new Map();
    const confirmedStationsMap = new Map(); // key -> confirmed station object
    const checkedStationKeys = new Set(); // keys of stations already evaluated against LTA
    const ltaCache = new Map(); // postalCode -> { liveAvailable, liveTotal } | null

    for (let roundIndex = 0; roundIndex < ROUNDS.length; roundIndex++) {
      const round = ROUNDS[roundIndex];
      const rawData = await fetchOcm(round.distance, round.maxresults);
      const result = processAndMerge(rawData, mergedMap);
      providerTitle = result.defaultProviderTitle;
      providerLicense = result.defaultProviderLicense;

      // In each round, merge duplicates and sort by distance as now,
      // skip any station already checked against LTA in an earlier round,
      // and check the rest against LTA in parallel.
      const candidates = result.distinctStations.filter((st) => {
        const hasPostcode = st.postcode && String(st.postcode).trim() !== '';
        if (!hasPostcode) return false;
        const key = st.mergeKey || String(st.id);
        return !checkedStationKeys.has(key) && !confirmedStationsMap.has(key);
      });

      // Never check more than 25 postal codes in total across all rounds.
      const stationsToCheck = [];
      const newPostcodesToFetch = new Set();

      for (const st of candidates) {
        const code = String(st.postcode).trim();
        if (ltaCache.has(code)) {
          stationsToCheck.push(st);
        } else if (ltaCache.size + newPostcodesToFetch.size < 25) {
          newPostcodesToFetch.add(code);
          stationsToCheck.push(st);
        }
      }

      // Fetch any new postal codes from LTA in parallel
      if (newPostcodesToFetch.size > 0) {
        await Promise.all(
          Array.from(newPostcodesToFetch).map(async (code) => {
            try {
              const ltaUrl = `https://datamall2.mytransport.sg/ltaodataservice/EVChargingPoints?PostalCode=${encodeURIComponent(
                code
              )}`;
              const ltaRes = await fetch(ltaUrl, {
                method: 'GET',
                headers: {
                  AccountKey: ltaKey.trim(),
                  Accept: 'application/json',
                },
              });

              if (!ltaRes.ok) {
                ltaCache.set(code, null);
                return;
              }

              const ltaData = await ltaRes.json();

              let evLocations = [];
              if (Array.isArray(ltaData)) {
                if (ltaData.length > 0 && ltaData[0]?.value?.evLocationsData) {
                  evLocations = ltaData[0].value.evLocationsData;
                } else if (ltaData.length > 0 && ltaData[0]?.evLocationsData) {
                  evLocations = ltaData[0].evLocationsData;
                }
              } else if (ltaData && typeof ltaData === 'object') {
                if (ltaData.value?.evLocationsData) {
                  evLocations = ltaData.value.evLocationsData;
                } else if (ltaData.evLocationsData) {
                  evLocations = ltaData.evLocationsData;
                }
              }

              if (!Array.isArray(evLocations) || evLocations.length === 0) {
                ltaCache.set(code, null);
                return;
              }

              let liveAvailable = 0;
              let liveTotal = 0;

              for (const loc of evLocations) {
                const points = Array.isArray(loc.chargingPoints) ? loc.chargingPoints : [];
                for (const pt of points) {
                  const plugTypes = Array.isArray(pt.plugTypes) ? pt.plugTypes : [];
                  for (const plug of plugTypes) {
                    const evIds = Array.isArray(plug.evIds) ? plug.evIds : [];
                    for (const ev of evIds) {
                      liveTotal += 1;
                      if (ev && ev.status === '1') {
                        liveAvailable += 1;
                      }
                    }
                  }
                }
              }

              ltaCache.set(code, { liveAvailable, liveTotal });
            } catch {
              ltaCache.set(code, null);
            }
          })
        );
      }

      // Check candidates and collect confirmed ones
      for (const st of stationsToCheck) {
        const key = st.mergeKey || String(st.id);
        checkedStationKeys.add(key);
        checkedStationKeys.add(String(st.id));

        const code = String(st.postcode).trim();
        const ltaInfo = ltaCache.get(code);

        if (ltaInfo && typeof ltaInfo.liveTotal === 'number' && ltaInfo.liveTotal >= 0) {
          confirmedStationsMap.set(key, {
            ...st,
            liveAvailable: ltaInfo.liveAvailable,
            liveTotal: ltaInfo.liveTotal,
            ltaFiltered: true,
            searchRadiusKm: round.distance,
          });
        }
      }

      // Stop as soon as 3 confirmed stations are found and return those 3, nearest first
      const currentConfirmed = Array.from(confirmedStationsMap.values());
      if (currentConfirmed.length >= 3) {
        currentConfirmed.sort((a, b) => {
          const distA = typeof a.distance === 'number' ? a.distance : Infinity;
          const distB = typeof b.distance === 'number' ? b.distance : Infinity;
          return distA - distB;
        });

        const stations = currentConfirmed.slice(0, 3).map((st) => ({
          ...st,
          searchRadiusKm: round.distance,
        }));

        return sendResponse(200, {
          stations,
          searchRadiusKm: round.distance,
          ltaFiltered: true,
          dataProviderTitle: providerTitle,
          dataProviderLicense: providerLicense,
        });
      }
    }

    // If all rounds finish with fewer than 3
    const finalConfirmed = Array.from(confirmedStationsMap.values());
    finalConfirmed.sort((a, b) => {
      const distA = typeof a.distance === 'number' ? a.distance : Infinity;
      const distB = typeof b.distance === 'number' ? b.distance : Infinity;
      return distA - distB;
    });

    if (finalConfirmed.length === 0) {
      // If none, return stations: [] with reason: "no-lta-match"
      return sendResponse(200, {
        stations: [],
        reason: 'no-lta-match',
        searchRadiusKm: 35,
        ltaFiltered: true,
        dataProviderTitle: providerTitle,
        dataProviderLicense: providerLicense,
      });
    }

    // Return what was found with reason: "fewer-than-3" and searchRadiusKm: 35
    return sendResponse(200, {
      stations: finalConfirmed.map((st) => ({ ...st, searchRadiusKm: 35 })),
      reason: 'fewer-than-3',
      searchRadiusKm: 35,
      ltaFiltered: true,
      dataProviderTitle: providerTitle,
      dataProviderLicense: providerLicense,
    });
  } catch (err) {
    if (err && err.refused && err.status) {
      return sendResponse(err.status, {
        error: `Upstream Open Charge Map API refused request with status ${err.status}.`,
        upstreamStatus: err.status,
        refused: true,
      });
    }
    return sendResponse(502, {
      error: 'Upstream Open Charge Map is unreachable.',
      unreachable: true,
    });
  }
}
