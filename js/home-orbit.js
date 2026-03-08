/**
 * SolarMetrics — Home Orbit Menu (Three.js)
 * 3D solar system navigation: sun + 6 planet-links
 *
 * Constraints:
 * - No textures, no shadows, no heavy assets
 * - DPR capped at 1.5
 * - prefers-reduced-motion: fully static scene
 * - Fallback: if WebGL fails, canvas hidden, text menu remains
 */

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';

// ─── Config ───────────────────────────────────────────────
const PLANETS = [
  { name: 'Technologies', url: '/fr/technologies.html', color: 0xf59e0b, orbitRadius: 3.2, speed: 0.4, size: 0.32 },
  { name: 'Économie',     url: '/fr/economie.html',     color: 0x10b981, orbitRadius: 4.4, speed: 0.3, size: 0.28 },
  { name: 'Marchés',      url: '/fr/marches.html',      color: 0x3b82f6, orbitRadius: 5.6, speed: 0.22, size: 0.30 },
  { name: 'Outils',       url: '/fr/outils.html',       color: 0x06b6d4, orbitRadius: 6.8, speed: 0.17, size: 0.34 },
  { name: 'Analyses',     url: '/fr/analyses/',          color: 0x8b5cf6, orbitRadius: 8.0, speed: 0.13, size: 0.26 },
  { name: 'Données',      url: '/fr/hypotheses.html',    color: 0xec4899, orbitRadius: 9.2, speed: 0.10, size: 0.24 },
];

const DPR_MAX = 1.5;
const SPHERE_SEGMENTS = 16;
const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── Init ─────────────────────────────────────────────────
let scene, camera, renderer, sun, planetMeshes = [], orbitLines = [];
let raycaster, mouse, hoveredPlanet = null;
let labelEl = null;
let animationId = null;
let canvasEl = null;

export function init(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return false;

  try {
    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 8, 14);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, DPR_MAX));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    canvasEl = renderer.domElement;
    canvasEl.style.cursor = 'default';
    container.appendChild(canvasEl);

    // Raycaster
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2(-999, -999);

    // Label element
    labelEl = document.createElement('div');
    labelEl.id = 'orbit-label';
    labelEl.style.cssText = 'position:absolute;pointer-events:none;opacity:0;transition:opacity 0.2s;background:rgba(15,23,42,0.9);color:#f8fafc;padding:6px 14px;border-radius:8px;font-size:14px;font-weight:600;font-family:Inter,sans-serif;border:1px solid rgba(245,158,11,0.3);white-space:nowrap;z-index:10;';
    container.style.position = 'relative';
    container.appendChild(labelEl);

    // Build scene
    createSun();
    createPlanets();
    createOrbitRings();
    addLights();

    // Events
    canvasEl.addEventListener('mousemove', onMouseMove);
    canvasEl.addEventListener('click', onClick);
    canvasEl.addEventListener('touchstart', onTouchStart, { passive: true });
    canvasEl.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('resize', onResize);

    // Pause when tab hidden
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Start animation
    if (!REDUCE_MOTION) {
      animate();
    } else {
      // Place planets at initial positions (no animation)
      placePlanetsStatic();
      renderer.render(scene, camera);
    }

    return true;
  } catch (e) {
    console.warn('WebGL init failed:', e);
    return false;
  }
}

// ─── Scene objects ────────────────────────────────────────
function createSun() {
  const geo = new THREE.SphereGeometry(0.8, SPHERE_SEGMENTS, SPHERE_SEGMENTS);
  const mat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  sun = new THREE.Mesh(geo, mat);
  scene.add(sun);

  // Subtle glow (additive sprite)
  const glowGeo = new THREE.SphereGeometry(1.2, SPHERE_SEGMENTS, SPHERE_SEGMENTS);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.15 });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  scene.add(glow);
}

function createPlanets() {
  PLANETS.forEach((p, i) => {
    const geo = new THREE.SphereGeometry(p.size, SPHERE_SEGMENTS, SPHERE_SEGMENTS);
    const mat = new THREE.MeshBasicMaterial({ color: p.color });
    const mesh = new THREE.Mesh(geo, mat);

    // Store planet data on mesh
    mesh.userData = { index: i, name: p.name, url: p.url, baseColor: p.color, orbitRadius: p.orbitRadius, speed: p.speed };

    // Initial position
    const angle = (i / PLANETS.length) * Math.PI * 2;
    mesh.position.x = Math.cos(angle) * p.orbitRadius;
    mesh.position.z = Math.sin(angle) * p.orbitRadius;

    scene.add(mesh);
    planetMeshes.push(mesh);
  });
}

