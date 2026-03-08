/**
 * SolarMetrics — Home Orbit Menu V3 (Three.js)
 * Premium 3D solar system navigation
 *
 * V3 changes (GPT feedback):
 * - Inclined orbit group for ellipse/depth perspective
 * - Camera closer: system fills 70-80% of viewport
 * - Sun glow via additive sprite (no brown sphere halos)
 * - Less saturated colors (SolarMetrics slate/amber palette)
 * - Planets at slight Y offsets to break flat look
 * - MeshStandardMaterial: roughness 0.6-0.8, metalness 0-0.2
 * - Orbit rings more visible (opacity 0.25)
 * - DPR capped at 1.5, prefers-reduced-motion safe
 */

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';

// ─── Config ───────────────────────────────────────────────
const PLANETS = [
  { name: 'Technologies', url: '/fr/technologies.html', color: 0xd4a054, emissive: 0x6b5028, orbitRadius: 2.4, speed: 0.30, size: 0.20, yOff:  0.08 },
  { name: 'Économie',     url: '/fr/economie.html',     color: 0x5eac8c, emissive: 0x2d5644, orbitRadius: 3.2, speed: 0.24, size: 0.18, yOff: -0.06 },
  { name: 'Marchés',      url: '/fr/marches.html',      color: 0x6889c4, emissive: 0x33445f, orbitRadius: 4.0, speed: 0.19, size: 0.19, yOff:  0.10 },
  { name: 'Outils',       url: '/fr/outils.html',       color: 0x4fa8b8, emissive: 0x28545c, orbitRadius: 4.8, speed: 0.15, size: 0.22, yOff: -0.05 },
  { name: 'Analyses',     url: '/fr/analyses/',          color: 0x8978c4, emissive: 0x3d3560, orbitRadius: 5.6, speed: 0.11, size: 0.17, yOff:  0.07 },
  { name: 'Données',      url: '/fr/hypotheses.html',    color: 0xc47490, emissive: 0x5e3848, orbitRadius: 6.4, speed: 0.08, size: 0.15, yOff: -0.09 },
];

const DPR_MAX = 1.5;
const SPHERE_SEG = 28;
const ORBIT_TILT = -0.35;           // Incline the whole orbital plane
const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── State ────────────────────────────────────────────────
let scene, camera, renderer, canvasEl;
let orbitGroup;                      // Tilted group containing orbits + planets + sun
let sun;
let planetMeshes = [], planetGlows = [];
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

    // Camera — closer, fills 70-80 % of hero
    camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );
    camera.position.set(0, 6.5, 11);
    camera.lookAt(0, -0.3, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, DPR_MAX));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x0f172a, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    canvasEl = renderer.domElement;
    canvasEl.style.cursor = 'default';
    container.appendChild(canvasEl);

    // Raycaster
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2(-999, -999);

    // Hover label
    labelEl = document.createElement('div');
    labelEl.id = 'orbit-label';
    labelEl.style.cssText =
      'position:absolute;pointer-events:none;opacity:0;transition:opacity 0.2s;' +
      'background:rgba(15,23,42,0.92);color:#f8fafc;padding:7px 14px;border-radius:8px;' +
      'font-size:13px;font-weight:600;font-family:Inter,sans-serif;letter-spacing:0.02em;' +
      'border:1px solid rgba(245,158,11,0.3);box-shadow:0 6px 20px rgba(0,0,0,0.45);' +
      'white-space:nowrap;z-index:10;backdrop-filter:blur(8px);';
    container.style.position = 'relative';
    container.appendChild(labelEl);

    // ── Orbit group (tilted) ──
    orbitGroup = new THREE.Group();
    orbitGroup.rotation.x = ORBIT_TILT;
    scene.add(orbitGroup);

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
  const count = 500;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 35 + Math.random() * 55;
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xc8d6e5,
    size: 0.12,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true,
  });

  starField = new THREE.Points(geo, mat);
  scene.add(starField);
}

// ─── Sun with additive glow sprite ───────────────────────
function createSun() {
  // Bright core sphere
  const coreGeo = new THREE.SphereGeometry(0.55, 32, 32);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xfcd34d });
  sun = new THREE.Mesh(coreGeo, coreMat);
  orbitGroup.add(sun);

  // ── Additive glow sprite ──
  // Create a radial-gradient canvas texture
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 256;
  glowCanvas.height = 256;
  const ctx = glowCanvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(251, 191, 36, 1)');     // bright amber center
  gradient.addColorStop(0.15, 'rgba(251, 191, 36, 0.7)');
  gradient.addColorStop(0.4, 'rgba(245, 158, 11, 0.25)');
  gradient.addColorStop(0.7, 'rgba(245, 158, 11, 0.05)');
  gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const glowTexture = new THREE.CanvasTexture(glowCanvas);
  const spriteMat = new THREE.SpriteMaterial({
    map: glowTexture,
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glowSprite = new THREE.Sprite(spriteMat);
  glowSprite.scale.set(4.0, 4.0, 1);
  orbitGroup.add(glowSprite);

  // Point light from sun — warm, reaches outer orbits
  const sunLight = new THREE.PointLight(0xfbbf24, 2.5, 20, 1.2);
  sunLight.position.set(0, 0, 0);
  orbitGroup.add(sunLight);
}

// ─── Orbit rings ─────────────────────────────────────────
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
      color: 0x475569,               // slate-600
      transparent: true,
      opacity: 0.25,
    });
    const line = new THREE.Line(geo, mat);
    orbitGroup.add(line);
  });
}

