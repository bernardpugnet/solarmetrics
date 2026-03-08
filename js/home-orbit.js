/**
 * SolarMetrics — Home Orbit Menu (Three.js)
 * Beautiful 3D solar system navigation with glow, lighting & starfield
 *
 * Constraints:
 * - No external textures — all procedural
 * - DPR capped at 1.5
 * - prefers-reduced-motion: fully static scene (hover/click still work)
 * - Fallback: if WebGL fails, canvas hidden, text menu remains
 */

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';

// ─── Config ───────────────────────────────────────────────
const PLANETS = [
  { name: 'Technologies', url: '/fr/technologies.html', color: 0xf59e0b, emissive: 0x7a4f00, orbitRadius: 2.8, speed: 0.35, size: 0.22 },
  { name: 'Économie',     url: '/fr/economie.html',     color: 0x10b981, emissive: 0x065f46, orbitRadius: 3.8, speed: 0.27, size: 0.19 },
  { name: 'Marchés',      url: '/fr/marches.html',      color: 0x3b82f6, emissive: 0x1e3a5f, orbitRadius: 4.8, speed: 0.21, size: 0.21 },
  { name: 'Outils',       url: '/fr/outils.html',       color: 0x06b6d4, emissive: 0x064e5c, orbitRadius: 5.8, speed: 0.16, size: 0.24 },
  { name: 'Analyses',     url: '/fr/analyses/',          color: 0x8b5cf6, emissive: 0x3b1f7a, orbitRadius: 6.8, speed: 0.12, size: 0.18 },
  { name: 'Données',      url: '/fr/hypotheses.html',    color: 0xec4899, emissive: 0x6b1d4a, orbitRadius: 7.8, speed: 0.09, size: 0.16 },
];

const DPR_MAX = 1.5;
const SPHERE_SEG = 24;
const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── State ────────────────────────────────────────────────
let scene, camera, renderer, canvasEl;
let sun, sunGlow, sunCorona;
let planetMeshes = [], planetGlows = [], planetLabels = [];
let raycaster, mouse, hoveredPlanet = null;
let labelEl = null;
let animationId = null;
let starField = null;

// ─── Init ─────────────────────────────────────────────────
export function init(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return false;

  try {
    scene = new THREE.Scene();

    // Camera — cinematic angle
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 200);
    camera.position.set(0, 10, 16);
    camera.lookAt(0, -0.5, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, DPR_MAX));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x0f172a, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    canvasEl = renderer.domElement;
    canvasEl.style.cursor = 'default';
    container.appendChild(canvasEl);

    // Raycaster
    raycaster = new THREE.Raycaster();
    raycaster.params.Mesh = { threshold: 0.1 };
    mouse = new THREE.Vector2(-999, -999);

    // Hover label
    labelEl = document.createElement('div');
    labelEl.id = 'orbit-label';
    labelEl.style.cssText = 'position:absolute;pointer-events:none;opacity:0;transition:opacity 0.25s;' +
      'background:rgba(15,23,42,0.92);color:#f8fafc;padding:8px 16px;border-radius:10px;' +
      'font-size:13px;font-weight:600;font-family:Inter,sans-serif;letter-spacing:0.02em;' +
      'border:1px solid rgba(245,158,11,0.25);box-shadow:0 8px 24px rgba(0,0,0,0.4);' +
      'white-space:nowrap;z-index:10;backdrop-filter:blur(8px);';
    container.style.position = 'relative';
    container.appendChild(labelEl);

    // Build scene
    createStarField();
    createSun();
    createOrbitRings();
    createPlanets();
    addLights();

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

// ─── Star field ───────────────────────────────────────────
function createStarField() {
  const count = 600;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Spread stars in a large sphere
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 40 + Math.random() * 60;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    sizes[i] = 0.5 + Math.random() * 1.5;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.15,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
  });

  starField = new THREE.Points(geo, mat);
  scene.add(starField);
}

// ─── Sun with glow ────────────────────────────────────────
function createSun() {
  // Core
  const coreGeo = new THREE.SphereGeometry(0.7, 32, 32);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
  sun = new THREE.Mesh(coreGeo, coreMat);
  scene.add(sun);

  // Inner glow
  const glowGeo = new THREE.SphereGeometry(1.0, 32, 32);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.25,
  });
  sunGlow = new THREE.Mesh(glowGeo, glowMat);
  scene.add(sunGlow);

  // Outer corona
  const coronaGeo = new THREE.SphereGeometry(1.5, 32, 32);
  const coronaMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.08,
  });
  sunCorona = new THREE.Mesh(coronaGeo, coronaMat);
  scene.add(sunCorona);

  // Point light from sun
  const sunLight = new THREE.PointLight(0xfbbf24, 2, 25, 1.5);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);
}

// ─── Orbit rings (subtle gradient) ────────────────────────
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

    // Color gradient: brighter near inner orbits
    const brightness = Math.max(0.15, 0.5 - (p.orbitRadius / 20));
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(brightness * 0.6, brightness * 0.7, brightness),
      transparent: true,
      opacity: 0.3,
    });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
  });
}

