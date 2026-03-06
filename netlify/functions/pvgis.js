/**
 * Netlify Function: PVGIS Proxy
 * Proxies requests to the EU PVGIS API to avoid CORS restrictions
 *
 * PVGIS API docs: https://re.jrc.ec.europa.eu/pvg_tools/en/
 * Endpoint: https://re.jrc.ec.europa.eu/api/v5_3/PVcalc
 */

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=86400"  // Cache 24h (climate data is stable)
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const params = event.queryStringParameters || {};

    // Validate required parameters
    if (!params.lat || !params.lon) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required parameters: lat, lon" })
      };
    }

    const lat = parseFloat(params.lat);
    const lon = parseFloat(params.lon);

    // Validate coordinate ranges (Europe broadly)
    if (lat < 25 || lat > 72 || lon < -25 || lon > 45) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Coordinates outside European coverage area" })
      };
    }

    // Build PVGIS API URL
    const pvgisUrl = new URL("https://re.jrc.ec.europa.eu/api/v5_3/PVcalc");
    pvgisUrl.searchParams.set("lat", lat.toFixed(4));
    pvgisUrl.searchParams.set("lon", lon.toFixed(4));
    pvgisUrl.searchParams.set("peakpower", params.peakpower || "1");
    pvgisUrl.searchParams.set("loss", params.loss || "14");
    pvgisUrl.searchParams.set("angle", params.angle || "30");
    pvgisUrl.searchParams.set("aspect", params.aspect || "0");  // 0 = South
    pvgisUrl.searchParams.set("outputformat", "json");
    pvgisUrl.searchParams.set("pvcalculation", "1");

    // Optional: mounting type
    if (params.mountingplace) {
      pvgisUrl.searchParams.set("mountingplace", params.mountingplace);
    }

    // Fetch from PVGIS with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);  // 8s timeout

    const response = await fetch(pvgisUrl.toString(), {
      signal: controller.signal,
      headers: { "Accept": "application/json" }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: "PVGIS API error",
          status: response.status,
          detail: errorText.substring(0, 500)
        })
      };
    }

    const data = await response.json();

    // Extract key results
    const result = {
      success: true,
      location: {
        lat: lat,
        lon: lon,
        elevation: data.inputs?.location?.elevation || null
      },
      annual: {
        energyPerKwp: data.outputs?.totals?.fixed?.E_y || null,  // kWh/kWp/year
        irradiation: data.outputs?.totals?.fixed?.["H(i)_y"] || null,  // kWh/m²/year
        irradiationOptimal: data.outputs?.totals?.fixed?.["H(i)_y"] || null
      },
      monthly: (data.outputs?.monthly?.fixed || []).map(m => ({
        month: m.month,
        energyPerKwp: m.E_m,  // kWh/kWp for this month
        irradiation: m["H(i)_m"]  // kWh/m² for this month
      })),
      metadata: {
        pvgisVersion: data.meta?.pvgis_version || "5.3",
        database: data.inputs?.meteo_data?.radiation_db || "PVGIS-SARAH2"
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    if (error.name === "AbortError") {
      return {
        statusCode: 504,
        headers,
        body: JSON.stringify({ error: "PVGIS API timeout (>8s)" })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal error", detail: error.message })
    };
  }
};
