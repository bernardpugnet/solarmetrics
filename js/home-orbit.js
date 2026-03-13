/**
 * Solar Data Atlas — Home Orbit Menu V7 (Three.js r128)
 * Style: "warm dramatic solar system" — inspired by CGI renders
 *
 * Key upgrades:
 * - Sun: high-res 1024px turbulent texture, multi-layer glow (3 sprites),
 *   strong PointLight, visible rotation
 * - Planets: 512px detailed textures, strong directional lighting creates
 *   dramatic light/shadow sides
 * - Background: deep space gradient (dark blue/black) with nebula hints
 * - Starfield: 3 layers (1200+ stars), varied brightness
 * - Lighting: strong PointLight from sun + dim ambient = dramatic contrast
 */

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';

// ─── Sections ─────────────────────────────────────────────
const PLANETS = [
  { name: 'Technologies', desc: 'Panneaux, onduleurs, batteries',   url: '/fr/technologies.html', style: 'mercury', orbit: 2.5, speed: 0.20, zOff:  0.15, size: 0.30 },
  { name: 'Économie',     desc: 'Rentabilité et financement',       url: '/fr/economie.html',     style: 'earth',   orbit: 3.4, speed: 0.16, zOff: -0.10, size: 0.38 },
  { name: 'Marchés',      desc: 'Tendances et acteurs mondiaux',    url: '/fr/marches.html',      style: 'mars',    orbit: 4.3, speed: 0.12, zOff:  0.18, size: 0.32 },
  { name: 'Outils',       desc: 'Simulateurs et calculateurs',      url: '/fr/outils.html',       style: 'jupiter', orbit: 5.3, speed: 0.09, zOff: -0.15, size: 0.50 },
  { name: 'Analyses',     desc: 'Études de cas et comparatifs',     url: '/fr/analyses/',          style: 'saturn',  orbit: 6.3, speed: 0.07, zOff:  0.12, size: 0.42 },
  { name: 'Données',      desc: 'Hypothèses et sources',            url: '/fr/hypotheses.html',   style: 'neptune', orbit: 7.2, speed: 0.05, zOff: -0.13, size: 0.36 },
];

const SUN_R       = 1.3;
const ORBIT_TILT  = -0.28;
const DPR_MAX     = 1.5;
const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let scene, camera, renderer, canvasEl, container;
let orbitGroup, sun;
let planetMeshes = [];
let raycaster, mouse, hoveredPlanet = null;
let overlayEl = null, hintEl = null;
let animationId = null;

// ══════════════════════════════════════════════════════════
//  PROCEDURAL TEXTURES — HIGH QUALITY
// ══════════════════════════════════════════════════════════

// ── Simplex-like noise helper (fast, good enough) ────────
function noise2D(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function fbm(x, y, octaves) {
  let val = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * noise2D(x * freq, y * freq);
    amp *= 0.5;
    freq *= 2.1;
  }
  return val;
}

