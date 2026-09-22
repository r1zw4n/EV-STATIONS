/**
 * Serverless function for LTA DataMall EV Charging Points availability.
 * Located at api/availability.js in the project root for Vercel deployment.
 */
export default async function handler(req, res) {
  // Cache response for 5 minutes (300s) as LTA updates every 5 minutes
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

  // 1. BEFORE the fetch: if LTA_ACCOUNT_KEY is missing or empty, return 503 naming the variable
  const accountKey = process.env.LTA_ACCOUNT_KEY;
  if (
    !accountKey ||
    typeof accountKey !== 'string' ||
    accountKey.trim() === '' ||
    accountKey === 'undefined'
  ) {
    return sendResponse(503, {
      error: 'Environment variable LTA_ACCOUNT_KEY is missing or empty.',
      variable: 'LTA_ACCOUNT_KEY',
      refused: true,
    });
  }

  // 2. Accept 6-digit postal code from ?postal= query parameter, defaulting to 038983
  let postal = '038983';
  try {
    const urlObj = new URL(req.url || '/', `http://${req.headers?.host || 'localhost'}`);
    const queryPostal = req.query?.postal || urlObj.searchParams.get('postal');
    if (queryPostal && typeof queryPostal === 'string' && queryPostal.trim() !== '') {
      postal = queryPostal.trim();
    }
  } catch {
    // Keep default postal code
  }

  const upstreamUrl = `https://datamall2.mytransport.sg/ltaodataservice/EVChargingPoints?PostalCode=${encodeURIComponent(
    postal
  )}`;

  // 3. Call upstream with AccountKey in header
  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        AccountKey: accountKey.trim(),
        Accept: 'application/json',
      },
    });

    // AFTER the fetch: check response.ok before reading body
    if (!upstreamResponse.ok) {
      return sendResponse(upstreamResponse.status, {
        error: `Upstream LTA DataMall API refused request with status ${upstreamResponse.status}.`,
        upstreamStatus: upstreamResponse.status,
        refused: true,
      });
    }

    const rawData = await upstreamResponse.json();

    // Upstream response may be [{ value: { evLocationsData: [...] } }] or { value: { evLocationsData: [...] } }
    let evLocations = [];
    if (Array.isArray(rawData)) {
      if (rawData.length > 0 && rawData[0]?.value?.evLocationsData) {
        evLocations = rawData[0].value.evLocationsData;
      } else if (rawData.length > 0 && rawData[0]?.evLocationsData) {
        evLocations = rawData[0].evLocationsData;
      }
    } else if (rawData && typeof rawData === 'object') {
      if (rawData.value?.evLocationsData) {
        evLocations = rawData.value.evLocationsData;
      } else if (rawData.evLocationsData) {
        evLocations = rawData.evLocationsData;
      }
    }

    if (!Array.isArray(evLocations) || evLocations.length === 0) {
      return sendResponse(200, {
        postalCode: postal,
        totalAvailable: 0,
        totalConnectors: 0,
        groups: [],
        fetchedAt: new Date().toISOString(),
      });
    }

    // Process all chargingPoints across evLocationsData
    // Group chargers by their "name" field because one postal code can hold several sites.
    // For each charger return: name, address, operator, position
    // For each plug return: plugType, powerRating, chargingSpeed Number(), price Number(), and connectors under evIds with status.
    // A connector is available when its status is the STRING "1", occupied when "0", not available when null or "".
    // Compare against strings, never numbers.
    // Ignore operatingHours, id and the location-level status; they are empty.
    const groupMap = new Map();

    for (const loc of evLocations) {
      const locAddress = loc.address || '';
      const points = Array.isArray(loc.chargingPoints) ? loc.chargingPoints : [];

      for (const pt of points) {
        const groupName = (pt.name || loc.name || 'EV Charging Site').trim();

        if (!groupMap.has(groupName)) {
          groupMap.set(groupName, {
            name: groupName,
            address: locAddress,
            availableConnectors: 0,
            totalConnectors: 0,
            chargers: [],
          });
        }

        const group = groupMap.get(groupName);

        const rawPlugTypes = Array.isArray(pt.plugTypes) ? pt.plugTypes : [];
        const processedPlugs = [];

        for (const plug of rawPlugTypes) {
          const rawEvIds = Array.isArray(plug.evIds) ? plug.evIds : [];
          const connectors = [];

          for (const ev of rawEvIds) {
            const rawStatus = ev.status;
            let statusStr = '';
            if (rawStatus === '1') {
              statusStr = '1';
              group.availableConnectors += 1;
            } else if (rawStatus === '0') {
              statusStr = '0';
            } else {
              statusStr = '';
            }

            group.totalConnectors += 1;

            connectors.push({
              evCpId: ev.evCpId || '',
              status: statusStr,
            });
          }

          processedPlugs.push({
            plugType: plug.plugType || '',
            powerRating: plug.powerRating || '',
            chargingSpeed: Number(plug.chargingSpeed) || 0,
            price: Number(plug.price) || 0,
            priceType: plug.priceType || 'kWh',
            connectors,
          });
        }

        group.chargers.push({
          name: pt.name || groupName,
          address: locAddress,
          operator: pt.operator || '',
          position: pt.position || '',
          plugs: processedPlugs,
        });
      }
    }

    const groups = Array.from(groupMap.values());
    const overallAvailable = groups.reduce((sum, g) => sum + g.availableConnectors, 0);
    const overallTotal = groups.reduce((sum, g) => sum + g.totalConnectors, 0);

    return sendResponse(200, {
      postalCode: postal,
      totalAvailable: overallAvailable,
      totalConnectors: overallTotal,
      groups,
      fetchedAt: new Date().toISOString(),
    });
  } catch {
    return sendResponse(502, {
      error: 'Upstream LTA DataMall is unreachable.',
      unreachable: true,
    });
  }
}
