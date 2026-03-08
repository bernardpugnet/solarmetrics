/**
 * Netlify Function: NREL PVWatts V8 Proxy
 * Proxies requests to NREL PVWatts API for US + Canada solar irradiation data.
 * Keeps the API key server-side (env var NREL_API_KEY).
 *
 * NREL PVWatts V8 docs: https://developer.nrel.gov/docs/solar/pvwatts/v8/
 *
 * Two modes:
 *   - Default (annual/monthly): returns annual + monthly energy production
 *   - Hourly: returns 8760 hourly values (for autoconsommation simulator)
 *     Triggered by adding &mode=hourly
 *
 * Key differences vs PVGIS:
 *   - Azimuth: NREL uses 180=South (same convention as PVGIS aspect=0)
 *   - Output: ac_annual (kWh/year), solrad_annual (kWh/m²/day), ac_monthly[], solrad_monthly[]
 *   - Covers US + Canada (+ some international via intl dataset)
 */

exports.handler = async function(event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=86400"  // 24h cache (climate data is stable)
  };

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

    // ── Validate required params ──
    if (!params.lat || !params.lon) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required parameters: lat, lon" })
      };
    }

    const lat = parseFloat(params.lat);
    const lon = parseFloat(params.lon);

    // Validate coordinates (North America: roughly lat 24-72, lon -170 to -50)
    if (lat < 24 || lat > 72 || lon < -170 || lon > -50) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Coordinates outside North America coverage area" })
      };
    }

    // ── API key ──
    const apiKey = process.env.NREL_API_KEY || "DEMO_KEY";

    // ── Build PVWatts V8 URL ──
    const pvwattsUrl = new URL("https://developer.nrel.gov/api/pvwatts/v8.json");
    pvwattsUrl.searchParams.set("api_key", apiKey);
    pvwattsUrl.searchParams.set("lat", lat.toFixed(4));
    pvwattsUrl.searchParams.set("lon", lon.toFixed(4));
    pvwattsUrl.searchParams.set("system_capacity", params.system_capacity || "1");  // kW
    pvwattsUrl.searchParams.set("losses", params.losses || "14");
    pvwattsUrl.searchParams.set("tilt", params.tilt || "30");
    pvwattsUrl.searchParams.set("azimuth", params.azimuth || "180");  // 180 = South
    pvwattsUrl.searchParams.set("array_type", params.array_type || "1");  // 1 = fixed roof
    pvwattsUrl.searchParams.set("module_type", params.module_type || "1");  // 1 = standard

    const isHourly = params.mode === "hourly";
    if (isHourly) {
      pvwattsUrl.searchParams.set("timeframe", "hourly");
      headers["Cache-Control"] = "public, max-age=604800";  // 7 days for hourly
    }

    // ── Fetch from NREL ──
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), isHourly ? 20000 : 10000);

    const response = await fetch(pvwattsUrl.toString(), {
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
          error: "NREL PVWatts API error",
          status: response.status,
          detail: errorText.substring(0, 500)
        })
      };
    }

    const data = await response.json();

    // ── Check for NREL errors in response body ──
    if (data.errors && data.errors.length > 0) {
      return {
        statusCode: 422,
        headers,
        body: JSON.stringify({
          error: "NREL PVWatts error",
          detail: data.errors.join("; ")
        })
      };
    }

    const outputs = data.outputs || {};
    const inputs = data.inputs || {};
    const station = data.station_info || {};

    // ── Hourly mode ──
    if (isHourly && outputs.ac) {
      // outputs.ac = array of 8760 hourly AC power values (watts)
      // outputs.dn, outputs.df, outputs.tamb also available
      const hourly = outputs.ac.map((ac, i) => ({
        hour: i,
        P: Math.round(ac * 10) / 10,         // AC power in watts
        Gi: outputs.poa ? Math.round(outputs.poa[i] * 10) / 10 : null,  // POA irradiance W/m²
        T: outputs.tamb ? Math.round(outputs.tamb[i] * 10) / 10 : null  // Ambient temp °C
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          mode: "hourly",
          location: {
            lat: lat,
            lon: lon,
            city: station.city || null,
            state: station.state || null,
            elevation: station.elev || null,
            solarResource: station.solar_resource_file || null
          },
          hourly: hourly,
          totalHours: hourly.length,
          annual: {
            energyPerKw: outputs.ac_annual || null,     // kWh/kW/year
            solarRadDaily: outputs.solrad_annual || null  // kWh/m²/day average
          },
          metadata: {
            source: "NREL PVWatts V8",
            dataset: station.solar_resource_file || "TMY",
            systemCapacity: parseFloat(params.system_capacity || "1"),
            losses: parseFloat(params.losses || "14"),
            tilt: parseFloat(params.tilt || "30"),
            azimuth: parseFloat(params.azimuth || "180")
          }
        })
      };
    }

    // ── Monthly/Annual mode (default) ──
    // Convert NREL output to a format similar to PVGIS for easy consumption
    const monthlyAC = outputs.ac_monthly || [];     // kWh per month (12 values)
    const monthlySolrad = outputs.solrad_monthly || []; // kWh/m²/day per month

    const monthly = monthlyAC.map((ac, i) => ({
      month: i + 1,
      energyPerKw: Math.round(ac * 100) / 100,    // kWh/kW for this month
      irradiationDaily: monthlySolrad[i] || null    // kWh/m²/day average
    }));

    // NREL gives ac_annual in kWh for the system_capacity specified
    // Since we request system_capacity=1kW, this is kWh/kWp/year
    const annualEnergy = outputs.ac_annual || null;

    // Convert solrad_annual (kWh/m²/day) to annual (kWh/m²/year) for comparability
    const annualIrradiation = outputs.solrad_annual
      ? Math.round(outputs.solrad_annual * 365.25 * 100) / 100
      : null;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        mode: "monthly",
        location: {
          lat: lat,
          lon: lon,
          city: station.city || null,
          state: station.state || null,
          elevation: station.elev || null,
          solarResource: station.solar_resource_file || null
        },
        annual: {
          energyPerKwp: annualEnergy,        // kWh/kWp/year (comparable to PVGIS E_y)
          irradiation: annualIrradiation     // kWh/m²/year (plane of array)
        },
        monthly: monthly,
        metadata: {
          source: "NREL PVWatts V8",
          dataset: station.solar_resource_file || "TMY",
          systemCapacity: parseFloat(params.system_capacity || "1"),
          losses: parseFloat(params.losses || "14"),
          tilt: parseFloat(params.tilt || "30"),
          azimuth: parseFloat(params.azimuth || "180")
        }
      })
    };

  } catch (error) {
    if (error.name === "AbortError") {
      return {
        statusCode: 504,
        headers,
        body: JSON.stringify({ error: "NREL PVWatts API timeout — please retry" })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal error", detail: error.message })
    };
  }
};