// ─── Planets with lighting ────────────────────────────────
function createPlanets() {
  PLANETS.forEach((p, i) => {
    // Planet sphere — lit by sun
    const geo = new THREE.SphereGeometry(p.size, SPHERE_SEG, SPHERE_SEG);
    const mat = new THREE.MeshStandardMaterial({
      color: p.color,
      emissive: p.emissive,
      emissiveIntensity: 0.4,
      roughness: 0.5,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = {
      index: i,
      name: p.name,
      url: p.url,
      baseColor: p.color,
      baseEmissive: p.emissive,
      orbitRadius: p.orbitRadius,
      speed: p.speed,
      size: p.size,
    };

    // Initial position
    const angle = (i / PLANETS.length) * Math.PI * 2;
    mesh.position.x = Math.cos(angle) * p.orbitRadius;
    mesh.position.z = Math.sin(angle) * p.orbitRadius;

    scene.add(mesh);
    planetMeshes.push(mesh);

    // Glow halo around each planet
    const glowGeo = new THREE.SphereGeometry(p.size * 2.2, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: p.color,
      transparent: true,
      opacity: 0.08,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(mesh.position);
    scene.add(glow);
    planetGlows.push(glow);
  });
}

// ─── Lights ───────────────────────────────────────────────
function addLights() {
  // Soft ambient for base visibility
  const ambient = new THREE.AmbientLight(0x1e293b, 0.8);
  scene.add(ambient);

  // Subtle hemisphere light for atmosphere
  const hemi = new THREE.HemisphereLight(0x1e3a5f, 0x0f172a, 0.3);
  scene.add(hemi);
}

// ─── Animation ────────────────────────────────────────────
function animate() {
  animationId = requestAnimationFrame(animate);

  const time = Date.now() * 0.001;

  // Rotate planets
  planetMeshes.forEach((mesh, i) => {
    const { orbitRadius, speed, index } = mesh.userData;
    const baseAngle = (index / PLANETS.length) * Math.PI * 2;
    const angle = baseAngle + time * speed;
    mesh.position.x = Math.cos(angle) * orbitRadius;
    mesh.position.z = Math.sin(angle) * orbitRadius;

    // Sync glow
    if (planetGlows[i]) {
      planetGlows[i].position.copy(mesh.position);
    }
  });

  // Subtle sun pulse
  const pulse = 1 + Math.sin(time * 0.8) * 0.05;
  if (sunGlow) sunGlow.scale.setScalar(pulse);
  if (sunCorona) sunCorona.scale.setScalar(pulse * 1.05);

  // Very slow star rotation
  if (starField) starField.rotation.y = time * 0.003;

  updateHover();
  renderer.render(scene, camera);
}

function placePlanetsStatic() {
  planetMeshes.forEach((mesh, i) => {
    const angle = (i / PLANETS.length) * Math.PI * 2;
    mesh.position.x = Math.cos(angle) * mesh.userData.orbitRadius;
    mesh.position.z = Math.sin(angle) * mesh.userData.orbitRadius;
    if (planetGlows[i]) planetGlows[i].position.copy(mesh.position);
  });
}

// ─── Interaction ──────────────────────────────────────────
function updateHover() {
  raycaster.setFromCamera(mouse, camera);

  // Use a larger hit area: add glows to the intersect test
  const allTargets = [...planetMeshes, ...planetGlows];
  const intersects = raycaster.intersectObjects(allTargets);

  let hitPlanetMesh = null;
  if (intersects.length > 0) {
    const obj = intersects[0].object;
    // If we hit a glow, find its corresponding planet
    const glowIdx = planetGlows.indexOf(obj);
    if (glowIdx !== -1) {
      hitPlanetMesh = planetMeshes[glowIdx];
    } else if (planetMeshes.includes(obj)) {
      hitPlanetMesh = obj;
    }
  }

  if (hitPlanetMesh) {
    if (hoveredPlanet !== hitPlanetMesh) {
      resetHover();
      hoveredPlanet = hitPlanetMesh;

      // Highlight: brighter, larger
      hoveredPlanet.material.emissiveIntensity = 1.2;
      hoveredPlanet.material.emissive.setHex(hoveredPlanet.userData.baseColor);
      hoveredPlanet.scale.setScalar(1.5);

      // Enlarge glow
      const idx = hoveredPlanet.userData.index;
      if (planetGlows[idx]) {
        planetGlows[idx].material.opacity = 0.2;
        planetGlows[idx].scale.setScalar(1.5);
      }

      canvasEl.style.cursor = 'pointer';
      showLabel(hoveredPlanet.userData.name);
    }
    updateLabelPosition(hitPlanetMesh);
  } else {
    if (hoveredPlanet) resetHover();
  }
}

function resetHover() {
  if (!hoveredPlanet) return;
  const idx = hoveredPlanet.userData.index;
  hoveredPlanet.material.emissiveIntensity = 0.4;
  hoveredPlanet.material.emissive.setHex(hoveredPlanet.userData.baseEmissive);
  hoveredPlanet.scale.setScalar(1);
  if (planetGlows[idx]) {
    planetGlows[idx].material.opacity = 0.08;
    planetGlows[idx].scale.setScalar(1);
  }
  hoveredPlanet = null;
  canvasEl.style.cursor = 'default';
  hideLabel();
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
  vector.y += mesh.userData.size + 0.5;
  vector.project(camera);
  const rect = canvasEl.getBoundingClientRect();
  const x = ((vector.x + 1) / 2) * rect.width;
  const y = ((-vector.y + 1) / 2) * rect.height;
  labelEl.style.left = x + 'px';
  labelEl.style.top = (y - 20) + 'px';
  labelEl.style.transform = 'translateX(-50%)';
}

// ─── Events ───────────────────────────────────────────────
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
  const allTargets = [...planetMeshes, ...planetGlows];
  const intersects = raycaster.intersectObjects(allTargets);
  if (intersects.length > 0) {
    const obj = intersects[0].object;
    const glowIdx = planetGlows.indexOf(obj);
    const target = glowIdx !== -1 ? planetMeshes[glowIdx] : obj;
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
