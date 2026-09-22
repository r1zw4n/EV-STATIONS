/**
 * Serverless function for Open Charge Map station retrieval.
 * Located at api/stations.js in the project root for Vercel deployment.
 */
export default async function handler(req, res) {
  // Cache response for one hour as required
  if (typeof res.setHeader === 'function') {
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
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

  const upstreamUrl = `https://api.openchargemap.io/v3/poi/?output=json&countrycode=SG&latitude=${encodeURIComponent(
    lat
  )}&longitude=${encodeURIComponent(
    lng
  )}&distance=10&distanceunit=KM&maxresults=8&compact=false&verbose=false`;

  // 3. Call upstream with X-API-Key in header, never in URL
  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey.trim(),
        'User-Agent': 'EVStationsApp/1.0',
        Accept: 'application/json',
      },
    });

    // AFTER the fetch: check response.ok before reading body
    if (!upstreamResponse.ok) {
      return sendResponse(upstreamResponse.status, {
        error: `Upstream Open Charge Map API refused request with status ${upstreamResponse.status}.`,
        upstreamStatus: upstreamResponse.status,
        refused: true,
      });
    }

    const rawData = await upstreamResponse.json();

    if (!Array.isArray(rawData)) {
      return sendResponse(200, {
        stations: [],
        dataProviderTitle: null,
        dataProviderLicense: null,
      });
    }

    // Return ONLY the fields the screen needs
    let defaultProviderTitle = 'Open Charge Map Contributors';
    let defaultProviderLicense =
      'Licensed under Creative Commons Attribution 4.0 International (CC BY 4.0)';

    const mergedMap = new Map();

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

      // 1) If AddressInfo.Title is 40 characters or fewer and does not contain " at ", keep it as is (e.g. "BCA Academy").
      // 2) Otherwise, if it contains " at " (case-insensitive), use only the text after the last " at ", trimmed.
      // 3) If there is still no title, or it is longer than 40 characters, use AddressInfo.AddressLine1 instead.
      // 4) If the final title is identical to AddressLine1, show AddressInfo.Town on the address line under it instead of repeating the same text twice.
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

      // Compare AddressInfo.AddressLine1 after trimming, lowercasing, and removing punctuation and repeated spaces
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
      };

      if (!mergedMap.has(mergeKey)) {
        mergedMap.set(mergeKey, currentStation);
      } else {
        const existing = mergedMap.get(mergeKey);

        // Keep track of how many OCM entries this site came from
        existing.mergedCount = (existing.mergedCount || 1) + 1;

        // Keep the shorter distance
        if (existing.distance === null) {
          existing.distance = currentStation.distance;
        } else if (currentStation.distance !== null && currentStation.distance < existing.distance) {
          existing.distance = currentStation.distance;
        }

        // Take the LARGER numberOfPoints (never add them, they may be the same chargers)
        const existingPts = typeof existing.numberOfPoints === 'number' ? existing.numberOfPoints : 1;
        const currentPts = typeof currentStation.numberOfPoints === 'number' ? currentStation.numberOfPoints : 1;
        existing.numberOfPoints = Math.max(existingPts, currentPts);

        // Take the HIGHER highestPowerKW and keep the title of the entry with the higher kW
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

    // Sort by distance and return the 3 nearest distinct sites
    const distinctStations = Array.from(mergedMap.values());
    distinctStations.sort((a, b) => {
      const distA = typeof a.distance === 'number' ? a.distance : Infinity;
      const distB = typeof b.distance === 'number' ? b.distance : Infinity;
      return distA - distB;
    });

    const stations = distinctStations.slice(0, 3);

    return sendResponse(200, {
      stations,
      dataProviderTitle: defaultProviderTitle,
      dataProviderLicense: defaultProviderLicense,
    });
  } catch {
    return sendResponse(502, {
      error: 'Upstream Open Charge Map is unreachable.',
      unreachable: true,
    });
  }
}
