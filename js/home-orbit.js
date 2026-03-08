/**
 * SolarMetrics — Home Orbit Menu V5 (Three.js r128)
 * "UI menu orbital" — pas une simulation astronomique
 *
 * Spec:
 * - Starfield procédural : 1000 étoiles fixes, tailles variées, opacité faible
 * - Soleil : texture procédurale canvas (gradient + stries), rotation Y visible,
 *   glow = 1 sprite radial additif ambre (pas de halo brun)
 * - 6 planètes, taille quasi-uniforme, z ±0.2 pour profondeur
 * - 6 orbites très discrètes (opacity 0.08)
 * - group.rotation.x = -0.25
 * - Caméra : FOV 52, système remplit 70-80% du canvas
 * - Hover desktop : highlight + label HTML overlay en bas-centre
 * - Click/tap : navigation URL
 * - prefers-reduced-motion : tout figé, hover/click OK
 * - DPR max 1.5
 */

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';

// ─── Sections (6 rubriques) ──────────────────────────────
const PLANETS = [
  { name: 'Technologies', desc: 'Panneaux, onduleurs, batteries',    url: '/fr/technologies.html', color: 0xd4a35c, orbit: 2.4, speed: 0.22, zOff:  0.15 },
  { name: 'Économie',     desc: 'Rentabilité et financement',        url: '/fr/economie.html',     color: 0x6b9e85, orbit: 3.2, speed: 0.17, zOff: -0.12 },
  { name: 'Marchés',      desc: 'Tendances et acteurs mondiaux',     url: '/fr/marches.html',      color: 0x7088b8, orbit: 4.0, speed: 0.13, zOff:  0.20 },
  { name: 'Outils',       desc: 'Simulateurs et calculateurs',       url: '/fr/outils.html',       color: 0x5a9daa, orbit: 4.8, speed: 0.10, zOff: -0.18 },
  { name: 'Analyses',     desc: 'Études de cas et comparatifs',      url: '/fr/analyses/',          color: 0x8a7aab, orbit: 5.6, speed: 0.08, zOff:  0.10 },
  { name: 'Données',      desc: 'Hypothèses et sources',             url: '/fr/hypotheses.html',   color: 0xb07080, orbit: 6.4, speed: 0.06, zOff: -0.14 },
];

const PLANET_R     = 0.34;     // quasi-uniforme
const SUN_R        = 1.1;
const SUN_GLOW_SZ  = 5.5;
const ORBIT_TILT   = -0.25;
const DPR_MAX      = 1.5;
const STAR_COUNT   = 1000;
const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── State ────────────────────────────────────────────────
let scene, camera, renderer, canvasEl, container;
let orbitGroup, sun;
let planetMeshes = [];
let raycaster, mouse, hoveredPlanet = null;
let overlayEl = null;
let hintEl = null;
let animationId = null;

// ══════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════
export function init(containerId) {
  container = document.getElementById(containerId);
  if (!container) return false;

  try {
    scene = new THREE.Scene();

    // Camera — système remplit 70-80%
    camera = new THREE.PerspectiveCamera(52, container.clientWidth / container.clientHeight, 0.1, 250);
    camera.position.set(0, 2.6, 9.5);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, DPR_MAX));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x0f172a, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    canvasEl = renderer.domElement;
    canvasEl.style.cursor = 'default';
    container.appendChild(canvasEl);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2(-999, -999);
    container.style.position = 'relative';

    // Groupe orbital incliné
    orbitGroup = new THREE.Group();
    orbitGroup.rotation.x = ORBIT_TILT;
    scene.add(orbitGroup);

    // Build
    buildStarfield();
    buildSun();
    buildOrbits();
    buildPlanets();
    buildLights();
    buildOverlay();

    // Events
    canvasEl.addEventListener('mousemove', onMouseMove);
    canvasEl.addEventListener('click', onClick);
    canvasEl.addEventListener('touchstart', onTouch, { passive: true });
    canvasEl.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    if (!REDUCE_MOTION) {
      tick();
    } else {
      placeStatic();
      renderer.render(scene, camera);
    }

    return true;
  } catch (e) {
    console.warn('WebGL init failed:', e);
    return false;
  }
}

