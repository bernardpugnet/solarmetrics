/**
 * SolarMetrics — Home Orbit Menu V5 (Three.js)
 * "UI premium" — NOT an astronomy sim
 *
 * Design principles:
 * - Clean menu, not a planetarium
 * - 6 planets, same size (±10%), NO halos/bubbles/lens flares
 * - Orbits: 6 ultra-discreet rings (opacity 0.08) — almost invisible
 * - Sun: small (r=1.1), emissive + 1 clean additive glow sprite (no dark contour)
 * - Labels: HIDDEN by default. On hover → HTML overlay at bottom-center
 * - Hover: planet glows + scale 1.15 + slight z-advance
 * - Camera: FOV 52, pos (0, 2.6, 9.5), lookAt(0,0,0)
 * - Group tilt: -0.35 (gentle, not extreme ellipse)
 * - System fills 70-80% of canvas
 */

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';

// ─── Sections ─────────────────────────────────────────────
const PLANETS = [
  { name: 'Technologies', desc: 'Panneaux, onduleurs, batteries',    url: '/fr/technologies.html', color: 0xd4a35c, orbitRadius: 2.4, speed: 0.25 },
  { name: 'Économie',     desc: 'Rentabilité et financement',        url: '/fr/economie.html',     color: 0x6b9e85, orbitRadius: 3.1, speed: 0.20 },
  { name: 'Marchés',      desc: 'Tendances et acteurs mondiaux',     url: '/fr/marches.html',      color: 0x7088b8, orbitRadius: 3.8, speed: 0.16 },
  { name: 'Outils',       desc: 'Simulateurs et calculateurs',       url: '/fr/outils.html',       color: 0x5a9daa, orbitRadius: 4.5, speed: 0.13 },
  { name: 'Analyses',     desc: 'Études de cas et comparatifs',      url: '/fr/analyses/',          color: 0x8a7aab, orbitRadius: 5.2, speed: 0.10 },
  { name: 'Données',      desc: 'Hypothèses et sources de données',  url: '/fr/hypotheses.html',   color: 0xb07080, orbitRadius: 5.9, speed: 0.07 },
];

const PLANET_RADIUS = 0.35;           // Uniform size
const DPR_MAX = 1.5;
const ORBIT_TILT = -0.35;
const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── State ────────────────────────────────────────────────
let scene, camera, renderer, canvasEl, container;
let orbitGroup;
let sun;
let planetMeshes = [];
let raycaster, mouse, hoveredPlanet = null;
let overlayEl = null;      // Bottom-center HTML overlay for hover
let animationId = null;
let starField = null;

// ─── Init ─────────────────────────────────────────────────
export function init(containerId) {
  container = document.getElementById(containerId);
  if (!container) return false;

  try {
    scene = new THREE.Scene();

    // Camera — fills 70-80%
    camera = new THREE.PerspectiveCamera(
      52,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );
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

    // Raycaster
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2(-999, -999);

    // Container positioning
    container.style.position = 'relative';

    // ── Orbit group (gentle tilt) ──
    orbitGroup = new THREE.Group();
    orbitGroup.rotation.x = ORBIT_TILT;
    scene.add(orbitGroup);

    // Build
    createStarField();
    createSun();
    createOrbitRings();
    createPlanets();
    addLights();
    createOverlay();

    // Events
    canvasEl.addEventListener('mousemove', onMouseMove);
    canvasEl.addEventListener('click', onClick);
    canvasEl.addEventListener('touchstart', onTouchStart, { passive: true });
    canvasEl.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibilityChange);

    if (!REDUCE_MOTION) {
      animate();
    } else {
      placePlanetsStatic();
      renderer.render(scene, camera);
    }

    return true;
  } catch (e) {
    console.warn('WebGL init failed:', e);
    return false;
  }
}

