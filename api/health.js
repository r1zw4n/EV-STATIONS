/**
 * Health check serverless function.
 * Reports whether OCM_API_KEY is configured and whether upstream answered.
 * Never prints or exposes the credential.
 */
export default async function handler(req, res) {
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
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

  const apiKey = process.env.OCM_API_KEY;
  const keyConfigured = Boolean(
    apiKey &&
      typeof apiKey === 'string' &&
      apiKey.trim() !== '' &&
      apiKey !== 'undefined'
  );

  if (!keyConfigured) {
    return sendResponse(200, {
      keyConfigured: false,
      upstreamAnswered: false,
      upstreamStatus: null,
      message: 'OCM_API_KEY is not configured or is empty',
    });
  }

  try {
    const upstreamResponse = await fetch(
      'https://api.openchargemap.io/v3/poi/?output=json&countrycode=SG&maxresults=1',
      {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey.trim(),
          'User-Agent': 'EVStationsApp/1.0',
          Accept: 'application/json',
        },
      }
    );

    return sendResponse(200, {
      keyConfigured: true,
      upstreamAnswered: true,
      upstreamStatus: upstreamResponse.status,
      upstreamOk: upstreamResponse.ok,
    });
  } catch {
    return sendResponse(200, {
      keyConfigured: true,
      upstreamAnswered: false,
      upstreamStatus: null,
      upstreamOk: false,
      message: 'Upstream Open Charge Map is unreachable',
    });
  }
}