// ══════════════════════════════════════════════════════════
//  A) STARFIELD — 1000 étoiles fixes, tailles variées
// ══════════════════════════════════════════════════════════
function buildStarfield() {
  const pos = new Float32Array(STAR_COUNT * 3);
  const sizes = new Float32Array(STAR_COUNT);

  for (let i = 0; i < STAR_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 80 + Math.random() * 40;   // rayon 80–120
    pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
    sizes[i] = 0.3 + Math.random() * 1.2;    // taille variée
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // PointsMaterial utilise "size" global, pas per-vertex sans shader
  // On utilise une taille moyenne + sizeAttenuation
  const mat = new THREE.PointsMaterial({
    color: 0xcbd5e1,        // slate-300
    size: 0.12,
    transparent: true,
    opacity: 0.4,
    sizeAttenuation: true,
  });

  scene.add(new THREE.Points(geo, mat));

  // Deuxième couche : quelques étoiles plus grosses/brillantes
  const brightCount = 80;
  const bPos = new Float32Array(brightCount * 3);
  for (let i = 0; i < brightCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 75 + Math.random() * 45;
    bPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    bPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    bPos[i * 3 + 2] = r * Math.cos(phi);
  }
  const bGeo = new THREE.BufferGeometry();
  bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
  const bMat = new THREE.PointsMaterial({
    color: 0xf1f5f9,       // slate-100 (plus brillant)
    size: 0.22,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
  });
  scene.add(new THREE.Points(bGeo, bMat));
}

// ══════════════════════════════════════════════════════════
//  B) SOLEIL — texture procédurale + rotation Y + glow sprite
// ══════════════════════════════════════════════════════════
function buildSun() {
  // ── Texture procédurale (canvas 2D) ──
  const texSize = 512;
  const c = document.createElement('canvas');
  c.width = texSize; c.height = texSize;
  const ctx = c.getContext('2d');

  // Base : gradient radial (centre clair → bord plus sombre)
  const baseGrad = ctx.createRadialGradient(
    texSize / 2, texSize / 2, 0,
    texSize / 2, texSize / 2, texSize / 2
  );
  baseGrad.addColorStop(0,   '#fef3c7');  // amber-100
  baseGrad.addColorStop(0.3, '#fcd34d');  // amber-300
  baseGrad.addColorStop(0.6, '#f59e0b');  // amber-500
  baseGrad.addColorStop(0.85,'#d97706');  // amber-600
  baseGrad.addColorStop(1,   '#b45309');  // amber-700
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, texSize, texSize);

  // Stries / bruit léger (simule des "granules solaires")
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * texSize;
    const y = Math.random() * texSize;
    const w = 1 + Math.random() * 4;
    const h = 2 + Math.random() * 12;
    const angle = Math.random() * Math.PI;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = Math.random() > 0.5 ? '#fbbf24' : '#92400e';
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // Quelques "taches" sombres (petites)
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 8; i++) {
    const cx = texSize * 0.2 + Math.random() * texSize * 0.6;
    const cy = texSize * 0.2 + Math.random() * texSize * 0.6;
    const r  = 5 + Math.random() * 15;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#78350f';
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const sunTexture = new THREE.CanvasTexture(c);
  sunTexture.wrapS = THREE.RepeatWrapping;
  sunTexture.wrapT = THREE.RepeatWrapping;

  // Core sphere avec texture
  const coreGeo = new THREE.SphereGeometry(SUN_R, 48, 48);
  const coreMat = new THREE.MeshBasicMaterial({
    map: sunTexture,
    color: 0xffffff,
  });
  sun = new THREE.Mesh(coreGeo, coreMat);
  orbitGroup.add(sun);

  // ── Glow sprite additif propre ──
  const glowC = document.createElement('canvas');
  glowC.width = 256; glowC.height = 256;
  const gCtx = glowC.getContext('2d');
  const gGrad = gCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gGrad.addColorStop(0,    'rgba(252,211,77, 1)');
  gGrad.addColorStop(0.1,  'rgba(251,191,36, 0.85)');
  gGrad.addColorStop(0.3,  'rgba(245,158,11, 0.3)');
  gGrad.addColorStop(0.55, 'rgba(245,158,11, 0.06)');
  gGrad.addColorStop(1,    'rgba(245,158,11, 0)');
  gCtx.fillStyle = gGrad;
  gCtx.fillRect(0, 0, 256, 256);

  const glowTex = new THREE.CanvasTexture(glowC);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex,
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  sprite.scale.set(SUN_GLOW_SZ, SUN_GLOW_SZ, 1);
  orbitGroup.add(sprite);

  // PointLight depuis le soleil
  const light = new THREE.PointLight(0xfbbf24, 2.5, 22, 1.0);
  orbitGroup.add(light);
}

