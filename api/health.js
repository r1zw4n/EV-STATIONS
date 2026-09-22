/**
 * Health check serverless function.
 * Reports whether OCM_API_KEY and LTA_ACCOUNT_KEY are configured separately,
 * plus the upstream HTTP status for each.
 * Never prints or exposes either credential.
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

  const ocmKey = process.env.OCM_API_KEY;
  const ocmKeyConfigured = Boolean(
    ocmKey &&
      typeof ocmKey === 'string' &&
      ocmKey.trim() !== '' &&
      ocmKey !== 'undefined'
  );

  const ltaKey = process.env.LTA_ACCOUNT_KEY;
  const ltaKeyConfigured = Boolean(
    ltaKey &&
      typeof ltaKey === 'string' &&
      ltaKey.trim() !== '' &&
      ltaKey !== 'undefined'
  );

  let ocmUpstreamAnswered = false;
  let ocmUpstreamStatus = null;
  let ocmUpstreamOk = false;

  if (ocmKeyConfigured) {
    try {
      const ocmRes = await fetch(
        'https://api.openchargemap.io/v3/poi/?output=json&countrycode=SG&maxresults=1',
        {
          method: 'GET',
          headers: {
            'X-API-Key': ocmKey.trim(),
            'User-Agent': 'EVStationsApp/1.0',
            Accept: 'application/json',
          },
        }
      );
      ocmUpstreamAnswered = true;
      ocmUpstreamStatus = ocmRes.status;
      ocmUpstreamOk = ocmRes.ok;
    } catch {
      ocmUpstreamAnswered = false;
      ocmUpstreamStatus = null;
      ocmUpstreamOk = false;
    }
  }

  let ltaUpstreamAnswered = false;
  let ltaUpstreamStatus = null;
  let ltaUpstreamOk = false;

  if (ltaKeyConfigured) {
    try {
      const ltaRes = await fetch(
        'https://datamall2.mytransport.sg/ltaodataservice/EVChargingPoints?PostalCode=038983',
        {
          method: 'GET',
          headers: {
            AccountKey: ltaKey.trim(),
            Accept: 'application/json',
          },
        }
      );
      ltaUpstreamAnswered = true;
      ltaUpstreamStatus = ltaRes.status;
      ltaUpstreamOk = ltaRes.ok;
    } catch {
      ltaUpstreamAnswered = false;
      ltaUpstreamStatus = null;
      ltaUpstreamOk = false;
    }
  }

  return sendResponse(200, {
    ocmKeyConfigured,
    ocmUpstreamAnswered,
    ocmUpstreamStatus,
    ocmUpstreamOk,
    ltaKeyConfigured,
    ltaUpstreamAnswered,
    ltaUpstreamStatus,
    ltaUpstreamOk,
    keyConfigured: ocmKeyConfigured && ltaKeyConfigured,
  });
}