// ── Sun texture (1024px) — turbulent, fiery ──────────────
function makeSunTexture() {
  const sz = 1024;
  const c = document.createElement('canvas');
  c.width = sz; c.height = sz;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(sz, sz);

  for (let py = 0; py < sz; py++) {
    for (let px = 0; px < sz; px++) {
      const u = px / sz, v = py / sz;
      // Turbulent noise
      const n1 = fbm(u * 8, v * 8, 5);
      const n2 = fbm(u * 12 + 3.7, v * 12 + 1.3, 4);
      const turb = (n1 + n2 * 0.5) / 1.5;

      // Color: from white-hot center to dark orange edges
      // Radial falloff from center of texture
      const cx = u - 0.5, cy = v - 0.5;
      const dist = Math.sqrt(cx * cx + cy * cy) * 2; // 0 to ~1.4
      const radial = Math.max(0, 1 - dist * 0.7);

      const heat = turb * 0.6 + radial * 0.4;

      // Hot: (255,240,180) → Cool: (180,80,10)
      const r = Math.min(255, 140 + heat * 120);
      const g = Math.min(255, 40 + heat * 200);
      const b = Math.min(255, heat * 100);

      const idx = (py * sz + px) * 4;
      img.data[idx]     = r;
      img.data[idx + 1] = g;
      img.data[idx + 2] = b;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // Add some brighter "hot spots"
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 20; i++) {
    const x = sz * 0.2 + Math.random() * sz * 0.6;
    const y = sz * 0.2 + Math.random() * sz * 0.6;
    const r = 20 + Math.random() * 60;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,200,0.8)');
    g.addColorStop(0.5, 'rgba(255,200,50,0.3)');
    g.addColorStop(1, 'rgba(255,150,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ── Planet textures (512px each) ─────────────────────────
function makePlanetTexture(style) {
  const sz = 512;
  const c = document.createElement('canvas');
  c.width = sz; c.height = sz;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(sz, sz);

  switch (style) {
    case 'mercury': texMercury(img, sz); break;
    case 'earth':   texEarth(img, sz);   break;
    case 'mars':    texMars(img, sz);    break;
    case 'jupiter': texJupiter(img, sz); break;
    case 'saturn':  texSaturn(img, sz);  break;
    case 'neptune': texNeptune(img, sz); break;
  }

  ctx.putImageData(img, 0, 0);

  // Post-process: add atmosphere/haze for gas giants
  if (['jupiter', 'saturn', 'neptune'].includes(style)) {
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 80; i++) {
      const y = Math.random() * sz;
      ctx.fillStyle = style === 'neptune' ? '#4488cc' : '#ccaa66';
      ctx.fillRect(0, y, sz, 1 + Math.random() * 3);
    }
    ctx.globalAlpha = 1;
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function texMercury(img, sz) {
  for (let y = 0; y < sz; y++) {
    for (let x = 0; x < sz; x++) {
      const n = fbm(x / sz * 10, y / sz * 10, 5);
      const base = 90 + n * 80;
      const idx = (y * sz + x) * 4;
      img.data[idx] = base + 10;
      img.data[idx+1] = base + 5;
      img.data[idx+2] = base;
      img.data[idx+3] = 255;
    }
  }
  // Craters
  addCraters(img, sz, 40, '#4a4540', '#8a8275');
}

function texEarth(img, sz) {
  for (let y = 0; y < sz; y++) {
    for (let x = 0; x < sz; x++) {
      const u = x / sz, v = y / sz;
      const n = fbm(u * 6, v * 6, 5);
      const n2 = fbm(u * 3 + 5, v * 3 + 5, 3);
      const lat = Math.abs(v - 0.5) * 2; // 0=equator, 1=pole

      let r, g, b;
      // Land vs ocean threshold
      const landThreshold = 0.45 + lat * 0.08;
      if (n > landThreshold) {
        // Land
        const green = n2 > 0.5 ? 0.7 : 0.4; // forests vs desert
        if (green > 0.5) {
          r = 40 + n * 40; g = 90 + n * 80; b = 30 + n * 30;
        } else {
          r = 160 + n * 50; g = 140 + n * 40; b = 80 + n * 20;
        }
        // Mountains
        if (n > 0.65) { r += 30; g += 20; b += 15; }
      } else {
        // Ocean — deeper blue
        const depth = (landThreshold - n) / landThreshold;
        r = 15 + depth * 10;
        g = 40 + n * 60;
        b = 120 + n * 80;
      }

      // Polar ice
      if (lat > 0.82) {
        const iceBlend = (lat - 0.82) / 0.18;
        r = r + (230 - r) * iceBlend;
        g = g + (235 - g) * iceBlend;
        b = b + (240 - b) * iceBlend;
      }

      // Clouds
      const cloud = fbm(u * 8 + 2, v * 5 + 2, 3);
      if (cloud > 0.6) {
        const ca = (cloud - 0.6) / 0.4 * 0.5;
        r = r + (255 - r) * ca;
        g = g + (255 - g) * ca;
        b = b + (255 - b) * ca;
      }

      const idx = (y * sz + x) * 4;
      img.data[idx] = Math.min(255, r);
      img.data[idx+1] = Math.min(255, g);
      img.data[idx+2] = Math.min(255, b);
      img.data[idx+3] = 255;
    }
  }
}

function texMars(img, sz) {
  for (let y = 0; y < sz; y++) {
    for (let x = 0; x < sz; x++) {
      const u = x / sz, v = y / sz;
      const n = fbm(u * 8, v * 8, 5);
      const n2 = fbm(u * 4 + 7, v * 4 + 3, 3);
      const lat = Math.abs(v - 0.5) * 2;

      let r = 160 + n * 60;
      let g = 70 + n * 40;
      let b = 30 + n * 25;

      // Dark patches (valleys)
      if (n2 < 0.35) { r -= 40; g -= 20; b -= 10; }
      // Bright highlands
      if (n > 0.7) { r += 20; g += 15; b += 10; }

      // Polar cap
      if (lat > 0.85) {
        const iceBlend = (lat - 0.85) / 0.15;
        r = r + (210 - r) * iceBlend;
        g = g + (195 - g) * iceBlend;
        b = b + (180 - b) * iceBlend;
      }

      const idx = (y * sz + x) * 4;
      img.data[idx] = Math.min(255, Math.max(0, r));
      img.data[idx+1] = Math.min(255, Math.max(0, g));
      img.data[idx+2] = Math.min(255, Math.max(0, b));
      img.data[idx+3] = 255;
    }
  }
}

function texJupiter(img, sz) {
  for (let y = 0; y < sz; y++) {
    for (let x = 0; x < sz; x++) {
      const u = x / sz, v = y / sz;
      // Horizontal bands with turbulent edges
      const bandFreq = v * 14;
      const band = Math.sin(bandFreq + fbm(u * 6, v * 2, 3) * 1.5);
      const n = fbm(u * 10, v * 5, 4);

      let r, g, b;
      if (band > 0.3) {
        // Light bands (cream/tan)
        r = 210 + n * 30; g = 185 + n * 30; b = 140 + n * 20;
      } else if (band > -0.3) {
        // Mid bands (orange)
        r = 190 + n * 30; g = 130 + n * 30; b = 70 + n * 20;
      } else {
        // Dark bands (brown/red)
        r = 150 + n * 30; g = 90 + n * 25; b = 50 + n * 15;
      }

      // Great Red Spot (around u=0.65, v=0.55)
      const dx = u - 0.65, dy = v - 0.55;
      const spotDist = Math.sqrt(dx * dx * 4 + dy * dy * 16);
      if (spotDist < 0.12) {
        const si = 1 - spotDist / 0.12;
        r = r + (200 - r) * si * 0.7;
        g = g * (1 - si * 0.4);
        b = b * (1 - si * 0.5);
      }

      const idx = (y * sz + x) * 4;
      img.data[idx] = Math.min(255, r);
      img.data[idx+1] = Math.min(255, g);
      img.data[idx+2] = Math.min(255, b);
      img.data[idx+3] = 255;
    }
  }
}

function texSaturn(img, sz) {
  for (let y = 0; y < sz; y++) {
    for (let x = 0; x < sz; x++) {
      const u = x / sz, v = y / sz;
      const band = Math.sin(v * 18 + fbm(u * 4, v * 2, 3) * 1.2);
      const n = fbm(u * 8, v * 4, 3);

      let r, g, b;
      if (band > 0.2) {
        r = 215 + n * 25; g = 195 + n * 25; b = 140 + n * 20;
      } else if (band > -0.2) {
        r = 195 + n * 20; g = 170 + n * 20; b = 110 + n * 15;
      } else {
        r = 175 + n * 20; g = 145 + n * 15; b = 85 + n * 15;
      }

      const idx = (y * sz + x) * 4;
      img.data[idx] = Math.min(255, r);
      img.data[idx+1] = Math.min(255, g);
      img.data[idx+2] = Math.min(255, b);
      img.data[idx+3] = 255;
    }
  }
}

function texNeptune(img, sz) {
  for (let y = 0; y < sz; y++) {
    for (let x = 0; x < sz; x++) {
      const u = x / sz, v = y / sz;
      const n = fbm(u * 6, v * 6, 4);
      const band = Math.sin(v * 10 + fbm(u * 3, v * 2, 3) * 0.8);

      let r = 25 + n * 30 + band * 8;
      let g = 50 + n * 50 + band * 12;
      let b = 140 + n * 80 + band * 15;

      // Lighter streaks
      if (n > 0.65) { r += 15; g += 20; b += 25; }

      // Storm spot
      const dx = u - 0.4, dy = v - 0.45;
      const sDist = Math.sqrt(dx * dx * 4 + dy * dy * 16);
      if (sDist < 0.08) {
        const si = 1 - sDist / 0.08;
        r += 30 * si; g += 40 * si; b += 50 * si;
      }

      const idx = (y * sz + x) * 4;
      img.data[idx] = Math.min(255, Math.max(0, r));
      img.data[idx+1] = Math.min(255, Math.max(0, g));
      img.data[idx+2] = Math.min(255, Math.max(0, b));
      img.data[idx+3] = 255;
    }
  }
}

function addCraters(img, sz, count, darkColor, rimColor) {
  // Parse colors
  const dc = hexToRgb(darkColor), rc = hexToRgb(rimColor);
  for (let i = 0; i < count; i++) {
    const cx = Math.random() * sz, cy = Math.random() * sz;
    const rad = 3 + Math.random() * 12;
    for (let dy = -rad - 2; dy <= rad + 2; dy++) {
      for (let dx = -rad - 2; dx <= rad + 2; dx++) {
        const px = Math.floor(cx + dx) % sz;
        const py = Math.floor(cy + dy);
        if (py < 0 || py >= sz) continue;
        const ppx = px < 0 ? px + sz : px;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const idx = (py * sz + ppx) * 4;
        if (dist < rad * 0.7) {
          // Dark inside
          const blend = 0.3;
          img.data[idx]   = img.data[idx]   * (1 - blend) + dc.r * blend;
          img.data[idx+1] = img.data[idx+1] * (1 - blend) + dc.g * blend;
          img.data[idx+2] = img.data[idx+2] * (1 - blend) + dc.b * blend;
        } else if (dist < rad) {
          // Rim
          const blend = 0.2;
          img.data[idx]   = img.data[idx]   * (1 - blend) + rc.r * blend;
          img.data[idx+1] = img.data[idx+1] * (1 - blend) + rc.g * blend;
          img.data[idx+2] = img.data[idx+2] * (1 - blend) + rc.b * blend;
        }
      }
    }
  }
}

function hexToRgb(hex) {
  const v = parseInt(hex.replace('#', ''), 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

// ══════════════════════════════════════════════════════════
//  GLOW SPRITE HELPER
// ══════════════════════════════════════════════════════════
function makeGlowSprite(color1, color2, size, opacity) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0,   color1);
  g.addColorStop(0.15, color2);
  g.addColorStop(0.4, color2.replace(/[\d.]+\)$/, '0.15)'));
  g.addColorStop(0.7, color2.replace(/[\d.]+\)$/, '0.03)'));
  g.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);

  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(c),
    transparent: true,
    opacity: opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  sprite.scale.set(size, size, 1);
  return sprite;
}

// ══════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════
export function init(containerId) {
  container = document.getElementById(containerId);
  if (!container) return false;

  try {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 300);
    camera.position.set(0, 3.0, 11);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, DPR_MAX));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x050a18, 1);   // Very dark blue-black
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    canvasEl = renderer.domElement;
    canvasEl.style.cursor = 'default';
    container.appendChild(canvasEl);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2(-999, -999);
    container.style.position = 'relative';

    orbitGroup = new THREE.Group();
    orbitGroup.rotation.x = ORBIT_TILT;
    scene.add(orbitGroup);

    buildBackground();
    buildStarfield();
    buildSun();
    buildOrbits();
    buildPlanets();
    buildLights();
    buildOverlay();

    canvasEl.addEventListener('mousemove', onMouseMove);
    canvasEl.addEventListener('click', onClick);
    canvasEl.addEventListener('touchstart', onTouch, { passive: true });
    canvasEl.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    if (!REDUCE_MOTION) { tick(); }
    else { placeStatic(); renderer.render(scene, camera); }

    return true;
  } catch (e) {
    console.warn('WebGL init failed:', e);
    return false;
  }
}

