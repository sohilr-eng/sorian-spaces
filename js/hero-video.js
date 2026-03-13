/* =============================================
   SORIAN SPACES — hero-video.js
   Frame-based scroll animation engine
   ============================================= */

(function () {
  const heroSection = document.getElementById('hero');
  const canvas = document.getElementById('heroCanvas');
  if (!heroSection || !canvas) return;

  const ctx = canvas.getContext('2d');
  const TOTAL_FRAMES = 141;
  const FRAME_DIR = 'assets/frames/';

  const loader = document.getElementById('loader');
  const loaderFill = document.getElementById('loaderFill');
  const loaderPercent = document.getElementById('loaderPercent');
  const scrollHint = document.getElementById('scrollHint');
  const cards = Array.from(document.querySelectorAll('.annotation-card'));

  // ── Canvas Sizing ──────────────────────────────────
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    if (currentFrameIndex >= 0 && allLoaded) {
      drawFrame(currentFrameIndex);
    }
  }
  window.addEventListener('resize', resizeCanvas, { passive: true });
  resizeCanvas();

  // ── Frame Loading ──────────────────────────────────
  const images = new Array(TOTAL_FRAMES).fill(null);
  let loadedCount = 0;
  let allLoaded = false;
  let currentFrameIndex = 0;
  let rafPending = false;
  let loadTimeoutId = null;

  // Lock scroll while loading
  document.body.style.overflow = 'hidden';

  function updateLoader(progress) {
    const pct = Math.round(progress * 100);
    if (loaderFill) loaderFill.style.width = pct + '%';
    if (loaderPercent) loaderPercent.textContent = pct + '%';
  }

  function onAllLoaded() {
    if (allLoaded) return;
    if (loadTimeoutId) { clearTimeout(loadTimeoutId); loadTimeoutId = null; }
    allLoaded = true;
    drawFrame(0);

    if (loader) {
      loader.style.transition = 'opacity 0.9s ease';
      loader.style.opacity = '0';
      setTimeout(() => {
        loader.style.display = 'none';
        document.body.style.overflow = '';
        updateCards(0);
      }, 900);
    } else {
      document.body.style.overflow = '';
      updateCards(0);
    }
  }

  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    const idx = i - 1;
    img.onload = img.onerror = () => {
      loadedCount++;
      updateLoader(loadedCount / TOTAL_FRAMES);
      if (loadedCount === TOTAL_FRAMES) onAllLoaded();
    };
    img.src = FRAME_DIR + 'frame_' + String(i).padStart(4, '0') + '.jpg';
    images[idx] = img;
  }

  // Fallback: dismiss loader after 15 s regardless of image load state.
  // This prevents the site from hanging if frames are slow or unavailable.
  loadTimeoutId = setTimeout(() => { onAllLoaded(); }, 15000);

  // ── Draw a Frame (cover-fit) ───────────────────────
  function drawFrame(index) {
    const img = images[index];
    if (!img || !img.complete || !img.naturalWidth) return;

    const dpr = window.devicePixelRatio || 1;
    const lw = window.innerWidth;
    const lh = window.innerHeight;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // Cover-fit: scale so image fills canvas edge-to-edge
    const scale = Math.max(lw / iw, lh / ih);
    const sw = iw * scale;
    const sh = ih * scale;
    const sx = (lw - sw) / 2;
    const sy = (lh - sh) / 2;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, lw, lh);
    ctx.drawImage(img, sx, sy, sw, sh);
    ctx.restore();

    rafPending = false;
  }

  // ── Annotation Card Visibility ─────────────────────
  function updateCards(progress) {
    cards.forEach(card => {
      const show = parseFloat(card.dataset.show);
      const hide = parseFloat(card.dataset.hide);
      const visible = progress >= show && progress < hide;
      card.classList.toggle('visible', visible);
    });

    if (scrollHint) {
      scrollHint.style.opacity = progress > 0.04 ? '0' : '1';
    }
  }

  // ── Snap-Stop Mechanic ────────────────────────────
  const SNAP_POINTS = [0.20, 0.45, 0.70, 0.90];
  const SNAP_ZONE = 0.026;
  const HOLD_DURATION = 680;

  let scrollLocked = false;
  const snappedSet = new Set();

  window.addEventListener('wheel', e => {
    if (scrollLocked) e.preventDefault();
  }, { passive: false });

  window.addEventListener('touchmove', e => {
    if (scrollLocked) e.preventDefault();
  }, { passive: false });

  function lockScroll(ms) {
    scrollLocked = true;
    setTimeout(() => { scrollLocked = false; }, ms);
  }

  // ── Main Scroll Handler ───────────────────────────
  function onScroll() {
    if (!allLoaded || scrollLocked) return;

    const rect = heroSection.getBoundingClientRect();
    const scrollableHeight = heroSection.offsetHeight - window.innerHeight;
    if (scrollableHeight <= 0) return;

    const progress = Math.min(1, Math.max(0, -rect.top / scrollableHeight));

    // Check snap points
    for (const sp of SNAP_POINTS) {
      const dist = Math.abs(progress - sp);

      // Reset snapped state when we've moved well past the point
      if (snappedSet.has(sp) && dist > SNAP_ZONE * 3.5) {
        snappedSet.delete(sp);
      }

      // Trigger snap
      if (!snappedSet.has(sp) && dist < SNAP_ZONE) {
        snappedSet.add(sp);
        const targetY = heroSection.offsetTop + sp * scrollableHeight;
        window.scrollTo({ top: targetY, behavior: 'instant' });
        lockScroll(HOLD_DURATION);

        const frameIndex = Math.round(sp * (TOTAL_FRAMES - 1));
        if (frameIndex !== currentFrameIndex) {
          currentFrameIndex = frameIndex;
          if (!rafPending) {
            rafPending = true;
            requestAnimationFrame(() => drawFrame(currentFrameIndex));
          }
        }
        updateCards(sp);
        return;
      }
    }

    // Normal scroll — update frame
    const frameIndex = Math.round(progress * (TOTAL_FRAMES - 1));
    if (frameIndex !== currentFrameIndex) {
      currentFrameIndex = frameIndex;
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => drawFrame(currentFrameIndex));
      }
    }

    updateCards(progress);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
})();
