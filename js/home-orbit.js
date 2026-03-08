/**
 * SolarMetrics — Home Orbit Menu V4 (Three.js)
 * Premium 3D solar system navigation — clean design
 *
 * V4 — radical cleanup:
 * - ZERO planet halos/bubbles
 * - 6 orbits only (1 per section), ultra-thin, opacity 0.18
 * - Camera: FOV 55, pos (0, 3.8, 10.5), lookAt(0,0,0)
 * - Orbit group tilt: -0.55
 * - Sun: radius 1.4, bright emissive + clean additive glow sprite (size ~6.5)
 * - Planets: 0.28–0.55 radius, desaturated, slight Z variation for depth
 * - Labels always visible (small, elegant)
 * - "Cliquez sur une planète" hint
 * - DPR max 1.5, prefers-reduced-motion safe
 */

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';

// ─── Planet config (1 per section) ────────────────────────
const PLANETS = [
  { name: 'Technologies', url: '/fr/technologies.html', color: 0xc9956a, orbitRadius: 2.6, speed: 0.28, size: 0.38, zOff:  0.12 },
  { name: 'Économie',     url: '/fr/economie.html',     color: 0x6b9e8a, orbitRadius: 3.5, speed: 0.22, size: 0.32, zOff: -0.10 },
  { name: 'Marchés',      url: '/fr/marches.html',      color: 0x7088b4, orbitRadius: 4.4, speed: 0.17, size: 0.35, zOff:  0.15 },
  { name: 'Outils',       url: '/fr/outils.html',       color: 0x5a9daa, orbitRadius: 5.3, speed: 0.13, size: 0.42, zOff: -0.08 },
  { name: 'Analyses',     url: '/fr/analyses/',          color: 0x8a7aab, orbitRadius: 6.2, speed: 0.10, size: 0.30, zOff:  0.14 },
  { name: 'Données',      url: '/fr/hypotheses.html',    color: 0xb07080, orbitRadius: 7.1, speed: 0.07, size: 0.28, zOff: -0.13 },
];

const DPR_MAX = 1.5;
const ORBIT_TILT = -0.55;
const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── State ────────────────────────────────────────────────
let scene, camera, renderer, canvasEl;
let orbitGroup;
let sun;
let planetMeshes = [];
let raycaster, mouse, hoveredPlanet = null;
let labelEls = [];       // Persistent labels (one per planet)
let hintEl = null;        // "Cliquez sur une planète"
let animationId = null;
let starField = null;

// ─── Init ─────────────────────────────────────────────────
export function init(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return false;

  try {
    scene = new THREE.Scene();

    // Camera — FOV 55, closer, centered
    camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );
    camera.position.set(0, 3.8, 10.5);
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

    // Container must be relative for label positioning
    container.style.position = 'relative';

    // ── Orbit group (tilted for ellipse perspective) ──
    orbitGroup = new THREE.Group();
    orbitGroup.rotation.x = ORBIT_TILT;
    scene.add(orbitGroup);

    // Build scene
    createStarField();
    createSun();
    createOrbitRings();
    createPlanets();
    addLights();
    createLabels(container);
    createHint(container);

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
      updateLabelPositions();
      renderer.render(scene, camera);
    }

    return true;
  } catch (e) {
    console.warn('WebGL init failed:', e);
    return false;
  }
}

// ─── Star field (subtle, not distracting) ─────────────────
function createStarField() {
  const count = 350;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 30 + Math.random() * 50;
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0x94a3b8,     // slate-400
    size: 0.08,
    transparent: true,
    opacity: 0.45,
    sizeAttenuation: true,
  });

  starField = new THREE.Points(geo, mat);
  scene.add(starField);
}