// ══════════════════════════════════════════════════════════
//  BACKGROUND — deep space with subtle nebula
// ══════════════════════════════════════════════════════════
function buildBackground() {
  const sz = 1024;
  const c = document.createElement('canvas');
  c.width = sz; c.height = sz;
  const ctx = c.getContext('2d');

  // Base: very dark
  ctx.fillStyle = '#050a18';
  ctx.fillRect(0, 0, sz, sz);

  // Nebula hints — soft colored patches
  ctx.globalCompositeOperation = 'screen';
  const nebulae = [
    { x: 200, y: 300, r: 250, color: 'rgba(20,40,100,' },
    { x: 700, y: 200, r: 200, color: 'rgba(60,20,80,' },
    { x: 500, y: 700, r: 300, color: 'rgba(15,35,70,' },
    { x: 100, y: 600, r: 180, color: 'rgba(40,25,60,' },
  ];
  nebulae.forEach((nb) => {
    const g = ctx.createRadialGradient(nb.x, nb.y, 0, nb.x, nb.y, nb.r);
    g.addColorStop(0, nb.color + '0.12)');
    g.addColorStop(0.5, nb.color + '0.04)');
    g.addColorStop(1, nb.color + '0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, sz, sz);
  });
  ctx.globalCompositeOperation = 'source-over';

  const tex = new THREE.CanvasTexture(c);
  const bgGeo = new THREE.SphereGeometry(150, 32, 32);
  const bgMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide });
  scene.add(new THREE.Mesh(bgGeo, bgMat));
}