// ─── Planets ─────────────────────────────────────────────
function createPlanets() {
  PLANETS.forEach((p, i) => {
    const geo = new THREE.SphereGeometry(p.size, SPHERE_SEG, SPHERE_SEG);
    const mat = new THREE.MeshStandardMaterial({
      color: p.color,
      emissive: p.emissive,
      emissiveIntensity: 0.35,
      roughness: 0.7,
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
      yOff: p.yOff,
    };

    // Initial position (spread evenly)
    const angle = (i / PLANETS.length) * Math.PI * 2;
    mesh.position.x = Math.cos(angle) * p.orbitRadius;
    mesh.position.y = p.yOff;
    mesh.position.z = Math.sin(angle) * p.orbitRadius;

    orbitGroup.add(mesh);
    planetMeshes.push(mesh);

    // Soft glow sphere (for larger hit area + subtle halo)
    const glowGeo = new THREE.SphereGeometry(p.size * 2.5, 12, 12);
    const glowMat = new THREE.MeshBasicMaterial({
      color: p.color,
      transparent: true,
      opacity: 0.06,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(mesh.position);
    orbitGroup.add(glow);
    planetGlows.push(glow);
  });
}

// ─── Lights ──────────────────────────────────────────────
function addLights() {
  // Gentle ambient so back sides aren't pitch black
  const ambient = new THREE.AmbientLight(0x334155, 0.6);
  scene.add(ambient);

  // Subtle fill from above — cool tone
  const hemi = new THREE.HemisphereLight(0x1e3a5f, 0x0f172a, 0.25);
  scene.add(hemi);
}

// ─── Animation ───────────────────────────────────────────
function animate() {
  animationId = requestAnimationFrame(animate);
  const time = Date.now() * 0.001;

  // Rotate planets along their orbits
  planetMeshes.forEach((mesh, i) => {
    const { orbitRadius, speed, index, yOff } = mesh.userData;
    const baseAngle = (index / PLANETS.length) * Math.PI * 2;
    const angle = baseAngle + time * speed;
    mesh.position.x = Math.cos(angle) * orbitRadius;
    mesh.position.z = Math.sin(angle) * orbitRadius;
    mesh.position.y = yOff;

    // Sync glow position
    if (planetGlows[i]) {
      planetGlows[i].position.copy(mesh.position);
    }
  });

  // Subtle sun brightness pulse
  if (sun) {
    const pulse = 1.0 + Math.sin(time * 0.6) * 0.03;
    sun.scale.setScalar(pulse);
  }

  // Very slow star drift
  if (starField) starField.rotation.y = time * 0.002;

  updateHover();
  renderer.render(scene, camera);
}

function placePlanetsStatic() {
  planetMeshes.forEach((mesh, i) => {
    const angle = (i / PLANETS.length) * Math.PI * 2;
    mesh.position.x = Math.cos(angle) * mesh.userData.orbitRadius;
    mesh.position.z = Math.sin(angle) * mesh.userData.orbitRadius;
    mesh.position.y = mesh.userData.yOff;
    if (planetGlows[i]) planetGlows[i].position.copy(mesh.position);
  });
}

// ─── Interaction ─────────────────────────────────────────
function updateHover() {
  raycaster.setFromCamera(mouse, camera);

  // Test against both planets and their glows (larger hit area)
  const allTargets = [...planetMeshes, ...planetGlows];
  const intersects = raycaster.intersectObjects(allTargets);

  let hitPlanetMesh = null;
  if (intersects.length > 0) {
    const obj = intersects[0].object;
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

      // Highlight: brighter emissive + scale up
      hoveredPlanet.material.emissiveIntensity = 1.0;
      hoveredPlanet.material.emissive.setHex(hoveredPlanet.userData.baseColor);
      hoveredPlanet.scale.setScalar(1.45);

      // Enlarge glow
      const idx = hoveredPlanet.userData.index;
      if (planetGlows[idx]) {
        planetGlows[idx].material.opacity = 0.18;
        planetGlows[idx].scale.setScalar(1.4);
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
  hoveredPlanet.material.emissiveIntensity = 0.35;
  hoveredPlanet.material.emissive.setHex(hoveredPlanet.userData.baseEmissive);
  hoveredPlanet.scale.setScalar(1);
  if (planetGlows[idx]) {
    planetGlows[idx].material.opacity = 0.06;
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
  // Project planet world position (accounting for orbit group tilt)
  const worldPos = new THREE.Vector3();
  mesh.getWorldPosition(worldPos);
  worldPos.y += mesh.userData.size + 0.45;
  worldPos.project(camera);
  const rect = canvasEl.getBoundingClientRect();
  const x = ((worldPos.x + 1) / 2) * rect.width;
  const y = ((-worldPos.y + 1) / 2) * rect.height;
  labelEl.style.left = x + 'px';
  labelEl.style.top = (y - 18) + 'px';
  labelEl.style.transform = 'translateX(-50%)';
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