// ─── Sun — bright core + clean additive glow sprite ──────
function createSun() {
  // Core sphere — emissive, visible "substance"
  const coreGeo = new THREE.SphereGeometry(1.4, 40, 40);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xfcd34d,
  });
  sun = new THREE.Mesh(coreGeo, coreMat);
  orbitGroup.add(sun);

  // Inner bright layer for gradient effect
  const innerGeo = new THREE.SphereGeometry(1.5, 32, 32);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.4,
  });
  const innerGlow = new THREE.Mesh(innerGeo, innerMat);
  orbitGroup.add(innerGlow);

  // ── Clean additive glow sprite ──
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 256;
  glowCanvas.height = 256;
  const ctx = glowCanvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(252, 211, 77, 1)');
  gradient.addColorStop(0.08, 'rgba(251, 191, 36, 0.9)');
  gradient.addColorStop(0.25, 'rgba(245, 158, 11, 0.4)');
  gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.08)');
  gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const glowTexture = new THREE.CanvasTexture(glowCanvas);
  const spriteMat = new THREE.SpriteMaterial({
    map: glowTexture,
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glowSprite = new THREE.Sprite(spriteMat);
  glowSprite.scale.set(6.5, 6.5, 1);
  orbitGroup.add(glowSprite);

  // Point light from sun
  const sunLight = new THREE.PointLight(0xfbbf24, 3.0, 25, 1.0);
  sunLight.position.set(0, 0, 0);
  orbitGroup.add(sunLight);
}

// ─── Orbit rings — ultra-thin, subtle ────────────────────
function createOrbitRings() {
  PLANETS.forEach((p) => {
    const points = [];
    const segCount = 128;
    for (let i = 0; i <= segCount; i++) {
      const angle = (i / segCount) * Math.PI * 2;
      points.push(new THREE.Vector3(
        Math.cos(angle) * p.orbitRadius,
        0,
        Math.sin(angle) * p.orbitRadius
      ));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0x334155,      // slate-700
      transparent: true,
      opacity: 0.18,
    });
    const line = new THREE.Line(geo, mat);
    orbitGroup.add(line);
  });
}

