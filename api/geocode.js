/**
 * Serverless geocoding endpoint to resolve a Singapore postal code or place name
 * into coordinates (lat, lng) and a friendly label.
 * Uses OneMap API (official Singapore mapping API) with fallback to OpenStreetMap Nominatim.
 * Located at api/geocode.js for Vercel and local Vite middleware.
 */
export default async function handler(req, res) {
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

  let query = '';
  try {
    const urlObj = new URL(req.url || '/', `http://${req.headers?.host || 'localhost'}`);
    query = req.query?.q || urlObj.searchParams.get('q') || '';
  } catch {
    // URL parsing fallback
  }

  const cleanQuery = typeof query === 'string' ? query.trim() : '';

  if (!cleanQuery) {
    return sendResponse(400, {
      error: 'Missing query parameter "q".',
      lat: null,
      lng: null,
      label: null,
    });
  }

  // Check 1: OneMap search (optimized for Singapore addresses, postal codes, and landmarks)
  try {
    const oneMapUrl = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(
      cleanQuery
    )}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;

    const omRes = await fetch(oneMapUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'EVStationsApp/1.0',
      },
    });

    if (omRes.ok) {
      const omData = await omRes.json();
      if (omData && Array.isArray(omData.results) && omData.results.length > 0) {
        const first = omData.results[0];
        const lat = parseFloat(first.LATITUDE);
        const lng = parseFloat(first.LONGITUDE);

        if (!isNaN(lat) && !isNaN(lng)) {
          const label =
            first.SEARCHVAL ||
            first.BUILDING ||
            first.ROAD_NAME ||
            first.ADDRESS ||
            cleanQuery;

          let postalCode = null;
          if (/^\d{6}$/.test(cleanQuery)) {
            postalCode = cleanQuery;
          } else {
            if (first.POSTAL && /^\d{6}$/.test(first.POSTAL)) {
              postalCode = first.POSTAL;
            } else {
              for (const r of omData.results) {
                if (r.POSTAL && /^\d{6}$/.test(r.POSTAL)) {
                  postalCode = r.POSTAL;
                  break;
                }
              }
              if (!postalCode) {
                for (const r of omData.results) {
                  const m = (r.ADDRESS || '').match(/\b(\d{6})\b/);
                  if (m) {
                    postalCode = m[1];
                    break;
                  }
                }
              }
            }
          }

          if (!postalCode && !isNaN(lat) && !isNaN(lng)) {
            try {
              const revRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2`,
                {
                  headers: {
                    'User-Agent': 'EVStationsApp/1.0 (student project)',
                    Accept: 'application/json',
                  },
                }
              );
              if (revRes.ok) {
                const revData = await revRes.json();
                if (revData?.address?.postcode && /^\d{6}$/.test(revData.address.postcode)) {
                  postalCode = revData.address.postcode;
                }
              }
            } catch {}
          }

          return sendResponse(200, {
            lat,
            lng,
            label,
            postalCode,
            postal: postalCode,
            source: 'onemap',
          });
        }
      }
    }
  } catch (err) {
    console.warn('OneMap search error:', err);
  }

  // Check 2: Fallback to OpenStreetMap Nominatim restricted to Singapore (countrycodes=sg)
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      cleanQuery
    )}&countrycodes=sg&format=jsonv2&limit=1&addressdetails=1`;

    const osmRes = await fetch(osmUrl, {
      headers: {
        'User-Agent': 'EVStationsApp/1.0 (student project)',
        Accept: 'application/json',
      },
    });

    if (osmRes.ok) {
      const osmData = await osmRes.json();
      if (Array.isArray(osmData) && osmData.length > 0) {
        const first = osmData[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);

        if (!isNaN(lat) && !isNaN(lng)) {
          const commaIdx = (first.display_name || '').indexOf(',');
          const label =
            commaIdx > 0
              ? first.display_name.slice(0, commaIdx).trim()
              : first.display_name || cleanQuery;

          let postalCode = null;
          if (/^\d{6}$/.test(cleanQuery)) {
            postalCode = cleanQuery;
          } else if (first.address?.postcode && /^\d{6}$/.test(first.address.postcode)) {
            postalCode = first.address.postcode;
          } else if (first.display_name) {
            const m = first.display_name.match(/\b(\d{6})\b/);
            if (m) postalCode = m[1];
          }

          if (!postalCode) {
            try {
              const revRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2`,
                {
                  headers: {
                    'User-Agent': 'EVStationsApp/1.0 (student project)',
                    Accept: 'application/json',
                  },
                }
              );
              if (revRes.ok) {
                const revData = await revRes.json();
                if (revData?.address?.postcode && /^\d{6}$/.test(revData.address.postcode)) {
                  postalCode = revData.address.postcode;
                }
              }
            } catch {}
          }

          return sendResponse(200, {
            lat,
            lng,
            label,
            postalCode,
            postal: postalCode,
            source: 'osm',
          });
        }
      }
    }
  } catch (err) {
    console.warn('Nominatim search fallback error:', err);
  }

  // Not found
  return sendResponse(404, {
    error: `Could not find Singapore coordinates for "${cleanQuery}". Try a postal code or known place name.`,
    lat: null,
    lng: null,
    label: null,
  });
}
