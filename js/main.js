/* =============================================
   SORIAN SPACES — main.js
   GSAP animations, navbar, starscape, utilities
   ============================================= */

// ── GSAP Plugin Registration ──────────────────
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
}

// ── Starscape ─────────────────────────────────
(function () {
  const canvas = document.getElementById('starscape');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const STAR_COUNT = 180;
  let stars = [];

  function initStars() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 1.4 + 0.4,
        driftX: (Math.random() - 0.5) * 0.12,
        driftY: (Math.random() - 0.5) * 0.12,
        twinkleFreq: Math.random() * 0.025 + 0.006,
        twinklePhase: Math.random() * Math.PI * 2,
        baseOpacity: Math.random() * 0.45 + 0.15,
      });
    }
  }

  function drawStars() {
    requestAnimationFrame(drawStars);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const now = Date.now() * 0.001;

    stars.forEach(s => {
      s.x = (s.x + s.driftX + canvas.width) % canvas.width;
      s.y = (s.y + s.driftY + canvas.height) % canvas.height;
      const opacity = s.baseOpacity + Math.sin(now * s.twinkleFreq * 60 + s.twinklePhase) * 0.28;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245,240,235,${Math.max(0, Math.min(1, opacity))})`;
      ctx.fill();
    });
  }

  initStars();
  drawStars();
  window.addEventListener('resize', initStars, { passive: true });
})();

// ── Scroll Progress Bar ───────────────────────
(function () {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    bar.style.width = (Math.min(pct, 1) * 100) + '%';
  }, { passive: true });
})();

// ── Navbar ────────────────────────────────────
(function () {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!navbar) return;

  let menuOpen = false;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      menuOpen = !menuOpen;
      hamburger.classList.toggle('open', menuOpen);
      mobileMenu.classList.toggle('open', menuOpen);
      document.body.style.overflow = menuOpen ? 'hidden' : '';
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menuOpen = false;
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }
})();

// ── GSAP Section Entrances ────────────────────
(function () {
  if (!window.gsap || !window.ScrollTrigger) return;

  // Generic fade-up for data-animate elements
  document.querySelectorAll('[data-animate]').forEach(el => {
    const delay = parseFloat(el.dataset.delay || 0) / 1000;
    gsap.fromTo(el,
      { opacity: 0, y: 38 },
      {
        opacity: 1, y: 0,
        duration: 1.0,
        delay,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 86%', once: true },
      }
    );
  });

  // Service cards staggered
  gsap.fromTo('.service-card',
    { opacity: 0, y: 50 },
    {
      opacity: 1, y: 0,
      duration: 0.85,
      stagger: 0.09,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.services-grid', start: 'top 80%', once: true },
    }
  );

  // Portfolio items staggered
  gsap.fromTo('.portfolio-item',
    { opacity: 0, y: 60 },
    {
      opacity: 1, y: 0,
      duration: 0.9,
      stagger: 0.14,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.portfolio-grid', start: 'top 78%', once: true },
    }
  );

  // Testimonial cards from the right
  gsap.fromTo('.testimonial-card',
    { opacity: 0, x: 50 },
    {
      opacity: 1, x: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '#testimonials', start: 'top 80%', once: true },
    }
  );

  // CTA content scale-up
  gsap.fromTo('.cta-content',
    { opacity: 0, scale: 0.96 },
    {
      opacity: 1, scale: 1,
      duration: 1.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.section-cta', start: 'top 75%', once: true },
    }
  );
})();

// ── Count-Up Stats ────────────────────────────
(function () {
  const statEls = document.querySelectorAll('.stat-number');
  if (!statEls.length) return;

  const easeOutExpo = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);

  function countUp(el, index) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1900;
    const start = performance.now();

    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(easeOutExpo(p) * target);
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target;
        el.style.textShadow = '0 0 24px rgba(201,130,78,0.65)';
        setTimeout(() => { el.style.textShadow = ''; }, 900);
      }
    }
    requestAnimationFrame(tick);
  }

  const strip = document.querySelector('.stats-strip');
  if (!strip) return;

  let triggered = false;
  const io = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !triggered) {
      triggered = true;
      statEls.forEach((el, i) => setTimeout(() => countUp(el, i), i * 210));
      io.disconnect();
    }
  }, { threshold: 0.5 });
  io.observe(strip);
})();

// ── Before / After Sliders ────────────────────
(function () {
  document.querySelectorAll('.ba-container').forEach(container => {
    const sliderEl = container.querySelector('.ba-slider');
    const beforeEl = container.querySelector('.ba-before');
    if (!sliderEl || !beforeEl) return;

    let dragging = false;

    // Init at 50%
    sliderEl.style.left = '50%';
    beforeEl.style.width = '50%';

    function setPos(clientX) {
      const rect = container.getBoundingClientRect();
      const pct = Math.min(Math.max((clientX - rect.left) / rect.width, 0.04), 0.96);
      sliderEl.style.left = (pct * 100) + '%';
      beforeEl.style.width = (pct * 100) + '%';
    }

    sliderEl.addEventListener('mousedown', e => { dragging = true; e.preventDefault(); });
    window.addEventListener('mousemove', e => { if (dragging) setPos(e.clientX); });
    window.addEventListener('mouseup', () => { dragging = false; });

    sliderEl.addEventListener('touchstart', () => { dragging = true; }, { passive: true });
    window.addEventListener('touchmove', e => { if (dragging) setPos(e.touches[0].clientX); }, { passive: true });
    window.addEventListener('touchend', () => { dragging = false; });
  });
})();

// ── Testimonials Drag-Scroll ──────────────────
(function () {
  const track = document.getElementById('testimonialsTrack');
  if (!track) return;

  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;

  track.addEventListener('mousedown', e => {
    isDown = true;
    track.style.cursor = 'grabbing';
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
  });
  window.addEventListener('mouseup', () => {
    isDown = false;
    track.style.cursor = 'grab';
  });
  track.addEventListener('mouseleave', () => {
    isDown = false;
    track.style.cursor = 'grab';
  });
  track.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    track.scrollLeft = scrollLeft - (x - startX) * 1.6;
  });
})();

// ── Smooth Scroll ─────────────────────────────
(function () {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();

      // If navigating away from the hero scroll zone,
      // we need to jump past it first
      const hero = document.getElementById('hero');
      if (hero && target !== hero) {
        const heroEnd = hero.offsetTop + hero.offsetHeight;
        if (window.scrollY < heroEnd - window.innerHeight) {
          // Jump past hero then scroll to target
          window.scrollTo({ top: heroEnd, behavior: 'instant' });
          requestAnimationFrame(() => {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
          return;
        }
      }
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();

// ── Contact Form ──────────────────────────────
(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    btn.textContent = 'Message Sent ✓';
    btn.style.background = '#4A8C5C';
    btn.style.boxShadow = '0 0 28px rgba(74,140,92,0.4)';
    btn.disabled = true;

    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
      btn.style.boxShadow = '';
      btn.disabled = false;
      form.reset();
    }, 3500);
  });
})();