// ─── Planets — NO halos, clean spheres ───────────────────
function createPlanets() {
  PLANETS.forEach((p, i) => {
    const geo = new THREE.SphereGeometry(p.size, 28, 28);
    const mat = new THREE.MeshStandardMaterial({
      color: p.color,
      emissive: p.color,
      emissiveIntensity: 0.2,
      roughness: 0.7,
      metalness: 0.05,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = {
      index: i,
      name: p.name,
      url: p.url,
      baseColor: p.color,
      orbitRadius: p.orbitRadius,
      speed: p.speed,
      size: p.size,
      zOff: p.zOff,
    };

    // Initial position (evenly spread)
    const angle = (i / PLANETS.length) * Math.PI * 2;
    mesh.position.x = Math.cos(angle) * p.orbitRadius;
    mesh.position.z = Math.sin(angle) * p.orbitRadius;
    mesh.position.y = p.zOff;     // slight Y offset for depth

    orbitGroup.add(mesh);
    planetMeshes.push(mesh);
  });
}

// ─── Lights ──────────────────────────────────────────────
function addLights() {
  // Gentle ambient
  const ambient = new THREE.AmbientLight(0x334155, 0.5);
  scene.add(ambient);
}

// ─── Always-visible labels (small, elegant) ──────────────
function createLabels(container) {
  PLANETS.forEach((p) => {
    const el = document.createElement('div');
    el.className = 'orbit-planet-label';
    el.textContent = p.name;
    el.style.cssText =
      'position:absolute;pointer-events:none;' +
      'color:rgba(203,213,225,0.7);font-size:11px;font-weight:500;' +
      'font-family:Inter,system-ui,sans-serif;letter-spacing:0.03em;' +
      'white-space:nowrap;transition:color 0.2s,transform 0.2s;' +
      'transform:translateX(-50%);text-shadow:0 1px 4px rgba(0,0,0,0.6);';
    container.appendChild(el);
    labelEls.push(el);
  });
}

// ─── Hint: "Cliquez sur une planète" ─────────────────────
function createHint(container) {
  hintEl = document.createElement('div');
  hintEl.textContent = 'Cliquez sur une planète pour explorer';
  hintEl.style.cssText =
    'position:absolute;bottom:16px;left:50%;transform:translateX(-50%);' +
    'color:rgba(148,163,184,0.55);font-size:12px;font-family:Inter,system-ui,sans-serif;' +
    'letter-spacing:0.04em;pointer-events:none;transition:opacity 3s;';
  container.appendChild(hintEl);
  // Fade out after 5 seconds
  setTimeout(() => { if (hintEl) hintEl.style.opacity = '0'; }, 5000);
}

// ─── Update label positions (projected from 3D) ─────────
function updateLabelPositions() {
  if (!canvasEl) return;
  const rect = canvasEl.getBoundingClientRect();

  planetMeshes.forEach((mesh, i) => {
    const el = labelEls[i];
    if (!el) return;

    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);
    worldPos.y += mesh.userData.size + 0.35;
    worldPos.project(camera);

    const x = ((worldPos.x + 1) / 2) * rect.width;
    const y = ((-worldPos.y + 1) / 2) * rect.height;
    el.style.left = x + 'px';
    el.style.top = (y - 10) + 'px';
  });
}

// ─── Animation ───────────────────────────────────────────
function animate() {
  animationId = requestAnimationFrame(animate);
  const time = Date.now() * 0.001;

  // Rotate planets
  planetMeshes.forEach((mesh) => {
    const { orbitRadius, speed, index, zOff } = mesh.userData;
    const baseAngle = (index / PLANETS.length) * Math.PI * 2;
    const angle = baseAngle + time * speed;
    mesh.position.x = Math.cos(angle) * orbitRadius;
    mesh.position.z = Math.sin(angle) * orbitRadius;
    mesh.position.y = zOff;
  });

  // Subtle sun pulse
  if (sun) {
    const pulse = 1.0 + Math.sin(time * 0.5) * 0.02;
    sun.scale.setScalar(pulse);
  }

  // Very slow star drift
  if (starField) starField.rotation.y = time * 0.0015;

  updateHover();
  updateLabelPositions();
  renderer.render(scene, camera);
}

function placePlanetsStatic() {
  planetMeshes.forEach((mesh, i) => {
    const angle = (i / PLANETS.length) * Math.PI * 2;
    mesh.position.x = Math.cos(angle) * mesh.userData.orbitRadius;
    mesh.position.z = Math.sin(angle) * mesh.userData.orbitRadius;
    mesh.position.y = mesh.userData.zOff;
  });
}

// ─── Interaction ─────────────────────────────────────────
function updateHover() {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planetMeshes);

  let hitMesh = null;
  if (intersects.length > 0) {
    hitMesh = intersects[0].object;
  }

  if (hitMesh) {
    if (hoveredPlanet !== hitMesh) {
      resetHover();
      hoveredPlanet = hitMesh;
      const idx = hoveredPlanet.userData.index;

      // Brighten planet
      hoveredPlanet.material.emissiveIntensity = 0.8;
      hoveredPlanet.scale.setScalar(1.3);

      // Brighten label
      if (labelEls[idx]) {
        labelEls[idx].style.color = 'rgba(248,250,252,1)';
        labelEls[idx].style.transform = 'translateX(-50%) scale(1.1)';
      }

      canvasEl.style.cursor = 'pointer';
    }
  } else {
    if (hoveredPlanet) resetHover();
  }
}

function resetHover() {
  if (!hoveredPlanet) return;
  const idx = hoveredPlanet.userData.index;
  hoveredPlanet.material.emissiveIntensity = 0.2;
  hoveredPlanet.scale.setScalar(1);
  if (labelEls[idx]) {
    labelEls[idx].style.color = 'rgba(203,213,225,0.7)';
    labelEls[idx].style.transform = 'translateX(-50%)';
  }
  hoveredPlanet = null;
  canvasEl.style.cursor = 'default';
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
  const touch = e.touches[0];
  mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

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
  const container = canvasEl.parentElement;
  if (!container) return;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
  updateLabelPositions();
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