// ─── Starfield (very subtle) ─────────────────────────────
function createStarField() {
  const count = 250;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 30 + Math.random() * 45;
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0x64748b,
    size: 0.06,
    transparent: true,
    opacity: 0.35,
    sizeAttenuation: true,
  });
  starField = new THREE.Points(geo, mat);
  scene.add(starField);
}

// ─── Sun — small, luminous, clean ────────────────────────
function createSun() {
  // Core
  const coreGeo = new THREE.SphereGeometry(1.1, 40, 40);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xfcd34d });
  sun = new THREE.Mesh(coreGeo, coreMat);
  orbitGroup.add(sun);

  // ── Clean additive glow sprite (NO dark edges) ──
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0,    'rgba(252,211,77, 1)');
  g.addColorStop(0.12, 'rgba(251,191,36, 0.8)');
  g.addColorStop(0.35, 'rgba(245,158,11, 0.2)');
  g.addColorStop(0.6,  'rgba(245,158,11, 0.03)');
  g.addColorStop(1,    'rgba(245,158,11, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(c);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex,
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  sprite.scale.set(5.5, 5.5, 1);
  orbitGroup.add(sprite);

  // Light from sun
  const light = new THREE.PointLight(0xfbbf24, 2.5, 20, 1.0);
  orbitGroup.add(light);
}

