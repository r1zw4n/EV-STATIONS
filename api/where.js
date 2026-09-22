/**
 * Serverless reverse-geocoding endpoint to resolve GPS coordinates to a friendly place name.
 * Located at api/where.js for Vercel deployment.
 */
export default async function handler(req, res) {
  // Cache with Cache-Control: s-maxage=86400, stale-while-revalidate=172800 because place names do not change
  if (typeof res.setHeader === 'function') {
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800');
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

  // Extract query parameters
  let rawLat = null;
  let rawLng = null;

  try {
    const urlObj = new URL(req.url || '/', `http://${req.headers?.host || 'localhost'}`);
    rawLat = req.query?.lat || urlObj.searchParams.get('lat');
    rawLng = req.query?.lng || urlObj.searchParams.get('lng');
  } catch {
    // URL parsing fallback
  }

  const numLat = Number(rawLat);
  const numLng = Number(rawLng);

  if (
    rawLat === null ||
    rawLat === undefined ||
    rawLng === null ||
    rawLng === undefined ||
    isNaN(numLat) ||
    isNaN(numLng)
  ) {
    return sendResponse(400, { label: null, upstreamStatus: 400 });
  }

  // Round both to 3 decimal places BEFORE anything else
  const lat = Math.round(numLat * 1000) / 1000;
  const lng = Math.round(numLng * 1000) / 1000;

  const upstreamUrl = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(
    lat
  )}&lon=${encodeURIComponent(lng)}&format=jsonv2&zoom=16`;

  try {
    const upstreamRes = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'EVStationsApp/1.0 (student project)',
        'Accept': 'application/json',
      },
    });

    // Check response.ok before reading the body; on any failure return { label: null } with the upstream status in the JSON.
    if (!upstreamRes.ok) {
      return sendResponse(upstreamRes.status, {
        label: null,
        upstreamStatus: upstreamRes.status,
      });
    }

    const data = await upstreamRes.json();
    const address = data?.address || {};

    let label = null;
    // Order of preference: address.suburb, address.neighbourhood, address.road, else text before first comma in display_name
    if (address.suburb && typeof address.suburb === 'string' && address.suburb.trim()) {
      label = address.suburb.trim();
    } else if (
      address.neighbourhood &&
      typeof address.neighbourhood === 'string' &&
      address.neighbourhood.trim()
    ) {
      label = address.neighbourhood.trim();
    } else if (address.road && typeof address.road === 'string' && address.road.trim()) {
      label = address.road.trim();
    } else if (
      data?.display_name &&
      typeof data.display_name === 'string' &&
      data.display_name.trim()
    ) {
      const firstComma = data.display_name.indexOf(',');
      label =
        (firstComma !== -1 ? data.display_name.slice(0, firstComma) : data.display_name).trim() ||
        null;
    }

    return sendResponse(200, { label });
  } catch (error) {
    return sendResponse(502, {
      label: null,
      upstreamStatus: 502,
      error: error instanceof Error ? error.message : 'Upstream error',
    });
  }
}