function createOrbitRings() {
  PLANETS.forEach((p) => {
    const points = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * p.orbitRadius, 0, Math.sin(angle) * p.orbitRadius));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.4 });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    orbitLines.push(line);
  });
}

function addLights() {
  // Ambient only — no shadows needed
  const ambient = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambient);
}

// ─── Animation ────────────────────────────────────────────
function animate() {
  animationId = requestAnimationFrame(animate);

  const time = Date.now() * 0.001;

  planetMeshes.forEach((mesh) => {
    const { orbitRadius, speed, index } = mesh.userData;
    const baseAngle = (index / PLANETS.length) * Math.PI * 2;
    const angle = baseAngle + time * speed;
    mesh.position.x = Math.cos(angle) * orbitRadius;
    mesh.position.z = Math.sin(angle) * orbitRadius;
  });

  // Raycasting
  updateHover();

  renderer.render(scene, camera);
}

function placePlanetsStatic() {
  planetMeshes.forEach((mesh, i) => {
    const angle = (i / PLANETS.length) * Math.PI * 2;
    mesh.position.x = Math.cos(angle) * mesh.userData.orbitRadius;
    mesh.position.z = Math.sin(angle) * mesh.userData.orbitRadius;
  });
}

// ─── Interaction ──────────────────────────────────────────
function updateHover() {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planetMeshes);

  if (intersects.length > 0) {
    const mesh = intersects[0].object;
    if (hoveredPlanet !== mesh) {
      // Reset previous
      if (hoveredPlanet) {
        hoveredPlanet.material.color.setHex(hoveredPlanet.userData.baseColor);
        hoveredPlanet.scale.setScalar(1);
      }
      // Highlight new
      hoveredPlanet = mesh;
      hoveredPlanet.material.color.setHex(0xffffff);
      hoveredPlanet.scale.setScalar(1.4);
      canvasEl.style.cursor = 'pointer';

      // Show label
      showLabel(mesh.userData.name);
    }
    // Update label position
    updateLabelPosition(mesh);
  } else {
    if (hoveredPlanet) {
      hoveredPlanet.material.color.setHex(hoveredPlanet.userData.baseColor);
      hoveredPlanet.scale.setScalar(1);
      hoveredPlanet = null;
      canvasEl.style.cursor = 'default';
      hideLabel();
    }
  }
}

function showLabel(text) {
  if (!labelEl) return;
  labelEl.textContent = text;
  labelEl.style.opacity = '1';
}

function hideLabel() {
  if (!labelEl) return;
  labelEl.style.opacity = '0';
}

function updateLabelPosition(mesh) {
  if (!labelEl || !canvasEl) return;
  const vector = mesh.position.clone();
  vector.project(camera);
  const rect = canvasEl.getBoundingClientRect();
  const x = ((vector.x + 1) / 2) * rect.width;
  const y = ((-vector.y + 1) / 2) * rect.height;
  labelEl.style.left = x + 'px';
  labelEl.style.top = (y - 40) + 'px';
  labelEl.style.transform = 'translateX(-50%)';
}

function onMouseMove(e) {
  const rect = canvasEl.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  // For reduced-motion mode, still allow hover but need to render
  if (REDUCE_MOTION) {
    updateHover();
    renderer.render(scene, camera);
  }
}

function onMouseLeave() {
  mouse.set(-999, -999);
  if (hoveredPlanet) {
    hoveredPlanet.material.color.setHex(hoveredPlanet.userData.baseColor);
    hoveredPlanet.scale.setScalar(1);
    hoveredPlanet = null;
    canvasEl.style.cursor = 'default';
    hideLabel();
  }
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
    window.location.href = intersects[0].object.userData.url;
  }
}

// ─── Resize ───────────────────────────────────────────────
function onResize() {
  const container = canvasEl.parentElement;
  if (!container) return;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
  if (REDUCE_MOTION) renderer.render(scene, camera);
}

// ─── Visibility ───────────────────────────────────────────
function onVisibilityChange() {
  if (REDUCE_MOTION) return;
  if (document.hidden) {
    if (animationId) cancelAnimationFrame(animationId);
    animationId = null;
  } else {
    if (!animationId) animate();
  }
}
