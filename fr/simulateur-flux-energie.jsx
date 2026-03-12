import { useState, useEffect, useCallback, useMemo } from "react";

// ── Location data: peak sun hours (PSH) and typical irradiance profiles ──
const LOCATIONS = {
  "Marseille": { lat: 43.3, psh: 5.2, label: "Marseille (Sud)", emoji: "☀️" },
  "Lyon": { lat: 45.75, psh: 4.2, label: "Lyon (Centre)", emoji: "⛅" },
  "Paris": { lat: 48.85, psh: 3.5, label: "Paris (Nord)", emoji: "🌥️" },
  "Lille": { lat: 50.63, psh: 3.0, label: "Lille (Nord)", emoji: "☁️" },
  "Bordeaux": { lat: 44.84, psh: 4.5, label: "Bordeaux (Ouest)", emoji: "⛅" },
  "Strasbourg": { lat: 48.57, psh: 3.6, label: "Strasbourg (Est)", emoji: "🌥️" },
};

const PANEL_OPTIONS = [400, 600, 800, 1200, 1600];
const BATTERY_OPTIONS = [0, 1, 2, 3, 5];

// Electricity price €/kWh (EDF tarif bleu 2026 estimate)
const GRID_PRICE = 0.2516;
// OA surplus injection price €/kWh
const OA_PRICE = 0.13;

// ── Solar production profile (normalized bell curve, peak at 13h solar) ──
function solarProfile(hour, peakWatts, psh) {
  if (hour < 6 || hour > 20) return 0;
  const center = 13;
  const sigma = 3.2;
  const gaussian = Math.exp(-0.5 * Math.pow((hour - center) / sigma, 2));
  // Scale so that integral ≈ psh hours of peak production
  const scaleFactor = psh / 4.8; // normalized to Marseille baseline
  return peakWatts * gaussian * scaleFactor;
}

// ── Household consumption profile (typical French, Watts) ──
function consumptionProfile(hour) {
  // Base load ~200W, morning peak ~800W (7-9h), evening peak ~1200W (18-21h)
  const base = 200;
  const morningPeak = 600 * Math.exp(-0.5 * Math.pow((hour - 8) / 1.2, 2));
  const eveningPeak = 1000 * Math.exp(-0.5 * Math.pow((hour - 19.5) / 1.5, 2));
  const lunchPeak = 400 * Math.exp(-0.5 * Math.pow((hour - 12.5) / 1.0, 2));
  return base + morningPeak + eveningPeak + lunchPeak;
}

// ── Animated dot component for energy flow ──
function FlowDots({ active, color, path, reverse = false, speed = 2 }) {
  if (!active) return null;
  const dots = [0, 0.33, 0.66];
  return (
    <>
      {dots.map((offset, i) => (
        <circle key={i} r="4" fill={color} opacity="0.9">
          <animateMotion
            dur={`${speed}s`}
            repeatCount="indefinite"
            begin={`${offset * speed}s`}
            keyPoints={reverse ? "1;0" : "0;1"}
            keyTimes="0;1"
          >
            <mpath href={`#${path}`} />
          </animateMotion>
        </circle>
      ))}
    </>
  );
}