// ─── Orbit rings — ultra-discreet ────────────────────────
function createOrbitRings() {
  PLANETS.forEach((p) => {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * p.orbitRadius, 0, Math.sin(a) * p.orbitRadius));
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

// ─── Planets — uniform, clean ────────────────────────────
function createPlanets() {
  PLANETS.forEach((p, i) => {
    const geo = new THREE.SphereGeometry(PLANET_RADIUS, 28, 28);
    const mat = new THREE.MeshStandardMaterial({
      color: p.color,
      emissive: p.color,
      emissiveIntensity: 0.15,
      roughness: 0.65,
      metalness: 0.05,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = {
      index: i,
      name: p.name,
      desc: p.desc,
      url: p.url,
      baseColor: p.color,
      orbitRadius: p.orbitRadius,
      speed: p.speed,
      baseZ: 0,             // Will be animated
    };

    const angle = (i / PLANETS.length) * Math.PI * 2;
    mesh.position.set(
      Math.cos(angle) * p.orbitRadius,
      0,
      Math.sin(angle) * p.orbitRadius
    );

    orbitGroup.add(mesh);
    planetMeshes.push(mesh);
  });
}

// ─── Lights ──────────────────────────────────────────────
function addLights() {
  scene.add(new THREE.AmbientLight(0x334155, 0.4));
}

// ─── HTML overlay (bottom-center, hidden by default) ─────
function createOverlay() {
  overlayEl = document.createElement('div');
  overlayEl.id = 'orbit-overlay';
  overlayEl.style.cssText =
    'position:absolute;bottom:28px;left:50%;transform:translateX(-50%);' +
    'opacity:0;transition:opacity 0.25s;pointer-events:none;text-align:center;' +
    'font-family:Inter,system-ui,sans-serif;z-index:10;';
  overlayEl.innerHTML =
    '<div id="orbit-ov-name" style="color:#f8fafc;font-size:18px;font-weight:600;letter-spacing:0.02em;margin-bottom:4px;"></div>' +
    '<div id="orbit-ov-desc" style="color:rgba(148,163,184,0.8);font-size:13px;font-weight:400;"></div>';
  container.appendChild(overlayEl);

  // Initial hint (fades after 4s)
  const hint = document.createElement('div');
  hint.id = 'orbit-hint';
  hint.textContent = 'Survolez une planète pour explorer';
  hint.style.cssText =
    'position:absolute;bottom:28px;left:50%;transform:translateX(-50%);' +
    'color:rgba(148,163,184,0.45);font-size:12px;font-family:Inter,system-ui,sans-serif;' +
    'letter-spacing:0.04em;pointer-events:none;transition:opacity 2s;z-index:9;';
  container.appendChild(hint);
  setTimeout(() => { hint.style.opacity = '0'; }, 4000);
  setTimeout(() => { hint.remove(); }, 6500);
}

function showOverlay(name, desc) {
  if (!overlayEl) return;
  overlayEl.querySelector('#orbit-ov-name').textContent = name;
  overlayEl.querySelector('#orbit-ov-desc').textContent = desc;
  overlayEl.style.opacity = '1';
}

function hideOverlay() {
  if (!overlayEl) return;
  overlayEl.style.opacity = '0';
}

// ─── Animation ───────────────────────────────────────────
function animate() {
  animationId = requestAnimationFrame(animate);
  const time = Date.now() * 0.001;

  planetMeshes.forEach((mesh) => {
    const { orbitRadius, speed, index } = mesh.userData;
    const angle = (index / PLANETS.length) * Math.PI * 2 + time * speed;
    mesh.position.x = Math.cos(angle) * orbitRadius;
    mesh.position.z = Math.sin(angle) * orbitRadius;
    // Y stays at baseZ (0 or hover offset) — managed by hover logic
  });

  // Tiny sun pulse
  if (sun) sun.scale.setScalar(1.0 + Math.sin(time * 0.4) * 0.015);

  // Slow star drift
  if (starField) starField.rotation.y = time * 0.001;

  updateHover();
  renderer.render(scene, camera);
}

function placePlanetsStatic() {
  planetMeshes.forEach((mesh, i) => {
    const angle = (i / PLANETS.length) * Math.PI * 2;
    mesh.position.set(
      Math.cos(angle) * mesh.userData.orbitRadius,
      0,
      Math.sin(angle) * mesh.userData.orbitRadius
    );
  });
}

// ─── Hover — glow + scale + z-advance ────────────────────
function updateHover() {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planetMeshes);

  let hit = intersects.length > 0 ? intersects[0].object : null;

  if (hit) {
    if (hoveredPlanet !== hit) {
      resetHover();
      hoveredPlanet = hit;

      // Visual feedback: brighter, bigger, advances toward camera
      hoveredPlanet.material.emissiveIntensity = 0.7;
      hoveredPlanet.scale.setScalar(1.15);
      hoveredPlanet.position.y = 0.25;   // Slight lift toward camera

      canvasEl.style.cursor = 'pointer';
      showOverlay(hoveredPlanet.userData.name, hoveredPlanet.userData.desc);
    }
  } else {
    if (hoveredPlanet) resetHover();
  }
}

function resetHover() {
  if (!hoveredPlanet) return;
  hoveredPlanet.material.emissiveIntensity = 0.15;
  hoveredPlanet.scale.setScalar(1);
  hoveredPlanet.position.y = 0;
  hoveredPlanet = null;
  canvasEl.style.cursor = 'default';
  hideOverlay();
}

// ─── Events ──────────────────────────────────────────────
function onMouseMove(e) {
  const rect = canvasEl.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  if (REDUCE_MOTION) {
    updateHover();
    renderer.render(scene, camera);
  }
}

function onMouseLeave() {
  mouse.set(-999, -999);
  resetHover();
  if (REDUCE_MOTION) renderer.render(scene, camera);
}

function onClick() {
  if (hoveredPlanet) {
    window.location.href = hoveredPlanet.userData.url;
  }
}

function onTouchStart(e) {
  if (e.touches.length !== 1) return;
  const rect = canvasEl.getBoundingClientRect();
  const t = e.touches[0];
  mouse.x = ((t.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((t.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planetMeshes);
  if (intersects.length > 0) {
    const target = intersects[0].object;
    if (target.userData && target.userData.url) {
      window.location.href = target.userData.url;
    }
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

function onVisibilityChange() {
  if (REDUCE_MOTION) return;
  if (document.hidden) {
    if (animationId) cancelAnimationFrame(animationId);
    animationId = null;
  } else {
    if (!animationId) animate();
  }
}