// ══════════════════════════════════════════════════════════
//  STARFIELD — 3 layers, dense, visible
// ══════════════════════════════════════════════════════════
function buildStarfield() {
  addStarLayer(900,  0xaab4c8, 0.18, 0.5,  80, 130);
  addStarLayer(200,  0xd4dce8, 0.4,  0.75, 70, 120);
  addStarLayer(50,   0xffffff, 0.8,  0.9,  60, 110);
}

function addStarLayer(count, color, size, opacity, rMin, rMax) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = rMin + Math.random() * (rMax - rMin);
    pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
    color, size, transparent: true, opacity, sizeAttenuation: true,
  })));
}

// ══════════════════════════════════════════════════════════
//  SUN — turbulent texture + multi-layer glow
// ══════════════════════════════════════════════════════════
function buildSun() {
  const tex = makeSunTexture();
  sun = new THREE.Mesh(
    new THREE.SphereGeometry(SUN_R, 48, 48),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  orbitGroup.add(sun);

  // 3 glow layers for rich radiance
  const g1 = makeGlowSprite(
    'rgba(255,240,180,1)', 'rgba(251,191,36,0.7)', 5.0, 0.9
  );
  const g2 = makeGlowSprite(
    'rgba(255,200,50,0.6)', 'rgba(245,158,11,0.3)', 8.0, 0.45
  );
  const g3 = makeGlowSprite(
    'rgba(255,180,30,0.3)', 'rgba(220,120,0,0.1)', 12.0, 0.2
  );
  orbitGroup.add(g1);
  orbitGroup.add(g2);
  orbitGroup.add(g3);

  // Strong point light — creates dramatic shadows on planets
  const sunLight = new THREE.PointLight(0xffcc66, 3.5, 30, 0.8);
  orbitGroup.add(sunLight);
}

// ══════════════════════════════════════════════════════════
//  ORBITS — ultra discreet
// ══════════════════════════════════════════════════════════
function buildOrbits() {
  PLANETS.forEach((p) => {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * p.orbit, 0, Math.sin(a) * p.orbit));
    }
    orbitGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0x1e293b, transparent: true, opacity: 0.15 })
    ));
  });
}

