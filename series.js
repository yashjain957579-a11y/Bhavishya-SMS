/* ==========================================================================
   CENTURY IN 75 — landing page engine
   Same stack as the main site: Lenis smooth scroll + GSAP ScrollTrigger +
   canvas frame-sequence scrubbing (frames in assets/series-frames/).
   ========================================================================== */

// ---------------------------------------------------------------------------
// 1. CENTRAL LINKS — edit these, every button on the page reads from here.
// ---------------------------------------------------------------------------
const SERIES_LINKS = {
  free_week1_access: "#free-week-1", // Replace with Google Drive / Portal / WhatsApp Community link
  tier1_self_study: "https://rzp.io/rzp/4HQgx4iq",
  tier2_pro_early_bird: "https://rzp.io/rzp/e4QPB2Cl",
  tier2_pro_regular: "https://rzp.io/rzp/oDHwrrBY",
  tier3_elite: "https://rzp.io/rzp/uGTwcip5"
};

// ---------------------------------------------------------------------------
// 2. SEAT COUNTERS — update by hand as enrollments come in.
//    When early_bird_claimed reaches early_bird_total, the Pro card switches
//    automatically to the Regular ₹799 link.
// ---------------------------------------------------------------------------
const SERIES_CONFIG = {
  early_bird_total: 100,
  early_bird_claimed: 0,
  whatsapp_number: "918889404060"
};

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // -------------------------------------------------------------------------
  // Sticky header height → CSS var (hero fills the rest of the viewport)
  // -------------------------------------------------------------------------
  const topShell = $('#top-shell');
  let topH = 116;
  function measureTop() {
    topH = topShell ? Math.round(topShell.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty('--top-h', topH + 'px');
  }
  measureTop();

  // -------------------------------------------------------------------------
  // Link wiring
  // -------------------------------------------------------------------------
  const clean = (u) => String(u || '').trim().replace(/^\[|\]$/g, '');
  const waFreeWeek = `https://wa.me/${SERIES_CONFIG.whatsapp_number}?text=` +
    encodeURIComponent('Hi Bhavishya SMS, I want FREE Week 1 (Days 1–7) access for the Century in 75 Class 10 series — worksheets, notes and the Week 1 AI test.');

  function setLink(el, url) {
    el.setAttribute('href', url);
    if (/^https?:/i.test(url)) {
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener');
    } else {
      el.removeAttribute('target');
      el.removeAttribute('rel');
    }
  }

  $$('[data-link]').forEach((el) => {
    let url = clean(SERIES_LINKS[el.dataset.link]);
    if (!url) return;
    // A "get the material" button that sits inside the free section itself
    // must not point back at its own section: fall back to WhatsApp.
    if (el.hasAttribute('data-free-cta') && url.startsWith('#')) url = waFreeWeek;
    setLink(el, url);
  });

  // -------------------------------------------------------------------------
  // Early Bird seat meter + automatic switch to Regular price
  // -------------------------------------------------------------------------
  (function seats() {
    const total = Math.max(1, SERIES_CONFIG.early_bird_total);
    const claimed = Math.min(total, Math.max(0, SERIES_CONFIG.early_bird_claimed));
    const left = total - claimed;
    const fill = $('#seat-fill');
    const count = $('#seat-count');
    const track = $('.seat-track');
    if (count) count.textContent = left > 0 ? `${left} of ${total} seats left` : 'All 100 seats claimed';
    if (track) track.setAttribute('aria-valuenow', String(claimed));
    if (fill) {
      const pct = Math.max(claimed > 0 ? 4 : 2, (claimed / total) * 100);
      // animate when the card scrolls into view
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { fill.style.width = pct + '%'; io.disconnect(); }
      }, { threshold: .4 });
      io.observe(fill);
    }

    if (left <= 0) {
      const card = $('.tier-2');
      card && card.classList.add('sold-out');
      const regular = clean(SERIES_LINKS.tier2_pro_regular);
      const primary = $('#pro-primary-cta');
      if (primary) { setLink(primary, regular); primary.textContent = 'Enroll in Pro AI Pass — ₹799 →'; }
      const secondary = $('#pro-regular-cta');
      if (secondary) secondary.remove();
      const price = $('#pro-price');
      if (price) price.textContent = '₹799';
      const note = $('#pro-early-note');
      if (note) note.innerHTML = '<strong>Early Bird seats are full</strong> — Regular price now applies.';
      $$('[data-pro-cta]').forEach((a) => { setLink(a, regular); a.textContent = 'Enroll ₹799'; });
    }
  })();

  // -------------------------------------------------------------------------
  // Lenis smooth scrolling (synced with ScrollTrigger)
  // -------------------------------------------------------------------------
  let lenis = null;
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  if (hasGsap && !reduceMotion && typeof window.Lenis !== 'undefined') {
    try {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.5
      });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } catch (e) {
      console.warn('Lenis failed to start', e);
      lenis = null;
    }
  }

  function scrollToTarget(target) {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    if (el.tagName === 'DETAILS') el.open = true;
    if (lenis) lenis.scrollTo(el, { offset: -topH + 1, duration: 1.2 });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - topH + 1, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href === '#' || href.length < 2) { e.preventDefault(); return; }
    if (href === '#top') { e.preventDefault(); lenis ? lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const el = $(href);
    if (!el) return;
    e.preventDefault();
    if (a.hasAttribute('data-open-terms')) $('#terms').open = true;
    scrollToTarget(el);
  });

  // -------------------------------------------------------------------------
  // Hero canvas — frame sequence
  // -------------------------------------------------------------------------
  const TOTAL_FRAMES = 120;
  const framePath = (i) => `assets/series-frames/f_${String(i + 1).padStart(3, '0')}.webp`;
  const canvas = $('#hero-canvas');
  const ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;
  const frames = new Array(TOTAL_FRAMES);
  let current = 0;

  function sizeCanvas() {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    draw(current);
  }

  function nearestLoaded(i) {
    for (let d = 0; d < TOTAL_FRAMES; d++) {
      if (frames[i - d] && frames[i - d].complete) return frames[i - d];
      if (frames[i + d] && frames[i + d].complete) return frames[i + d];
    }
    return null;
  }

  function draw(i) {
    if (!ctx) return;
    current = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(i)));
    const img = nearestLoaded(current);
    const cw = canvas.width, ch = canvas.height;
    ctx.fillStyle = '#0b0805';
    ctx.fillRect(0, 0, cw, ch);
    if (!img || !img.naturalWidth) return;
    // "cover", enlarged 8% and anchored right/bottom so the educator stays on
    // the right while the source watermark in the corner is cropped away.
    const ratio = img.naturalWidth / img.naturalHeight;
    let w, h;
    if (cw / ch > ratio) { w = cw; h = cw / ratio; } else { h = ch; w = ch * ratio; }
    w *= 1.16; h *= 1.16;
    const x = Math.min(0, cw - w * 0.875);
    const y = Math.min(0, ch - h * 0.89);
    ctx.drawImage(img, x, y, w, h);
  }

  function preload() {
    let next = 0;
    const loadOne = () => {
      if (next >= TOTAL_FRAMES) return;
      const idx = next++;
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        frames[idx] = img;
        if (Math.abs(idx - current) < 3 || idx === 0) draw(current);
        loadOne();
      };
      img.onerror = loadOne;
      img.src = framePath(idx);
    };
    // first frame immediately, then 8 parallel lanes
    for (let k = 0; k < 8; k++) loadOne();
  }

  if (canvas) {
    sizeCanvas();
    preload();
    window.addEventListener('resize', debounce(() => { measureTop(); sizeCanvas(); if (hasGsap) ScrollTrigger.refresh(); }, 150));
  }

  // -------------------------------------------------------------------------
  // Hero scroll choreography
  // -------------------------------------------------------------------------
  const hero = $('#hero');
  if (hasGsap && hero && !reduceMotion) {
    const mm = gsap.matchMedia();

    // DESKTOP (wide + tall enough): pin the hero and scrub frames + 2 stages
    mm.add('(min-width: 1000px) and (min-height: 700px)', () => {
      hero.classList.add('is-pinned');
      measureTop();
      sizeCanvas();
      const fo = { f: 0 };
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '#hero-stage',
          start: () => `top ${topH}px`,
          end: '+=170%',
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });
      tl.to(fo, { f: TOTAL_FRAMES - 1, ease: 'none', duration: 1, onUpdate: () => draw(fo.f) }, 0)
        .to('.scroll-hint', { opacity: 0, duration: 0.05 }, 0.02)
        .to('#stage-1', { opacity: 0, y: -40, filter: 'blur(8px)', pointerEvents: 'none', duration: 0.12, ease: 'power2.in' }, 0.28)
        .fromTo('#stage-2', { opacity: 0, y: 40, filter: 'blur(8px)', pointerEvents: 'none' },
          { opacity: 1, y: 0, filter: 'blur(0px)', pointerEvents: 'auto', duration: 0.12, ease: 'power2.out' }, 0.42)
        .fromTo('#stage-2 .faculty-card', { opacity: 0, x: -24 }, { opacity: 1, x: 0, stagger: 0.03, duration: 0.08, ease: 'power2.out' }, 0.46);

      return () => {
        hero.classList.remove('is-pinned');
        gsap.set(['#stage-1', '#stage-2', '#stage-2 .faculty-card', '.scroll-hint'], { clearProps: 'all' });
      };
    });

    // TABLET / MOBILE / SHORT SCREENS: no pin, scrub frames while the hero scrolls past
    mm.add('not all and (min-width: 1000px) and (min-height: 700px)', () => {
      const fo = { f: 0 };
      gsap.to(fo, {
        f: TOTAL_FRAMES - 1, ease: 'none',
        onUpdate: () => draw(fo.f),
        scrollTrigger: { trigger: hero, start: () => `top ${topH}px`, end: 'bottom top', scrub: 0.4, invalidateOnRefresh: true }
      });
    });

    // Entrance for stage 1
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .from('#stage-1 .pill-badge', { opacity: 0, y: -16, duration: 0.5 })
      .from('#stage-1 .hero-title', { opacity: 0, y: 28, duration: 0.7 }, '-=0.3')
      .from('#stage-1 .hero-sub', { opacity: 0, y: 18, duration: 0.5 }, '-=0.4')
      .from('#stage-1 .free-callout', { opacity: 0, scale: 0.97, duration: 0.5 }, '-=0.3')
      .from('#stage-1 .hero-ctas .btn', { opacity: 0, y: 16, stagger: 0.08, duration: 0.45, clearProps: 'transform' }, '-=0.3')
      .from('#stage-1 .hero-stats li', { opacity: 0, y: 10, stagger: 0.06, duration: 0.35 }, '-=0.2');
  } else {
    draw(0);
  }

  // -------------------------------------------------------------------------
  // Section reveals (post-hero) — same feel as the main site
  // -------------------------------------------------------------------------
  if (hasGsap && !reduceMotion) {
    const reveal = (selector, from) => {
      const els = $$(selector);
      if (!els.length) return;
      gsap.set(els, from);
      ScrollTrigger.batch(els, {
        start: 'top 88%',
        once: true,
        onEnter: (batch) => gsap.to(batch, {
          opacity: 1, x: 0, y: 0, scale: 1, duration: 0.75, stagger: 0.12, ease: 'power3.out',
          clearProps: 'transform'
        })
      });
    };
    reveal('[data-reveal]', { opacity: 0, y: 36 });
    reveal('[data-reveal-item]', { opacity: 0, y: 40, scale: 0.97 });
    reveal('[data-reveal-left]', { opacity: 0, x: -50 });
    reveal('[data-reveal-right]', { opacity: 0, x: 50 });
  }

  // -------------------------------------------------------------------------
  // 3D tilt on pricing cards (pointer devices only)
  // -------------------------------------------------------------------------
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion) {
    $$('.tilt').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -6;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 6;
        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  // -------------------------------------------------------------------------
  // FAQ accordion
  // -------------------------------------------------------------------------
  $$('.faq-q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const open = !item.classList.contains('open');
      $$('.faq-item.open').forEach((o) => { o.classList.remove('open'); $('.faq-q', o).setAttribute('aria-expanded', 'false'); });
      if (open) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
      if (hasGsap) setTimeout(() => ScrollTrigger.refresh(), 380);
    });
  });
  const terms = $('#terms');
  if (terms && hasGsap) terms.addEventListener('toggle', () => ScrollTrigger.refresh());

  // -------------------------------------------------------------------------
  // Comparison table: plan chips + column hover
  // -------------------------------------------------------------------------
  const table = $('#compare-table');
  const wrap = $('.table-wrap');
  $$('.plan-chips .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      $$('.plan-chips .chip').forEach((c) => c.classList.toggle('is-active', c === chip));
      const col = chip.dataset.col;
      table.dataset.active = col;
      const th = $(`thead [data-col="${col}"]`, table);
      const sticky = $('thead th:first-child', table);
      if (wrap && th && wrap.scrollWidth > wrap.clientWidth) {
        wrap.scrollTo({ left: th.offsetLeft - sticky.offsetWidth - 8, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });
  });
  if (table) {
    table.addEventListener('mouseover', (e) => {
      const cell = e.target.closest('[data-col]');
      $$('.col-hover', table).forEach((c) => c.classList.remove('col-hover'));
      if (cell) $$(`[data-col="${cell.dataset.col}"]`, table).forEach((c) => c.classList.add('col-hover'));
    });
    table.addEventListener('mouseleave', () => $$('.col-hover', table).forEach((c) => c.classList.remove('col-hover')));
  }

  // -------------------------------------------------------------------------
  // Header shadow, active nav link, mobile sticky CTA
  // -------------------------------------------------------------------------
  const header = $('#site-header');
  const mobileCta = $('#mobile-cta');
  const pricing = $('#pricing');
  const navLinks = $$('.header-nav a[href^="#"]');  // page sections only (Exit Quiz / Leaderboard are separate pages)
  const sections = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);

  function onScroll() {
    const y = window.scrollY;
    header && header.classList.toggle('scrolled', y > 10);

    if (mobileCta) {
      const pr = pricing ? pricing.getBoundingClientRect() : null;
      const inPricing = pr && pr.top < window.innerHeight * 0.6 && pr.bottom > window.innerHeight * 0.4;
      const show = y > window.innerHeight * 0.9 && !inPricing;
      mobileCta.classList.toggle('show', show);
      mobileCta.setAttribute('aria-hidden', show ? 'false' : 'true');
    }

    let active = null;
    sections.forEach((s) => { if (s.getBoundingClientRect().top - topH < window.innerHeight * 0.35) active = s; });
    navLinks.forEach((a) => a.classList.toggle('active', active && a.getAttribute('href') === '#' + active.id));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();

  // Fonts/images change layout → recompute trigger positions once settled
  window.addEventListener('load', () => { measureTop(); sizeCanvas(); if (hasGsap) ScrollTrigger.refresh(); });

  function debounce(fn, ms) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }
})();