// ── Main Component ──
export default function SolarFlowSimulator() {
  const [location, setLocation] = useState("Marseille");
  const [panelWatts, setPanelWatts] = useState(800);
  const [batteryKWh, setBatteryKWh] = useState(0);
  const [hour, setHour] = useState(12);
  const [playing, setPlaying] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(0); // kWh stored

  const loc = LOCATIONS[location];

  // Reset battery when config changes
  useEffect(() => {
    setBatteryLevel(0);
  }, [location, panelWatts, batteryKWh]);

  // Auto-play animation
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setHour((h) => {
        const next = h + 0.25;
        if (next >= 24) {
          setPlaying(false);
          return 0;
        }
        return next;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [playing]);

  // ── Energy calculations for current hour ──
  const calc = useMemo(() => {
    const production = solarProfile(hour, panelWatts, loc.psh) / 1000; // kW
    const consumption = consumptionProfile(hour) / 1000; // kW
    const surplus = Math.max(0, production - consumption);
    const deficit = Math.max(0, consumption - production);

    let toBattery = 0;
    let fromBattery = 0;
    let toGrid = 0;
    let fromGrid = 0;
    let currentBatteryLevel = batteryLevel;

    if (batteryKWh > 0) {
      if (surplus > 0) {
        // Charge battery first, then inject surplus
        const canCharge = Math.min(surplus, (batteryKWh - currentBatteryLevel) * 4); // max 4x C-rate
        toBattery = Math.min(canCharge, surplus);
        toGrid = surplus - toBattery;
      } else if (deficit > 0) {
        // Discharge battery first, then draw from grid
        const canDischarge = Math.min(deficit, currentBatteryLevel * 4);
        fromBattery = Math.min(canDischarge, deficit);
        fromGrid = deficit - fromBattery;
      }
    } else {
      toGrid = surplus;
      fromGrid = deficit;
    }

    return { production, consumption, surplus, deficit, toBattery, fromBattery, toGrid, fromGrid };
  }, [hour, panelWatts, loc.psh, batteryKWh, batteryLevel]);

  // Update battery level when playing
  useEffect(() => {
    if (playing) {
      setBatteryLevel((prev) => {
        const dt = 0.25; // hour increment
        let next = prev + (calc.toBattery - calc.fromBattery) * dt;
        return Math.max(0, Math.min(batteryKWh, next));
      });
    }
  }, [hour, playing]);

  // ── Daily totals calculation ──
  const dailyTotals = useMemo(() => {
    let totalProduction = 0;
    let totalConsumption = 0;
    let totalSelfConsumed = 0;
    let totalToGrid = 0;
    let totalFromGrid = 0;
    let batLevel = 0;

    for (let h = 0; h < 24; h += 0.25) {
      const prod = solarProfile(h, panelWatts, loc.psh) / 1000;
      const cons = consumptionProfile(h) / 1000;
      const dt = 0.25;

      totalProduction += prod * dt;
      totalConsumption += cons * dt;

      const surp = Math.max(0, prod - cons);
      const def = Math.max(0, cons - prod);

      if (batteryKWh > 0) {
        if (surp > 0) {
          const charge = Math.min(surp, (batteryKWh - batLevel) * 4);
          const actualCharge = Math.min(charge, surp);
          batLevel += actualCharge * dt;
          batLevel = Math.min(batLevel, batteryKWh);
          const gridInject = (surp - actualCharge);
          totalToGrid += gridInject * dt;
          totalSelfConsumed += (prod - gridInject) * dt;
        } else {
          const discharge = Math.min(def, batLevel * 4);
          const actualDischarge = Math.min(discharge, def);
          batLevel -= actualDischarge * dt;
          batLevel = Math.max(0, batLevel);
          const gridDraw = def - actualDischarge;
          totalFromGrid += gridDraw * dt;
          totalSelfConsumed += prod * dt;
        }
      } else {
        totalToGrid += surp * dt;
        totalFromGrid += def * dt;
        totalSelfConsumed += Math.min(prod, cons) * dt;
      }
    }

    const savingsAutoconsom = totalSelfConsumed * GRID_PRICE;
    const revenueSurplus = totalToGrid * OA_PRICE;
    const totalGain = savingsAutoconsom + revenueSurplus;
    const selfConsumptionRate = totalProduction > 0 ? (totalSelfConsumed / totalProduction) * 100 : 0;

    return {
      production: totalProduction,
      consumption: totalConsumption,
      selfConsumed: totalSelfConsumed,
      toGrid: totalToGrid,
      fromGrid: totalFromGrid,
      savingsAutoconsom,
      revenueSurplus,
      totalGain,
      selfConsumptionRate,
      annualGain: totalGain * 365 * 0.85, // 85% factor for seasons/weather
    };
  }, [panelWatts, loc.psh, batteryKWh]);

  // ── Time helpers ──
  const formatHour = (h) => {
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;
  };

  const skyColor = hour < 6 || hour > 21 ? "#0f172a" : hour < 7 || hour > 20 ? "#1e293b" : hour < 8 || hour > 19 ? "#334155" : "#475569";
  const sunOpacity = hour >= 6 && hour <= 20 ? Math.min(1, (1 - Math.abs(hour - 13) / 7) * 1.5) : 0;
  const isNight = hour < 6 || hour > 21;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold mb-2">
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Flux d'énergie solaire
            </span>{" "}
            — 24h
          </h1>
          <p className="text-slate-400 text-sm">
            Visualisez comment l'électricité circule dans votre installation solaire plug &amp; play
          </p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Location */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
            <label className="block text-xs text-slate-400 mb-2 font-medium">📍 Localisation</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
            >
              {Object.entries(LOCATIONS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.emoji} {val.label} — {val.psh}h PSH
                </option>
              ))}
            </select>
          </div>

          {/* Panel power */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
            <label className="block text-xs text-slate-400 mb-2 font-medium">⚡ Puissance panneaux</label>
            <div className="flex gap-2 flex-wrap">
              {PANEL_OPTIONS.map((w) => (
                <button
                  key={w}
                  onClick={() => setPanelWatts(w)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    panelWatts === w
                      ? "bg-amber-500 text-slate-900"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {w}W
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {panelWatts <= 400 ? "1 panneau" : panelWatts <= 800 ? "2 panneaux" : `${Math.ceil(panelWatts / 400)} panneaux`}
            </p>
          </div>

          {/* Battery */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
            <label className="block text-xs text-slate-400 mb-2 font-medium">🔋 Batterie (optionnel)</label>
            <div className="flex gap-2 flex-wrap">
              {BATTERY_OPTIONS.map((b) => (
                <button
                  key={b}
                  onClick={() => setBatteryKWh(b)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    batteryKWh === b
                      ? "bg-emerald-500 text-slate-900"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {b === 0 ? "Sans" : `${b} kWh`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Time slider */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">
              🕐 {formatHour(hour)} — {isNight ? "Nuit" : hour < 9 ? "Matin" : hour < 14 ? "Midi" : hour < 18 ? "Après-midi" : "Soirée"}
            </span>
            <button
              onClick={() => { if (!playing) { setHour(0); setBatteryLevel(0); } setPlaying(!playing); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                playing ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}
            >
              {playing ? "⏸ Pause" : "▶ Simuler 24h"}
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="23.75"
            step="0.25"
            value={hour}
            onChange={(e) => { setPlaying(false); setHour(parseFloat(e.target.value)); }}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
          </div>
        </div>

        {/* Main visualization */}
        <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 p-4 md:p-6 mb-6">
          <svg viewBox="0 0 900 420" className="w-full" style={{ maxHeight: "420px" }}>
            <defs>
              {/* Flow paths */}
              <path id="path-solar-inverter" d="M 160 120 L 300 120" />
              <path id="path-inverter-house" d="M 400 120 L 560 120" />
              <path id="path-house-grid" d="M 660 180 L 660 320 L 800 320" />
              <path id="path-inverter-battery" d="M 350 170 L 350 300" />
              <path id="path-battery-house" d="M 400 300 L 560 300 L 600 180" />
              <path id="path-grid-house" d="M 800 320 L 660 320 L 660 180" />

              {/* Glow filters */}
              <filter id="glow-yellow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="glow-green">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Background sky gradient */}
            <rect x="0" y="0" width="900" height="420" rx="12" fill={skyColor} className="transition-all duration-500" />

            {/* Sun */}
            <g opacity={sunOpacity} className="transition-all duration-300">
              <circle cx={80} cy={60} r="30" fill="#FBBF24" filter="url(#glow-yellow)" />
              <circle cx={80} cy={60} r="22" fill="#F59E0B" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                <line
                  key={i}
                  x1={80 + 36 * Math.cos((angle * Math.PI) / 180)}
                  y1={60 + 36 * Math.sin((angle * Math.PI) / 180)}
                  x2={80 + 46 * Math.cos((angle * Math.PI) / 180)}
                  y2={60 + 46 * Math.sin((angle * Math.PI) / 180)}
                  stroke="#FBBF24"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              ))}
            </g>

            {/* Moon (night) */}
            {isNight && (
              <g>
                <circle cx="80" cy="60" r="20" fill="#94A3B8" opacity="0.4" />
                <circle cx="72" cy="52" r="16" fill={skyColor} />
              </g>
            )}

            {/* ── SOLAR PANEL ── */}
            <g>
              <rect x="60" y="85" width="100" height="70" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              {/* Panel grid lines */}
              <line x1="93" y1="85" x2="93" y2="155" stroke="#334155" strokeWidth="1" />
              <line x1="127" y1="85" x2="127" y2="155" stroke="#334155" strokeWidth="1" />
              <line x1="60" y1="108" x2="160" y2="108" stroke="#334155" strokeWidth="1" />
              <line x1="60" y1="132" x2="160" y2="132" stroke="#334155" strokeWidth="1" />
              {/* Panel reflection */}
              <rect x="60" y="85" width="100" height="70" rx="6" fill={sunOpacity > 0.3 ? "rgba(251,191,36,0.08)" : "transparent"} />
              <text x="110" y="175" textAnchor="middle" className="text-xs" fill="#94A3B8" fontSize="11">Panneau {panelWatts}W</text>
              <circle cx="110" cy="80" r="10" fill="#F59E0B" opacity="0.9" />
              <text x="110" y="84" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="700">1</text>
            </g>

            {/* ── MICRO-ONDULEUR ── */}
            <g>
              <rect x="290" y="90" width="110" height="60" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              <text x="345" y="115" textAnchor="middle" fill="#E2E8F0" fontSize="11" fontWeight="600">Micro-onduleur</text>
              <text x="345" y="132" textAnchor="middle" fill="#64748B" fontSize="9">DC → AC 230V</text>
              <circle cx="345" cy="80" r="10" fill="#F59E0B" opacity="0.9" />
              <text x="345" y="84" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="700">2</text>
            </g>

            {/* ── MAISON / TABLEAU ── */}
            <g>
              {/* House shape */}
              <polygon points="610,50 540,100 680,100" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              <rect x="550" y="100" width="120" height="80" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              {/* Window */}
              <rect x="575" y="115" width="24" height="24" rx="2" fill="#334155" stroke="#475569" strokeWidth="1" />
              <rect x="615" y="115" width="24" height="24" rx="2" fill="#334155" stroke="#475569" strokeWidth="1" />
              {/* Door */}
              <rect x="598" y="150" width="24" height="30" rx="2" fill="#334155" stroke="#475569" strokeWidth="1" />
              <text x="610" y="200" textAnchor="middle" fill="#94A3B8" fontSize="11">Maison</text>
              <circle cx="610" cy="42" r="10" fill="#F59E0B" opacity="0.9" />
              <text x="610" y="46" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="700">4</text>

              {/* Appliances icons */}
              <text x="700" y="115" fill="#64748B" fontSize="16">🖥️</text>
              <text x="700" y="140" fill="#64748B" fontSize="16">💡</text>
              <text x="700" y="165" fill="#64748B" fontSize="16">🧊</text>
            </g>

            {/* ── BATTERIE (if selected) ── */}
            {batteryKWh > 0 && (
              <g>
                <rect x="290" y="270" width="120" height="60" rx="8" fill="#1e293b" stroke={calc.toBattery > 0 ? "#10B981" : calc.fromBattery > 0 ? "#F59E0B" : "#475569"} strokeWidth="1.5" className="transition-all duration-300" />
                {/* Battery fill level */}
                <rect x="296" y={276 + 48 * (1 - batteryLevel / batteryKWh)} width="108" height={48 * (batteryLevel / batteryKWh)} rx="4" fill="rgba(16,185,129,0.15)" className="transition-all duration-300" />
                <text x="350" y="295" textAnchor="middle" fill="#E2E8F0" fontSize="11" fontWeight="600">Batterie</text>
                <text x="350" y="312" textAnchor="middle" fill={batteryLevel > batteryKWh * 0.5 ? "#34D399" : "#FBBF24"} fontSize="11" fontWeight="700">
                  {(batteryLevel).toFixed(1)} / {batteryKWh} kWh
                </text>
                <text x="350" y="325" textAnchor="middle" fill="#64748B" fontSize="9">
                  {Math.round((batteryLevel / batteryKWh) * 100)}%
                </text>
                <text x="350" y="353" textAnchor="middle" fill="#64748B" fontSize="9">OPT.</text>
              </g>
            )}

            {/* ── COMPTEUR LINKY ── */}
            <g>
              <rect x="760" y="270" width="100" height="70" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              <text x="810" y="300" textAnchor="middle" fill="#E2E8F0" fontSize="11" fontWeight="600">Linky</text>
              <text x="810" y="318" textAnchor="middle" fill="#34D399" fontSize="10" fontWeight="600">
                {calc.toGrid > 0 ? `↑ ${(calc.toGrid * 1000).toFixed(0)}W` : calc.fromGrid > 0 ? `↓ ${(calc.fromGrid * 1000).toFixed(0)}W` : "— 0W"}
              </text>
              <text x="810" y="355" textAnchor="middle" fill="#64748B" fontSize="9">Réseau EDF</text>
              <circle cx="810" cy="262" r="10" fill="#10B981" opacity="0.9" />
              <text x="810" y="266" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="700">5</text>
            </g>

            {/* ── FLOW LABELS ── */}
            {/* DC label */}
            <g>
              <rect x="200" y="100" width="60" height="20" rx="4" fill="rgba(251,191,36,0.15)" />
              <text x="230" y="114" textAnchor="middle" fill="#FBBF24" fontSize="10" fontWeight="600">
                DC ⚡ {calc.production > 0 ? `${(calc.production * 1000).toFixed(0)}W` : "0W"}
              </text>
            </g>

            {/* AC label */}
            <g>
              <rect x="430" y="100" width="80" height="20" rx="4" fill="rgba(96,165,250,0.15)" />
              <text x="470" y="114" textAnchor="middle" fill="#60A5FA" fontSize="10" fontWeight="600">
                AC 230V {calc.production > 0 ? `${(calc.production * 1000).toFixed(0)}W` : ""}
              </text>
            </g>

            {/* Consumption label */}
            <text x="610" y="220" textAnchor="middle" fill="#F87171" fontSize="10" fontWeight="600">
              Conso: {(calc.consumption * 1000).toFixed(0)}W
            </text>

            {/* ── ANIMATED FLOWS ── */}
            {/* Solar → Inverter (DC, yellow) */}
            <FlowDots active={calc.production > 0.01} color="#FBBF24" path="path-solar-inverter" speed={1.5} />

            {/* Inverter → House (AC, blue) */}
            <FlowDots active={calc.production > 0.01} color="#60A5FA" path="path-inverter-house" speed={1.5} />

            {/* House → Grid (surplus, green) */}
            <FlowDots active={calc.toGrid > 0.01} color="#34D399" path="path-house-grid" speed={2} />

            {/* Grid → House (deficit, red) */}
            <FlowDots active={calc.fromGrid > 0.01} color="#F87171" path="path-grid-house" speed={2} />

            {/* Inverter → Battery (charging, green) */}
            {batteryKWh > 0 && (
              <>
                <FlowDots active={calc.toBattery > 0.01} color="#10B981" path="path-inverter-battery" speed={2} />
                <FlowDots active={calc.fromBattery > 0.01} color="#FBBF24" path="path-battery-house" speed={2} />
              </>
            )}

            {/* ── Static flow lines (subtle) ── */}
            <line x1="160" y1="120" x2="290" y2="120" stroke={calc.production > 0.01 ? "#FBBF24" : "#334155"} strokeWidth="2" strokeDasharray="6 4" opacity="0.3" className="transition-all duration-300" />
            <line x1="400" y1="120" x2="550" y2="120" stroke={calc.production > 0.01 ? "#60A5FA" : "#334155"} strokeWidth="2" strokeDasharray="6 4" opacity="0.3" className="transition-all duration-300" />
            <polyline points="660,180 660,300 760,300" fill="none" stroke={calc.toGrid > 0.01 ? "#34D399" : calc.fromGrid > 0.01 ? "#F87171" : "#334155"} strokeWidth="2" strokeDasharray="6 4" opacity="0.3" className="transition-all duration-300" />

            {batteryKWh > 0 && (
              <>
                <line x1="350" y1="150" x2="350" y2="270" stroke={calc.toBattery > 0.01 ? "#10B981" : calc.fromBattery > 0.01 ? "#FBBF24" : "#334155"} strokeWidth="2" strokeDasharray="6 4" opacity="0.3" className="transition-all duration-300" />
              </>
            )}

            {/* Legend */}
            <g transform="translate(20, 370)">
              <rect x="0" y="0" width="280" height="40" rx="6" fill="rgba(15,23,42,0.7)" />
              <circle cx="20" cy="20" r="5" fill="#FBBF24" />
              <text x="32" y="24" fill="#94A3B8" fontSize="9">DC solaire</text>
              <circle cx="95" cy="20" r="5" fill="#60A5FA" />
              <text x="107" y="24" fill="#94A3B8" fontSize="9">AC maison</text>
              <circle cx="170" cy="20" r="5" fill="#34D399" />
              <text x="182" y="24" fill="#94A3B8" fontSize="9">Surplus</text>
              <circle cx="230" cy="20" r="5" fill="#F87171" />
              <text x="242" y="24" fill="#94A3B8" fontSize="9">Réseau</text>
            </g>
          </svg>
        </div>

        {/* ── Production chart (mini sparkline) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Chart */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Production vs Consommation — 24h</h3>
            <svg viewBox="0 0 480 160" className="w-full">
              <rect x="0" y="0" width="480" height="160" rx="8" fill="transparent" />

              {/* Grid lines */}
              {[0, 40, 80, 120].map((y) => (
                <line key={y} x1="40" y1={y + 10} x2="460" y2={y + 10} stroke="#334155" strokeWidth="0.5" />
              ))}

              {/* Production area */}
              <path
                d={
                  "M 40 140 " +
                  Array.from({ length: 97 }, (_, i) => {
                    const h = (i / 96) * 24;
                    const prod = solarProfile(h, panelWatts, loc.psh);
                    const maxW = Math.max(panelWatts, 1500);
                    const y = 140 - (prod / maxW) * 120;
                    const x = 40 + (i / 96) * 420;
                    return `L ${x} ${y}`;
                  }).join(" ") +
                  " L 460 140 Z"
                }
                fill="rgba(251,191,36,0.15)"
                stroke="#FBBF24"
                strokeWidth="1.5"
              />

              {/* Consumption area */}
              <path
                d={
                  "M 40 140 " +
                  Array.from({ length: 97 }, (_, i) => {
                    const h = (i / 96) * 24;
                    const cons = consumptionProfile(h);
                    const maxW = Math.max(panelWatts, 1500);
                    const y = 140 - (cons / maxW) * 120;
                    const x = 40 + (i / 96) * 420;
                    return `L ${x} ${y}`;
                  }).join(" ") +
                  " L 460 140 Z"
                }
                fill="rgba(248,113,113,0.1)"
                stroke="#F87171"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />

              {/* Current time marker */}
              <line
                x1={40 + (hour / 24) * 420}
                y1="10"
                x2={40 + (hour / 24) * 420}
                y2="140"
                stroke="#E2E8F0"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle cx={40 + (hour / 24) * 420} cy="6" r="3" fill="#E2E8F0" />

              {/* X-axis labels */}
              {[0, 6, 12, 18, 24].map((h) => (
                <text key={h} x={40 + (h / 24) * 420} y="155" textAnchor="middle" fill="#64748B" fontSize="9">
                  {h}h
                </text>
              ))}

              {/* Legend */}
              <rect x="360" y="4" width="8" height="8" rx="2" fill="#FBBF24" opacity="0.7" />
              <text x="372" y="12" fill="#94A3B8" fontSize="8">Prod.</text>
              <rect x="405" y="4" width="8" height="8" rx="2" fill="#F87171" opacity="0.7" />
              <text x="417" y="12" fill="#94A3B8" fontSize="8">Conso.</text>
            </svg>
          </div>

          {/* Daily results */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">💰 Gain estimé par jour</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Production journalière</span>
                <span className="text-sm font-semibold text-amber-400">{dailyTotals.production.toFixed(2)} kWh</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Autoconsommé</span>
                <span className="text-sm font-semibold text-emerald-400">{dailyTotals.selfConsumed.toFixed(2)} kWh</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Taux d'autoconsommation</span>
                <span className="text-sm font-semibold text-cyan-400">{dailyTotals.selfConsumptionRate.toFixed(0)}%</span>
              </div>

              <div className="border-t border-slate-700 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Économie autoconso ({GRID_PRICE} €/kWh)</span>
                  <span className="text-sm font-semibold text-emerald-400">{dailyTotals.savingsAutoconsom.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-slate-400">Revente surplus (OA {OA_PRICE} €/kWh)</span>
                  <span className="text-sm font-semibold text-blue-400">{dailyTotals.revenueSurplus.toFixed(2)} €</span>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-white">Gain total / jour</span>
                  <span className="text-lg font-bold text-emerald-400">{dailyTotals.totalGain.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-slate-400">Estimation annuelle (~85%)</span>
                  <span className="text-sm font-bold text-amber-400">{dailyTotals.annualGain.toFixed(0)} € / an</span>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-3 mt-2">
                <p className="text-xs text-slate-500 leading-relaxed">
                  ⚠️ Estimation indicative basée sur un jour type d'été à {location}.
                  Production réelle variable selon météo, saison, orientation et ombrage.
                  Tarifs EDF et OA susceptibles d'évoluer.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-600">
          SolarMetrics © 2026 — Schéma informatif, consultez un professionnel pour votre installation
        </div>
      </div>
    </div>
  );
}