// ══════════════════════════════════════════════════════════
//  PLANETS — textured, varied sizes
// ══════════════════════════════════════════════════════════
function buildPlanets() {
  PLANETS.forEach((p, i) => {
    const tex = makePlanetTexture(p.style);
    const geo = new THREE.SphereGeometry(p.size, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.8,
      metalness: 0.05,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { index: i, name: p.name, desc: p.desc, url: p.url,
                      orbit: p.orbit, speed: p.speed, zOff: p.zOff, size: p.size };

    const angle = (i / PLANETS.length) * Math.PI * 2;
    mesh.position.set(Math.cos(angle) * p.orbit, p.zOff, Math.sin(angle) * p.orbit);

    orbitGroup.add(mesh);
    planetMeshes.push(mesh);

    // Saturn gets a ring!
    if (p.style === 'saturn') {
      const ringGeo = new THREE.RingGeometry(p.size * 1.4, p.size * 2.2, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xc8a860,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI * 0.45;
      mesh.add(ring);
    }
  });
}

// ══════════════════════════════════════════════════════════
//  LIGHTS — dramatic (strong sun + very dim ambient)
// ══════════════════════════════════════════════════════════
function buildLights() {
  // Very low ambient — lets the sun side shine, shadow side stays dark
  scene.add(new THREE.AmbientLight(0x0a1020, 0.3));
}

// ══════════════════════════════════════════════════════════
//  OVERLAY
// ══════════════════════════════════════════════════════════
function buildOverlay() {
  overlayEl = document.createElement('div');
  overlayEl.style.cssText =
    'position:absolute;bottom:24px;left:50%;transform:translateX(-50%);' +
    'opacity:0;transition:opacity 0.2s;pointer-events:none;text-align:center;' +
    'font-family:Inter,system-ui,sans-serif;z-index:10;';
  overlayEl.innerHTML =
    '<div id="ov-name" style="color:#f8fafc;font-size:17px;font-weight:600;letter-spacing:0.015em;margin-bottom:3px;"></div>' +
    '<div id="ov-desc" style="color:rgba(148,163,184,0.75);font-size:12px;"></div>';
  container.appendChild(overlayEl);

  hintEl = document.createElement('div');
  hintEl.textContent = 'Survolez une planète pour explorer';
  hintEl.style.cssText =
    'position:absolute;bottom:24px;left:50%;transform:translateX(-50%);' +
    'color:rgba(148,163,184,0.4);font-size:12px;font-family:Inter,system-ui,sans-serif;' +
    'letter-spacing:0.04em;pointer-events:none;transition:opacity 2s;z-index:9;';
  container.appendChild(hintEl);
  setTimeout(() => { if (hintEl) hintEl.style.opacity = '0'; }, 4000);
  setTimeout(() => { if (hintEl) { hintEl.remove(); hintEl = null; } }, 6500);
}

function showOverlay(name, desc) {
  if (hintEl) hintEl.style.opacity = '0';
  if (!overlayEl) return;
  overlayEl.querySelector('#ov-name').textContent = name;
  overlayEl.querySelector('#ov-desc').textContent = desc;
  overlayEl.style.opacity = '1';
}

function hideOverlay() { if (overlayEl) overlayEl.style.opacity = '0'; }

// ══════════════════════════════════════════════════════════
//  ANIMATION
// ══════════════════════════════════════════════════════════
function tick() {
  animationId = requestAnimationFrame(tick);
  const t = Date.now() * 0.001;

  planetMeshes.forEach((m) => {
    const d = m.userData;
    const a = (d.index / PLANETS.length) * Math.PI * 2 + t * d.speed;
    m.position.x = Math.cos(a) * d.orbit;
    m.position.z = Math.sin(a) * d.orbit;
    if (m !== hoveredPlanet) m.position.y = d.zOff;
    m.rotation.y += 0.002; // Self-rotation
  });

  if (sun) {
    sun.rotation.y = t * 0.06;
    sun.scale.setScalar(1.0 + Math.sin(t * 0.3) * 0.008);
  }

  updateHover();
  renderer.render(scene, camera);
}

function placeStatic() {
  planetMeshes.forEach((m, i) => {
    const a = (i / PLANETS.length) * Math.PI * 2;
    m.position.set(Math.cos(a) * m.userData.orbit, m.userData.zOff, Math.sin(a) * m.userData.orbit);
  });
}

// ══════════════════════════════════════════════════════════
//  HOVER
// ══════════════════════════════════════════════════════════
function updateHover() {
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(planetMeshes);
  const hit = hits.length > 0 ? hits[0].object : null;

  if (hit) {
    if (hoveredPlanet !== hit) {
      resetHover();
      hoveredPlanet = hit;
      hoveredPlanet.material.emissiveIntensity = 0.35;
      hoveredPlanet.material.emissive = new THREE.Color(0xfbbf24);
      hoveredPlanet.scale.setScalar(1.18);
      hoveredPlanet.position.y = hoveredPlanet.userData.zOff + 0.3;
      canvasEl.style.cursor = 'pointer';
      showOverlay(hoveredPlanet.userData.name, hoveredPlanet.userData.desc);
    }
  } else if (hoveredPlanet) {
    resetHover();
  }
}

function resetHover() {
  if (!hoveredPlanet) return;
  hoveredPlanet.material.emissiveIntensity = 0;
  hoveredPlanet.material.emissive = new THREE.Color(0x000000);
  hoveredPlanet.scale.setScalar(1);
  hoveredPlanet.position.y = hoveredPlanet.userData.zOff;
  hoveredPlanet = null;
  canvasEl.style.cursor = 'default';
  hideOverlay();
}

// ══════════════════════════════════════════════════════════
//  EVENTS
// ══════════════════════════════════════════════════════════
function onMouseMove(e) {
  const r = canvasEl.getBoundingClientRect();
  mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  if (REDUCE_MOTION) { updateHover(); renderer.render(scene, camera); }
}

function onLeave() {
  mouse.set(-999, -999);
  resetHover();
  if (REDUCE_MOTION) renderer.render(scene, camera);
}

function onClick() {
  if (hoveredPlanet) window.location.href = hoveredPlanet.userData.url;
}

function onTouch(e) {
  if (e.touches.length !== 1) return;
  const r = canvasEl.getBoundingClientRect();
  const t = e.touches[0];
  mouse.x = ((t.clientX - r.left) / r.width) * 2 - 1;
  mouse.y = -((t.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(planetMeshes);
  if (hits.length > 0 && hits[0].object.userData.url) {
    window.location.href = hits[0].object.userData.url;
  }
}

function onResize() {
  if (!canvasEl) return;
  const c = canvasEl.parentElement;
  if (!c) return;
  camera.aspect = c.clientWidth / c.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(c.clientWidth, c.clientHeight);
  if (REDUCE_MOTION) renderer.render(scene, camera);
}

function onVisibility() {
  if (REDUCE_MOTION) return;
  if (document.hidden) { if (animationId) cancelAnimationFrame(animationId); animationId = null; }
  else if (!animationId) tick();
}