// ══════════════════════════════════════════════════════════
//  C) ORBITES — 6, très discrètes
// ══════════════════════════════════════════════════════════
function buildOrbits() {
  PLANETS.forEach((p) => {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * p.orbit, 0, Math.sin(a) * p.orbit));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: 0x334155,
      transparent: true,
      opacity: 0.08,
    });
    orbitGroup.add(new THREE.Line(geo, mat));
  });
}

// ══════════════════════════════════════════════════════════
//  D) PLANÈTES — taille uniforme, z ±0.2
// ══════════════════════════════════════════════════════════
function buildPlanets() {
  PLANETS.forEach((p, i) => {
    const geo = new THREE.SphereGeometry(PLANET_R, 28, 28);
    const mat = new THREE.MeshStandardMaterial({
      color: p.color,
      emissive: p.color,
      emissiveIntensity: 0.15,
      roughness: 0.65,
      metalness: 0.05,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { index: i, name: p.name, desc: p.desc, url: p.url,
                      baseColor: p.color, orbit: p.orbit, speed: p.speed, zOff: p.zOff };

    // Position initiale (répartie)
    const angle = (i / PLANETS.length) * Math.PI * 2;
    mesh.position.set(Math.cos(angle) * p.orbit, p.zOff, Math.sin(angle) * p.orbit);

    orbitGroup.add(mesh);
    planetMeshes.push(mesh);
  });
}

// ══════════════════════════════════════════════════════════
//  LIGHTS
// ══════════════════════════════════════════════════════════
function buildLights() {
  scene.add(new THREE.AmbientLight(0x334155, 0.4));
}

// ══════════════════════════════════════════════════════════
//  OVERLAY HTML (label hover en bas-centre)
// ══════════════════════════════════════════════════════════
function buildOverlay() {
  // Overlay rubrique (caché par défaut)
  overlayEl = document.createElement('div');
  overlayEl.style.cssText =
    'position:absolute;bottom:24px;left:50%;transform:translateX(-50%);' +
    'opacity:0;transition:opacity 0.2s;pointer-events:none;text-align:center;' +
    'font-family:Inter,system-ui,sans-serif;z-index:10;';
  overlayEl.innerHTML =
    '<div id="ov-name" style="color:#f8fafc;font-size:17px;font-weight:600;' +
    'letter-spacing:0.015em;margin-bottom:3px;"></div>' +
    '<div id="ov-desc" style="color:rgba(148,163,184,0.75);font-size:12px;"></div>';
  container.appendChild(overlayEl);

  // Hint initial
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
  if (!overlayEl) return;
  if (hintEl) hintEl.style.opacity = '0';
  overlayEl.querySelector('#ov-name').textContent = name;
  overlayEl.querySelector('#ov-desc').textContent = desc;
  overlayEl.style.opacity = '1';
}

function hideOverlay() {
  if (overlayEl) overlayEl.style.opacity = '0';
}

// ══════════════════════════════════════════════════════════
//  ANIMATION
// ══════════════════════════════════════════════════════════
function tick() {
  animationId = requestAnimationFrame(tick);
  const t = Date.now() * 0.001;

  // Planètes tournent
  planetMeshes.forEach((m) => {
    const d = m.userData;
    const a = (d.index / PLANETS.length) * Math.PI * 2 + t * d.speed;
    m.position.x = Math.cos(a) * d.orbit;
    m.position.z = Math.sin(a) * d.orbit;
    // y = zOff (profondeur) sauf si hovered (géré dans updateHover)
    if (m !== hoveredPlanet) m.position.y = d.zOff;
  });

  // Soleil tourne (rotation visible grâce à la texture)
  if (sun) sun.rotation.y = t * 0.08;

  // Pulse très subtil du soleil
  if (sun) {
    const p = 1.0 + Math.sin(t * 0.4) * 0.01;
    sun.scale.setScalar(p);
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
//  HOVER — highlight + scale + y-advance
// ══════════════════════════════════════════════════════════
function updateHover() {
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(planetMeshes);
  const hit = hits.length > 0 ? hits[0].object : null;

  if (hit) {
    if (hoveredPlanet !== hit) {
      resetHover();
      hoveredPlanet = hit;
      hoveredPlanet.material.emissiveIntensity = 0.65;
      hoveredPlanet.scale.setScalar(1.15);
      hoveredPlanet.position.y = hoveredPlanet.userData.zOff + 0.25;
      canvasEl.style.cursor = 'pointer';
      showOverlay(hoveredPlanet.userData.name, hoveredPlanet.userData.desc);
    }
  } else if (hoveredPlanet) {
    resetHover();
  }
}

function resetHover() {
  if (!hoveredPlanet) return;
  hoveredPlanet.material.emissiveIntensity = 0.15;
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
