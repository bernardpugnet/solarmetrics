/**
 * Netlify Function: PVGIS Proxy
 * Proxies requests to the EU PVGIS API to avoid CORS restrictions
 *
 * PVGIS API docs: https://re.jrc.ec.europa.eu/pvg_tools/en/
 *
 * Two modes:
 *   - Default (PVcalc): monthly/annual totals (existing behavior)
 *   - Hourly (seriescalc): 8760 hourly values for autoconsommation simulator
 *     Triggered by adding &mode=hourly to the request
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

    // Validate coordinate ranges (Europe + Africa + Western Asia — PVGIS coverage)
    if (lat < 25 || lat > 72 || lon < -25 || lon > 45) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Coordinates outside European coverage area" })
      };
    }

    const isHourly = params.mode === "hourly";

    // ─────────────────────────────────────────────
    // MODE HOURLY: seriescalc endpoint (8760 values)
    // ─────────────────────────────────────────────
    if (isHourly) {
      // Use longer cache for hourly data (7 days — TMY data is very stable)
      headers["Cache-Control"] = "public, max-age=604800";

      const pvgisUrl = new URL("https://re.jrc.ec.europa.eu/api/v5_3/seriescalc");
      pvgisUrl.searchParams.set("lat", lat.toFixed(4));
      pvgisUrl.searchParams.set("lon", lon.toFixed(4));
      pvgisUrl.searchParams.set("peakpower", params.peakpower || "1");
      pvgisUrl.searchParams.set("loss", params.loss || "14");
      pvgisUrl.searchParams.set("angle", params.angle || "30");
      pvgisUrl.searchParams.set("aspect", params.aspect || "0");
      pvgisUrl.searchParams.set("outputformat", "json");
      pvgisUrl.searchParams.set("pvcalculation", "1");
      // Non-leap year for consistent 8760 hours (GPT review fix)
      pvgisUrl.searchParams.set("startyear", "2023");
      pvgisUrl.searchParams.set("endyear", "2023");
      // Local time to match consumption profiles (GPT review fix — critical!)
      pvgisUrl.searchParams.set("localtime", "1");

      if (params.mountingplace) {
        pvgisUrl.searchParams.set("mountingplace", params.mountingplace);
      }

      // Longer timeout for hourly data (~500 Ko response)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);  // 15s timeout

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
      const hourlyRaw = data.outputs?.hourly || [];

      // Extract only what we need to minimize response size
      // P = power in watts, G(i) = irradiance W/m², T2m = temperature °C
      const hourly = hourlyRaw.map(h => ({
        time: h.time,               // "20230615:1210" (local time, no DST)
        P: Math.round(h.P * 10) / 10,          // Power in watts (1 decimal)
        Gi: Math.round(h["G(i)"] * 10) / 10,   // Irradiance W/m² (1 decimal)
        T: Math.round(h.T2m * 10) / 10         // Temperature °C (1 decimal)
      }));

      const result = {
        success: true,
        mode: "hourly",
        location: {
          lat: lat,
          lon: lon,
          elevation: data.inputs?.location?.elevation || null
        },
        hourly: hourly,
        totalHours: hourly.length,
        metadata: {
          pvgisVersion: data.meta?.pvgis_version || "5.3",
          database: data.inputs?.meteo_data?.radiation_db || "PVGIS-SARAH3",
          year: 2023,
          timeReference: "local time (no DST)",
          peakpower: parseFloat(params.peakpower || "1"),
          loss: parseFloat(params.loss || "14"),
          angle: parseFloat(params.angle || "30"),
          aspect: parseFloat(params.aspect || "0")
        }
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
    }

    // ─────────────────────────────────────────────
    // MODE DEFAULT: PVcalc endpoint (monthly/annual)
    // ─────────────────────────────────────────────
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
      mode: "monthly",
      location: {
        lat: lat,
        lon: lon,
        elevation: data.inputs?.location?.elevation || null
      },
      annual: {
        energyPerKwp: data.outputs?.totals?.fixed?.E_y || null,  // kWh/kWp/year
        irradiation: data.outputs?.totals?.fixed?.["H(i)_y"] || null,  // kWh/m²/year (plane of array)
        irradiationOptimal: data.outputs?.totals?.fixed?.["H(i_opt)_y"] || data.outputs?.totals?.fixed?.["H(i)_y"] || null  // kWh/m²/year (optimal angle)
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
        body: JSON.stringify({ error: "PVGIS API timeout — please retry in a few seconds" })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal error", detail: error.message })
    };
  }
};
