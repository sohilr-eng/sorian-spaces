/* =============================================
   SORIAN SPACES — three-scene.js
   Rotating material panels showcase
   ============================================= */

(function () {
  const canvas = document.getElementById('threeCanvas');
  const wrap = document.getElementById('showcaseWrap');
  const fallback = document.getElementById('showcaseFallback');
  if (!canvas || !wrap) return;

  // ── WebGL Support Check ───────────────────────────
  try {
    const test = document.createElement('canvas');
    const gl = test.getContext('webgl') || test.getContext('experimental-webgl');
    if (!gl) throw new Error('No WebGL');
  } catch (e) {
    if (fallback) fallback.style.display = 'flex';
    canvas.style.display = 'none';
    return;
  }

  // ── Renderer ──────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(wrap.offsetWidth, wrap.offsetHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // ── Scene & Camera ────────────────────────────────
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    48,
    wrap.offsetWidth / wrap.offsetHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 6.5);

  // ── Lighting ──────────────────────────────────────
  // Dim ambient
  scene.add(new THREE.AmbientLight(0xffffff, 0.15));

  // Key light — warm accent
  const keyLight = new THREE.PointLight(0xC9824E, 6, 12);
  keyLight.position.set(3, 3, 4);
  keyLight.castShadow = true;
  scene.add(keyLight);

  // Fill light — cool
  const fillLight = new THREE.PointLight(0xE8D8C8, 2, 10);
  fillLight.position.set(-4, -2, 3);
  scene.add(fillLight);

  // Rim light — subtle accent from behind
  const rimLight = new THREE.PointLight(0xC9824E, 1.5, 8);
  rimLight.position.set(0, -3, -2);
  scene.add(rimLight);

  // ── Panel Materials ───────────────────────────────
  const panelData = [
    {
      label: 'UV Gloss Board',
      color: 0xD4A574,
      roughness: 0.08,
      metalness: 0.55,
      x: -2.0,
      y: 0.3,
      rotY: 0.28,
      floatOffset: 0,
    },
    {
      label: 'Engineered Timber',
      color: 0x2E1F14,
      roughness: 0.88,
      metalness: 0.02,
      x: 0,
      y: 0,
      rotY: 0,
      floatOffset: 1.5,
    },
    {
      label: 'Stone Effect',
      color: 0xC2BDB6,
      roughness: 0.55,
      metalness: 0.12,
      x: 2.0,
      y: -0.3,
      rotY: -0.28,
      floatOffset: 3.0,
    },
  ];

  // ── Build Panels ──────────────────────────────────
  const group = new THREE.Group();
  const panelMeshes = [];

  panelData.forEach(data => {
    // Panel surface
    const geo = new THREE.BoxGeometry(1.5, 2.2, 0.045, 1, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: data.color,
      roughness: data.roughness,
      metalness: data.metalness,
      side: THREE.FrontSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(data.x, data.y, 0);
    mesh.rotation.y = data.rotY;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { floatOffset: data.floatOffset, baseY: data.y };

    // Accent edge glow (thin plane slightly in front)
    const edgeGeo = new THREE.PlaneGeometry(1.54, 2.24);
    const edgeMat = new THREE.MeshBasicMaterial({
      color: 0xC9824E,
      transparent: true,
      opacity: 0.07,
      side: THREE.DoubleSide,
    });
    const edgePlane = new THREE.Mesh(edgeGeo, edgeMat);
    edgePlane.position.z = 0.025;
    mesh.add(edgePlane);

    // Wire edges
    const edgesGeo = new THREE.EdgesGeometry(geo);
    const linesMat = new THREE.LineBasicMaterial({
      color: 0xC9824E,
      transparent: true,
      opacity: 0.25,
    });
    mesh.add(new THREE.LineSegments(edgesGeo, linesMat));

    group.add(mesh);
    panelMeshes.push(mesh);
  });

  scene.add(group);

  // ── Mouse Tracking ────────────────────────────────
  let mouseX = 0;
  let mouseY = 0;
  let targetRotX = 0;
  let targetRotY = 0;

  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ── Animation Loop ────────────────────────────────
  let animating = false;
  let rafId = null;
  const clock = new THREE.Clock();

  function animate() {
    rafId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Smooth mouse follow
    targetRotY += (mouseX * 0.25 - targetRotY) * 0.04;
    targetRotX += (-mouseY * 0.15 - targetRotX) * 0.04;

    // Slow auto-rotation + mouse parallax
    group.rotation.y = targetRotY + t * 0.18;
    group.rotation.x = targetRotX;

    // Individual panel float
    panelMeshes.forEach(mesh => {
      const off = mesh.userData.floatOffset;
      mesh.position.y = mesh.userData.baseY + Math.sin(t * 0.7 + off) * 0.07;
    });

    // Keylight gentle orbit
    keyLight.position.x = 3 + Math.sin(t * 0.4) * 1.5;
    keyLight.position.y = 3 + Math.cos(t * 0.3) * 1.0;

    renderer.render(scene, camera);
  }

  // ── IntersectionObserver (pause off-screen) ───────
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animating) {
        animating = true;
        clock.start();
        animate();
      } else if (!entry.isIntersecting && animating) {
        animating = false;
        cancelAnimationFrame(rafId);
      }
    });
  }, { threshold: 0.1 });

  observer.observe(wrap);

  // ── Resize ────────────────────────────────────────
  window.addEventListener('resize', () => {
    const w = wrap.offsetWidth;
    const h = wrap.offsetHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }, { passive: true });

  // ── Cleanup on page hide ──────────────────────────
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && animating) {
      animating = false;
      cancelAnimationFrame(rafId);
    }
  });
})();
